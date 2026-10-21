import { type Choice, independence, type ResolvedModels, TIER_RANK } from '../models/resolve.js';
import { TIERS, type Tier } from '../schemas/index.js';
import type { ExecutionRow } from './execution.js';

export type LoopAction =
  | 'write-red-tests'
  | 'implement'
  | 'resume-implementation'
  | 'review'
  | 'rework'
  | 'commit'
  | 'done'
  | 'halt'
  | 'pivot'
  | 'await-budget';

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
  /**
   * When the review would be reduced independence: a reviewer in another installed harness, run as a
   * read-only process by `mandao run review --via <harness>`, never below the Implementer's tier (ADR 0021).
   */
  crossReview?: { harness: string; model: string; effort?: string };
  /**
   * TDD (ADR 0022): required when the task declares tests; the red tests are written by the Tester for
   * tasks with risk tags or tier strong, by the Implementer otherwise; `red` once `mandao run red` recorded them.
   */
  tdd: { required: boolean; testsBy: 'tester' | 'implementer'; red: boolean; evidence: 'red' | 'mutation' };
  reason: string;
}

/** What loop needs from a task: tier, and for TDD its declared tests and risk tags. */
export interface LoopTask {
  id: string;
  tier: Tier;
  tests?: { unit: string[]; e2e: string[] };
  risk_tags?: string[];
  /** Pins down existing behavior: evidence is a recorded mutation (`MUTANT`), not a red run. */
  characterization?: boolean;
  /** `none`: the task declares no evidence to prove (docs, config); there is no red step. */
  evidence?: 'tdd' | 'mutation' | 'none';
}

function tddFor(task: LoopTask, own: ExecutionRow[]): LoopState['tdd'] {
  const required = Boolean(task.tests && task.tests.unit.length + task.tests.e2e.length > 0) && task.evidence !== 'none';
  const testsBy = required && (task.risk_tags?.length || task.tier === 'strong') ? 'tester' : 'implementer';
  const evidence = task.characterization ? 'mutation' : 'red';
  return { required, testsBy, red: own.some((r) => r.verdict === (evidence === 'mutation' ? 'MUTANT' : 'RED')), evidence };
}

/** A reviewer another installed harness offers, with Mandao's tier for its model. */
export interface CrossReviewer {
  harness: string;
  reviewer: Choice;
  tier?: Tier;
}

export interface LoopContext {
  /** True when git holds a commit with this task's trailers (`taskCommits`). */
  committed?: boolean;
  /** Reviewers in other installed and available harnesses, in preference order. */
  alternatives?: CrossReviewer[];
}

const MAX_FAILS_PER_TIER = 2;
const MAX_FAILS_AT_STRONG = 3;

/** The tier after `fails` FAILs at `tier`: 2 FAILs move one tier up; strong has no tier above. */
function escalate(tier: Tier, fails: number): Tier {
  const i = TIERS.indexOf(tier);
  return fails >= MAX_FAILS_PER_TIER && i < TIERS.length - 1 ? TIERS[i + 1]! : tier;
}

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

/**
 * The agent Mandao routed to write a task's tests now: the Tester for tasks with risk tags or tier strong,
 * else the Implementer of the current (possibly escalated) tier, or the single Implementer in simple mode.
 * Red and mutation evidence record this agent, never a name the model typed (MDO-0006).
 */
export function testWriter(task: LoopTask, rows: ExecutionRow[], simple: boolean): string {
  const own = rows.filter((r) => r.task === task.id);
  if (tddFor(task, own).testsBy === 'tester') return 'mandao-tester';
  return simple ? 'mandao-implementer' : `mandao-implementer-${currentTier(task.tier, own).tier}`;
}

/** The first other-harness reviewer at or above the Implementer's tier; none when the tier is unknown. */
export function crossReviewer(impl: Choice | undefined, models: ResolvedModels, alternatives: CrossReviewer[]) {
  const implTier = impl ? models.tiers[impl.model] : undefined;
  if (!implTier) return undefined;
  const alt = alternatives.find((a) => a.tier && TIER_RANK[a.tier] >= TIER_RANK[implTier]);
  return alt && { harness: alt.harness, model: alt.reviewer.model, ...(alt.reviewer.effort ? { effort: alt.reviewer.effort } : {}) };
}

