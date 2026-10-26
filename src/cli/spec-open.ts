import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ADAPTERS } from '../adapters/index.js';
import { openByHand } from '../adapters/shared.js';
import type { Config, HarnessId } from '../schemas/index.js';
import { currentBranch } from '../scripts/branching.js';
import { excerpt } from '../scripts/gates.js';
import { runTests, type TestRun } from '../scripts/run-tests.js';
import type { SpecProposal } from '../scripts/spec.js';
import { keepsStateFile, LOG_DIR, updateState } from '../scripts/spec-log.js';
import { dependencyInstalls, includePlan } from '../scripts/worktree-setup.js';
import { CURRENT_LAYOUT_VERSION } from '../spec/layout.js';
import { onPath } from '../util/which.js';
import { copyInto, removeFile, writeText } from '../writer/files.js';
import { type BaselineLog, recordBaseline } from './baseline.js';
import { budgetFor } from './budget.js';

/**
 * Opening a spec: its branch, in place or in a worktree, the worktree's setup, the baseline and the request
 * record. `mandao start` and `run spec-new --create` (the in-session path of story and specify, phase 16)
 * share it, so neither leaves a step to the user.
 */

export interface Step {
  step: string;
  status: 'done' | 'skipped' | 'failed' | 'warning';
  detail: string;
}

export interface OpenOptions {
  quick?: boolean;
  hotfix?: boolean;
  type: string;
  install: boolean;
  baseline: boolean;
}

/** The exact command that opens each harness in the worktree with the first mandao; `launch` when `--open` can run it. */
export function openCommand(harness: string, worktree: string, first: string): { text: string; launch?: string[] } {
  const known = ADAPTERS[harness as HarnessId];
  return known ? known.session.resume(worktree, first) : openByHand(harness, worktree, first);
}

