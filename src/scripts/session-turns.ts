import { existsSync, readFileSync } from 'node:fs';
import { type CostEntry, parseCosts } from '../spec/index.js';
import { findClaudeTranscript } from './session-cost.js';
import { mainResponse, parseCutEstimates } from './session-cut.js';
import { logPath } from './spec-log.js';

/**
 * What the session-cut constants (ADR 0038) assume, measured on a spec's Claude Code sessions (MDO-0008
 * D2, D3): the user's pauses, the main-session turns of each task, of verify and of close, the reload of a
 * new session, and the turns that followed each logged cut estimate. Transcripts are untrusted local JSON
 * and hold prompts: bad lines are skipped, and only counts, sizes and durations leave this module.
 */

export interface Pauses {
  count: number;
  /** Absent when there is no pause to take the median of. */
  medianMinutes?: number;
  atMost5: number;
  between5And60: number;
  over60: number;
}

export interface CutEstimateActual {
  at: string;
  task: string;
  estimated: number;
  /** Main turns after `at` up to the close record; absent when that is not known (no close, a session missing). */
  actual?: number;
}

export interface SessionMeasure {
  /** Claude Code sessions in `costs.yml` with no transcript on this machine: their windows have no counts. */
  missing: string[];
  /** Absent when no session was measured: never zero pauses. */
  pauses?: Pauses;
  tasks: Record<string, number>;
  /** Tasks whose last commit falls outside every implement window. */
  unmeasured: string[];
  verify?: number;
  /** `not measured`: close is recorded, but in a session whose transcript is missing. */
  close: number | 'not recorded' | 'not measured';
  /** The implement tails plus verify plus close. */
  afterTasks?: number;
  /** Mean over sessions that start with implement or verify: first subagent call's prompt minus the first one's. */
  reload?: number;
  estimates: CutEstimateActual[];
}

interface Transcript {
  /** One per response id, at its first line's time. */
  turns: number[];
  pauses: number[];
  firstSize?: number;
  agentSize?: number;
}

interface Window {
  command: string;
  lo: number;
  hi: number;
  /** The session's transcript, or undefined when it is missing. */
  data?: Transcript;
}

interface Session {
  id: string;
  records: { command: string; at: number }[];
  data?: Transcript;
}

const MINUTE = 60_000;

interface UserLine {
  type?: unknown;
  isMeta?: unknown;
  isSidechain?: unknown;
  timestamp?: unknown;
  message?: { content?: unknown };
}

/** A user turn: a `user` line, not meta nor sidechain, with string or `text` content and no tool result. */
function promptAt(raw: string): number | undefined {
  if (!raw.includes('"user"')) return undefined;
  let line: UserLine;
  try {
    line = JSON.parse(raw) as UserLine;
  } catch {
    return undefined; // a truncated or malformed transcript line is skipped, never fatal
  }
  if (line?.type !== 'user' || line.isMeta === true || line.isSidechain === true) return undefined;
  const content = line.message?.content;
  const blocks = Array.isArray(content) ? (content as { type?: unknown }[]) : [];
  const isPrompt =
    typeof content === 'string' || (blocks.some((b) => b?.type === 'text') && !blocks.some((b) => b?.type === 'tool_result'));
  const at = typeof line.timestamp === 'string' ? Date.parse(line.timestamp) : Number.NaN;
  return isPrompt && Number.isFinite(at) ? at : undefined;
}

function readTranscript(file: string | undefined): Transcript | undefined {
  if (!file) return undefined;
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return undefined; // an unreadable transcript counts as missing, never as zero turns
  }
  const out: Transcript = { turns: [], pauses: [] };
  const seen = new Set<string>();
  let lastResponse: number | undefined;
  text.split('\n').forEach((raw, n) => {
    const r = mainResponse(raw);
    if (r && r.at > 0) {
      out.firstSize ??= r.size;
      if (r.agent) out.agentSize ??= r.size;
      lastResponse = r.at;
      const key = r.id || `line ${n}`;
      if (!seen.has(key)) out.turns.push(r.at);
      seen.add(key);
      return;
    }
    const at = r ? undefined : promptAt(raw);
    if (at !== undefined && lastResponse !== undefined) out.pauses.push((at - lastResponse) / MINUTE);
  });
  return out;
}

