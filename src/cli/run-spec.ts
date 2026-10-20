import { existsSync, readFileSync } from 'node:fs';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { readRecommendations, resolveWorkspaceModels } from '../models/load.js';
import { HARNESS_IDS, type HarnessId } from '../schemas/index.js';
import { branchingFor, branchNames, currentBranch, detectBranching } from '../scripts/branching.js';
import { composeBrief } from '../scripts/brief.js';
import { commitState } from '../scripts/commits.js';
import { detectRunner, fillCommand, graphFile, projectDir, readGraph, selectImpact } from '../scripts/impact.js';
import { type BudgetKind, decideBudget, effectiveResources, probeMachine } from '../scripts/resources.js';
import { crossReviewers } from '../scripts/review.js';
import { runTests } from '../scripts/run-tests.js';
import { checkTransition, expectedPlace, findSpec, proposeSpec, readSpec, whereAmI } from '../scripts/spec.js';
import { docPath, LITE_DOC } from '../scripts/spec-log.js';
import {
  blockingMarkers,
  commitMessage,
  type LoopContext,
  loopState,
  planTasks,
  TASK_KINDS,
  taskIndex,
  taskLayoutIssues,
  trace,
  withIndex,
} from '../spec/index.js';
import { onPath } from '../util/which.js';
import { writeText } from '../writer/files.js';
import { budgetFor } from './budget.js';
import type { CliContext } from './context.js';
import { registerLedger } from './run-ledger.js';
import { registerVerify } from './run-verify.js';

const json = (value: unknown) => console.log(JSON.stringify(value, null, 2));

function harnessOption(value: string | undefined): HarnessId {
  const h = value ?? 'claude';
  if (!(HARNESS_IDS as readonly string[]).includes(h)) throw new Error(`Unknown harness "${h}"`);
  return h as HarnessId;
}

function loadSpec(ctx: CliContext, ref: string) {
  const config = readConfig(ctx.root());
  return { config, spec: readSpec(findSpec(ctx.root(), config, ref)) };
}

function modelsFor(ctx: CliContext, harness: HarnessId, project?: string) {
  const config = readConfig(ctx.root());
  const p = project ? config.projects.find((x) => x.name === project) : undefined;
  return resolveWorkspaceModels(ctx.root(), config, readRecommendations(), p ? { project: p } : {})[harness];
}

/** What the loop needs beyond the log: the commit found by trailers, and other harnesses' reviewers. */
function loopContext(
  ctx: CliContext,
  spec: ReturnType<typeof loadSpec>['spec'],
  task: string,
  harness: HarnessId,
  project?: string,
): LoopContext {
  const config = readConfig(ctx.root());
  const p = project ? config.projects.find((x) => x.name === project) : undefined;
  const all = resolveWorkspaceModels(ctx.root(), config, readRecommendations(), p ? { project: p } : {});
  return {
    committed: commitState(spec, config.commits.trailers).committed.has(task),
    alternatives: crossReviewers(config.harnesses, harness, all, onPath),
  };
}

function projectNamed(ctx: CliContext, name: string) {
  const project = readConfig(ctx.root()).projects.find((p) => p.name === name);
  if (!project) throw new Error(`Unknown project "${name}"`);
  return project;
}

/** Impacted unit tests for changed files in one project. */
function impactFor(ctx: CliContext, project: ReturnType<typeof projectNamed>, files: string[]) {
  const runner = detectRunner(projectDir(ctx.root(), project.path));
  const graph = readGraph(graphFile(ctx.root()));
  return selectImpact({
    changed: files,
    projectPath: project.path,
    ...(project.tests.impacted ? { configured: project.tests.impacted } : {}),
    ...(runner ? { runner } : {}),
    ...(graph ? { graph } : {}),
  });
}

