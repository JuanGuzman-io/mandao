import { z } from 'zod';
import { effort, harnessId, schemaVersion, TIERS, type Tier, tier } from './common.js';

export const ROLES = ['leader', 'reviewer', 'reviewer_alt', 'implementer', 'tester'] as const;
export type Role = (typeof ROLES)[number];

export const MODEL_MODES = ['simple', 'routed'] as const;
export type ModelMode = (typeof MODEL_MODES)[number];

const model = z.string().min(1);
const tierModels = z.object(Object.fromEntries(TIERS.map((t) => [t, model])) as Record<Tier, typeof model>);
const tierEfforts = z.object(Object.fromEntries(TIERS.map((t) => [t, effort])) as Record<Tier, typeof effort>);

/** Reasoning effort per role, mirroring the model choices; ignored by harnesses without per-agent effort. */
const roleEfforts = z
  .object({ leader: effort, reviewer: effort, reviewer_alt: effort, implementer: z.union([effort, tierEfforts.partial()]), tester: effort })
  .partial()
  .strict();
export type RoleEfforts = z.infer<typeof roleEfforts>;

/** One harness's role → model choices. Every key is optional: missing roles fall back to the next layer. */
const roleModels = z
  .object({
    leader: model,
    reviewer: model,
    reviewer_alt: model,
    /** `simple` mode: one model. `routed` mode: one model per task tier (a string applies to every tier). */
    implementer: z.union([model, tierModels.partial()]),
    tester: model,
    effort: roleEfforts,
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
      /** Oldest harness release that knows the recommended models, and how to read the installed one. */
      harness_version: z.object({ min: z.string().min(1), command: z.string().min(1) }).optional(),
      available: z.array(model).min(1),
      /** `simple` when the harness cannot give each role its own model. */
      default_mode: z.enum(MODEL_MODES).default('routed'),
      routed: z.object({ leader: model, reviewer: model, reviewer_alt: model.optional(), implementer: tierModels, tester: model }),
      simple: z.object({ implementer: model, reviewer: model }),
      /** Reasoning effort per role, for harnesses that support it. */
      effort: roleEfforts.optional(),
      /**
       * Mandao's classification of each recommended or optional model into a tier. It is a judgement, not
       * vendor data; it backs the rule that a Reviewer never runs below the Implementer's tier.
       */
      tiers: z.record(model, tier).default({}),
      /** Plan or administration facts that doctor repeats to the user. */
      notes: z.array(z.string().min(1)).default([]),
      /** Good choices that depend on the plan or an administrator: offered, never defaults. */
      optional: z.array(z.object({ model, roles: z.array(z.enum(ROLES)).min(1), note: z.string().min(1) })).default([]),
    }),
  ),
});
export type Recommendations = z.infer<typeof recommendationsSchema>;
