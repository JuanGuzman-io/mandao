import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { measureSessions } from '../../src/scripts/session-turns.js';
import { makeTree } from '../helpers.js';

/**
 * API under test (MDO-0008 T2, D2 and D3), as the tests below fix it:
 *   measureSessions({ specDir, commitTimes, home })
 *   - specDir: holds `_log/costs.yml`; home: Claude config dir (`<home>/projects/<slug>/<session>.jsonl`)
 *   - commitTimes: task id -> commit times in ms (what `taskCommitTimes` returns for the spec)
 *   - result: { missing: string[], pauses?: { count, medianMinutes, atMost5, between5And60, over60 },
 *               tasks: Record<task, number>, unmeasured: string[], verify?: number,
 *               close: number | 'not recorded' | 'not measured', afterTasks?: number }
 * Fixtures are synthetic: made-up ids, no prompt text of any real person.
 */

const T0 = Date.parse('2026-01-05T10:00:00.000Z');
const at = (minutes: number) => new Date(T0 + minutes * 60_000).toISOString();
const j = (o: object) => JSON.stringify(o);

const usage = { input_tokens: 2, cache_read_input_tokens: 1000, cache_creation_input_tokens: 10, output_tokens: 5 };
const reply = (id: string, minutes: number, extra: object = {}) =>
  j({ type: 'assistant', timestamp: at(minutes), message: { id, model: 'claude-opus-5-5', usage }, ...extra });
const prompt = (minutes: number, content: unknown = 'synthetic prompt') =>
  j({ type: 'user', timestamp: at(minutes), message: { role: 'user', content } });

const costRecord = (command: string, minutes: number, session: string, harness = 'claude') =>
  `  - at: ${at(minutes)}\n    command: ${command}\n    harness: ${harness}\n    session: ${session}\n    usd: 0.5\n    source: claude-code\n`;
const costsYml = (...records: string[]) => `costs:\n${records.join('')}`;

/** A spec folder with its cost log, and a Claude home with each session's transcript. */
function fixture(costs: string, transcripts: Record<string, string>, subagents: Record<string, string> = {}, cuts?: string) {
  const files: Record<string, string> = { 'spec/_log/costs.yml': costs, 'home/projects/-synthetic-repo/': '' };
  if (cuts !== undefined) files['spec/_log/session-cuts.md'] = cuts;
  for (const [id, body] of Object.entries(transcripts)) files[`home/projects/-synthetic-repo/${id}.jsonl`] = body;
  for (const [path, body] of Object.entries(subagents)) files[`home/projects/-synthetic-repo/${path}`] = body;
  const root = makeTree(files);
  return { specDir: join(root, 'spec'), home: join(root, 'home') };
}

describe('the pauses before each user turn (S-2.1)', () => {
  // Prompts 1, 7 and 75 minutes after the previous main response, plus lines that are not user turns.
  const transcript = [
    prompt(0), // the session's first prompt: no previous response, not a pause
    reply('r1', 0.5),
    j({
      type: 'user',
      timestamp: at(1.5),
      message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: 'ok' }] },
    }),
    prompt(1.5, [{ type: 'text', text: 'a prompt as a text block' }]), // 1 minute after r1
    reply('r2', 2),
    j({ type: 'user', isMeta: true, timestamp: at(8), message: { role: 'user', content: 'synthetic meta line' } }),
    j({ type: 'user', timestamp: at(8), message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't2', content: 'ok' }] } }),
    prompt(9), // 7 minutes after r2
    reply('r3', 9.5),
    prompt(84.5), // 75 minutes after r3
    reply('r4', 85),
  ].join('\n');

  test('three pauses: median 7 minutes, one at most 5, one between 5 and 60, one over 60', () => {
    const { specDir, home } = fixture(costsYml(costRecord('implement', 90, 'sess-pauses')), { 'sess-pauses': transcript });
    const result = measureSessions({ specDir, home, commitTimes: new Map() });
    expect(result.pauses).toEqual({ count: 3, medianMinutes: 7, atMost5: 1, between5And60: 1, over60: 1 });
  });

  test('S-2.1/C1: the first prompt, tool results and meta lines are left out', () => {
    const { specDir, home } = fixture(costsYml(costRecord('implement', 90, 'sess-pauses')), { 'sess-pauses': transcript });
    const { pauses } = measureSessions({ specDir, home, commitTimes: new Map() });
    // Counting the first prompt, the two tool results or the meta line would make more than three pauses.
    expect(pauses?.count).toBe(3);
  });
});

