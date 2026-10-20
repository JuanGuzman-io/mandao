import { independence, type ResolvedModels } from '../models/resolve.js';
import { TIERS, type Tier } from '../schemas/index.js';
import type { ExecutionRow } from './execution.js';

export type LoopAction = 'implement' | 'resume-implementation' | 'review' | 'rework' | 'commit' | 'done' | 'halt' | 'pivot';

export interface LoopState {
  task: string;
  action: LoopAction;
  /** Tier the Implementer runs at now (escalated from the task's tier when FAILs accumulate). */
  tier: Tier;
  attempt: number;
  failsAtTier: number;
  implementer?: { model: string; effort?: string };
  reviewer?: { role: 'reviewer' | 'reviewer_alt'; model: string; effort?: string };
  /** `reduced independence` and `provider independence` as they apply to the next review. */
  notes: string[];
  reason: string;
}

const MAX_FAILS_PER_TIER = 2;
const MAX_FAILS_AT_STRONG = 3;

/** The tier after `fails` FAILs at `tier`: 2 FAILs move one tier up; strong has no tier above. */
function escalate(tier: Tier, fails: number): Tier {
  const i = TIERS.indexOf(tier);
  return fails >= MAX_FAILS_PER_TIER && i < TIERS.length - 1 ? TIERS[i + 1]! : tier;
}

/**
 * The Leader's next step for one task, from its rows in execution.md (ADR 0018 checkpoints):
 * escalation after 2 FAILs per tier, HALT after 3 at strong, reviewer chosen by the independence rule.
 */
/** Replays the FAILs to find the current tier and the FAILs counted at it. */
function currentTier(start: Tier, own: ExecutionRow[]): { tier: Tier; fails: number } {
  let tier = start;
  let fails = 0;
  for (const r of own.filter((x) => x.verdict === 'FAIL')) {
    if (r.tier !== tier) fails = 0;
    tier = r.tier as Tier;
    fails += 1;
    const up = escalate(tier, fails);
    if (up !== tier) {
      tier = up;
      fails = 0;
    }
  }
  return { tier, fails };
}

/** Implementer and reviewer for the tier, and the independence notes for the next review. */
function roles(tier: Tier, own: ExecutionRow[], models: ResolvedModels | undefined, harness: string) {
  const impl = models?.implementer[tier];
  const check = models ? independence(models).find((c) => c.tier === tier) : undefined;
  const notes: string[] = [];
  if (check?.reduced) notes.push('reduced independence');
  const reportedIn = [...own].reverse().find((r) => r.verdict === 'REPORTED')?.harness;
  if (reportedIn && reportedIn !== harness) notes.push('provider independence');
  return {
    ...(impl ? { implementer: { model: impl.model, ...(impl.effort ? { effort: impl.effort } : {}) } } : {}),
    ...(check
      ? {
          reviewer: {
            role: check.reviewerRole,
            model: check.reviewer.model,
            ...(check.reviewer.effort ? { effort: check.reviewer.effort } : {}),
          },
        }
      : {}),
    notes,
  };
}

/**
 * The Leader's next step for one task, from its rows in execution.md (ADR 0018 checkpoints):
 * escalation after 2 FAILs per tier, HALT after 3 at strong, reviewer chosen by the independence rule.
 */
export function loopState(
  task: { id: string; tier: Tier },
  rows: ExecutionRow[],
  models: ResolvedModels | undefined,
  harness: string,
): LoopState {
  const own = rows.filter((r) => r.task === task.id);
  const last = own.at(-1);
  const { tier, fails } = currentTier(task.tier, own);
  const attempt = Math.max(1, ...own.map((r) => r.attempt));
  const base = { task: task.id, tier, attempt, failsAtTier: fails, ...roles(tier, own, models, harness) };
  const failsAtStrong = own.filter((r) => r.verdict === 'FAIL' && r.tier === 'strong').length;
  if (failsAtStrong >= MAX_FAILS_AT_STRONG) return { ...base, action: 'halt', reason: `${failsAtStrong} FAILs at strong` };
  switch (last?.verdict) {
    case undefined:
      return { ...base, action: 'implement', reason: 'not started' };
    case 'STARTED':
      return {
        ...base,
        action: 'resume-implementation',
        reason: 'implementation started and not reported yet (in progress or interrupted)',
      };
    case 'REPORTED':
      return { ...base, action: 'review', reason: 'implementation reported, awaiting review' };
    case 'FAIL':
      return { ...base, action: 'rework', attempt: attempt + 1, reason: `FAIL ${fails} at ${tier}` };
    case 'PASS':
    case 'DEFERRED_TO_CI':
      return last.commit && last.commit !== '—'
        ? { ...base, action: 'done', reason: `committed ${last.commit}` }
        : { ...base, action: 'commit', reason: 'PASS without a commit yet' };
    case 'HALT':
      return { ...base, action: 'halt', reason: 'halted' };
    case 'PIVOT':
      return { ...base, action: 'pivot', reason: 'waiting for a Pivot Record sign-off' };
  }
}
