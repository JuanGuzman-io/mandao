import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { testNames } from '../../src/scripts/red.js';
import { readSpec } from '../../src/scripts/spec.js';
import { logPath } from '../../src/scripts/spec-log.js';
import { securityBlockers, specBudget } from '../../src/spec/index.js';
import { makeTree, pkg, reviewFile } from '../helpers.js';

// MDO-0008: five rules the Leader broke while the text asked for them; now the scripts refuse.
const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';
const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
  for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/** A repo whose test command exits 1: every `run red` is red. */
function workspace(budget?: number) {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop'), 'test/a.test.ts': "test('lists pinned skills', () => {});\n" }));
  git(root, 'init', '-q');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.', tests: { impacted: 'node -e "process.exit(1)" {files}' } }],
    harnesses: ['claude'],
    ...(budget ? { budget: { per_spec: budget } } : {}),
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  return root;
}
const run = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', ...args]);
  return JSON.parse(out.at(-1)!);
};
const checkpoint = async (root: string, ...args: string[]) => {
  if (args.some((arg, i) => arg === '--verdict' && args[i + 1] === 'PASS')) await run(root, 'run', 'review-pack', 'MDO-0001', 'T2');
  return run(root, 'run', 'checkpoint', 'MDO-0001', '--task', 'T2', '--harness', 'claude', ...args);
};
const rows = (root: string) => readSpec(join(root, SPEC)).execution.filter((r) => r.task === 'T2');
const reviewer = ['--reviewer', 'mandao-reviewer'];

describe('the attempt comes from the log', () => {
  test('a FAIL opens the next attempt; nobody can type one', async () => {
    const root = workspace();
    await checkpoint(root, '--verdict', 'FAIL', ...reviewer, '--reason', 'r', '--review', reviewFile('FAIL'));
    await checkpoint(root, '--verdict', 'REPORTED');
    await checkpoint(root, '--verdict', 'PASS', ...reviewer, '--review', reviewFile('PASS'));
    expect(
      rows(root)
        .map((r) => `${r.verdict}:${r.attempt}`)
        .slice(-3),
    ).toEqual(['FAIL:1', 'REPORTED:2', 'PASS:2']);
    // commander exits on an unknown option: the flag no longer exists.
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit');
    }) as never);
    await expect(checkpoint(root, '--verdict', 'REPORTED', '--attempt', '1')).rejects.toThrow('exit');
  });
});

describe('red first, rework included', () => {
  test('a test added after the red run is refused at REPORTED until it runs red', async () => {
    const root = workspace();
    await run(root, 'run', 'red', 'MDO-0001', 'T2', 'test/a.test.ts');
    await checkpoint(root, '--verdict', 'REPORTED');
    await checkpoint(root, '--verdict', 'FAIL', ...reviewer, '--reason', 'edge case untested', '--review', reviewFile('FAIL'));
    writeFileSync(join(root, 'test/a.test.ts'), "test('lists pinned skills', () => {});\ntest('prints the add hint', () => {});\n");
    await expect(checkpoint(root, '--verdict', 'REPORTED')).rejects.toThrow(/no red run: test\/a\.test\.ts: "prints the add hint"/);
    await run(root, 'run', 'red', 'MDO-0001', 'T2', 'test/a.test.ts');
    await checkpoint(root, '--verdict', 'REPORTED');
    expect(rows(root).at(-1)).toMatchObject({ verdict: 'REPORTED', attempt: 2 });
    // RED rows take the tier in use, not only the declared one.
    expect(
      rows(root)
        .filter((r) => r.verdict === 'RED')
        .map((r) => r.tier),
    ).toEqual(['standard', 'standard']);
  });

  test('test names from JS, Python and Go files', () => {
    expect(testNames("test('a', () => {});\nit.only(\"b\", x);\ndescribe('c', () => {});\n")).toEqual(['a', 'b']);
    expect(testNames('def test_one():\n    pass\nasync def test_two():\n')).toEqual(['test_one', 'test_two']);
    expect(testNames('func TestRun(t *testing.T) {}\n')).toEqual(['TestRun']);
  });
});

