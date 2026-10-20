import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Progress } from '../spec/index.js';

/** Content hash of a test file as recorded when it was red; `missing` when it no longer exists. */
export function fileHash(repo: string, path: string): string {
  const file = join(repo, path);
  return existsSync(file) ? createHash('sha256').update(readFileSync(file)).digest('hex') : 'missing';
}

/** Red tests of a task that changed since they were recorded red (ADR 0022). */
export function changedRedTests(repo: string, progress: Progress | undefined, task: string): string[] {
  const entry = progress?.red_tests.find((r) => r.task === task);
  return entry ? entry.files.filter((f) => fileHash(repo, f.path) !== f.sha256).map((f) => f.path) : [];
}

export interface RedCheck {
  red: boolean;
  /** Why the run does not count as red evidence. */
  problem?: string;
}

/** Red means the runner ran and the tests failed: a pass, a timeout or a deferred run is not red. */
export function redCheck(status: string, exitCode: number | undefined): RedCheck {
  if (status === 'FAIL') return { red: true };
  if (status === 'PASS') return { red: false, problem: 'the tests pass before any implementation: they do not prove the scenario' };
  return { red: false, problem: `the tests did not run to a verdict (${status}${exitCode !== undefined ? `, exit ${exitCode}` : ''})` };
}
