import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { configSchema } from '../../src/schemas/index.js';
import { appendExecutionRow, writeProgress } from '../../src/scripts/checkpoint.js';
import { changeManifest, commitPending } from '../../src/scripts/commits.js';
import { readSpec } from '../../src/scripts/spec.js';
import { commitMessage, type ExecutionRow } from '../../src/spec/index.js';
import { initTestRepo, makeTree } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const config = configSchema.parse({
  schema_version: 1,
  workspace: 'single',
  projects: [{ name: 'mandao', path: '.' }],
  harnesses: ['claude'],
});
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const SPEC = 'specs/MDO-0001-skills-list';

beforeEach(() => {
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
  for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
});
afterEach(() => vi.unstubAllEnvs());

/** A repo on branch `feat` with the sample spec committed (T1 PASS in the log, T2 started). */
function repo() {
  const root = realpathSync(makeTree({ 'README.md': 'x\n' }));
  initTestRepo(root, '-q', '-b', 'main');
  git(root, 'commit', '-qm', 'init', '--allow-empty');
  git(root, 'checkout', '-qb', 'feat');
  cpSync(fixture, join(root, SPEC), { recursive: true });
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'spec');
  return root;
}

const pass = (task: string): ExecutionRow => ({
  date: '2026-10-20',
  task,
  attempt: 1,
  tier: 'standard',
  harness: 'claude',
  implementer: 'claude-sonnet-5-5',
  reviewer: 'claude-opus-5-5',
  verdict: 'PASS',
  notes: '',
});

/** Two pending tasks whose approved manifests both touch src/b.ts, so the script refuses to split them. */
function overlapping(root: string) {
  const dir = join(root, SPEC);
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(join(root, 'src/b.ts'), 'export const b = 1;\n');
  const spec = readSpec(dir);
  const manifest = changeManifest(root, dir);
  const entry = (task: string) => ({ task, subject: `change ${task}`, files: ['src/b.ts'], manifest });
  writeProgress(dir, { ...spec.progress!, pending_commits: [entry('T2'), entry('T1')] });
}

const pending = (root: string) => {
  const spec = readSpec(join(root, SPEC));
  return { repo: root, specDir: spec.dir, config, story: spec.story!, tasks: spec.tasks, progress: spec.progress! };
};

