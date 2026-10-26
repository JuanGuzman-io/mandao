import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { parseState } from '../../src/spec/state.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});
afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

/** main with a constitution file committed; worktrees go in .worktrees/. */
function repo() {
  const root = realpathSync(
    makeTree({ 'package.json': pkg('shop'), '.gitignore': '.worktrees/\n', 'docs/constitution/product.md': '# Product\n' }),
  );
  initTestRepo(root, '-q', '-b', 'main');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.' }],
    harnesses: ['claude'],
    paths: { worktrees: '.worktrees' },
  });
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}
/** What an intake leaves uncommitted: a proposal and a constitution change. */
function intakeLeftovers(root: string) {
  mkdirSync(join(root, 'docs/product/intake'), { recursive: true });
  writeFileSync(join(root, 'docs/product/intake/test-2026-10-26.md'), '# Proposal\n');
  writeFileSync(join(root, 'docs/constitution/product.md'), '# Product\n\nNew rule.\n');
}
const run = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
  return JSON.parse(out.at(-1)!);
};

describe('run spec-new --create: the spec opens in the session, no git by the user (phase 16)', () => {
  test('in place by default: the branch from the base in this checkout, carrying the intake leftovers, with the request recorded', async () => {
    const root = repo();
    intakeLeftovers(root);
    const r = await run(root, 'spec-new', 'add a login', '--create', '--no-baseline');
    expect(r).toMatchObject({ mode: 'in-place', dir: root, ok: true });
    expect(git(root, 'branch', '--show-current')).toBe(r.branch);
    expect(readFileSync(join(root, 'docs/product/intake/test-2026-10-26.md'), 'utf8')).toBe('# Proposal\n');
    expect(readFileSync(join(root, 'docs/constitution/product.md'), 'utf8')).toContain('New rule.');
    const state = parseState(readFileSync(join(root, r.folder, '_log/state.yml'), 'utf8'));
    expect(state.start).toMatchObject({ id: r.id, title: 'add a login', branch: r.branch, base: 'main' });
  });

  test('--worktree moves the leftovers into the new worktree and leaves the main checkout clean of them', async () => {
    const root = repo();
    intakeLeftovers(root);
    const r = await run(root, 'spec-new', 'add a login', '--create', '--worktree', '--no-install', '--no-baseline');
    expect(r).toMatchObject({ mode: 'worktree', dir: r.worktree, ok: true });
    expect(git(r.worktree, 'branch', '--show-current')).toBe(r.branch);
    expect(existsSync(join(r.worktree, 'docs/product/intake/test-2026-10-26.md'))).toBe(true);
    expect(readFileSync(join(r.worktree, 'docs/constitution/product.md'), 'utf8')).toContain('New rule.');
    expect(git(root, 'status', '--porcelain')).toBe('');
    expect(existsSync(join(r.worktree, r.folder, '_log/state.yml'))).toBe(true);
  });

  test('another spec open in this checkout: the new one gets a worktree instead of taking the checkout', async () => {
    const root = repo();
    git(root, 'switch', '-q', '-c', 'feat/MDO-0001-first');
    const r = await run(root, 'spec-new', 'second', '--create', '--no-install', '--no-baseline');
    expect(r.mode).toBe('worktree');
    expect(git(root, 'branch', '--show-current')).toBe('feat/MDO-0001-first');
  });

  test('--discard says what it would remove, and with --yes removes the branch and returns this checkout to the base', async () => {
    const root = repo();
    const r = await run(root, 'spec-new', 'by mistake', '--create', '--no-baseline');
    git(root, 'add', '.');
    git(root, 'commit', '-qm', 'start');
    expect(await run(root, 'spec-new', r.id, '--discard')).toMatchObject({
      discarded: false,
      wouldRemove: { branch: r.branch, inPlace: true },
    });
    expect(await run(root, 'spec-new', r.id, '--discard', '--yes')).toMatchObject({ discarded: true });
    expect(git(root, 'branch', '--show-current')).toBe('main');
    expect(git(root, 'branch', '--list', r.branch)).toBe('');
  });

  test('--discard never removes uncommitted work', async () => {
    const root = repo();
    const r = await run(root, 'spec-new', 'by mistake', '--create', '--no-baseline');
    await expect(run(root, 'spec-new', r.id, '--discard', '--yes')).rejects.toThrow(/holds uncommitted work/);
    expect(git(root, 'branch', '--show-current')).toBe(r.branch);
  });
});
