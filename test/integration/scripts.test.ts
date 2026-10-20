import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test, vi } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { configSchema } from '../../src/schemas/index.js';
import { appendExecutionRow, markTask, writeProgress } from '../../src/scripts/checkpoint.js';
import { runTests } from '../../src/scripts/run-tests.js';
import { checkTransition, nextLocalId, proposeSpec, readSpec, whereAmI } from '../../src/scripts/spec.js';
import { parseExecution } from '../../src/spec/index.js';
import { releaseLock, tryLock } from '../../src/writer/lock.js';
import { makeTree } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const config = configSchema.parse({
  schema_version: 1,
  workspace: 'single',
  projects: [{ name: 'mandao', path: '.' }],
  harnesses: ['claude'],
});
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

function repoWithSpec() {
  const root = realpathSync(makeTree({ 'README.md': 'x' }));
  git(root, 'init', '-q', '-b', 'main');
  git(root, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'init', '--allow-empty');
  cpSync(fixture, join(root, 'specs/MDO-0001-skills-list'), { recursive: true });
  return root;
}

describe('spec proposal and status', () => {
  test('next local id looks at specs, worktrees and branches', () => {
    const root = repoWithSpec();
    expect(nextLocalId(root, config)).toBe('MDO-0002');
    git(root, 'branch', 'feat/MDO-0007-other');
    expect(proposeSpec(root, config, 'Ñandú export: CSV!')).toMatchObject({
      id: 'MDO-0008',
      slug: 'nandu-export-csv',
      branch: 'feat/MDO-0008-nandu-export-csv',
    });
  });

  test('worktrees go next to the repository, also from inside a worktree', () => {
    const root = repoWithSpec();
    const p = proposeSpec(root, config, 'fix login', { type: 'bug', id: 'PROJ-12' });
    expect(p.branch).toBe('fix/PROJ-12-fix-login');
    expect(p.worktree).toBe(join(root, '..', `${root.split('/').pop()}.worktrees`, 'PROJ-12-fix-login'));
    git(root, 'worktree', 'add', '-q', '-b', p.branch, p.worktree);
    expect(whereAmI(p.worktree, { branch: p.branch, worktree: p.worktree }).inWorktree).toBe(true);
    expect(proposeSpec(p.worktree, config, 'fix login', { type: 'bug', id: 'PROJ-12' }).worktree).toBe(p.worktree);
    const away = whereAmI(root, { branch: p.branch, worktree: p.worktree });
    expect(away).toMatchObject({ inWorktree: false, message: `not in the spec worktree: open ${p.worktree} (branch ${p.branch})` });
  });

  test('status transitions and the CI gate for deferred runs', () => {
    expect(checkTransition('draft', 'approved', undefined, false)).toEqual([]);
    expect(checkTransition('draft', 'verified', undefined, false)[0]).toMatch(/draft → verified is not allowed/);
    const progress = {
      schema_version: 1 as const,
      spec: 's',
      updated_at: 'now',
      current: null,
      open_questions: [],
      next_step: '',
      deferred_to_ci: [{ task: 'T2', tests: ['e2e'], reason: 'low memory' }],
      pending_commits: [],
    };
    expect(checkTransition('in-progress', 'verified', progress, false)[0]).toMatch(/deferred to CI \(T2\)/);
    expect(checkTransition('in-progress', 'verified', progress, true)).toEqual([]);
    expect(checkTransition('closed', 'abandoned', undefined, false)[0]).toMatch(/not allowed/);
  });
});

