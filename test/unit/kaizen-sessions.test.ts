import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { RELOAD_TOKENS, TURNS_AFTER_TASKS, TURNS_PER_TASK } from '../../src/scripts/session-cut.js';
import type { SessionMeasure } from '../../src/scripts/session-turns.js';
import { sessionCutKaizen } from '../../src/spec/kaizen-sessions.js';
import { makeTree } from '../helpers.js';

const INSUFFICIENT = 'insufficient data (minimum 3)';

const measure = (over: Partial<SessionMeasure> = {}): SessionMeasure => ({
  missing: [],
  tasks: {},
  unmeasured: [],
  close: 'not recorded',
  estimates: [],
  ...over,
});
/** A spec whose verify and close are recorded, so its afterTasks counts (D4). */
const recorded = { verify: 10, close: 8 } as const;
const input = (spec: string, over: Partial<SessionMeasure> = {}) => ({ spec, measure: measure(over) });

describe('sessionCutKaizen: constants against measurements (FR-4, D4)', () => {
  // S-4.1
  test('S-4.1: tasks averaging 22 turns propose 22 for TURNS_PER_TASK; 28 against 28 proposes nothing', () => {
    const k = sessionCutKaizen([
      input('A', { tasks: { T1: 20, T2: 24 }, afterTasks: 28, ...recorded }),
      input('B', { tasks: { T1: 22 }, afterTasks: 26, ...recorded }),
      input('C', { tasks: { T1: 21, T2: 23, T3: 22 }, afterTasks: 30, ...recorded }),
    ]);
    expect(k.turnsPerTask.constant).toBe(15);
    expect(k.turnsPerTask.constant).toBe(TURNS_PER_TASK);
    expect(k.turnsPerTask.measured).toBe(22);
    expect(k.turnsPerTask.n).toBe(3);
    expect(k.turnsPerTask.proposal).toBe(22);
    expect(k.turnsAfterTasks.constant).toBe(TURNS_AFTER_TASKS);
    expect(k.turnsAfterTasks.measured).toBe(28);
    expect(k.turnsAfterTasks.n).toBe(3);
    expect(k.turnsAfterTasks.proposal).toBeUndefined();
  });

  test('the proposal is the measured value rounded', () => {
    const k = sessionCutKaizen([input('A', { tasks: { T1: 22 } }), input('B', { tasks: { T1: 22 } }), input('C', { tasks: { T1: 23 } })]);
    expect(k.turnsPerTask.measured).toBeCloseTo(22.33, 1);
    expect(k.turnsPerTask.proposal).toBe(22);
  });

  test('a proposal needs a difference of more than 20%: exactly 20% proposes nothing, above it proposes', () => {
    const at = (v: number) => sessionCutKaizen([1, 2, 3].map((i) => input(`S${i}`, { tasks: { T1: v } })));
    expect(at(18).turnsPerTask.proposal).toBeUndefined(); // 15 -> 18 is exactly 20%
    expect(at(16).turnsPerTask.proposal).toBeUndefined();
    expect(at(19).turnsPerTask.proposal).toBe(19);
  });

  test('a spec without verify or without a recorded close is left out of the mean and n of TURNS_AFTER_TASKS', () => {
    const k = sessionCutKaizen([
      input('A', { afterTasks: 28, ...recorded }),
      input('B', { afterTasks: 100, verify: undefined, close: 8 }),
      input('C', { afterTasks: 100, verify: 10, close: 'not recorded' }),
    ]);
    expect(k.turnsAfterTasks.n).toBe(1);
    expect(k.turnsAfterTasks.measured).toBe(28);
  });

  test('RELOAD_TOKENS is compared with the mean of the measured reloads', () => {
    const k = sessionCutKaizen([input('A', { reload: 20_000 }), input('B', { reload: 24_000 }), input('C', { reload: 22_000 })]);
    expect(k.reloadTokens.constant).toBe(RELOAD_TOKENS);
    expect(k.reloadTokens.measured).toBe(22_000);
    expect(k.reloadTokens.n).toBe(3);
    expect(k.reloadTokens.proposal).toBe(22_000);
  });

  test('a spec without a measurement for a constant does not count towards its n', () => {
    const k = sessionCutKaizen([
      input('A', { tasks: { T1: 22 }, afterTasks: 40, ...recorded }),
      input('B', { tasks: { T1: 22 } }),
      input('C', { tasks: { T1: 22 } }),
    ]);
    expect(k.turnsPerTask.n).toBe(3);
    expect(k.turnsAfterTasks.n).toBe(1);
    expect(k.turnsAfterTasks.result).toBe(INSUFFICIENT);
    expect(k.turnsAfterTasks.proposal).toBeUndefined();
  });
});

