import { existsSync, readFileSync } from 'node:fs';
import { parseCosts, specBudget, summarizeCosts } from '../spec/index.js';
import { logPath, readApprovalLog } from './spec-log.js';

const read = (file: string) => (existsSync(file) ? readFileSync(file, 'utf8') : undefined);

/**
 * What a spec has spent against its cap: the budget a person authorized for it (`approve … budget --to`)
 * or `budget.per_spec`; with neither there is no cap, only the record (ADR 0036).
 */
export function specSpend(specDir: string, perSpec: number | undefined) {
  const costs = parseCosts(read(logPath(specDir, 'costs.yml')));
  return summarizeCosts(costs, specBudget(readApprovalLog(specDir), perSpec));
}
