import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { resolveWorkspaceModels } from '../models/load.js';
import { independence, missingRoles, type ResolvedModels, strongEqualsStandard, usedModels } from '../models/resolve.js';
import type { Config, Recommendations } from '../schemas/index.js';
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

function reviewFindings(m: ResolvedModels, label: string): Finding[] {
  const out: Finding[] = independence(m)
    .filter((x) => x.reduced)
    .map((check) => ({
      level: 'warn' as const,
      message: `${label}: reduced independence for ${check.tier} tasks (${check.reason}); ${check.implementer.model} reviews in a clean context`,
      fix: 'choose a reviewer_alt of the same tier or higher on another model (see `optional` in the recommendations), or review in another harness',
    }));
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
      out.push(...choiceFindings(m, recs.harnesses[harness], label), ...reviewFindings(m, label));
    }
  }
  for (const harness of config.harnesses) {
    for (const note of recs.harnesses[harness]?.notes ?? []) out.push({ level: 'info', message: `${harness}: ${note}` });
  }
  return out;
}
