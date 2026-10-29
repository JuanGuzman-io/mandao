import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { resolveModels } from '../../src/models/resolve.js';
import { configSchema, recommendationsSchema } from '../../src/schemas/index.js';
import {
  commitMessage,
  type ExecutionRow,
  executionRow,
  loopState,
  parseExecution,
  parseRequirements,
  parseStory,
  parseTasks,
  planTasks,
  progressSchema,
  setTaskDone,
  trace,
  trackerRef,
} from '../../src/spec/index.js';

const dir = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const read = (f: string) => readFileSync(join(dir, f), 'utf8');

describe('parsers on the sample spec', () => {
  test('story: frontmatter, AC and edge clauses', () => {
    const { story, issues } = parseStory(read('story.md'));
    expect(issues).toEqual([]);
    expect(story?.meta).toMatchObject({ id: 'MDO-0001', status: 'approved', type: 'story' });
    expect(story?.acs.map((a) => [a.id, a.clauses.filter((c) => c.id).map((c) => `${c.kind}:${c.id}`)])).toEqual([
      ['AC-1', ['but-not:C1']],
      ['AC-2', ['and-must:C1']],
    ]);
  });

  test('requirements, tasks, execution and progress', () => {
    expect(
      parseRequirements(read('requirements.md')).requirements.requirements.map((r) => [r.id, r.serves, r.scenarios.map((s) => s.id)]),
    ).toEqual([
      ['FR-1', ['AC-1', 'AC-1/C1'], ['S-1.1']],
      ['FR-2', ['AC-2', 'AC-2/C1'], ['S-2.1']],
    ]);
    const { tasks, issues } = parseTasks(read('tasks.md'));
    expect(issues).toEqual([]);
    expect(tasks.map((t) => [t.id, t.done, t.tier, t.depends_on])).toEqual([
      ['T1', true, 'fast', []],
      ['T2', false, 'standard', ['T1']],
    ]);
    expect(parseExecution(read('execution.md')).rows.map((r) => [r.task, r.verdict])).toEqual([
      ['T1', 'PASS'],
      ['T2', 'STARTED'],
    ]);
    expect(progressSchema.parse(parseYaml(read('progress.yml'))).current).toMatchObject({ task: 'T2', phase: 'implementing' });
  });

  test('the tasks template parses in the two-layer layout, with test levels and no prose in YAML', () => {
    const template = readFileSync(join(import.meta.dirname, '../../core/templates/shared/spec/tasks.md'), 'utf8');
    const { tasks, issues } = parseTasks(template);
    expect(issues).toEqual([]);
    expect(tasks[0]).toMatchObject({ tests: { unit: ['S-1.1', 'S-1.1/C1'], e2e: [] }, evidence: 'tdd', dod: [] });
  });
});

describe('malformed documents', () => {
  test('edge clauses without an id are numbered and reported', () => {
    const md =
      '---\nschema_version: 1\nid: MDO-0002\n---\n### AC-1 — x\n- **GIVEN** a\n- **BUT it must NOT** b\n- **AND IT MUST** c (C1)\n';
    const { story, issues } = parseStory(md);
    expect(story?.acs[0]?.clauses.filter((c) => c.id).map((c) => c.id)).toEqual(['C1', 'C1']);
    expect(issues).toEqual(
      expect.arrayContaining([expect.stringContaining('edge clause without an id'), expect.stringContaining('duplicate clause id C1')]),
    );
  });

  test('task headings and fields are validated', () => {
    const md = '### T-1 — old style\n\n### [ ] T2 — no block\n\n### [ ] T3 — bad\n\n```yaml\nproject: x\ntier: huge\nfoo: 1\n```\n';
    const { tasks, issues } = parseTasks(md);
    expect(tasks).toEqual([]);
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('task heading must be "### [ ] Tn — title"'),
        expect.stringContaining('T2 has no ```yaml block'),
        expect.stringMatching(/T3: tier/),
      ]),
    );
  });

  test('setTaskDone only flips the checkbox', () => {
    const md = read('tasks.md');
    const updated = setTaskDone(md, 'T2', true);
    expect(updated.replace('### [x] T2', '### [ ] T2')).toBe(md);
    expect(parseTasks(updated).tasks.find((t) => t.id === 'T2')?.done).toBe(true);
  });
});

