import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { readRecommendations, resolveWorkspaceModels } from '../models/load.js';
import { branchingFor } from '../scripts/branching.js';
import { appendExecutionRow, markTask, writeProgress } from '../scripts/checkpoint.js';
import { changedFiles, commitPending, repoRoot } from '../scripts/commits.js';
import { agentIdentity, type Identity, identityCell, identityNotes } from '../scripts/identity.js';
import { changedRedTests } from '../scripts/red.js';
import { isReviewProcess, REVIEW_PROCESSES, reviewerInstructions, reviewPrompt, runReview, taskDiff } from '../scripts/review.js';
import { findSpec, readSpec, type SpecFolder } from '../scripts/spec.js';
import { type ExecutionRow, NOTE_FLAGS, type Progress, VERDICTS } from '../spec/index.js';
import { writeText } from '../writer/files.js';
import type { CliContext } from './context.js';
import { registerClose } from './run-close.js';
import { registerDiagram } from './run-diagram.js';
import { registerRed } from './run-red.js';

const json = (value: unknown) => console.log(JSON.stringify(value, null, 2));

function loadSpec(ctx: CliContext, ref: string) {
  const config = readConfig(ctx.root());
  return { config, spec: readSpec(findSpec(ctx.root(), config, ref)) };
}

interface CheckpointOptions {
  task?: string;
  nextTask?: string;
  phase?: string;
  harness?: string;
  model?: string;
  next?: string;
  question?: string[];
  verdict?: (typeof VERDICTS)[number];
  tier?: string;
  attempt: string;
  implementer?: string;
  reviewer?: string;
  claimedImplementer?: string;
  claimedReviewer?: string;
  notes: string;
  done?: string;
  clear?: boolean;
  deferred?: string;
  pendingCommit?: string;
}

/** `--deferred "a, b|low memory"` → one deferred_to_ci entry for the task. */
function deferredEntry(o: CheckpointOptions) {
  if (!o.deferred) return [];
  const [tests = '', reason = 'not given'] = o.deferred.split('|');
  const list = tests
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  return [{ task: o.task ?? '—', tests: list, reason: reason.trim() }];
}

/** On REPORTED and on a verdict: red tests that changed since they were recorded red (ADR 0022). */
function redNotes(spec: SpecFolder, o: CheckpointOptions): string[] {
  if (!o.task || !o.verdict || o.verdict === 'STARTED' || o.verdict === 'RED') return [];
  const changed = changedRedTests(repoRoot(spec.dir), spec.progress, o.task);
  return changed.length ? [`${NOTE_FLAGS.redTestChanged}: ${changed.join(', ')}`] : [];
}

/** Implementer and reviewer cells come from the agent files the harness loads, never from a model's claim. */
function checkpointRow(root: string, spec: SpecFolder, o: CheckpointOptions, now: string): ExecutionRow {
  const harness = o.harness ?? '—';
  const implementer = o.implementer ? agentIdentity(root, o.implementer, harness) : undefined;
  const reviewer = o.reviewer ? agentIdentity(root, o.reviewer, harness) : undefined;
  const notes = [
    ...identityNotes('implementer', implementer, o.claimedImplementer),
    ...identityNotes('reviewer', reviewer, o.claimedReviewer),
    ...(implementer && reviewer && implementer.harness !== reviewer.harness ? [NOTE_FLAGS.providerIndependence] : []),
    ...redNotes(spec, o),
    ...(o.notes ? [o.notes] : []),
  ];
  return {
    date: now.slice(0, 10),
    task: o.task ?? '—',
    attempt: Number(o.attempt),
    tier: o.tier ?? '—',
    harness,
    implementer: identityCell(implementer),
    reviewer: identityCell(reviewer),
    verdict: o.verdict!,
    notes: notes.join('; '),
  };
}