/** Spec proposal, traceability and the task plan. */
function registerPlanning(run: Command, ctx: CliContext) {
  run
    .command('spec-new <title...>')
    .description('Propose the id, folder, branch, base and worktree for a new spec')
    .option('--id <id>', 'tracker id (default: the next local id)')
    .option('--type <type>', 'story | bug | …', 'story')
    .option('--project <name>', "polyrepo: use this project's branching model")
    .option('--hotfix', 'hotfix lane: start from branching.hotfix.from with the hotfix prefix')
    .action((title: string[], opts: { id?: string; type: string; project?: string; hotfix?: boolean }) =>
      json(proposeSpec(ctx.root(), readConfig(ctx.root()), title.join(' '), opts)),
    );

  run
    .command('branching')
    .description('The branching model in force, and the model the existing branches suggest (ADR 0023)')
    .option('--project <name>', "polyrepo: this project's model")
    .action((opts: { project?: string }) => {
      const config = readConfig(ctx.root());
      json({ resolved: branchingFor(config, opts.project), detected: detectBranching(branchNames(ctx.root())) });
    });

  run
    .command('trace <spec>')
    .description('AC → FR → scenario → task → test matrix and structural findings')
    .action((ref: string) => {
      const { spec } = loadSpec(ctx, ref);
      if (!spec.story || !spec.requirements) return json({ issues: [...spec.issues, 'trace needs story.md and requirements.md'] });
      const { config } = loadSpec(ctx, ref);
      json({ ...trace(spec.story, spec.requirements, spec.tasks, commitState(spec, config.commits.trailers)), issues: spec.issues });
    });

  run
    .command('tasks <spec>')
    .description('Validate tasks.md, compute waves and the next eligible task; --index prints the generated Overview')
    .option('--index', 'print the Overview generated from the task details')
    .option('--write', 'with --index: replace the Overview in tasks.md')
    .action((ref: string, o: { index?: boolean; write?: boolean }) => {
      const { spec } = loadSpec(ctx, ref);
      if (o.index) {
        const file = docPath(spec.dir, 'tasks');
        if (o.write) writeText(file, withIndex(readFileSync(file, 'utf8'), spec.tasks, spec.story));
        return json({ overview: taskIndex(spec.tasks, spec.story), written: Boolean(o.write) });
      }
      const markers = [spec.story?.raw, spec.requirements?.raw].filter(Boolean).map((t) => blockingMarkers(t!));
      const tasksFile = docPath(spec.dir, 'tasks');
      const raw = existsSync(tasksFile) ? readFileSync(tasksFile, 'utf8') : '';
      json({
        ...planTasks(
          spec.tasks,
          markers.flatMap((m) => m.criticalOpen),
        ),
        issues: [
          ...spec.issues,
          ...spec.tasks.filter((t) => !t.kind).map((t) => `${t.id} declares no kind (${TASK_KINDS.join(' | ')})`),
          ...taskLayoutIssues(raw, spec.tasks, spec.story, { inline: tasksFile.endsWith(LITE_DOC) }),
        ],
      });
    });
}

/** Per-task scripts for the Leader: brief, loop state, commit message. */
function registerTaskScripts(run: Command, ctx: CliContext) {
  run
    .command('brief <spec> <task>')
    .description('Scoped brief for one task: clauses, files, exemplar, gates, skills, models, lenses, impacted tests')
    .option('--harness <id>', 'the harness running the Leader', 'claude')
    .action((ref: string, id: string, opts: { harness?: string }) => {
      const { config, spec } = loadSpec(ctx, ref);
      const task = spec.tasks.find((t) => t.id === id);
      if (!task) throw new Error(`No ${id} in ${spec.name}/tasks.md`);
      const harness = harnessOption(opts.harness);
      const project = config.projects.find((p) => p.name === task.project);
      const budget = decideBudget(probeMachine(), effectiveResources(config.resources, project?.resources), 'unit');
      const models = modelsFor(ctx, harness, task.project);
      const loop = loopContext(ctx, spec, id, harness, task.project);
      json(composeBrief(ctx.root(), config, spec, task, models, harness, Math.max(1, budget.workers), loop));
    });

  run
    .command('loop <spec> <task>')
    .description("The Leader's next step for a task: implement, review, rework, commit, halt")
    .option('--harness <id>', 'the harness running the Leader', 'claude')
    .action((ref: string, id: string, opts: { harness?: string }) => {
      const { spec } = loadSpec(ctx, ref);
      const task = spec.tasks.find((t) => t.id === id);
      if (!task) throw new Error(`No ${id} in ${spec.name}/tasks.md`);
      const harness = harnessOption(opts.harness);
      json(
        loopState(task, spec.execution, modelsFor(ctx, harness, task.project), harness, loopContext(ctx, spec, id, harness, task.project)),
      );
    });

  run
    .command('commit-msg <spec> <task> <subject...>')
    .description('Commit header and trailers for a task, checked like commitlint')
    .option('--breaking', 'a breaking change (💥 and !)')
    .action((ref: string, id: string, subject: string[], opts: { breaking?: boolean }) => {
      const { config, spec } = loadSpec(ctx, ref);
      const task = spec.tasks.find((t) => t.id === id);
      if (!task || !spec.story) throw new Error(`Need story.md and ${id} in tasks.md`);
      json(commitMessage(config, spec.story, task, subject.join(' '), opts.breaking));
    });
}

