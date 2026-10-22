import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { parseExecution, parseRequirements, parseStory, parseTasks, verifyPlan } from '../../src/spec/index.js';

const dir = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const read = (f: string) => readFileSync(join(dir, f), 'utf8');
const base = () => ({
  story: parseStory(read('story.md')).story!,
  requirements: parseRequirements(read('requirements.md')).requirements,
  tasks: parseTasks(read('tasks.md')).tasks,
  execution: parseExecution(read('execution.md')).rows,
  projects: [{ name: 'mandao', path: '.' }],
  changed: ['src/cli/skills.ts', 'test/unit/skills-list.test.ts'],
  commits: { passed: ['T1'], committed: new Set(['T1']), pending: [] },
});

describe('verifyPlan', () => {
  test('a spec with open tasks is not ready; the suite selects the changed files of its project', () => {
    const plan = verifyPlan(base());
    expect(plan.suites[0]).toEqual({ project: 'mandao', kind: 'unit', files: ['src/cli/skills.ts', 'test/unit/skills-list.test.ts'] });
    expect(plan.blockers).toContain('T2 is not done');
  });

  test('tasks with declared tests and no RED row are reported; deferred runs block until CI confirms', () => {
    const progress = {
      schema_version: 1 as const,
      spec: 'x',
      updated_at: 'now',
      current: null,
      open_questions: [],
      next_step: '',
      deferred_to_ci: [{ task: 'T1', tests: ['e2e'], reason: 'low memory' }],
      red_tests: [],
      pending_commits: [],
      approved_manifests: [],
    };
    const plan = verifyPlan({ ...base(), progress });
    expect(plan.missingRed).toEqual(['T1', 'T2']);
    expect(plan.blockers).toContain('1 run(s) deferred to CI wait for CI (T1)');
    expect(verifyPlan({ ...base(), progress, ciConfirmed: true }).blockers.some((b) => b.includes('deferred'))).toBe(false);
  });

  test('first-green tests need both the recorded pass and the independent Reviewer event', () => {
    const rows = [
      {
        date: 'today',
        task: 'T1',
        attempt: 1,
        tier: 'standard',
        harness: 'claude',
        implementer: 'impl',
        reviewer: '—',
        verdict: 'TESTS_PASS' as const,
        notes: '',
      },
      {
        date: 'today',
        task: 'T1',
        attempt: 1,
        tier: 'standard',
        harness: 'claude',
        implementer: 'impl',
        reviewer: 'reviewer',
        verdict: 'TEST_REVIEWED' as const,
        notes: '',
      },
    ];
    expect(verifyPlan({ ...base(), execution: rows }).missingRed).toEqual(['T2']);
    expect(verifyPlan({ ...base(), execution: rows.slice(0, 1) }).missingRed).toEqual(['T1', 'T2']);
  });

  test('a passed task without its commit blocks verified', () => {
    const plan = verifyPlan({ ...base(), commits: { passed: ['T1'], committed: new Set(), pending: [] } });
    expect(plan.blockers.some((b) => b.startsWith('UNCOMMITTED T1'))).toBe(true);
  });

  test('principle and data-write validation findings block verified', () => {
    const findings = [
      { type: 'PRINCIPLE_GATE' as const, ref: 'DP-SIMPLE', message: 'missing gate row' },
      { type: 'DATA_WRITE' as const, ref: 'partial_failure_tests', message: 'missing partial-failure evidence' },
    ];
    const plan = verifyPlan({ ...base(), designFindings: findings });
    expect(plan.blockers).toContain('PRINCIPLE_GATE DP-SIMPLE: missing gate row');
    expect(plan.blockers).toContain('DATA_WRITE partial_failure_tests: missing partial-failure evidence');
  });
});
