import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { readConfig, writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { resolveModels } from '../../src/models/resolve.js';
import { recommendationsSchema } from '../../src/schemas/index.js';
import { writeProgress } from '../../src/scripts/checkpoint.js';
import { changeManifest } from '../../src/scripts/commits.js';
import { redCheck } from '../../src/scripts/red.js';
import { readSpec } from '../../src/scripts/spec.js';
import { type ExecutionRow, loopState, observeLoop } from '../../src/spec/index.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';

describe('loop with TDD (ADR 0022)', () => {
  const recs = recommendationsSchema.parse({
    schema_version: 1,
    harnesses: {
      claude: {
        reviewed: '2026-10-20',
        sources: ['https://example.com'],
        available: ['h', 's', 'o'],
        routed: { leader: 'o', reviewer: 'o', implementer: { fast: 'h', standard: 's', strong: 'o' }, tester: 's' },
        simple: { implementer: 's', reviewer: 'o' },
      },
    },
  });
  const models = resolveModels('claude', 'routed', recs, []);
  const row = (verdict: ExecutionRow['verdict']): ExecutionRow => ({
    date: 'd',
    task: 'T1',
    attempt: 1,
    tier: 'standard',
    harness: 'claude',
    implementer: 'x',
    reviewer: '—',
    verdict,
    notes: '',
  });
  const tested = { id: 'T1', tier: 'standard' as const, tests: { unit: ['rejects an expired token'], e2e: [] }, risk_tags: [] };

  test('tasks without declared tests have no TDD; with tests the Implementer writes the red test first', () => {
    expect(loopState({ id: 'T1', tier: 'standard' }, [], models, 'claude').tdd).toEqual({
      required: false,
      testsBy: 'implementer',
      red: false,
      evidence: 'red',
    });
    expect(loopState({ id: 'T1', tier: 'standard' }, [], models, 'claude').action).toBe('implement');
    expect(loopState(tested, [], models, 'claude')).toMatchObject({ action: 'write-red-tests', tdd: { testsBy: 'implementer' } });
  });

  test('MDO-0007: no implementation step for an evidence: tdd task until its red run is recorded', () => {
    for (const rows of [[], [row('STARTED')]]) {
      const state = loopState(tested, rows, models, 'claude');
      expect(state.action).toBe('write-red-tests');
      expect(state.reason).toMatch(/Implementer writes only the red tests.*after the RED row/);
    }
    expect(loopState(tested, [row('STARTED'), row('RED')], models, 'claude').action).toBe('implement');
    expect(loopState({ ...tested, evidence: 'none' as const }, [], models, 'claude').action).toBe('implement');
    expect(loopState({ ...tested, characterization: true }, [], models, 'claude').action).toBe('implement');
  });

  test('risk tags or tier strong: the Tester writes the red tests before anyone implements', () => {
    for (const task of [
      { ...tested, risk_tags: ['auth'] },
      { ...tested, tier: 'strong' as const },
    ]) {
      expect(loopState(task, [], models, 'claude')).toMatchObject({ action: 'write-red-tests', tdd: { testsBy: 'tester' } });
      expect(loopState(task, [row('STARTED')], models, 'claude').action).toBe('write-red-tests');
      expect(loopState(task, [row('STARTED'), row('RED')], models, 'claude')).toMatchObject({ action: 'implement', tdd: { red: true } });
    }
  });

  test('a review without red evidence carries the note the Reviewer FAILs on', () => {
    expect(loopState(tested, [row('STARTED'), row('REPORTED')], models, 'claude').notes).toContain('no red evidence');
    expect(loopState(tested, [row('STARTED'), row('RED'), row('REPORTED')], models, 'claude').notes).not.toContain('no red evidence');
  });

  test('a first passing run offers mutation evidence or an independent test review', () => {
    expect(loopState(tested, [row('TESTS_PASS')], models, 'claude')).toMatchObject({
      action: 'choose-test-evidence',
      evidenceOptions: ['mutation', 'review-test'],
      reason: expect.stringMatching(/pass before implementation/),
    });
    expect(loopState(tested, [row('TESTS_PASS'), row('MUTANT')], models, 'claude')).toMatchObject({
      action: 'resume-implementation',
      tdd: { evidence: 'mutation', red: true },
    });
    expect(loopState(tested, [row('TESTS_PASS'), row('TEST_REVIEWED')], models, 'claude')).toMatchObject({
      action: 'implement',
      tdd: { evidence: 'review', red: true },
    });
  });

  test('loop brake counts repeated actions only while the execution log is unchanged', () => {
    const first = observeLoop(undefined, 'T1', 'implement', 4);
    const second = observeLoop(first, 'T1', 'implement', 4);
    expect(observeLoop(second, 'T1', 'implement', 4).repeats).toBe(3);
    expect(observeLoop(second, 'T1', 'implement', 5).repeats).toBe(1);
    expect(observeLoop(second, 'T1', 'review', 4).repeats).toBe(1);
  });

  test('only a failing run is red evidence', () => {
    expect(redCheck('FAIL', 1)).toEqual({ red: true });
    expect(redCheck('PASS', 0).problem).toMatch(/pass before any implementation/);
    expect(redCheck('TIMEOUT', undefined).problem).toBe('the tests did not run to a verdict (TIMEOUT)');
  });
});

describe('mandao run red', () => {
  const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  let out: string[];

  beforeEach(() => {
    process.env.MANDAO_HOME = makeTree({});
    out = [];
    vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });
  afterEach(() => vi.restoreAllMocks());

  /** A repo whose test command exits with $RED (1 by default): red unless told otherwise. */
  function workspace() {
    const root = realpathSync(makeTree({ 'package.json': pkg('shop'), 'test/a.test.ts': 'expect(1).toBe(2)\n' }));
    initTestRepo(root, '-q');
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'shop', path: '.', tests: { impacted: 'node -e "process.exit(Number(process.env.RED ?? 1))" {files}' } }],
      harnesses: ['claude'],
      diagrams: { engine: 'mermaid' },
    });
    syncProject(root);
    cpSync(fixture, join(root, SPEC), { recursive: true });
    return root;
  }
  const run = (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);

  test('records RED with the writer from its agent file, remembers the tests, and flags a later change', async () => {
    const root = workspace();
    await run(root, 'red', 'MDO-0001', 'T2', 'test/a.test.ts');
    expect(JSON.parse(out.at(-1)!)).toMatchObject({ red: true, task: 'T2' });
    const spec = readSpec(join(root, SPEC));
    expect(spec.execution.at(-1)).toMatchObject({ verdict: 'RED', task: 'T2', implementer: 'claude-sonnet-5-5' });
    expect(spec.progress!.red_tests).toEqual([
      { task: 'T2', files: [{ path: 'test/a.test.ts', sha256: expect.stringMatching(/^[0-9a-f]{64}$/), tests: expect.any(Array) }] },
    ]);

    writeFileSync(join(root, 'test/a.test.ts'), 'expect(1).toBe(1)\n');
    await run(
      root,
      'checkpoint',
      'MDO-0001',
      '--task',
      'T2',
      '--verdict',
      'REPORTED',
      '--harness',
      'claude',
      '--implementer',
      'mandao-implementer-standard',
    );
    expect(readSpec(join(root, SPEC)).execution.at(-1)!.notes).toBe('red test changed: test/a.test.ts');
    // The checkpoint keeps the red tests recorded, so the next step still sees the change.
    expect(readSpec(join(root, SPEC)).progress!.red_tests.map((r) => r.task)).toEqual(['T2']);
  });

  test('a missing runner is refused as red and records nothing (MDO-0001 T17)', async () => {
    const root = workspace();
    const before = readSpec(join(root, SPEC)).execution.length;
    process.env.RED = '127';
    try {
      await run(root, 'red', 'MDO-0001', 'T2', 'test/a.test.ts');
    } finally {
      delete process.env.RED;
      process.exitCode = undefined;
    }
    expect(JSON.parse(out.at(-1)!)).toMatchObject({ red: false, problem: expect.stringMatching(/runner could not run \(exit 127\)/) });
    expect(readSpec(join(root, SPEC)).execution).toHaveLength(before);
  });

  test('run step halts after the same recommendation three times without new execution evidence', async () => {
    const root = workspace();
    await run(root, 'step', 'MDO-0001', 'T2');
    await run(root, 'step', 'MDO-0001', 'T2');
    await run(root, 'step', 'MDO-0001', 'T2');
    expect(JSON.parse(out.at(-1)!)).toMatchObject({
      loop: { action: 'halt', reason: expect.stringMatching(/same action write-red-tests returned 3 times/) },
    });
  });

  test('mandao run diagram stamps explicitly configured Mermaid into design.md and reports it stale after an edit', async () => {
    const root = workspace();
    const design = join(root, SPEC, 'design.md');
    writeFileSync(
      design,
      '---\nschema_version: 1\nspec: MDO-0001-skills-list\ndepth: standard\nprojects: [shop]\n---\n\n# Design\n\n## Decisions\n\nList from the lock.\n',
    );
    const mermaid = join(root, 'flow.mmd');
    writeFileSync(mermaid, 'flowchart LR\n  CLI --> Lock');
    await run(root, 'diagram', 'MDO-0001', '--stamp', '--tool', 'mermaid', '--type', 'workflow', '--mermaid', mermaid);
    expect(JSON.parse(out.at(-1)!)).toMatchObject({ required: 'if-new-flow', stale: false, stamp: { tool: 'mermaid', type: 'workflow' } });
    expect(readFileSync(design, 'utf8')).toContain('```mermaid\nflowchart LR');
    writeFileSync(design, readFileSync(design, 'utf8').replace('List from the lock.', 'List from the catalog.'));
    await run(root, 'diagram', 'MDO-0001');
    expect(JSON.parse(out.at(-1)!).stale).toBe(true);
    await expect(run(root, 'diagram', 'MDO-0001', '--stamp', '--tool', 'archify', '--type', 'workflow')).rejects.toThrow(/needs --file/);
  });

  test('a required Archify diagram step stops with install instructions when Archify is missing', async () => {
    const root = workspace();
    const config = readConfig(root);
    writeYaml(join(root, '.mandao/config.yml'), { ...config, diagrams: { engine: 'archify' } });
    const design = join(root, SPEC, 'design.md');
    writeFileSync(design, '---\nschema_version: 1\nspec: MDO-0001-skills-list\ndepth: standard\nprojects: [shop]\n---\n\n# Design\n');
    await expect(run(root, 'diagram', 'MDO-0001')).rejects.toThrow(/Archify is required.*mandao init/);
  });

  test('a PASS written by review --via can be queued for commit without recording it again', async () => {
    const root = workspace();
    git(root, 'add', '.');
    git(root, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'base');
    const pass = '| 2026-10-20 | T2 | 1 | standard | opencode | x | y | PASS | read-only opencode process |';
    const file = join(root, SPEC, 'execution.md');
    writeFileSync(file, readFileSync(file, 'utf8').replace(/(\| STARTED \| \|\n)/, `$1${pass}\n`));
    writeFileSync(join(root, 'test/a.test.ts'), 'expect(1).toBe(1)\n');
    const dir = join(root, SPEC);
    const spec = readSpec(dir);
    writeProgress(dir, {
      ...spec.progress!,
      approved_manifests: [
        {
          task: 'T2',
          attempt: 1,
          files: changeManifest(root, dir),
          reviewed: ['test/a.test.ts'],
          receipts: [{ path: '.claude/agents/x.md', origin: 'persona:leader' }],
        },
      ],
    });
    await run(
      root,
      'checkpoint',
      'MDO-0001',
      '--task',
      'T2',
      '--done',
      'T2',
      '--pending-commit',
      'register the skills list command',
      '--clear',
    );
    expect(readSpec(join(root, SPEC)).progress!.pending_commits.map((p) => p.task)).toEqual(['T2']);
    expect(readSpec(join(root, SPEC)).progress!.pending_commits[0]).toMatchObject({
      reviewed: ['test/a.test.ts'],
      receipts: [{ path: '.claude/agents/x.md', origin: 'persona:leader' }],
    });
    expect(
      readSpec(join(root, SPEC))
        .execution.filter((r) => r.verdict === 'PASS')
        .map((r) => r.task),
    ).toEqual(['T1', 'T2']);
    await expect(
      run(root, 'checkpoint', 'MDO-0001', '--task', 'T1', '--pending-commit', 'x', '--verdict', 'FAIL', '--reason', 'r'),
    ).rejects.toThrow(/needs --task and a PASS/);
  });

  test('tests that pass on their first run record the choice instead of failing the red command', async () => {
    const root = workspace();
    vi.stubEnv('RED', '0');
    try {
      await run(root, 'red', 'MDO-0001', 'T2', 'test/a.test.ts');
    } finally {
      vi.unstubAllEnvs();
    }
    expect(JSON.parse(out.at(-1)!)).toMatchObject({ red: false, firstRunPassed: true, options: ['mutation', 'review-test'] });
    expect(process.exitCode).toBeUndefined();
    expect(readFileSync(join(root, SPEC, 'execution.md'), 'utf8')).toContain('| TESTS_PASS |');
    expect(readSpec(join(root, SPEC)).progress!.red_tests[0]!.files[0]!.tests).toEqual([]);
  });

  test('independent test review is recorded and releases the implementation step', async () => {
    const root = workspace();
    vi.stubEnv('RED', '0');
    try {
      await run(root, 'red', 'MDO-0001', 'T2', 'test/a.test.ts');
    } finally {
      vi.unstubAllEnvs();
    }
    writeFileSync(join(root, 'test-review.md'), 'TEST REVIEW: PASS\n\n## Assertions\n- `test/a.test.ts` covers the stated scenario.\n');
    await run(root, 'test-review', 'MDO-0001', 'T2', '--reviewer', 'mandao-reviewer', '--review', join(root, 'test-review.md'));
    expect(JSON.parse(out.at(-1)!)).toMatchObject({ recorded: true, verdict: 'TEST_REVIEWED' });
    await run(root, 'step', 'MDO-0001', 'T2');
    expect(JSON.parse(out.at(-1)!)).toMatchObject({ loop: { action: 'implement', tdd: { evidence: 'review', red: true } } });
  });
});