describe('structured Reviewer findings guard', () => {
  test('a PASS without the matching script-generated review manifest is refused', async () => {
    const root = workspace();
    await expect(
      run(root, 'run', 'checkpoint', 'MDO-0001', '--task', 'T2', '--verdict', 'PASS', ...reviewer, '--review', reviewFile('PASS')),
    ).rejects.toThrow(/no matching review pack manifest.*run `mandao run review-pack/);
  });

  test('requires a valid payload, refuses open security blockers, and preserves the whole answer', async () => {
    const root = workspace();
    const pass = (findings: string) => checkpoint(root, '--verdict', 'PASS', ...reviewer, '--review', reviewFile('PASS', findings));
    await expect(pass('- [security/high] src/x.ts:3 front matter is evaluated')).rejects.toThrow(/open high-severity security finding/);
    await expect(checkpoint(root, '--verdict', 'PASS', ...reviewer, '--review', reviewFile('FAIL'))).rejects.toThrow(
      /says VERDICT: FAIL, not PASS/,
    );
    await expect(checkpoint(root, '--verdict', 'PASS', ...reviewer)).rejects.toThrow(/needs --review/);
    await pass('- [core/high] a long function\n- [security/low] log line could be shorter');
    expect(readFileSync(join(root, SPEC, 'reviews/T2-1-review.md'), 'utf8')).toContain('[core/high]');
    expect(rows(root).find((r) => r.verdict === 'PASS')?.notes).not.toContain('untagged security mention');
  });

  test('only open high or critical security findings block; prose has no effect', () => {
    const make = (status: string, severity: string, lens: string) =>
      `## Findings (JSON)\n\`\`\`json\n${JSON.stringify({ version: 1, findings: [{ id: 'F1', status, severity, lens, title: 'issue', file: 'src/a.ts', line: 2, evidence: 'test' }] })}\n\`\`\``;
    expect(securityBlockers(make('open', 'critical', 'security'))).toHaveLength(1);
    expect(securityBlockers(make('resolved', 'critical', 'security'))).toEqual([]);
    expect(securityBlockers(make('open', 'high', 'core'))).toEqual([]);
    expect(securityBlockers(`security/high\n${make('open', 'low', 'core')}`)).toEqual([]);
  });
});

describe('past the budget, step waits for a person', () => {
  const spend = (root: string, usd: number) =>
    writeFileSync(
      join(root, SPEC, 'costs.yml'),
      `costs:\n  - { at: x, command: implement, harness: claude, usd: ${usd}, roles: { leader: ${usd} }, models: {}, source: claude-code }\n`,
    );

  test('no delegation over 100% until `approve budget --to` records more; no budget, no cap', async () => {
    const capped = workspace(8);
    spend(capped, 9);
    const stopped = await run(capped, 'run', 'step', 'MDO-0001', 'T2', '--harness', 'claude');
    expect(stopped.loop).toMatchObject({ action: 'await-budget', reason: expect.stringContaining('budget --to') });
    expect(stopped.brief).toBeUndefined();
    await run(capped, 'approve', 'MDO-0001', 'budget', '--to', '16', '--by', 'Ana PO');
    expect((await run(capped, 'run', 'step', 'MDO-0001', 'T2', '--harness', 'claude')).loop.action).not.toBe('await-budget');
    await expect(run(capped, 'approve', 'MDO-0001', 'budget')).rejects.toThrow(/--to <USD>/);
    spend(capped, 40);
    expect((await run(capped, 'run', 'step', 'MDO-0001', 'T2', '--harness', 'claude')).loop.action).toBe('await-budget');
    await run(capped, 'approve', 'MDO-0001', 'budget', '--to', 'none');
    expect((await run(capped, 'run', 'cost', 'MDO-0001')).status).toBe('no-budget');

    const open = workspace();
    spend(open, 50);
    expect((await run(open, 'run', 'step', 'MDO-0001', 'T2', '--harness', 'claude')).loop.action).not.toBe('await-budget');
  });

  test('the cap is the last authorization, else budget.per_spec', () => {
    const a = (to?: number) => ({ step: 'budget' as const, by: 'x', at: 'y', ...(to ? { to } : {}) });
    expect(specBudget([a(12), a(16)], 8)).toBe(16);
    expect(specBudget([], 8)).toBe(8);
    expect(specBudget([], undefined)).toBeUndefined();
    expect(specBudget([a(12), { ...a(), to: 'none' as const }], 8)).toBeUndefined();
  });
});

describe('logs are written by scripts only', () => {
  test('a hand edit is recorded once as a discrepancy', async () => {
    const root = workspace();
    await checkpoint(root, '--verdict', 'REPORTED');
    const file = logPath(join(root, SPEC), 'execution.md');
    writeFileSync(file, readFileSync(file, 'utf8').replace('REPORTED', 'PASS'));
    const r = await checkpoint(root, '--phase', 'awaiting-review');
    expect(r.discrepancy).toBe('log edited outside the scripts: execution.md');
    expect(readFileSync(logPath(join(root, SPEC), 'discrepancies.md'), 'utf8')).toMatch(/execution\.md/);
    expect((await checkpoint(root, '--phase', 'awaiting-review')).discrepancy).toBeUndefined();
  });

  test('a queued commit subject over the limit is refused when it is queued', async () => {
    const root = workspace();
    git(root, 'add', '.');
    git(root, 'commit', '-qm', 'base');
    await expect(
      checkpoint(
        root,
        '--verdict',
        'PASS',
        ...reviewer,
        '--review',
        reviewFile('PASS'),
        '--pending-commit',
        `${'register the skills list '.repeat(4)}`,
      ),
    ).rejects.toThrow(/characters without the emoji/);
  });
});
