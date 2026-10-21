import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Command } from 'commander';
import { composeBrief } from '../scripts/brief.js';
import { changedFiles, commitState, repoRoot } from '../scripts/commits.js';
import { GATE_ORDER, type GateResult, gateResult, gatesLog, gatesPassed } from '../scripts/gates.js';
import { fillCommand, isTestFile, unmarkedScanners } from '../scripts/impact.js';
import { decideBudget, effectiveResources, probeMachine } from '../scripts/resources.js';
import { taskDiff } from '../scripts/review.js';
import { runTests } from '../scripts/run-tests.js';
import type { SpecFolder } from '../scripts/spec.js';
import { logPath, readApprovalLog } from '../scripts/spec-log.js';
import { specSpend } from '../scripts/spend.js';
import {
  type ExecutionRow,
  type LoopState,
  loopState,
  NOTE_FLAGS,
  securityMentions,
  type Task,
  taskAttempt,
  timeline,
} from '../spec/index.js';
import { writeText } from '../writer/files.js';
import { budgetFor } from './budget.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { type CheckpointOptions, withCheckpointOptions, writeCheckpoint } from './run-ledger.js';
import { stepCut, verifyCut } from './session-advice.js';
import { harnessOption, impactFor, loadSpec, loopContext, modelsFor } from './spec-context.js';

/**
 * Leader scripts (cost-conscious design): the mechanical part of a Leader step runs here and returns only
 * what the Leader decides on. Full outputs stay in `_log/` for the Reviewer and verify.
 */

const DEP_MANIFEST =
  /(^|\/)(package\.json|pnpm-lock\.yaml|package-lock\.json|yarn\.lock|requirements[^/]*\.txt|pyproject\.toml|go\.mod|Cargo\.toml|pom\.xml|build\.gradle(\.kts)?|Gemfile|composer\.json)$/;

const currentAttempt = (spec: SpecFolder, task: string) => taskAttempt(spec.execution, task);

function taskOf(spec: SpecFolder, id: string): Task {
  const task = spec.tasks.find((t) => t.id === id);
  if (!task) throw new Error(`No ${id} in ${spec.name}`);
  return task;
}

/** The project's command for one gate, run from the project path with stderr kept; undefined when not set. */
function gateCommand(
  ctx: CliContext,
  gate: string,
  project: ReturnType<typeof loadSpec>['config']['projects'][number],
  changed: string[],
  workers: number,
) {
  if (gate === 'test') {
    const impact = impactFor(ctx, project, changed);
    return impact.command ? fillCommand(impact.command, impact.files, workers) : undefined;
  }
  return project.gates[gate as keyof typeof project.gates];
}

const inProject = (cmd: string, path: string) => `${path === '.' ? '' : `cd ${JSON.stringify(path)} && `}${cmd} 2>&1`;

/** Built-in gate: changed tests that list folders must say what they scan (`mandao-scans:`), MDO-0007. */
function scanMarkers(repo: string, changed: string[]): GateResult | undefined {
  if (!changed.some(isTestFile)) return undefined;
  const unmarked = unmarkedScanners(repo, changed);
  if (!unmarked.length) return { gate: 'scan-markers', status: 'PASS' };
  const lines = unmarked.map(
    (u) =>
      `${u.file}:${u.line} lists folders; add a first-line comment \`mandao-scans: <folders it reads>\` (or \`none\` for its own temp folders)`,
  );
  return { gate: 'scan-markers', status: 'FAIL', excerpt: lines.join('\n') };
}

async function runGates(ctx: CliContext, spec: SpecFolder, task: Task, attempt: number, force?: boolean) {
  const { config } = loadSpec(ctx, spec.name);
  const project = config.projects.find((p) => p.name === task.project) ?? config.projects[0]!;
  const changed = changedFiles(repoRoot(spec.dir), spec.dir);
  const workers = Math.max(1, decideBudget(probeMachine(), effectiveResources(config.resources, project.resources), 'unit').workers);
  const results: GateResult[] = [];
  const outputs: Record<string, string> = {};
  const notConfigured: string[] = [];
  const scans = scanMarkers(repoRoot(spec.dir), changed);
  if (scans) results.push(scans);
  for (const gate of GATE_ORDER) {
    if (gate === 'audit' && !changed.some((f) => DEP_MANIFEST.test(f))) {
      results.push({ gate, status: 'SKIPPED', reason: 'no dependency change' });
      continue;
    }
    const command = gateCommand(ctx, gate, project, changed, workers);
    if (!command) {
      notConfigured.push(gate);
      continue;
    }
    const kind = gate === 'build' ? 'build' : 'unit';
    const budget = budgetFor(ctx.root(), config, project, kind, `${task.id} ${gate}`, force, spec.dir);
    const run = await runTests(ctx.root(), `${task.id} ${gate}`, inProject(command, project.path), budget, undefined, { keepOutput: true });
    results.push(gateResult(gate, run));
    if (run.output) outputs[gate] = run.output;
  }
  const file = join(logPath(spec.dir, 'gates'), `${task.id}-${attempt}.md`);
  writeText(file, gatesLog(task.id, attempt, results, outputs, notConfigured));
  return { results, notConfigured, log: relative(ctx.root(), file).split('\\').join('/') };
}