describe('the main turns of each task, verify and close (S-2.2)', () => {
  // Minutes: T1 commits at 2.5 (an earlier commit at 1.2 too), T2 at 4.5, implement recorded at 6.5,
  // verify at 8.5, close at 11.5. Streamed responses repeat their id on several lines.
  const transcript = [
    reply('a1', 0.5),
    reply('a2', 1.0),
    reply('a2', 1.0), // same response id, written again as it streams
    reply('a3', 2.0),
    reply('a4', 3.0),
    reply('a5', 4.0),
    reply('a5', 4.0),
    reply('a5', 4.0),
    reply('a6', 5.0),
    reply('a7', 6.0),
    reply('a8', 7.0),
    reply('a9', 8.0),
    reply('b1', 9.0),
    reply('b2', 10.0),
    reply('b3', 11.0),
  ].join('\n');
  const records = costsYml(
    costRecord('implement', 6.5, 'sess-turns'),
    costRecord('verify', 8.5, 'sess-turns'),
    costRecord('close', 11.5, 'sess-turns'),
  );
  const commitTimes = new Map([
    ['T1', [T0 + 1.2 * 60_000, T0 + 2.5 * 60_000]],
    ['T2', [T0 + 4.5 * 60_000]],
  ]);

  test('each task, verify and close get the responses of their windows; after tasks is tail + verify + close', () => {
    const { specDir, home } = fixture(records, { 'sess-turns': transcript });
    const result = measureSessions({ specDir, home, commitTimes });
    expect(result.missing).toEqual([]);
    expect(result.tasks).toEqual({ T1: 3, T2: 2 }); // a1-a3 up to T1's last commit; a4-a5 up to T2's
    expect(result.verify).toBe(2); // a8 and a9: (6.5, 8.5]
    expect(result.close).toBe(3); // b1-b3: (8.5, 11.5]
    expect(result.afterTasks).toBe(2 + 2 + 3); // implement tail a6-a7, verify, close
    expect(result.unmeasured).toEqual([]);
  });

  test('S-2.2/C1: a response written on several lines is one turn', () => {
    const { specDir, home } = fixture(records, { 'sess-turns': transcript });
    const result = measureSessions({ specDir, home, commitTimes });
    // 8 transcript lines fall in T1 and T2's windows; only 5 distinct response ids do.
    expect(result.tasks?.T2).toBe(2);
    expect(Object.values(result.tasks ?? {}).reduce((a, b) => a + b, 0)).toBe(5);
  });

  test('a task committed outside every implement window is listed as unmeasured', () => {
    const { specDir, home } = fixture(records, { 'sess-turns': transcript });
    const late = new Map([...commitTimes, ['T3', [T0 + 40 * 60_000]]]);
    const result = measureSessions({ specDir, home, commitTimes: late });
    expect(result.unmeasured).toEqual(['T3']);
    expect(result.tasks).toEqual({ T1: 3, T2: 2 });
  });
});