/** A PASS queued for its commit: the task's changed files now, minus those queued before it. */
function pendingEntry(spec: SpecFolder, o: CheckpointOptions): Progress['pending_commits'] {
  if (!o.pendingCommit) return [];
  if (!o.task || (o.verdict !== 'PASS' && o.verdict !== 'DEFERRED_TO_CI'))
    throw new Error('--pending-commit needs --task and a PASS verdict');
  const queued = new Set(spec.progress?.pending_commits.flatMap((p) => p.files) ?? []);
  const files = changedFiles(repoRoot(spec.dir), spec.dir).filter((f) => !queued.has(f));
  return [{ task: o.task, subject: o.pendingCommit, files }];
}

function writeCheckpoint(ctx: CliContext, spec: SpecFolder, o: CheckpointOptions) {
  const now = new Date().toISOString();
  const pending = pendingEntry(spec, o);
  if (o.verdict) appendExecutionRow(spec.dir, spec.name, checkpointRow(ctx.root(), spec, o, now));
  if (o.done) markTask(spec.dir, o.done, true);
  const inProgress = o.nextTask ?? o.task;
  const current =
    o.clear || !inProgress
      ? null
      : { task: inProgress, phase: o.phase ?? 'implementing', harness: o.harness ?? 'unknown', model: o.model ?? 'unknown' };
  writeProgress(spec.dir, {
    schema_version: 1,
    spec: spec.name,
    updated_at: now,
    current,
    open_questions: o.question ?? spec.progress?.open_questions ?? [],
    next_step: o.next ?? '',
    deferred_to_ci: [...(spec.progress?.deferred_to_ci ?? []), ...deferredEntry(o)],
    // Red tests stay recorded across checkpoints: they are what a later change is compared with (ADR 0022).
    red_tests: spec.progress?.red_tests ?? [],
    pending_commits: [...(spec.progress?.pending_commits ?? []), ...pending],
  });
  return {
    written: true,
    spec: spec.name,
    current,
    pendingCommits: [...(spec.progress?.pending_commits ?? []), ...pending].map((p) => p.task),
  };
}

/** The Leader checkpoint (writes through src/writer). */
function registerCheckpoint(run: Command, ctx: CliContext) {
  run
    .command('checkpoint <spec>')
    .description('Write the checkpoint after a Leader step: progress.yml, an execution row, a task checkbox')
    .option('--task <id>', 'the task this step is about (the execution row and the task in progress)')
    .option('--next-task <id>', 'after recording the row, the task now in progress (default: --task)')
    .option('--phase <phase>', 'implementing | awaiting-review | rework-n')
    .option('--harness <id>', 'harness running the Leader')
    .option('--model <model>', 'model running the Leader session')
    .option('--next <text>', 'next step', '')
    .option('--question <text...>', 'open questions')
    .option('--verdict <verdict>', `also append an execution row: ${VERDICTS.join(' | ')}`)
    .option('--tier <tier>', 'tier for the execution row')
    .option('--attempt <n>', 'attempt for the execution row', '1')
    .option('--implementer <agent>', 'agent that implemented: mandao-implementer-<tier>[@<harness>] or self')
    .option('--reviewer <agent>', 'agent that reviewed: mandao-reviewer[@<harness>] or self')
    .option('--claimed-implementer <model>', 'model the implementer said it was (a mismatch is flagged)')
    .option('--claimed-reviewer <model>', 'model the reviewer said it was (a mismatch is flagged)')
    .option('--notes <text>', 'notes for the row (advisories, deferred tests…)', '')
    .option('--done <id>', 'mark a task done in tasks.md')
    .option('--clear', 'no task in progress')
    .option('--deferred <tests|reason>', 'record impacted tests deferred to CI for --task: "<tests, comma separated>|<reason>"')
    .option('--pending-commit <subject>', 'with a PASS: queue the task commit with this subject for `mandao run commit`')
    .action((ref: string, o: CheckpointOptions) => {
      const { spec } = loadSpec(ctx, ref);
      json(writeCheckpoint(ctx, spec, o));
    });
}

