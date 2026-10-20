import type { ModelMode, ModelProfile, Recommendations, RoleModels } from '../schemas/index.js';
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
  // Profiles are written for the default (Anthropic) set; another provider set has none yet.
  return { rec: { ...rec, routed: chosen.routed, simple: chosen.simple, ...(set === 'anthropic' ? {} : { profiles: undefined }) }, set };
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

/** Overrides of `b` over `a`, one level into the implementer tiers and the efforts. */
function merge(a: RoleModels, b: RoleModels): RoleModels {
  const out: RoleModels = { ...a, ...b };
  if (typeof a.implementer === 'object' && typeof b.implementer === 'object') out.implementer = { ...a.implementer, ...b.implementer };
  if (a.effort || b.effort) {
    out.effort = { ...a.effort, ...b.effort };
    const ai = a.effort?.implementer;
    const bi = b.effort?.implementer;
    if (typeof ai === 'object' && typeof bi === 'object') out.effort.implementer = { ...ai, ...bi };
  }
  return out;
}

/** The recommendation under a profile, as explicit choices for models.yml (`peak` is the recommendation). */
export function profileChoices(rec: HarnessRec, mode: ModelMode, profile: ModelProfile): RoleModels {
  const base = recommendedChoices(rec, mode);
  const overrides = profile === 'peak' ? undefined : rec.profiles?.[profile];
  if (!overrides) return base;
  const { why: _why, ...models } = overrides;
  return merge(
    base,
    mode === 'simple' && typeof models.implementer === 'object' ? { ...models, implementer: models.implementer.standard } : models,
  );
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * What the user changed by hand: the roles of `current` that differ from what `previous` (the profile it
 * was written from) recommends. A profile change keeps them on top (no model change without consent).
 */
export function userOverrides(current: RoleModels, previous: RoleModels): RoleModels {
  const out: RoleModels = {};
  for (const key of ['leader', 'reviewer', 'reviewer_alt', 'tester'] as const) {
    if (current[key] !== undefined && current[key] !== previous[key]) out[key] = current[key];
  }
  const ci = current.implementer;
  const pi = previous.implementer;
  if (typeof ci === 'string' || typeof pi === 'string') {
    if (ci !== undefined && !same(ci, pi)) out.implementer = ci;
  } else if (ci) {
    const changed = Object.fromEntries(Object.entries(ci).filter(([t, m]) => pi?.[t as keyof typeof pi] !== m));
    if (Object.keys(changed).length) out.implementer = changed;
  }
  if (current.effort && !same(current.effort, previous.effort)) out.effort = current.effort;
  return out;
}

export { merge as mergeChoices };
