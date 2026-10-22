import { cpSync, realpathSync } from 'node:fs';
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
