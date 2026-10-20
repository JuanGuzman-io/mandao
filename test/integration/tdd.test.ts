import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { resolveModels } from '../../src/models/resolve.js';
import { recommendationsSchema } from '../../src/schemas/index.js';
import { redCheck } from '../../src/scripts/red.js';
import { readSpec } from '../../src/scripts/spec.js';
import { type ExecutionRow, loopState } from '../../src/spec/index.js';
import { makeTree, pkg } from '../helpers.js';

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
    });
    expect(loopState(tested, [], models, 'claude')).toMatchObject({ action: 'implement', reason: 'not started: red test first' });
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
    git(root, 'init', '-q');
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'shop', path: '.', tests: { impacted: 'node -e "process.exit(Number(process.env.RED ?? 1))" {files}' } }],
      harnesses: ['claude'],
    });
    syncProject(root);
    cpSync(fixture, join(root, SPEC), { recursive: true });
    return root;
  }
  const run = (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);

  test('records RED with the writer from its agent file, remembers the tests, and flags a later change', async () => {
    const root = workspace();
    await run(root, 'red', 'MDO-0001', 'T2', 'test/a.test.ts', '--agent', 'mandao-tester');
    expect(JSON.parse(out.at(-1)!)).toMatchObject({ red: true, task: 'T2' });
    const spec = readSpec(join(root, SPEC));
    expect(spec.execution.at(-1)).toMatchObject({ verdict: 'RED', task: 'T2', implementer: 'claude-sonnet-5-5' });
    expect(spec.progress!.red_tests).toEqual([
      { task: 'T2', files: [{ path: 'test/a.test.ts', sha256: expect.stringMatching(/^[0-9a-f]{64}$/) }] },
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
  });

  test('tests that already pass are not red evidence: nothing is recorded', async () => {
    const root = workspace();
    vi.stubEnv('RED', '0');
    try {
      await run(root, 'red', 'MDO-0001', 'T2', 'test/a.test.ts', '--agent', 'mandao-tester');
    } finally {
      vi.unstubAllEnvs();
    }
    expect(JSON.parse(out.at(-1)!)).toMatchObject({ red: false, problem: expect.stringMatching(/pass before any implementation/) });
    expect(process.exitCode).toBe(1);
    process.exitCode = undefined;
    expect(readFileSync(join(root, SPEC, 'execution.md'), 'utf8')).not.toContain('| RED |');
  });
});
