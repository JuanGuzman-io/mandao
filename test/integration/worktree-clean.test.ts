import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { initTestRepo, makeTree, pkg, stubTerminal } from '../helpers.js';

let restoreTerminal: () => void;
beforeEach(() => {
  restoreTerminal = stubTerminal();
});
afterEach(() => restoreTerminal());

const prompts = vi.hoisted(() => ({ accepted: false, calls: 0 }));
vi.mock('@clack/prompts', () => ({
  confirm: async () => {
    prompts.calls++;
    return prompts.accepted;
  },
  isCancel: (value: unknown) => typeof value === 'symbol',
  cancel: () => {},
}));

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, stdio: 'ignore' });
let output: string[];
const originalCwd = process.cwd();

beforeEach(() => {
  prompts.accepted = false;
  prompts.calls = 0;
  output = [];
  vi.spyOn(console, 'log').mockImplementation((line: string) => void output.push(line));
});
afterEach(() => {
  process.chdir(originalCwd);
  vi.restoreAllMocks();
});

function repo() {
  const root = makeTree({
    'package.json': pkg('worktree-test'),
    '.mandao/config.yml':
      'schema_version: 1\nworkspace: single\nprojects:\n  - name: app\n    path: .\nharnesses: [codex]\npaths:\n  worktrees: test-worktrees\nbranching:\n  model: feature-branch\n  base: main\n',
    'tracked.txt': 'base\n',
  });
  initTestRepo(root, '-q', '-b', 'main');
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  mkdirSync(join(root, 'test-worktrees'));
  for (const name of ['one', 'two']) {
    const worktree = join(root, 'test-worktrees', name);
    git(root, 'worktree', 'add', '-qb', `feat/${name}`, worktree, 'main');
    writeFileSync(join(worktree, 'tracked.txt'), `${name}\n`);
    git(worktree, 'commit', '-qam', name);
    git(root, 'merge', '--no-ff', '-qm', name, `feat/${name}`);
  }
  return root;
}

const clean = (root: string) => buildProgram(() => root).parseAsync(['node', 'mandao', 'worktree', 'clean']);

describe('worktree clean safety', () => {
  test('does not remove another spec worktree until the grouped removal is confirmed', async () => {
    const root = repo();
    await clean(root);
    expect(prompts.calls).toBe(1);
    expect(existsSync(join(root, 'test-worktrees/one'))).toBe(true);
    expect(existsSync(join(root, 'test-worktrees/two'))).toBe(true);
    expect(output).toContain('Kept all worktrees.');
  });

  test('without a terminal it lists what it would remove and refuses, naming --yes (MDO-0001 close)', async () => {
    const root = repo();
    restoreTerminal();
    restoreTerminal = stubTerminal(false);
    await expect(clean(root)).rejects.toThrow(/no terminal here: re-run with --yes/);
    expect(prompts.calls).toBe(0);
    expect(output.join('\n')).toContain('feat/one');
    expect(existsSync(join(root, 'test-worktrees/one'))).toBe(true);
    await buildProgram(() => root).parseAsync(['node', 'mandao', 'worktree', 'clean', '--yes']);
    expect(existsSync(join(root, 'test-worktrees/one'))).toBe(false);
  });

  test('removes only clean, confirmed worktrees and retains those with untracked files', async () => {
    const root = repo();
    writeFileSync(join(root, 'test-worktrees/two/untracked.txt'), 'keep me');
    prompts.accepted = true;
    await clean(root);
    expect(existsSync(join(root, 'test-worktrees/one'))).toBe(false);
    expect(existsSync(join(root, 'test-worktrees/two/untracked.txt'))).toBe(true);
    expect(output.join('\n')).toContain('uncommitted or untracked files');
  });

  test('leaves the active worktree before removing it from the principal checkout', async () => {
    const root = repo();
    const active = join(root, 'test-worktrees/one');
    process.chdir(active);
    await buildProgram(() => active).parseAsync(['node', 'mandao', 'worktree', 'clean', '--yes']);
    expect(process.cwd()).toBe(realpathSync(root));
    expect(existsSync(active)).toBe(false);
  });
});
