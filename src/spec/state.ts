import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { z } from 'zod';
import { approvalSchema } from './approvals.js';
import { progressSchema } from './progress.js';

/** `start`: the request `mandao start` recorded for the first command (version 1: `start.yml`). */
export const startSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  type: z.string().optional(),
  lane: z.string().optional(),
  branch: z.string().optional(),
  base: z.string().optional(),
  created_at: z.string().optional(),
});

/** `baseline`: the cheap gates on the clean worktree before any change (version 1: `baseline.md`). */
export const baselineSchema = z.object({
  /** The one-line verdict: green, or red with "these failures are not the spec's". */
  text: z.string(),
  at: z.string().optional(),
  gates: z.array(z.object({ project: z.string(), gate: z.string(), result: z.string() })).default([]),
  /** Only the red gates, each with the excerpt of its output. */
  failures: z.array(z.object({ project: z.string(), gate: z.string(), output: z.string() })).default([]),
});

/** `cut_estimates`: one row per session-cut estimate at a task boundary, for Kaizen (version 1: `session-cuts.md`). */
export const cutEstimateSchema = z.object({
  at: z.string().min(1),
  task: z.string().min(1),
  /** Stable identity of the task or workflow boundary; absent on historical estimates. */
  boundary_id: z.string().min(1).optional(),
  /** True only for the first cut suggestion emitted at this boundary. */
  suggested: z.boolean().optional(),
  context: z.number(),
  base: z.number(),
  /** The "Turns left" the rule assumed at that boundary. */
  turns_left: z.number(),
  savings: z.number(),
  decision: z.string(),
});
export type CutEstimate = z.infer<typeof cutEstimateSchema>;

/**
 * `_log/state.yml` of a version 2 spec (design D3): one schema for five logical logs. Every section is
 * optional in the file; approvals are appended, never rewritten, as in `approvals.yml`.
 */
export const stateSchema = z.object({
  start: startSchema.optional(),
  baseline: baselineSchema.optional(),
  progress: progressSchema.optional(),
  approvals: z.array(approvalSchema).default([]),
  cut_estimates: z.array(cutEstimateSchema).default([]),
});
export type State = z.infer<typeof stateSchema>;
export type StateInput = z.input<typeof stateSchema>;
export type StateSection = keyof State;

/** Reads `state.yml`; an absent or empty file is an empty state. A row that does not match its schema throws. */
export function parseState(text: string | undefined): State {
  const data = text?.trim() ? (parseYaml(text) as unknown) : undefined;
  return stateSchema.parse(data ?? {});
}

const ORDER: StateSection[] = ['start', 'baseline', 'progress', 'approvals', 'cut_estimates'];

/** The file, sections in a fixed order; absent sections and empty lists are left out. */
export function renderState(state: StateInput): string {
  const valid = stateSchema.parse(state);
  const present = ORDER.filter((k) => {
    const v = valid[k];
    return v !== undefined && !(Array.isArray(v) && !v.length);
  });
  const body = present.length ? stringifyYaml(Object.fromEntries(present.map((k) => [k, valid[k]])), { lineWidth: 0 }) : '{}\n';
  return `# Written by mandao scripts: start request, baseline, progress, approvals and session-cut estimates.\n${body}`;
}
