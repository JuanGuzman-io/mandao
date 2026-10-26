// mandao-scans: none — lists only the temporary trees it creates.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { appendExecutionRow, writeProgress } from '../../src/scripts/checkpoint.js';
import { changedFiles, changeManifest } from '../../src/scripts/commits.js';
import { readSpec } from '../../src/scripts/spec.js';
import { logPath } from '../../src/scripts/spec-log.js';
import { initTestRepo, makeTree } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  vi.stubEnv('CLAUDE_CODE_SESSION_ID', '');
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

/** A spec on its branch with T2 passed and queued for its commit. */
function queued() {
  const root = realpathSync(makeTree({ 'README.md': 'x\n' }));
  initTestRepo(root, '-q', '-b', 'main');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.', gates: { build: 'none' } }],
    harnesses: ['claude'],
  });
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'init');
  git(root, 'checkout', '-qb', 'feat/MDO-0001-skills-list');
  cpSync(fixture, join(root, SPEC), { recursive: true });
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'spec');
  const dir = join(root, SPEC);
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(join(root, 'src/b.ts'), 'export const t2 = 1;\n');
  appendExecutionRow(dir, 'MDO-0001-skills-list', {
    date: '2026-10-26',
    task: 'T2',
    attempt: 1,
    tier: 'standard',
    harness: 'claude',
    implementer: 'claude-sonnet-5-5',
    reviewer: 'claude-opus-5-5',
    verdict: 'PASS',
    notes: '',
  });
  const spec = readSpec(dir);
  const entry = {
    task: 'T2',
    subject: 'register the skills list command',
    files: changedFiles(root, dir),
    manifest: changeManifest(root, dir),
  };
  writeProgress(dir, { ...spec.progress!, pending_commits: [entry] });
  return root;
}
const commit = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', 'commit', 'MDO-0001', ...args]);
  return JSON.parse(out.at(-1)!);
};

describe('run commit records the task cost itself (phase 17, MDO-0002)', () => {
  test('a harness without a transcript gives --usd: the entry rides in the task commit', async () => {
    const root = queued();
    const r = await commit(root, '--harness', 'codex', '--usd', '0.42');
    expect(r).toMatchObject({ committed: [{ task: 'T2' }], cost: { recorded: true, usd: 0.42 } });
    expect(git(root, 'show', '--name-only', '--format=', 'HEAD')).toContain(`${SPEC}/costs.yml`);
    expect(readFileSync(logPath(join(root, SPEC), 'costs.yml'), 'utf8')).toMatch(/command: implement/);
  });

  test('when nothing can be read the commit still happens and says the cost was not recorded', async () => {
    const root = queued();
    const r = await commit(root);
    expect(r).toMatchObject({ committed: [{ task: 'T2' }], cost: { recorded: false, reason: expect.stringMatching(/no session/) } });
  });

  test('a refused commit records no cost, so a retry never counts it twice (review F7)', async () => {
    const root = queued();
    writeFileSync(join(root, 'src/b.ts'), 'export const changedAfterReview = 1;\n');
    const r = await commit(root, '--harness', 'codex', '--usd', '3');
    expect(r.error).toMatch(/differs from the Reviewer-approved manifest/);
    expect(
      existsSync(logPath(join(root, SPEC), 'costs.yml')) ? readFileSync(logPath(join(root, SPEC), 'costs.yml'), 'utf8') : '',
    ).not.toMatch(/usd: 3/);
  });

  test('a discrepancy reason given at commit reaches the commit as a trailer (review F6)', async () => {
    const root = queued();
    const execution = logPath(join(root, SPEC), 'execution.md');
    writeFileSync(execution, `${readFileSync(execution, 'utf8')}\n`);
    await commit(root, '--usd', '0', '--discrepancy-reason', 'the PE fixed a typo');
    expect(git(root, 'log', '-1', '--format=%B')).toMatch(/Mandao-Discrepancy: .*execution\.md.*the PE fixed a typo/);
  });

  test('a file someone staged by hand never rides in a task commit (review F1)', async () => {
    const root = queued();
    writeFileSync(join(root, 'staged.txt'), 'staged by hand\n');
    git(root, 'add', 'staged.txt');
    expect(await commit(root, '--usd', '0')).toMatchObject({ committed: [{ task: 'T2' }] });
    expect(git(root, 'show', '--name-only', '--format=', 'HEAD')).not.toContain('staged.txt');
    expect(git(root, 'diff', '--cached', '--name-only')).toBe('staged.txt');
  });
});
