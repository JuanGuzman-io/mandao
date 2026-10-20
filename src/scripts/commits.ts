import { execFileSync } from 'node:child_process';
import { relative } from 'node:path';
import type { Config } from '../schemas/index.js';
import { type CommitState, commitMessage, type Progress, type Story, type Task } from '../spec/index.js';
import { writeProgress } from './checkpoint.js';
import type { SpecFolder } from './spec.js';

const git = (cwd: string, args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });

const FIELD = '\x1f';
const RECORD = '\x1e';

/**
 * Commits on the current branch that carry `Refs: <spec id>`, keyed by their `Mandao-Task` trailer. Trailers
 * survive rebases and cherry-picks, so this is the only link between a task and its commit (ADR 0021).
 */
export function taskCommits(repo: string, specId: string, trailers: Config['commits']['trailers']): Map<string, string[]> {
  const format = [
    '%h',
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
export function changedFiles(repo: string, exclude: string): string[] {
  const status = git(repo, ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  const skip = relative(repo, exclude).replace(/\\/g, '/');
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
}

/** A later pending task touching the same file would end up in the earlier commit. */
function overlap(entries: Progress['pending_commits']): string | undefined {
  const seen = new Map<string, string>();
  for (const e of entries)
    for (const f of e.files) {
      const owner = seen.get(f);
      if (owner) return `${f} is changed by both ${owner} and ${e.task}: commit them by hand`;
      seen.set(f, e.task);
    }
  return undefined;
}

/**
 * Commits every pending task, one commit each with its trailers, in order. The entry leaves progress.yml
 * in the same commit, along with the spec folder's bookkeeping; a failed commit puts the entry back.
 * Local only: never pushes.
 */
export function commitPending(input: PendingInput): CommitRun {
  const queue = [...input.progress.pending_commits];
  const run: CommitRun = { committed: [], pending: queue.map((e) => e.task) };
  const clash = overlap(queue);
  if (clash) return { ...run, error: clash };
  let progress = input.progress;
  for (const entry of queue) {
    const task = input.tasks.find((t) => t.id === entry.task);
    if (!task) return { ...run, error: `${entry.task} is not in tasks.md` };
    const msg = commitMessage(input.config, input.story, task, entry.subject);
    if (msg.issues.length) return { ...run, error: `${entry.task}: ${msg.issues.join('; ')}` };
    const next = { ...progress, pending_commits: progress.pending_commits.filter((e) => e !== entry) };
    writeProgress(input.specDir, next);
    try {
      git(input.repo, ['add', '--', ...entry.files, relative(input.repo, input.specDir) || '.']);
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
  return run;
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
