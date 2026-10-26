import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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

/** A task's block: its heading to the next task heading. */
const TASK_HEADING = /^###\s+\[[ xX]\]\s+(T\d+)\s*[—–-]/m;

/** The document cut at task headings: the text before the first task, then one block per task, by id. */
function taskBlocks(text: string): { preamble: string; blocks: [string, string][] } {
  const parts = text.split(/(?=^###\s+\[[ xX]\]\s+T\d+\s*[—–-])/m);
  const preamble = TASK_HEADING.test(parts[0] ?? '') ? '' : (parts.shift() ?? '');
  return { preamble, blocks: parts.map((b) => [TASK_HEADING.exec(b)?.[1] ?? '', b]) };
}

/** A queued task's block without what the process itself edits: its box, its `files` and its `kind` lines. */
const bookkeepingFree = (block: string) =>
  block
    .replace(/^(###\s+\[)[ xX](\])/m, '$1 $2')
    // Only inside the task's YAML block: a prose line starting with `files:` is not bookkeeping (review F12).
    .replace(/```ya?ml[ \t]*\r?\n[\s\S]*?```/, (yaml) => yaml.replace(/^[ \t]*(files|kind):.*\r?\n/gm, ''));

/**
 * Whether a spec document differs from HEAD only by what the process writes for the queued tasks: the `[x]`
 * of `checkpoint --done` (MDO-0001), and their `files` and `kind` lines (`run task-files`; MDO-0002 needed a
 * `docs` commit per task for them). Any other edit, or one to another task, still needs review.
 */
export function onlyTaskBookkeeping(repo: string, path: string, tasks: string[]): boolean {
  const file = join(repo, path);
  if (!existsSync(file)) return false;
  let head: string;
  try {
    head = execFileSync('git', ['show', `HEAD:${path}`], { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    return false;
  }
  const current = readFileSync(file, 'utf8');
  if (current === head) return false;
  const before = taskBlocks(head);
  const after = taskBlocks(current);
  if (before.preamble !== after.preamble || before.blocks.length !== after.blocks.length) return false;
  return before.blocks.every(([id, block], i) => {
    const [nextId, next] = after.blocks[i]!;
    if (id !== nextId) return false;
    return tasks.includes(id) ? bookkeepingFree(block) === bookkeepingFree(next) : block === next;
  });
}
