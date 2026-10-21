/**
 * Security findings that block a PASS (MDO-0008: a high-severity eval risk was passed as an advisory).
 * The Reviewer tags each finding `[<lens>/<severity>]`; a `[security/high]` or `[security/critical]` line
 * blocks. An untagged line that names a high or critical severity and a security concern blocks too, so a
 * missing tag cannot let it through.
 */
const TAGGED = /\[\s*security\s*\/\s*(high|critical)\s*\]/i;
const OTHER_LENS = /\[\s*(core|performance|data|accessibility|ai)\s*\/\s*\w+\s*\]/i;
const SEVERE = /\b(high|critical)\b/i;
const SECURITY =
  /\b(security|secur\w*|eval|exec\w*|inject\w*|xss|ssrf|csrf|rce|secret\w*|credential\w*|auth\w*|privilege\w*|traversal|sanitiz\w*|untrusted|vulnerab\w*)\b/i;

export function securityBlockers(review: string): string[] {
  return review
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => TAGGED.test(l) || (!OTHER_LENS.test(l) && SEVERE.test(l) && SECURITY.test(l)));
}
