import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import type { Command } from 'commander';
import { ADAPTERS } from '../adapters/index.js';
import { readConfig } from '../engine/files.js';
import type { Config } from '../schemas/index.js';
import { branchingFor, currentBranch, startPoint, worktreeHolding } from '../scripts/branching.js';
import { idsInUse, type ProposalOptions, proposeSpec } from '../scripts/spec.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { harnessOption } from './spec-context.js';
import { carryPending, type OpenOptions, openInPlace, recordRequest, type Step, setUp } from './spec-open.js';

const git = (cwd: string, args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

export interface CreateOptions extends OpenOptions {
  /** A worktree instead of the branch in place: asked for, or another spec is open in this checkout. */
  worktree?: boolean;
  /** Another open spec's branch whose unmerged shared-state changes this spec takes (`sharedState`). */
  carryFrom?: string;
}

/** Project state every spec reads: the constitution, the intake proposals and the config. */
const sharedPaths = (config: Config) => [config.paths.constitution, config.paths.intake, '.mandao/config.yml'];

/**
 * Other open spec branches that changed shared state since the base, with the files: a spec started now
 * would not see them (MDO-0002 started without MDO-0001's reopened constitution and session threshold).
 */
function sharedStateElsewhere(root: string, config: Config, base: string, own: string) {
  const prefixes = Object.values(branchingFor(config).prefixes).filter(Boolean);
  const branches = git(root, ['for-each-ref', '--format=%(refname:short)', 'refs/heads'])
    .split('\n')
    .filter((b) => b && b !== own && prefixes.some((prefix) => b.startsWith(prefix)));
  return branches
    .map((branch) => ({
      branch,
      files: git(root, ['diff', '--name-only', `${base}...${branch}`, '--', ...sharedPaths(config)])
        .split('\n')
        .filter(Boolean),
    }))
    .filter((entry) => entry.files.length);
}

function carryShared(dir: string, from: string, files: string[]): Step {
  if (!files.length) return { step: 'shared state', status: 'skipped', detail: `${from} changed no shared state` };
  git(dir, ['checkout', from, '--', ...files]);
  return { step: 'shared state', status: 'done', detail: `from ${from}: ${files.join(', ')}` };
}

/** Another spec's branch is checked out here: moving this checkout would take it from that spec. */
function otherSpecHere(root: string, config: Config, branch: string): boolean {
  const here = currentBranch(root);
  const b = branchingFor(config);
  return Boolean(here && here !== branch && Object.values(b.prefixes).some((prefix) => prefix && here.startsWith(prefix)));
}

/**
 * `run spec-new --create`: what story and specify run when the spec does not exist yet (phase 16). The branch
 * is always created (or an explicit id's existing one reused); by default in this checkout, carrying the
 * uncommitted work, and in a worktree when asked or when another spec is open here. The request record and the
 * baseline are written; nothing is left for the user to run.
 */
export async function createSpec(root: string, config: Config, title: string, proposal: ProposalOptions, o: CreateOptions) {
  const p = proposeSpec(root, config, title, proposal);
  if (p.issues.length) throw new Error(p.issues.join('; '));
  const holder = otherSpecHere(root, config, p.branch) ? currentBranch(root) : undefined;
  const mode = o.worktree || holder ? 'worktree' : 'in-place';
  const sharedState = sharedStateElsewhere(root, config, p.base, p.branch);
  const carried = o.carryFrom ? (sharedState.find((x) => x.branch === o.carryFrom)?.files ?? []) : [];
  // Checked before anything is created: `git checkout <branch> -- files` would overwrite these edits (review F1).
  const dirty = carried.length ? git(root, ['status', '--porcelain', '--', ...carried]) : '';
  if (dirty)
    throw new Error(`uncommitted edits to ${carried.join(', ')} would be overwritten by --carry-from: commit or set them aside first`);
  let steps: Step[];
  if (mode === 'worktree') {
    steps = await setUp(root, config, p, o);
    steps.splice(1, 0, carryPending(root, config, p, holder));
    recordRequest(config, p, title, o);
  } else {
    steps = await openInPlace(root, config, p, o);
    recordRequest(config, p, title, o, root);
  }
  const dir = mode === 'worktree' ? p.worktree : root;
  if (o.carryFrom) steps.push(carryShared(dir, o.carryFrom, carried));
  return { ...p, mode, dir, steps, ...(sharedState.length ? { sharedState } : {}), ok: !steps.some((s) => s.status === 'failed') };
}

/**
 * `run spec-new --discard <ID>`: abandon a spec started by mistake (MDO-0001 trial: `git worktree remove` and
 * `git branch -D` by hand). Only a spec branch (one of the branching prefixes) matches. Without `--yes` it only
 * says what it would remove, with the commits the base does not have; it never removes uncommitted work.
 */
export function discardSpec(root: string, config: Config, id: string, yes?: boolean) {
  const pattern = new RegExp(`(^|/)${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(-|$)`);
  const prefixes = Object.values(branchingFor(config).prefixes).filter(Boolean);
  const branches = git(root, ['for-each-ref', '--format=%(refname:short)', 'refs/heads'])
    .split('\n')
    .filter((b) => pattern.test(b) && prefixes.some((prefix) => b.startsWith(prefix)));
  if (branches.length !== 1)
    throw new Error(`${id}: ${branches.length ? `several branches match (${branches.join(', ')})` : 'no spec branch found'}`);
  const branch = branches[0]!;
  const holder = worktreeHolding(root, branch);
  const inPlace = currentBranch(root) === branch;
  const worktree = holder && realpathSync(holder) !== realpathSync(git(root, ['rev-parse', '--show-toplevel'])) ? holder : undefined;
  // Commits only this branch has: deleting it drops them (recoverable from the reflog only), so the PE sees them first.
  const base = startPoint(branchingFor(config));
  const unmergedCommits = git(root, ['log', '--format=%h %s', `${base}..${branch}`])
    .split('\n')
    .filter(Boolean);
  const plan = { branch, ...(worktree ? { worktree } : {}), inPlace, unmergedCommits };
  if (!yes) return { discarded: false, wouldRemove: plan, confirm: 'run again with --yes' };
  for (const dir of [worktree, inPlace ? root : undefined])
    if (dir && git(dir, ['status', '--porcelain']))
      throw new Error(`${dir} holds uncommitted work on ${branch}: commit or remove it first`);
  if (inPlace) git(root, ['switch', '--quiet', base]);
  if (worktree) git(root, ['worktree', 'remove', worktree]);
  git(root, ['branch', '-D', branch]);
  return { discarded: true, removed: plan, idStillInUse: idsInUse(root, config).includes(id) };
}

interface SpecNewOptions {
  id?: string;
  type: string;
  project?: string;
  hotfix?: boolean;
  harness?: string;
  first?: string;
  create?: boolean;
  worktree?: boolean;
  install: boolean;
  baseline: boolean;
  discard?: boolean;
  yes?: boolean;
  carryFrom?: string;
}

/** `run spec-new`: propose a spec's id, folder, branch and worktree; `--create` and `--discard` act on it. */
export function registerSpecNew(run: Command, ctx: CliContext) {
  run
    .command('spec-new <title...>')
    .description('Propose the id, folder, branch, base and worktree for a new spec')
    .option('--id <id>', 'tracker id (default: the next local id)')
    .option('--type <type>', 'story | bug | …', 'story')
    .option('--project <name>', "polyrepo: use this project's branching model")
    .option('--hotfix', 'hotfix lane: start from branching.hotfix.from with the hotfix prefix')
    .option('--harness <id>', 'the active harness: adds `resume` when --first is given', 'claude')
    .option('--first <command>', 'the mandao to run first in the worktree, e.g. "/mandao-specify <ID>"')
    .option('--create', 'create it: the branch (in place, or a worktree), the request record and the baseline')
    .option('--worktree', 'with --create: a worktree instead of the branch in this checkout')
    .option('--no-install', 'with --create --worktree: skip installing dependencies')
    .option('--no-baseline', 'with --create: skip the baseline gates')
    .option('--carry-from <branch>', "with --create: take another open spec's unmerged constitution, intake and config changes")
    .option('--discard', 'abandon the spec whose id is given as the title: its branch and worktree (--yes to do it)')
    .option('--yes', 'with --discard: remove them')
    .action((title: string[], opts: SpecNewOptions) => specNew(ctx, title.join(' '), opts));
}

/** The `run spec-new` action: discard, create, or only propose. */
async function specNew(ctx: CliContext, title: string, opts: SpecNewOptions) {
  const { harness, first, create, worktree, install, baseline, discard, yes, carryFrom, ...options } = opts;
  const config = readConfig(ctx.root());
  if (discard) return json(discardSpec(ctx.root(), config, title, yes));
  const active = harnessOption(harness);
  if (!create) {
    // The proposal also names other open specs' unmerged shared changes, so the PE decides on --carry-from first.
    const proposal = proposeSpec(ctx.root(), config, title, options);
    const sharedState = sharedStateElsewhere(ctx.root(), config, proposal.base, proposal.branch);
    const resume = first ? { resume: ADAPTERS[active].session.resume(proposal.worktree, first).text } : {};
    return json({ ...proposal, ...resume, ...(sharedState.length ? { sharedState } : {}) });
  }
  const quick = options.id === 'quick';
  const made = await createSpec(ctx.root(), config, title, options, {
    type: options.type,
    install,
    baseline,
    worktree,
    hotfix: options.hotfix,
    quick,
    ...(carryFrom ? { carryFrom } : {}),
  });
  if (!made.ok) process.exitCode = 1;
  const resume = made.mode === 'worktree' && first ? ADAPTERS[active].session.resume(made.worktree, first).text : undefined;
  return json(resume ? { ...made, resume } : made);
}
