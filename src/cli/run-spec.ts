import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from 'commander';
import { ADAPTERS } from '../adapters/index.js';
import { principlesForProjects } from '../engine/constitution-principles.js';
import { readConfig } from '../engine/files.js';
import { branchingFor, branchNames, currentBranch, detectBranching } from '../scripts/branching.js';
import { composeBrief } from '../scripts/brief.js';
import { commitState } from '../scripts/commits.js';
import { activeSpecDir, recordFullRun } from '../scripts/forced.js';
import { runWithGateReceipt } from '../scripts/gate-receipts.js';
import { fillCommand } from '../scripts/impact.js';
import { type BudgetKind, decideBudget, effectiveResources, probeMachine } from '../scripts/resources.js';
import { runTests } from '../scripts/run-tests.js';
import { checkTransition, expectedPlace, proposeSpec, readLayout, whereAmI } from '../scripts/spec.js';
import { docPath, LITE_DOC, readApprovalLog } from '../scripts/spec-log.js';
import {
  blockingMarkers,
  commitMessage,
  layoutProblems,
  loopState,
  planTasks,
  TASK_KINDS,
  taskIndex,
  taskLayoutIssues,
  timeline,
  trace,
  withIndex,
} from '../spec/index.js';
import { writeText } from '../writer/files.js';
import { nextFor, recordShown } from './approve.js';
import { budgetFor } from './budget.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { registerLedger } from './run-ledger.js';
import { specPremiseFindings } from './run-premise.js';
import { registerVerify } from './run-verify.js';
import { harnessOption, impactFor, loadSpec, loopContext, modelsFor, projectNamed } from './spec-context.js';

