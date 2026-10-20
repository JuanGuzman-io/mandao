import { type HarnessId, type Models, type Recommendations, TIERS } from '../schemas/index.js';

export interface Offer {
  harness: HarnessId;
  role: string;
  current: string;
  recommended: string;
}

/**
 * After the recommendations change, list roles whose explicit choice differs from the new
 * recommendation. Choices are never changed here: `update` only offers them.
 */
export function recommendationOffers(models: Models, recommendations: Recommendations, seen: Partial<Record<HarnessId, string>>): Offer[] {
  const offers: Offer[] = [];
  const mode = models.mode ?? 'routed';
  for (const [harness, rec] of Object.entries(recommendations.harnesses) as [
    HarnessId,
    NonNullable<Recommendations['harnesses'][HarnessId]>,
  ][]) {
    if (seen[harness] === rec.reviewed) continue;
    const chosen = models.harnesses[harness];
    if (!chosen) continue;
    const want: Record<string, string> = {
      leader: rec.routed.leader,
      reviewer: mode === 'simple' ? rec.simple.reviewer : rec.routed.reviewer,
      reviewer_alt: rec.routed.reviewer_alt,
      tester: rec.routed.tester,
    };
    for (const [role, recommended] of Object.entries(want)) {
      const current = chosen[role as 'leader'];
      if (current && current !== recommended) offers.push({ harness, role, current, recommended });
    }
    const impl = chosen.implementer;
    for (const tier of TIERS) {
      const current = typeof impl === 'string' ? impl : impl?.[tier];
      const recommended = mode === 'simple' ? rec.simple.implementer : rec.routed.implementer[tier];
      if (current && current !== recommended)
        offers.push({ harness, role: mode === 'simple' ? 'implementer' : `implementer.${tier}`, current, recommended });
      if (mode === 'simple') break;
    }
  }
  return offers;
}
