import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Config } from '../schemas/index.js';
import { type ChangeManifestEntry, changedFiles, changeManifest, repoRoot } from '../scripts/commits.js';
import { deletedTests, testsWithoutRed } from '../scripts/red.js';
import { parseVerdict } from '../scripts/review.js';
import type { SpecFolder } from '../scripts/spec.js';
import { cachePath, logPath, specLogInCache, writeLogSection } from '../scripts/spec-log.js';
import { commitMessage, NOTE_FLAGS, parseReviewFindings, securityBlockers, taskAttempt } from '../spec/index.js';
import { writeText } from '../writer/files.js';
import { acceptLogs, logDiscrepancies } from '../writer/log-integrity.js';

/**
 * Before a REPORTED row: every test of an `evidence: tdd` task must have run red, rework included. A test
 * written after the fix proves nothing (MDO-0008 T1 rework), so the row is refused, not just flagged.
 */
export function requireRedFirst(spec: SpecFolder, task: string | undefined, verdict: string | undefined): void {
  if (verdict !== 'REPORTED' || !task) return;
  const t = spec.tasks.find((x) => x.id === task);
  if (!t || t.evidence === 'none' || t.evidence === 'mutation' || t.characterization) return;
  const firstPassMutation =
    spec.execution.some((row) => row.task === task && row.verdict === 'TESTS_PASS') &&
    spec.execution.some((row) => row.task === task && row.verdict === 'MUTANT');
  const reviewedFirstPass =
    spec.execution.some((row) => row.task === task && row.verdict === 'TESTS_PASS') &&
    spec.execution.some((row) => row.task === task && row.verdict === 'TEST_REVIEWED');
  if (firstPassMutation || reviewedFirstPass) return;
  const repo = repoRoot(spec.dir);
  const missing = testsWithoutRed(repo, spec.progress, task, t.files ?? [], changedFiles(repo, spec.dir));
  if (!missing.length) return;
  const list = missing.map((m) => `${m.file}: ${m.tests.map((n) => `"${n}"`).join(', ')}`).join('; ');
  throw new Error(
    `${task}: tests with no red run: ${list}. Record them failing before the fix with \`mandao run red ${spec.name} ${task} <files>\`, then report.`,
  );
}

/** Removed cases need a reason in the script-owned execution row so the Reviewer can judge the change. */
export function requireTestDeletionReason(
  spec: SpecFolder,
  task: string | undefined,
  verdict: string | undefined,
  reason: string | undefined,
): void {
  if (!task || (verdict !== 'REPORTED' && verdict !== 'PASS')) return;
  const removed = deletedTests(repoRoot(spec.dir), spec.progress, task);
  if (!removed.length || reason?.trim()) return;
  const list = removed.map((item) => `${item.file}: ${item.tests.map((name) => `"${name}"`).join(', ')}`).join('; ');
  throw new Error(`${task}: deleted test cases need --test-deletion-reason explaining why: ${list}`);
}

/** The Reviewer's whole answer: a file, or `-` for stdin (a heredoc from the Leader). */
function readReview(source: string): string {
  if (source === '-') return readFileSync(0, 'utf8');
  if (!existsSync(source)) throw new Error(`--review ${source} does not exist`);
  return readFileSync(source, 'utf8');
}

/** Reads the manifest from the exact review pack when one was generated for this attempt. */
function manifestFromPack(spec: SpecFolder, task: string, attempt: number): ChangeManifestEntry[] | undefined {
  const name = `${task}-${attempt}-pack.md`;
  const file = specLogInCache(spec.dir) ? cachePath(spec.dir, 'reviews', name) : join(logPath(spec.dir, 'reviews'), name);
  if (!existsSync(file)) return undefined;
  const text = readFileSync(file, 'utf8');
  const block =
    /^## Mandao change manifest\s+Exact changed paths, working-tree statuses, and SHA-256 content hashes reviewed below:\s+```json\s+([\s\S]*?)\s+```/m.exec(
      text,
    );
  if (!block) throw new Error(`${file} has no valid Mandao change manifest; regenerate the review pack`);
  try {
    const parsed = JSON.parse(block[1]!) as ChangeManifestEntry[];
    if (!Array.isArray(parsed) || parsed.some((item) => !item.path || !item.status || !item.sha256))
      throw new Error('invalid manifest entries');
    return parsed;
  } catch (error) {
    throw new Error(`${file} has an invalid Mandao change manifest: ${(error as Error).message}`);
  }
}

