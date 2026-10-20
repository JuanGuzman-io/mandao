import { existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Budget } from '../../src/scripts/resources.js';
import { RUN_LOCK, runTests } from '../../src/scripts/run-tests.js';
import { makeTree } from '../helpers.js';

const budget: Budget = { decision: 'run', workers: 1, priority: 'normal', timeoutS: 30, reason: 'test' };

beforeEach(() => void vi.spyOn(process.stderr, 'write').mockImplementation(() => true));
afterEach(() => vi.restoreAllMocks());

/**
 * The slot-leak defect seen in the MDO-0006 run (a reservation kept after its command never ran or failed)
 * must not exist in Mandao's queue: the slot is taken only right before the command starts and released
 * as soon as it ends, however it ends. A later run never waits for a TTL.
 */
describe('the run queue frees its slot at once, whatever the command did', () => {
  test.each([
    ['fails', 'node -e "process.exit(1)"', { status: 'FAIL', exitCode: 1 }],
    ['cannot start', 'mandao-no-such-command-xyz', { status: 'FAIL' }],
    ['times out', 'node -e "setTimeout(() => {}, 60000)"', { status: 'TIMEOUT' }],
  ])('a command that %s releases the lock before the next run', async (_, command, expected) => {
    const root = realpathSync(makeTree({}));
    const first = await runTests(root, 'first', command, { ...budget, timeoutS: command.includes('60000') ? 1 : 30 });
    expect(first).toMatchObject(expected);
    expect(existsSync(join(root, RUN_LOCK))).toBe(false);
    // No queue wait allowed: a leaked slot would make this a QUEUE_TIMEOUT.
    expect(await runTests(root, 'second', 'node -e "process.exit(0)"', budget, 0)).toMatchObject({ status: 'PASS' });
  });

  test('a deferred or impossible run never reserves a slot', async () => {
    const root = realpathSync(makeTree({}));
    expect(await runTests(root, 'deferred', 'node -e ""', { ...budget, decision: 'defer' })).toMatchObject({ status: 'DEFERRED_TO_CI' });
    expect(await runTests(root, 'no command', undefined, budget)).toMatchObject({ status: 'DEFERRED_TO_CI' });
    expect(existsSync(join(root, RUN_LOCK))).toBe(false);
  });
});
