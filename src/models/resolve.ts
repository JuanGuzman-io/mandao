import {
  EFFORTS,
  type Effort,
  type HarnessId,
  type ModelMode,
  type Recommendations,
  type Role,
  type RoleEfforts,
  type RoleModels,
  TIERS,
  type Tier,
} from '../schemas/index.js';

/** Where a resolved model came from, lowest precedence first. */
export const MODEL_SOURCES = ['recommendation', 'workspace', 'project', 'spec', 'flag'] as const;
export type ModelSource = (typeof MODEL_SOURCES)[number];

export interface Choice {
  model: string;
  source: ModelSource;
  /** Reasoning effort, where the harness supports it per role. */
  effort?: Effort;
}

export interface ResolvedModels {
  harness: HarnessId;
  mode: ModelMode;
  leader?: Choice;
  reviewer?: Choice;
  reviewer_alt?: Choice;
  tester?: Choice;
  implementer: Partial<Record<Tier, Choice>>;
  /** Mandao's tier classification per model (from the recommendations), used to compare roles. */
  tiers: Record<string, Tier>;
}

export interface ModelLayer {
  source: Exclude<ModelSource, 'recommendation'>;
  models?: RoleModels;
}

const SINGLE_ROLES = ['leader', 'reviewer', 'reviewer_alt', 'tester'] as const;

/** Per-tier values from a string (every tier) or a partial map. */
function perTier<T extends string>(value: T | Partial<Record<Tier, T>> | undefined, mode: ModelMode): Partial<Record<Tier, T>> {
  if (value === undefined) return {};
  if (typeof value === 'string') return Object.fromEntries(TIERS.map((t) => [t, value])) as Record<Tier, T>;
  // In simple mode a per-tier map collapses to its standard entry.
  if (mode === 'simple') return value.standard ? (Object.fromEntries(TIERS.map((t) => [t, value.standard])) as Record<Tier, T>) : {};
  return value;
}

function applyEfforts(out: ResolvedModels, efforts: RoleEfforts | undefined, mode: ModelMode) {
  if (!efforts) return;
  for (const role of SINGLE_ROLES) {
    const choice = out[role];
    const value = efforts[role];
    if (choice && value) choice.effort = value;
  }
  for (const [tier, value] of Object.entries(perTier(efforts.implementer, mode)) as [Tier, Effort][]) {
    const choice = out.implementer[tier];
    if (choice) choice.effort = value;
  }
}

function applyRecommendation(out: ResolvedModels, rec: NonNullable<Recommendations['harnesses'][HarnessId]>, mode: ModelMode) {
  for (const role of SINGLE_ROLES) {
    const model = rec.routed[role];
    if (model) out[role] = { model, source: 'recommendation' };
  }
  if (mode === 'simple') out.reviewer = { model: rec.simple.reviewer, source: 'recommendation' };
  for (const tier of TIERS) {
    out.implementer[tier] = { model: mode === 'simple' ? rec.simple.implementer : rec.routed.implementer[tier], source: 'recommendation' };
  }
  applyEfforts(out, rec.effort, mode);
}

function applyLayer(out: ResolvedModels, layer: ModelLayer, mode: ModelMode) {
  const m = layer.models;
  if (!m) return;
  for (const role of SINGLE_ROLES) {
    const value = m[role];
    if (value) out[role] = { model: value, source: layer.source };
  }
  for (const [tier, value] of Object.entries(perTier(m.implementer, mode)) as [Tier, string][]) {
    out.implementer[tier] = { model: value, source: layer.source };
  }
  applyEfforts(out, m.effort, mode);
}

/**
 * Precedence: flag > spec frontmatter > project models.yml > workspace models.yml > recommendation.
 * In `simple` mode the Implementer uses one model for every tier.
 */
