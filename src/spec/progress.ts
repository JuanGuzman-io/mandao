import { z } from 'zod';
import { harnessId, schemaVersion } from '../schemas/index.js';

/** `implementing`, `awaiting-review`, or `rework-n` (the n-th rework of the task). */
export const phase = z.union([z.enum(['implementing', 'awaiting-review']), z.string().regex(/^rework-\d+$/)]);

/** `progress.yml`: the machine-readable checkpoint a Leader writes after every step (ADR 0018). */
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
    .array(z.object({ task: z.string().regex(/^T\d+$/), files: z.array(z.object({ path: z.string(), sha256: z.string() })) }))
    .default([]),
  pending_commits: z
    .array(z.object({ task: z.string().regex(/^T\d+$/), subject: z.string().min(1), files: z.array(z.string()).default([]) }))
    .default([]),
});
export type Progress = z.infer<typeof progressSchema>;
/** What a writer passes: defaults may be left out. */
export type ProgressInput = z.input<typeof progressSchema>;