const git = (cwd: string, args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

async function installDependencies(root: string, config: Config, worktree: string): Promise<Step[]> {
  // Monorepo and single: once at the workspace root; the package manager installs every workspace member.
  const commands = dependencyInstalls(worktree);
  if (!commands.length) return [{ step: 'dependencies', status: 'skipped', detail: 'no lockfile at the workspace root' }];
  const steps: Step[] = [];
  for (const command of commands) {
    const budget = budgetFor(root, config, config.projects[0], 'build', `start ${command}`);
    const r = await runTests(worktree, `start ${command}`, command, budget, undefined, { keepOutput: true });
    steps.push(runStep('dependencies', command, r));
  }
  return steps;
}

function runStep(step: string, command: string, r: TestRun): Step {
  if (r.status === 'PASS') return { step, status: 'done', detail: command };
  if (r.status === 'DEFERRED_TO_CI') return { step, status: 'skipped', detail: `${command}: deferred, ${r.reason}` };
  return { step, status: 'failed', detail: `${command}: ${r.status} (exit ${r.exitCode ?? '—'})\n${excerpt(r.output, 8)}` };
}

async function projectSetup(root: string, config: Config, worktree: string): Promise<Step[]> {
  const steps: Step[] = [];
  for (const project of config.projects) {
    for (const command of project.worktree.setup) {
      const cwd = join(worktree, project.path);
      const budget = budgetFor(root, config, project, 'build', `start setup ${project.name}`);
      steps.push(
        runStep(
          'setup',
          `${project.name}: ${command}`,
          await runTests(cwd, `start setup`, command, budget, undefined, { keepOutput: true }),
        ),
      );
    }
  }
  return steps;
}

function graphCache(root: string, worktree: string): Step {
  const src = join(root, 'graphify-out');
  if (!existsSync(src)) return { step: 'graph', status: 'skipped', detail: 'no graphify-out/ in the main checkout' };
  copyInto(src, join(worktree, 'graphify-out'));
  if (!onPath('graphify')) return { step: 'graph', status: 'done', detail: 'copied graphify-out/ (graphify not installed: no update)' };
  const r = spawnSync('graphify', ['update', '.'], { cwd: worktree, encoding: 'utf8', timeout: 180_000 });
  return r.status === 0
    ? { step: 'graph', status: 'done', detail: 'copied graphify-out/ and ran graphify update' }
    : { step: 'graph', status: 'warning', detail: 'copied graphify-out/; graphify update failed, the graph may be stale' };
}

/** Cheap gates on the clean worktree, recorded so later failures that were already there are not blamed on the spec. */
async function baseline(root: string, config: Config, worktree: string, log: SpecLog): Promise<Step> {
  const r = await recordBaseline(root, config, worktree, log);
  if (r.outcome === 'skipped') return { step: 'baseline', status: 'skipped', detail: 'no lint, typecheck or build gate configured' };
  return {
    step: 'baseline',
    status: r.outcome === 'green' ? 'done' : 'warning',
    detail: `${r.outcome}: ${relative(worktree, r.file)}`,
  };
}

function createWorktree(root: string, p: SpecProposal): Step {
  if (existsSync(p.worktree)) throw new Error(`${p.worktree} already exists: open it, or remove it with \`mandao worktree clean\``);
  if (p.reusesBranch) {
    git(root, ['worktree', 'add', p.worktree, p.branch]);
    return { step: 'worktree', status: 'done', detail: `existing ${p.branch} at ${p.worktree}` };
  }
  git(root, ['worktree', 'add', '-b', p.branch, p.worktree, p.base]);
  return { step: 'worktree', status: 'done', detail: `${p.branch} from ${p.base} at ${p.worktree}` };
}

function copyEnvFiles(root: string, worktree: string): Step[] {
  const plan = includePlan(root);
  for (const f of plan.copy) copyInto(join(root, f), join(worktree, f));
  return [
    {
      step: 'env files',
      status: plan.copy.length ? 'done' : 'skipped',
      detail: plan.copy.length ? plan.copy.join(', ') : 'nothing listed in .mandao/worktree-include or .worktreeinclude',
    },
    ...plan.skipped.map((s): Step => ({ step: 'env files', status: 'warning', detail: `${s.file}: ${s.reason}` })),
  ];
}

/** A new spec starts at the current layout version; quick changes keep their own files in the quick log. */
const NEW_SPEC_KEEPS_STATE = keepsStateFile(CURRENT_LAYOUT_VERSION);

type SpecLog = BaselineLog;

/** Where the spec's log lives in the worktree, the name suffix quick changes use, and whether it keeps `state.yml`. */
function logOf(config: Config, p: SpecProposal, quick?: boolean, base = p.worktree): SpecLog {
  const specDir = join(base, quick ? join(config.paths.specs, 'quick') : p.folder);
  return { specDir, dir: join(specDir, LOG_DIR), suffix: quick ? `-${p.slug}` : '', state: !quick && NEW_SPEC_KEEPS_STATE };
}

/** §14.5 setup, in order: worktree, env files, dependencies, project hooks, graph cache, baseline. */
export async function setUp(root: string, config: Config, p: SpecProposal, o: OpenOptions): Promise<Step[]> {
  const wt = p.worktree;
  const steps: Step[] = [createWorktree(root, p), ...copyEnvFiles(root, wt)];
  if (o.install) steps.push(...(await installDependencies(root, config, wt)));
  steps.push(...(await projectSetup(root, config, wt)), graphCache(root, wt));
  const log = logOf(config, p, o.quick);
  if (o.baseline) steps.push(await baseline(root, config, wt, log));
  return steps;
}

/** The request waits for the first command in the spec's log: specify and quick read it. */
export function recordRequest(config: Config, p: SpecProposal, title: string, o: OpenOptions, base = p.worktree) {
  const log = logOf(config, p, o.quick, base);
  const lane = o.hotfix ? 'hotfix' : 'normal';
  const created_at = new Date().toISOString();
  if (log.state) {
    const start = { id: p.id, title, type: o.type, lane, branch: p.branch, base: p.base, created_at };
    return updateState(log.specDir, (s) => ({ ...s, start }));
  }
  writeText(
    join(log.dir, `start${log.suffix}.yml`),
    [
      '# Written by mandao start: the request the first command picks up.',
      `id: ${p.id}`,
      `title: ${JSON.stringify(title)}`,
      `type: ${o.type}`,
      `lane: ${lane}`,
      `branch: ${p.branch}`,
      `base: ${p.base}`,
      `created_at: ${created_at}`,
      '',
    ].join('\n'),
  );
}

/**
 * In place (the default, phase 16): this checkout moves onto the spec's branch, created from the base or the
 * existing one reused; uncommitted work travels with it (git refuses when it would be lost). No worktree,
 * no reinstall: the checkout already has its dependencies.
 */
export async function openInPlace(root: string, config: Config, p: SpecProposal, o: OpenOptions): Promise<Step[]> {
  const steps = [switchInPlace(root, p)];
  if (o.baseline) steps.push(await baseline(root, config, root, logOf(config, p, o.quick, root)));
  return steps;
}

function switchInPlace(root: string, p: SpecProposal): Step {
  if (currentBranch(root) === p.branch) return { step: 'branch', status: 'done', detail: `already on ${p.branch}` };
  try {
    git(root, p.reusesBranch ? ['switch', '--quiet', p.branch] : ['switch', '--quiet', '-c', p.branch, p.base]);
  } catch (e) {
    throw new Error(`could not move this checkout to ${p.branch}: ${String((e as { stderr?: string }).stderr ?? e).trim()}`);
  }
  return {
    step: 'branch',
    status: 'done',
    detail: p.reusesBranch ? `switched to the existing ${p.branch}` : `${p.branch} from ${p.base}, in place; uncommitted work carried`,
  };
}

/** Shared project state a new spec takes with it: the constitution, the config, intake proposals, the spec folder. */
export function carriedPaths(config: Config, p: SpecProposal): string[] {
  return [config.paths.constitution, config.paths.intake, '.mandao/config.yml', p.folder];
}

/** `git status` entries under `paths`, read with -z so paths come raw (spaces, non-ASCII), never quoted (review F6). */
function statusEntries(root: string, paths: string[]): { status: string; path: string }[] {
  const records = git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', ...paths]).split('\0');
  const out: { status: string; path: string }[] = [];
  for (let i = 0; i < records.length; i++) {
    const record = records[i]!;
    if (!record) continue;
    out.push({ status: record.slice(0, 2), path: record.slice(3) });
    if (/[RC]/.test(record.slice(0, 2))) i++; // the source path of a rename or copy follows
  }
  return out;
}

/**
 * Worktree mode: the uncommitted changes under `carriedPaths` move into the new worktree (copied there, then
 * restored in the main checkout), so nothing the intake or the story wrote is left behind (MDO-0001 trial:
 * `git stash` by hand). Other uncommitted work stays where it is, and so does everything when another spec's
 * branch is checked out here (`holder`).
 */
export function carryPending(root: string, config: Config, p: SpecProposal, holder?: string): Step {
  // Another spec's branch is checked out here: its uncommitted changes belong to it and stay (review F5).
  if (holder)
    return { step: 'pending files', status: 'skipped', detail: `uncommitted changes stay with ${holder}, the spec they belong to` };
  const moved: string[] = [];
  const left: string[] = [];
  for (const { status, path } of statusEntries(root, carriedPaths(config, p))) {
    // A rename, a copy or a deletion stays in the main checkout for the user to see.
    if (/[RCD]/.test(status)) {
      left.push(path);
      continue;
    }
    copyInto(join(root, path), join(p.worktree, path));
    if (status === '??') removeFile(join(root, path), [root]);
    else git(root, ['restore', '--staged', '--worktree', '--', path]);
    moved.push(path);
  }
  if (!moved.length && !left.length) return { step: 'pending files', status: 'skipped', detail: 'nothing uncommitted to carry' };
  const detail = [
    moved.length ? `moved into the worktree: ${moved.join(', ')}` : '',
    left.length ? `left here (renamed or deleted): ${left.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('; ');
  return { step: 'pending files', status: left.length ? 'warning' : 'done', detail };
}