describe('trace', () => {
  const story = parseStory(read('story.md')).story!;
  const reqs = parseRequirements(read('requirements.md')).requirements;
  const tasks = parseTasks(read('tasks.md')).tasks;

  test('the sample spec is fully traced', () => {
    const t = trace(story, reqs, tasks);
    expect(t.findings).toEqual([]);
    expect(t.rows.find((r) => r.ref === 'AC-1/C1')).toMatchObject({ requirements: ['FR-1'], tasks: ['T1'] });
  });

  test('a clause is only covered when cited exactly', () => {
    const loose = { ...reqs, requirements: reqs.requirements.map((r) => ({ ...r, serves: r.serves.filter((s) => !s.includes('/')) })) };
    expect(
      trace(story, loose)
        .findings.filter((f) => f.type === 'GAP')
        .map((f) => f.ref),
    ).toEqual(['AC-1/C1', 'AC-2/C1']);
  });

  test('orphans, broken references, unplanned scenarios and critical AC without e2e', () => {
    const critical = { ...story, acs: story.acs.map((a) => (a.id === 'AC-2' ? { ...a, critical: true } : a)) };
    const extra = {
      ...reqs,
      requirements: [
        ...reqs.requirements,
        {
          id: 'FR-9',
          kind: 'FR' as const,
          title: 'x',
          serves: ['AC-7'],
          projects: [],
          scenarios: [{ id: 'S-9.1', title: 'y', clauses: [] }],
          line: 1,
        },
      ],
    };
    const types = trace(critical, extra, tasks).findings.map((f) => `${f.type}:${f.ref}`);
    expect(types).toEqual(expect.arrayContaining(['BROKEN_REF:FR-9', 'ORPHAN:FR-9', 'UNPLANNED:S-9.1', 'E2E_MISSING:AC-2']));
  });
});

describe('planTasks', () => {
  const tasks = parseTasks(read('tasks.md')).tasks;

  test('waves and the next eligible task', () => {
    expect(planTasks(tasks)).toMatchObject({ waves: [['T1'], ['T2']], next: 'T2', blocked: [] });
  });

  test('a critical OPEN or a cycle blocks the plan', () => {
    expect(planTasks(tasks, ['who approves refunds?']).blocked).toEqual(['critical OPEN: who approves refunds?']);
    const cyclic = tasks.map((t) => (t.id === 'T1' ? { ...t, done: false, depends_on: ['T2'] } : t));
    expect(planTasks(cyclic).blocked[0]).toMatch(/^dependency cycle: T1 → T2 → T1|^dependency cycle: T2 → T1 → T2/);
  });
});

describe('planTasks with deliveries (MDO-0013)', () => {
  const base = parseTasks(read('tasks.md')).tasks[0]!;
  const task = (id: string, delivery: number, extra: Partial<typeof base> = {}) => ({
    ...base,
    id,
    delivery,
    done: false,
    files: [`src/${id}.ts`],
    depends_on: [],
    parallel_safe: true,
    ...extra,
  });

  test('next comes from the first unfinished delivery, even when a later task is declared first and is free', () => {
    const plan = planTasks([task('T1', 2), task('T2', 1), task('T3', 1)]);
    expect(plan).toMatchObject({ next: 'T2', parallel: ['T3'] });
  });

  test('once a delivery is done, the next one starts', () => {
    expect(planTasks([task('T1', 1, { done: true }), task('T2', 2)]).next).toBe('T2');
  });
});