/**
 * A Reviewer's verdict is recorded with its whole answer (`--review`), kept in `_log/reviews/` (version 2:
 * one `## Tn — attempt k` section of `_log/reviews.md`). The script
 * checks it: the answer's VERDICT must match, its findings must validate, and a PASS with an open
 * high or critical security finding is refused (MDO-0008 / ADR 0045).
 */
export function checkReview(
  spec: SpecFolder,
  o: { task?: string; verdict?: string; reviewer?: string; review?: string },
): { note?: string; manifest?: ChangeManifestEntry[] } {
  const reviewed = o.verdict === 'PASS' || (o.verdict === 'FAIL' && o.reviewer);
  if (!reviewed || !o.task) return {};
  if (!o.review) throw new Error(`--verdict ${o.verdict} needs --review <file|-> with the Reviewer's whole answer`);
  const text = readReview(o.review);
  const said = parseVerdict(text);
  if (said !== o.verdict) throw new Error(`the review says ${said ? `VERDICT: ${said}` : 'no VERDICT line'}, not ${o.verdict}`);
  if (!parseReviewFindings(text).success) throw new Error('the review needs a valid structured Findings (JSON) payload');
  const blockers = o.verdict === 'PASS' ? securityBlockers(text) : [];
  if (blockers.length) {
    throw new Error(`a PASS cannot carry an open high-severity security finding: record FAIL and rework. ${blockers.join(' | ')}`);
  }
  const attempt = taskAttempt(spec.execution, o.task);
  if (specLogInCache(spec.dir)) writeLogSection(spec.dir, 'reviews.md', `${o.task} — attempt ${attempt}`, text);
  else writeText(join(logPath(spec.dir, 'reviews'), `${o.task}-${attempt}-review.md`), text);
  if (o.verdict !== 'PASS') return {};
  return { manifest: approvedReviewManifest(spec, o.task, attempt) };
}

function approvedReviewManifest(spec: SpecFolder, task: string, attempt: number): ChangeManifestEntry[] {
  const manifest = manifestFromPack(spec, task, attempt);
  if (!manifest)
    throw new Error(
      `${task}: no matching review pack manifest; run \`mandao run review-pack ${spec.name} ${task}\` and have the Reviewer use it`,
    );
  const current = changeManifest(repoRoot(spec.dir), spec.dir);
  if (JSON.stringify(current) !== JSON.stringify(manifest)) {
    const expected = new Map(manifest.map((item) => [item.path, item]));
    const actual = new Map(current.map((item) => [item.path, item]));
    const changed = [...new Set([...expected.keys(), ...actual.keys()])]
      .filter((path) => JSON.stringify(expected.get(path)) !== JSON.stringify(actual.get(path)))
      .sort();
    throw new Error(
      `working tree changed after the review pack was generated (${changed.join(', ')}); regenerate the pack and review again`,
    );
  }
  return manifest;
}

/**
 * Spec logs changed outside the scripts since a script last wrote them: appended to
 * `_log/discrepancies.md` and returned as a note for this checkpoint's row; the current content then
 * becomes the reference, so one edit is reported once.
 */
export function recordLogEdits(spec: SpecFolder, at: string, context: string): string | undefined {
  const edited = logDiscrepancies(spec.dir);
  if (!edited.length) return undefined;
  // Version 2: the row's note is the committed record; the list itself stays in the local cache.
  const file = specLogInCache(spec.dir) ? cachePath(spec.dir, 'discrepancies.md') : logPath(spec.dir, 'discrepancies.md');
  const before = existsSync(file) ? readFileSync(file, 'utf8') : '# Discrepancies (logs edited outside the scripts)\n\n';
  writeText(file, `${before}- ${at} · ${context} · ${edited.join(', ')}\n`);
  acceptLogs(spec.dir, edited);
  return `${NOTE_FLAGS.logEdited}: ${edited.join(', ')}`;
}

/** A queued task commit is checked when it is queued, not when it is made (MDO-0008: subjects over 72). */
export function checkPendingSubject(config: Config, spec: SpecFolder, task: string, subject: string, files: string[]): void {
  const t = spec.tasks.find((x) => x.id === task);
  if (!t || !spec.story) return;
  const issues = commitMessage(config, spec.story, t, subject, false, files).issues.filter((i) => /header|period/.test(i));
  if (issues.length) throw new Error(`--pending-commit "${subject}": ${issues.join('; ')}`);
}
