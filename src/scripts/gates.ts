import { GATES } from '../schemas/index.js';
import type { TestRun } from './run-tests.js';

/** Level 0 order (rules/review.md): cheap checks first; `test` means the impacted tests. */
export const GATE_ORDER = GATES;

export type GateStatus = 'PASS' | 'FAIL' | 'NOT_INSTALLED' | 'TIMEOUT' | 'DEFERRED' | 'SKIPPED';

export interface GateResult {
  gate: string;
  status: GateStatus;
  exitCode?: number;
  /** Only on a failure: the last lines that say why. The whole output stays in `_log/`. */
  excerpt?: string;
  reason?: string;
}

const EXCERPT_LINES = 20;

/** The last non-empty lines of an output, enough to say why a gate failed. */
export function excerpt(output: string | undefined, lines = EXCERPT_LINES): string {
  return (output ?? '')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter(Boolean)
    .slice(-lines)
    .join('\n');
}

/** One gate run as a result: a missing tool is `NOT_INSTALLED`, never a pass and never a product failure. */
export function gateResult(gate: string, run: TestRun): GateResult {
  if (run.status === 'DEFERRED_TO_CI' || run.status === 'QUEUE_TIMEOUT') return { gate, status: 'DEFERRED', reason: run.reason };
  if (run.status === 'TIMEOUT') return { gate, status: 'TIMEOUT', reason: run.reason, excerpt: excerpt(run.output) };
  const missing = run.exitCode === 127 || /command not found|not recognized as an internal/i.test(run.output ?? '');
  if (missing) return { gate, status: 'NOT_INSTALLED', exitCode: run.exitCode ?? 127 };
  if (run.status === 'PASS') return { gate, status: 'PASS', exitCode: 0 };
  return { gate, status: 'FAIL', ...(run.exitCode !== undefined ? { exitCode: run.exitCode } : {}), excerpt: excerpt(run.output) };
}

/** A failed gate blocks the review; a tool that is not installed or a deferred run is reported, not failed. */
export const gatesPassed = (results: GateResult[]) => results.every((r) => r.status !== 'FAIL' && r.status !== 'TIMEOUT');

/** The `_log/gates/<Tn>-<attempt>.md` file: what the Reviewer and verify read instead of re-running. */
export function gatesLog(
  task: string,
  attempt: number,
  results: GateResult[],
  outputs: Record<string, string>,
  notConfigured: string[],
): string {
  const rows = results.map((r) => `| ${r.gate} | ${r.status} | ${r.exitCode ?? '—'} |`);
  const blocks = results
    .filter((r) => outputs[r.gate])
    .map((r) => [`### ${r.gate} — ${r.status}`, '', '```', outputs[r.gate]!.trimEnd(), '```', ''].join('\n'));
  return [
    `# Gates — ${task}, attempt ${attempt}`,
    '',
    `${gatesPassed(results) ? 'Every configured gate passed' : 'A gate failed'}${notConfigured.length ? `; not configured: ${notConfigured.join(', ')}` : ''}.`,
    '',
    '| Gate | Status | Exit |',
    '|---|---|---|',
    ...rows,
    '',
    '## Output',
    '',
    ...blocks,
  ].join('\n');
}
