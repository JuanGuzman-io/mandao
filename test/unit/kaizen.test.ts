import { describe, expect, test } from 'vitest';
import { isFixHeader } from '../../src/scripts/close.js';
import { compareTdd, type ExecutionRow, specMetrics, type Task } from '../../src/spec/index.js';

const task = (id: string, tests = true): Task =>
  ({
    id,
    project: 'p',
    tier: 'standard',
    files: [],
    risk_tags: [],
    ac: [],
    scenarios: [],
    tests: { unit: tests ? ['x'] : [], e2e: [] },
    dod: [],
    depends_on: [],
    parallel_safe: false,
    title: id,
    done: true,
    line: 1,
  }) as Task;
const row = (task: string, verdict: ExecutionRow['verdict'], tier = 'standard', notes = ''): ExecutionRow => ({
  date: 'd',
  task,
  attempt: 1,
  tier,
  harness: 'claude',
  implementer: 'x',
  reviewer: 'y',
  verdict,
  notes,
});

describe('Kaizen metrics (ADR 0026)', () => {
  test('rework, FAILs, escalations, independence and TDD practice from the log', () => {
    const rows = [
      row('T1', 'STARTED'),
      row('T1', 'RED'),
      row('T1', 'FAIL', 'standard', 'provider independence'),
      row('T1', 'FAIL'),
      row('T1', 'PASS', 'strong', 'reduced independence'),
      row('T2', 'RED'),
      row('T2', 'PASS'),
    ];
    expect(specMetrics('S', [task('T1'), task('T2')], rows, 1)).toEqual({
      spec: 'S',
      tasks: 2,
      reworkRate: 0.5,
      reviewerFails: 2,
      escalations: 1,
      pivots: 0,
      halts: 0,
      reducedIndependence: 1,
      providerIndependence: 1,
      forcedRuns: 1,
      tdd: { practice: 'tdd', tasksWithTests: 2, tasksWithRed: 2 },
    });
    expect(specMetrics('S', [task('T1'), task('T2')], [row('T1', 'RED')]).tdd.practice).toBe('partial');
    expect(specMetrics('S', [task('T1', false)], []).tdd.practice).toBe('not-applicable');
  });

  test('below the minimum per group the comparison says insufficient data, with the sample sizes', () => {
    const tdd = specMetrics('MDO-0002', [task('T1')], [row('T1', 'RED'), row('T1', 'PASS')]);
    const no = specMetrics('MDO-0001', [task('T1')], [row('T1', 'FAIL'), row('T1', 'PASS')]);
    const c = compareTdd([tdd, no]);
    expect(c).toMatchObject({ minPerGroup: 5, result: 'insufficient data', tdd: { n: 1, specs: ['MDO-0002'] }, noTdd: { n: 1 } });
    const many = compareTdd([tdd, tdd, no, no], 2);
    expect(many.result).toEqual({ reworkRateDelta: -1, reviewerFailsPerTaskDelta: -1 });
  });

  test('fix headers with or without emoji, scope and bang', () => {
    expect(['🐛 fix(cli): x', 'fix: x', 'fix!: x', '🐛 fix(a-b)!: x'].every(isFixHeader)).toBe(true);
    expect(['✨ feat(cli): fix x', 'prefix: x', 'fixes: x'].some(isFixHeader)).toBe(false);
  });
});