export function resolveModels(harness: HarnessId, mode: ModelMode, recommendations: Recommendations, layers: ModelLayer[]): ResolvedModels {
  const rec = recommendations.harnesses[harness];
  const out: ResolvedModels = { harness, mode, implementer: {}, tiers: rec?.tiers ?? {} };
  if (rec) applyRecommendation(out, rec, mode);
  const ordered = [...layers].sort((a, b) => MODEL_SOURCES.indexOf(a.source) - MODEL_SOURCES.indexOf(b.source));
  for (const layer of ordered) applyLayer(out, layer, mode);
  return out;
}

const TIER_RANK: Record<Tier, number> = { fast: 0, standard: 1, strong: 2 };

/**
 * Compares two choices by Mandao's model tier, then by effort. Returns undefined when a model is not
 * classified, so the caller can say the comparison is unknown instead of guessing.
 */
export function compareChoices(a: Choice, b: Choice, tiers: Record<string, Tier>): number | undefined {
  const ta = tiers[a.model];
  const tb = tiers[b.model];
  if (!ta || !tb) return a.model === b.model ? effortRank(a) - effortRank(b) : undefined;
  return TIER_RANK[ta] - TIER_RANK[tb] || effortRank(a) - effortRank(b);
}

const effortRank = (c: Choice) => (c.effort ? EFFORTS.indexOf(c.effort) : -1);

export interface IndependenceCheck {
  tier: Tier;
  implementer: Choice;
  /** Who reviews tasks of this tier. */
  reviewer: Choice;
  /** `reviewer` or `reviewer_alt`. */
  reviewerRole: 'reviewer' | 'reviewer_alt';
  /** True when the review runs on the Implementer's own model (clean context only). */
  reduced: boolean;
  /** Why the main reviewer was not used, or why independence is reduced. */
  reason?: string;
}

/**
 * Who reviews each tier. The Reviewer must use a different model and never a lower tier or effort
 * than the Implementer (ADR 0020). When no candidate satisfies both, the review keeps the strongest
 * allowed reviewer in a clean context and independence is reduced.
 */
export function independence(models: ResolvedModels): IndependenceCheck[] {
  const candidates = (
    [
      ['reviewer', models.reviewer],
      ['reviewer_alt', models.reviewer_alt],
    ] as const
  ).filter((c): c is ['reviewer' | 'reviewer_alt', Choice] => Boolean(c[1]));
  if (!candidates.length) return [];
  return TIERS.flatMap((tier): IndependenceCheck[] => {
    const implementer = models.implementer[tier];
    if (!implementer) return [];
    const notLower = candidates.filter(([, c]) => (compareChoices(c, implementer, models.tiers) ?? 0) >= 0);
    const independent = notLower.find(([, c]) => c.model !== implementer.model);
    if (independent) {
      const [reviewerRole, reviewer] = independent;
      const reason = reviewerRole === 'reviewer_alt' ? 'the main reviewer uses the implementer model' : undefined;
      return [{ tier, implementer, reviewer, reviewerRole, reduced: false, ...(reason ? { reason } : {}) }];
    }
    // Nothing both independent and at least as strong: review on the implementer's model, clean context.
    const lowerOnly = candidates.some(([, c]) => c.model !== implementer.model);
    const reason = lowerOnly
      ? 'every reviewer on another model is below the implementer tier or effort'
      : 'every reviewer uses the implementer model';
    return [{ tier, implementer, reviewer: implementer, reviewerRole: 'reviewer', reduced: true, reason }];
  });
}

/** True when escalating from standard to strong changes neither model nor effort. */
export function strongEqualsStandard(models: ResolvedModels): boolean {
  const { standard, strong } = models.implementer;
  return Boolean(standard && strong && standard.model === strong.model && standard.effort === strong.effort);
}

/** Roles that ended up without a model (no recommendation and no choice). */
export function missingRoles(models: ResolvedModels): string[] {
  const missing: string[] = (['leader', 'reviewer', 'tester'] as const).filter((r) => !models[r]);
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
