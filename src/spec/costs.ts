import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { z } from 'zod';

/** One recorded cost: what a command spent in a session since the previous record (ADR 0036). */
export const costEntrySchema = z.object({
  at: z.string().min(1),
  command: z.string().min(1),
  harness: z.string().min(1),
  /** The harness session, so a later record in the same session counts only what came after. */
  session: z.string().optional(),
  usd: z.number().nonnegative(),
  roles: z.record(z.string(), z.number()).default({}),
  models: z.record(z.string(), z.number()).default({}),
  /** The session's running total at this record, per role: the next delta starts from here. */
  cumulative: z.record(z.string(), z.number()).optional(),
  source: z.enum(['claude-code', 'manual']),
  /**
   * `billed`: API key or cloud provider, charged at these prices. `equivalent`: a Claude subscription, the
   * same tokens at API list prices, not what was charged. `unknown`: the account type could not be read.
   */
  basis: z.enum(['billed', 'equivalent', 'unknown']).optional(),
});
export type CostEntry = z.infer<typeof costEntrySchema>;

export function parseCosts(text: string | undefined): CostEntry[] {
  if (!text?.trim()) return [];
  return z.array(costEntrySchema).parse((parseYaml(text) as { costs?: unknown })?.costs ?? []);
}

export const renderCosts = (all: CostEntry[]) =>
  `# Written by mandao run cost: what each command spent, per role and model (USD).\n${stringifyYaml({ costs: all }, { lineWidth: 0 })}`;

const round = (n: number) => Math.round(n * 100) / 100;

/** Per-role spend since the session's previous record: running totals now minus those recorded before. */
export function sessionDelta(entries: CostEntry[], session: string, now: Record<string, number>): Record<string, number> {
  const before = [...entries].reverse().find((e) => e.session === session && e.cumulative)?.cumulative ?? {};
  const out: Record<string, number> = {};
  for (const [role, usd] of Object.entries(now)) {
    const d = usd - (before[role] ?? 0);
    if (d > 0.000001) out[role] = d;
  }
  return out;
}

/**
 * Per-model spend the session's earlier records hold, summed from their `models`: the per-model baseline a
 * version 2 entry derives instead of storing `model:` lines in `cumulative` (C-2).
 */
export function sessionModelTotals(entries: CostEntry[], session: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries.filter((x) => x.session === session))
    for (const [model, usd] of Object.entries(e.models)) out[model] = (out[model] ?? 0) + usd;
  return out;
}

export type BudgetStatus = 'ok' | 'warn' | 'over' | 'no-budget';

export interface CostSummary {
  total: number;
  byCommand: Record<string, number>;
  byRole: Record<string, number>;
  budget?: number;
  usedPct?: number;
  /** `warn` from 80% of the budget, `over` from 100%: commands ask before going on (ADR 0036). */
  status: BudgetStatus;
}

const add = (into: Record<string, number>, key: string, usd: number) => {
  into[key] = round((into[key] ?? 0) + usd);
};

export function summarizeCosts(entries: CostEntry[], budget?: number): CostSummary {
  const byCommand: Record<string, number> = {};
  const byRole: Record<string, number> = {};
  let total = 0;
  for (const e of entries) {
    total += e.usd;
    add(byCommand, e.command, e.usd);
    for (const [role, usd] of Object.entries(e.roles)) add(byRole, role, usd);
  }
  total = round(total);
  if (!budget) return { total, byCommand, byRole, status: 'no-budget' };
  const usedPct = Math.round((total / budget) * 100);
  return { total, byCommand, byRole, budget, usedPct, status: usedPct >= 100 ? 'over' : usedPct >= 80 ? 'warn' : 'ok' };
}