describe('checkpoints', () => {
  test('append rows, write progress and tick tasks without touching the rest', () => {
    const root = repoWithSpec();
    const dir = join(root, 'specs/MDO-0001-skills-list');
    const before = readFileSync(join(dir, 'tasks.md'), 'utf8');
    appendExecutionRow(dir, 'MDO-0001-skills-list', {
      date: '2026-10-20',
      task: 'T2',
      attempt: 1,
      tier: 'standard',
      harness: 'codex',
      implementer: 'gpt-6.1-sol',
      reviewer: '—',
      verdict: 'REPORTED',
      notes: '',
    });
    expect(parseExecution(readFileSync(join(dir, 'execution.md'), 'utf8')).rows.map((r) => r.verdict)).toEqual([
      'PASS',
      'STARTED',
      'REPORTED',
    ]);
    markTask(dir, 'T2', true);
    expect(readFileSync(join(dir, 'tasks.md'), 'utf8')).toBe(before.replace('### [ ] T2', '### [x] T2'));
    writeProgress(dir, {
      schema_version: 1,
      spec: 'MDO-0001-skills-list',
      updated_at: 'now',
      current: { task: 'T3', phase: 'rework-2', harness: 'codex', model: 'm' },
      open_questions: [],
      next_step: 'review',
      deferred_to_ci: [],
    });
    expect(parseYaml(readFileSync(join(dir, 'progress.yml'), 'utf8')).current.phase).toBe('rework-2');
    expect(() =>
      writeProgress(dir, {
        schema_version: 1,
        spec: 's',
        updated_at: 'now',
        current: { task: 'T3', phase: 'thinking', harness: 'x', model: 'm' },
        open_questions: [],
        next_step: '',
        deferred_to_ci: [],
      }),
    ).toThrow();
  });

  test('readSpec gathers documents and their issues', () => {
    const root = repoWithSpec();
    const spec = readSpec(join(root, 'specs/MDO-0001-skills-list'));
    expect(spec.issues).toEqual([]);
    expect([spec.story?.meta.id, spec.tasks.length, spec.execution.length, spec.progress?.current?.task]).toEqual(['MDO-0001', 2, 2, 'T2']);
  });
});

describe('test runs', () => {
  const budget = { decision: 'run' as const, workers: 2, priority: 'normal' as const, timeoutS: 30, reason: 'ok' };

  test('PASS, FAIL and deferred runs; deferred never runs', async () => {
    const root = makeTree({});
    expect((await runTests(root, 't', 'node -e "process.exit(0)"', budget)).status).toBe('PASS');
    expect(await runTests(root, 't', 'node -e "process.exit(3)"', budget)).toMatchObject({ status: 'FAIL', exitCode: 3 });
    expect((await runTests(root, 't', 'node -e "process.exit(0)"', { ...budget, decision: 'defer', workers: 0 })).status).toBe(
      'DEFERRED_TO_CI',
    );
  });

  test("the runner's output streams to stderr live, never into the JSON on stdout", async () => {
    const out = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const seen: number[] = [];
    const err = vi.spyOn(process.stderr, 'write').mockImplementation(() => {
      seen.push(Date.now());
      return true;
    });
    try {
      const cmd = 'node -e "console.log(42); setTimeout(() => {}, 400)"';
      const run = await runTests(makeTree({}), 't', cmd, budget);
      const finished = Date.now();
      expect(run.status).toBe('PASS');
      expect(out).not.toHaveBeenCalled();
      expect(String(err.mock.calls[0]?.[0])).toBe('42\n');
      // Written while the runner was still going, not buffered until it exited.
      expect(finished - seen[0]!).toBeGreaterThanOrEqual(250);
    } finally {
      out.mockRestore();
      err.mockRestore();
    }
  });

  test('a run over its time budget is killed and reported as TIMEOUT', async () => {
    const run = await runTests(makeTree({}), 't', 'node -e "setTimeout(() => {}, 5000)"', { ...budget, timeoutS: 0.3 });
    expect(run.status).toBe('TIMEOUT');
  });

  test('one heavy run at a time: a live holder keeps others queued', async () => {
    const root = makeTree({});
    const lock = join(root, '.mandao/run.lock');
    expect(tryLock(lock, 'first')).toBe(true);
    expect(tryLock(lock, 'second')).toBe(false);
    expect(await runTests(root, 'second', 'node -e "0"', budget, 50)).toMatchObject({
      status: 'QUEUE_TIMEOUT',
      reason: 'still queued behind first',
    });
    releaseLock(lock);
    writeFileSync(lock, JSON.stringify({ pid: 999999, label: 'crashed', since: 'x' }));
    expect(tryLock(lock, 'third')).toBe(true);
  });
});
