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
  const mode = o.worktree || otherSpecHere(root, config, p.branch) ? 'worktree' : 'in-place';
  let steps: Step[];
  if (mode === 'worktree') {
    steps = await setUp(root, config, p, o);
    steps.splice(1, 0, carryPending(root, config, p));
    recordRequest(config, p, title, o);
  } else {
    steps = await openInPlace(root, config, p, o);
    recordRequest(config, p, title, o, root);
  }
  return { ...p, mode, dir: mode === 'worktree' ? p.worktree : root, steps, ok: !steps.some((s) => s.status === 'failed') };
}

/**
 * `run spec-new --discard <ID>`: abandon a spec started by mistake (MDO-0001 trial: `git worktree remove` and
 * `git branch -D` by hand). Without `--yes` it only says what it would remove. It never removes uncommitted work.
 */
export function discardSpec(root: string, config: Config, id: string, yes?: boolean) {
  const pattern = new RegExp(`(^|/)${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(-|$)`);
  const branches = git(root, ['for-each-ref', '--format=%(refname:short)', 'refs/heads'])
    .split('\n')
    .filter((b) => pattern.test(b));
  if (branches.length !== 1)
    throw new Error(`${id}: ${branches.length ? `several branches match (${branches.join(', ')})` : 'no spec branch found'}`);
  const branch = branches[0]!;
  const holder = worktreeHolding(root, branch);
  const inPlace = currentBranch(root) === branch;
  const worktree = holder && realpathSync(holder) !== realpathSync(git(root, ['rev-parse', '--show-toplevel'])) ? holder : undefined;
  const plan = { branch, ...(worktree ? { worktree } : {}), inPlace };
  if (!yes) return { discarded: false, wouldRemove: plan, confirm: 'run again with --yes' };
  for (const dir of [worktree, inPlace ? root : undefined])
    if (dir && git(dir, ['status', '--porcelain']))
      throw new Error(`${dir} holds uncommitted work on ${branch}: commit or remove it first`);
  if (inPlace) git(root, ['switch', '--quiet', startPoint(branchingFor(config))]);
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
    .option('--discard', 'abandon the spec whose id is given as the title: its branch and worktree (--yes to do it)')
    .option('--yes', 'with --discard: remove them')
    .action(async (title: string[], opts: SpecNewOptions) => {
      const { harness, first, create, worktree, install, baseline, discard, yes, ...options } = opts;
      const config = readConfig(ctx.root());
      if (discard) return json(discardSpec(ctx.root(), config, title.join(' '), yes));
      if (create) {
        const made = await createSpec(ctx.root(), config, title.join(' '), options, {
          type: options.type,
          install,
          baseline,
          worktree,
          ...(options.hotfix ? { hotfix: true } : {}),
          ...(options.id === 'quick' ? { quick: true } : {}),
        });
        if (!made.ok) process.exitCode = 1;
        return json(made);
      }
      {
        const proposal = proposeSpec(ctx.root(), config, title.join(' '), options);
        const active = harnessOption(harness);
        json(first ? { ...proposal, resume: ADAPTERS[active].session.resume(proposal.worktree, first).text } : proposal);
      }
    });
}
