import { type HarnessId, type ModelMode, type Recommendations, type Role, type RoleModels, TIERS, type Tier } from '../schemas/index.js';

/** Where a resolved model came from, lowest precedence first. */
export const MODEL_SOURCES = ['recommendation', 'workspace', 'project', 'spec', 'flag'] as const;
export type ModelSource = (typeof MODEL_SOURCES)[number];

export interface Choice {
  model: string;
  source: ModelSource;
}

export interface ResolvedModels {
  harness: HarnessId;
  mode: ModelMode;
  leader?: Choice;
  reviewer?: Choice;
  reviewer_alt?: Choice;
  tester?: Choice;
  implementer: Partial<Record<Tier, Choice>>;
}

export interface ModelLayer {
  source: Exclude<ModelSource, 'recommendation'>;
  models?: RoleModels;
}

const SINGLE_ROLES = ['leader', 'reviewer', 'reviewer_alt', 'tester'] as const;

/**
 * Precedence: flag > spec frontmatter > project models.yml > workspace models.yml > recommendation.
 * In `simple` mode the Implementer uses one model for every tier.
 */
export function resolveModels(harness: HarnessId, mode: ModelMode, recommendations: Recommendations, layers: ModelLayer[]): ResolvedModels {
  const rec = recommendations.harnesses[harness];
  const out: ResolvedModels = { harness, mode, implementer: {} };

  if (rec) {
    for (const role of SINGLE_ROLES) out[role] = { model: rec.routed[role], source: 'recommendation' };
    if (mode === 'simple') out.reviewer = { model: rec.simple.reviewer, source: 'recommendation' };
    for (const tier of TIERS) {
      out.implementer[tier] = {
        model: mode === 'simple' ? rec.simple.implementer : rec.routed.implementer[tier],
        source: 'recommendation',
      };
    }
  }

  const ordered = [...layers].sort((a, b) => MODEL_SOURCES.indexOf(a.source) - MODEL_SOURCES.indexOf(b.source));
  for (const layer of ordered) {
    const m = layer.models;
    if (!m) continue;
    for (const role of SINGLE_ROLES) {
      const value = m[role];
      if (value) out[role] = { model: value, source: layer.source };
    }
    const impl = m.implementer;
    if (typeof impl === 'string') {
      for (const tier of TIERS) out.implementer[tier] = { model: impl, source: layer.source };
    } else if (impl) {
      // In simple mode a per-tier map collapses to its standard entry.
      const values = mode === 'simple' ? Object.fromEntries(TIERS.map((t) => [t, impl.standard])) : impl;
      for (const tier of TIERS) {
        const value = values[tier];
        if (value) out.implementer[tier] = { model: value, source: layer.source };
      }
    }
  }
  return out;
}

export interface IndependenceCheck {
  tier: Tier;
  implementer: string;
  reviewer: string;
  /** The model that reviews this tier: `reviewer`, or `reviewer_alt` when the Implementer equals the Reviewer. */
  reviewedBy: string;
  /** True when no available model differs from the Implementer's. */
  reduced: boolean;
}

/** Per tier: who reviews, and whether review independence is reduced. */
export function independence(models: ResolvedModels): IndependenceCheck[] {
  const reviewer = models.reviewer?.model;
  if (!reviewer) return [];
  const alt = models.reviewer_alt?.model;
  return TIERS.flatMap((tier) => {
    const implementer = models.implementer[tier]?.model;
    if (!implementer) return [];
    const reviewedBy = implementer !== reviewer ? reviewer : alt && alt !== implementer ? alt : reviewer;
    return [{ tier, implementer, reviewer, reviewedBy, reduced: reviewedBy === implementer }];
  });
}

/** Roles that ended up without a model (no recommendation and no choice). */
export function missingRoles(models: ResolvedModels): string[] {
  const missing: string[] = SINGLE_ROLES.filter((r) => !models[r]);
  for (const tier of TIERS) if (!models.implementer[tier]) missing.push(`implementer.${tier}`);
  return missing;
}

/** Every concrete model a resolution uses, with the role that uses it. */
export function usedModels(models: ResolvedModels): { role: Role | `implementer.${Tier}`; choice: Choice }[] {
  const out: { role: Role | `implementer.${Tier}`; choice: Choice }[] = [];
  for (const role of SINGLE_ROLES) {
    const choice = models[role];
    if (choice) out.push({ role, choice });
  }
  for (const tier of TIERS) {
    const choice = models.implementer[tier];
    if (choice) out.push({ role: `implementer.${tier}`, choice });
  }
  return out;
}
