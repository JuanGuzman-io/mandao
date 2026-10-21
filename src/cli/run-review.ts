import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Command } from 'commander';
import type { readConfig } from '../engine/files.js';
import { readRecommendations, resolveWorkspaceModels } from '../models/load.js';
import { appendExecutionRow } from '../scripts/checkpoint.js';
import { repoRoot } from '../scripts/commits.js';
import { type Identity, identityCell } from '../scripts/identity.js';
import { isReviewProcess, REVIEW_PROCESSES, reviewerInstructions, reviewPrompt, runReview, taskDiff } from '../scripts/review.js';
import type { SpecFolder } from '../scripts/spec.js';
import { logPath } from '../scripts/spec-log.js';
import { type ExecutionRow, NOTE_FLAGS, securityBlockers, taskAttempt } from '../spec/index.js';
import { writeText } from '../writer/files.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { rowTier } from './run-ledger.js';

type SpecLoader = (ctx: CliContext, ref: string) => { config: ReturnType<typeof readConfig>; spec: SpecFolder };

/** The row for a process review: identity from the command line Mandao ran. */
function reviewRow(
  spec: SpecFolder,
  task: string,
  identity: Identity,
  verdict: 'PASS' | 'FAIL',
  reviewFile: string,
  securityBlocker?: string,
): ExecutionRow {
  const own = spec.execution.filter((r) => r.task === task);
  const reported = [...own].reverse().find((r) => r.verdict === 'REPORTED');
  const notes = [
    ...(reported && reported.harness !== identity.harness ? [NOTE_FLAGS.providerIndependence] : []),
    `read-only ${identity.harness} process; review in ${reviewFile}`,
    ...(securityBlocker ? [`FAIL: open high-severity security finding (PASS refused): ${securityBlocker}`] : []),
  ];
  return {
    date: new Date().toISOString().slice(0, 10),
    task,
    attempt: taskAttempt(spec.execution, task),
    tier: rowTier(spec, task),
    harness: identity.harness,
    implementer: reported?.implementer ?? '—',
    reviewer: identityCell(identity),
    verdict,
    notes: notes.join('; '),
  };
}

interface ReviewOptions {
  via: string;
  gates: string;
  brief: string;
}

function processReview(ctx: CliContext, loadSpec: SpecLoader, ref: string, task: string, opts: ReviewOptions) {
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
  const file = join(logPath(spec.dir, 'reviews'), `${task}-${taskAttempt(spec.execution, task)}-${opts.via}.md`);
  writeText(file, r.output);
  const rel = relative(ctx.root(), file);
  // A PASS with an open high-severity security finding is recorded as a FAIL (MDO-0008).
  const blockers = r.verdict === 'PASS' ? securityBlockers(r.output) : [];
  const verdict = blockers.length ? 'FAIL' : r.verdict;
  if (verdict) appendExecutionRow(spec.dir, spec.name, reviewRow(spec, task, r.identity, verdict, rel, blockers[0]));
  return {
    verdict: verdict ?? null,
    ...(blockers.length ? { securityBlockers: blockers } : {}),
    reviewer: r.identity,
    review: rel,
    exitCode: r.exitCode,
    recorded: Boolean(verdict),
  };
}

/** `mandao run review --via <harness>`: a review in another harness, as a read-only process (ADR 0021). */
export function registerReview(run: Command, ctx: CliContext, loadSpec: SpecLoader) {
  run
    .command('review <spec> <task>')
    .description('Review a reported task in another harness as a read-only process and record the verdict')
    .requiredOption('--via <harness>', `harness that reviews: ${REVIEW_PROCESSES.join(' | ')}`)
    .requiredOption('--gates <file>', 'file with the gate and impacted-test results the Leader ran')
    .requiredOption('--brief <file>', 'the task brief (`mandao run brief` output)')
    .action((ref: string, task: string, opts: ReviewOptions) => {
      const out = processReview(ctx, loadSpec, ref, task, opts);
      json(out);
      if (!out.recorded) process.exitCode = 1;
    });
}
