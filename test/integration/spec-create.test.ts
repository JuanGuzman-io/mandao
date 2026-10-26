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

  test('a path with spaces moves into the worktree whole (review F6)', async () => {
    const root = repo();
    writeFileSync(join(root, 'docs/constitution/my rule.md'), '# Rule\n');
    const r = await run(root, 'spec-new', 'add a login', '--create', '--worktree', '--no-install', '--no-baseline');
    expect(readFileSync(join(r.worktree, 'docs/constitution/my rule.md'), 'utf8')).toBe('# Rule\n');
    expect(existsSync(join(root, 'docs/constitution/my rule.md'))).toBe(false);
  });

  test("from another spec's branch, its uncommitted shared changes stay with it (review F5)", async () => {
    const root = repo();
    git(root, 'switch', '-q', '-c', 'feat/MDO-0001-first');
    writeFileSync(join(root, 'docs/constitution/product.md'), '# Product\n\nMDO-0001 rule.\n');
    const r = await run(root, 'spec-new', 'second', '--create', '--no-install', '--no-baseline');
    expect(r.mode).toBe('worktree');
    expect(readFileSync(join(root, 'docs/constitution/product.md'), 'utf8')).toContain('MDO-0001 rule.');
    expect(readFileSync(join(r.worktree, 'docs/constitution/product.md'), 'utf8')).not.toContain('MDO-0001 rule.');
    expect(r.steps).toContainEqual(
      expect.objectContaining({ step: 'pending files', status: 'skipped', detail: expect.stringMatching(/feat\/MDO-0001-first/) }),
    );
  });

  test('another open spec changed shared state: the proposal says so before anything is created, and --carry-from brings those files (MDO-0002 trial)', async () => {
    const root = repo();
    git(root, 'switch', '-q', '-c', 'feat/MDO-0001-backend');
    writeFileSync(join(root, 'docs/constitution/product.md'), '# Product\n\nQdrant, not sqlite-vec.\n');
    git(root, 'commit', '-qam', 'reopen the constitution');
    git(root, 'switch', '-q', 'main');
    const proposed = await run(root, 'spec-new', 'frontend');
    expect(proposed.sharedState).toEqual([{ branch: 'feat/MDO-0001-backend', files: ['docs/constitution/product.md'] }]);
    expect(git(root, 'branch', '--list', proposed.branch)).toBe('');
    const opened = await run(root, 'spec-new', 'frontend', '--create', '--no-baseline', '--carry-from', 'feat/MDO-0001-backend');
    expect(opened.steps).toContainEqual(expect.objectContaining({ step: 'shared state', status: 'done' }));
    expect(readFileSync(join(root, 'docs/constitution/product.md'), 'utf8')).toContain('Qdrant');
  });

  test('--carry-from never overwrites uncommitted edits to those files, and refuses before creating anything (review F1)', async () => {
    const root = repo();
    git(root, 'switch', '-q', '-c', 'feat/MDO-0001-backend');
    writeFileSync(join(root, 'docs/constitution/product.md'), '# Product\n\nQdrant.\n');
    git(root, 'commit', '-qam', 'reopen the constitution');
    git(root, 'switch', '-q', 'main');
    writeFileSync(join(root, 'docs/constitution/product.md'), '# Product\n\nMy own edit.\n');
    const proposed = await run(root, 'spec-new', 'frontend');
    await expect(run(root, 'spec-new', 'frontend', '--create', '--no-baseline', '--carry-from', 'feat/MDO-0001-backend')).rejects.toThrow(
      /uncommitted edits to docs\/constitution\/product\.md/,
    );
    expect(readFileSync(join(root, 'docs/constitution/product.md'), 'utf8')).toContain('My own edit.');
    expect(git(root, 'branch', '--list', proposed.branch)).toBe('');
  });

  test('--discard says what it would remove, and with --yes removes the branch and returns this checkout to the base', async () => {
    const root = repo();
    const r = await run(root, 'spec-new', 'by mistake', '--create', '--no-baseline');
    git(root, 'add', '.');
    git(root, 'commit', '-qm', 'start');
    expect(await run(root, 'spec-new', r.id, '--discard')).toMatchObject({
      discarded: false,
      wouldRemove: { branch: r.branch, inPlace: true, unmergedCommits: [expect.stringMatching(/ start$/)] },
    });
    expect(await run(root, 'spec-new', r.id, '--discard', '--yes')).toMatchObject({ discarded: true });
    expect(git(root, 'branch', '--show-current')).toBe('main');
    expect(git(root, 'branch', '--list', r.branch)).toBe('');
  });

  test('--discard only matches spec branches: never main or another plain branch (review F7)', async () => {
    const root = repo();
    git(root, 'switch', '-q', '-c', 'feat/MDO-0001-first');
    await expect(run(root, 'spec-new', 'main', '--discard', '--yes')).rejects.toThrow(/no spec branch found/);
    expect(git(root, 'branch', '--list', 'main')).toContain('main');
  });

  test('--discard never removes uncommitted work', async () => {
    const root = repo();
    const r = await run(root, 'spec-new', 'by mistake', '--create', '--no-baseline');
    await expect(run(root, 'spec-new', r.id, '--discard', '--yes')).rejects.toThrow(/holds uncommitted work/);
    expect(git(root, 'branch', '--show-current')).toBe(r.branch);
  });
});
