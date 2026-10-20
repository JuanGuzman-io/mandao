import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { readRecommendations, resolveWorkspaceModels } from '../models/load.js';
import { HARNESS_IDS, type HarnessId } from '../schemas/index.js';
import { composeBrief } from '../scripts/brief.js';
import { appendExecutionRow, markTask, writeProgress } from '../scripts/checkpoint.js';
import { detectRunner, fillCommand, graphFile, projectDir, readGraph, selectImpact } from '../scripts/impact.js';
import { decideBudget, effectiveResources, probeMachine } from '../scripts/resources.js';
import { runTests } from '../scripts/run-tests.js';
import { checkTransition, expectedPlace, findSpec, proposeSpec, readSpec, whereAmI } from '../scripts/spec.js';
import { blockingMarkers, commitMessage, type ExecutionRow, loopState, planTasks, trace, VERDICTS } from '../spec/index.js';
import type { CliContext } from './context.js';

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

interface CheckpointOptions {
  task?: string;
  phase?: string;
  harness?: string;
  model?: string;
  next?: string;
  question?: string[];
  verdict?: (typeof VERDICTS)[number];
  tier?: string;
  attempt: string;
  implementer: string;
  reviewer: string;
  commit: string;
  notes: string;
  done?: string;
  clear?: boolean;
  deferred?: string;
}

/** `--deferred "a, b|low memory"` → one deferred_to_ci entry for the task. */
function deferredEntry(o: CheckpointOptions) {
  if (!o.deferred) return [];
  const [tests = '', reason = 'not given'] = o.deferred.split('|');
  return [
    {
      task: o.task ?? '—',
      tests: tests
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      reason: reason.trim(),
    },
  ];
}

function checkpointRow(o: CheckpointOptions, now: string): ExecutionRow {
  return {
    date: now.slice(0, 10),
    task: o.task ?? '—',
    attempt: Number(o.attempt),
    tier: o.tier ?? '—',
    harness: o.harness ?? '—',
    implementer: o.implementer,
    reviewer: o.reviewer,
    verdict: o.verdict!,
    commit: o.commit,
    notes: o.notes,
  };
}

