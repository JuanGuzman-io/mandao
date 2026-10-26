import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { z } from 'zod';
import { sha256 } from '../util/hash.js';

/** What a human approves without a model session (cost-conscious design, `mandao approve`). */
export const APPROVAL_STEPS = ['story', 'design', 'spec', 'tasks', 'close', 'budget', 'security-gaps', 'vulnerability'] as const;
export type ApprovalStep = (typeof APPROVAL_STEPS)[number];

export const approvalSchema = z
  .object({
    /** `shown` is a snapshot; revocation/annulment events target a prior append-only row. */
    step: z.enum([...APPROVAL_STEPS, 'shown', 'revocation', 'annulment']),
    by: z.string().min(1),
    at: z.string().min(1),
    /** close: the proposals approved (impacts, standardizations); the next close session applies them. */
    items: z.array(z.string()).optional(),
    note: z.string().optional(),
    /** The words the person wrote next to the command that approved by running it, verbatim. */
    words: z.string().optional(),
    /** The hash of each approvable document, by file name, when the row was written. */
    sha256: z.record(z.string(), z.string()).optional(),
    /** budget: the spend (USD) the person authorizes for this spec, or `none` to remove its cap (ADR 0036). */
    to: z.union([z.number().positive(), z.literal('none')]).optional(),
    /** vulnerability: a known vulnerability accepted with its reachability reason (`note`) and when to review it (phase 18). */
    vulnerability: z.object({ package: z.string().min(1), id: z.string().min(1), review: z.string().min(1) }).optional(),
    target_at: z.string().optional(),
    target_step: z.enum(APPROVAL_STEPS).optional(),
  })
  .superRefine((row, ctx) => {
    if ((row.step === 'revocation' || row.step === 'annulment') && (!row.target_at || !row.note?.trim()))
      ctx.addIssue({ code: 'custom', message: 'revocation and annulment rows need target_at and a reason in note' });
    if (row.step === 'revocation' && !row.target_step) ctx.addIssue({ code: 'custom', message: 'a revocation row needs target_step' });
    if (row.step === 'security-gaps' && !row.note?.trim())
      ctx.addIssue({ code: 'custom', message: 'security-gaps approval needs a reason in note' });
    if (row.step === 'vulnerability' && (!row.vulnerability || !row.note?.trim()))
      ctx.addIssue({ code: 'custom', message: 'vulnerability approval needs package, id, review and a reason in note' });
  });
export type Approval = z.infer<typeof approvalSchema>;

/** The hash of a document that ignores its `status:` line, so approving it or moving it on is not read as a change. */
export const docHash = (markdown: string) => sha256(withStatus(markdown, 'approved'));

/** `_log/approvals.yml`: every approval, appended, never rewritten. */
export function parseApprovals(text: string | undefined): Approval[] {
  if (!text?.trim()) return [];
  const data = parseYaml(text) as { approvals?: unknown };
  return z.array(approvalSchema).parse(data?.approvals ?? []);
}

export const renderApprovals = (all: Approval[]) =>
  `# Written by mandao approve: who approved what, and when.\n${stringifyYaml({ approvals: all }, { lineWidth: 0 })}`;

/** Historical event rows stay append-only; consumers use only approvals not targeted by a later event. */
export function activeApprovals(approvals: Approval[]): Approval[] {
  const events = approvals.filter((row) => row.step === 'revocation' || row.step === 'annulment');
  const annulledEvents = new Set(events.filter((row) => row.step === 'annulment').map((row) => row.target_at));
  const inactive = new Set([
    ...events.filter((row) => row.step === 'annulment').map((row) => row.target_at),
    ...events.filter((row) => row.step === 'revocation' && !annulledEvents.has(row.at)).map((row) => row.target_at),
  ]);
  return approvals.filter((row) => !['revocation', 'annulment'].includes(row.step) && !inactive.has(row.at));
}

/** The frontmatter `status:` set to a value, keeping any trailing comment and everything else byte for byte. */
export function withStatus(markdown: string, status: string): string {
  const fm = /^---\n([\s\S]*?)\n---/.exec(markdown);
  if (!fm) return markdown;
  const body = fm[1]!;
  const next = /^status:/m.test(body) ? body.replace(/^status:[ \t]*\S+/m, `status: ${status}`) : `${body}\nstatus: ${status}`;
  return markdown.replace(fm[0], `---\n${next}\n---`);
}

/**
 * The spec's spend cap: the last budget a person set for it (`mandao approve <spec> budget --to <usd|none>`),
 * else `budget.per_spec`. Off by default: without either there is no cap, only the record. Never set by an agent.
 */
export function specBudget(approvals: Approval[], perSpec: number | undefined): number | undefined {
  const last = activeApprovals(approvals)
    .filter((a) => a.step === 'budget' && a.to)
    .at(-1)?.to;
  if (last === 'none') return undefined;
  return last ?? perSpec;
}

/** The vulnerabilities accepted and still active, as the close summary records them (phase 18). */
export function acceptedRisks(approvals: Approval[]) {
  return activeApprovals(approvals).flatMap((a) =>
    a.step === 'vulnerability' && a.vulnerability
      ? [{ package: a.vulnerability.package, id: a.vulnerability.id, reason: a.note ?? '', review: a.vulnerability.review }]
      : [],
  );
}
