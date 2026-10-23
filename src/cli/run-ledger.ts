import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Command } from 'commander';
import { LOCK_FILE, readConfig, readLock } from '../engine/files.js';
import { readRecommendations, resolveWorkspaceModels } from '../models/load.js';
import { buildCommand, type Config, declaresNoBuild, type HarnessId } from '../schemas/index.js';
import { branchingFor } from '../scripts/branching.js';
import { appendExecutionRow, markTask, writeProgress } from '../scripts/checkpoint.js';
import { type ChangeManifestEntry, changedFiles, commitPending, commitSpecDocs, reconciledTasks, repoRoot } from '../scripts/commits.js';
import { runWithGateReceipt } from '../scripts/gate-receipts.js';
import { agentIdentity, identityCell, identityNotes } from '../scripts/identity.js';
import { changedRedTests } from '../scripts/red.js';
import type { ReviewScope } from '../scripts/review-scope.js';
import { inProjectDir, runTests } from '../scripts/run-tests.js';
import { findSpec, readSpec, type SpecFolder } from '../scripts/spec.js';
import { specLogInCache } from '../scripts/spec-log.js';
import { type ExecutionRow, emojiPrefix, NOTE_FLAGS, type Progress, parseCloseSummary, taskAttempt, VERDICTS } from '../spec/index.js';
import { budgetFor } from './budget.js';
import { checkPendingSubject, checkReview, recordLogEdits, requireRedFirst, requireTestDeletionReason } from './checkpoint-guards.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { registerClose } from './run-close.js';
import { registerDiagram } from './run-diagram.js';
import { registerMutation } from './run-mutation.js';
import { registerRed } from './run-red.js';
import { registerReview } from './run-review.js';
import { registerTestReview } from './run-test-review.js';

function loadSpec(ctx: CliContext, ref: string) {
  const config = readConfig(ctx.root());
  return { config, spec: readSpec(findSpec(ctx.root(), config, ref)) };
}

export interface CheckpointOptions {
  task?: string;
  nextTask?: string;
  phase?: string;
  harness?: string;
  next?: string;
  question?: string[];
  verdict?: (typeof VERDICTS)[number];
  tier?: string;
  implementer?: string;
  reviewer?: string;
  claimedImplementer?: string;
  claimedReviewer?: string;
  notes: string;
  reason?: string;
  done?: string;
  clear?: boolean;
  deferred?: string;
  pendingCommit?: string;
  review?: string;
  testDeletionReason?: string;
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

/** The tier of the attempt being recorded: the task's last recorded tier, else its declared one (MDO-0007). */
export function rowTier(spec: SpecFolder, task: string | undefined): string {
  const recorded = spec.execution.filter((r) => r.task === task && r.tier !== '—').at(-1)?.tier;
  return recorded ?? spec.tasks.find((t) => t.id === task)?.tier ?? '—';
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
    ...(o.reason ? [`${o.verdict === 'FAIL' ? 'FAIL' : 'reason'}: ${o.reason}`] : []),
    ...(o.testDeletionReason ? [`test deletion: ${o.testDeletionReason}`] : []),
    ...(o.notes ? [o.notes] : []),
  ];
  return {
    date: now.slice(0, 10),
    task: o.task ?? '—',
    attempt: taskAttempt(spec.execution, o.task ?? '—'),
    tier: o.tier ?? rowTier(spec, o.task),
    harness,
    implementer: identityCell(implementer),
    reviewer: identityCell(reviewer),
    verdict: o.verdict!,
    notes: notes.join('; '),
  };
}

/** The review scope fields only when known: entries without them predate the out-of-scope brake. */
const withScope = (scope?: ReviewScope) => (scope ? { reviewed: scope.reviewed, receipts: scope.receipts } : {});

/** A PASS queued for its commit: only paths in the Reviewer-approved manifest are eligible. */
function pendingEntry(
  spec: SpecFolder,
  o: CheckpointOptions,
  approved?: ChangeManifestEntry[],
  approvedScope?: ReviewScope,
): Progress['pending_commits'] {
  if (!o.pendingCommit) return [];
  const passing = (v: string | undefined) => v === 'PASS' || v === 'DEFERRED_TO_CI';
  // The PASS may be this checkpoint's, or already written by `mandao run review --via` (ADR 0021).
  const lastVerdict = spec.execution.filter((r) => r.task === o.task).at(-1)?.verdict;
  if (!o.task || (!passing(o.verdict) && !(o.verdict === undefined && passing(lastVerdict)))) {
    throw new Error('--pending-commit needs --task and a PASS: give --verdict PASS, or record it first with `mandao run review`');
  }
  const recorded = spec.progress?.approved_manifests.find((m) => m.task === o.task && m.attempt === taskAttempt(spec.execution, o.task));
  const manifest = approved ?? recorded?.files;
  if (!manifest) throw new Error(`${o.task}: no Reviewer-approved change manifest; review and approve this exact change set first`);
  const scope = approved
    ? approvedScope
    : recorded?.reviewed
      ? { reviewed: recorded.reviewed, receipts: recorded.receipts ?? [] }
      : undefined;
  return [{ task: o.task, subject: o.pendingCommit, files: manifest.map((f) => f.path), manifest, ...withScope(scope) }];
}

