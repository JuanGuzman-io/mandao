/**
 * Security findings that block a PASS (MDO-0008: a high-severity eval risk was passed as an advisory).
 * The Reviewer tags each finding `[<lens>/<severity>]`; only a `[security/high]` or `[security/critical]`
 * tag blocks. A word match on untagged prose blocked a correct PASS whose answer mentioned the fixed
 * finding, and pushed the Reviewer to reword instead of report (MDO-0008 T1 rework), so untagged lines
 * that look severe only become a note the next people read.
 *
 * Only the current attempt's findings are open. When the answer has a `Findings` ATX heading (any level,
 * optional trailing colon), only tagged lines inside those sections, up to the next heading of the same or
 * a higher level, block: a rework PASS that recaps an earlier attempt's finding as fixed, in its summary
 * or a section about earlier attempts, is not refused. Without such a heading every tagged line blocks
 * (fails closed). A heading counts only as Markdown renders it: at most 3 leading spaces, outside fenced
 * code (a fence closes on its own character, at least as long) and outside `<!-- … -->` comments.
 */
const TAGGED = /\[\s*security\s*\/\s*(high|critical)\s*\]/i;
const ANY_TAG = /\[\s*(core|security|performance|data|accessibility|ai)\s*\/\s*\w+\s*\]/i;
const SEVERE = /\b(high|critical)\b/i;
const SECURITY =
  /\b(security|secur\w*|eval|exec\w*|inject\w*|xss|ssrf|csrf|rce|secret\w*|credential\w*|auth\w*|privilege\w*|traversal|sanitiz\w*|untrusted|vulnerab\w*)\b/i;

const HEADING = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const FINDINGS = /^findings:?$/i;
const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/;
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})\s*$/;

const lines = (review: string) => review.split('\n').map((l) => l.trim());

type Heading = { depth: number; findings: boolean } | undefined;
type Block = { fence?: string; comment: boolean };

/** Whether a raw line is code or comment (a delimiter included), advancing the block state. */
function codeOrComment(raw: string, block: Block): boolean {
  if (block.fence) {
    const close = FENCE_CLOSE.exec(raw)?.[1];
    if (close && close[0] === block.fence[0] && close.length >= block.fence.length) block.fence = undefined;
    return true;
  }
  if (block.comment) {
    block.comment = !raw.includes('-->');
    return true;
  }
  block.fence = FENCE_OPEN.exec(raw)?.[1];
  const opened = raw.lastIndexOf('<!--');
  block.comment = opened >= 0 && !raw.slice(opened).includes('-->');
  return Boolean(block.fence) || block.comment;
}

/** Each line's heading (depth, and whether it is `Findings`); none in code or a comment. */
function headings(review: string): Heading[] {
  const block: Block = { comment: false };
  return review.split('\n').map((raw) => {
    const h = codeOrComment(raw, block) ? null : HEADING.exec(raw);
    return h ? { depth: h[1]!.length, findings: FINDINGS.test(h[2]!) } : undefined;
  });
}

/** The lines inside `Findings` sections, or every line when the answer has none. */
function openFindingLines(review: string): string[] {
  const all = lines(review);
  const marks = headings(review);
  if (!marks.some((h) => h?.findings)) return all;
  let level = 0; // depth of the open Findings section; 0 = outside one
  return all.filter((_, i) => {
    const h = marks[i];
    if (h && (h.findings || h.depth <= level)) {
      level = h.findings ? Math.min(level || h.depth, h.depth) : 0; // a nested Findings keeps the outer one open
      return false;
    }
    return level > 0;
  });
}

/** Tagged high or critical security findings of this attempt: a PASS that carries one is refused. */
export function securityBlockers(review: string): string[] {
  return openFindingLines(review).filter((l) => TAGGED.test(l));
}

/** Untagged lines that name a high or critical severity and a security concern: recorded, not blocking. */
export function untaggedSecurityMentions(review: string): string[] {
  return lines(review).filter((l) => !ANY_TAG.test(l) && SEVERE.test(l) && SECURITY.test(l));
}

export const UNTAGGED_NOTE = 'untagged security mention';

/**
 * Untagged security mentions recorded in the execution rows, per task: they never block, so
 * `implement-summary` and verify list them for a person to read.
 */
export function securityMentions(rows: { task: string; attempt: number; notes: string }[]) {
  return rows.flatMap((r) => {
    const text = new RegExp(`${UNTAGGED_NOTE}: (.*?)(?:; (?:log edited|red test changed|identity mismatch)|$)`).exec(r.notes)?.[1];
    return text ? [{ task: r.task, attempt: r.attempt, mentions: text.split(' | ') }] : [];
  });
}
