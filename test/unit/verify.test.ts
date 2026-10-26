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
    // No CI here (MDO-0002): never ask for a CI that does not exist; name the local run that clears it (phase 17).
    expect(verifyPlan({ ...base(), progress, ciAvailable: false }).blockers).toContain(
      '1 run(s) deferred to CI (T1), and this repository has no CI: run them here with `mandao run tests <project> --spec <ID> --deferred <task>`',
    );
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

  test('security-tagged work blocks without coverage and reports unknown separately from none', () => {
    const tasks = base().tasks.map((task) => ({ ...task, risk_tags: ['security' as const] }));
    const plan = verifyPlan({ ...base(), tasks });
    expect(plan.blockers.some((blocker) => blocker.includes('SECURITY_GAPS'))).toBe(true);
    expect(plan.securityScans).toEqual([{ project: 'mandao', secrets: 'unknown', sast: 'unknown', pendingCi: false }]);
  });

  test('CI-only scans stay pending until CI is confirmed; local or recorded declared scans count as coverage', () => {
    const tasks = base().tasks.map((task) => ({ ...task, risk_tags: ['security' as const] }));
    const coverage = [
      {
        project: 'mandao',
        secrets: { local: false, ci: true, provider: false, declared: false, state: 'covered' as const },
        sast: { local: false, ci: false, provider: false, declared: false, state: 'none' as const },
      },
    ];
    const pending = verifyPlan({ ...base(), tasks, securityCoverage: coverage });
    expect(pending.securityScans[0]?.pendingCi).toBe(true);
    expect(pending.blockers.some((blocker) => blocker.includes('pending PR CI'))).toBe(true);
    expect(
      verifyPlan({ ...base(), tasks, securityCoverage: coverage, ciConfirmed: true }).blockers.some((blocker) =>
        blocker.includes('SECURITY_CI_PENDING'),
      ),
    ).toBe(false);

    const local = [{ ...coverage[0]!, secrets: { ...coverage[0]!.secrets, local: true } }];
    expect(verifyPlan({ ...base(), tasks, securityCoverage: local }).blockers.some((blocker) => blocker.includes('SECURITY_'))).toBe(false);
    const declared = [{ ...coverage[0]!, secrets: { ...coverage[0]!.secrets, ci: false, declared: true, state: 'covered' as const } }];
    expect(verifyPlan({ ...base(), tasks, securityCoverage: declared }).blockers.some((blocker) => blocker.includes('SECURITY_'))).toBe(
      false,
    );
  });

  test('a recorded security-gaps approval allows the task to proceed but remains reported', () => {
    const tasks = base().tasks.map((task) => ({ ...task, risk_tags: ['security' as const] }));
    const plan = verifyPlan({ ...base(), tasks, securityGapsApproved: true });
    expect(plan.blockers.some((blocker) => blocker.includes('SECURITY_'))).toBe(false);
    expect(plan.securityScans[0]).toMatchObject({ secrets: 'unknown', sast: 'unknown', pendingCi: false });
  });
});

describe('verifyPlan with a delivery', () => {
  const split = () => {
    const [t1, t2] = base().tasks;
    return [
      { ...t1!, delivery: 1 },
      { ...t2!, delivery: 2 },
    ];
  };
  const partial = (n: number, later: string) =>
    `partial plan: delivery ${n} only; a partial plan cannot verify the spec (AC of later deliveries: ${later})`;

  test('scopes the suites, tasks and evidence to the delivery; the partial-plan blocker keeps the spec unverifiable', () => {
    const plan = verifyPlan({ ...base(), tasks: split(), delivery: 1 });
    expect(plan.scope).toEqual({ delivery: 1, ac: ['AC-1'], tasks: ['T1'], clear: true });
    expect(plan.missingRed).toEqual(['T1']);
    expect(plan.blockers).toEqual([partial(1, 'AC-2')]);
    expect(plan.findings.some((f) => f.ref === 'T2' || f.ref.startsWith('AC-2'))).toBe(false);
  });

  test('findings on the delivery own task or AC stay, block, and clear the scope', () => {
    const [t1, t2] = split();
    const broken = verifyPlan({ ...base(), tasks: [{ ...t1!, ac: ['AC-1', 'AC-9'] }, t2!], delivery: 1 });
    expect(broken.blockers.some((b) => b.startsWith('BROKEN_REF T1'))).toBe(true);
    expect(broken.scope?.clear).toBe(false);
    const gap = verifyPlan({ ...base(), requirements: { ...base().requirements, requirements: [] }, tasks: split(), delivery: 1 });
    expect(gap.blockers.some((b) => b.startsWith('GAP AC-1'))).toBe(true);
    expect(gap.blockers.some((b) => b.startsWith('GAP AC-2'))).toBe(false);
    expect(gap.scope?.clear).toBe(false);
  });

  test('delivery 2 keeps delivery 1 findings (uncommitted task, AC) and drops later deliveries', () => {
    const [t1, t2] = split();
    const tasks = [t1!, { ...t2!, done: true }, { ...t2!, id: 'T3', delivery: 3, ac: ['AC-3', 'AC-3/C1'], done: false }];
    const commits = { passed: ['T1'], committed: new Set<string>(), pending: [] };
    const plan = verifyPlan({ ...base(), tasks, commits, delivery: 2 });
    expect(plan.blockers.some((b) => b.startsWith('UNCOMMITTED T1'))).toBe(true);
    expect(plan.blockers.some((b) => b.includes('T3'))).toBe(false);
    expect(plan.blockers[0]).toBe(partial(2, 'AC-3'));
    expect(plan.scope).toMatchObject({ delivery: 2, tasks: ['T2'], clear: false });
    const progress = {
      schema_version: 1 as const,
      spec: 'x',
      updated_at: 'now',
      current: null,
      open_questions: [],
      next_step: '',
      deferred_to_ci: [
        { task: 'T1', tests: ['e2e'], reason: 'r' },
        { task: 'T3', tests: ['e2e'], reason: 'r' },
      ],
      red_tests: [],
      pending_commits: [],
      approved_manifests: [],
    };
    expect(verifyPlan({ ...base(), tasks, commits, progress, delivery: 2 }).deferred.map((d) => d.task)).toEqual(['T1']);
  });

  test('an unknown delivery, or a spec without deliveries, is an error', () => {
    expect(() => verifyPlan({ ...base(), tasks: split(), delivery: 3 })).toThrow('delivery 3 does not exist: the spec has 1, 2');
    expect(() => verifyPlan({ ...base(), delivery: 1 })).toThrow('needs a spec with deliveries');
  });

  test('without a delivery the plan has no scope and still reports every open task', () => {
    const plan = verifyPlan({ ...base(), tasks: split() });
    expect(plan.scope).toBeUndefined();
    expect(plan.blockers).toContain('T2 is not done');
  });
});
