import { GATES } from '../schemas/index.js';
import type { TestRun } from './run-tests.js';

/** Level 0 order (rules/review.md): cheap checks first; `test` means the impacted tests. */
export const GATE_ORDER = GATES;

export type GateStatus = 'PASS' | 'FAIL' | 'NOT_INSTALLED' | 'TIMEOUT' | 'DEFERRED' | 'SKIPPED';

export interface GateResult {
  gate: string;
  status: GateStatus;
  exitCode?: number;
  /** Only on a failure: the last lines that say why. The whole output stays in `_log/` (version 2: the local cache). */
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
  // Exit status is authoritative: a successful wrapper may legitimately print a missing-tool string.
  if (run.status === 'PASS') return { gate, status: 'PASS', exitCode: 0 };
  const missing = run.exitCode === 127 || /command not found|not recognized as an internal/i.test(run.output ?? '');
  if (missing) return { gate, status: 'NOT_INSTALLED', exitCode: run.exitCode ?? 127 };
  return { gate, status: 'FAIL', ...(run.exitCode !== undefined ? { exitCode: run.exitCode } : {}), excerpt: excerpt(run.output) };
}

/** A failed gate blocks the review; a tool that is not installed or a deferred run is reported, not failed. */
export const gatesPassed = (results: GateResult[]) => results.every((r) => r.status !== 'FAIL' && r.status !== 'TIMEOUT');

/** Lines of a failing gate's output kept in a version 2 `gates.md`; the whole output stays in the local cache. */
export const GATE_LOG_LINES = 40;

/**
 * The lines of a failing gate's output that name one of the task's files, at most `GATE_LOG_LINES`. When
 * no line names them, the last lines instead, so a failure is never recorded without its reason.
 */
export function taskLines(output: string, files: string[]): { lines: string[]; total: number; named: boolean } {
  const all = output
    .split('\n')
    .map((l) => l.trimEnd())
    .filter(Boolean);
  const wanted = files.map((f) => f.split('\\').join('/')).filter(Boolean);
  const named = all.filter((l) => wanted.some((f) => l.split('\\').join('/').includes(f)));
  if (named.length) return { lines: named.slice(0, GATE_LOG_LINES), total: named.length, named: true };
  return { lines: all.slice(-GATE_LOG_LINES), total: all.length, named: false };
}

/** An earlier attempt's section of `gates.md`, to point at instead of repeating the same lines. */
export interface EarlierGates {
  attempt: number;
  section: string;
}

/** The lines an earlier section kept for a gate, when it kept them itself (not as a pointer). */
function keptLines(section: string, gate: string): string | undefined {
  const head = section.split('\n').findIndex((l) => l.startsWith(`### ${gate} — `));
  if (head < 0 || section.split('\n')[head + 2] !== '```') return undefined;
  const rest = section.split('\n').slice(head + 3);
  return rest.slice(0, rest.indexOf('```')).join('\n');
}

function failureBlock(r: GateResult, output: string, files: string[], earlier: EarlierGates[]): string {
  const cut = taskLines(output, files);
  const same = earlier.find((e) => keptLines(e.section, r.gate) === cut.lines.join('\n'));
  // The log must not grow with attempts: the same failing lines again point at the attempt that kept them.
  if (same) return [`### ${r.gate} — ${r.status}: the same ${cut.lines.length} lines as attempt ${same.attempt}`, ''].join('\n');
  const what = cut.named
    ? `${cut.lines.length} of ${cut.total} lines naming the task's files`
    : `no line names the task's files: the last ${cut.lines.length} of ${cut.total} lines`;
  return [`### ${r.gate} — ${r.status} (${what})`, '', '```', ...cut.lines, '```', ''].join('\n');
}

/**
 * One attempt's section of a version 2 `_log/gates.md`: the status table and, for failing gates only, the
 * lines of their output about the task's files (or a pointer to the earlier attempt that kept the same
 * lines). A gate that is not installed is named once, in the table.
 */
export function gatesSection(
  results: GateResult[],
  outputs: Record<string, string>,
  notConfigured: string[],
  files: string[],
  earlier: EarlierGates[] = [],
): string {
  const failed = results.filter((r) => r.status === 'FAIL' || r.status === 'TIMEOUT');
  const blocks = failed.map((r) => failureBlock(r, outputs[r.gate] ?? r.excerpt ?? '', files, earlier));
  return [...statusTable(results, notConfigured), ...blocks].join('\n');
}

/** The verdict line and the status table, the same in both layouts: what the review pack reads. */
function statusTable(results: GateResult[], notConfigured: string[]): string[] {
  return [
    `${gatesPassed(results) ? 'Every configured gate passed' : 'A gate failed'}${notConfigured.length ? `; not configured: ${notConfigured.join(', ')}` : ''}.`,
    '',
    '| Gate | Status | Exit |',
    '|---|---|---|',
    ...results.map((r) => `| ${r.gate} | ${r.status} | ${r.exitCode ?? '—'} |`),
    '',
  ];
}

/**
 * `_log/gates/<Tn>-<attempt>.md` in a version 1 spec, the full output in the local cache of a version 2
 * spec: what the Reviewer and verify read instead of re-running.
 */
export function gatesLog(
  task: string,
  attempt: number,
  results: GateResult[],
  outputs: Record<string, string>,
  notConfigured: string[],
): string {
  const blocks = results
    .filter((r) => outputs[r.gate])
    .map((r) => [`### ${r.gate} — ${r.status}`, '', '```', outputs[r.gate]!.trimEnd(), '```', ''].join('\n'));
  return [`# Gates — ${task}, attempt ${attempt}`, '', ...statusTable(results, notConfigured), '## Output', '', ...blocks].join('\n');
}