/** Spec proposal, traceability and the task plan. */
function registerPlanning(run: Command, ctx: CliContext) {
  run
    .command('spec-new <title...>')
    .description('Propose the id, folder, branch and worktree for a new spec')
    .option('--id <id>', 'tracker id (default: the next local id)')
    .option('--type <type>', 'story | bug | …', 'story')
    .action((title: string[], opts: { id?: string; type: string }) =>
      json(proposeSpec(ctx.root(), readConfig(ctx.root()), title.join(' '), opts)),
    );

  run
    .command('trace <spec>')
    .description('AC → FR → scenario → task → test matrix and structural findings')
    .action((ref: string) => {
      const { spec } = loadSpec(ctx, ref);
      if (!spec.story || !spec.requirements) return json({ issues: [...spec.issues, 'trace needs story.md and requirements.md'] });
      json({ ...trace(spec.story, spec.requirements, spec.tasks), issues: spec.issues });
    });

  run
    .command('tasks <spec>')
    .description('Validate tasks.md, compute waves and the next eligible task')
    .action((ref: string) => {
      const { spec } = loadSpec(ctx, ref);
      const markers = [spec.story?.raw, spec.requirements?.raw].filter(Boolean).map((t) => blockingMarkers(t!));
      json({
        ...planTasks(
          spec.tasks,
          markers.flatMap((m) => m.criticalOpen),
        ),
        issues: spec.issues,
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
      json(composeBrief(ctx.root(), config, spec, task, modelsFor(ctx, harness, task.project), harness, Math.max(1, budget.workers)));
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
      json(loopState(task, spec.execution, modelsFor(ctx, harness, task.project), harness));
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
      json(whereAmI(process.cwd(), expectedPlace(ctx.root(), config, spec)));
    });
}

/** The Leader checkpoint (writes through src/writer). */
function registerCheckpoint(run: Command, ctx: CliContext) {
  run
    .command('checkpoint <spec>')
    .description('Write the checkpoint after a Leader step: progress.yml, an execution row, a task checkbox')
    .option('--task <id>', 'task in progress')
    .option('--phase <phase>', 'implementing | awaiting-review | rework-n')
    .option('--harness <id>', 'harness running the task')
    .option('--model <model>', 'model running the task')
    .option('--next <text>', 'next step', '')
    .option('--question <text...>', 'open questions')
    .option('--verdict <verdict>', `also append an execution row: ${VERDICTS.join(' | ')}`)
    .option('--tier <tier>', 'tier for the execution row')
    .option('--attempt <n>', 'attempt for the execution row', '1')
    .option('--implementer <model>', 'implementer model for the row', '—')
    .option('--reviewer <model>', 'reviewer model for the row', '—')
    .option('--commit <sha>', 'commit for the row', '—')
    .option('--notes <text>', 'notes for the row (reduced independence, provider independence…)', '')
    .option('--done <id>', 'mark a task done in tasks.md')
    .option('--clear', 'no task in progress')
    .option('--deferred <tests|reason>', 'record impacted tests deferred to CI for --task: "<tests, comma separated>|<reason>"')
    .action((ref: string, o: CheckpointOptions) => {
      const { spec } = loadSpec(ctx, ref);
      const now = new Date().toISOString();
      if (o.verdict) appendExecutionRow(spec.dir, spec.name, checkpointRow(o, now));
      if (o.done) markTask(spec.dir, o.done, true);
      const current =
        o.clear || !o.task
          ? null
          : { task: o.task, phase: o.phase ?? 'implementing', harness: o.harness ?? 'unknown', model: o.model ?? 'unknown' };
      writeProgress(spec.dir, {
        schema_version: 1,
        spec: spec.name,
        updated_at: now,
        current,
        open_questions: o.question ?? spec.progress?.open_questions ?? [],
        next_step: o.next ?? '',
        deferred_to_ci: [...(spec.progress?.deferred_to_ci ?? []), ...deferredEntry(o)],
      });
      json({ written: true, spec: spec.name, current });
    });
}

/** Resource budget, impact selection and queued test runs (the one script that executes). */
function registerTestRuns(run: Command, ctx: CliContext) {
  run
    .command('resources')
    .description('Cores, free memory and load, and the test budget they allow')
    .option('--project <name>', 'apply this project resources override')
    .option('--kind <kind>', 'unit | e2e', 'unit')
    .action((opts: { project?: string; kind: 'unit' | 'e2e' }) => {
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
    .action(async (name: string, files: string[], opts: { full?: boolean; queueWait: string }) => {
      const config = readConfig(ctx.root());
      const project = projectNamed(ctx, name);
      const budget = decideBudget(probeMachine(), effectiveResources(config.resources, project.resources), 'unit');
      const impact = impactFor(ctx, project, files);
      const template = opts.full ? project.gates.test : impact.command;
      const command = template ? fillCommand(template, opts.full ? [] : impact.files, Math.max(1, budget.workers)) : undefined;
      const result = await runTests(ctx.root(), `${name} tests`, command, budget, Number(opts.queueWait) * 1000);
      json({ ...result, impact: opts.full ? 'full suite' : impact.source });
      if (result.status !== 'PASS') process.exitCode = 1;
    });
}

/** Read-only spec scripts: JSON on stdout for the commands to read. */
export function registerSpecScripts(run: Command, ctx: CliContext) {
  registerPlanning(run, ctx);
  registerTaskScripts(run, ctx);
  registerState(run, ctx);
}

/** Scripts that write (checkpoint) or execute (tests): the documented exceptions (ADR 0020). */
export function registerSpecWriters(run: Command, ctx: CliContext) {
  registerCheckpoint(run, ctx);
  registerTestRuns(run, ctx);
}
