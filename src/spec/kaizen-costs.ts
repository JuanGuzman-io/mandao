import type { CostEntry } from './costs.js';
import type { ExecutionRow } from './execution.js';
import type { Task } from './tasks.js';

export interface SpecCostInput {
  spec: string;
  costs: CostEntry[];
  tasks: Task[];
  rows: ExecutionRow[];
}

export interface CostKaizen {
  /** Specs with recorded costs: the sample size of every number below. */
  n: number;
  avgPerSpec: number;
  avgPerCommand: Record<string, number>;
  /** The Leader's share of implement, across specs. */
  leaderShare?: number;
  /** First review PASS per task, by the tier the task ran at. */
  firstPassByTier: Record<string, { tasks: number; rate: number }>;
  /** Advice with its data and estimated saving; Mandao never applies it (ADR 0036). */
  recommendations: string[];
}

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

function firstPass(inputs: SpecCostInput[]): CostKaizen['firstPassByTier'] {
  const by: Record<string, { tasks: number; pass: number }> = {};
  for (const { tasks, rows } of inputs)
    for (const t of tasks) {
      const verdict = rows.find((r) => r.task === t.id && (r.verdict === 'PASS' || r.verdict === 'FAIL'));
      if (!verdict) continue;
      const tier = verdict.tier === '—' ? t.tier : verdict.tier;
      by[tier] ??= { tasks: 0, pass: 0 };
      by[tier].tasks++;
      if (verdict.verdict === 'PASS') by[tier].pass++;
    }
  return Object.fromEntries(Object.entries(by).map(([tier, v]) => [tier, { tasks: v.tasks, rate: round(v.pass / v.tasks) }]));
}

export interface LeaderSwitch {
  /** The profile that would change the Leader, and the input price ratio of its model to the current one. */
  profile: string;
  model: string;
  priceRatio: number;
}

/** Spend totals across specs: overall, per command, and the Leader's part of implement. */
function totals(withCosts: SpecCostInput[]) {
  const perCommand: Record<string, number> = {};
  let total = 0;
  let leader = 0;
  let implement = 0;
  for (const e of withCosts.flatMap((i) => i.costs)) {
    total += e.usd;
    perCommand[e.command] = (perCommand[e.command] ?? 0) + e.usd;
    if (e.command !== 'implement') continue;
    implement += e.usd;
    leader += e.roles.leader ?? 0;
  }
  return { perCommand, total, leader, implement };
}

/** Per tier with 5 tasks or more: a high first-pass rate supports a cheaper model, a low one a stronger. */
function tierAdvice(firstPassByTier: CostKaizen['firstPassByTier']): string[] {
  return Object.entries(firstPassByTier).flatMap(([tier, v]) => {
    if (v.tasks < 5) return [];
    const pct = Math.round(v.rate * 100);
    if (v.rate >= 0.9)
      return [
        `${tier} tasks pass review the first time ${pct}% of the time (${v.tasks} tasks): the data supports a cheaper ${tier} implementer.`,
      ];
    if (v.rate < 0.6)
      return [
        `${tier} tasks pass review the first time only ${pct}% of the time (${v.tasks} tasks): rework costs more than a stronger ${tier} implementer would.`,
      ];
    return [];
  });
}

/**
 * Kaizen's cost view across specs: where the money goes and what the data supports changing, with the
 * estimated saving. Below `minSpecs` specs it reports the numbers and recommends no profile change.
 */
export function costKaizen(inputs: SpecCostInput[], leaderSwitch?: LeaderSwitch, minSpecs = 3): CostKaizen {
  const withCosts = inputs.filter((i) => i.costs.length);
  const n = withCosts.length;
  const { perCommand, total, leader, implement } = totals(withCosts);
  const firstPassByTier = firstPass(withCosts);
  const avgLeader = n ? leader / n : 0;
  const switchAdvice =
    n >= minSpecs && leaderSwitch && avgLeader > 0
      ? [
          `The Leader is ${Math.round((leader / implement) * 100)}% of implement (${n} specs). The ${leaderSwitch.profile} profile runs it on ${leaderSwitch.model}: about ${round(avgLeader * (1 - leaderSwitch.priceRatio))} USD less per spec. To apply: mandao models profile ${leaderSwitch.profile}.`,
        ]
      : [];
  return {
    n,
    avgPerSpec: n ? round(total / n) : 0,
    avgPerCommand: Object.fromEntries(Object.entries(perCommand).map(([c, v]) => [c, round(v / n)])),
    ...(implement ? { leaderShare: round(leader / implement) } : {}),
    firstPassByTier,
    recommendations: [...switchAdvice, ...tierAdvice(firstPassByTier)],
  };
}
