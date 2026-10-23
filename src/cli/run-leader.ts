import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Command } from 'commander';
import { type Config, projectGate } from '../schemas/index.js';
import { composeBrief } from '../scripts/brief.js';
import { writeProgress } from '../scripts/checkpoint.js';
import { changedFiles, changeManifest, commitState, renderChangeManifest, repoRoot } from '../scripts/commits.js';
import { runWithGateReceipt } from '../scripts/gate-receipts.js';
import { GATE_ORDER, type GateResult, gateResult, gatesLog, gatesPassed, gatesSection, recordUnrun } from '../scripts/gates.js';
import { fillCommand, isTestFile, unmarkedScanners } from '../scripts/impact.js';
import { deletedTests } from '../scripts/red.js';
import { decideBudget, effectiveResources, probeMachine } from '../scripts/resources.js';
import { reviewDiff } from '../scripts/review.js';
import { inProjectDir, runTests } from '../scripts/run-tests.js';
import { securityGateCommand } from '../scripts/security-gates.js';
import type { SpecFolder } from '../scripts/spec.js';
import { cachePath, logPath, logSections, readApprovalLog, specLogInCache, writeLogSection } from '../scripts/spec-log.js';
import { specSpend } from '../scripts/spend.js';
import { measureGate } from '../scripts/telemetry.js';
import { LOOP_BRAKE_LIMIT, type LoopState, loopState, observeLoop, type Task, timeline } from '../spec/index.js';
import { onPath } from '../util/which.js';
import { writeText } from '../writer/files.js';
import { budgetFor } from './budget.js';
import type { CliContext } from './context.js';
import { implementSummary } from './implement-summary.js';
import { json } from './json.js';
import { currentAttempt, taskOf } from './leader-utils.js';
import { type CheckpointOptions, withCheckpointOptions, writeCheckpoint } from './run-ledger.js';
import { stepCut, verifyCut } from './session-advice.js';
import { harnessOption, impactFor, loadSpec, loopContext, modelsFor } from './spec-context.js';

const DEP_MANIFEST =
  /(^|\/)(package\.json|pnpm-lock\.yaml|package-lock\.json|yarn\.lock|requirements[^/]*\.txt|pyproject\.toml|go\.mod|Cargo\.toml|pom\.xml|build\.gradle(\.kts)?|Gemfile|composer\.json)$/;

function gateCommand(
  ctx: CliContext,
  gate: string,
  project: ReturnType<typeof loadSpec>['config']['projects'][number],
  changed: string[],
  workers: number,
  task: Task,
) {
  if (gate === 'test') {
    const impact = impactFor(ctx, project, changed);
    return impact.command ? fillCommand(impact.command, impact.files, workers) : undefined;
  }
  return securityGateCommand(gate, projectGate(project, gate), task.risk_tags.includes('security'), onPath);
}

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
    const command = gateCommand(ctx, gate, project, changed, workers, task);
    if (!command) {
      recordUnrun(gate, project, results, notConfigured);
      continue;
    }
    const execution = await executeGate(ctx, config, spec, task, project, gate, command, changed, force);
    results.push(execution.result);
    if (execution.output) outputs[gate] = execution.output;
  }
  const full = gatesLog(task.id, attempt, results, outputs, notConfigured);
  const rel = (f: string) => relative(ctx.root(), f).split('\\').join('/');
  if (!specLogInCache(spec.dir)) {
    const file = join(logPath(spec.dir, 'gates'), `${task.id}-${attempt}.md`);
    writeText(file, full);
    return { results, notConfigured, log: rel(file) };
  }
  // Version 2: the whole output in the local cache, the table and the task's failing lines in gates.md.
  const cached = gatesCacheFile(spec, task.id, attempt);
  writeText(cached, full);
  const logged = logSections(spec.dir, 'gates.md');
  const earlier = Array.from({ length: attempt - 1 }, (_, i) => attempt - 1 - i).flatMap((k) => {
    const section = logged.get(attemptTitle(task.id, k));
    return section === undefined ? [] : [{ attempt: k, section }];
  });
  const section = gatesSection(results, outputs, notConfigured, task.files ?? [], earlier);
  const file = writeLogSection(spec.dir, 'gates.md', attemptTitle(task.id, attempt), section);
  return { results, notConfigured, log: rel(file), output: rel(cached) };
}