describe('planTasks.parallel', () => {
  const base = parseTasks(read('tasks.md')).tasks[0]!;
  const task = (id: string, files: string[], extra: Partial<typeof base> = {}) => ({
    ...base,
    id,
    done: false,
    files,
    depends_on: [],
    parallel_safe: true,
    ...extra,
  });

  test('eligible parallel_safe tasks of the same wave with disjoint files run beside next', () => {
    const plan = planTasks([task('T1', ['src/a.ts']), task('T2', ['src/b.ts']), task('T3', ['test/c.test.ts'])]);
    expect(plan).toMatchObject({ next: 'T1', parallel: ['T2', 'T3'] });
  });

  test('a task in a later wave is never parallel, even when its dependencies are done', () => {
    const plan = planTasks([
      task('T1', ['src/a.ts'], { done: true }),
      task('T2', ['src/b.ts']),
      task('T3', ['src/c.ts'], { depends_on: ['T1'] }),
    ]);
    expect(plan).toMatchObject({ next: 'T2', parallel: [] });
  });

  test('overlapping files run in sequence: the same path, a folder that contains it, or a glob over it', () => {
    const plan = planTasks([
      task('T1', ['src/spec/plan.ts']),
      task('T2', ['src/spec/plan.ts']),
      task('T3', ['src/spec/']),
      task('T4', ['src/**/*.ts']),
      task('T5', ['./docs/a.md']),
    ]);
    expect(plan).toMatchObject({ next: 'T1', parallel: ['T5'] });
  });

  test.each([
    ['a glob cut inside a segment', 'src/spec/pl*.ts'],
    ['a brace glob inside a segment', 'src/spec/{plan,tasks}.ts'],
    ['a parent segment', 'src/../src/spec/plan.ts'],
    ['backslashes', 'src\\spec\\plan.ts'],
    ['repeated slashes and dots', '././src//spec/plan.ts'],
    ['a leading slash', '/src/spec/plan.ts'],
    ['an extglob', 'src/spec/@(plan|tasks).ts'],
    ['a path that climbs out of the root', '../other/plan.ts'],
    ['the whole tree', './'],
    ['the whole tree reached through a parent segment', 'src/../'],
  ])('%s still overlaps the plain path', (_, declared) => {
    expect(planTasks([task('T1', ['src/spec/plan.ts']), task('T2', [declared])]).parallel).toEqual([]);
  });

  test('tasks chosen beside next do not overlap each other either', () => {
    const plan = planTasks([task('T1', ['src/a.ts']), task('T2', ['docs/x.md']), task('T3', ['docs/x.md'])]);
    expect(plan.parallel).toEqual(['T2']);
  });

  test('a task without declared files, or not parallel_safe, is never parallel', () => {
    const plan = planTasks([task('T1', ['src/a.ts']), task('T2', []), task('T3', ['src/c.ts'], { parallel_safe: false })]);
    expect(plan.parallel).toEqual([]);
    expect(planTasks([task('T1', []), task('T2', ['src/b.ts'])]).parallel).toEqual([]);
  });
});

describe('loopState', () => {
  const recs = recommendationsSchema.parse({
    schema_version: 1,
    harnesses: {
      claude: {
        reviewed: '2026-10-20',
        sources: ['https://example.com'],
        available: ['h', 's', 'o'],
        routed: { leader: 'o', reviewer: 'o', implementer: { fast: 'h', standard: 's', strong: 'o' }, tester: 's' },
        simple: { implementer: 's', reviewer: 'o' },
        tiers: { h: 'fast', s: 'standard', o: 'strong' },
      },
    },
  });
  const models = resolveModels('claude', 'routed', recs, []);
  const row = (verdict: ExecutionRow['verdict'], tier: string, extra: Partial<ExecutionRow> = {}): ExecutionRow => ({
    date: 'd',
    task: 'T2',
    attempt: 1,
    tier,
    harness: 'claude',
    implementer: 'x',
    reviewer: 'y',
    verdict,
    notes: '',
    ...extra,
  });
  const task = { id: 'T2', tier: 'standard' as const };

  test('two FAILs move one tier up; three at strong halt', () => {
    expect(loopState(task, [row('FAIL', 'standard')], models, 'claude')).toMatchObject({ action: 'rework', tier: 'standard' });
    expect(loopState(task, [row('FAIL', 'standard'), row('FAIL', 'standard')], models, 'claude')).toMatchObject({
      action: 'rework',
      tier: 'strong',
    });
    const strong = [row('FAIL', 'standard'), row('FAIL', 'standard'), row('FAIL', 'strong'), row('FAIL', 'strong'), row('FAIL', 'strong')];
    expect(loopState(task, strong, models, 'claude').action).toBe('halt');
  });

  test('strong tasks review on the implementer model when no reviewer qualifies', () => {
    const s = loopState({ id: 'T2', tier: 'strong' }, [row('REPORTED', 'strong')], models, 'claude');
    expect(s).toMatchObject({ action: 'review', reviewer: { model: 'o' }, notes: ['reduced independence'] });
    expect(s.crossReview).toBeUndefined();
  });

  test('another harness reviews instead, but never below the implementer tier', () => {
    const strong = { id: 'T2', tier: 'strong' as const };
    const rows = [row('REPORTED', 'strong')];
    const lower = { harness: 'codex', reviewer: { model: 'g', source: 'recommendation' as const }, tier: 'standard' as const };
    const equal = {
      harness: 'codex',
      reviewer: { model: 'g2', source: 'recommendation' as const, effort: 'high' as const },
      tier: 'strong' as const,
    };
    expect(loopState(strong, rows, models, 'claude', { alternatives: [lower] }).notes).toEqual(['reduced independence']);
    const s = loopState(strong, rows, models, 'claude', { alternatives: [lower, equal] });
    expect(s).toMatchObject({ crossReview: { harness: 'codex', model: 'g2', effort: 'high' }, notes: [] });
  });

  test('a review in another harness is provider independence; interruptions resume', () => {
    expect(loopState(task, [row('REPORTED', 'standard', { harness: 'claude' })], models, 'codex').notes).toContain('provider independence');
    expect(loopState(task, [row('STARTED', 'standard')], models, 'claude').action).toBe('resume-implementation');
    expect(loopState(task, [row('PASS', 'standard')], models, 'claude').action).toBe('commit');
    expect(loopState(task, [row('PASS', 'standard')], models, 'claude', { committed: true }).action).toBe('done');
  });

  test('execution rows round-trip', () => {
    const r = row('PASS', 'fast', { notes: 'a | b' });
    const md = `| Date | Task | Attempt | Tier | Harness | Implementer | Reviewer | Verdict | Notes |\n|---|---|---|---|---|---|---|---|---|\n${executionRow(r)}\n`;
    expect(parseExecution(md).rows[0]).toMatchObject({ verdict: 'PASS', notes: 'a | b' });
  });

  test('logs written before ADR 0021 still parse: the Commit column is ignored', () => {
    const md =
      '| Date | Task | Attempt | Tier | Harness | Implementer | Reviewer | Verdict | Commit | Notes |\n|---|---|---|---|---|---|---|---|---|---|\n| d | T1 | 1 | fast | claude | x | y | PASS | abc1234 | ok |\n';
    expect(parseExecution(md)).toEqual({ rows: [row('PASS', 'fast', { task: 'T1', notes: 'ok' })], issues: [] });
    expect(parseExecution('| Date | Task | Verdict |\n|---|---|---|\n').issues[0]).toMatch(/missing columns Attempt/);
  });
});