/** The Leader's model from models.yml for the harness, never the model's own account of itself (ADR 0021). */
function leaderModel(ctx: CliContext, harness: string | undefined): string {
  if (!harness) return 'unknown';
  const config = readConfig(ctx.root());
  const leader = resolveWorkspaceModels(ctx.root(), config, readRecommendations())[harness as HarnessId]?.leader;
  return leader ? `${leader.model}${leader.effort ? ` (${leader.effort})` : ''}` : 'unknown';
}

/** The task in progress after this checkpoint, with the Leader's model from models.yml. */
function currentTask(ctx: CliContext, o: CheckpointOptions) {
  const inProgress = o.nextTask ?? o.task;
  if (o.clear || !inProgress) return null;
  return { task: inProgress, phase: o.phase ?? 'implementing', harness: o.harness ?? 'unknown', model: leaderModel(ctx, o.harness) };
}

/** Everything a checkpoint refuses before it writes; returns the commit it queues, already checked. */
function checkedPending(ctx: CliContext, spec: SpecFolder, o: CheckpointOptions) {
  // MDO-0005: a FAIL without its reason leaves the rework unexplainable in Kaizen.
  if (o.verdict === 'FAIL' && !o.reason?.trim()) throw new Error('--verdict FAIL needs --reason "<the first blocking finding>"');
  requireRedFirst(spec, o.task, o.verdict);
  requireTestDeletionReason(spec, o.task, o.verdict, o.testDeletionReason);
  const review = checkReview(spec, o, ctx.root());
  const reviewNote = review.note;
  const pending = pendingEntry(spec, o, review.manifest, review.scope);
  for (const p of pending) checkPendingSubject(readConfig(ctx.root()), spec, p.task, p.subject, p.files);
  return { pending, reviewNote, manifest: review.manifest, scope: review.scope };
}

export function writeCheckpoint(ctx: CliContext, spec: SpecFolder, o: CheckpointOptions) {
  const now = new Date().toISOString();
  const { pending, reviewNote, manifest, scope } = checkedPending(ctx, spec, o);
  const edited = recordLogEdits(spec, now, `checkpoint ${o.task ?? ''} ${o.verdict ?? o.phase ?? ''}`.trim());
  const notes = [o.notes, reviewNote, edited].filter(Boolean).join('; ');
  if (o.verdict) appendExecutionRow(spec.dir, spec.name, checkpointRow(ctx.root(), spec, { ...o, notes }, now));
  if (o.done) markTask(spec.dir, o.done, true);
  const current = currentTask(ctx, o);
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
    approved_manifests: [
      ...(spec.progress?.approved_manifests ?? []).filter(
        (m) => !manifest || m.task !== o.task || !o.task || m.attempt !== taskAttempt(spec.execution, o.task),
      ),
      ...(manifest && o.task ? [{ task: o.task, attempt: taskAttempt(spec.execution, o.task), files: manifest, ...withScope(scope) }] : []),
    ],
  });
  return {
    written: true,
    spec: spec.name,
    current,
    pendingCommits: [...(spec.progress?.pending_commits ?? []), ...pending].map((p) => p.task),
    ...(edited ? { discrepancy: edited } : {}),
  };
}

