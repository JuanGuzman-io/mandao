import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Config } from '../schemas/index.js';
import { repoRoot } from '../scripts/commits.js';
import { testsWithoutRed } from '../scripts/red.js';
import { parseVerdict } from '../scripts/review.js';
import type { SpecFolder } from '../scripts/spec.js';
import { logPath } from '../scripts/spec-log.js';
import { commitMessage, NOTE_FLAGS, securityBlockers, taskAttempt, untaggedSecurityMentions } from '../spec/index.js';
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
  const missing = testsWithoutRed(repoRoot(spec.dir), spec.progress, task, t.files ?? []);
  if (!missing.length) return;
  const list = missing.map((m) => `${m.file}: ${m.tests.map((n) => `"${n}"`).join(', ')}`).join('; ');
  throw new Error(
    `${task}: tests with no red run: ${list}. Record them failing before the fix with \`mandao run red ${spec.name} ${task} <files>\`, then report.`,
  );
}

/** The Reviewer's whole answer: a file, or `-` for stdin (a heredoc from the Leader). */
function readReview(source: string): string {
  if (source === '-') return readFileSync(0, 'utf8');
  if (!existsSync(source)) throw new Error(`--review ${source} does not exist`);
  return readFileSync(source, 'utf8');
}

/**
 * A Reviewer's verdict is recorded with its whole answer (`--review`), kept in `_log/reviews/`. The script
 * checks it: the answer's VERDICT must match, and a PASS with a high or critical security finding is
 * refused (MDO-0008). Returns a note for the row when untagged prose looks like a severe security issue.
 */
export function checkReview(
  spec: SpecFolder,
  o: { task?: string; verdict?: string; reviewer?: string; review?: string },
): string | undefined {
  const reviewed = o.verdict === 'PASS' || (o.verdict === 'FAIL' && o.reviewer);
  if (!reviewed || !o.task) return undefined;
  if (!o.review) throw new Error(`--verdict ${o.verdict} needs --review <file|-> with the Reviewer's whole answer`);
  const text = readReview(o.review);
  const said = parseVerdict(text);
  if (said !== o.verdict) throw new Error(`the review says ${said ? `VERDICT: ${said}` : 'no VERDICT line'}, not ${o.verdict}`);
  const blockers = o.verdict === 'PASS' ? securityBlockers(text) : [];
  if (blockers.length) {
    throw new Error(`a PASS cannot carry an open high-severity security finding: record FAIL and rework. ${blockers.join(' | ')}`);
  }
  const file = join(logPath(spec.dir, 'reviews'), `${o.task}-${taskAttempt(spec.execution, o.task)}-review.md`);
  writeText(file, text);
  const untagged = untaggedSecurityMentions(text);
  return untagged.length ? `untagged security mention: ${untagged.join(' | ')}` : undefined;
}

/**
 * Spec logs changed outside the scripts since a script last wrote them: appended to
 * `_log/discrepancies.md` and returned as a note for this checkpoint's row; the current content then
 * becomes the reference, so one edit is reported once.
 */
export function recordLogEdits(spec: SpecFolder, at: string, context: string): string | undefined {
  const edited = logDiscrepancies(spec.dir);
  if (!edited.length) return undefined;
  const file = logPath(spec.dir, 'discrepancies.md');
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