function registerGates(run: Command, ctx: CliContext) {
  run
    .command('gates <spec> <task>')
    .description("Run the task's level 0 gates and impacted tests; pass/fail and the failure excerpt, full output in _log/gates/")
    .option('--force', 'run even when the budget defers (recorded; ADR 0024)')
    .action(async (ref: string, id: string, o: { force?: boolean }) => {
      const { spec } = loadSpec(ctx, ref);
      const task = taskOf(spec, id);
      const attempt = currentAttempt(spec, id);
      const r = await runGates(ctx, spec, task, attempt, o.force);
      const passed = gatesPassed(r.results);
      json({ task: id, attempt, passed, results: r.results, notConfigured: r.notConfigured, log: r.log });
      if (!passed) process.exitCode = 1;
    });
}

/** Actions after which the Leader delegates to an Implementer or Tester and needs the brief. */
const NEEDS_BRIEF: LoopState['action'][] = ['write-red-tests', 'implement', 'resume-implementation', 'rework'];

function registerStep(run: Command, ctx: CliContext) {
  withCheckpointOptions(
    run
      .command('step <spec> <task>')
      .description('One Leader step: write the checkpoint (when given), then the next action, and the brief when delegating'),
  )
    .option('--no-brief', 'never include the brief')
    .action((ref: string, id: string, o: CheckpointOptions & { brief: boolean }) => json(leaderStep(ctx, ref, id, o)));
}

/** The step's checkpoint, next action, budget stop, session advice and brief. */
function leaderStep(ctx: CliContext, ref: string, id: string, o: CheckpointOptions & { brief: boolean }) {
  const loaded = loadSpec(ctx, ref);
  const writes = Boolean(o.verdict || o.done || o.clear || o.pendingCommit || o.phase || o.next);
  const checkpoint = writes ? writeCheckpoint(ctx, loaded.spec, { ...o, task: o.task ?? id }) : undefined;
  const { config, spec } = writes ? loadSpec(ctx, ref) : loaded;
  const task = taskOf(spec, id);
  const harness = harnessOption(o.harness);
  const models = modelsFor(ctx, harness, task.project);
  const context = loopContext(ctx, spec, id, harness, task.project);
  const loop = loopState(task, spec.execution, models, harness, context);
  const spend = specSpend(spec.dir, config.budget.per_spec);
  // Past the cap with no authorization recorded: no delegation, and the request waits for a person.
  if (spend.status === 'over' && NEEDS_BRIEF.includes(loop.action)) {
    const id = spec.story?.meta.id ?? spec.name;
    const reason = `spent $${spend.total} of $${spend.budget}: a person authorizes more with \`mandao approve ${id} budget --to <usd>\``;
    return { ...(checkpoint ? { checkpoint: { written: true } } : {}), loop: { ...loop, action: 'await-budget', reason }, spend };
  }
  const withBrief = o.brief && NEEDS_BRIEF.includes(loop.action);
  const project = config.projects.find((p) => p.name === task.project);
  const workers = Math.max(1, decideBudget(probeMachine(), effectiveResources(config.resources, project?.resources), 'unit').workers);
  const cut = NEEDS_BRIEF.includes(loop.action) ? stepCut(config, spec, id, harness) : undefined;
  return {
    ...(checkpoint ? { checkpoint: { written: true, pendingCommits: checkpoint.pendingCommits } } : {}),
    loop,
    ...(cut ? { session: cut } : {}),
    ...(withBrief ? { brief: composeBrief(ctx.root(), config, spec, task, models, harness, workers, context) } : {}),
  };
}

