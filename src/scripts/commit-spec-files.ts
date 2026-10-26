import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTaskDone } from '../spec/index.js';

/** Spec-folder files a task commit may carry without review. */

/** Only script-owned spec records may ride with a task commit; human spec edits need review. */
export function scriptLedgerPath(path: string): boolean {
  const logDirs = ['reviews/', 'mutations/', 'gates/', 'premises/'];
  const logFiles = [
    'state.yml',
    'execution.md',
    'progress.yml',
    'reviews.md',
    'gates.md',
    'premises.md',
    'costs.yml',
    'approvals.yml',
    'session-cuts.md',
    'full-runs.md',
    'discrepancies.md',
    '.integrity.json',
  ];
  return (
    ['execution.md', 'progress.yml', 'costs.yml', 'full-runs.md', 'session-cuts.md', 'discrepancies.md', '.integrity.json'].includes(
      path,
    ) ||
    ['state.yml', 'approvals.yml', '.integrity.json'].includes(path) ||
    (path.startsWith('_log/') &&
      (logFiles.includes(path.slice('_log/'.length)) || logDirs.some((prefix) => path.startsWith(`_log/${prefix}`)))) ||
    logDirs.some((prefix) => path.startsWith(prefix))
  );
}

/**
 * Whether a spec document differs from HEAD only by the `[x]` boxes of the queued tasks: what
 * `checkpoint --done` writes, so it rides with the task commit (MDO-0001 committed it apart every task).
 */
export function onlyDoneBoxes(repo: string, path: string, tasks: string[]): boolean {
  const file = join(repo, path);
  if (!existsSync(file)) return false;
  let head: string;
  try {
    head = execFileSync('git', ['show', `HEAD:${path}`], { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    return false;
  }
  const current = readFileSync(file, 'utf8');
  return current !== head && tasks.reduce((text, id) => setTaskDone(text, id, true), head) === current;
}
