import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Config } from '../schemas/index.js';
import { type CommitState, commitMessage, type Progress, type Story, type Task } from '../spec/index.js';
import { writeProgress } from './checkpoint.js';
import { onlyDoneBoxes, scriptLedgerPath } from './commit-spec-files.js';
import { outOfScopeMessage, reconcileMessage, strayByTask } from './review-scope.js';
import type { SpecFolder } from './spec.js';

const git = (cwd: string, args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });

const FIELD = '\x1f';
const RECORD = '\x1e';

export interface ChangeManifestEntry {
  path: string;
  status: string;
  sha256: string;
}

/** Hashes every changed path and records its porcelain status; deleted files use a stable sentinel hash. */
export function changeManifest(repo: string, exclude?: string, omit: string[] = []): ChangeManifestEntry[] {
  const status = git(repo, ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  const skip = exclude ? relative(repo, exclude).replace(/\\/g, '/') : '';
  const omitted = new Set(omit);
  const entries = status.split('\0');
  const out: ChangeManifestEntry[] = [];
  for (let i = 0; i < entries.length; i++) {
    const record = entries[i]!;
    if (!record) continue;
    const state = record.slice(0, 2);
    const path = record.slice(3);
    if (state[0] === 'R' || state[0] === 'C') i++;
    if (omitted.has(path) || (skip && (path === skip || path.startsWith(`${skip}/`)))) continue;
    const full = join(repo, path);
    const sha256 = existsSync(full)
      ? createHash('sha256').update(readFileSync(full)).digest('hex')
      : createHash('sha256').update('mandao:deleted').digest('hex');
    out.push({ path, status: state, sha256 });
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

/** A stable representation included in the exact material presented to the Reviewer. */
export function renderChangeManifest(manifest: ChangeManifestEntry[]): string {
  return JSON.stringify(manifest, null, 2);
}

/**
 * Commits on the current branch that carry `Refs: <spec id>`, keyed by their `Mandao-Task` trailer. Trailers
 * survive rebases and cherry-picks, so this is the only link between a task and its commit (ADR 0021).
 */
export function taskCommits(repo: string, specId: string, trailers: Config['commits']['trailers']): Map<string, string[]> {
  return specTaskLog(repo, specId, trailers, '%h');
}

/**
 * The author times (ms) of each task's commits for the spec, keyed like `taskCommits`. The author time
 * survives rebases, so it stays the moment the task was committed in its session (MDO-0008 D2).
 */
export function taskCommitTimes(repo: string, specId: string, trailers: Config['commits']['trailers']): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const [task, times] of specTaskLog(repo, specId, trailers, '%at')) {
    const ms = times.map((t) => Number(t) * 1000).filter((t) => Number.isFinite(t) && t > 0);
    if (ms.length) out.set(task, ms);
  }
  return out;
}

/** One `git log` field (`placeholder`) of every commit with `Refs: <specId>`, keyed by its task trailer. */
function specTaskLog(repo: string, specId: string, trailers: Config['commits']['trailers'], placeholder: string): Map<string, string[]> {
  const format = [
    placeholder,
    `%(trailers:key=${trailers.refs},valueonly,separator=%x2C)`,
    `%(trailers:key=${trailers.task},valueonly,separator=%x2C)`,
  ];
  const out = new Map<string, string[]>();
  let log: string;
  try {
    log = git(repo, ['log', `--format=${format.join(FIELD)}${RECORD}`]);
  } catch {
    return out; // not a repository, or no commits yet
  }
  for (const record of log.split(RECORD)) {
    const [sha, refs = '', tasks = ''] = record.trim().split(FIELD);
    if (
      !sha ||
      !refs
        .split(',')
        .map((r) => r.trim())
        .includes(specId)
    )
      continue;
    for (const t of tasks
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean))
      out.set(t, [...(out.get(t) ?? []), sha]);
  }
  return out;
}

/** Paths with uncommitted changes, relative to `repo`, except those under `exclude`. */
export function changedFiles(repo: string, exclude?: string): string[] {
  const status = git(repo, ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  const skip = exclude ? relative(repo, exclude).replace(/\\/g, '/') : '';
  const paths: string[] = [];
  const entries = status.split('\0');
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    if (!e) continue;
    paths.push(e.slice(3));
    if (e[0] === 'R' || e[0] === 'C') i++; // the next entry is the rename source
  }
  return paths.filter((p) => !(skip && (p === skip || p.startsWith(`${skip}/`))));
}

