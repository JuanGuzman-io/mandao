import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { resolveWorkspaceModels } from '../models/load.js';
import {
  type Choice,
  independence,
  missingRoles,
  type ResolvedModels,
  strongEqualsStandard,
  TIER_RANK,
  usedModels,
} from '../models/resolve.js';
import type { Config, HarnessId, Recommendations } from '../schemas/index.js';
import { crossReviewers } from '../scripts/review.js';
import { type CrossReviewer, crossReviewer } from '../spec/index.js';
import { onPath } from '../util/which.js';
import type { Finding } from './doctor.js';

type Rec = NonNullable<Recommendations['harnesses'][keyof Recommendations['harnesses']]>;

function choiceFindings(m: ResolvedModels, rec: Rec | undefined, label: string): Finding[] {
  const out: Finding[] = [];
  for (const { role, choice } of usedModels(m)) {
    const optional = rec?.optional.find((o) => o.model === choice.model);
    if (optional) out.push({ level: 'info', message: `${label}: ${role} uses "${choice.model}": ${optional.note}` });
    else if (choice.source !== 'recommendation' && rec && !rec.available.includes(choice.model)) {
      out.push({
        level: 'warn',
        message: `${label}: ${role} uses "${choice.model}", which is not among Mandao's recommendations (reviewed ${rec.reviewed})`,
        fix: 'check that the model is still available, or `mandao models` to compare',
      });
    }
  }
  return out;
}

/**
 * When another installed harness could review but its default reviewer is below the Implementer's tier:
 * the first optional model of that harness that may review at that tier and carries an official source
 * and review date (e.g. gpt-6-astra in Codex). Unverified models are never suggested.
 */
function crossUpgrade(implementer: Choice, m: ResolvedModels, alternatives: CrossReviewer[], recs: Recommendations): string | undefined {
  const implTier = m.tiers[implementer.model];
  if (!implTier) return undefined;
  for (const alt of alternatives) {
    const rec = recs.harnesses[alt.harness as HarnessId];
    const opt = rec?.optional.find(
      (o) =>
        o.source &&
        o.reviewed &&
        o.roles.includes('reviewer') &&
        rec.tiers[o.model] &&
        TIER_RANK[rec.tiers[o.model]!] >= TIER_RANK[implTier],
    );
    if (opt)
      return `if your plan has ${opt.model}, make it ${alt.harness}'s reviewer: \`mandao models set reviewer ${opt.model} --harness ${alt.harness}\` (${opt.note}; verified ${opt.reviewed} at ${opt.source})`;
  }
  return undefined;
}

function reviewFindings(m: ResolvedModels, label: string, alternatives: CrossReviewer[], recs: Recommendations): Finding[] {
  const out: Finding[] = independence(m)
    .filter((x) => x.reduced)
    .map((check): Finding => {
      const cross = crossReviewer(check.implementer, m, alternatives);
      return cross
        ? {
            level: 'info',
            message: `${label}: ${check.tier} tasks are reviewed in ${cross.harness} (${cross.model}) as a read-only process, since ${check.reason} (ADR 0021)`,
          }
        : {
            level: 'warn',
            message: `${label}: reduced independence for ${check.tier} tasks (${check.reason}); ${check.implementer.model} reviews in a clean context`,
            fix:
              crossUpgrade(check.implementer, m, alternatives, recs) ??
              'choose a reviewer_alt of the same tier or higher on another model (see `optional` in the recommendations), or add and log in another harness (e.g. `mandao harness add codex`) to review there',
          };
    });
  if (strongEqualsStandard(m)) {
    out.push({
      level: 'info',
      message: `${label}: implementer.strong uses the same model and effort as standard (${m.implementer.strong?.model}): escalating a task does not change its model`,
      fix: 'set a stronger model or a higher effort for implementer.strong if your plan allows it',
    });
  }
  return out;
}

/** Every role has a model, chosen models are still recommended, and review independence holds. */
export function modelFindings(root: string, config: Config, recs: Recommendations): Finding[] {
  const out: Finding[] = [];
  const scopes = [undefined, ...config.projects.filter((p) => p.path !== '.' && existsSync(join(root, p.path, '.mandao', 'models.yml')))];
  for (const project of scopes) {
    const resolved = resolveWorkspaceModels(root, config, recs, { project });
    for (const harness of config.harnesses) {
      const m = resolved[harness]!;
      const label = `${harness}${project ? ` (project ${project.name})` : ''}`;
      const missing = missingRoles(m);
      if (missing.length) {
        out.push({
          level: 'error',
          message: `${label}: no model for ${missing.join(', ')}`,
          fix: `mandao models set <role> <model> --harness ${harness}`,
        });
      }
      const alternatives = crossReviewers(config.harnesses, harness, resolved, onPath);
      out.push(...choiceFindings(m, recs.harnesses[harness], label), ...reviewFindings(m, label, alternatives, recs));
    }
  }
  for (const harness of config.harnesses) {
    for (const note of recs.harnesses[harness]?.notes ?? []) out.push({ level: 'info', message: `${harness}: ${note}` });
  }
  return out;
}
