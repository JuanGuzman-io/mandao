import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Budget } from '../../src/scripts/resources.js';
import { inProjectDir, runTests, withPriority } from '../../src/scripts/run-tests.js';
import { makeTree } from '../helpers.js';

const low: Budget = { decision: 'run', workers: 1, priority: 'low', timeoutS: 30, reason: 'test' };

beforeEach(() => void vi.spyOn(process.stderr, 'write').mockImplementation(() => true));
afterEach(() => vi.restoreAllMocks());

/**
 * Found by running Mandao on an external monorepo (phase 11): with `priority: low`, a project gate became
 * `nice -n 10 cd "apps/api" && …`. `nice` cannot run the `cd` builtin, so the rest ran from the root
 * (macOS) or not at all (Linux), and stderr of all but the last command was lost.
 */
describe.skipIf(process.platform === 'win32')('a project gate runs in its folder at low priority', () => {
  test('a compound gate runs every step inside the project and keeps every step’s stderr', async () => {
    const root = realpathSync(makeTree({ 'apps/api/marker.txt': 'here', 'package.json': '{}' }));
    const gate = 'node -e "console.log(process.cwd())" && node -e "console.error(\'first fails\'); process.exit(3)" && echo never';
    const run = await runTests(root, 'T1 lint', inProjectDir(gate, 'apps/api'), low, 0, { keepOutput: true });
    expect(run).toMatchObject({ status: 'FAIL', exitCode: 3 });
    expect(run.output).toContain(join(root, 'apps/api'));
    expect(run.output).toContain('first fails');
    expect(run.output).not.toContain('never');
  });

  test('low priority wraps the whole command, so a builtin at its start still works', () => {
    expect(withPriority('cd "apps/api" && npm test', 'low')).toBe(`nice -n 10 sh -c 'cd "apps/api" && npm test'`);
    expect(withPriority('npm test', 'normal')).toBe('npm test');
  });
});

describe.skipIf(process.platform === 'win32')('inProjectDir quoting and shape', () => {
  test('a command ending in a comment or & still closes its group and keeps the redirect', async () => {
    const root = realpathSync(makeTree({ 'apps/api/marker.txt': 'here' }));
    const run = await runTests(root, 'T1 lint', inProjectDir('ls marker.txt # trailing comment', 'apps/api'), low, 0, { keepOutput: true });
    expect(run).toMatchObject({ status: 'PASS' });
    expect(run.output).toContain('marker.txt');
    const err = await runTests(root, 'T1 lint', inProjectDir('echo boom >&2; false # trailing comment', 'apps/api'), low, 0, {
      keepOutput: true,
    });
    expect(err).toMatchObject({ status: 'FAIL' });
    expect(err.output).toContain('boom');
    const bg = await runTests(root, 'T1 lint', inProjectDir('true &', 'apps/api'), low, 0);
    expect(bg).toMatchObject({ status: 'PASS' });
  });

  test('the path is single-quoted so $ and backticks never expand, and quotes are escaped', async () => {
    expect(inProjectDir('npm test', 'apps/api')).toBe(`cd 'apps/api' && { npm test\n} 2>&1`);
    expect(inProjectDir('npm test', '.')).toBe(`{ npm test\n} 2>&1`);
    expect(inProjectDir('npm test', "a'b")).toBe(`cd 'a'\\''b' && { npm test\n} 2>&1`);
    const root = realpathSync(makeTree({ 'ap$ps/`x`/marker.txt': 'here' }));
    const run = await runTests(root, 'T1 lint', inProjectDir('ls marker.txt', 'ap$ps/`x`'), low, 0, { keepOutput: true });
    expect(run).toMatchObject({ status: 'PASS' });
  });
});
