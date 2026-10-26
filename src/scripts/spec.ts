import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import type { Config } from '../schemas/index.js';
import { type SpecStatus, specStatus } from '../schemas/index.js';
import {
  type ExecutionRow,
  frontmatterOf,
  type LayoutFindings,
  layoutFindings,
  type Progress,
  parseExecution,
  parseRequirements,
  parseStory,
  parseTasks,
  type Requirements,
  type Story,
  type Task,
} from '../spec/index.js';
import { branchExists, branchingFor, specBranch, startPoint } from './branching.js';
import { docPath, LITE_DOC, logPath, readProgress, specKeepsState } from './spec-log.js';

/** Everything Mandao can read from one spec folder, with the problems found while reading it. */
export interface SpecFolder {
  dir: string;
  name: string;
  story?: Story;
  requirements?: Requirements;
  /** Design document (`spec.md` in lite layout). */
  design?: string;
  tasks: Task[];
  /** `spec.md` exists: a lite spec keeps requirements, design and tasks in it. */
  lite: boolean;
  execution: ExecutionRow[];
  progress?: Progress;
  issues: string[];
}

/** Reads a spec folder's story frontmatter, depth-bearing documents and entries, and checks them against the layout. */
export function readLayout(dir: string, principleIds: string[] = []): LayoutFindings {
  const story = readIf(join(dir, 'story.md'));
  if (story === undefined) throw new Error('story.md is missing: the layout version is its schema_version');
  const docs: Record<string, { depth?: unknown }> = {};
  for (const f of ['spec.md', 'requirements.md', 'design.md']) {
    const text = readIf(join(dir, f));
    if (text !== undefined) docs[f] = frontmatterOf(text).data;
  }
  const design = readIf(join(dir, 'design.md')) ?? readIf(join(dir, LITE_DOC));
  const taskText = readIf(docPath(dir, 'tasks'));
  const tasks = taskText ? parseTasks(taskText).tasks : [];
  const entries = readdirSync(dir, { withFileTypes: true }).map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
  return layoutFindings({
    story: frontmatterOf(story).data,
    docs,
    entries,
    ...(design ? { design } : {}),
    tasks,
    principleIds,
    hasDataModel: existsSync(join(dir, 'data-model.md')),
  });
}

const specsDir = (root: string, config: Config) => join(root, config.paths.specs);

/** Finds a spec by folder path, full folder name or id prefix (`MDO-0001`). */
export function findSpec(root: string, config: Config, ref: string): string {
  if (existsSync(join(ref, 'story.md'))) return resolve(ref);
  if (existsSync(join(root, ref, 'story.md'))) return resolve(root, ref);
  const base = specsDir(root, config);
  const entries = existsSync(base) ? readdirSync(base) : [];
  const match = entries.find((e) => e === ref) ?? entries.find((e) => e.startsWith(`${ref}-`));
  if (!match) throw new Error(`No spec "${ref}" in ${base}`);
  return join(base, match);
}

const readIf = (file: string) => (existsSync(file) ? readFileSync(file, 'utf8') : undefined);

export function readSpec(dir: string): SpecFolder {
  const issues: string[] = [];
  const out: SpecFolder = { dir, name: basename(dir), tasks: [], lite: existsSync(join(dir, LITE_DOC)), execution: [], issues };
  const story = readIf(join(dir, 'story.md'));
  if (story) {
    const r = parseStory(story);
    issues.push(...r.issues);
    if (r.story) out.story = r.story;
  } else issues.push('story.md is missing');
  const reqs = readIf(docPath(dir, 'requirements'));
  if (reqs) {
    const r = parseRequirements(reqs);
    issues.push(...r.issues);
    out.requirements = r.requirements;
  }
  out.design = readIf(docPath(dir, 'design')) ?? readIf(join(dir, 'spec.md'));
  const tasks = readIf(docPath(dir, 'tasks'));
  if (tasks) {
    const r = parseTasks(tasks);
    issues.push(...r.issues);
    out.tasks = r.tasks;
  }
  const execution = readIf(logPath(dir, 'execution.md'));
  if (execution) {
    const r = parseExecution(execution);
    issues.push(...r.issues);
    out.execution = r.rows;
  }
  const progress = readProgress(dir);
  if (progress.progress) out.progress = progress.progress;
  if (progress.invalid) issues.push(`${specKeepsState(dir) ? 'state.yml progress' : 'progress.yml'} does not match its schema`);
  return out;
}