async function executeGate(
  ctx: CliContext,
  config: Config,
  spec: SpecFolder,
  task: Task,
  project: Config['projects'][number],
  gate: (typeof GATE_ORDER)[number],
  command: string,
  changed: string[],
  force?: boolean,
): Promise<{ result: GateResult; output?: string }> {
  const kind = gate === 'build' ? 'build' : 'unit';
  const budget = budgetFor(ctx.root(), config, project, kind, `${task.id} ${gate}`, force, spec.dir);
  const selectedTests = gate === 'test' ? impactFor(ctx, project, changed).files : [];
  const run = await runWithGateReceipt(
    {
      root: repoRoot(spec.dir),
      project: project.name,
      gate,
      command,
      configuration: config,
      selectedTests,
      budget,
      projectRoot: project.path === '.' ? ctx.root() : join(ctx.root(), project.path),
      force,
    },
    () =>
      measureGate(spec.dir, spec.name, gate, () =>
        runTests(ctx.root(), `${task.id} ${gate}`, inProjectDir(command, project.path), budget, undefined, { keepOutput: true }),
      ),
  );
  return { result: gateResult(gate, run), ...(run.output ? { output: run.output } : {}) };
}

const attemptTitle = (task: string, attempt: number) => `${task} — attempt ${attempt}`;
const gatesCacheFile = (spec: SpecFolder, task: string, attempt: number) => cachePath(spec.dir, 'gates', `${task}-${attempt}.md`);

/** The gate results the Reviewer reads (verdict line and status table), and where the full output is. */
export function recordedGates(spec: SpecFolder, id: string, attempt: number): { table?: string; full: string } {
  if (!specLogInCache(spec.dir)) {
    const file = join(logPath(spec.dir, 'gates'), `${id}-${attempt}.md`);
    const table = existsSync(file) ? readFileSync(file, 'utf8').split('\n## Output')[0]! : undefined;
    return { ...(table ? { table } : {}), full: relative(spec.dir, file).split('\\').join('/') };
  }
  const section = logSections(spec.dir, 'gates.md').get(attemptTitle(id, attempt));
  const full = relative(repoRoot(spec.dir), gatesCacheFile(spec, id, attempt))
    .split('\\')
    .join('/');
  if (section === undefined) return { full };
  return { table: `# Gates — ${id}, attempt ${attempt}\n\n${section.split('\n### ')[0]!.trimEnd()}\n`, full };
}