function registerReviewPack(run: Command, ctx: CliContext) {
  run
    .command('review-pack <spec> <task>')
    .description('Write what the Reviewer reads (brief, gate results, diff) to one file in _log/reviews/; prints its path')
    .option('--harness <id>', 'harness running the Leader', 'claude')
    .action((ref: string, id: string, o: { harness?: string }) => {
      const { config, spec } = loadSpec(ctx, ref);
      const task = taskOf(spec, id);
      const harness = harnessOption(o.harness);
      const attempt = currentAttempt(spec, id);
      const gatesFile = join(logPath(spec.dir, 'gates'), `${id}-${attempt}.md`);
      const gates = existsSync(gatesFile)
        ? readFileSync(gatesFile, 'utf8').split('\n## Output')[0]!
        : 'No gate results recorded for this attempt: run `mandao run gates` first.';
      const brief = composeBrief(
        ctx.root(),
        config,
        spec,
        task,
        modelsFor(ctx, harness, task.project),
        harness,
        1,
        loopContext(ctx, spec, id, harness, task.project),
      );
      const pack = [
        `# Review pack — ${id}, attempt ${attempt}`,
        '',
        'Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in',
        `\`${relative(spec.dir, gatesFile).split('\\').join('/')}\`.`,
        '',
        '## Brief',
        '',
        '```json',
        JSON.stringify(brief, null, 2),
        '```',
        '',
        gates.replace(/^# /m, '## '),
        '',
        '## Diff',
        '',
        '```diff',
        taskDiff(repoRoot(spec.dir), spec.dir),
        '```',
        '',
      ].join('\n');
      const file = join(logPath(spec.dir, 'reviews'), `${id}-${attempt}-pack.md`);
      writeText(file, pack);
      json({
        pack: relative(ctx.root(), file).split('\\').join('/'),
        bytes: Buffer.byteLength(pack),
        gatesRecorded: existsSync(gatesFile),
      });
    });
}

/** What `/mandao-implement` reports at the end, built from the log and git instead of the Leader's memory. */
export function implementSummary(spec: SpecFolder, committed: Set<string>, pending: string[]) {
  const tasks = spec.tasks.map((t) => {
    const rows = spec.execution.filter((r) => r.task === t.id);
    const last = rows.filter((r) => r.verdict !== 'STARTED').at(-1);
    const fails = rows.filter((r) => r.verdict === 'FAIL');
    const flags = [...new Set(rows.flatMap((r) => Object.values(NOTE_FLAGS).filter((f) => r.notes.includes(f))))];
    return {
      id: t.id,
      title: t.title,
      done: t.done,
      attempts: Math.max(0, ...rows.map((r) => r.attempt)),
      verdict: last?.verdict ?? 'not started',
      fails: fails.map((r) => r.notes.match(/FAIL: ([^;]+)/)?.[1] ?? 'reason not recorded'),
      tier: rows.at(-1)?.tier ?? t.tier,
      implementer: [...rows].reverse().find((r) => r.implementer !== '—')?.implementer ?? '—',
      reviewer: [...rows].reverse().find((r) => r.reviewer !== '—')?.reviewer ?? '—',
      committed: committed.has(t.id),
      flags,
    };
  });
  const advisories = countAdvisories(readLog(spec), spec.execution);
  return {
    spec: spec.name,
    tasks,
    totals: {
      tasks: tasks.length,
      done: tasks.filter((t) => t.done).length,
      committed: tasks.filter((t) => t.committed).length,
      fails: tasks.reduce((n, t) => n + t.fails.length, 0),
    },
    pendingCommits: pending,
    deferredToCi: spec.progress?.deferred_to_ci ?? [],
    advisories,
    // Not blocking, but a person reads them (MDO-0008).
    securityMentions: securityMentions(spec.execution),
  };
}

/**
 * Advisories in the log's `## Advisories` section plus those reviewers left in row notes
 * (`Advisories: (1) … (2) …`), which is where MDO-0007 put them all.
 */
export function countAdvisories(log: string, rows: ExecutionRow[]): number {
  const section = (/## Advisories\n([\s\S]*?)(\n## |$)/.exec(log)?.[1] ?? '').split('\n').filter((l) => /^\s*[-*] /.test(l)).length;
  const inNotes = rows.reduce((n, r) => {
    const text = /\badvisor(?:y|ies)\s*:\s*(.*)$/i.exec(r.notes)?.[1];
    if (text === undefined) return n;
    return n + Math.max(1, text.match(/\(\d+\)/g)?.length ?? 0);
  }, 0);
  return section + inNotes;
}

const readLog = (spec: SpecFolder) => {
  const file = logPath(spec.dir, 'execution.md');
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
};

function registerImplementSummary(run: Command, ctx: CliContext) {
  run
    .command('implement-summary <spec>')
    .description('The end-of-implement report from the log and git: per task verdicts, FAIL reasons, identities, commits')
    .option('--harness <id>', 'harness running the Leader', 'claude')
    .action((ref: string, o: { harness?: string }) => {
      const { config, spec } = loadSpec(ctx, ref);
      const state = commitState(spec, config.commits.trailers);
      const cut = verifyCut(spec, harnessOption(o.harness));
      const history = timeline(spec.execution, readApprovalLog(spec.dir));
      json({ ...implementSummary(spec, state.committed, state.pending), timeline: history, ...(cut ? { session: cut } : {}) });
    });
}

export function registerLeader(run: Command, ctx: CliContext) {
  registerGates(run, ctx);
  registerStep(run, ctx);
  registerReviewPack(run, ctx);
  registerImplementSummary(run, ctx);
}
