import type { Config, ProjectConfig } from '../schemas/index.js';
import { activeSpecDir, forcedBudget, forceSource, recordForced } from '../scripts/forced.js';
import { type Budget, type BudgetKind, decideBudget, effectiveResources, probeMachine } from '../scripts/resources.js';

/**
 * The budget for one operation. A deferred run only goes ahead when forced (`--force`, `MANDAO_FORCE=1`
 * or `RG_FORCE=1`), and every forced run is recorded (ADR 0024).
 */
export function budgetFor(
  root: string,
  config: Config,
  project: ProjectConfig | undefined,
  kind: BudgetKind,
  label: string,
  force?: boolean,
  specDir?: string,
): Budget {
  const budget = decideBudget(probeMachine(), effectiveResources(config.resources, project?.resources), kind);
  const by = forceSource(force);
  if (budget.decision !== 'defer' || !by) return budget;
  const spec = specDir ?? activeSpecDir(root, config);
  recordForced(root, { at: new Date().toISOString(), operation: kind, label, reason: budget.reason, by, ...(spec ? { spec } : {}) }, spec);
  return forcedBudget(budget);
}
