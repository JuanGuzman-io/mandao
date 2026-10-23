import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { readSpec } from '../../src/scripts/spec.js';
import { initTestRepo, makeTree } from '../helpers.js';

const promptState = vi.hoisted(() => ({ groups: 0, target: 'main', scope: 'push-pr' }));
vi.mock('@clack/prompts', () => ({
  group: async () => {
    promptState.groups++;
    return { target: promptState.target, scope: promptState.scope };
  },
  isCancel: (value: unknown) => typeof value === 'symbol',
  cancel: () => {},
  confirm: async () => false,
}));

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
let logs: string[];
const originalCwd = process.cwd();

afterEach(() => {
  process.chdir(originalCwd);
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function repo(provider: 'other' | 'github' = 'other', extraConfig = '') {
  const root = makeTree({
    'package.json': '{"name":"delivery-test"}',
    '.mandao/config.yml': 'schema_version: 1\nworkspace: single\nprojects:\n  - name: app\n    path: .\nharnesses: [codex]\n' + extraConfig,
    'specs/MDO-0009-delivery/story.md':
      '---\nschema_version: 2\nid: MDO-0009\ntype: story\nstatus: closed\n---\n# Ship safely\n\n### AC-1 — Delivery remains confirmed\n',
    'specs/MDO-0009-delivery/_log/state.yml':
      'start:\n  id: MDO-0009\n  title: Ship safely\n  lane: normal\n  branch: feat/MDO-0009-delivery\n  base: main\n',
    'specs/MDO-0009-delivery/close-summary.md':
      '---\nschema_version: 1\nspec: MDO-0009-delivery\nclosed_at: 2026-10-20T00:00:00Z\nenvironments: []\npublished: []\napplied: []\n---\n\n# Close — MDO-0009-delivery\n\n## Outcome\n\n- AC-1: met\n\n## For developers\n\nKeep the PR traceable.\n',
    'docs/CHANGELOG.md':
      '# Changelog\n\nOne line per closed spec, newest last.\n\n| Spec | Title | Type | Closed | Folder |\n|---|---|---|---|---|\n',
    'source.txt': 'base\n',
  });
  initTestRepo(root, '-q', '-b', 'main');
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  git(root, 'checkout', '-qb', 'feat/MDO-0009-delivery');
  writeFileSync(join(root, 'source.txt'), 'feature\n');
  git(root, 'commit', '-am', 'implement delivery\n\nRefs: MDO-0009\nMandao-Task: T1');
  const remote = makeTree({});
  initTestRepo(remote, '--bare', '-q');
  const remoteUrl = provider === 'github' ? 'https://github.com/org/repo.git' : remote;
  git(root, 'remote', 'add', 'origin', remoteUrl);
  if (provider === 'github') git(root, 'config', '--local', `url.${remote}.insteadOf`, remoteUrl);
  git(root, 'push', '-q', 'origin', 'main', 'feat/MDO-0009-delivery');
  return { root, remote };
}

function quickRepo() {
  const root = makeTree({
    'package.json': '{"name":"quick-delivery-test"}',
    '.mandao/config.yml': 'schema_version: 1\nworkspace: single\nprojects:\n  - name: app\n    path: .\nharnesses: [codex]\n',
    'specs/quick/_log/start-fix-typo.yml': 'id: quick\ntitle: Fix typo\ntype: bug\nlane: normal\nbranch: feat/quick-fix-typo\nbase: main\n',
    'specs/quick/quick-log.md': '# Quick log\n\n| Date | Name | Project | Files | Lines | Gates | Review | Commit |\n',
    'source.txt': 'base\n',
  });
  initTestRepo(root, '-q', '-b', 'main');
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  git(root, 'checkout', '-qb', 'feat/quick-fix-typo');
  writeFileSync(join(root, 'source.txt'), 'typo fixed\n');
  git(root, 'commit', '-qam', 'quick fix');
  const remote = makeTree({});
  initTestRepo(remote, '--bare', '-q');
  git(root, 'remote', 'add', 'origin', remote);
  git(root, 'push', '-q', 'origin', 'main', 'feat/quick-fix-typo');
  return { root, remote };
}

function githubWorktree(checks: 'pass' | 'fail' = 'pass', securityCheck: 'yes' | 'no' = 'yes') {
  const { root, remote } = repo('github');
  const branch = 'feat/MDO-0009-delivery';
  git(root, 'checkout', '-q', 'main');
  const worktree = join(root, 'test-worktrees', 'delivery');
  mkdirSync(join(root, 'test-worktrees'));
  git(root, 'worktree', 'add', '-q', worktree, branch);
  const localBin = makeTree({});
  symlinkSync(execFileSync('which', ['git'], { encoding: 'utf8' }).trim(), join(localBin, 'git'));
  writeFileSync(
    join(localBin, 'gh'),
    '#!/bin/sh\nif [ "$1" = "--version" ]; then exit 0; fi\ncase "$2" in\n  create) echo "https://github.com/org/repo/pull/42" ;;\n  checks) if [ "$GH_CHECKS" = "fail" ]; then echo "checks failed" >&2; exit 1; fi; if [ "$4" = "--json" ]; then if [ "$GH_SECURITY" = "yes" ]; then echo \'[{"name":"gitleaks / scan","workflow":"Secrets"}]\'; else echo \'[{"name":"build","workflow":"CI"}]\'; fi; fi ;;\n  merge) git -C "$TEST_REPO" checkout -q main && git -C "$TEST_REPO" merge --no-ff -m "Merge pull request #42" "$3" && git -C "$TEST_REPO" push -q origin main ;;\n  *) exit 2 ;;\nesac\n',
    { mode: 0o755 },
  );
  vi.stubEnv('PATH', `${localBin}:${process.env.PATH}`);
  vi.stubEnv('TEST_REPO', root);
  vi.stubEnv('GH_CHECKS', checks);
  vi.stubEnv('GH_SECURITY', securityCheck);
  return { root, remote, worktree, branch };
}

const run = (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', 'deliver', ...args]);

describe('mandao deliver manual-provider path', () => {
  test('pushes without gh, records the selected target before merge, and accepts the actual PR URL later', async () => {
    promptState.groups = 0;
    const { root, remote } = repo();
    logs = [];
    vi.spyOn(console, 'log').mockImplementation((line: string) => void logs.push(line));
    const localBin = makeTree({});
    symlinkSync(execFileSync('which', ['git'], { encoding: 'utf8' }).trim(), join(localBin, 'git'));
    vi.stubEnv('PATH', localBin);

    await run(root, 'MDO-0009');
    expect(promptState.groups).toBe(1);
    expect(logs.join('\n')).toContain('CI status: no verificable. Merge remains with the user.');
    expect(git(remote, 'show-ref', '--verify', 'refs/heads/feat/MDO-0009-delivery')).toBeTruthy();
    expect(readFileSync(join(root, 'specs/MDO-0009-delivery/close-summary.md'), 'utf8')).toContain('target: main');
    expect(readFileSync(join(root, 'docs/CHANGELOG.md'), 'utf8')).toContain('MDO-0009');

    await run(root, 'MDO-0009', '--record-pr-url', 'https://github.com/org/repo/pull/1');
    expect(readFileSync(join(root, 'specs/MDO-0009-delivery/close-summary.md'), 'utf8')).toContain('https://github.com/org/repo/pull/1');
    expect(git(remote, 'log', '-1', '--format=%s', 'feat/MDO-0009-delivery')).toBe('📝 docs(delivery): record PR destination');
    expect(git(remote, 'log', '-1', '--format=%(trailers:key=Refs,valueonly)', 'feat/MDO-0009-delivery')).toBe('MDO-0009');

    git(root, 'checkout', '-q', 'main');
    git(root, 'merge', '--no-ff', '-m', 'Merge pull request #1 from org/feat/MDO-0009-delivery', 'feat/MDO-0009-delivery');
    git(root, 'push', '-q', 'origin', 'main');
    logs = [];
    await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', 'release-status', 'MDO-0009']);
    const result = JSON.parse(logs.at(-1)!);
    expect(result.delivery).toMatchObject({
      state: 'released',
      target: 'main',
      pr_url: 'https://github.com/org/repo/pull/1',
      report: `released on main, PR #1, merge ${git(root, 'rev-parse', '--short', 'HEAD')}`,
    });
  });

  test('with commits.emoji false the delivery record commit is plain Conventional Commits and keeps its Refs trailer', async () => {
    const { root, remote } = repo('other', 'commits:\n  emoji: false\n');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const localBin = makeTree({});
    symlinkSync(execFileSync('which', ['git'], { encoding: 'utf8' }).trim(), join(localBin, 'git'));
    vi.stubEnv('PATH', localBin);
    await run(root, 'MDO-0009');
    expect(git(remote, 'log', '-1', '--format=%s', 'feat/MDO-0009-delivery')).toBe('docs(delivery): record PR destination');
    expect(git(remote, 'log', '-1', '--format=%(trailers:key=Refs,valueonly)', 'feat/MDO-0009-delivery')).toBe('MDO-0009');
  });

  test('without gh on GitHub, pushes and prints the manual PR URL without merging', async () => {
    promptState.groups = 0;
    const { root, remote } = repo('github');
    logs = [];
    vi.spyOn(console, 'log').mockImplementation((line: string) => void logs.push(line));
    const localBin = makeTree({});
    symlinkSync(execFileSync('which', ['git'], { encoding: 'utf8' }).trim(), join(localBin, 'git'));
    vi.stubEnv('PATH', localBin);

    await run(root, 'MDO-0009');

    expect(logs.join('\n')).toContain('https://github.com/org/repo/compare/main...feat%2FMDO-0009-delivery?expand=1');
    expect(logs.join('\n')).toContain('CI status: no verificable. Merge remains with the user.');
    expect(git(remote, 'show-ref', '--verify', 'refs/heads/main')).toBeTruthy();
  });

  test('quick uses the same confirmed destination, push and manual PR flow', async () => {
    promptState.groups = 0;
    const { root, remote } = quickRepo();
    logs = [];
    vi.spyOn(console, 'log').mockImplementation((line: string) => void logs.push(line));
    const localBin = makeTree({});
    symlinkSync(execFileSync('which', ['git'], { encoding: 'utf8' }).trim(), join(localBin, 'git'));
    vi.stubEnv('PATH', localBin);

    await run(root, 'quick/fix-typo');

    expect(promptState.groups).toBe(1);
    expect(git(remote, 'show-ref', '--verify', 'refs/heads/feat/quick-fix-typo')).toBeTruthy();
    expect(logs.join('\n')).toContain('Open a PR manually from feat/quick-fix-typo into main');
  });
});

describe('mandao deliver GitHub merge path', () => {
  test('merges only after green checks and leaves the worktree before principal-checkout cleanup', async () => {
    promptState.groups = 0;
    promptState.target = 'main';
    promptState.scope = 'all';
    const { root, remote, worktree, branch } = githubWorktree();
    expect(readSpec(join(worktree, 'specs/MDO-0009-delivery')).story?.meta.status).toBe('closed');
    logs = [];
    vi.spyOn(console, 'log').mockImplementation((line: string) => void logs.push(line));
    process.chdir(worktree);

    await run(worktree, 'MDO-0009');

    expect(process.cwd()).toBe(realpathSync(root));
    expect(git(remote, 'show-ref', '--verify', 'refs/heads/main')).toBeTruthy();
    expect(() => git(root, 'show-ref', '--verify', `refs/heads/${branch}`)).toThrow();
    expect(existsSync(worktree)).toBe(false);
    expect(readFileSync(join(root, 'specs/MDO-0009-delivery/close-summary.md'), 'utf8')).toContain('https://github.com/org/repo/pull/42');
    expect(logs.join('\n')).toContain('Merged into main.');
    logs = [];
    await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', 'release-status', 'MDO-0009']);
    const result = JSON.parse(logs.at(-1)!);
    expect(result.delivery).toMatchObject({
      state: 'released',
      target: 'main',
      pr_url: 'https://github.com/org/repo/pull/42',
    });
    expect(result.delivery.report).toMatch(/^released on main, PR #42, merge [a-f0-9]{7}$/);
  });

  test('does not merge or clean up when GitHub reports failing checks', async () => {
    promptState.groups = 0;
    promptState.target = 'main';
    promptState.scope = 'all';
    const { root, remote, worktree, branch } = githubWorktree('fail');
    const mainBefore = git(root, 'rev-parse', 'main');

    await expect(run(worktree, 'MDO-0009')).rejects.toThrow(/gh pr checks --watch/);

    expect(git(root, 'rev-parse', 'main')).toBe(mainBefore);
    expect(git(remote, 'rev-parse', 'refs/heads/main')).toBe(mainBefore);
    expect(git(root, 'worktree', 'list', '--porcelain')).toContain(branch);
    expect(git(root, 'branch', '--show-current')).toBe('main');
    expect(git(root, 'show-ref', '--verify', `refs/heads/${branch}`)).toBeTruthy();
  });

  test('warns when green PR checks include no identifiable security scan', async () => {
    promptState.groups = 0;
    promptState.target = 'main';
    promptState.scope = 'all';
    const { root } = githubWorktree('pass', 'no');
    logs = [];
    vi.spyOn(console, 'log').mockImplementation((line: string) => void logs.push(line));

    await run(root, 'MDO-0009');

    expect(logs.join('\n')).toContain('no identifiable secret-scanning or SAST check');
    expect(logs.join('\n')).toContain('Merged into main.');
  });
});