test('commitMessage builds the header and trailers from the config', () => {
  const config = configSchema.parse({
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude'],
  });
  const story = parseStory(read('story.md')).story!;
  const task = parseTasks(read('tasks.md')).tasks[1]!;
  const msg = commitMessage(config, story, task, 'add skills list command');
  expect(msg.text).toBe('✨ feat(cli): add skills list command\n\nRefs: MDO-0001\nMandao-Task: T2\nMandao-AC: AC-2, AC-2/C1\n');
  expect(commitMessage(config, story, task, `${'x'.repeat(70)}.`).issues).toEqual([
    'header is 82 characters without the emoji; the limit is 72',
    'subject ends with a period',
  ]);
});

test('commitMessage with commits.emoji false builds a plain Conventional Commits header', () => {
  const config = configSchema.parse({
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude'],
    commits: { emoji: false },
  });
  const story = parseStory(read('story.md')).story!;
  const task = parseTasks(read('tasks.md')).tasks[1]!;
  expect(commitMessage(config, story, task, 'add skills list command').text).toBe(
    'feat(cli): add skills list command\n\nRefs: MDO-0001\nMandao-Task: T2\nMandao-AC: AC-2, AC-2/C1\n',
  );
  expect(commitMessage(config, story, task, `${'x'.repeat(70)}.`).issues[0]).toBe('header is 82 characters; the limit is 72');
  expect(commitMessage(config, story, task, 'drop old flag', true).header).toBe('feat(cli)!: drop old flag');
});

test('a story with a tracker item adds the tracker trailer to every commit, and --trailer cannot forge it', () => {
  const config = configSchema.parse({
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude'],
  });
  const base = parseStory(read('story.md')).story!;
  const story = { ...base, meta: { ...base.meta, tracker: 'clickup' as const, tracker_id: '86e3w5954' } };
  const task = parseTasks(read('tasks.md')).tasks[1]!;
  expect(commitMessage(config, story, task, 'add skills list command').text).toBe(
    '✨ feat(cli): add skills list command\n\nRefs: MDO-0001\nTracker: CU-86e3w5954\nMandao-Task: T2\nMandao-AC: AC-2, AC-2/C1\n',
  );
  expect(commitMessage(config, story, task, 'x', false, [], ['Tracker: CU-other']).issues.join(' ')).toMatch(/Tracker/);
  expect(trackerRef('jira', 'VZ-12')).toBe('VZ-12');
  expect(trackerRef('none', undefined)).toBeUndefined();
});

test('story.md accepts a tracker_id next to the local id, and refuses one that is unsafe in a branch name', () => {
  const story = read('story.md');
  const withId = (v: string) => story.replace(/^id: .*$/m, (line) => `${line}\ntracker_id: ${v}`);
  expect(parseStory(withId('86e3w5954')).story?.meta.tracker_id).toBe('86e3w5954');
  expect(parseStory(withId('../x')).story).toBeUndefined();
});
