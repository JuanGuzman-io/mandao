import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { appendExecutionRow } from '../scripts/checkpoint.js';
import { agentIdentity, identityCell } from '../scripts/identity.js';
import { findSpec, readSpec } from '../scripts/spec.js';
import { logPath, specLogInCache, writeLogSection } from '../scripts/spec-log.js';
import { taskAttempt } from '../spec/index.js';
import { writeText } from '../writer/files.js';
import type { CliContext } from './context.js';
import { json } from './json.js';

type ReviewOptions = { reviewer: string; review: string; harness: string };

function reviewedTask(spec: ReturnType<typeof readSpec>, taskId: string) {
  if (!spec.tasks.some((task) => task.id === taskId)) throw new Error(`No ${taskId} in ${spec.name}/tasks.md`);
  const own = spec.execution.filter((row) => row.task === taskId);
  if (own.at(-1)?.verdict !== 'TESTS_PASS') throw new Error(`${taskId} must have a latest TESTS_PASS row before test review`);
  return own;
}

function reviewText(path: string, spec: ReturnType<typeof readSpec>, taskId: string): string {
  if (!existsSync(path)) throw new Error(`${path} does not exist`);
  const review = readFileSync(path, 'utf8');
  if (!/^TEST REVIEW: PASS\s*$/m.test(review) || !/^## Assertions\s*$/m.test(review))
    throw new Error('test review must begin with TEST REVIEW: PASS and include ## Assertions');
  const files = spec.progress?.red_tests.find((entry) => entry.task === taskId)?.files ?? [];
  if (!files.length || files.some((file) => !review.includes(file.path)))
    throw new Error(`${taskId}: test review must name every test file from the first passing run`);
  return review;
}

function independentReviewer(root: string, reviewer: string, harness: string) {
  const agent = reviewer.replace(/_/g, '-').split('@')[0] ?? '';
  if (!['mandao-reviewer', 'mandao-reviewer-alt'].includes(agent))
    throw new Error('--reviewer must be mandao-reviewer or mandao-reviewer-alt');
  const identity = agentIdentity(root, reviewer, harness);
  if (identity.source === 'self') throw new Error('test review must be independent of the Leader context');
  return identity;
}

function recordTestReview(ctx: CliContext, ref: string, taskId: string, options: ReviewOptions) {
  const root = ctx.root();
  const config = readConfig(root);
  const spec = readSpec(findSpec(root, config, ref));
  const own = reviewedTask(spec, taskId);
  const review = reviewText(options.review, spec, taskId);
  const identity = independentReviewer(root, options.reviewer, options.harness);
  const attempt = taskAttempt(spec.execution, taskId);
  const reviewPath = specLogInCache(spec.dir)
    ? writeLogSection(spec.dir, 'reviews.md', `${taskId} — test review ${attempt} (via ${identity.harness})`, review)
    : join(logPath(spec.dir, 'reviews'), `${taskId}-${attempt}-test-review.md`);
  if (!specLogInCache(spec.dir)) writeText(reviewPath, review);
  appendExecutionRow(spec.dir, spec.name, {
    date: new Date().toISOString().slice(0, 10),
    task: taskId,
    attempt,
    tier: own.at(-1)?.tier ?? '—',
    harness: identity.harness,
    implementer: own.at(-1)?.implementer ?? '—',
    reviewer: identityCell(identity),
    verdict: 'TEST_REVIEWED',
    notes: `independent test review: ${relative(root, reviewPath).split('\\').join('/')}`,
  });
  json({ recorded: true, task: taskId, verdict: 'TEST_REVIEWED', review: relative(root, reviewPath).split('\\').join('/') });
}

/** Record independent review when required tests pass before implementation instead of repeating a red run. */
export function registerTestReview(run: Command, ctx: CliContext): void {
  run
    .command('test-review <spec> <task>')
    .description('Record the Reviewer’s independent inspection of tests that passed before implementation')
    .requiredOption('--reviewer <agent>', 'mandao-reviewer or mandao-reviewer-alt, resolved from its harness agent file')
    .requiredOption('--review <file>', 'review beginning TEST REVIEW: PASS, with an Assertions section and each inspected test path')
    .option('--harness <id>', 'harness of the Reviewer (default: claude)', 'claude')
    .action((ref: string, taskId: string, options: ReviewOptions) => recordTestReview(ctx, ref, taskId, options));
}