/** Main turns in (lo, hi]. */
const turnsIn = (data: Transcript, lo: number, hi: number) => data.turns.filter((t) => t > lo && t <= hi).length;

function readCostEntries(specDir: string): CostEntry[] {
  const file = logPath(specDir, 'costs.yml');
  try {
    return existsSync(file) ? parseCosts(readFileSync(file, 'utf8')) : [];
  } catch {
    return []; // a malformed log measures nothing rather than throwing
  }
}

/** The distinct Claude Code sessions of the cost log, each with its records in time order. */
function readSessions(specDir: string, home: string | undefined): Session[] {
  const byId = new Map<string, Session['records']>();
  for (const e of readCostEntries(specDir)) {
    const at = Date.parse(e.at);
    if (e.harness !== 'claude' || !e.session || !Number.isFinite(at)) continue;
    byId.set(e.session, [...(byId.get(e.session) ?? []), { command: e.command, at }]);
  }
  return [...byId].map(([id, records]) => ({
    id,
    records: records.sort((a, b) => a.at - b.at),
    data: readTranscript(findClaudeTranscript(id, home)),
  }));
}

/** A command's window runs from the session's previous record (or its first response) to its own record. */
function windowsOf(sessions: Session[]): Window[] {
  return sessions.flatMap((s) => {
    const first = s.data?.turns[0];
    const start = first !== undefined ? first - 1 : Number.NEGATIVE_INFINITY;
    return s.records.map((r, i) => ({ command: r.command, lo: i === 0 ? start : s.records[i - 1]!.at, hi: r.at, data: s.data }));
  });
}

interface TaskTurns {
  tasks: Record<string, number>;
  unmeasured: string[];
  tail: number;
}

/** Each task's window ends at its last commit, from the previous task's end or the implement window's start. */
function taskTurns(windows: Window[], commitTimes: Map<string, number[]>): TaskTurns {
  const implement = windows.filter((w) => w.command === 'implement');
  const placed = new Map<Window, { task: string; end: number }[]>();
  const unmeasured: string[] = [];
  const ends = [...commitTimes].flatMap(([task, times]) => (times.length ? [{ task, end: Math.max(...times) }] : []));
  for (const t of ends.sort((a, b) => a.end - b.end)) {
    // A missing session's first window is open at -Infinity: prefer a window with data, so it claims no
    // commit a measured session holds; a commit only it holds stays uncounted and out of `unmeasured` (D2).
    const holds = (x: Window) => t.end > x.lo && t.end <= x.hi;
    const w = implement.find((x) => x.data && holds(x)) ?? implement.find(holds);
    if (w) placed.set(w, [...(placed.get(w) ?? []), t]);
    else unmeasured.push(t.task);
  }
  const out: TaskTurns = { tasks: {}, unmeasured, tail: 0 };
  for (const w of implement) {
    if (!w.data) continue;
    let from = w.lo;
    for (const t of placed.get(w) ?? []) {
      out.tasks[t.task] = turnsIn(w.data, from, t.end);
      from = t.end;
    }
    out.tail += turnsIn(w.data, from, w.hi);
  }
  return out;
}

/** The turns of a command's windows; undefined when it has none or one of them has no transcript. */
function commandTurns(windows: Window[], command: string): number | undefined {
  const own = windows.filter((w) => w.command === command);
  if (!own.length || own.some((w) => !w.data)) return undefined;
  return own.reduce((n, w) => n + turnsIn(w.data!, w.lo, w.hi), 0);
}

