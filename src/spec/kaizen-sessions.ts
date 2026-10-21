import { RELOAD_TOKENS, TURNS_AFTER_TASKS, TURNS_PER_TASK } from '../scripts/session-cut.js';
import type { SessionMeasure } from '../scripts/session-turns.js';

export interface SessionCutInput {
  spec: string;
  measure: SessionMeasure;
}

export interface ConstantComparison {
  constant: number;
  /** Mean of the measurements; absent when nothing was measured. */
  measured?: number;
  /** Sample size: the specs with a measurement for this constant. */
  n: number;
  /** A new value, only when the difference is over `PROPOSAL_THRESHOLD` and `n` reaches the minimum. */
  proposal?: number;
  result?: string;
}

export interface EstimateRow {
  spec: string;
  at: string;
  task: string;
  estimated: number;
  actual?: number;
}

export interface SessionCutKaizen {
  turnsPerTask: ConstantComparison;
  turnsAfterTasks: ConstantComparison;
  reloadTokens: ConstantComparison;
  /** `meanError` is the mean absolute error over the rows with an actual. */
  estimates: { rows: EstimateRow[]; meanError?: number };
}

/** D4: propose only when the measurement differs by more than this share. */
const PROPOSAL_THRESHOLD = 0.2;

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function compare(constant: number, values: number[], specs: number, minSpecs: number): ConstantComparison {
  if (!values.length) return { constant, n: 0, result: `insufficient data (minimum ${minSpecs})` };
  const measured = mean(values);
  const base = { constant, measured: round(measured), n: specs };
  if (specs < minSpecs) return { ...base, result: `insufficient data (minimum ${minSpecs})` };
  if (Math.abs(measured - constant) / constant <= PROPOSAL_THRESHOLD) return base;
  return { ...base, proposal: Math.round(measured) };
}

/**
 * Kaizen's session-cut view across specs: each constant of the cut rule next to what was measured, and the
 * logged estimates of turns left next to the turns that followed. Advice only: Mandao never changes the
 * constants. Below `minSpecs` specs it shows the numbers and proposes nothing.
 */
export function sessionCutKaizen(inputs: SessionCutInput[], minSpecs = 3): SessionCutKaizen {
  const measures = inputs.map((i) => i.measure);
  const perSpecTasks = measures.map((m) => Object.values(m.tasks));
  const taskTurns = perSpecTasks.flat();
  // D4: only specs with verify and close recorded; close runs this before its own record exists.
  const afterTasks = measures.flatMap((m) =>
    m.verify !== undefined && typeof m.close === 'number' && m.afterTasks !== undefined ? [m.afterTasks] : [],
  );
  const reloads = measures.flatMap((m) => (m.reload === undefined ? [] : [m.reload]));
  const rows: EstimateRow[] = inputs.flatMap(({ spec, measure }) => measure.estimates.map((e) => ({ spec, ...e })));
  const errors = rows.flatMap((r) => (r.actual === undefined ? [] : [Math.abs(r.actual - r.estimated)]));
  return {
    turnsPerTask: compare(TURNS_PER_TASK, taskTurns, perSpecTasks.filter((t) => t.length).length, minSpecs),
    turnsAfterTasks: compare(TURNS_AFTER_TASKS, afterTasks, afterTasks.length, minSpecs),
    reloadTokens: compare(RELOAD_TOKENS, reloads, reloads.length, minSpecs),
    estimates: { rows, ...(errors.length ? { meanError: round(mean(errors)) } : {}) },
  };
}
