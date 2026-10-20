import type { ModelMode, Recommendations, RoleModels } from '../schemas/index.js';

/** The recommendation for one harness as explicit choices, ready to write into models.yml. */
export function recommendedChoices(
  rec: NonNullable<Recommendations['harnesses'][keyof Recommendations['harnesses']]>,
  mode: ModelMode,
): RoleModels {
  return mode === 'simple'
    ? {
        leader: rec.routed.leader,
        reviewer: rec.simple.reviewer,
        reviewer_alt: rec.routed.reviewer_alt,
        implementer: rec.simple.implementer,
        tester: rec.routed.tester,
      }
    : { ...rec.routed, implementer: { ...rec.routed.implementer } };
}
