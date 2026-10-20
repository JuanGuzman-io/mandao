import { describe, expect, test } from 'vitest';
import { prPlan, type Task } from '../../src/spec/index.js';

const task = (id: string, project: string, depends_on: string[] = []): Task =>
  ({
    id,
    project,
    tier: 'standard',
    files: [],
    risk_tags: [],
    ac: [],
    scenarios: [],
    tests: { unit: [], e2e: [] },
    dod: [],
    depends_on,
    parallel_safe: false,
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
});
