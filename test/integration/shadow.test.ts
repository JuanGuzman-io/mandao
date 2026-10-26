import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { runDoctor } from '../../src/engine/doctor.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const probe = (cmd: string) => (cmd.startsWith('npm view mandao@') ? '0.1.0\n' : undefined);
const run = (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', ...args]);

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
  for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('init --shadow (ADR 0030)', () => {
  test("the team's tracked files stay byte-identical and nothing shows in git status", async () => {
    const team = '# Team rules\n\nOur own agent rules.\n';
    const root = realpathSync(makeTree({ 'package.json': pkg('shop'), 'AGENTS.md': team, '.gitignore': 'node_modules/\n' }));
    initTestRepo(root, '-q');
    git(root, 'add', '.');
    git(root, 'commit', '-qm', 'team');
    await run(root, 'init', '--yes', '--harness', 'claude', '--shadow');
    expect(git(root, 'status', '--porcelain')).toBe('');
    expect(readFileSync(join(root, 'AGENTS.md'), 'utf8')).toBe(team);
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toBe('node_modules/\n');
    const exclude = readFileSync(join(root, '.git/info/exclude'), 'utf8');
    expect(exclude).toContain('.mandao/');
    expect(exclude).toContain('.claude/skills/mandao-specify/');
    expect(exclude).toContain('specs/');
    expect(existsSync(join(root, '.claude/skills/mandao-specify/SKILL.md'))).toBe(true);

    const findings = runDoctor(root, { probe });
    expect(findings.filter((f) => /drift|edited by hand|not in sync/.test(f.message))).toEqual([]);
    expect(findings.find((f) => f.message.startsWith('shadow mode'))).toMatchObject({
      level: 'info',
      message: expect.stringContaining('left alone: .gitignore, AGENTS.md'),
    });
    // A second sync changes nothing.
    await run(root, 'sync');
    expect(git(root, 'status', '--porcelain')).toBe('');
  });
});

describe('init [dir]', () => {
  test('creates the folder and a git repository when needed', async () => {
    const parent = realpathSync(makeTree({}));
    await run(parent, 'init', 'my-project', '--yes', '--harness', 'claude');
    const dir = join(parent, 'my-project');
    expect(existsSync(join(dir, '.git'))).toBe(true);
    expect(existsSync(join(dir, '.mandao/config.yml'))).toBe(true);
    expect(existsSync(join(parent, '.mandao'))).toBe(false);
  });
});

describe('init and the budget (ADR 0036)', () => {
  const config = (root: string) => readFileSync(join(root, '.mandao/config.yml'), 'utf8');
  const fresh = () => realpathSync(makeTree({ 'package.json': pkg('shop') }));
  test('no budget unless a person gives one: --yes leaves it out, --budget sets it, a bad value fails', async () => {
    const plain = fresh();
    await run(plain, 'init', '--yes', '--harness', 'claude');
    expect(config(plain)).not.toMatch(/budget/);
    const capped = fresh();
    await run(capped, 'init', '--yes', '--harness', 'claude', '--budget', '12.5');
    expect(config(capped)).toMatch(/per_spec: 12\.5/);
    const none = fresh();
    await run(none, 'init', '--yes', '--harness', 'claude', '--budget', 'none');
    expect(config(none)).not.toMatch(/budget/);
    await expect(run(fresh(), 'init', '--yes', '--harness', 'claude', '--budget', '-3')).rejects.toThrow(
      /--budget must be a positive number/,
    );
  });

  test("the session cut threshold is the person's too: --cut-min-savings sets it, none leaves the cost-basis default (phase 16)", async () => {
    const plain = fresh();
    await run(plain, 'init', '--yes', '--harness', 'claude');
    expect(config(plain)).not.toMatch(/cut_min_savings/);
    const set = fresh();
    await run(set, 'init', '--yes', '--harness', 'claude', '--cut-min-savings', '50');
    expect(config(set)).toMatch(/cut_min_savings: 50/);
    await expect(run(fresh(), 'init', '--yes', '--harness', 'claude', '--cut-min-savings', 'lots')).rejects.toThrow(
      /--cut-min-savings must be a number of USD/,
    );
  });
});
