import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { type TelemetryEvent, telemetryEventSchema } from '../spec/telemetry.js';
import { snapshot, writeFromSnapshot } from '../writer/files.js';
import { logPath } from './spec-log.js';

const PREFIX = '<!-- mandao:telemetry ';

/** Reads script-owned telemetry rows from execution.md; unrelated prose and legacy logs are ignored. */
export function readTelemetryEvents(specDir: string): TelemetryEvent[] {
  const file = logPath(specDir, 'execution.md');
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.startsWith(PREFIX) && line.endsWith(' -->'))
    .map((line) => telemetryEventSchema.parse(JSON.parse(line.slice(PREFIX.length, -4))));
}

/** Appends one timestamped event without changing the execution table or any prior event. */
export function appendTelemetryEvent(specDir: string, spec: string, input: Omit<TelemetryEvent, 'at'> & { at?: string }): TelemetryEvent {
  const file = logPath(specDir, 'execution.md');
  const snap = snapshot(file);
  const content =
    snap.content ??
    `---\nschema_version: 1\nspec: ${spec}\n---\n\n# Execution — ${spec}\n\n## Log\n\n| Date | Task | Attempt | Tier | Harness | Implementer | Reviewer | Verdict | Notes |\n|---|---|---|---|---|---|---|---|---|\n`;
  const earlier = content
    .split('\n')
    .filter((line) => line.startsWith(PREFIX) && line.endsWith(' -->'))
    .map((line) => telemetryEventSchema.parse(JSON.parse(line.slice(PREFIX.length, -4))))
    .find((row) => row.id === input.id && row.type === input.type);
  if (earlier) {
    const { at: _previousAt, ...previous } = earlier;
    const { at: _inputAt, ...requested } = input;
    const sameData =
      Object.keys(previous).length === Object.keys(requested).length &&
      Object.entries(previous).every(([key, value]) => requested[key as keyof typeof requested] === value);
    if (!sameData) {
      throw new Error(`telemetry event ${input.type} with id ${input.id} already exists with different data`);
    }
    return earlier;
  }
  const event = telemetryEventSchema.parse({ ...input, at: input.at ?? new Date().toISOString() });
  const marker = `${PREFIX}${JSON.stringify(event)} -->`;
  const section = content.includes('## Telemetry') ? '' : `${content.endsWith('\n') ? '' : '\n'}\n## Telemetry\n\n`;
  writeFromSnapshot(snap, `${content}${section}${marker}\n`);
  return event;
}

/** Creates a stable id for one paired lifecycle interval. */
export const telemetryId = () => randomUUID();

/** Measures a runner gate and closes its span even when the underlying runner throws. */
export async function measureGate<T>(specDir: string, spec: string, gate: string, runGate: () => Promise<T>): Promise<T> {
  const run = telemetryId();
  const id = telemetryId();
  appendTelemetryEvent(specDir, spec, { id, run, type: 'gate_start', command: 'implement', subject: gate });
  try {
    return await runGate();
  } finally {
    appendTelemetryEvent(specDir, spec, { id, run, type: 'gate_end', command: 'implement', subject: gate });
  }
}