describe('missing data is named, never zero (S-2.3)', () => {
  const records = costsYml(
    costRecord('specify', 5, 'sess-gone'),
    costRecord('implement', 30, 'sess-gone'),
    costRecord('implement', 31, 'sess-other-harness', 'codex'),
  );

  test('S-2.3/C1: a session without a transcript is listed as missing, with no counts, and close is not recorded', () => {
    const { specDir, home } = fixture(records, {});
    const result = measureSessions({ specDir, home, commitTimes: new Map() });
    expect(result.missing).toEqual(['sess-gone']); // the codex record is not a Claude Code session
    expect(result.tasks).toEqual({});
    expect(result.verify).toBeUndefined();
    expect(result.afterTasks).toBeUndefined();
    expect(result.pauses).toBeUndefined(); // not zero pauses
    expect(result.close).toBe('not recorded');
  });

  test('S-2.3: the measured session still counts while the missing one is named', () => {
    const both = costsYml(costRecord('implement', 6.5, 'sess-gone'), costRecord('implement', 20, 'sess-here'));
    const transcript = [reply('m1', 10), reply('m2', 11)].join('\n');
    const { specDir, home } = fixture(both, { 'sess-here': transcript });
    const result = measureSessions({ specDir, home, commitTimes: new Map([['T1', [T0 + 12 * 60_000]]]) });
    expect(result.missing).toEqual(['sess-gone']);
    expect(result.tasks).toEqual({ T1: 2 });
  });

  test("a commit in a measured session's window is not claimed by a missing session's open-ended window", () => {
    // sess-gone has no transcript, so its implement window is open at -Infinity up to 6.5 and overlaps
    // sess-here's (0, 20]. T1 at 3 falls in both and belongs to the measured one; T0 at -5 falls only in
    // the missing one, so it has no count and is not unmeasured either (D2).
    const both = costsYml(costRecord('implement', 6.5, 'sess-gone'), costRecord('implement', 20, 'sess-here'));
    const transcript = [reply('h1', 1), reply('h2', 2), reply('h3', 10)].join('\n');
    const { specDir, home } = fixture(both, { 'sess-here': transcript });
    const commitTimes = new Map([
      ['T0', [T0 - 5 * 60_000]],
      ['T1', [T0 + 3 * 60_000]],
    ]);
    const result = measureSessions({ specDir, home, commitTimes });
    expect(result.missing).toEqual(['sess-gone']);
    expect(result.tasks).toEqual({ T1: 2 }); // h1 and h2, from sess-here's start
    expect(result.unmeasured).toEqual([]);
  });
});

describe('subagents are not main turns (S-2.4)', () => {
  test('S-2.4/C2: sidechain lines and the subagents folder add no main-session turn', () => {
    const main = [
      reply('m1', 0.5),
      reply('s1', 0.6, { isSidechain: true }),
      reply('s2', 0.7, { isSidechain: true }),
      reply('m2', 1.0),
    ].join('\n');
    const sub = [reply('x1', 0.8), reply('x2', 0.9), reply('x3', 1.1)].join('\n');
    const { specDir, home } = fixture(
      costsYml(costRecord('implement', 3, 'sess-sub')),
      { 'sess-sub': main },
      {
        'sess-sub/subagents/agent-synthetic.jsonl': sub,
        'sess-sub/subagents/agent-synthetic.meta.json': j({ agentType: 'mandao-reviewer' }),
      },
    );
    const result = measureSessions({ specDir, home, commitTimes: new Map([['T1', [T0 + 2 * 60_000]]]) });
    expect(result.tasks).toEqual({ T1: 2 }); // m1 and m2 only
    expect(result.afterTasks).toBe(0);
  });
});

/** A main response with its own usage, optionally calling a tool (a subagent is called through `Agent`). */
const sized = (id: string, minutes: number, u: { input: number; read: number; write: number }, tool?: string, extra: object = {}) =>
  j({
    type: 'assistant',
    timestamp: at(minutes),
    message: {
      id,
      model: 'claude-opus-5-5',
      usage: { input_tokens: u.input, cache_read_input_tokens: u.read, cache_creation_input_tokens: u.write, output_tokens: 5 },
      content: tool ? [{ type: 'tool_use', id: `tu-${id}`, name: tool, input: {} }] : [{ type: 'text', text: 'synthetic' }],
    },
    ...extra,
  });

