import type { ModelMode, Recommendations, RoleModels } from '../schemas/index.js';

/** The recommendation for one harness as explicit choices (models and efforts), ready for models.yml. */
export function recommendedChoices(
  rec: NonNullable<Recommendations['harnesses'][keyof Recommendations['harnesses']]>,
  mode: ModelMode,
): RoleModels {
  const base: RoleModels =
    mode === 'simple'
      ? { leader: rec.routed.leader, reviewer: rec.simple.reviewer, implementer: rec.simple.implementer, tester: rec.routed.tester }
      : { leader: rec.routed.leader, reviewer: rec.routed.reviewer, implementer: { ...rec.routed.implementer }, tester: rec.routed.tester };
  if (rec.routed.reviewer_alt) base.reviewer_alt = rec.routed.reviewer_alt;
  if (rec.effort) base.effort = structuredClone(rec.effort);
  return base;
}