export interface CommitRun {
  committed: { task: string; sha: string }[];
  pending: string[];
  /** Pending tasks dropped because a commit with their trailers is already on the branch (committed by hand). */
  alreadyCommitted?: string[];
  /** Files per task that would enter its commit without being declared or reviewed as a diff. */
  outOfScope?: Record<string, string[]>;
  error?: string;
}

interface PendingInput {
  repo: string;
  specDir: string;
  config: Config;
  story: Story;
  tasks: Task[];
  progress: Progress;
  /** Extra trailers, e.g. the harness's `Co-Authored-By`. */
  trailers?: string[];
  /** `branching.protected`: Mandao never commits there (ADR 0023). */
  protectedBranches?: string[];
  /** The workspace root, where `.mandao/` lives; defaults to `repo` (they differ for a project inside a bigger repo). */
  home?: string;
}

/** A later pending task touching the same file would end up in the earlier commit. */
function overlap(entries: Progress['pending_commits']): string | undefined {
  const seen = new Map<string, string>();
  for (const e of entries)
    for (const f of e.files) {
      const owner = seen.get(f);
      if (owner)
        return `${f} is changed by both ${owner} and ${e.task}: commit each by hand (\`mandao run commit-msg <spec> <task> <subject>\` gives the message), then run \`mandao run commit <spec>\` again to record them`;
      seen.set(f, e.task);
    }
  return undefined;
}

/** The stop for files that would enter a commit unreviewed and undeclared; undefined when there are none. */
function outOfScopeStop(input: PendingInput, entries: Progress['pending_commits'], run: CommitRun): CommitRun | undefined {
  const stray = strayByTask(entries, input.tasks, input.progress.approved_manifests, input.repo, input.home ?? input.repo);
  // A reconcile-stuck entry already in run.outOfScope stays listed next to the queue's stray files.
  return Object.keys(stray).length ? { ...run, outOfScope: { ...run.outOfScope, ...stray }, error: outOfScopeMessage(stray) } : undefined;
}

/**
 * Splits the pending entries: `already` were committed by hand and their content is in scope (dropped), `stuck`
 * were committed by hand with out-of-scope files (kept pending, reported, never block the others), `queue` is the rest.
 */
function reconcileSplit(input: PendingInput, all: Progress['pending_commits'], done: Set<string>) {
  const stuck = strayByTask(
    all.filter((e) => done.has(e.task)),
    input.tasks,
    input.progress.approved_manifests,
    input.repo,
    input.home ?? input.repo,
  );
  const already = all.filter((e) => done.has(e.task) && !stuck[e.task]);
  const queue = all.filter((e) => !done.has(e.task));
  return { queue, already, stuck: Object.keys(stuck).length ? stuck : undefined };
}

/** A run that left a hand-committed, out-of-scope entry pending says so as its error (the others already ran). */
function withStuck(run: CommitRun): CommitRun {
  return run.outOfScope && !run.error ? { ...run, error: reconcileMessage(run.outOfScope, run.committed.length > 0) } : run;
}

/** Everything refused before the first commit: out-of-scope files first, so no other message hides them. */
function preflight(
  input: PendingInput,
  queue: Progress['pending_commits'],
  run: CommitRun,
): { stop: CommitRun } | { specChanges: string[] } {
  const brake = outOfScopeStop(input, queue, run);
  if (brake) return { stop: brake };
  const clash = overlap(queue);
  if (clash) return { stop: { ...run, error: clash } };
  const manifest = validatePendingManifest(input, queue);
  return manifest.error ? { stop: { ...run, error: manifest.error } } : { specChanges: manifest.specChanges };
}

/**
 * Commits every pending task, one commit each with its trailers, in order. The entry leaves progress.yml
 * in the same commit, along with the spec folder's bookkeeping; a failed commit puts the entry back.
 * Local only: never pushes.
 */
