import type { ExecutionRow } from './execution.js';
import type { Task } from './tasks.js';

/**
 * TDD practice of a spec (ADR 0022): every task with mandatory tests has red evidence, none, or some.
 * Characterization tasks (pinning existing behavior, proven by mutations) are counted apart: a spec made
 * only of them is `characterization`, in neither comparison group.
 */
export type TddPractice = 'tdd' | 'no-tdd' | 'partial' | 'characterization' | 'not-applicable';

export interface BugsAfterMerge {
  /** `fix` commits whose `Refs` trailer points to the spec, dated after it closed. */
  fromCommits: number;
  /** Bugs the tracker links to the story after the close, when a tracker MCP was queried. */
  fromTracker?: number;
  total: number;
  /** The metric depends on references being made: commits with Refs, bugs linked to the story. */
  note: string;
}

export interface SpecMetrics {
  spec: string;
  tasks: number;
  /** Tasks that needed at least one rework (a FAIL). */
  reworkRate: number;
  reviewerFails: number;
  /** Times a task moved up a tier. */
  escalations: number;
  pivots: number;
  halts: number;
  reducedIndependence: number;
  providerIndependence: number;
  forcedRuns: number;
  tdd: { practice: TddPractice; tasksWithTests: number; tasksWithRed: number; tasksCharacterized: number; tasksWithMutants: number };
  bugsAfterMerge?: BugsAfterMerge;
}

const round = (n: number) => Math.round(n * 100) / 100;

function escalations(rows: ExecutionRow[]): number {
  let count = 0;
  const lastTier = new Map<string, string>();
  for (const r of rows) {
    const prev = lastTier.get(r.task);
    if (prev && r.tier !== '—' && r.tier !== prev) count++;
    if (r.tier !== '—') lastTier.set(r.task, r.tier);
  }
  return count;
}

function practiceOf(withTests: number, withRed: number, characterized: number): TddPractice {
  if (!withTests) return characterized ? 'characterization' : 'not-applicable';
  if (withRed === withTests) return 'tdd';
  return withRed === 0 ? 'no-tdd' : 'partial';
}

function tddPractice(tasks: Task[], rows: ExecutionRow[]): SpecMetrics['tdd'] {
  const has = (t: Task, verdict: string) => rows.some((r) => r.task === t.id && r.verdict === verdict);
  const tested = tasks.filter((t) => t.tests.unit.length + t.tests.e2e.length > 0 && t.evidence !== 'none');
  const characterized = tested.filter((t) => t.characterization);
  const withTests = tested.filter((t) => !t.characterization);
  const withRed = withTests.filter((t) => has(t, 'RED'));
  return {
    practice: practiceOf(withTests.length, withRed.length, characterized.length),
    tasksWithTests: withTests.length,
    tasksWithRed: withRed.length,
    tasksCharacterized: characterized.length,
    tasksWithMutants: characterized.filter((t) => has(t, 'MUTANT')).length,
  };
}

/** Kaizen's measure step (design §18.1) for one spec, from its execution log only. */
export function specMetrics(spec: string, tasks: Task[], rows: ExecutionRow[], forcedRuns = 0, bugs?: BugsAfterMerge): SpecMetrics {
  const failedTasks = new Set(rows.filter((r) => r.verdict === 'FAIL').map((r) => r.task));
  const has = (flag: string) => rows.filter((r) => r.notes.includes(flag)).length;
  return {
    spec,
    tasks: tasks.length,
    reworkRate: tasks.length ? round(failedTasks.size / tasks.length) : 0,
    reviewerFails: rows.filter((r) => r.verdict === 'FAIL').length,
    escalations: escalations(rows),
    pivots: rows.filter((r) => r.verdict === 'PIVOT').length,
    halts: rows.filter((r) => r.verdict === 'HALT').length,
    reducedIndependence: has('reduced independence'),
    providerIndependence: has('provider independence'),
    forcedRuns,
    tdd: tddPractice(tasks, rows),
    ...(bugs ? { bugsAfterMerge: bugs } : {}),
  };
}

export interface GroupSummary {
  specs: string[];
  /** Sample size, always shown. */
  n: number;
  avgReworkRate: number;
  avgReviewerFailsPerTask: number;
  /** Over the specs that have the bug metric (closed long enough to count). */
  avgBugsAfterMerge?: number;
}

export interface TddComparison {
  minPerGroup: number;
  tdd: GroupSummary;
  noTdd: GroupSummary;
  /** Specs left out: partial TDD, characterization only, or no tests at all. */
  excluded: string[];
  /** `insufficient data` below the minimum per group; otherwise the differences, never a verdict on causes. */
  result: 'insufficient data' | { reworkRateDelta: number; reviewerFailsPerTaskDelta: number; bugsAfterMergeDelta?: number };
}

const avg = (xs: number[]) => (xs.length ? round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

function summarize(group: SpecMetrics[]): GroupSummary {
  const bugs = group.flatMap((m) => (m.bugsAfterMerge ? [m.bugsAfterMerge.total] : []));
  return {
    specs: group.map((m) => m.spec),
    n: group.length,
    avgReworkRate: avg(group.map((m) => m.reworkRate)),
    avgReviewerFailsPerTask: avg(group.map((m) => (m.tasks ? m.reviewerFails / m.tasks : 0))),
    ...(bugs.length ? { avgBugsAfterMerge: avg(bugs) } : {}),
  };
}

/**
 * Specs with and without TDD side by side (ADR 0022). Below `minPerGroup` specs in either group the
 * result is `insufficient data`: a couple of specs validate the mechanism, not the hypothesis.
 */
export function compareTdd(metrics: SpecMetrics[], minPerGroup = 5): TddComparison {
  const tdd = summarize(metrics.filter((m) => m.tdd.practice === 'tdd'));
  const noTdd = summarize(metrics.filter((m) => m.tdd.practice === 'no-tdd'));
  const excluded = metrics.filter((m) => m.tdd.practice !== 'tdd' && m.tdd.practice !== 'no-tdd').map((m) => m.spec);
  const enough = tdd.n >= minPerGroup && noTdd.n >= minPerGroup;
  const result: TddComparison['result'] = enough
    ? {
        reworkRateDelta: round(tdd.avgReworkRate - noTdd.avgReworkRate),
        reviewerFailsPerTaskDelta: round(tdd.avgReviewerFailsPerTask - noTdd.avgReviewerFailsPerTask),
        ...(tdd.avgBugsAfterMerge !== undefined && noTdd.avgBugsAfterMerge !== undefined
          ? { bugsAfterMergeDelta: round(tdd.avgBugsAfterMerge - noTdd.avgBugsAfterMerge) }
          : {}),
      }
    : 'insufficient data';
  return { minPerGroup, tdd, noTdd, excluded, result };
}
