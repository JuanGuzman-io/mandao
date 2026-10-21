/**
 * Security findings that block a PASS (MDO-0008: a high-severity eval risk was passed as an advisory).
 * The Reviewer tags each finding `[<lens>/<severity>]`; only a `[security/high]` or `[security/critical]`
 * tag blocks. A word match on untagged prose blocked a correct PASS whose answer mentioned the fixed
 * finding, and pushed the Reviewer to reword instead of report (MDO-0008 T1 rework), so untagged lines
 * that look severe only become a note the next people read.
 */
const TAGGED = /\[\s*security\s*\/\s*(high|critical)\s*\]/i;
const ANY_TAG = /\[\s*(core|security|performance|data|accessibility|ai)\s*\/\s*\w+\s*\]/i;
const SEVERE = /\b(high|critical)\b/i;
const SECURITY =
  /\b(security|secur\w*|eval|exec\w*|inject\w*|xss|ssrf|csrf|rce|secret\w*|credential\w*|auth\w*|privilege\w*|traversal|sanitiz\w*|untrusted|vulnerab\w*)\b/i;

const lines = (review: string) => review.split('\n').map((l) => l.trim());

/** Tagged high or critical security findings: a PASS that carries one is refused. */
export function securityBlockers(review: string): string[] {
  return lines(review).filter((l) => TAGGED.test(l));
}

/** Untagged lines that name a high or critical severity and a security concern: recorded, not blocking. */
export function untaggedSecurityMentions(review: string): string[] {
  return lines(review).filter((l) => !ANY_TAG.test(l) && SEVERE.test(l) && SECURITY.test(l));
}
