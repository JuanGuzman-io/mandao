import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { runDoctor } from '../../src/engine/doctor.js';
import { makeTree, pkg } from '../helpers.js';

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
    git(root, 'init', '-q');
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
