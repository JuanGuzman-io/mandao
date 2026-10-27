import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { readConfig, writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { configSchema } from '../../src/schemas/index.js';
import { changeManifest, commitPending } from '../../src/scripts/commits.js';
import { readSpec } from '../../src/scripts/spec.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

/** Hotfix beta.2: implement moved story.md to in-progress by hand, and run commit then refused the first task. */
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
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

/** A synced repo with the approved MDO-0001 spec, committed on its feature branch. */
function repo() {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop'), 'README.md': 'x\n', 'src/code.js': 'export const answer = 42;\n' }));
  initTestRepo(root, '-q', '-b', 'feat/MDO-0001-skills-list');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.', tests: { impacted: 'node -e "process.exit(0)" {files}' } }],
    harnesses: ['claude'],
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}
const run = (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
const lastJson = () => JSON.parse(out.at(-1)!);
const status = (root: string) => /^status: (.+)$/m.exec(readFileSync(join(root, SPEC, 'story.md'), 'utf8'))?.[1];

/** T2 passed review with one source change: the entry `run commit` would find in progress.yml. */
function passedTask(root: string) {
  writeFileSync(join(root, 'src/code.js'), 'export const answer = 43;\n');
  const spec = readSpec(join(root, SPEC));
  return {
    repo: root,
    specDir: spec.dir,
    config: configSchema.parse(readConfig(root)),
    story: spec.story!,
    tasks: spec.tasks.map((task) => (task.id === 'T2' ? { ...task, kind: 'feat' as const, files: ['src/code.js'] } : task)),
    progress: {
      ...spec.progress!,
      pending_commits: [{ task: 'T2', subject: 'answer 43', files: ['src/code.js'], manifest: changeManifest(root, spec.dir) }],
    },
  };
}

test('run status --apply writes an allowed status into story.md, and nothing when the change is refused', async () => {
  const root = repo();
  await run(root, 'status', 'MDO-0001', 'closed', '--apply');
  expect(lastJson()).toMatchObject({ from: 'approved', to: 'closed', allowed: false, applied: false });
  expect(status(root)).toBe('approved');
  process.exitCode = undefined;

  await run(root, 'status', 'MDO-0001', 'in-progress', '--apply');
  expect(lastJson()).toMatchObject({ from: 'approved', to: 'in-progress', allowed: true, applied: true });
  expect(status(root)).toBe('in-progress');
  expect(process.exitCode).toBeUndefined();
});

test('commit-spec implement commits only the story status, and the first task commit then goes through', async () => {
  const root = repo();
  await run(root, 'status', 'MDO-0001', 'in-progress', '--apply');
  // Script-owned records changed meanwhile (costs) stay out of the status commit.
  mkdirSync(join(root, SPEC, '_log'), { recursive: true });
  writeFileSync(join(root, SPEC, '_log/costs.yml'), 'entries: []\n');
  await run(root, 'commit-spec', 'MDO-0001', 'implement');
  expect(lastJson()).toMatchObject({ committed: true, header: '📝 docs(mandao): start the MDO-0001 implementation' });
  expect(git(root, 'show', '--name-only', '--format=', 'HEAD')).toBe(`${SPEC}/story.md`);
  expect(git(root, 'log', '-1', '--format=%b')).toContain('Refs: MDO-0001');
  expect(git(root, 'status', '--porcelain')).toContain(`${SPEC}/_log/`);

  const result = commitPending(passedTask(root));
  expect(result.error).toBeUndefined();
  expect(result.committed.map((c) => c.task)).toEqual(['T2']);
});

test('a status edited by hand (beta.1) is refused with the command that commits it on its own', async () => {
  const root = repo();
  const story = join(root, SPEC, 'story.md');
  writeFileSync(story, readFileSync(story, 'utf8').replace('status: approved', 'status: in-progress'));
  const result = commitPending(passedTask(root));
  expect(result.error).toContain('story.md');
  expect(result.error).toContain('mandao run commit-spec MDO-0001 implement');

  await run(root, 'commit-spec', 'MDO-0001', 'implement');
  expect(commitPending(passedTask(root)).error).toBeUndefined();
});

test('implement sets the status through the scripts, never by hand', () => {
  const text = readFileSync(join(import.meta.dirname, '../../core/commands/implement.md'), 'utf8');
  expect(text).toContain('{{script:status}} {{arg:spec}} in-progress --apply');
  expect(text).toContain('{{script:commit-spec}} {{arg:spec}} implement');
  expect(text).not.toMatch(/set\s+`status: in-progress`/);
});

test('commit-spec implement refuses a story edited beyond its status, or set to anything but in-progress (review F1, F3)', async () => {
  const root = repo();
  const story = join(root, SPEC, 'story.md');
  const original = readFileSync(story, 'utf8');
  writeFileSync(story, `${original.replace('status: approved', 'status: in-progress')}\nA new paragraph.\n`);
  await expect(run(root, 'commit-spec', 'MDO-0001', 'implement')).rejects.toThrow(/changed beyond a status set to in-progress/);
  writeFileSync(story, original.replace('status: approved', 'status: closed'));
  await expect(run(root, 'commit-spec', 'MDO-0001', 'implement')).rejects.toThrow(/changed beyond a status set to in-progress/);
  expect(git(root, 'log', '-1', '--format=%s')).toBe('base');
  writeFileSync(story, original);
  // The templates' trailing comment on the status line is kept: still a status-only change.
  writeFileSync(story, original.replace('status: approved', 'status: approved   # draft | approved | in-progress'));
  git(root, 'commit', '-qam', 'comment');
  await run(root, 'status', 'MDO-0001', 'in-progress', '--apply');
  expect(readFileSync(story, 'utf8')).toContain('status: in-progress   # draft | approved | in-progress');
  await run(root, 'commit-spec', 'MDO-0001', 'implement');
  expect(lastJson()).toMatchObject({ committed: true });
});

test('run status keeps its JSON without --apply, and --apply never claims a write it could not make (review F2, F4)', async () => {
  const root = repo();
  await run(root, 'status', 'MDO-0001', 'in-progress');
  expect(lastJson()).toEqual({ from: 'approved', to: 'in-progress', allowed: true, problems: [] });
  expect(status(root)).toBe('approved');

  const story = join(root, SPEC, 'story.md');
  writeFileSync(story, readFileSync(story, 'utf8').replace(/\n/g, '\r\n'));
  // A CRLF story is refused when the spec is read, before any write (review F6); the guard in applyStatus stays.
  await expect(run(root, 'status', 'MDO-0001', 'in-progress', '--apply')).rejects.toThrow();
  expect(readFileSync(story, 'utf8')).not.toMatch(/status: in-progress/);
});

test('--apply to the status a spec already has writes nothing and is not an error (review F7)', async () => {
  const root = repo();
  await run(root, 'status', 'MDO-0001', 'in-progress', '--apply');
  await run(root, 'status', 'MDO-0001', 'abandoned', '--apply');
  await run(root, 'status', 'MDO-0001', 'abandoned', '--apply');
  expect(lastJson()).toMatchObject({ from: 'abandoned', to: 'abandoned', allowed: true, applied: false, problems: [] });
  expect(process.exitCode).toBeUndefined();
});