/** Spec proposal, traceability and the task plan. */
function registerPlanning(run: Command, ctx: CliContext) {
  run
    .command('spec-new <title...>')
    .description('Propose the id, folder, branch, base and worktree for a new spec')
    .option('--id <id>', 'tracker id (default: the next local id)')
    .option('--type <type>', 'story | bug | …', 'story')
    .option('--project <name>', "polyrepo: use this project's branching model")
    .option('--hotfix', 'hotfix lane: start from branching.hotfix.from with the hotfix prefix')
    .option('--harness <id>', 'the active harness: adds `resume` when --first is given', 'claude')
    .option('--first <command>', 'the mandao to run first in the worktree, e.g. "/mandao-specify <ID>"')
    .action(
      (title: string[], opts: { id?: string; type: string; project?: string; hotfix?: boolean; harness?: string; first?: string }) => {
        const { harness, first, ...options } = opts;
        const proposal = proposeSpec(ctx.root(), readConfig(ctx.root()), title.join(' '), options);
        const active = harnessOption(harness);
        json(first ? { ...proposal, resume: ADAPTERS[active].session.resume(proposal.worktree, first).text } : proposal);
      },
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

function registerTrace(run: Command, ctx: CliContext) {
  run
    .command('trace <spec>')
    .description('AC → FR → scenario → task → test matrix and structural findings')
    .action((ref: string) => {
      const { config, spec } = loadSpec(ctx, ref);
      if (!spec.story || !spec.requirements) return json({ issues: [...spec.issues, 'trace needs story.md and requirements.md'] });
      const layout = readLayout(
        spec.dir,
        principlesForProjects(
          ctx.root(),
          config,
          spec.tasks.map((task) => task.project),
        ),
      );
      const designChecks = layout.designFindings;
      const result = trace(spec.story, spec.requirements, spec.tasks, commitState(spec, config.commits.trailers), designChecks);
      json({
        ...result,
        findings: [...result.findings, ...specPremiseFindings(spec.dir)],
        issues: [
          ...spec.issues,
          ...layout.missing.map((f) => `layout: missing ${f}`),
          ...layout.unexpected.map((f) => `layout: unexpected ${f}`),
        ],
      });
      if (designChecks.length) process.exitCode = 1;
    });
}

/** `mandao run next`: the command that follows from the spec's state. Data only; `--shown` also records what was shown. */
function registerNext(run: Command, ctx: CliContext) {
  run
    .command('next <spec>')
    .description("The command that follows from the spec's state, and the others that can; --shown records the summary shown")
    .option('--shown', 'record the hashes of the documents just shown to the person (the approvals log)')
    .option('--harness <id>', 'active harness for capability-gated research (default: claude)')
    .action((ref: string, o: { shown?: boolean; harness?: string }) => {
      const { config, spec } = loadSpec(ctx, ref);
      if (o.shown) recordShown(spec);
      json(nextFor(ctx.root(), spec, config, harnessOption(o.harness)));
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

/** Close refuses a folder that does not match its layout; an unreadable version is a problem too. */
function closeLayoutProblems(dir: string, principleIds: string[]): string[] {
  try {
    return layoutProblems(readLayout(dir, principleIds));
  } catch (e) {
    return [`layout: ${(e as Error).message}`];
  }
}

/** Spec status changes and the worktree check. */
function registerState(run: Command, ctx: CliContext) {
  run
    .command('status <spec> [to]')
    .description(
      'Check a spec status change (verified needs CI confirmation of deferred runs); without <to>, the status and the timeline (approvals among the execution rows, by date)',
    )
    .option('--ci-confirmed', 'CI passed every DEFERRED_TO_CI run')
    .action((ref: string, to: string | undefined, opts: { ciConfirmed?: boolean }) => {
      const { config, spec } = loadSpec(ctx, ref);
      const from = spec.story?.meta.status ?? 'draft';
      // Read only: the approvals stay in their log and are merged here, never written into execution.md (C-1).
      if (to === undefined) return json({ status: from, timeline: timeline(spec.execution, readApprovalLog(spec.dir)) });
      const problems = checkTransition(from, to, spec.progress, Boolean(opts.ciConfirmed));
      if (to === 'closed')
        problems.push(
          ...closeLayoutProblems(
            spec.dir,
            principlesForProjects(
              ctx.root(),
              config,
              spec.tasks.map((task) => task.project),
            ),
          ),
        );
      json({ from, to, allowed: problems.length === 0, problems });
      if (problems.length) process.exitCode = 1;
    });

  run
    .command('layout <spec>')
    .description('Compare the spec folder with the layout of its version and depth (missing, unexpected)')
    .action((ref: string) => {
      const { config, spec } = loadSpec(ctx, ref);
      const found = readLayout(
        spec.dir,
        principlesForProjects(
          ctx.root(),
          config,
          spec.tasks.map((task) => task.project),
        ),
      );
      json({ ...found });
      if (!found.ok) process.exitCode = 1;
    });

  run
    .command('where <spec>')
    .description('Is this session inside the spec worktree, on its branch? `resume` opens the active harness there')
    .option('--harness <id>', 'the harness running the session', 'claude')
    .option('--first <command>', 'the mandao to run first in the worktree (default: /mandao-implement <spec>)')
    .action((ref: string, opts: { harness?: string; first?: string }) => {
      const harness = harnessOption(opts.harness);
      const { config, spec } = loadSpec(ctx, ref);
      const branch = currentBranch(process.cwd());
      const isProtected = Boolean(branch && branchingFor(config).protected.includes(branch));
      const expected = expectedPlace(ctx.root(), config, spec);
      const first = opts.first ?? `/mandao-implement ${ref}`;
      const resume = ADAPTERS[harness].session.resume(expected.worktree, first).text;
      json({ ...whereAmI(process.cwd(), expected, resume), protected: isProtected });
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
    .option('--full', 'run the full suite (normally CI only); needs --reason, recorded in the spec log')
    .option('--reason <text>', 'why the full suite has to run here and not in CI')
    .option('--queue-wait <s>', 'seconds to wait in the queue', '1800')
    .option('--force', 'run even when the budget defers (recorded; ADR 0024)')
    .action(async (name: string, files: string[], opts: TestsOptions) => {
      const result = await runTestsCommand(ctx, name, files, opts);
      json(result);
      if (result.status !== 'PASS') process.exitCode = 1;
    });
}

interface TestsOptions {
  full?: boolean;
  reason?: string;
  queueWait: string;
  force?: boolean;
}

/** MDO-0007: the Leader ran the whole suite locally. Without files there is nothing to select. */
export function checkTestsRequest(files: string[], opts: Pick<TestsOptions, 'full' | 'reason'>) {
  if (!opts.full && !files.length) throw new Error('give the changed files: the full suite runs in CI, or here with --full --reason');
  if (opts.full && !opts.reason?.trim()) throw new Error('--full needs --reason "<why the full suite must run here, not in CI>"');
}

async function runTestsCommand(ctx: CliContext, name: string, files: string[], opts: TestsOptions) {
  checkTestsRequest(files, opts);
  const config = readConfig(ctx.root());
  const project = projectNamed(ctx, name);
  const budget = budgetFor(ctx.root(), config, project, 'unit', `${name} tests`, opts.force);
  const impact = impactFor(ctx, project, files);
  const template = opts.full ? project.gates.test : impact.command;
  const command = template ? fillCommand(template, opts.full ? [] : impact.files, Math.max(1, budget.workers)) : undefined;
  const result = await runWithGateReceipt(
    {
      root: ctx.root(),
      project: name,
      gate: opts.full ? 'test-full' : 'test',
      command: command ?? '',
      configuration: config,
      selectedTests: opts.full ? [] : impact.files,
      budget,
      projectRoot: project.path === '.' ? ctx.root() : join(ctx.root(), project.path),
      force: opts.force,
    },
    () => runTests(ctx.root(), `${name} tests`, command, budget, Number(opts.queueWait) * 1000),
  );
  if (!opts.full) return { ...result, impact: impact.source };
  const record = { at: new Date().toISOString(), project: name, reason: opts.reason?.trim() ?? '', status: result.status };
  recordFullRun(ctx.root(), record, activeSpecDir(ctx.root(), config));
  return { ...result, impact: 'full suite' };
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
      const result = await runWithGateReceipt(
        {
          root: ctx.root(),
          project: name,
          gate: 'build',
          command: project.gates.build,
          configuration: config,
          selectedTests: [],
          budget,
          projectRoot: project.path === '.' ? ctx.root() : join(ctx.root(), project.path),
          force: opts.force,
        },
        () => runTests(ctx.root(), `${name} build`, project.gates.build, budget),
      );
      json({ ...result, status: result.status === 'DEFERRED_TO_CI' ? 'DEFERRED' : result.status });
      if (result.status !== 'PASS') process.exitCode = 1;
    });
}

/** Read-only spec scripts: JSON on stdout for the commands to read. */
export function registerSpecScripts(run: Command, ctx: CliContext) {
  registerPlanning(run, ctx);
  registerTrace(run, ctx);
  registerTaskScripts(run, ctx);
  registerState(run, ctx);
  registerVerify(run, ctx);
}

/** Scripts that write, commit or execute: the documented exceptions (ADR 0020, ADR 0021). */
export function registerSpecWriters(run: Command, ctx: CliContext) {
  registerLedger(run, ctx);
  registerTestRuns(run, ctx);
  registerBuild(run, ctx);
  registerNext(run, ctx);
}
