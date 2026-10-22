// mandao-scans: none — lists only the temporary trees it creates.
import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { setTaskDone, withStatus } from '../../src/spec/index.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
  for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

function repo() {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
  initTestRepo(root, '-q', '-b', 'feat/MDO-0001-skills-list');
  git(root, 'config', 'user.name', 'Ana PO');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude'],
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  for (const f of ['story.md', 'requirements.md', 'tasks.md']) {
    const file = join(root, SPEC, f);
    writeFileSync(file, withStatus(readFileSync(file, 'utf8'), 'draft'));
  }
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}
const run = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
  return JSON.parse(out.at(-1)!);
};
const specDir = (root: string) => join(root, SPEC);
const append = (root: string, f: string, add: string) => {
  const file = join(specDir(root), f);
  writeFileSync(file, `${readFileSync(file, 'utf8')}\n${add}\n`);
};
const text = (v: unknown) => JSON.stringify(v);

/** MDO-0010 T5 (D1): `run next` reads a failed verify from the report and a closed spec's delivery from git. */
describe('mandao run next: a failed verify and a closed spec (T5)', () => {
  const closedRepo = () => {
    const root = repo();
    const file = join(specDir(root), 'story.md');
    writeFileSync(file, withStatus(readFileSync(file, 'utf8'), 'closed'));
    append(root, 'requirements.md', '- [NEEDS CLARIFICATION]: left behind?');
    git(root, 'add', '.');
    git(root, 'commit', '-qm', 'closed');
    return root;
  };
  const names = async (root: string) => text(await run(root, 'next', 'MDO-0001'));

  test('a verify-report.md with verdict blocked recommends implement, not verify', async () => {
    const root = repo();
    for (const f of ['story.md', 'requirements.md', 'tasks.md']) {
      const file = join(specDir(root), f);
      writeFileSync(file, withStatus(readFileSync(file, 'utf8'), 'approved'));
    }
    const tasks = join(specDir(root), 'tasks.md');
    writeFileSync(tasks, setTaskDone(readFileSync(tasks, 'utf8'), 'T2', true));
    expect((await run(root, 'next', 'MDO-0001')).recommended.command).toBe('/mandao-verify');
    writeFileSync(join(specDir(root), 'verify-report.md'), '---\nverdict: blocked\n---\n# Verify\n');
    expect((await run(root, 'next', 'MDO-0001')).recommended.command).toBe('/mandao-implement');
  });

  test('closed branch delivery progresses from push to PR/merge and then finishes', async () => {
    const root = closedRepo();
    expect((await run(root, 'next', 'MDO-0001')).recommended.command).toMatch(/push/);
    expect(await names(root)).not.toMatch(/mandao-story|mandao-clarify/);
    const remote = realpathSync(makeTree({}));
    initTestRepo(remote, '-q', '--bare');
    git(root, 'remote', 'add', 'origin', remote);
    git(root, 'push', '-q', '-u', 'origin', 'feat/MDO-0001-skills-list');
    expect((await run(root, 'next', 'MDO-0001')).recommended.command).toMatch(/PR|pull request/i);
    expect(await names(root)).not.toMatch(/mandao-story|mandao-clarify/);
    git(root, 'branch', 'main');
    const local = await run(root, 'next', 'MDO-0001');
    expect(local.recommended.command).toMatch(/push|PR|pull request/i);
    expect(local.options).not.toEqual([]);
    git(root, 'push', '-q', 'origin', 'main');
    expect((await run(root, 'next', 'MDO-0001')).options).toEqual([]);
    expect(await names(root)).not.toMatch(/mandao-story|mandao-clarify/);
  });

  test('the delivery is read from the spec branch, not from the checked-out one', async () => {
    const root = closedRepo();
    git(root, 'commit', '-q', '--allow-empty', '-m', 'more work');
    git(root, 'branch', 'main', 'HEAD~1');
    git(root, 'checkout', '-q', 'main');
    expect((await run(root, 'next', 'MDO-0001')).recommended.command).toMatch(/push/);
  });

  test('run next on a closed spec writes nothing', async () => {
    const root = closedRepo();
    await run(root, 'next', 'MDO-0001');
    expect(git(root, 'status', '--porcelain')).toBe('');
  });
});