/** Spec status changes and the worktree check. */
function registerState(run: Command, ctx: CliContext) {
  run
    .command('status <spec> <to>')
    .description('Check a spec status change (verified needs CI confirmation of deferred runs)')
    .option('--ci-confirmed', 'CI passed every DEFERRED_TO_CI run')
    .action((ref: string, to: string, opts: { ciConfirmed?: boolean }) => {
      const { spec } = loadSpec(ctx, ref);
      const from = spec.story?.meta.status ?? 'draft';
      const problems = checkTransition(from, to, spec.progress, Boolean(opts.ciConfirmed));
      json({ from, to, allowed: problems.length === 0, problems });
      if (problems.length) process.exitCode = 1;
    });

  run
    .command('where <spec>')
    .description('Is this session inside the spec worktree, on its branch?')
    .action((ref: string) => {
      const { config, spec } = loadSpec(ctx, ref);
      const branch = currentBranch(process.cwd());
      const isProtected = Boolean(branch && branchingFor(config).protected.includes(branch));
      json({ ...whereAmI(process.cwd(), expectedPlace(ctx.root(), config, spec)), protected: isProtected });
    });
}

/** Resource budget, impact selection and queued test runs (the one script that executes). */
function registerTestRuns(run: Command, ctx: CliContext) {
  run
    .command('resources')
    .description('Cores, free memory and load, and the budget they allow for an operation')
    .option('--project <name>', 'apply this project resources override')
    .option('--kind <kind>', 'build | unit | e2e', 'unit')
    .action((opts: { project?: string; kind: BudgetKind }) => {
      const config = readConfig(ctx.root());
      const project = opts.project ? config.projects.find((p) => p.name === opts.project) : undefined;
      const probe = probeMachine();
      json({ probe, budget: decideBudget(probe, effectiveResources(config.resources, project?.resources), opts.kind) });
    });

  run
    .command('impact <project> [files...]')
    .description('Unit tests impacted by changed files (configured command, runner selection, graph, module fallback)')
    .action((name: string, files: string[]) => json(impactFor(ctx, projectNamed(ctx, name), files)));

  run
    .command('tests <project> [files...]')
    .description('Run the impacted tests under the resource budget, one heavy run at a time (queued)')
    .option('--full', 'run the full suite (normally CI only)')
    .option('--queue-wait <s>', 'seconds to wait in the queue', '1800')
    .option('--force', 'run even when the budget defers (recorded; ADR 0024)')
    .action(async (name: string, files: string[], opts: { full?: boolean; queueWait: string; force?: boolean }) => {
      const config = readConfig(ctx.root());
      const project = projectNamed(ctx, name);
      const budget = budgetFor(ctx.root(), config, project, 'unit', `${name} tests`, opts.force);
      const impact = impactFor(ctx, project, files);
      const template = opts.full ? project.gates.test : impact.command;
      const command = template ? fillCommand(template, opts.full ? [] : impact.files, Math.max(1, budget.workers)) : undefined;
      const result = await runTests(ctx.root(), `${name} tests`, command, budget, Number(opts.queueWait) * 1000);
      json({ ...result, impact: opts.full ? 'full suite' : impact.source });
      if (result.status !== 'PASS') process.exitCode = 1;
    });
}

/**
 * `mandao run build <project>`: the project's build gate under the `build` memory floor and the same
 * queue as test runs. Deferred when memory is short; only `--force` (recorded) overrides it (ADR 0024).
 */
function registerBuild(run: Command, ctx: CliContext) {
  run
    .command('build <project>')
    .description("Run the project's build gate under the build memory floor, one heavy run at a time")
    .option('--force', 'run even when the budget defers (recorded; ADR 0024)')
    .action(async (name: string, opts: { force?: boolean }) => {
      const config = readConfig(ctx.root());
      const project = projectNamed(ctx, name);
      if (!project.gates.build) throw new Error(`project "${name}" has no gates.build in .mandao/config.yml`);
      const budget = budgetFor(ctx.root(), config, project, 'build', `${name} build`, opts.force);
      const result = await runTests(ctx.root(), `${name} build`, project.gates.build, budget);
      json({ ...result, status: result.status === 'DEFERRED_TO_CI' ? 'DEFERRED' : result.status });
      if (result.status !== 'PASS') process.exitCode = 1;
    });
}

/** Read-only spec scripts: JSON on stdout for the commands to read. */
export function registerSpecScripts(run: Command, ctx: CliContext) {
  registerPlanning(run, ctx);
  registerTaskScripts(run, ctx);
  registerState(run, ctx);
  registerVerify(run, ctx);
}

/** Scripts that write, commit or execute: the documented exceptions (ADR 0020, ADR 0021). */
export function registerSpecWriters(run: Command, ctx: CliContext) {
  registerLedger(run, ctx);
  registerTestRuns(run, ctx);
  registerBuild(run, ctx);
}