describe('sessionCutKaizen: logged estimates against what followed (S-4.2)', () => {
  test('S-4.2: a row shows estimated 43 and actual 51, and the mean error is reported', () => {
    const k = sessionCutKaizen([
      input('A', { estimates: [{ at: '2026-10-01 10:00', task: 'T2', estimated: 43, actual: 51 }] }),
      input('B', { estimates: [{ at: '2026-10-02 10:00', task: 'T1', estimated: 30, actual: 40 }] }),
    ]);
    expect(k.estimates.rows).toContainEqual(
      expect.objectContaining({ spec: 'A', at: '2026-10-01 10:00', task: 'T2', estimated: 43, actual: 51 }),
    );
    expect(k.estimates.rows).toHaveLength(2);
    // errors 8 and 10: the mean is 9 whether signed (actual - estimated) or absolute
    expect(k.estimates.meanError).toBe(9);
  });

  test('the mean error is absolute: errors +8 and -10 give 9, not -1', () => {
    const k = sessionCutKaizen([
      input('A', {
        estimates: [
          { at: 'x', task: 'T1', estimated: 40, actual: 48 },
          { at: 'y', task: 'T2', estimated: 50, actual: 40 },
        ],
      }),
    ]);
    expect(k.estimates.meanError).toBe(9);
  });

  test('a row without an actual (close not recorded) is shown but left out of the mean error', () => {
    const k = sessionCutKaizen([
      input('A', {
        estimates: [
          { at: 'x', task: 'T2', estimated: 43, actual: 51 },
          { at: 'y', task: 'T3', estimated: 20 },
        ],
      }),
    ]);
    expect(k.estimates.rows).toHaveLength(2);
    expect(k.estimates.rows.find((r) => r.task === 'T3')?.actual).toBeUndefined();
    expect(k.estimates.meanError).toBe(8);
  });

  test('no row with an actual: no mean error, never 0', () => {
    const k = sessionCutKaizen([input('A', { estimates: [{ at: 'y', task: 'T3', estimated: 20 }] })]);
    expect(k.estimates.meanError).toBeUndefined();
  });
});

describe('sessionCutKaizen: sample-size minimum (S-4.3, AC-4/C1)', () => {
  test('S-4.3/C1: measurements from 2 specs show the values and n: 2, say insufficient data, and propose nothing', () => {
    const k = sessionCutKaizen([
      input('A', { tasks: { T1: 30 }, afterTasks: 60, reload: 30_000, ...recorded }),
      input('B', { tasks: { T1: 34 }, afterTasks: 64, reload: 34_000, ...recorded }),
    ]);
    for (const c of [k.turnsPerTask, k.turnsAfterTasks, k.reloadTokens]) {
      expect(c.n).toBe(2);
      expect(c.result).toBe(INSUFFICIENT);
      expect(c.proposal).toBeUndefined();
    }
    expect(k.turnsPerTask.measured).toBe(32);
    expect(k.turnsAfterTasks.measured).toBe(62);
    expect(k.reloadTokens.measured).toBe(32_000);
  });

  test('the minimum is 3: three specs lift the result, and there is no insufficient-data text', () => {
    const k = sessionCutKaizen([1, 2, 3].map((i) => input(`S${i}`, { tasks: { T1: 30 } })));
    expect(k.turnsPerTask.result).toBeUndefined();
    expect(k.turnsPerTask.proposal).toBe(30);
  });

  test('no measurements at all: n is 0, insufficient data, nothing proposed', () => {
    const k = sessionCutKaizen([input('A'), input('B'), input('C')]);
    expect(k.turnsPerTask.n).toBe(0);
    expect(k.turnsPerTask.measured).toBeUndefined();
    expect(k.turnsPerTask.result).toBe(INSUFFICIENT);
    expect(k.turnsPerTask.proposal).toBeUndefined();
  });

  test('the minimum can be changed by the caller, like the cost advice', () => {
    const two = [input('A', { tasks: { T1: 30 } }), input('B', { tasks: { T1: 30 } })];
    expect(sessionCutKaizen(two, 2).turnsPerTask.proposal).toBe(30);
  });
});

describe('sessionCutKaizen: advice only (S-4.4, AC-4/C2)', () => {
  test('S-4.4/C2: session-cut.ts and the config files are unchanged and the constants keep their values', () => {
    // purity check: the config files are never passed in, so nothing here could write them
    const root = makeTree({ '.mandao/config.yml': 'models: {}\n', 'mandao.config.json': '{"a":1}\n' });
    const files = [join(process.cwd(), 'src/scripts/session-cut.ts'), join(root, '.mandao/config.yml'), join(root, 'mandao.config.json')];
    const before = files.map((f) => readFileSync(f, 'utf8'));
    const k = sessionCutKaizen([1, 2, 3].map((i) => input(`S${i}`, { tasks: { T1: 40 }, afterTasks: 90, reload: 50_000, ...recorded })));
    expect(k.turnsPerTask.proposal).toBe(40);
    expect(files.map((f) => readFileSync(f, 'utf8'))).toEqual(before);
    expect([TURNS_PER_TASK, TURNS_AFTER_TASKS, RELOAD_TOKENS]).toEqual([15, 28, 10_000]);
  });

  test('the inputs are not mutated and the result is plain JSON', () => {
    const inputs = [1, 2, 3].map((i) => input(`S${i}`, { tasks: { T1: 40 } }));
    const snapshot = JSON.stringify(inputs);
    const k = sessionCutKaizen(inputs);
    expect(JSON.stringify(inputs)).toBe(snapshot);
    expect(JSON.parse(JSON.stringify(k))).toEqual(k);
  });
});
