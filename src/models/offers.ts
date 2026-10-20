import { type HarnessId, type Models, type Recommendations, TIERS } from '../schemas/index.js';
import { sha256 } from '../util/hash.js';

/** Identifies one harness's recommendation, so a revision on the same day is still offered once. */
export function recommendationHash(rec: NonNullable<Recommendations['harnesses'][HarnessId]>): string {
  return sha256(JSON.stringify(rec));
}

/** What the lock records after offering: one hash per harness. */
export function seenRecommendations(recommendations: Recommendations): Partial<Record<HarnessId, string>> {
  return Object.fromEntries(Object.entries(recommendations.harnesses).map(([h, r]) => [h, recommendationHash(r!)]));
}

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
    if (seen[harness] === recommendationHash(rec)) continue;
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
