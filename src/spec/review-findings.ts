import { reviewFindingsSchema } from '../schemas/review.js';

/** Parses the required machine-readable finding payload. Free-form prose is never used as guard input. */
export function parseReviewFindings(review: string) {
  const headings = [...review.matchAll(/^## Findings \(JSON\)\s*$/gm)];
  if (headings.length !== 1) return reviewFindingsSchema.safeParse(undefined);
  const heading = headings[0]!.index!;
  const sectionStart = heading + headings[0]![0].length;
  const section = review.slice(sectionStart).split(/^#{1,2}\s+/m)[0]!;
  const sectionEnd = sectionStart + section.length;
  const fences = [...section.matchAll(/^```json\s*$/gm)];
  if (fences.length !== 1) return reviewFindingsSchema.safeParse(undefined);
  const fence = sectionStart + fences[0]!.index!;
  const start = review.indexOf('\n', fence + 7);
  const end = review.indexOf('```', start + 1);
  if (start < 0 || end < 0 || end > sectionEnd) return reviewFindingsSchema.safeParse(undefined);
  try {
    return reviewFindingsSchema.safeParse(JSON.parse(review.slice(start + 1, end)));
  } catch {
    return reviewFindingsSchema.safeParse(undefined);
  }
}

/** One Reviewer answer recorded for a task attempt. */
export interface TaskReview {
  task: string;
  attempt: number;
  text: string;
}

export interface OpenFinding {
  task: string;
  attempt: number;
  id: string;
  severity: string;
  lens: string;
  title: string;
  file: string;
  line: number;
}

/**
 * Pure: every finding still open in each task's last review, whatever its severity (phase 20: MDO-0002's low ones
 * lived only in the review files and the summary said none). A later attempt's review replaces an earlier one.
 */
export function openFindings(reviews: TaskReview[]): OpenFinding[] {
  const last = new Map<string, TaskReview>();
  for (const r of reviews) if ((last.get(r.task)?.attempt ?? 0) <= r.attempt) last.set(r.task, r);
  return [...last.values()].flatMap((r) => {
    const parsed = parseReviewFindings(r.text);
    if (!parsed.success) return [];
    return parsed.data.findings
      .filter((f) => f.status === 'open')
      .map((f) => ({
        task: r.task,
        attempt: r.attempt,
        id: f.id,
        severity: f.severity,
        lens: f.lens,
        title: f.title,
        file: f.file,
        line: f.line,
      }));
  });
}

/** Open high or critical security findings cannot accompany a PASS. */
export function securityBlockers(review: string): string[] {
  const parsed = parseReviewFindings(review);
  if (!parsed.success) return ['Reviewer findings payload is missing or invalid'];
  return parsed.data.findings
    .filter((f) => f.status === 'open' && f.lens === 'security' && (f.severity === 'high' || f.severity === 'critical'))
    .map((f) => `${f.id}: ${f.title} (${f.file}:${f.line})`);
}

export const UNTAGGED_NOTE = 'untagged security mention';

export function securityMentions(rows: { task: string; attempt: number; notes: string }[]) {
  return rows.flatMap((r) => {
    const text = new RegExp(`${UNTAGGED_NOTE}: (.*?)(?:; (?:log edited|red test changed|identity mismatch)|$)`).exec(r.notes)?.[1];
    return text ? [{ task: r.task, attempt: r.attempt, mentions: text.split(' | ') }] : [];
  });
}