function registerGates(run: Command, ctx: CliContext) {
  run
    .command('gates <spec> <task>')
    .description(
      "Run the task's level 0 gates and impacted tests; pass/fail and the failure excerpt, full output in _log/gates/ (version 2: .mandao/cache/<ID>/)",
    )
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
  const recommendation = loopState(task, spec.execution, models, harness, context);
  const spend = specSpend(spec.dir, config.budget.per_spec);
  const waitingBudget = spend.status === 'over' && NEEDS_BRIEF.includes(recommendation.action);
  const observation = observeLoop(
    spec.progress?.loop_brake,
    id,
    recommendation.action,
    spec.execution.length,
    readApprovalLog(spec.dir).length,
  );
  const loop = loopWithBrake(recommendation, observation.repeats, waitingBudget);
  if (!waitingBudget) persistLoopObservation(spec, observation);
  // Past the cap with no authorization recorded: no delegation, and the request waits for a person.
  if (waitingBudget) {
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

function loopWithBrake(recommendation: LoopState, repeats: number, waitingBudget: boolean): LoopState {
  if (repeats < LOOP_BRAKE_LIMIT || waitingBudget) return recommendation;
  return {
    ...recommendation,
    action: 'halt',
    reason: `same action ${recommendation.action} returned ${repeats} times without execution-log progress`,
  };
}

function persistLoopObservation(spec: SpecFolder, observation: NonNullable<SpecFolder['progress']>['loop_brake']) {
  writeProgress(spec.dir, {
    ...(spec.progress ?? { schema_version: 1 as const, spec: spec.name, updated_at: '', current: null }),
    updated_at: new Date().toISOString(),
    loop_brake: observation,
  });
}

function registerReviewPack(run: Command, ctx: CliContext) {
  run
    .command('review-pack <spec> <task>')
    .description('Write the brief, gates and diff the Reviewer reads; print the pack path')
    .option('--harness <id>', 'harness running the Leader', 'claude')
    .action((ref: string, id: string, o: { harness?: string }) => {
      json(createReviewPack(ctx, ref, id, o.harness));
    });
}

function createReviewPack(ctx: CliContext, ref: string, id: string, requestedHarness?: string) {
  const { config, spec } = loadSpec(ctx, ref);
  const task = taskOf(spec, id);
  const harness = harnessOption(requestedHarness);
  const attempt = currentAttempt(spec, id);
  const recorded = recordedGates(spec, id, attempt);
  const gates = recorded.table ?? 'No gate results recorded for this attempt: run `mandao run gates` first.';
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
  const manifest = changeManifest(repoRoot(spec.dir), spec.dir);
  const removedTests = deletedTests(repoRoot(spec.dir), spec.progress, id);
  const deletionReason = [...spec.execution]
    .reverse()
    .find((row) => row.task === id && row.notes.includes('test deletion:'))
    ?.notes.match(/(?:^|; )test deletion: ([^;]+)/)?.[1];
  const pack = reviewPackContent(
    id,
    attempt,
    recorded.full,
    brief,
    manifest,
    removedTests,
    deletionReason,
    gates,
    reviewDiff(repoRoot(spec.dir), spec.dir, ctx.root()),
  );
  // Nothing reads a pack back (design P1): version 2 keeps it in the local cache, outside git.
  const name = `${id}-${attempt}-pack.md`;
  const file = specLogInCache(spec.dir) ? cachePath(spec.dir, 'reviews', name) : join(logPath(spec.dir, 'reviews'), name);
  writeText(file, pack);
  return {
    pack: relative(ctx.root(), file).split('\\').join('/'),
    bytes: Buffer.byteLength(pack),
    gatesRecorded: recorded.table !== undefined,
  };
}

function reviewPackContent(
  id: string,
  attempt: number,
  full: string,
  brief: unknown,
  manifest: ReturnType<typeof changeManifest>,
  removedTests: ReturnType<typeof deletedTests>,
  deletionReason: string | undefined,
  gates: string,
  diff: string,
): string {
  return [
    `# Review pack — ${id}, attempt ${attempt}`,
    '',
    'Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in',
    `\`${full}\`.`,
    '',
    '## Brief',
    '',
    '```json',
    JSON.stringify(brief, null, 2),
    '```',
    '',
    '## Mandao change manifest',
    '',
    'Exact changed paths, working-tree statuses, and SHA-256 content hashes reviewed below:',
    '',
    '```json',
    renderChangeManifest(manifest),
    '```',
    '',
    ...(removedTests.length
      ? [
          '## Removed test cases',
          '',
          `Reason recorded by the Leader: ${deletionReason ?? 'missing; block review and request one'}`,
          '',
          '```json',
          JSON.stringify(removedTests, null, 2),
          '```',
          '',
        ]
      : []),
    gates.replace(/^# /m, '## '),
    '',
    '## Diff',
    '',
    '```diff',
    diff,
    '```',
    '',
  ].join('\n');
}

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