describe('forced runs (ADR 0024)', () => {
  test('a forced run past a deferring budget is recorded in the CLI log and the active spec', async () => {
    const { forceSource, recordForced, CLI_LOG } = await import('../../src/scripts/forced.js');
    expect([
      forceSource(true, {}),
      forceSource(false, { RG_FORCE: '1' }),
      forceSource(false, { MANDAO_FORCE: '1' }),
      forceSource(false, {}),
    ]).toEqual(['flag', 'RG_FORCE', 'MANDAO_FORCE', undefined]);
    const root = makeTree({});
    cpSync(fixture, join(root, SPEC), { recursive: true });
    const run = {
      at: '2026-10-20T10:00:00Z',
      operation: 'unit' as const,
      label: 'shop tests',
      reason: '900 MB free is under half the 2048 MB floor',
      by: 'RG_FORCE' as const,
    };
    recordForced(root, run, join(root, SPEC));
    recordForced(root, { ...run, at: '2026-10-20T11:00:00Z' }, join(root, SPEC));
    const log = readFileSync(join(root, CLI_LOG), 'utf8')
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l));
    expect(log).toHaveLength(2);
    expect(log[0]).toMatchObject({ event: 'forced-run', by: 'RG_FORCE', label: 'shop tests' });
    const execution = readFileSync(join(root, SPEC, 'execution.md'), 'utf8');
    expect(execution).toContain('## Forced runs');
    expect(execution.match(/forced by RG_FORCE/g)).toHaveLength(2);
    // The verdict table is untouched: forced runs are not verdicts.
    expect(readSpec(join(root, SPEC)).execution.map((r) => r.verdict)).toEqual(['PASS', 'STARTED']);
  });
});

describe('mandao run build (ADR 0024, ADR 0026)', () => {
  test('defers under the build floor and runs only when forced, recording it', async () => {
    const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'shop', path: '.', gates: { build: 'node -e "process.exit(0)"' } }],
      harnesses: ['claude'],
      resources: { operations: { build: { min_free_memory_mb: 10_000_000 } } },
    });
    const out: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const run = (...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
    try {
      await run('build', 'shop');
      expect(JSON.parse(out.at(-1)!)).toMatchObject({ status: 'DEFERRED', workers: 0 });
      expect(process.exitCode).toBe(1);
      process.exitCode = undefined;
      await run('build', 'shop', '--force');
      expect(JSON.parse(out.at(-1)!)).toMatchObject({ status: 'PASS', reason: expect.stringMatching(/^forced: /) });
      expect(readFileSync(join(root, '.mandao/cli.log'), 'utf8')).toContain('"operation":"build"');
    } finally {
      process.exitCode = undefined;
      vi.restoreAllMocks();
    }
  });
});
