import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { openCommand, parseRequest } from '../../src/cli/start.js';
import { writeYaml } from '../../src/engine/files.js';
import { dependencyInstalls } from '../../src/scripts/worktree-setup.js';
import { parseState } from '../../src/spec/state.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
  for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
  vi.stubEnv(
    'PATH',
    process.env
      .PATH!.split(':')
      .filter((p) => !p.includes('graphify'))
      .join(':'),
  );
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

/** A repository on main with env files, a tracked README, a graph cache and gates; worktrees go in .worktrees/. */
function repo(gates: Record<string, string> = {}, setup: string[] = []) {
  const root = realpathSync(
    makeTree({
      'package.json': pkg('shop'),
      'README.md': 'x\n',
      '.gitignore': '.env\n.env.local\n.worktrees/\ngraphify-out/\n',
      '.env': 'TOKEN=a\n',
      '.env.local': 'TOKEN=b\n',
      'graphify-out/graph.json': '{}',
      '.mandao/worktree-include': '.env\nREADME.md\n',
      '.worktreeinclude': '.env.local\n',
    }),
  );
  initTestRepo(root, '-q', '-b', 'main');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.', gates, worktree: { setup } }],
    harnesses: ['claude'],
    paths: { worktrees: '.worktrees' },
  });
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}
const cli = async (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', ...args]);
const lastJson = () => JSON.parse(out.at(-1)!);

describe('mandao start (§14.5, ADR 0037)', () => {
  test('creates the branch and worktree from the base, copies only gitignored listed files, runs setup hooks, records the baseline and the request', async () => {
    const root = repo(
      { lint: 'node -e "process.exit(0)"', typecheck: 'node -e "console.log(\'error TS1: broken on main\'); process.exit(2)"' },
      ["node -e \"require('fs').writeFileSync('generated.txt','x')\""],
    );
    await cli(root, 'start', 'Add', 'a', 'login', 'rate', 'limit', '--no-install', '--json');
    const r = lastJson();
    const wt = r.worktree as string;
    expect(r.branch).toMatch(/^feat\/[A-Z]+-\d{4}-add-a-login-rate-limit$/);
    expect(git(wt, 'rev-parse', '--abbrev-ref', 'HEAD')).toBe(r.branch);
    // Env files: listed and gitignored are copied; a tracked file is skipped with a warning.
    expect(readFileSync(join(wt, '.env'), 'utf8')).toBe('TOKEN=a\n');
    expect(readFileSync(join(wt, '.env.local'), 'utf8')).toBe('TOKEN=b\n');
    expect(r.steps).toContainEqual(
      expect.objectContaining({ step: 'env files', status: 'warning', detail: expect.stringMatching(/^README\.md: tracked/) }),
    );
    expect(existsSync(join(wt, 'generated.txt'))).toBe(true);
    expect(existsSync(join(wt, 'graphify-out/graph.json'))).toBe(true);
    // Baseline: the cheap gates on the clean worktree; a red one is reported before any change. A new spec
    // is version 2: the baseline and the request are sections of `_log/state.yml` (MDO-0011 D3).
    const folder = `specs/${r.id}-add-a-login-rate-limit`;
    const state = parseState(readFileSync(join(wt, folder, '_log/state.yml'), 'utf8'));
    expect(state.baseline?.gates).toContainEqual({ project: 'shop', gate: 'typecheck', result: 'FAIL' });
    expect(state.baseline?.failures[0]?.output).toContain('error TS1: broken on main');
    expect(r.steps).toContainEqual(expect.objectContaining({ step: 'baseline', status: 'warning' }));
    expect(state.start).toMatchObject({ id: r.id, title: 'Add a login rate limit', type: 'story', lane: 'normal', branch: r.branch });
    expect(r.open).toBe(`cd ${JSON.stringify(wt)} && claude "/mandao-specify ${r.id} --depth lite"`);
    expect(git(root, 'status', '--porcelain')).toBe('');
  });

  test('a tracker id is used as is; quick changes keep their request in the quick log', async () => {
    const root = repo();
    await cli(root, 'start', 'PROJ-12', '--no-install', '--no-baseline', '--json');
    expect(lastJson()).toMatchObject({ id: 'PROJ-12', branch: 'feat/PROJ-12' });
    await cli(root, 'start', '--quick', 'fix', 'the', 'typo', '--no-install', '--no-baseline', '--json');
    const q = lastJson();
    expect(existsSync(join(q.worktree, 'specs/quick/_log/start-fix-the-typo.yml'))).toBe(true);
    expect(q.open).toContain('claude "/mandao-quick fix the typo"');
  });

  test('worktree list and clean: only merged, clean worktrees are removed', async () => {
    const root = repo();
    await cli(root, 'start', 'PROJ-1', '--no-install', '--no-baseline', '--json');
    const merged = lastJson().worktree as string;
    await cli(root, 'start', 'PROJ-2', '--no-install', '--no-baseline', '--json');
    const busy = lastJson().worktree as string;
    // PROJ-1's branch has no commits of its own (merged); PROJ-2 holds uncommitted work.
    writeFileSync(join(busy, 'wip.ts'), 'x');
    mkdirSync(join(merged, 'specs'), { recursive: true });
    git(merged, 'clean', '-fdq');
    await cli(root, 'worktree', 'clean');
    expect(out.join('\n')).toMatch(/removed .*PROJ-1/);
    expect(out.join('\n')).toMatch(/kept .*PROJ-2.*(has uncommitted work|not merged)/);
    expect(existsSync(merged)).toBe(false);
    expect(existsSync(busy)).toBe(true);
  });
});

describe('setup helpers', () => {
  test('dependencies by lockfile: one JS package manager, yarn v1 frozen, other ecosystems alongside', () => {
    const dir = makeTree({ 'pnpm-lock.yaml': '', 'package-lock.json': '{}', 'uv.lock': '' });
    expect(dependencyInstalls(dir)).toEqual(['pnpm install --frozen-lockfile', 'uv sync']);
    expect(dependencyInstalls(makeTree({ 'yarn.lock': '# yarn lockfile v1\n' }))).toEqual(['yarn install --frozen-lockfile']);
    expect(dependencyInstalls(makeTree({ 'yarn.lock': '__metadata:\n' }))).toEqual(['yarn install --immutable']);
  });

  test('requests and harness commands', () => {
    expect(parseRequest(['PROJ-9', 'Pay', 'by', 'card'])).toEqual({ id: 'PROJ-9', title: 'Pay by card' });
    expect(parseRequest(['pay', 'by', 'card'])).toEqual({ title: 'pay by card' });
    expect(openCommand('codex', '/w', '/mandao-specify X').text).toBe('cd "/w" && codex \'$mandao-specify X\'');
    expect(openCommand('opencode', '/w', '/mandao-specify X').launch).toBeUndefined();
  });
});
