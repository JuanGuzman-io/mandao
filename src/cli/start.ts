import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import type { Config } from '../schemas/index.js';
import { excerpt } from '../scripts/gates.js';
import { runTests, type TestRun } from '../scripts/run-tests.js';
import { proposeSpec, type SpecProposal } from '../scripts/spec.js';
import { LOG_DIR } from '../scripts/spec-log.js';
import { dependencyInstalls, includePlan } from '../scripts/worktree-setup.js';
import { onPath } from '../util/which.js';
import { copyInto, writeText } from '../writer/files.js';
import { budgetFor } from './budget.js';
import type { CliContext } from './context.js';

const TRACKER_ID = /^[A-Z][A-Z0-9_]*-\d+$/;
const BASELINE_GATES = ['lint', 'typecheck', 'build'] as const;

interface StartOptions {
  quick?: boolean;
  hotfix?: boolean;
  type: string;
  harness?: string;
  open?: boolean;
  install: boolean;
  baseline: boolean;
  json?: boolean;
}

interface Step {
  step: string;
  status: 'done' | 'skipped' | 'failed' | 'warning';
  detail: string;
}

/** `PROJ-123 optional title` → the tracker id and title; anything else is a description for a local id. */
export function parseRequest(words: string[]): { id?: string; title: string } {
  const [first = '', ...rest] = words;
  return TRACKER_ID.test(first) ? { id: first, title: rest.join(' ') } : { title: words.join(' ') };
}