/** The Leader checkpoint (writes through src/writer). */
/** The checkpoint's options, shared by `checkpoint` and `step`. */
export function withCheckpointOptions(cmd: Command): Command {
  return cmd
    .option('--task <id>', 'the task this step is about (the execution row and the task in progress)')
    .option('--next-task <id>', 'after recording the row, the task now in progress (default: --task)')
    .option('--phase <phase>', 'implementing | awaiting-review | rework-n')
    .option('--harness <id>', 'harness running the Leader')
    .option('--next <text>', 'next step', '')
    .option('--question <text...>', 'open questions')
    .option('--verdict <verdict>', `also append an execution row: ${VERDICTS.join(' | ')}`)
    .option('--tier <tier>', 'tier for the execution row')
    .option('--implementer <agent>', 'agent that implemented: mandao-implementer-<tier>[@<harness>] or self')
    .option('--reviewer <agent>', 'agent that reviewed: mandao-reviewer[@<harness>] or self')
    .option('--claimed-implementer <model>', 'model the implementer said it was (a mismatch is flagged)')
    .option('--claimed-reviewer <model>', 'model the reviewer said it was (a mismatch is flagged)')
    .option('--notes <text>', 'notes for the row (advisories, deferred tests…)', '')
    .option('--reason <text>', 'why the Reviewer failed the task: its first blocking finding (required with FAIL)')
    .option('--test-deletion-reason <text>', 'why test cases were removed; recorded for the Reviewer')
    .option(
      '--review <file|->',
      "with a Reviewer's PASS or FAIL: its whole answer (a file, or - for stdin), checked and kept in _log/reviews/ (version 2: a section of _log/reviews.md)",
    )
    .option('--done <id>', 'mark a task done in tasks.md')
    .option('--clear', 'no task in progress')
    .option('--deferred <tests|reason>', 'record impacted tests deferred to CI for --task: "<tests, comma separated>|<reason>"')
    .option('--pending-commit <subject>', 'with a PASS: queue the task commit with this subject for `mandao run commit`');
}

function registerCheckpoint(run: Command, ctx: CliContext) {
  withCheckpointOptions(
    run
      .command('checkpoint <spec>')
      .description('Write the checkpoint after a Leader step: progress.yml, an execution row, a task checkbox'),
  ).action((ref: string, o: CheckpointOptions) => {
    const { spec } = loadSpec(ctx, ref);
    json(writeCheckpoint(ctx, spec, o));
  });
}

/** The steps that commit spec documents, and the subject each one gets (MDO-0005: no free-text subjects). */
export const SPEC_STEPS = {
  specify: (id: string) => `approve the ${id} requirements and design`,
  spec: (id: string) => `approve the ${id} spec`,
  clarify: (id: string) => `record the ${id} clarification answers`,
  tasks: (id: string) => `approve the ${id} task plan`,
  verify: (id: string) => `record the ${id} verify report`,
  close: (id: string) => `close ${id} with release docs and Kaizen`,
} as const;

/** The paths a close recorded as applied; a summary without a readable record has none. */
function appliedOf(text: string | undefined, spec: string): string[] {
  try {
    // An unreadable record (no frontmatter) must not block the commit: it just records nothing applied.
    return parseCloseSummary(text, spec).applied;
  } catch {
    return [];
  }
}

/** Changed files `sync` or the diagram build regenerated: the lock's files and the lock, command pages and diagram sources. */
function regenerated(root: string, repo: string, changed: string[]): string[] {
  const rel = (p: string) => relative(repo, join(root, p)).replace(/\\/g, '/');
  const locked = new Set((readLock(join(root, LOCK_FILE))?.files ?? []).map((f) => rel(f.path)));
  const derived = (f: string) => f.startsWith(`${rel('docs/commands')}/`) || f.startsWith(`${rel('docs/diagrams')}/`);
  return changed.filter((f) => locked.has(f) || derived(f) || f === rel(LOCK_FILE));
}

/**
 * What close writes besides the spec folder. Version 1: release docs, Kaizen, constitution and module guides.
 * Version 2 (MDO-0011 D6): the changelog and lessons, constitution, guides, the paths close recorded as applied, and what was regenerated.
 */
function closePaths(ctx: CliContext, config: ReturnType<typeof readConfig>, repo: string, spec: SpecFolder): string[] {
  const id = spec.story?.meta.id ?? spec.name;
  const rel = (p: string) => relative(repo, join(ctx.root(), p)).replace(/\\/g, '/');
  const changed = changedFiles(repo);
  const guides = changed.filter((f) => /(^|\/)(AGENTS|CLAUDE)\.md$/.test(f));
  if (!specLogInCache(spec.dir)) {
    return [rel(join(config.paths.releases, id)), rel(join('docs', 'kaizen', `${id}.md`)), rel(config.paths.constitution), ...guides];
  }
  const summary = join(spec.dir, 'close-summary.md');
  const applied = appliedOf(existsSync(summary) ? readFileSync(summary, 'utf8') : undefined, spec.name);
  const fixed = [rel('docs/CHANGELOG.md'), rel('docs/kaizen/lessons.md'), rel(config.paths.constitution)];
  return [
    ...fixed,
    ...guides,
    ...applied.map((p) => relative(repo, join(repo, p)).replace(/\\/g, '/')),
    ...regenerated(ctx.root(), repo, changed),
  ];
}

