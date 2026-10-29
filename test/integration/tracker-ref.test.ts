import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

/** ClickUp trial: `spec-new --id 86e3w5954` opened a spec whose story.md could never validate. */
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

function repo(tracker: string) {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop'), '.gitignore': '.worktrees/\n' }));
  initTestRepo(root, '-q', '-b', 'main');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.' }],
    harnesses: ['claude'],
    paths: { worktrees: '.worktrees' },
  });
  writeYaml(join(root, '.mandao/sources.yml'), { schema_version: 1, tracker });
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}
const run = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
  return JSON.parse(out.at(-1)!);
};

test('an id that is not a story id is refused before any branch is created, pointing at --tracker-id', async () => {
  const root = repo('clickup');
  const proposal = await run(root, 'spec-new', 'wizard', '--id', '86e3w5954');
  expect(proposal.issues.join(' ')).toMatch(/86e3w5954.*--tracker-id/);
  await expect(run(root, 'spec-new', 'wizard', '--id', '86e3w5954', '--create', '--no-baseline')).rejects.toThrow(/--tracker-id/);
  expect(git(root, 'branch', '--list')).not.toContain('86e3w5954');
});

test.each([
  ['clickup', '86e3w5954', 'CU-86e3w5954'],
  ['jira', 'VZ-12', 'VZ-12'],
  ['linear', 'ENG-123', 'ENG-123'],
])('a %s item keeps the local id for the folder and puts its reference in the branch', async (tracker, trackerId, ref) => {
  const root = repo(tracker);
  const plain = (await run(root, 'spec-new', 'contract wizard')).branch as string;
  expect(plain).toMatch(/MDO-0001-contract-wizard$/);
  const r = await run(root, 'spec-new', 'contract wizard', '--tracker-id', trackerId, '--create', '--no-baseline');
  expect(r).toMatchObject({ id: 'MDO-0001', trackerRef: ref, folder: 'specs/MDO-0001-contract-wizard', ok: true });
  expect(r.branch).toBe(plain.replace('MDO-0001-', `MDO-0001-${ref}-`));
  expect(git(root, 'branch', '--show-current')).toBe(r.branch);
});

test('an unsafe tracker id is refused', async () => {
  const root = repo('clickup');
  const bad = await run(root, 'spec-new', 'contract wizard', '--tracker-id', '../x');
  expect(bad.issues.join(' ')).toMatch(/tracker id/);
});
