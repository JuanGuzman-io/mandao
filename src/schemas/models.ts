import { z } from 'zod';
import { harnessId, schemaVersion, TIERS, type Tier } from './common.js';

export const ROLES = ['leader', 'reviewer', 'reviewer_alt', 'implementer', 'tester'] as const;
export type Role = (typeof ROLES)[number];

export const MODEL_MODES = ['simple', 'routed'] as const;
export type ModelMode = (typeof MODEL_MODES)[number];

const model = z.string().min(1);
const tierModels = z.object(Object.fromEntries(TIERS.map((t) => [t, model])) as Record<Tier, typeof model>);

/** One harness's role → model choices. Every key is optional: missing roles fall back to the next layer. */
const roleModels = z
  .object({
    leader: model,
    reviewer: model,
    reviewer_alt: model,
    /** `simple` mode: one model. `routed` mode: one model per task tier (a string applies to every tier). */
    implementer: z.union([model, tierModels.partial()]),
    tester: model,
  })
  .partial()
  .strict();
export type RoleModels = z.infer<typeof roleModels>;

/** `.mandao/models.yml` (workspace) and `<project>/.mandao/models.yml` (project overrides). */
export const modelsSchema = z.object({
  schema_version: schemaVersion,
  mode: z.enum(MODEL_MODES).optional(),
  harnesses: z.partialRecord(harnessId, roleModels).default({}),
});
export type Models = z.infer<typeof modelsSchema>;
export const emptyModels = (): Models => ({ schema_version: 1, harnesses: {} });

/** `core/models/recommendations.yml`: Mandao's recommendation per harness, with its review date and sources. */
export const recommendationsSchema = z.object({
  schema_version: schemaVersion,
  harnesses: z.partialRecord(
    harnessId,
    z.object({
      reviewed: z.iso.date(),
      sources: z.array(z.url()).min(1),
      available: z.array(model).min(1),
      routed: z.object({ leader: model, reviewer: model, reviewer_alt: model, implementer: tierModels, tester: model }),
      simple: z.object({ implementer: model, reviewer: model }),
      /** Good choices that depend on the plan or an administrator: offered, never defaults. */
      optional: z.array(z.object({ model, roles: z.array(z.enum(ROLES)).min(1), note: z.string().min(1) })).default([]),
    }),
  ),
});
export type Recommendations = z.infer<typeof recommendationsSchema>;