describe('out-of-scope commit brake (Phase 11)', () => {
  type Scope = { reviewed: string[]; receipts?: { path: string; origin: string }[] };
  /** Queues T2 with the whole tree as its approved manifest; `scope` is what the Reviewer was shown. */
  function queue(root: string, files: Record<string, string>, scope: Scope | undefined, task = 'T2') {
    const dir = join(root, SPEC);
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), content);
    }
    appendExecutionRow(dir, 'MDO-0001-skills-list', pass(task));
    const spec = readSpec(dir);
    const manifest = changeManifest(root, dir);
    const entry = { task, subject: 'register the skills list command', files: manifest.map((m) => m.path), manifest };
    const scoped = scope ? { reviewed: scope.reviewed, receipts: scope.receipts ?? [] } : {};
    writeProgress(dir, { ...spec.progress!, pending_commits: [{ ...entry, ...scoped }] });
  }
  const agent = { path: '.claude/agents/x.md', origin: 'persona:implementer:standard' };

  test('a regenerated harness file whose origin did not change in the task, and the lock, stop the commit', () => {
    const root = repo();
    queue(
      root,
      { 'src/cli/skills.ts': 'export const a = 1;\n', '.claude/agents/x.md': 'generated\n', '.mandao/mandao.lock': 'lock\n' },
      { reviewed: ['src/cli/skills.ts'], receipts: [agent] },
    );
    const run = commitPending(pending(root));
    expect(run.committed).toEqual([]);
    expect(run.pending).toEqual(['T2']);
    expect(run.outOfScope).toEqual({ T2: ['.claude/agents/x.md', '.mandao/mandao.lock'] });
    expect(run.error).toMatch(
      /declare them in the task's files, commit them separately outside the task.*commit the source change they come from/,
    );
    expect(git(root, 'log', '-1', '--format=%s')).toBe('spec');
  });

  test('a generated file whose origin source is in the reviewed diff rides with the lock', () => {
    const root = repo();
    queue(
      root,
      {
        'core/personas/implementer.md': 'changed persona\n',
        '.claude/agents/x.md': 'generated\n',
        '.mandao/mandao.lock': 'lock\n',
      },
      { reviewed: ['core/personas/implementer.md'], receipts: [agent] },
    );
    expect(commitPending(pending(root))).toMatchObject({ committed: [{ task: 'T2' }], pending: [] });
  });

  test('a generated file is out of scope when its origin source is neither declared nor reviewed; the lock alone is out of scope', () => {
    const root = repo();
    queue(
      root,
      { 'core/commands/x.md': 'c\n', '.claude/commands/x.md': 'g\n' },
      { reviewed: [], receipts: [{ path: '.claude/commands/x.md', origin: 'command:x' }] },
    );
    expect(commitPending(pending(root)).outOfScope).toEqual({ T2: ['.claude/commands/x.md', 'core/commands/x.md'] });
    const lone = repo();
    queue(lone, { 'src/cli/skills.ts': 'a\n', '.mandao/mandao.lock': 'lock\n' }, { reviewed: ['src/cli/skills.ts'] });
    expect(commitPending(pending(lone)).outOfScope).toEqual({ T2: ['.mandao/mandao.lock'] });
  });

  test('a file outside the declared list that was in the reviewed diff is committed', () => {
    const root = repo();
    queue(
      root,
      { 'src/cli/skills.ts': 'export const a = 1;\n', 'src/other.ts': 'export const o = 1;\n' },
      { reviewed: ['src/cli/skills.ts', 'src/other.ts'] },
    );
    expect(commitPending(pending(root))).toMatchObject({ committed: [{ task: 'T2' }], pending: [] });
  });

  test('a file under a declared folder is in scope', () => {
    const root = repo();
    const dir = join(root, SPEC);
    writeFileSync(
      join(dir, 'tasks.md'),
      readFileSync(join(dir, 'tasks.md'), 'utf8').replaceAll('src/cli/skills.ts]', 'src/cli/skills.ts, src/lib/]'),
    );
    git(root, 'commit', '-qam', 'declare folder');
    queue(root, { 'src/lib/deep/a.ts': 'a\n' }, { reviewed: [] });
    const r = commitPending(pending(root));
    expect(r.error).toBeUndefined();
    expect(r.committed).toHaveLength(1);
  });

  test('an entry queued before the brake (no scope anywhere) is not stopped', () => {
    const root = repo();
    queue(root, { 'src/other.ts': 'export const o = 1;\n' }, undefined);
    expect(commitPending(pending(root)).committed).toHaveLength(1);
  });

  test('an entry whose reviewed list was removed by hand, while its approval recorded one, is out of scope', () => {
    const root = repo();
    queue(root, { 'src/other.ts': 'export const o = 1;\n' }, undefined);
    const dir = join(root, SPEC);
    const progress = readSpec(dir).progress!;
    writeProgress(dir, {
      ...progress,
      approved_manifests: [{ task: 'T2', attempt: 1, files: progress.pending_commits[0]!.manifest!, reviewed: ['src/other.ts'] }],
    });
    expect(commitPending(pending(root)).outOfScope).toEqual({ T2: ['src/other.ts'] });
  });

  test('overlapping tasks with an out-of-scope file report the file, not a hand-commit hint', () => {
    const root = repo();
    overlapping(root);
    writeFileSync(join(root, '.claude-generated.md'), 'g\n');
    const dir = join(root, SPEC);
    const progress = readSpec(dir).progress!;
    const manifest = changeManifest(root, dir);
    const entry = (task: string) => ({
      task,
      subject: `change ${task}`,
      files: manifest.map((m) => m.path),
      manifest,
      reviewed: ['src/b.ts'],
      receipts: [],
    });
    writeProgress(dir, { ...progress, pending_commits: [entry('T2'), entry('T1')] });
    const run = commitPending(pending(root));
    expect(run.outOfScope).toMatchObject({ T2: ['.claude-generated.md'] });
    expect(run.error).not.toMatch(/commit each by hand/);
  });

  test('reconcile does not accept a hand commit that carried out-of-scope files', () => {
    const root = repo();
    queue(
      root,
      { 'src/cli/skills.ts': 'a\n', '.claude/agents/x.md': 'generated\n' },
      { reviewed: ['src/cli/skills.ts'], receipts: [agent] },
    );
    const spec = readSpec(join(root, SPEC));
    const msg = commitMessage(config, spec.story!, spec.tasks.find((t) => t.id === 'T2')!, 'by hand', false, ['src/cli/skills.ts']);
    git(root, 'add', '--', 'src', '.claude');
    git(root, 'commit', '-qm', msg.text.trimEnd());
    const run = commitPending(pending(root));
    expect(run.alreadyCommitted).toBeUndefined();
    expect(run.outOfScope).toEqual({ T2: ['.claude/agents/x.md'] });
    expect(readSpec(join(root, SPEC)).progress!.pending_commits.map((p) => p.task)).toEqual(['T2']);
  });

  test('a root-less glob in the declared files does not turn the brake off', () => {
    const root = repo();
    const dir = join(root, SPEC);
    writeFileSync(
      join(dir, 'tasks.md'),
      readFileSync(join(dir, 'tasks.md'), 'utf8').replaceAll('src/cli/skills.ts]', `src/cli/skills.ts, '**/*.ts']`),
    );
    git(root, 'commit', '-qam', 'declare glob');
    queue(root, { 'src/x/a.ts': 'a\n', '.mandao/mandao.lock': 'lock\n' }, { reviewed: [] });
    expect(commitPending(pending(root)).outOfScope).toEqual({ T2: ['.mandao/mandao.lock'] });
  });

  test('a hand commit with out-of-scope files stops only its entry; the clean pending task is committed', () => {
    const root = repo();
    const dir = join(root, SPEC);
    mkdirSync(join(root, 'src/cli'), { recursive: true });
    writeFileSync(join(root, 'src/cli/skills.ts'), 'a\n');
    writeFileSync(join(root, '.claude-gen.md'), 'g\n');
    git(root, 'add', 'src', '.claude-gen.md');
    const spec = readSpec(dir);
    git(
      root,
      'commit',
      '-qm',
      commitMessage(config, spec.story!, spec.tasks.find((t) => t.id === 'T1')!, 'by hand', false, ['src/cli/skills.ts']).text.trimEnd(),
    );
    const manifestT1 = [
      ...['.claude-gen.md', 'src/cli/skills.ts'].map((path) => ({
        path,
        status: '??',
        sha256: createHash('sha256')
          .update(readFileSync(join(root, path)))
          .digest('hex'),
      })),
    ];
    writeFileSync(join(root, 'src/cli/extensions.ts'), 'e\n');
    const manifestT2 = changeManifest(root, dir);
    writeProgress(dir, {
      ...readSpec(dir).progress!,
      pending_commits: [
        {
          task: 'T1',
          subject: 'by hand',
          files: manifestT1.map((m) => m.path),
          manifest: manifestT1,
          reviewed: ['src/cli/skills.ts'],
          receipts: [],
        },
        {
          task: 'T2',
          subject: 'clean',
          files: manifestT2.map((m) => m.path),
          manifest: manifestT2,
          reviewed: ['src/cli/extensions.ts'],
          receipts: [],
        },
      ],
    });
    const run = commitPending(pending(root));
    expect(run.committed).toMatchObject([{ task: 'T2' }]);
    expect(run.outOfScope).toEqual({ T1: ['.claude-gen.md'] });
    expect(run.pending).toEqual(['T1']);
    expect(run.error).toMatch(/already in the hand commit.*amend or revert.*declare the files in tasks.md/);
    expect(readSpec(dir).progress!.pending_commits.map((p) => p.task)).toEqual(['T1']);
  });
});
