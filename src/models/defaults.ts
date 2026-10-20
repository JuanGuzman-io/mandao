import type { ModelMode, Recommendations, RoleModels } from '../schemas/index.js';
import { chooseProviderSet } from './providers.js';

type HarnessRec = NonNullable<Recommendations['harnesses'][keyof Recommendations['harnesses']]>;

/**
 * For provider-agnostic harnesses (OpenCode), the recommendation of the largest provider set the
 * detected providers cover; the harness default when none fits or nothing was detected (ADR 0017).
 */
export function forProviders(rec: HarnessRec, providers: string[] | undefined): { rec: HarnessRec; set?: string } {
  if (!rec.provider_sets || !providers?.length) return { rec };
  const set = chooseProviderSet(rec.provider_sets, providers);
  if (!set) return { rec };
  const chosen = rec.provider_sets[set]!;
  return { rec: { ...rec, routed: chosen.routed, simple: chosen.simple }, set };
}

/** The recommendation for one harness as explicit choices (models and efforts), ready for models.yml. */
export function recommendedChoices(rec: HarnessRec, mode: ModelMode): RoleModels {
  const base: RoleModels =
    mode === 'simple'
      ? { leader: rec.routed.leader, reviewer: rec.simple.reviewer, implementer: rec.simple.implementer, tester: rec.routed.tester }
      : { leader: rec.routed.leader, reviewer: rec.routed.reviewer, implementer: { ...rec.routed.implementer }, tester: rec.routed.tester };
  if (rec.routed.reviewer_alt) base.reviewer_alt = rec.routed.reviewer_alt;
  if (rec.effort) base.effort = structuredClone(rec.effort);
  return base;
}
