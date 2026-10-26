import { execFileSync } from 'node:child_process';
import { cpSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ADAPTERS } from '../../src/adapters/index.js';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

// MDO-0010 D2: `run where` and `run spec-new` hand the command texts the active harness resume command.
const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const HARNESSES = ['claude', 'codex', 'opencode', 'copilot', 'antigravity'] as const;
let out: string[];

beforeEach(() => {
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
});
afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

function repo() {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
  initTestRepo(root, '-q', '-b', 'main');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude'],
  });
  cpSync(fixture, join(root, 'specs/MDO-0001-skills-list'), { recursive: true });
  return root;
}
const run = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
  return JSON.parse(out.at(-1)!);
};

describe('run where: the resume field', () => {
  test.each(HARNESSES)('%s: resume is the active adapter session.resume for expected.worktree and the implement command', async (h) => {
    const root = repo();
    const r = await run(root, 'where', 'MDO-0001', '--harness', h);
    expect(r.resume).toBe(ADAPTERS[h].session.resume(r.expected.worktree, '/mandao-implement MDO-0001').text);
    expect(r.resume).toContain(r.expected.worktree);
  });

  test('the first command can be named, and the harness defaults to claude', async () => {
    const root = repo();
    const r = await run(root, 'where', 'MDO-0001', '--first', '/mandao-verify MDO-0001');
    expect(r.resume).toBe(ADAPTERS.claude.session.resume(r.expected.worktree, '/mandao-verify MDO-0001').text);
  });

  test('an unknown harness is an error', async () => {
    const root = repo();
    await expect(run(root, 'where', 'MDO-0001', '--harness', 'nope')).rejects.toThrow(/Unknown harness/);
  });

  test.each(HARNESSES)('%s: spec-new returns the resume command for its worktree and the given first command', async (h) => {
    const root = repo();
    const r = await run(root, 'spec-new', 'fix login', '--harness', h, '--first', '/mandao-specify MDO-0002');
    expect(r.resume).toBe(ADAPTERS[h].session.resume(r.worktree, '/mandao-specify MDO-0002').text);
  });
});

describe('run where: the spec branch in place or in a worktree (phase 16)', () => {
  const cwd = process.cwd();
  afterEach(() => process.chdir(cwd));
  const git = (dir: string, ...args: string[]) =>
    execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const committed = () => {
    const root = repo();
    git(root, 'add', '.');
    git(root, 'commit', '-qm', 'base');
    return root;
  };

  test('on the spec branch in the main checkout the session is ready (in place); --switch moves there with no git by the user', async () => {
    const root = committed();
    process.chdir(root);
    const first = await run(root, 'where', 'MDO-0001');
    expect(first).toMatchObject({ ready: false, inWorktree: false });
    git(root, 'branch', first.expected.branch);
    const switched = await run(root, 'where', 'MDO-0001', '--switch');
    expect(switched).toMatchObject({ ready: true, mode: 'in-place', switched: true });
    expect(git(root, 'branch', '--show-current')).toBe(first.expected.branch);
    expect(await run(root, 'where', 'MDO-0001')).toMatchObject({ ready: true, mode: 'in-place' });
  });

  test('--switch never moves a branch another worktree holds: it says to enter that worktree', async () => {
    const root = committed();
    process.chdir(root);
    const { expected } = await run(root, 'where', 'MDO-0001');
    git(root, 'worktree', 'add', '-q', '-b', expected.branch, expected.worktree);
    const r = await run(root, 'where', 'MDO-0001', '--switch');
    expect(r).toMatchObject({ ready: false, switched: false, message: expect.stringMatching(/checked out in .* enter that worktree/) });
    expect(git(root, 'branch', '--show-current')).toBe('main');
  });

  test("--switch never carries another spec's uncommitted work onto this one (review F4)", async () => {
    const root = committed();
    process.chdir(root);
    const { expected } = await run(root, 'where', 'MDO-0001');
    git(root, 'branch', expected.branch);
    git(root, 'switch', '-q', '-c', 'feat/MDO-0002-other');
    writeFileSync(join(root, 'pending.txt'), 'T3 of MDO-0002, not committed yet\n');
    await expect(run(root, 'where', 'MDO-0001', '--switch')).rejects.toThrow(/feat\/MDO-0002-other holds uncommitted work/);
    expect(git(root, 'branch', '--show-current')).toBe('feat/MDO-0002-other');
  });

  test('--switch with no spec branch refuses and names the command that creates it', async () => {
    const root = committed();
    process.chdir(root);
    await expect(run(root, 'where', 'MDO-0001', '--switch')).rejects.toThrow(/has no branch .*\/mandao-specify/);
  });
});
