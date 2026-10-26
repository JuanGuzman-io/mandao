import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, cpSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { nextFor } from '../../src/cli/approve.js';
import { configSchema } from '../../src/schemas/index.js';
import { appendExecutionRow, writeProgress } from '../../src/scripts/checkpoint.js';
import { changedFiles, changeManifest, commitPending, commitState, reconciledTasks, taskCommits } from '../../src/scripts/commits.js';
import { readSpec } from '../../src/scripts/spec.js';
import { commitFindings, commitMessage, type ExecutionRow } from '../../src/spec/index.js';
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

/** Simulates a Leader PASS whose commit was blocked: code changed, PASS row written, commit queued. */
function passPending(root: string, task: string, file: string, subject: string) {
  const dir = join(root, SPEC);
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(join(root, file), `export const ${task.toLowerCase()} = 1;\n`);
  appendExecutionRow(dir, 'MDO-0001-skills-list', pass(task));
  const spec = readSpec(dir);
  const queued = new Set(spec.progress!.pending_commits.flatMap((p) => p.files));
  const files = changedFiles(root, dir).filter((f) => !queued.has(f));
  const manifest = changeManifest(root, dir);
  writeProgress(dir, { ...spec.progress!, pending_commits: [...spec.progress!.pending_commits, { task, subject, files, manifest }] });
}

const OVERLAP =
  'src/b.ts is changed by both T2 and T1: commit each by hand (`mandao run commit-msg <spec> <task> <subject>` gives the message), then run `mandao run commit <spec>` again to record them';

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

/** What a person does after the overlap error: commit with the trailers `run commit-msg` produces. */
function commitByHand(root: string, task: string, file = 'src/b.ts') {
  const spec = readSpec(join(root, SPEC));
  const t = spec.tasks.find((x) => x.id === task)!;
  const msg = commitMessage(config, spec.story!, t, `change ${task}`, false, [file]);
  git(root, 'add', '--', file);
  git(root, 'commit', '-qm', msg.text.trimEnd(), '--allow-empty');
}

const pending = (root: string) => {
  const spec = readSpec(join(root, SPEC));
  return { repo: root, specDir: spec.dir, config, story: spec.story!, tasks: spec.tasks, progress: spec.progress! };
};

