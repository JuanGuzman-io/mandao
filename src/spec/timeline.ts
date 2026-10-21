import type { Approval } from './approvals.js';
import type { ExecutionRow } from './execution.js';

export type TimelineEntry =
  | { at: string; kind: 'approval'; step: Approval['step']; by: string; note?: string }
  | { at: string; kind: 'execution'; task: string; attempt: number; verdict: ExecutionRow['verdict']; notes?: string };

/** Unparsable dates go last, in their own order. */
const time = (at: string) => {
  const t = Date.parse(at);
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
};

/**
 * The spec's history as one list (C-1): the approvals merged into the execution rows by date. Nothing is
 * stored twice: the caller reads both logs and nothing is written. `shown` rows are not approvals and stay
 * out. On the same instant, execution rows keep their log order and come before the approvals.
 */
export function timeline(rows: ExecutionRow[], approvals: Approval[]): TimelineEntry[] {
  const executions = rows.map(
    (r): TimelineEntry => ({
      at: r.date,
      kind: 'execution',
      task: r.task,
      attempt: r.attempt,
      verdict: r.verdict,
      ...(r.notes ? { notes: r.notes } : {}),
    }),
  );
  const approved = approvals
    .filter((a) => a.step !== 'shown')
    .map((a): TimelineEntry => ({ at: a.at, kind: 'approval', step: a.step, by: a.by, ...(a.note ? { note: a.note } : {}) }));
  return [...executions, ...approved]
    .map((entry, i) => ({ entry, i, t: time(entry.at) }))
    .sort((a, b) => a.t - b.t || a.i - b.i)
    .map((x) => x.entry);
}
