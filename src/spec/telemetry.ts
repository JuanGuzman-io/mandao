import { z } from 'zod';

/** Script-stamped lifecycle facts used for elapsed-time Kaizen; no time is inferred from missing events. */
export const telemetryEventSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['command_start', 'command_end', 'asked', 'answered', 'agent_start', 'agent_end', 'gate_start', 'gate_end']),
  at: z.string().datetime(),
  command: z.string().min(1),
  run: z.string().min(1),
  question: z.enum(['product', 'external', 'technical']).optional(),
  subject: z.string().optional(),
});
export type TelemetryEvent = z.infer<typeof telemetryEventSchema>;

export interface CommandDuration {
  command: string;
  runs: number;
  activeMs: number;
  userWaitMs: number;
  agentWaitMs: number;
  gateMs: number;
  incomplete: number;
}

type Interval = { start: number; end: number };
const ms = (event: TelemetryEvent) => Date.parse(event.at);

function intervals(events: TelemetryEvent[], startType: TelemetryEvent['type'], endType: TelemetryEvent['type']): Map<string, Interval[]> {
  const starts = new Map<string, number>();
  const result = new Map<string, Interval[]>();
  for (const event of events) {
    const key = `${event.run}:${event.id}`;
    if (event.type === startType) starts.set(key, ms(event));
    if (event.type === endType) {
      const start = starts.get(key);
      if (start !== undefined && ms(event) >= start) {
        const list = result.get(event.run) ?? [];
        list.push({ start, end: ms(event) });
        result.set(event.run, list);
        starts.delete(key);
      }
    }
  }
  return result;
}

function unionDuration(items: Interval[]): number {
  const ordered = [...items].sort((a, b) => a.start - b.start);
  let total = 0;
  let start: number | undefined;
  let end = 0;
  for (const item of ordered) {
    if (start === undefined) {
      start = item.start;
      end = item.end;
    } else if (item.start <= end) end = Math.max(end, item.end);
    else {
      total += end - start;
      start = item.start;
      end = item.end;
    }
  }
  return start === undefined ? 0 : total + end - start;
}

function within(items: Interval[], start: number, end: number): Interval[] {
  return items.flatMap((item) => {
    const clipped = { start: Math.max(start, item.start), end: Math.min(end, item.end) };
    return clipped.end > clipped.start ? [clipped] : [];
  });
}

/** Summarizes complete command windows and paired waits. Unanswered questions and unfinished runs remain unknown. */
export function summarizeTelemetry(events: TelemetryEvent[]): CommandDuration[] {
  const userWait = intervals(events, 'asked', 'answered');
  const agentWait = intervals(events, 'agent_start', 'agent_end');
  const rows = commandRows(events, userWait, agentWait);
  const byCommand = aggregateRows(rows);
  for (const [command, duration] of gateDurations(events)) {
    const total = byCommand.get(command) ?? emptyDuration(command);
    total.gateMs = duration;
    byCommand.set(command, total);
  }
  return [...byCommand.values()].sort((a, b) => a.command.localeCompare(b.command));
}

const emptyDuration = (command: string): CommandDuration => ({
  command,
  runs: 0,
  activeMs: 0,
  userWaitMs: 0,
  agentWaitMs: 0,
  gateMs: 0,
  incomplete: 0,
});

function commandRows(events: TelemetryEvent[], userWait: Map<string, Interval[]>, agentWait: Map<string, Interval[]>): CommandDuration[] {
  const starts = new Map<string, TelemetryEvent>();
  const rows: CommandDuration[] = [];
  for (const event of events) {
    if (event.type === 'command_start') starts.set(event.run, event);
    if (event.type === 'command_end') addCompletedCommand(event, starts, userWait, agentWait, rows);
  }
  for (const event of starts.values()) rows.push({ ...emptyDuration(event.command), incomplete: 1 });
  return rows;
}

function addCompletedCommand(
  event: TelemetryEvent,
  starts: Map<string, TelemetryEvent>,
  userWait: Map<string, Interval[]>,
  agentWait: Map<string, Interval[]>,
  rows: CommandDuration[],
): void {
  const start = starts.get(event.run);
  if (!start || start.command !== event.command || ms(event) < ms(start)) return;
  const from = ms(start);
  const to = ms(event);
  const userIntervals = within(userWait.get(event.run) ?? [], from, to);
  const agentIntervals = within(agentWait.get(event.run) ?? [], from, to);
  const user = unionDuration(userIntervals);
  const agent = unionDuration(agentIntervals);
  const waits = unionDuration([...userIntervals, ...agentIntervals]);
  rows.push({
    ...emptyDuration(event.command),
    runs: 1,
    activeMs: to - from - waits,
    userWaitMs: user,
    agentWaitMs: agent,
  });
  starts.delete(event.run);
}

function gateDurations(events: TelemetryEvent[]): Map<string, number> {
  const starts = new Map<string, TelemetryEvent>();
  const durations = new Map<string, number>();
  for (const event of events) {
    const key = `${event.run}:${event.id}`;
    if (event.type === 'gate_start') starts.set(key, event);
    if (event.type !== 'gate_end') continue;
    const start = starts.get(key);
    if (start && ms(event) >= ms(start)) durations.set(event.command, (durations.get(event.command) ?? 0) + ms(event) - ms(start));
    starts.delete(key);
  }
  return durations;
}

