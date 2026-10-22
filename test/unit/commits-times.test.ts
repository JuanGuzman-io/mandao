import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { configSchema } from '../../src/schemas/index.js';
import { taskCommitTimes } from '../../src/scripts/commits.js';
import { initTestRepo, makeTree } from '../helpers.js';

const config = configSchema.parse({
  schema_version: 1,
  workspace: 'single',
  projects: [{ name: 'mandao', path: '.' }],
  harnesses: ['claude'],
});
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

beforeEach(() => {
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
  for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
});
afterEach(() => vi.unstubAllEnvs());

/** An empty commit authored at `date` with the given trailers. */
function commitAt(root: string, date: string, subject: string, trailers: string[]) {
  vi.stubEnv('GIT_AUTHOR_DATE', date);
  git(root, 'commit', '-q', '--allow-empty', '-m', [subject, '', ...trailers].join('\n'));
}

describe('task commit times from trailers (MDO-0008 D2)', () => {
  test('each task of the spec gets the author times of its commits, in ms; other specs are left out', () => {
    const root = realpathSync(makeTree({ 'README.md': 'x\n' }));
    initTestRepo(root, '-q', '-b', 'main');
    const t1a = '2026-01-05T10:01:00Z';
    const t1b = '2026-01-05T10:03:00Z';
    const t2 = '2026-01-05T10:05:00Z';
    commitAt(root, t1a, 'first T1', ['Refs: MDO-0042', 'Mandao-Task: T1']);
    commitAt(root, t1b, 'second T1', ['Refs: MDO-0042', 'Mandao-Task: T1']);
    commitAt(root, t2, 'T2', ['Refs: MDO-0042', 'Mandao-Task: T2']);
    commitAt(root, '2026-01-05T10:07:00Z', 'another spec', ['Refs: MDO-0099', 'Mandao-Task: T3']);

    const times = taskCommitTimes(root, 'MDO-0042', config.commits.trailers);
    expect([...times.keys()].sort()).toEqual(['T1', 'T2']);
    expect([...times.get('T1')!].sort((a, b) => a - b)).toEqual([Date.parse(t1a), Date.parse(t1b)]);
    expect(times.get('T2')).toEqual([Date.parse(t2)]);
  });

  test('a folder that is not a repository has no times', () => {
    const root = realpathSync(makeTree({ 'README.md': 'x\n' }));
    expect(taskCommitTimes(root, 'MDO-0042', config.commits.trailers).size).toBe(0);
  });
});