export function commitPending(input: PendingInput): CommitRun {
  const all = input.progress.pending_commits;
  const branch = git(input.repo, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
  if (all.length && input.protectedBranches?.includes(branch)) {
    return {
      committed: [],
      pending: all.map((e) => e.task),
      error: `${branch} is a protected branch: Mandao never commits there. Commit from the spec's branch and worktree`,
    };
  }
  const done = reconciledTasks(input.repo, input.story.meta.id, input.config.commits.trailers, all);
  const { queue, already, stuck } = reconcileSplit(input, all, done);
  const run: CommitRun = { committed: [], pending: all.filter((e) => !already.includes(e)).map((e) => e.task) };
  if (stuck) run.outOfScope = stuck;
  if (already.length) {
    run.alreadyCommitted = already.map((e) => e.task);
    input.progress = { ...input.progress, pending_commits: all.filter((e) => !already.includes(e)) };
    writeProgress(input.specDir, input.progress);
  }
  if (!queue.length) return withStuck(run);
  const checked = preflight(input, queue, run);
  if ('stop' in checked) return checked.stop;
  const specChanges = checked.specChanges;
  let progress = input.progress;
  for (const entry of queue) {
    const task = input.tasks.find((t) => t.id === entry.task);
    if (!task) return { ...run, error: `${entry.task} is not in tasks.md` };
    const msg = commitMessage(input.config, input.story, task, entry.subject, false, entry.files);
    if (msg.issues.length) return { ...run, error: `${entry.task}: ${msg.issues.join('; ')}` };
    const next = { ...progress, pending_commits: progress.pending_commits.filter((e) => e !== entry) };
    writeProgress(input.specDir, next);
    try {
      git(input.repo, ['add', '--', ...entry.files, ...specChanges]);
      git(input.repo, ['commit', '-q', '-m', [msg.text.trimEnd(), ...(input.trailers ?? [])].join('\n')]);
    } catch (e) {
      writeProgress(input.specDir, progress);
      const reason = String((e as { stderr?: string }).stderr || (e as Error).message).trim();
      return { ...run, error: `${entry.task}: git commit failed: ${reason}` };
    }
    progress = next;
    run.committed.push({ task: entry.task, sha: git(input.repo, ['rev-parse', '--short', 'HEAD']).trim() });
    run.pending = run.pending.filter((t) => t !== entry.task);
  }
  return withStuck(run);
}

const sha = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');

/** Whether `path` at HEAD matches the manifest hash (deleted paths: absent at HEAD). */
function atHead(repo: string, item: ChangeManifestEntry): boolean {
  try {
    const content = execFileSync('git', ['show', `HEAD:${item.path}`], {
      cwd: repo,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return sha(content) === item.sha256;
  } catch {
    return item.sha256 === sha('mandao:deleted');
  }
}

/**
 * Pending tasks whose queued change is provably in git already: a commit carries the task's trailers, and
 * every path of the entry's approved manifest is clean in the working tree with the approved content at HEAD.
 * Entries without a manifest are never reconciled.
 */
export function reconciledTasks(
  repo: string,
  specId: string,
  trailers: Config['commits']['trailers'],
  entries: Progress['pending_commits'],
): Set<string> {
  const out = new Set<string>();
  if (!entries.length) return out;
  const commits = taskCommits(repo, specId, trailers);
  const dirty = new Set(changeManifest(repo).map((m) => m.path));
  for (const e of entries) {
    if (!commits.has(e.task) || !e.manifest?.length) continue;
    if (e.manifest.every((item) => !dirty.has(item.path) && atHead(repo, item))) out.add(e.task);
  }
  return out;
}

function validatePendingManifest(input: PendingInput, queue: Progress['pending_commits']): { error?: string; specChanges: string[] } {
  if (queue.some((entry) => !entry.manifest?.length))
    return {
      error: 'a pending task has no Reviewer-approved change manifest; review the exact changes again before committing',
      specChanges: [],
    };
  for (const entry of queue) {
    const paths = [...(entry.manifest ?? [])].map((item) => item.path).sort();
    if (JSON.stringify([...entry.files].sort()) !== JSON.stringify(paths))
      return { error: `${entry.task} pending paths differ from its approved manifest`, specChanges: [] };
  }
  const approved = queue.flatMap((entry) => entry.manifest ?? []).sort((a, b) => a.path.localeCompare(b.path));
  const approvedPaths = new Set<string>();
  for (const item of approved) {
    if (approvedPaths.has(item.path)) return { error: `${item.path} appears in more than one approved manifest`, specChanges: [] };
    approvedPaths.add(item.path);
  }
  const specPrefix = `${relative(input.repo, input.specDir).replace(/\\/g, '/')}/`;
  const allCurrent = changeManifest(input.repo);
  const specChanges = allCurrent.filter((item) => item.path.startsWith(specPrefix));
  const queued = queue.map((entry) => entry.task);
  const unapprovedSpec = specChanges
    .map((item) => item.path.slice(specPrefix.length))
    .filter((path) => !scriptLedgerPath(path) && !onlyDoneBoxes(input.repo, `${specPrefix}${path}`, queued));
  if (unapprovedSpec.length)
    return { error: `unreviewed spec files would enter the task commit: ${unapprovedSpec.join(', ')}`, specChanges: [] };
  const current = allCurrent.filter((item) => !item.path.startsWith(specPrefix));
  if (JSON.stringify(current) !== JSON.stringify(approved)) {
    const expected = new Map(approved.map((item) => [item.path, item]));
    const actual = new Map(current.map((item) => [item.path, item]));
    const changed = [...new Set([...expected.keys(), ...actual.keys()])]
      .filter((path) => JSON.stringify(expected.get(path)) !== JSON.stringify(actual.get(path)))
      .sort();
    return {
      error: `working tree differs from the Reviewer-approved manifest: ${changed.join(', ') || 'manifest mismatch'}; review again before committing`,
      specChanges: [],
    };
  }
  return { specChanges: specChanges.map((item) => item.path) };
}

/** Passed, committed and pending tasks of a spec, resolved from the log, git trailers and progress.yml. */
export function commitState(spec: SpecFolder, trailers: Config['commits']['trailers']): CommitState {
  const last = new Map<string, string>();
  for (const r of spec.execution) last.set(r.task, r.verdict);
  const id = spec.story?.meta.id ?? spec.name;
  return {
    passed: [...last].filter(([, v]) => v === 'PASS' || v === 'DEFERRED_TO_CI').map(([t]) => t),
    committed: new Set(taskCommits(spec.dir, id, trailers).keys()),
    pending: spec.progress?.pending_commits.map((p) => p.task) ?? [],
  };
}

/** The repository holding `dir` (a spec folder or a project). */
export const repoRoot = (dir: string) => git(dir, ['rev-parse', '--show-toplevel']).trim();

export interface SpecCommit {
  committed: boolean;
  sha?: string;
  reason?: string;
  /** Uncommitted files this commit did not take, so a close can name what it left out. */
  leftOut?: string[];
}

/**
 * Commits only the spec folder (`[<emoji> ]docs(<scope>): <subject>` with `Refs: <id>`; no emoji when `commits.emoji` is false): specify on approval,
 * clarify after recording answers. `extraPaths` adds the close documents (release, Kaizen, constitution,
 * module guides); nothing else is ever staged. Local only, never on a protected branch.
 */
export function commitSpecDocs(input: {
  repo: string;
  specDir: string;
  header: string;
  specId: string;
  config: Config;
  trailers?: string[];
  protectedBranches?: string[];
  extraPaths?: string[];
}): SpecCommit {
  const branch = git(input.repo, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
  if (input.protectedBranches?.includes(branch))
    return { committed: false, reason: `${branch} is a protected branch: commit from the spec's worktree` };
  const folder = relative(input.repo, input.specDir) || '.';
  const paths = [folder, ...(input.extraPaths ?? []).filter((p) => existsSync(join(input.repo, p)))];
  git(input.repo, ['add', '--', ...paths]);
  if (!git(input.repo, ['diff', '--cached', '--name-only', '--', ...paths]).trim())
    return { committed: false, reason: 'nothing to commit in the spec folder' };
  const message = [input.header, '', `${input.config.commits.trailers.refs}: ${input.specId}`, ...(input.trailers ?? [])].join('\n');
  try {
    git(input.repo, ['commit', '-q', '-m', message, '--', ...paths]);
  } catch (e) {
    return { committed: false, reason: String((e as { stderr?: string }).stderr || (e as Error).message).trim() };
  }
  return { committed: true, sha: git(input.repo, ['rev-parse', '--short', 'HEAD']).trim(), leftOut: changedFiles(input.repo) };
}