const slugify = (title: string) =>
  title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/, '');

/**
 * The main checkout of the repository containing `cwd`. Inside a worktree, `--git-common-dir` points
 * at the main checkout's `.git`, so worktree paths resolve the same from every worktree.
 */
export function mainCheckout(cwd: string): string {
  try {
    const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return dirname(common);
  } catch {
    return resolve(cwd); // not a git repository: the folder itself
  }
}

/** `paths.worktrees` with `{repo}` resolved against the main checkout. */
export function worktreesDir(root: string, config: Config): string {
  const main = mainCheckout(root);
  return resolve(main, config.paths.worktrees.replace('{repo}', basename(main)));
}

function gitBranches(root: string): string[] {
  try {
    return execFileSync('git', ['branch', '--all', '--format=%(refname:short)'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .filter(Boolean);
  } catch {
    return []; // not a git repository yet
  }
}

const gitLines = (root: string, args: string[]) => {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n')
      .filter(Boolean);
  } catch {
    return []; // not a repository yet, or no commits
  }
};

/**
 * Every place a local id may already be taken, beyond this checkout's spec folder (MDO-0004 reused
 * MDO-0003 after its branch was deleted): spec folders on every local branch, active worktrees, branch
 * names, `Refs` trailers anywhere in history (reflog included) and tracked paths that carry an id.
 */
function idsInUse(root: string, config: Config): string[] {
  const specs = config.paths.specs;
  const branches = gitLines(root, ['for-each-ref', '--format=%(refname:short)', 'refs/heads']);
  return [
    ...(existsSync(specsDir(root, config)) ? readdirSync(specsDir(root, config)) : []),
    ...(existsSync(worktreesDir(root, config)) ? readdirSync(worktreesDir(root, config)) : []),
    ...gitBranches(root),
    ...branches.flatMap((b) => gitLines(root, ['ls-tree', '--name-only', b, '--', `${specs}/`])),
    ...gitLines(root, ['log', '--all', '--reflog', `--format=%(trailers:key=${config.commits.trailers.refs},valueonly)`]),
    ...gitLines(root, ['ls-files']),
  ];
}

/** The next local id: the highest `<prefix>-NNNN` already in use anywhere (see `idsInUse`), plus one. */
export function nextLocalId(root: string, config: Config): string {
  const prefix = config.spec.local_prefix;
  const re = new RegExp(`${prefix}-(\\d+)`, 'g');
  const max = Math.max(0, ...idsInUse(root, config).flatMap((s) => [...s.matchAll(re)].map((m) => Number(m[1]))));
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

export interface SpecProposal {
  id: string;
  slug: string;
  folder: string;
  branch: string;
  /** Where the branch starts and where its PR targets (ADR 0023). */
  base: string;
  worktree: string;
  /** Run after the user confirms; Mandao does not run it for the agent. */
  command: string;
  /** Problems to show the user before confirming (e.g. the base branch does not exist). */
  issues: string[];
  /** The explicit id's branch already exists with no spec or worktree: `command` checks it out instead of creating it. */
  reusesBranch?: true;
}

export interface ProposalOptions {
  id?: string;
  type?: string;
  /** Polyrepo: the project whose branching model applies. */
  project?: string;
  /** Hotfix lane: start from `hotfix.from` with the hotfix prefix. */
  hotfix?: boolean;
}

/** Proposes the spec folder, branch, base and worktree for `specify` or `quick` (ADR 0015, ADR 0023). */
export function proposeSpec(root: string, config: Config, title: string, opts: ProposalOptions = {}): SpecProposal {
  const id = opts.id ?? nextLocalId(root, config);
  const slug = slugify(title);
  const b = branchingFor(config, opts.project);
  const branch = specBranch(config, b, { id, slug, ...(opts.type ? { type: opts.type } : {}), ...(opts.hotfix ? { hotfix: true } : {}) });
  const base = startPoint(b, opts.hotfix);
  const name = slug ? `${id}-${slug}` : id;
  const worktree = join(worktreesDir(root, config), name);
  const issues = branchExists(root, base)
    ? []
    : [`base branch "${base}" does not exist here: create it, or set branching.base in .mandao/config.yml (model ${b.model})`];
  const existing = opts.id && branchExists(root, branch) ? existingBranch(root, config, branch, opts.id) : undefined;
  if (existing === 'taken')
    issues.push(`branch "${branch}" already exists with a spec or a worktree: resume that spec or pick another --id`);
  const reuse = existing === 'reusable';
  return {
    id,
    slug,
    folder: join(config.paths.specs, name),
    branch,
    base,
    worktree,
    command: reuse
      ? `git worktree add ${JSON.stringify(worktree)} ${branch}`
      : `git worktree add -b ${branch} ${JSON.stringify(worktree)} ${base}`,
    issues,
    ...(reuse ? { reusesBranch: true as const } : {}),
  };
}

/**
 * An explicit id's branch that already exists: reusable when it holds no spec folder for the id and no worktree
 * has it out (a spec started by hand, MDO-0001 trial), else taken. Allocation without --id still skips it.
 */
function existingBranch(root: string, config: Config, branch: string, id: string): 'reusable' | 'taken' {
  const ref = gitLines(root, ['rev-parse', '--verify', '--quiet', branch]).length ? branch : `origin/${branch}`;
  const folders = gitLines(root, ['ls-tree', '-d', '--name-only', ref, '--', `${config.paths.specs}/`]);
  const hasSpec = folders.some((f) => basename(f) === id || basename(f).startsWith(`${id}-`));
  const checkedOut = gitLines(root, ['worktree', 'list', '--porcelain']).includes(`branch refs/heads/${branch}`);
  return hasSpec || checkedOut ? 'taken' : 'reusable';
}

/** Allowed status moves; `abandoned` is reachable from anything but `closed`. */
const TRANSITIONS: Record<SpecStatus, SpecStatus[]> = {
  draft: ['approved'],
  approved: ['in-progress', 'draft'],
  'in-progress': ['blocked', 'verified'],
  blocked: ['in-progress'],
  verified: ['closed', 'in-progress'],
  closed: [],
  abandoned: [],
};

/** Checks a status change; `verified` also needs every DEFERRED_TO_CI run confirmed by CI. */
export function checkTransition(from: SpecStatus, to: string, progress: Progress | undefined, ciConfirmed: boolean): string[] {
  const target = specStatus.safeParse(to);
  if (!target.success) return [`unknown status "${to}"`];
  if (to === 'abandoned' && from !== 'closed') return [];
  if (!TRANSITIONS[from].includes(target.data))
    return [`${from} → ${to} is not allowed (from ${from}: ${TRANSITIONS[from].join(', ') || 'none'})`];
  const deferred = progress?.deferred_to_ci ?? [];
  if (to === 'verified' && deferred.length && !ciConfirmed) {
    return [
      `${deferred.length} test run(s) were deferred to CI (${deferred.map((d) => d.task).join(', ')}); confirm CI passed them (--ci-confirmed)`,
    ];
  }
  return [];
}

export interface WhereReport {
  inWorktree: boolean;
  cwd: string;
  branch?: string;
  expected: { branch: string; worktree: string };
  /** The active harness's command that opens a session in `expected.worktree` (its adapter's `session.resume`, D2). */
  resume?: string;
  message: string;
}

/** Is this session inside the spec's worktree, on its branch? `implement` warns when it is not. */
export function whereAmI(cwd: string, expected: { branch: string; worktree: string }, resume?: string): WhereReport {
  let top: string | undefined;
  let branch: string | undefined;
  try {
    top = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    // not a git checkout
  }
  const inWorktree = Boolean(top && resolve(top) === resolve(expected.worktree) && branch === expected.branch);
  return {
    inWorktree,
    cwd,
    ...(branch ? { branch } : {}),
    expected,
    ...(resume ? { resume } : {}),
    message: inWorktree ? 'in the spec worktree' : `not in the spec worktree: open ${expected.worktree} (branch ${expected.branch})`,
  };
}

/** The branch and worktree a spec folder belongs to, from its folder name and story type. */
export function expectedPlace(root: string, config: Config, spec: SpecFolder): { branch: string; worktree: string } {
  const [id, ...slug] = spec.name.split(/-(?=[a-z])/);
  const type = spec.story?.meta.type;
  const hotfix = spec.story?.meta.lane === 'hotfix';
  const branch = specBranch(config, branchingFor(config), {
    id: id ?? spec.name,
    slug: slug.join('-'),
    ...(type ? { type } : {}),
    ...(hotfix ? { hotfix } : {}),
  });
  return { branch, worktree: join(worktreesDir(root, config), spec.name) };
}