describe('what a new session reloads (D3)', () => {
  // First response 0 + 0 + 6_000 tokens; the first subagent call 2 + 9_000 + 3_000 = 12_002.
  const transcript = [
    sized('r1', 0.5, { input: 0, read: 0, write: 6_000 }),
    sized('r2', 1, { input: 1, read: 6_000, write: 100 }, 'Bash'), // a tool, not a subagent
    sized('s1', 1.5, { input: 1, read: 90_000, write: 0 }, 'Agent', { isSidechain: true }), // not a main response
    sized('r3', 2, { input: 2, read: 9_000, write: 3_000 }, 'Agent'), // the first main response that calls a subagent
    sized('r4', 3, { input: 2, read: 50_000, write: 4_000 }, 'Agent'), // later calls do not matter
  ].join('\n');

  test('the prompt size of the first subagent call minus that of the first response', () => {
    const { specDir, home } = fixture(costsYml(costRecord('implement', 5, 'sess-reload')), { 'sess-reload': transcript });
    const result = measureSessions({ specDir, home, commitTimes: new Map() });
    expect(result.reload).toBe(12_002 - 6_000);
  });

  test('a session that starts with verify has a reload too', () => {
    const { specDir, home } = fixture(costsYml(costRecord('verify', 5, 'sess-reload')), { 'sess-reload': transcript });
    expect(measureSessions({ specDir, home, commitTimes: new Map() }).reload).toBe(6_002);
  });

  test('a session whose first record is another command has no reload, and never a zero', () => {
    const records = costsYml(costRecord('specify', 1, 'sess-reload'), costRecord('implement', 5, 'sess-reload'));
    const { specDir, home } = fixture(records, { 'sess-reload': transcript });
    expect(measureSessions({ specDir, home, commitTimes: new Map() }).reload).toBeUndefined();
  });

  test('no subagent call, or no transcript, gives no reload', () => {
    const calls = [sized('r1', 0.5, { input: 0, read: 0, write: 6_000 }), sized('r2', 1, { input: 1, read: 6_000, write: 0 }, 'Bash')].join(
      '\n',
    );
    const noCall = fixture(costsYml(costRecord('implement', 5, 'sess-a')), { 'sess-a': calls });
    expect(measureSessions({ ...noCall, commitTimes: new Map() }).reload).toBeUndefined();
    const gone = fixture(costsYml(costRecord('implement', 5, 'sess-b')), {});
    expect(measureSessions({ ...gone, commitTimes: new Map() }).reload).toBeUndefined();
  });
});

describe('the turns that followed each logged cut estimate (D4 actuals, from D2 and D3)', () => {
  // After the boundary at 4.5 the main responses a6..a9 and b1..b3 are 7 turns up to the close record at
  // 11.5; a7 is written twice, x1 is a sidechain line, `late` comes after the close record.
  const transcript = [
    reply('a1', 0.5),
    reply('a3', 2.0),
    reply('a5', 4.0),
    reply('a6', 5.0),
    reply('a7', 6.0),
    reply('a7', 6.0),
    reply('a8', 7.0),
    reply('a9', 8.0),
    reply('x1', 9.0, { isSidechain: true }),
    reply('b1', 9.5),
    reply('b2', 10.0),
    reply('b3', 11.0),
    reply('late', 12.0),
  ].join('\n');
  const header =
    '# Session cut estimates (ADR 0038)\n\n| At | Task | Context | Base | Turns left | Savings (USD) | Decision |\n|---|---|---|---|---|---|---|\n';
  const row = `| ${at(4.5)} | T2 | 125542 | 43865 | 43 | 0.35 | cut |\n`;
  const withClose = costsYml(costRecord('implement', 6.5, 'sess-est'), costRecord('close', 11.5, 'sess-est'));

  test('a row shows its estimate and the main turns after its time up to the close record', () => {
    const { specDir, home } = fixture(withClose, { 'sess-est': transcript }, {}, header + row);
    const result = measureSessions({ specDir, home, commitTimes: new Map() });
    expect(result.estimates).toEqual([{ at: at(4.5), task: 'T2', estimated: 43, actual: 7 }]);
  });

  test('the header is not a row, and each row gets its own actual', () => {
    const later = `| ${at(8.2)} | T3 | 90000 | 40000 | 28 | -0.10 | stay |\n`;
    const { specDir, home } = fixture(withClose, { 'sess-est': transcript }, {}, header + row + later);
    const result = measureSessions({ specDir, home, commitTimes: new Map() });
    expect(result.estimates).toEqual([
      { at: at(4.5), task: 'T2', estimated: 43, actual: 7 },
      { at: at(8.2), task: 'T3', estimated: 28, actual: 3 }, // b1, b2, b3 after 8.2 and before 11.5
    ]);
  });

  test('without a close record the actual is not known, never zero', () => {
    const open = costsYml(costRecord('implement', 6.5, 'sess-est'));
    const { specDir, home } = fixture(open, { 'sess-est': transcript }, {}, header + row);
    const result = measureSessions({ specDir, home, commitTimes: new Map() });
    expect(result.estimates).toEqual([{ at: at(4.5), task: 'T2', estimated: 43, actual: undefined }]);
  });

  test('no session-cuts.md gives no estimates', () => {
    const { specDir, home } = fixture(withClose, { 'sess-est': transcript });
    expect(measureSessions({ specDir, home, commitTimes: new Map() }).estimates).toEqual([]);
  });
});
