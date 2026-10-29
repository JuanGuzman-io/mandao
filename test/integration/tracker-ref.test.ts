import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { trackerLine } from '../../src/cli/deliver.js';
import { buildProgram } from '../../src/cli/program.js';
import { readConfig, writeYaml } from '../../src/engine/files.js';
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

function repo(tracker?: string) {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop'), '.gitignore': '.worktrees/\n' }));
  initTestRepo(root, '-q', '-b', 'main');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.' }],
    harnesses: ['claude'],
    paths: { worktrees: '.worktrees' },
  });
  if (tracker) writeYaml(join(root, '.mandao/sources.yml'), { schema_version: 1, tracker });
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

test('--tracker-id without a tracker in sources.yml is refused, not silently dropped (review F3)', async () => {
  for (const root of [repo(), repo('none')]) {
    const r = await run(root, 'spec-new', 'contract wizard', '--tracker-id', '86e3w5954');
    expect(r.issues.join(' ')).toMatch(/--tracker-id needs the tracker/);
  }
});

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');

/** A ClickUp spec opened with --tracker-id, its story written from the fixture with the tracker fields. */
async function clickupSpec(trackerFields = true) {
  const root = repo('clickup');
  const made = await run(root, 'spec-new', 'skills list', '--tracker-id', '86e3w5954', '--create', '--no-baseline');
  const dir = join(root, made.folder);
  cpSync(fixture, dir, { recursive: true, force: false });
  if (trackerFields) {
    const story = join(dir, 'story.md');
    writeFileSync(
      story,
      readFileSync(story, 'utf8')
        .replace(/^id: (.*)$/m, 'id: $1\ntracker_id: "86e3w5954"')
        .replace(/^tracker: .*$/m, 'tracker: clickup'),
    );
  }
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base spec', '--no-verify');
  return { root, made };
}

test('where agrees with the branch spec-new created, even when story.md lacks the tracker fields (review F4)', async () => {
  const { root, made } = await clickupSpec(false);
  const r = await run(root, 'where', 'MDO-0001');
  expect(r.expected.branch).toBe(made.branch);
});

test('commit-spec adds the Tracker trailer, and --trailer cannot forge it (review F2)', async () => {
  const { root } = await clickupSpec();
  const story = join(root, 'specs/MDO-0001-skills-list/story.md');
  writeFileSync(story, `${readFileSync(story, 'utf8')}\nA clarification.\n`);
  await run(root, 'commit-spec', 'MDO-0001', 'clarify', '--trailer', 'Tracker: CU-other');
  expect(process.exitCode).toBe(1);
  expect(out.at(-1)).toMatch(/Tracker is one Mandao writes/);
  process.exitCode = undefined;
  await run(root, 'commit-spec', 'MDO-0001', 'clarify');
  expect(git(root, 'log', '-1', '--format=%(trailers)')).toBe('Refs: MDO-0001\nTracker: CU-86e3w5954');
});

test('--discard finds a branch that carries a tracker reference', async () => {
  const root = repo('jira');
  const made = await run(root, 'spec-new', 'contract wizard', '--tracker-id', 'VZ-12', '--create', '--no-baseline');
  git(root, 'switch', '-q', 'main');
  const r = await run(root, 'spec-new', 'MDO-0001', '--discard');
  expect(r.wouldRemove.branch).toBe(made.branch);
});

test('the PR body opens with the reference, linked only to a plain http(s) URL', () => {
  const config = readConfig(repo('clickup'));
  const meta = { tracker: 'clickup', tracker_id: '86e3w5954' };
  expect(trackerLine(config, { ...meta, url: 'https://app.clickup.com/t/86e3w5954' })).toBe(
    'Tracker: [CU-86e3w5954](https://app.clickup.com/t/86e3w5954)\n\n',
  );
  expect(trackerLine(config, { ...meta, url: 'javascript:alert(1)' })).toBe('Tracker: CU-86e3w5954\n\n');
  expect(trackerLine(config, { tracker: 'clickup' })).toBe('');
});
