import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { z } from 'zod';

/** What a human approves without a model session (cost-conscious design, `mandao approve`). */
export const APPROVAL_STEPS = ['story', 'design', 'spec', 'tasks', 'close', 'budget'] as const;
export type ApprovalStep = (typeof APPROVAL_STEPS)[number];

export const approvalSchema = z.object({
  step: z.enum(APPROVAL_STEPS),
  by: z.string().min(1),
  at: z.string().min(1),
  /** close: the proposals approved (impacts, standardizations); the next close session applies them. */
  items: z.array(z.string()).optional(),
  note: z.string().optional(),
  /** budget: the spend (USD) the person authorizes for this spec, or `none` to remove its cap (ADR 0036). */
  to: z.union([z.number().positive(), z.literal('none')]).optional(),
});
export type Approval = z.infer<typeof approvalSchema>;

/** `_log/approvals.yml`: every approval, appended, never rewritten. */
export function parseApprovals(text: string | undefined): Approval[] {
  if (!text?.trim()) return [];
  const data = parseYaml(text) as { approvals?: unknown };
  return z.array(approvalSchema).parse(data?.approvals ?? []);
}

export const renderApprovals = (all: Approval[]) =>
  `# Written by mandao approve: who approved what, and when.\n${stringifyYaml({ approvals: all }, { lineWidth: 0 })}`;

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
  const last = approvals.filter((a) => a.step === 'budget' && a.to).at(-1)?.to;
  if (last === 'none') return undefined;
  return last ?? perSpec;
}