/** `mandao run commit`: the pending task commits, one each, with trailers. Local only. */
function registerCommit(run: Command, ctx: CliContext) {
  run
    .command('commit <spec>')
    .description('Commit the tasks that passed review and wait for their commit, one commit per task (never pushes)')
    .option('--trailer <text...>', 'extra trailers, e.g. "Co-Authored-By: …"')
    .action((ref: string, opts: { trailer?: string[] }) => {
      const { config, spec } = loadSpec(ctx, ref);
      if (!spec.story || !spec.progress) throw new Error(`${spec.name} needs story.md and progress.yml`);
      const result = commitPending({
        repo: repoRoot(spec.dir),
        specDir: spec.dir,
        config,
        story: spec.story,
        tasks: spec.tasks,
        progress: spec.progress,
        trailers: opts.trailer ?? [],
        protectedBranches: branchingFor(config).protected,
      });
      json(result);
      if (result.error) process.exitCode = 1;
    });
}

/** The row for a process review: identity from the command line Mandao ran. */
function reviewRow(spec: SpecFolder, task: string, identity: Identity, verdict: 'PASS' | 'FAIL', reviewFile: string): ExecutionRow {
  const own = spec.execution.filter((r) => r.task === task);
  const reported = [...own].reverse().find((r) => r.verdict === 'REPORTED');
  const notes = [
    ...(reported && reported.harness !== identity.harness ? [NOTE_FLAGS.providerIndependence] : []),
    `read-only ${identity.harness} process; review in ${reviewFile}`,
  ];
  return {
    date: new Date().toISOString().slice(0, 10),
    task,
    attempt: reported?.attempt ?? Math.max(1, ...own.map((r) => r.attempt)),
    tier: reported?.tier ?? '—',
    harness: identity.harness,
    implementer: reported?.implementer ?? '—',
    reviewer: identityCell(identity),
    verdict,
    notes: notes.join('; '),
  };
}

/** `mandao run review --via <harness>`: a review in another harness, as a read-only process (ADR 0021). */
function registerReview(run: Command, ctx: CliContext) {
  run
    .command('review <spec> <task>')
    .description('Review a reported task in another harness as a read-only process and record the verdict')
    .requiredOption('--via <harness>', `harness that reviews: ${REVIEW_PROCESSES.join(' | ')}`)
    .requiredOption('--gates <file>', 'file with the gate and impacted-test results the Leader ran')
    .requiredOption('--brief <file>', 'the task brief (`mandao run brief` output)')
    .action((ref: string, task: string, opts: { via: string; gates: string; brief: string }) => {
      if (!isReviewProcess(opts.via)) throw new Error(`--via must be one of ${REVIEW_PROCESSES.join(', ')}`);
      const { config, spec } = loadSpec(ctx, ref);
      const reviewer = resolveWorkspaceModels(ctx.root(), config, readRecommendations())[opts.via]?.reviewer;
      if (!reviewer) throw new Error(`No reviewer model for ${opts.via}: run \`mandao models\``);
      for (const f of [opts.gates, opts.brief]) if (!existsSync(f)) throw new Error(`${f} does not exist`);
      const prompt = reviewPrompt(
        reviewerInstructions(ctx.root(), opts.via),
        JSON.parse(readFileSync(opts.brief, 'utf8')),
        taskDiff(repoRoot(spec.dir), spec.dir),
        readFileSync(opts.gates, 'utf8'),
      );
      const r = runReview(opts.via, ctx.root(), reviewer, prompt);
      const attempt = Math.max(1, ...spec.execution.filter((x) => x.task === task).map((x) => x.attempt));
      const file = join(spec.dir, 'reviews', `${task}-${attempt}-${opts.via}.md`);
      writeText(file, r.output);
      const rel = relative(ctx.root(), file);
      if (r.verdict) appendExecutionRow(spec.dir, spec.name, reviewRow(spec, task, r.identity, r.verdict, rel));
      json({ verdict: r.verdict ?? null, reviewer: r.identity, review: rel, exitCode: r.exitCode, recorded: Boolean(r.verdict) });
      if (!r.verdict) process.exitCode = 1;
    });
}

/** Scripts that write the ledger (checkpoint), commit (commit) or launch a reviewer (review): ADR 0021. */
export function registerLedger(run: Command, ctx: CliContext) {
  registerCheckpoint(run, ctx);
  registerCommit(run, ctx);
  registerReview(run, ctx);
  registerRed(run, ctx);
  registerDiagram(run, ctx);
  registerClose(run, ctx);
}
