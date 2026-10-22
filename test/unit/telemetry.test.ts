import { describe, expect, test } from 'vitest';
import { correctHistoricalCosts, historicalDuplicateAmount, summarizeTelemetry, telemetryEventSchema } from '../../src/spec/telemetry.js';

const event = (type: string, at: string, id = 'run', question?: 'product' | 'external' | 'technical') =>
  telemetryEventSchema.parse({
    type,
    at: `2026-01-01T00:00:${at}.000Z`,
    id,
    run: 'run',
    command: 'implement',
    ...(question ? { question } : {}),
  });

describe('script-owned lifecycle telemetry', () => {
  test('reports active, user wait, agent wait and gate time without double-counting overlapping waits', () => {
    const events = [
      event('command_start', '00'),
      event('asked', '05', 'q1', 'product'),
      event('agent_start', '07', 'a1'),
      event('answered', '10', 'q1', 'product'),
      event('agent_end', '12', 'a1'),
      event('gate_start', '15', 'g1'),
      event('gate_end', '20', 'g1'),
      event('command_end', '30'),
    ];
    expect(summarizeTelemetry(events)).toEqual([
      { command: 'implement', runs: 1, activeMs: 23_000, userWaitMs: 5_000, agentWaitMs: 5_000, gateMs: 5_000, incomplete: 0 },
    ]);
  });

  test('does not estimate unanswered questions or incomplete command time', () => {
    expect(summarizeTelemetry([event('command_start', '00'), event('asked', '05', 'q1', 'technical')])).toEqual([
      { command: 'implement', runs: 0, activeMs: 0, userWaitMs: 0, agentWaitMs: 0, gateMs: 0, incomplete: 1 },
    ]);
  });

  test('clips paired waits to the command window and keeps mismatched command ends incomplete', () => {
    const clipped = summarizeTelemetry([
      event('command_start', '00'),
      event('asked', '05', 'q1', 'technical'),
      event('command_end', '10'),
      event('answered', '20', 'q1', 'technical'),
    ]);
    expect(clipped).toMatchObject([{ command: 'implement', runs: 1, activeMs: 5_000, userWaitMs: 5_000 }]);

    const mismatch = summarizeTelemetry([event('command_start', '00'), { ...event('command_end', '10'), command: 'verify' }]);
    expect(mismatch).toMatchObject([{ command: 'implement', incomplete: 1, runs: 0 }]);
  });

  test('corrects repeated cumulative session snapshots in a derived view', () => {
    expect(
      correctHistoricalCosts([
        { spec: 'A', command: 'specify', at: '1', session: 's', usd: 2, basis: 'billed', cumulative: { leader: 2, 'model:x': 2 } },
        { spec: 'B', command: 'implement', at: '2', session: 's', usd: 5, basis: 'billed', cumulative: { leader: 5, 'model:x': 5 } },
      ]),
    ).toMatchObject({
      byBasis: {
        billed: {
          rawUsd: 7,
          correctedUsd: 5,
          duplicateUsd: 2,
          byCommand: { specify: 2, implement: 3 },
          bySpec: { A: 2, B: 3 },
          rawBySpec: { A: 2, B: 5 },
          bySpecCommand: { A: { specify: 2 }, B: { implement: 3 } },
          rawBySpecCommand: { A: { specify: 2 }, B: { implement: 5 } },
        },
      },
    });
    expect(historicalDuplicateAmount(19.498, 19.4979)).toBe(0);
  });
});
