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

const NOT_RUN = /command not found|is not recognized as an internal or external command/i;

const PYTEST_EXITS: Record<number, string> = {
  2: 'pytest was interrupted or failed to collect the tests',
  3: 'pytest hit an internal error',
  4: 'pytest reported a usage error',
  5: 'no tests were collected',
};

const JS_NO_TESTS = /No test files found|No tests found/;
const JS_NOT_LOADED = /Failed to load|Test suite failed to run/;

/** Why a failing run is not failing tests: the runner did not run, collected nothing or could not load the files. */
function notTestFailure(exitCode: number | undefined, runner?: string, output = ''): string | undefined {
  if (exitCode === 126 || exitCode === 127 || NOT_RUN.test(output))
    return `the test runner could not run (exit ${exitCode ?? 'unknown'}): install it or use the project's test command`;
  if (runner === 'pytest' && exitCode !== undefined && PYTEST_EXITS[exitCode])
    return `${PYTEST_EXITS[exitCode]} (exit ${exitCode}); a collection error is not a failing test: add a stub so the test runs and fails on its assertion`;
  if (runner === 'vitest' || runner === 'jest') {
    if (JS_NO_TESTS.test(output)) return 'the runner found no test files';
    if (JS_NOT_LOADED.test(output))
      return 'the runner could not load the test file; add a stub so the test runs and fails on its assertion';
  }
  return undefined;
}

/**
 * Red means the runner ran and the tests failed: a pass, a timeout, a deferred run, a missing runner or a
 * collection error is not red (MDO-0001 T17: `pytest: command not found` was recorded as red).
 */
export function redCheck(status: string, exitCode: number | undefined, runner?: string, output?: string): RedCheck {
  if (status === 'FAIL') {
    const problem = notTestFailure(exitCode, runner, output);
    return problem ? { red: false, problem } : { red: true };
  }
  if (status === 'PASS') return { red: false, problem: 'the tests pass before any implementation: they do not prove the scenario' };
  return { red: false, problem: `the tests did not run to a verdict (${status}${exitCode !== undefined ? `, exit ${exitCode}` : ''})` };
}

/** Test names declared in a file: `test('…')` / `it('…')` (JS, TS), `def test_…` (Python), `func Test…` (Go). */
export function testNames(text: string): string[] {
  const names = [
    ...[...text.matchAll(/\b(?:test|it)(?:\.(?:only|concurrent|each\([^)]*\)))?\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2]!),
    ...[...text.matchAll(/^\s*(?:async\s+)?def\s+(test_\w+)/gm)].map((m) => m[1]!),
    ...[...text.matchAll(/^func\s+(Test\w+)\s*\(/gm)].map((m) => m[1]!),
  ];
  return [...new Set(names)];
}

/** One test file as recorded red: its hash and the names it declared then. */
export function redFile(repo: string, path: string): { path: string; sha256: string; tests: string[] } {
  const file = join(repo, path);
  return { path, sha256: fileHash(repo, path), tests: existsSync(file) ? testNames(readFileSync(file, 'utf8')) : [] };
}

/**
 * Tests of a task that never ran red: names in its test files (the declared ones and those recorded red)
 * that no red run of the task saw. Files recorded before names were kept are skipped. Red first applies
 * to rework too: a test added after a FAIL needs its own red run (MDO-0008).
 */
export function testsWithoutRed(
  repo: string,
  progress: Progress | undefined,
  task: string,
  declared: string[],
  touchedFiles?: string[],
): { file: string; tests: string[] }[] {
  const recorded = progress?.red_tests.find((r) => r.task === task)?.files ?? [];
  if (!recorded.length) return [];
  const seen = new Map<string, Set<string> | undefined>();
  for (const f of recorded) seen.set(f.path, f.tests ? new Set([...(seen.get(f.path) ?? []), ...f.tests]) : undefined);
  const touched = touchedFiles ? new Set(touchedFiles) : undefined;
  const files = [...new Set([...declared.filter(isTestPath), ...seen.keys()])].filter((file) => !touched || touched.has(file));
  return files.flatMap((file) => {
    const full = join(repo, file);
    if (!existsSync(full) || (seen.has(file) && seen.get(file) === undefined)) return [];
    const red = seen.get(file) ?? new Set<string>();
    const missing = testNames(readFileSync(full, 'utf8')).filter((n) => !red.has(n));
    return missing.length ? [{ file, tests: missing }] : [];
  });
}

/** Test cases removed from a task's recorded red baseline; a deleted file counts as removing all its cases. */
export function deletedTests(repo: string, progress: Progress | undefined, task: string): { file: string; tests: string[] }[] {
  const entry = progress?.red_tests.find((r) => r.task === task);
  if (!entry) return [];
  return entry.files.flatMap((baseline) => {
    if (!baseline.tests?.length) return [];
    const full = join(repo, baseline.path);
    const current = existsSync(full) ? new Set(testNames(readFileSync(full, 'utf8'))) : new Set<string>();
    const removed = baseline.tests.filter((name) => !current.has(name));
    return removed.length ? [{ file: baseline.path, tests: removed }] : [];
  });
}

const isTestPath = (f: string) => /(\.(test|spec)\.[cm]?[jt]sx?$|(^|\/)test_[^/]*\.py$|_test\.(py|go)$)/.test(f);