/** `mandao run commit-spec`: the spec documents in their own docs commit, at every step that writes them. */
function registerCommitSpec(run: Command, ctx: CliContext) {
  run
    .command('commit-spec <spec> <step>')
    .description('Commit the spec documents as a docs commit with Refs: specify, clarify, tasks, verify and close')
    .option('--trailer <text...>', 'extra trailers, e.g. "Co-Authored-By: …"')
    .action((ref: string, step: string, opts: { trailer?: string[] }) => {
      if (!(step in SPEC_STEPS)) throw new Error(`step must be one of ${Object.keys(SPEC_STEPS).join(', ')}`);
      const { config, spec } = loadSpec(ctx, ref);
      const id = spec.story?.meta.id ?? spec.name;
      const repo = repoRoot(spec.dir);
      const scope = config.projects.length > 1 ? 'specs' : (spec.story?.meta.projects[0] ?? config.projects[0]!.name);
      const header = `${emojiPrefix(config, 'docs')}docs(${scope}): ${SPEC_STEPS[step as keyof typeof SPEC_STEPS](id)}`;
      const result = commitSpecDocs({
        repo,
        specDir: spec.dir,
        header,
        specId: id,
        config,
        trailers: opts.trailer ?? [],
        protectedBranches: branchingFor(config).protected,
        ...(step === 'close' ? { extraPaths: closePaths(ctx, config, repo, spec) } : {}),
      });
      json({ ...result, header });
      if (!result.committed && result.reason !== 'nothing to commit in the spec folder') process.exitCode = 1;
    });
}

/** `mandao run commit`: the pending task commits, one each, with trailers. Local only. */
function registerCommit(run: Command, ctx: CliContext) {
  run
    .command('commit <spec>')
    .description('Commit the tasks that passed review and wait for their commit, one commit per task (never pushes)')
    .option('--trailer <text...>', 'extra trailers, e.g. "Co-Authored-By: …"')
    .action(async (ref: string, opts: { trailer?: string[] }) => {
      const { config, spec } = loadSpec(ctx, ref);
      if (!spec.story || !spec.progress) throw new Error(`${spec.name} needs story.md and progress.yml`);
      await requirePreCommitBuilds(ctx, config, spec);
      const result = commitPending({
        repo: repoRoot(spec.dir),
        specDir: spec.dir,
        config,
        story: spec.story,
        tasks: spec.tasks,
        progress: spec.progress,
        trailers: opts.trailer ?? [],
        protectedBranches: branchingFor(config).protected,
        home: ctx.root(),
      });
      const skipped = declaredNoBuild(config);
      json(skipped.length ? { ...result, builds: Object.fromEntries(skipped.map((name) => [name, 'declared-none'])) } : result);
      if (result.error) process.exitCode = 1;
    });
}

/** Projects whose pre-commit build is skipped because they declared `build: none` (recorded, never a PASS). */
export const declaredNoBuild = (config: Config): string[] => config.projects.filter(declaresNoBuild).map((p) => p.name);

export async function requirePreCommitBuilds(ctx: CliContext, config: Config, spec: SpecFolder): Promise<void> {
  if (!spec.progress?.pending_commits.length) return;
  const reconciled = reconciledTasks(
    repoRoot(spec.dir),
    spec.story?.meta.id ?? spec.name,
    config.commits.trailers,
    spec.progress.pending_commits,
  );
  if (spec.progress.pending_commits.every((e) => reconciled.has(e.task))) return;
  const projects = config.projects.filter((project) => buildCommand(project));
  if (!projects.length && !declaredNoBuild(config).length)
    throw new Error('run commit needs a configured build gate: configure a build command or `build: none` in .mandao/config.yml');
  for (const project of projects) {
    const command = buildCommand(project)!;
    const budget = budgetFor(ctx.root(), config, project, 'build', `${project.name} pre-commit build`, false, spec.dir);
    const result = await runWithGateReceipt(
      {
        root: ctx.root(),
        project: project.name,
        gate: 'build',
        command,
        configuration: config,
        selectedTests: [],
        budget,
        projectRoot: join(ctx.root(), project.path),
      },
      () => runTests(ctx.root(), `${project.name} build`, inProjectDir(command, project.path), budget),
    );
    if (result.status !== 'PASS') throw new Error(`${project.name} build is ${result.status}: ${result.reason ?? 'commit refused'}`);
  }
}

/** Scripts that write the ledger (checkpoint), commit (commit) or launch a reviewer (review): ADR 0021. */
export function registerLedger(run: Command, ctx: CliContext) {
  registerCheckpoint(run, ctx);
  registerCommit(run, ctx);
  registerCommitSpec(run, ctx);
  registerReview(run, ctx, loadSpec);
  registerTestReview(run, ctx);
  registerRed(run, ctx);
  registerMutation(run, ctx);
  registerDiagram(run, ctx);
  registerClose(run, ctx);
}
