import { describe, expect, test } from 'vitest';
import { prPlan, type Task } from '../../src/spec/index.js';

const task = (id: string, project: string, depends_on: string[] = []): Task =>
  ({
    id,
    project,
    tier: 'standard',
    files: [],
    risk_tags: [],
    partial_failure_tests: [],
    ac: [],
    scenarios: [],
    decisions: [],
    tests: { unit: [], e2e: [] },
    dod: [],
    depends_on,
    parallel_safe: false,
    characterization: false,
    title: id,
    done: true,
    line: 1,
  }) as Task;
const size = (n: number, ...files: string[]) => ({ files, changedLines: n });
const limits = { max_files: 25, max_changed_lines: 400 };

describe('PR plan from structure and the real diff (ADR 0028)', () => {
  const tasks = [task('T1', 'api'), task('T2', 'api', ['T1']), task('T3', 'web', ['T2'])];
  const waves = [['T1'], ['T2'], ['T3']];

  test('within the limit: one PR', () => {
    const sizes = new Map([
      ['T1', size(50, 'a')],
      ['T2', size(60, 'b')],
      ['T3', size(40, 'c')],
    ]);
    expect(prPlan({ tasks, waves, sizes, limits, polyrepo: false })).toMatchObject({
      decision: 'single',
      prs: [{ changedLines: 150, files: 3 }],
    });
  });

  test('over the limit: stacked along the dependency waves, sized from the commits', () => {
    const sizes = new Map([
      ['T1', size(300, 'a')],
      ['T2', size(200, 'b')],
      ['T3', size(100, 'c')],
    ]);
    const plan = prPlan({ tasks, waves, sizes, limits, polyrepo: false });
    expect(plan.decision).toBe('stacked');
    expect(plan.reasons[0]).toBe('600 lines changed (limit 400)');
    expect(plan.prs.map((p) => [p.name, p.tasks, p.changedLines])).toEqual([
      ['wave 1', ['T1'], 300],
      ['wave 2', ['T2'], 200],
      ['wave 3', ['T3'], 100],
    ]);
  });

  test('polyrepo: one PR per repository whatever the size', () => {
    const sizes = new Map([
      ['T1', size(1)],
      ['T2', size(1)],
      ['T3', size(1)],
    ]);
    expect(prPlan({ tasks, waves, sizes, limits, polyrepo: true }).prs.map((p) => p.name)).toEqual(['api', 'web']);
  });

  test('over the limit without structure: one PR, said so', () => {
    const one = [task('T1', 'api')];
    const plan = prPlan({ tasks: one, waves: [['T1']], sizes: new Map([['T1', size(900, 'a')]]), limits, polyrepo: false });
    expect(plan).toMatchObject({
      decision: 'single',
      reasons: ['900 lines changed (limit 400)', expect.stringMatching(/no dependency or project structure/)],
    });
  });

  describe('deliveries (MDO-0013)', () => {
    const big = new Map([
      ['T1', size(300, 'a')],
      ['T2', size(200, 'b')],
      ['T3', size(100, 'c')],
    ]);
    const deliveries = [
      { number: 1, tasks: ['T1', 'T2'], ac: ['AC-1'], done: true },
      { number: 2, tasks: ['T3'], ac: ['AC-2'], done: true },
    ];

    test('over the limit with two deliveries: one PR per delivery, ahead of the waves', () => {
      const plan = prPlan({ tasks, waves, sizes: big, limits, polyrepo: false, deliveries });
      expect(plan.decision).toBe('stacked');
      expect(plan.reasons).toEqual(['600 lines changed (limit 400)', 'split along 2 deliveries']);
      expect(plan.prs.map((p) => [p.name, p.tasks, p.changedLines])).toEqual([
        ['delivery 1', ['T1', 'T2'], 500],
        ['delivery 2', ['T3'], 100],
      ]);
    });

    test('within the limit: still one PR', () => {
      const small = new Map([['T1', size(50, 'a')]]);
      expect(prPlan({ tasks, waves, sizes: small, limits, polyrepo: false, deliveries }).decision).toBe('single');
    });

    test('one delivery: the waves remain the fallback', () => {
      const plan = prPlan({ tasks, waves, sizes: big, limits, polyrepo: false, deliveries: [deliveries[0]!] });
      expect(plan.prs.map((p) => p.name)).toEqual(['wave 1', 'wave 2', 'wave 3']);
    });

    test('polyrepo: per repository, deliveries do not apply', () => {
      expect(prPlan({ tasks, waves, sizes: big, limits, polyrepo: true, deliveries }).decision).toBe('per-repo');
    });
  });
});