describe('commits found by trailers (ADR 0021)', () => {
  test('a passed task without a commit is reported; a pending one says how to commit it', () => {
    const root = repo();
    const state = commitState(readSpec(join(root, SPEC)), config.commits.trailers);
    expect(state).toMatchObject({ passed: ['T1'], pending: [] });
    expect(commitFindings(state)).toEqual([
      { type: 'UNCOMMITTED', ref: 'T1', message: 'T1 passed review but no commit carries its Mandao-Task trailer' },
    ]);
  });

  test('mandao run commit: one commit per task with trailers, the PASS row inside it, nothing left behind', () => {
    const root = repo();
    passPending(root, 'T2', 'src/b.ts', 'register the skills list command');
    expect(commitFindings(commitState(readSpec(join(root, SPEC)), config.commits.trailers)).map((f) => f.message)).toContain(
      'T2 passed review and its commit is pending: run `mandao run commit <spec>`',
    );
    const run = commitPending({ ...pending(root), trailers: ['Co-Authored-By: Test <t@example.com>'] });
    expect(run).toMatchObject({ committed: [{ task: 'T2' }], pending: [] });
    expect(git(root, 'status', '--porcelain')).toBe('');
    expect(git(root, 'log', '-1', '--format=%B')).toBe(
      '✨ feat(cli): register the skills list command\n\nRefs: MDO-0001\nMandao-Task: T2\nMandao-AC: AC-2, AC-2/C1\nCo-Authored-By: Test <t@example.com>',
    );
    const files = git(root, 'show', '--name-only', '--format=', 'HEAD').split('\n');
    expect(files).toEqual(expect.arrayContaining(['src/b.ts', `${SPEC}/execution.md`, `${SPEC}/progress.yml`]));
    expect(readSpec(join(root, SPEC)).progress!.pending_commits).toEqual([]);
  });

  test('a rebase rewrites the hashes and trace stays clean', () => {
    const root = repo();
    passPending(root, 'T2', 'src/b.ts', 'register the skills list command');
    commitPending(pending(root));
    const before = taskCommits(root, 'MDO-0001', config.commits.trailers).get('T2');
    git(root, 'checkout', '-q', 'main');
    writeFileSync(join(root, 'other.txt'), 'main moved on\n');
    git(root, 'add', '.');
    git(root, 'commit', '-qm', 'main moved on');
    git(root, 'checkout', '-q', 'feat');
    git(root, 'rebase', '-q', 'main');
    const after = taskCommits(root, 'MDO-0001', config.commits.trailers).get('T2');
    expect(after).toHaveLength(1);
    expect(after).not.toEqual(before);
    const state = commitState(readSpec(join(root, SPEC)), config.commits.trailers);
    expect(commitFindings(state).filter((f) => f.ref === 'T2')).toEqual([]);
  });

  test('a failed commit keeps the task pending; overlapping files are refused', () => {
    const root = repo();
    passPending(root, 'T2', 'src/b.ts', 'register the skills list command');
    const hook = join(root, '.git/hooks/pre-commit');
    writeFileSync(hook, '#!/bin/sh\necho blocked >&2\nexit 1\n');
    chmodSync(hook, 0o755);
    expect(commitPending(pending(root))).toMatchObject({
      committed: [],
      pending: ['T2'],
      error: expect.stringMatching(/T2: git commit failed: blocked/),
    });
    expect(readSpec(join(root, SPEC)).progress!.pending_commits.map((p) => p.task)).toEqual(['T2']);

    const spec = readSpec(join(root, SPEC));
    const twice = {
      ...spec.progress!,
      pending_commits: [...spec.progress!.pending_commits, { task: 'T1', subject: 'x', files: ['src/b.ts'] }],
    };
    expect(commitPending({ ...pending(root), progress: twice }).error).toBe(OVERLAP);
  });

  test('refuses legacy pending commits without a Reviewer-approved manifest', () => {
    const root = repo();
    passPending(root, 'T2', 'src/b.ts', 'register the skills list command');
    const spec = readSpec(join(root, SPEC));
    writeProgress(join(root, SPEC), {
      ...spec.progress!,
      pending_commits: [{ task: 'T2', subject: 'register the skills list command', files: ['src/b.ts'] }],
    });
    expect(commitPending(pending(root)).error).toMatch(/no Reviewer-approved change manifest/);
  });

  test('refuses any changed file that was not in the approved manifest', () => {
    const root = repo();
    passPending(root, 'T2', 'src/b.ts', 'register the skills list command');
    writeFileSync(join(root, 'unreviewed.txt'), 'extra change\n');
    expect(commitPending(pending(root)).error).toMatch(/working tree differs from the Reviewer-approved manifest: unreviewed.txt/);
  });

  test('refuses a file whose contents changed after the Reviewer passed', () => {
    const root = repo();
    passPending(root, 'T2', 'src/b.ts', 'register the skills list command');
    writeFileSync(join(root, 'src/b.ts'), 'export const changedAfterPass = true;\n');
    expect(commitPending(pending(root)).error).toMatch(/working tree differs from the Reviewer-approved manifest: src\/b.ts/);
  });

  test('refuses unreviewed spec documents that would otherwise be staged with the ledger', () => {
    const root = repo();
    passPending(root, 'T2', 'src/b.ts', 'register the skills list command');
    writeFileSync(join(root, SPEC, 'design-note.md'), 'human-authored change\n');
    expect(commitPending(pending(root)).error).toMatch(/unreviewed spec files would enter the task commit: design-note.md/);
  });

  test('the [x] that checkpoint --done writes in tasks.md rides with the task commit (MDO-0001)', () => {
    const root = repo();
    passPending(root, 'T2', 'src/b.ts', 'register the skills list command');
    const tasks = join(root, SPEC, 'tasks.md');
    writeFileSync(tasks, readFileSync(tasks, 'utf8').replace('### [ ] T2', '### [x] T2'));
    const run = commitPending(pending(root));
    expect(run.error).toBeUndefined();
    expect(git(root, 'show', '--name-only', '--format=', 'HEAD')).toContain(`${SPEC}/tasks.md`);
    expect(git(root, 'status', '--porcelain')).toBe('');
  });

  test('any other tasks.md edit still needs review', () => {
    const root = repo();
    passPending(root, 'T2', 'src/b.ts', 'register the skills list command');
    const tasks = join(root, SPEC, 'tasks.md');
    writeFileSync(tasks, readFileSync(tasks, 'utf8').replace('### [ ] T2', '### [x] T2').replace('Register', 'Add'));
    expect(commitPending(pending(root)).error).toMatch(/unreviewed spec files would enter the task commit: tasks.md/);
  });

  test('tasks committed by hand after the overlap error are reconciled, not refused again', () => {
    const root = repo();
    overlapping(root);
    expect(commitPending(pending(root)).error).toBe(OVERLAP);
    commitByHand(root, 'T2');
    commitByHand(root, 'T1');
    const queued = readSpec(join(root, SPEC)).progress!.pending_commits;
    expect([...reconciledTasks(root, 'MDO-0001', config.commits.trailers, queued)]).toEqual(['T2', 'T1']);
    const run = commitPending(pending(root));
    expect(run).toEqual({ committed: [], pending: [], alreadyCommitted: ['T2', 'T1'] });
    expect(readSpec(join(root, SPEC)).progress!.pending_commits).toEqual([]);
    const next = nextFor(root, readSpec(join(root, SPEC)), config);
    expect(next.recommended.command).not.toMatch(/run commit/);
  });

  test('a task committed with its approved content stays reconciled after the next task edits its file', () => {
    const root = repo();
    passPending(root, 'T2', 'src/b.ts', 'register the skills list command');
    commitByHand(root, 'T2');
    writeFileSync(join(root, 'src/b.ts'), 'export const t3 = 3;\n');
    const queued = readSpec(join(root, SPEC)).progress!.pending_commits;
    expect([...reconciledTasks(root, 'MDO-0001', config.commits.trailers, queued)]).toEqual(['T2']);
  });

  test('a task committed after it was queued closes its stale entry and reports what differs (MDO-0001 T1)', () => {
    const root = repo();
    passPending(root, 'T2', 'src/b.ts', 'register the skills list command');
    const dir = join(root, SPEC);
    const spec = readSpec(dir);
    const [entry] = spec.progress!.pending_commits;
    writeProgress(dir, { ...spec.progress!, pending_commits: [{ ...entry!, queued_at: '2026-01-01T00:00:00.000Z' }] });
    // A gate added mid-task changed the file after the manifest was taken; the task was then committed.
    writeFileSync(join(root, 'src/b.ts'), 'export const t2 = 1; // gate fix\n');
    commitByHand(root, 'T2');
    const run = commitPending(pending(root));
    expect(run).toMatchObject({ committed: [], pending: [], alreadyCommitted: ['T2'], differs: { T2: ['src/b.ts'] } });
    expect(readSpec(dir).progress!.pending_commits).toEqual([]);
  });

  test('one task committed by hand and one not: the script commits only the second', () => {
    const root = repo();
    passPending(root, 'T2', 'src/b.ts', 'register the skills list command');
    const spec = readSpec(join(root, SPEC));
    const content = 'export const a = 1;\n';
    const manifest = [{ path: 'src/a.ts', status: '??', sha256: createHash('sha256').update(content).digest('hex') }];
    const t1 = { task: 'T1', subject: 'change T1', files: ['src/a.ts'], manifest };
    writeProgress(spec.dir, { ...spec.progress!, pending_commits: [t1, ...spec.progress!.pending_commits] });
    writeFileSync(join(root, 'src/a.ts'), content);
    commitByHand(root, 'T1', 'src/a.ts');
    const run = commitPending(pending(root));
    expect(run).toMatchObject({ committed: [{ task: 'T2' }], pending: [], alreadyCommitted: ['T1'] });
    expect(taskCommits(root, 'MDO-0001', config.commits.trailers).get('T2')).toHaveLength(1);
    expect(readSpec(join(root, SPEC)).progress!.pending_commits).toEqual([]);
  });

  test('a task queued again after its commit is committed by the script, not reported as already committed', () => {
    const root = repo();
    passPending(root, 'T2', 'src/b.ts', 'register the skills list command');
    expect(commitPending(pending(root)).committed).toHaveLength(1);
    const dir = join(root, SPEC);
    writeFileSync(join(root, 'src/b.ts'), 'export const t2 = 2;\n');
    const spec = readSpec(dir);
    const manifest = changeManifest(root, dir);
    writeProgress(dir, {
      ...spec.progress!,
      pending_commits: [{ task: 'T2', subject: 'rework the command', files: ['src/b.ts'], manifest }],
    });
    const run = commitPending(pending(root));
    expect(run.alreadyCommitted).toBeUndefined();
    expect(run).toMatchObject({ committed: [{ task: 'T2' }], pending: [] });
    expect(git(root, 'show', 'HEAD:src/b.ts')).toBe('export const t2 = 2;');
  });

  test('a hand commit with the trailers but other content than the approved manifest is not reconciled', () => {
    const root = repo();
    passPending(root, 'T2', 'src/b.ts', 'register the skills list command');
    writeFileSync(join(root, 'src/b.ts'), 'export const sneaky = 1;\n');
    commitByHand(root, 'T2');
    const run = commitPending(pending(root));
    expect(run.alreadyCommitted).toBeUndefined();
    expect(run.error).toMatch(/working tree differs from the Reviewer-approved manifest: src\/b.ts/);
    expect(readSpec(join(root, SPEC)).progress!.pending_commits.map((p) => p.task)).toEqual(['T2']);
  });
});