/** The exact command that opens each harness in the worktree with the first mandao; `launch` when `--open` can run it. */
export function openCommand(harness: string, worktree: string, first: string): { text: string; launch?: string[] } {
  const cd = `cd ${JSON.stringify(worktree)}`;
  switch (harness) {
    case 'claude':
      return { text: `${cd} && claude ${JSON.stringify(first)}`, launch: ['claude', first] };
    case 'codex':
      return { text: `${cd} && codex ${JSON.stringify(first.replace(/^\//, '$'))}`, launch: ['codex', first.replace(/^\//, '$')] };
    case 'copilot':
      return { text: `code ${JSON.stringify(worktree)}   # then run ${first} in Copilot Chat` };
    default:
      return { text: `${cd}   # open ${harness} there and run ${first}` };
  }
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

interface GateRun {
  project: string;
  gate: string;
  run: TestRun;
}

async function baselineRuns(root: string, config: Config, worktree: string): Promise<GateRun[]> {
  const out: GateRun[] = [];
  for (const project of config.projects)
    for (const gate of BASELINE_GATES) {
      const command = project.gates[gate];
      if (!command) continue;
      const budget = budgetFor(root, config, project, gate === 'build' ? 'build' : 'unit', `baseline ${gate}`);
      const run = await runTests(join(worktree, project.path), `baseline ${gate}`, `${command} 2>&1`, budget, undefined, {
        keepOutput: true,
      });
      out.push({ project: project.name, gate, run });
    }
  return out;
}

/** Cheap gates on the clean worktree, recorded so later failures that were already there are not blamed on the spec. */
async function baseline(root: string, config: Config, worktree: string, file: string): Promise<Step> {
  const runs = await baselineRuns(root, config, worktree);
  if (!runs.length) return { step: 'baseline', status: 'skipped', detail: 'no lint, typecheck or build gate configured' };
  const red = runs.filter((r) => r.run.status === 'FAIL' || r.run.status === 'TIMEOUT');
  writeText(
    file,
    [
      '# Baseline',
      '',
      `${red.length ? "Red before any change: these failures are not the spec's." : 'Green before any change.'} The test baseline is the base branch's last CI result.`,
      '',
      '| Project | Gate | Result |',
      '|---|---|---|',
      ...runs.map((r) => `| ${r.project} | ${r.gate} | ${r.run.status} |`),
      '',
      ...red.map((r) => `### ${r.project} — ${r.gate}\n\n\`\`\`\n${excerpt(r.run.output, 30)}\n\`\`\``),
      '',
    ].join('\n'),
  );
  return {
    step: 'baseline',
    status: red.length ? 'warning' : 'done',
    detail: `${red.length ? 'red' : 'green'}: ${relative(worktree, file)}`,
  };
}

function createWorktree(root: string, p: SpecProposal): Step {
  if (existsSync(p.worktree)) throw new Error(`${p.worktree} already exists: open it, or remove it with \`mandao worktree clean\``);
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

/** Where the spec's log lives in the worktree, and the name suffix quick changes use. */
function logOf(config: Config, p: SpecProposal, quick?: boolean) {
  return { dir: join(p.worktree, quick ? join(config.paths.specs, 'quick') : p.folder, LOG_DIR), suffix: quick ? `-${p.slug}` : '' };
}

/** §14.5 setup, in order: worktree, env files, dependencies, project hooks, graph cache, baseline. */
async function setUp(root: string, config: Config, p: SpecProposal, o: StartOptions): Promise<Step[]> {
  const wt = p.worktree;
  const steps: Step[] = [createWorktree(root, p), ...copyEnvFiles(root, wt)];
  if (o.install) steps.push(...(await installDependencies(root, config, wt)));
  steps.push(...(await projectSetup(root, config, wt)), graphCache(root, wt));
  const log = logOf(config, p, o.quick);
  if (o.baseline) steps.push(await baseline(root, config, wt, join(log.dir, `baseline${log.suffix}.md`)));
  return steps;
}

/** The request waits for the first command in the spec's log: specify and quick read it. */
function recordRequest(config: Config, p: SpecProposal, title: string, o: StartOptions) {
  const log = logOf(config, p, o.quick);
  writeText(
    join(log.dir, `start${log.suffix}.yml`),
    [
      '# Written by mandao start: the request the first command picks up.',
      `id: ${p.id}`,
      `title: ${JSON.stringify(title)}`,
      `type: ${o.type}`,
      `lane: ${o.hotfix ? 'hotfix' : 'normal'}`,
      `branch: ${p.branch}`,
      `base: ${p.base}`,
      `created_at: ${new Date().toISOString()}`,
      '',
    ].join('\n'),
  );
}

function proposalOptions(id: string | undefined, o: StartOptions) {
  const chosen = o.quick ? 'quick' : id;
  return { ...(chosen ? { id: chosen } : {}), type: o.type, ...(o.hotfix ? { hotfix: true } : {}) };
}

const MARK: Record<Step['status'], string> = { done: '✓', skipped: '·', warning: '!', failed: '✗' };

function report(p: SpecProposal, steps: Step[], harness: string, open: string, o: StartOptions) {
  if (o.json) return console.log(JSON.stringify({ id: p.id, branch: p.branch, worktree: p.worktree, steps, open }));
  for (const s of steps) console.log(`${MARK[s.status]} ${s.step}: ${s.detail}`);
  console.log(`\nOpen ${harness} in the worktree:\n  ${open}`);
  if (!o.quick) console.log(`  (standard or full depth: run /mandao-story ${p.id} first)`);
}

function launch(harness: string, worktree: string, argv?: string[]) {
  if (!argv) return console.log(`--open: ${harness} cannot be launched from the command line; run the command above.`);
  spawnSync(argv[0]!, argv.slice(1), { cwd: worktree, stdio: 'inherit' });
}

/**
 * `mandao start "<description|ID>"` (§14.5, ADR 0037): the branch, the worktree and its whole setup as a
 * script, before any session opens, so the first command (or the lite session) is born in the worktree.
 */
export function registerStart(program: Command, ctx: CliContext) {
  program
    .command('start <request...>')
    .description(
      'Create the spec branch and worktree and set it up (env files, dependencies, setup hooks, graph, baseline), then open the harness there',
    )
    .option('--quick', 'a quick change instead of a spec')
    .option('--hotfix', 'hotfix lane: from branching.hotfix.from')
    .option('--type <type>', 'story | bug | …', 'story')
    .option('--harness <id>', 'harness to open (default: the first configured)')
    .option('--open', 'launch the harness in the worktree when its CLI allows it')
    .option('--no-install', 'skip installing dependencies')
    .option('--no-baseline', 'skip the baseline gates')
    .option('--json', 'print the result as JSON')
    .action(async (words: string[], o: StartOptions) => {
      const root = ctx.root();
      const config = readConfig(root);
      const { id, title } = parseRequest(words);
      const proposal = proposeSpec(root, config, title, proposalOptions(id, o));
      if (proposal.issues.length) throw new Error(proposal.issues.join('; '));
      const steps = await setUp(root, config, proposal, o);
      recordRequest(config, proposal, title, o);
      const harness = o.harness ?? config.harnesses[0] ?? 'claude';
      const open = openCommand(
        harness,
        proposal.worktree,
        o.quick ? `/mandao-quick ${title}` : `/mandao-specify ${proposal.id} --depth lite`,
      );
      report(proposal, steps, harness, open.text, o);
      if (steps.some((s) => s.status === 'failed')) process.exitCode = 1;
      if (o.open) launch(harness, proposal.worktree, open.launch);
    });
}
