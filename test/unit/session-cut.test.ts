import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { cutAdvice, cutMinSavings, type SessionContext, sessionContext } from '../../src/scripts/session-cut.js';
import { makeTree } from '../helpers.js';

// Opus 5.5 per MTok: the cut weighs the 1h cache write against cache reads (ADR 0038).
const opus = { input: 4, cache_write_5m: 5, cache_write_1h: 8, cache_read: 0.2, output: 20 };
const NOW = Date.parse('2026-10-20T21:00:00Z');
// MDO-0007's single session: 34k at the start, 126k when T2 began, one task, verify and close left.
const mdo7: SessionContext = { model: 'claude-opus-5-5', first: 33_865, last: 125_542, lastAt: NOW - 60_000, ttl: '1h' };

describe('session cut at a task boundary', () => {
  test('MDO-0007 at T1 → T2: reading 126k for ~43 more turns costs more than writing a new 44k base', () => {
    expect(cutAdvice(mdo7, 1, opus, NOW)).toMatchObject({ cut: true, savings: 0.35 });
  });

  test('after a cut the context stays small and the next boundary does not cut again', () => {
    expect(cutAdvice({ ...mdo7, last: 62_000 }, 1, opus, NOW)).toMatchObject({ cut: false, savings: -0.19 });
    expect(cutAdvice({ ...mdo7, last: 40_000 }, 3, opus, NOW)).toMatchObject({ cut: false, savings: 0 });
  });

  test('more turns left make a cut pay sooner', () => {
    const at = { ...mdo7, last: 80_000 };
    expect(cutAdvice(at, 0, opus, NOW).cut).toBe(false);
    expect(cutAdvice(at, 4, opus, NOW).cut).toBe(true);
  });

  test('an expired cache always cuts: staying would rewrite the whole context', () => {
    const idle = { ...mdo7, last: 62_000, lastAt: NOW - 2 * 3_600_000 };
    expect(cutAdvice(idle, 1, opus, NOW)).toMatchObject({ cut: true, reason: expect.stringMatching(/1h cache expired/) });
    expect(cutAdvice({ ...idle, ttl: '5m', lastAt: NOW - 6 * 60_000 }, 1, opus, NOW).cut).toBe(true);
  });

  test('the context comes from the main responses of the transcript, last line per response', () => {
    const usage = (read: number, write: number, oneHour = false) => ({
      input_tokens: 2,
      cache_read_input_tokens: read,
      cache_creation_input_tokens: write,
      cache_creation: oneHour ? { ephemeral_1h_input_tokens: write } : { ephemeral_5m_input_tokens: write },
    });
    const line = (o: object) => JSON.stringify(o);
    const lines = [
      line({ type: 'user', message: { content: 'go' } }),
      line({ timestamp: '2026-10-20T20:00:00Z', message: { id: 'a', model: 'claude-opus-5-5', usage: usage(0, 30_000, true) } }),
      line({ isSidechain: true, message: { id: 's', model: 'claude-sonnet-5-5', usage: usage(0, 900_000) } }),
      'not json "usage"',
      line({ timestamp: '2026-10-20T20:01:00Z', message: { id: 'b', model: 'claude-opus-5-5', usage: usage(30_000, 5_000) } }),
      line({ message: { id: 'c', model: '<synthetic>', usage: usage(0, 0) } }),
    ];
    const root = makeTree({ 's.jsonl': `${lines.join('\n')}\n` });
    expect(sessionContext(join(root, 's.jsonl'))).toEqual({
      model: 'claude-opus-5-5',
      first: 30_002,
      last: 35_002,
      lastAt: Date.parse('2026-10-20T20:01:00Z'),
      ttl: '1h',
    });
    expect(sessionContext(join(makeTree({ 'e.jsonl': '' }), 'e.jsonl'))).toBeUndefined();
  });

  test('inside implement the Leader stops only above cut_min_savings: $1 or 15% of the spec budget, the lower', () => {
    expect(cutMinSavings({ session: {}, budget: {} })).toBe(1);
    expect(cutMinSavings({ session: {}, budget: { per_spec: 4 } })).toBeCloseTo(0.6);
    expect(cutMinSavings({ session: {}, budget: { per_spec: 20 } })).toBe(1);
    expect(cutMinSavings({ session: { cut_min_savings: 0 }, budget: { per_spec: 4 } })).toBe(0);
  });

  test('on a subscription the savings are list-price equivalents: no cut for them unless a threshold is set (phase 16)', () => {
    expect(cutMinSavings({ session: {}, budget: {} }, 'equivalent')).toBe(Number.POSITIVE_INFINITY);
    expect(cutMinSavings({ session: {}, budget: {} }, 'billed')).toBe(1);
    expect(cutMinSavings({ session: {}, budget: {} }, 'unknown')).toBe(1);
    expect(cutMinSavings({ session: { cut_min_savings: 5 }, budget: {} }, 'equivalent')).toBe(5);
  });
});
