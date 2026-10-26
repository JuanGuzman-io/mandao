import { z } from 'zod';
import { harnessId, schemaVersion } from '../schemas/index.js';

/** `implementing`, `awaiting-review`, or `rework-n` (the n-th rework of the task). */
export const phase = z.union([z.enum(['implementing', 'awaiting-review']), z.string().regex(/^rework-\d+$/)]);

/**
 * `progress.yml` (version 1) or the `progress` section of `state.yml` (version 2): the machine-readable
 * checkpoint a Leader writes after every step (ADR 0018). Its `schema_version` is the record's own
 * format version, always 1, separate from the spec layout version.
 */
export const progressSchema = z.object({
  schema_version: schemaVersion,
  spec: z.string().min(1),
  updated_at: z.string().min(1),
  current: z
    .object({
      task: z.string().regex(/^T\d+$/),
      phase,
      harness: z.union([harnessId, z.string().min(1)]),
      model: z.string().min(1),
      effort: z.string().optional(),
    })
    .nullable()
    .default(null),
  open_questions: z.array(z.string()).default([]),
  next_step: z.string().default(''),
  deferred_to_ci: z.array(z.object({ task: z.string(), tests: z.array(z.string()), reason: z.string() })).default([]),
  /**
   * Tasks that passed review and still need their commit (a sandbox blocked it, or the session ended):
   * `mandao run commit` makes one commit per entry, in order (ADR 0021).
   */
  /** Tests recorded red per task, with their hashes then: a later change is flagged (ADR 0022). */
  red_tests: z
    .array(
      z.object({
        task: z.string().regex(/^T\d+$/),
        /** `tests`: the test names in the file when it ran red; a name added later has no red run (MDO-0008). */
        files: z.array(z.object({ path: z.string(), sha256: z.string(), tests: z.array(z.string()).optional() })),
      }),
    )
    .default([]),
  pending_commits: z
    .array(
      z.object({
        task: z.string().regex(/^T\d+$/),
        subject: z.string().min(1),
        files: z.array(z.string()).default([]),
        manifest: z.array(z.object({ path: z.string(), status: z.string(), sha256: z.string() })).optional(),
        /** Paths the Reviewer saw as a diff (not as receipts); absent on entries queued before the brake. */
        reviewed: z.array(z.string()).optional(),
        /** Generated files the Reviewer saw only as receipts, with their origin. */
        receipts: z.array(z.object({ path: z.string(), origin: z.string() })).optional(),
        /** When the entry was queued: a task commit after it closes the entry even if its content changed. */
        queued_at: z.string().optional(),
      }),
    )
    .default([]),
  /** Exact working-tree change manifests approved by a Reviewer, keyed to that task's attempt. */
  approved_manifests: z
    .array(
      z.object({
        task: z.string().regex(/^T\d+$/),
        attempt: z.number().int().positive(),
        files: z.array(z.object({ path: z.string(), status: z.string(), sha256: z.string() })),
        /** Paths the Reviewer saw as a diff (not as receipts). */
        reviewed: z.array(z.string()).optional(),
        receipts: z.array(z.object({ path: z.string(), origin: z.string() })).optional(),
      }),
    )
    .default([]),
  /** Consecutive identical run-step recommendations without a new execution row (Phase 5 loop brake). */
  loop_brake: z
    .object({
      task: z.string().regex(/^T\d+$/),
      action: z.string().min(1),
      execution_rows: z.number().int().nonnegative(),
      approval_rows: z.number().int().nonnegative().default(0),
      repeats: z.number().int().positive(),
    })
    .optional(),
});
export type Progress = z.infer<typeof progressSchema>;
/** What a writer passes: defaults may be left out. */
export type ProgressInput = z.input<typeof progressSchema>;