function closeTurns(windows: Window[]): SessionMeasure['close'] {
  if (!windows.some((w) => w.command === 'close')) return 'not recorded';
  return commandTurns(windows, 'close') ?? 'not measured';
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Pause buckets of the ADR 0036 addendum: at most 5 minutes, 5 to 60, over 60, and the median. */
function pausesOf(sessions: Session[]): Pauses | undefined {
  const measured = sessions.filter((s) => s.data);
  if (!measured.length) return undefined;
  const all = measured.flatMap((s) => s.data!.pauses).sort((a, b) => a - b);
  const out: Pauses = {
    count: all.length,
    atMost5: all.filter((p) => p <= 5).length,
    between5And60: all.filter((p) => p > 5 && p <= 60).length,
    over60: all.filter((p) => p > 60).length,
  };
  if (all.length) out.medianMinutes = Math.round(median(all) * 10) / 10;
  return out;
}

const RELOAD_COMMANDS = new Set(['implement', 'verify']);

function reloadOf(sessions: Session[]): number | undefined {
  const reloads = sessions.flatMap((s) => {
    const d = s.data;
    if (!d || !RELOAD_COMMANDS.has(s.records[0]?.command ?? '') || d.firstSize === undefined || d.agentSize === undefined) return [];
    return [d.agentSize - d.firstSize];
  });
  return reloads.length ? Math.round(reloads.reduce((a, b) => a + b, 0) / reloads.length) : undefined;
}

/** Each logged estimate against the main turns after its time up to the close record, across the sessions. */
function estimatesOf(specDir: string, sessions: Session[]): CutEstimateActual[] {
  const file = logPath(specDir, 'session-cuts.md');
  let text: string;
  try {
    text = existsSync(file) ? readFileSync(file, 'utf8') : '';
  } catch {
    text = ''; // an unreadable cut log has no estimates to compare, which is not an error of the measure
  }
  const closes = sessions.flatMap((s) => s.records.filter((r) => r.command === 'close').map((r) => r.at));
  const closeAt = closes.length ? Math.max(...closes) : undefined;
  return parseCutEstimates(text).map((row) => {
    const from = Date.parse(row.at);
    const out: CutEstimateActual = { at: row.at, task: row.task, estimated: row.turnsLeft };
    const unknown = closeAt === undefined || sessions.some((s) => !s.data && s.records.some((r) => r.at > from));
    if (!unknown) out.actual = sessions.reduce((n, s) => n + (s.data ? turnsIn(s.data, from, closeAt) : 0), 0);
    return out;
  });
}

/**
 * Measures a spec's Claude Code sessions. `commitTimes` is what `taskCommitTimes` returns for the spec;
 * `home` is Claude Code's config folder (default `$CLAUDE_CONFIG_DIR` or `~/.claude`).
 */
export function measureSessions(input: { specDir: string; commitTimes: Map<string, number[]>; home?: string }): SessionMeasure {
  const sessions = readSessions(input.specDir, input.home);
  const windows = windowsOf(sessions);
  const { tasks, unmeasured, tail } = taskTurns(windows, input.commitTimes);
  const verify = commandTurns(windows, 'verify');
  const close = closeTurns(windows);
  const after = windows.filter((w) => w.command === 'implement' || w.command === 'verify' || w.command === 'close');
  const out: SessionMeasure = { missing: sessions.filter((s) => !s.data).map((s) => s.id), tasks, unmeasured, close, estimates: [] };
  const pauses = pausesOf(sessions);
  if (pauses) out.pauses = pauses;
  if (verify !== undefined) out.verify = verify;
  if (after.length && after.every((w) => w.data)) out.afterTasks = tail + (verify ?? 0) + (typeof close === 'number' ? close : 0);
  const reload = reloadOf(sessions);
  if (reload !== undefined) out.reload = reload;
  out.estimates = estimatesOf(input.specDir, sessions);
  return out;
}
