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
});
export type Progress = z.infer<typeof progressSchema>;
