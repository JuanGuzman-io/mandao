import { basename, join } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { findSpec } from '../scripts/spec.js';
import { appendTelemetryEvent, telemetryId } from '../scripts/telemetry.js';
import { type TelemetryEvent, telemetryEventSchema } from '../spec/telemetry.js';
import type { CliContext } from './context.js';

/** Commands that belong to no spec yet (an intake): their log lives under `.mandao/log/`, never in the spec tree (phase 16). */
const WORKSPACE_LOG = 'workspace';

import { json } from './json.js';

const TYPES: TelemetryEvent['type'][] = [
  'command_start',
  'command_end',
  'asked',
  'answered',
  'agent_start',
  'agent_end',
  'gate_start',
  'gate_end',
];

interface EventOptions {
  command?: string;
  run?: string;
  id?: string;
  question?: string;
  subject?: string;
}

function eventIds(type: TelemetryEvent['type'], options: EventOptions): { run: string; id: string } {
  if (!options.command) throw new Error(`${type} needs --command <name>`);
  const run = options.run ?? (type === 'command_start' ? telemetryId() : undefined);
  if (!run) throw new Error(`${type} needs --run <id>`);
  const paired =
    type === 'command_start' || type === 'command_end'
      ? run
      : (options.id ?? (type.endsWith('_start') || type === 'asked' ? telemetryId() : undefined));
  if (!paired) throw new Error(`${type} needs --id <id> for its matching start event`);
  if ((type === 'asked' || type === 'answered') && !options.question) {
    throw new Error(`${type} needs --question product|external|technical`);
  }
  return { run, id: paired };
}

function recordEvent(ctx: CliContext, ref: string, inputType: string, options: EventOptions): void {
  const type = telemetryEventSchema.shape.type.parse(inputType);
  if (!TYPES.includes(type)) throw new Error(`unknown telemetry event: ${inputType}`);
  const config = readConfig(ctx.root());
  const dir =
    ref === 'quick'
      ? join(ctx.root(), config.paths.specs, 'quick')
      : ref === WORKSPACE_LOG
        ? join(ctx.root(), '.mandao', 'log')
        : findSpec(ctx.root(), config, ref);
  const spec = { name: basename(dir), dir };
  const { run, id } = eventIds(type, options);
  const question = options.question ? telemetryEventSchema.shape.question.parse(options.question) : undefined;
  const event = appendTelemetryEvent(spec.dir, spec.name, {
    id,
    run,
    type,
    command: options.command!,
    ...(question ? { question } : {}),
    ...(options.subject ? { subject: options.subject } : {}),
  });
  json({
    event,
    ...(type === 'command_start' ? { runId: run } : {}),
    ...(['asked', 'agent_start', 'gate_start'].includes(type) ? { id } : {}),
  });
}

/** Register script-stamped lifecycle events for a spec command. */
export function registerTelemetry(run: Command, ctx: CliContext) {
  run
    .command('event <spec> <type>')
    .description('Record a script-timestamped lifecycle event for Kaizen')
    .option('--command <name>', 'command being measured')
    .option('--run <id>', 'command run id, required except for command_start')
    .option('--id <id>', 'paired question, agent, gate or command interval id')
    .option('--question <class>', 'product | external | technical')
    .option('--subject <text>', 'short event label; never include prompt text')
    .action((ref: string, type: string, options: EventOptions) => recordEvent(ctx, ref, type, options));
}