function aggregateRows(rows: CommandDuration[]): Map<string, CommandDuration> {
  const byCommand = new Map<string, CommandDuration>();
  for (const row of rows) {
    const total = byCommand.get(row.command) ?? emptyDuration(row.command);
    total.runs += row.runs;
    total.activeMs += row.activeMs;
    total.userWaitMs += row.userWaitMs;
    total.agentWaitMs += row.agentWaitMs;
    total.incomplete += row.incomplete;
    byCommand.set(row.command, total);
  }
  return byCommand;
}

export interface HistoricalCost {
  spec: string;
  command: string;
  at: string;
  usd: number;
  session?: string;
  cumulative?: Record<string, number>;
  basis?: 'billed' | 'equivalent' | 'unknown';
}

export interface CorrectedHistoricalCosts {
  byBasis: Record<
    'billed' | 'equivalent' | 'unknown',
    {
      rawUsd: number;
      correctedUsd: number;
      duplicateUsd: number;
      byCommand: Record<string, number>;
      bySpec: Record<string, number>;
      rawBySpec: Record<string, number>;
      bySpecCommand: Record<string, Record<string, number>>;
      rawBySpecCommand: Record<string, Record<string, number>>;
    }
  >;
}

/** Ignores one unit of USD precision drift between transcript snapshots and rounded cost entries. */
export function historicalDuplicateAmount(raw: number, corrected: number): number {
  const difference = Math.round((raw - corrected) * 10_000) / 10_000;
  return difference <= 0.0001 ? 0 : difference;
}

/** Re-derives old session rows from cumulative role snapshots; source logs are never rewritten. */
export function correctHistoricalCosts(entries: HistoricalCost[]): CorrectedHistoricalCosts {
  const ordered = [...entries].sort((a, b) => a.at.localeCompare(b.at));
  const previous = new Map<string, Record<string, number>>();
  const byBasis = emptyCostBases();
  for (const entry of ordered) addHistoricalCost(byBasis[entry.basis ?? 'unknown'], previous, entry);
  for (const basis of Object.values(byBasis)) {
    basis.rawUsd = Math.round(basis.rawUsd * 10_000) / 10_000;
    basis.correctedUsd = Math.round(basis.correctedUsd * 10_000) / 10_000;
    basis.duplicateUsd = historicalDuplicateAmount(basis.rawUsd, basis.correctedUsd);
    for (const totals of [basis.byCommand, basis.bySpec, basis.rawBySpec]) {
      for (const [key, value] of Object.entries(totals)) totals[key] = Math.round(value * 10_000) / 10_000;
    }
    roundNested(basis.bySpecCommand);
    roundNested(basis.rawBySpecCommand);
  }
  return { byBasis };
}

function emptyCostBases(): CorrectedHistoricalCosts['byBasis'] {
  const empty = () => ({
    rawUsd: 0,
    correctedUsd: 0,
    duplicateUsd: 0,
    byCommand: {},
    bySpec: {},
    rawBySpec: {},
    bySpecCommand: {},
    rawBySpecCommand: {},
  });
  return { billed: empty(), equivalent: empty(), unknown: empty() };
}

function addHistoricalCost(
  basis: CorrectedHistoricalCosts['byBasis']['billed'],
  previous: Map<string, Record<string, number>>,
  entry: HistoricalCost,
): void {
  basis.rawUsd += entry.usd;
  basis.rawBySpec[entry.spec] = (basis.rawBySpec[entry.spec] ?? 0) + entry.usd;
  addNested(basis.rawBySpecCommand, entry.spec, entry.command, entry.usd);
  const amount = incrementalCost(entry, previous);
  basis.correctedUsd += amount;
  basis.byCommand[entry.command] = (basis.byCommand[entry.command] ?? 0) + amount;
  basis.bySpec[entry.spec] = (basis.bySpec[entry.spec] ?? 0) + amount;
  addNested(basis.bySpecCommand, entry.spec, entry.command, amount);
}

function addNested(values: Record<string, Record<string, number>>, row: string, column: string, amount: number): void {
  const commands = values[row] ?? {};
  commands[column] = (commands[column] ?? 0) + amount;
  values[row] = commands;
}

function roundNested(values: Record<string, Record<string, number>>): void {
  for (const commands of Object.values(values)) {
    for (const [command, value] of Object.entries(commands)) commands[command] = Math.round(value * 10_000) / 10_000;
  }
}

function incrementalCost(entry: HistoricalCost, previous: Map<string, Record<string, number>>): number {
  if (!entry.session || !entry.cumulative) return entry.usd;
  const roles = Object.fromEntries(Object.entries(entry.cumulative).filter(([role]) => !role.startsWith('model:')));
  const key = `${entry.session}:${entry.basis ?? 'unknown'}`;
  const before = previous.get(key) ?? {};
  previous.set(key, roles);
  if (!Object.keys(before).length) return entry.usd;
  const delta = Object.entries(roles).reduce((sum, [role, total]) => sum + Math.max(0, total - (before[role] ?? 0)), 0);
  return Math.round(Math.min(entry.usd, delta) * 10_000) / 10_000;
}