/** Implementer and reviewer for the tier, and the independence notes for the next review. */
function roles(tier: Tier, own: ExecutionRow[], models: ResolvedModels | undefined, harness: string, alternatives: CrossReviewer[]) {
  const impl = models?.implementer[tier];
  const check = models ? independence(models).find((c) => c.tier === tier) : undefined;
  const notes: string[] = [];
  const cross = check?.reduced && models ? crossReviewer(impl, models, alternatives) : undefined;
  if (check?.reduced && !cross) notes.push('reduced independence');
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
    ...(cross ? { crossReview: cross } : {}),
    notes,
  };
}

type StepBase = Omit<LoopState, 'action' | 'reason'>;

/**
 * The attempt in progress for a task: one plus its FAILs (a Reviewer's or the gates'). Computed from the
 * log by every script that records a row; nobody types it (MDO-0008: rows said attempt 1 at attempt 3).
 */
export function taskAttempt(rows: ExecutionRow[], task: string): number {
  return 1 + rows.filter((r) => r.task === task && r.verdict === 'FAIL').length;
}

/**
 * Before the implementation is reported: no implementation brief until the red run is recorded, whoever
 * writes the tests (MDO-0007: a brief that mixed both put the code before the red run). Else implement.
 */
function startStep(base: StepBase, started: boolean): LoopState {
  const { tdd } = base;
  // Characterization tests pass from the start: nothing to write red first.
  if (tdd.required && tdd.evidence === 'red' && !tdd.red) {
    const who = tdd.testsBy === 'tester' ? 'the Tester' : 'the Implementer';
    return {
      ...base,
      action: 'write-red-tests',
      reason: `${who} writes only the red tests from the spec and records them with \`mandao run red\`; the implementation comes after the RED row`,
    };
  }
  if (!started) return { ...base, action: 'implement', reason: 'not started' };
  return { ...base, action: 'resume-implementation', reason: 'implementation started and not reported yet (in progress or interrupted)' };
}

/**
 * The Leader's next step for one task, from its rows in execution.md (ADR 0018 checkpoints):
 * escalation after 2 FAILs per tier, HALT after 3 at strong, reviewer chosen by the independence rule.
 */
export function loopState(
  task: LoopTask,
  rows: ExecutionRow[],
  models: ResolvedModels | undefined,
  harness: string,
  { committed = false, alternatives = [] }: LoopContext = {},
): LoopState {
  const own = rows.filter((r) => r.task === task.id);
  const last = own.at(-1);
  const { tier, fails } = currentTier(task.tier, own);
  const attempt = taskAttempt(rows, task.id);
  const tdd = tddFor(task, own);
  const base = { task: task.id, tier, attempt, failsAtTier: fails, tdd, ...roles(tier, own, models, harness, alternatives) };
  const failsAtStrong = own.filter((r) => r.verdict === 'FAIL' && r.tier === 'strong').length;
  if (failsAtStrong >= MAX_FAILS_AT_STRONG) return { ...base, action: 'halt', reason: `${failsAtStrong} FAILs at strong` };
  switch (last?.verdict) {
    case undefined:
    case 'STARTED':
      return startStep(base, Boolean(last));
    case 'RED':
      return { ...base, action: 'implement', reason: 'red tests recorded: make them pass with the minimum code' };
    case 'MUTANT':
      return { ...base, action: 'resume-implementation', reason: 'mutation recorded: report once every assertion has one' };
    case 'REPORTED':
      if (tdd.required && !tdd.red) base.notes.push(tdd.evidence === 'mutation' ? 'no mutation evidence' : 'no red evidence');
      return { ...base, action: 'review', reason: 'implementation reported, awaiting review' };
    case 'FAIL':
      return { ...base, action: 'rework', reason: `FAIL ${fails} at ${tier}` };
    case 'PASS':
    case 'DEFERRED_TO_CI':
      return committed
        ? { ...base, action: 'done', reason: 'committed (found by its trailers)' }
        : { ...base, action: 'commit', reason: 'PASS without a commit carrying its trailers yet' };
    case 'HALT':
      return { ...base, action: 'halt', reason: 'halted' };
    case 'PIVOT':
      return { ...base, action: 'pivot', reason: 'waiting for a Pivot Record sign-off' };
  }
}
