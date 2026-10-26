import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import type { Progress } from '../spec/index.js';

type Entry = Progress['pending_commits'][number];
type Item = NonNullable<Entry['manifest']>[number];

const sha = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');

/** Whether `path` at `rev` matches the manifest hash (deleted paths: absent at `rev`). */
export function matchesAt(repo: string, rev: string, item: Item): boolean {
  try {
    const content = execFileSync('git', ['show', `${rev}:${item.path}`], {
      cwd: repo,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return sha(content) === item.sha256;
  } catch {
    return item.sha256 === sha('mandao:deleted');
  }
}

/** Whether a commit that is not one of `taskShas` changed `path` after `sinceMs` (author time). */
function changedElsewhereSince(repo: string, path: string, sinceMs: number, taskShas: string[]): boolean {
  let log: string;
  try {
    log = execFileSync('git', ['log', '--format=%at %h', '--', path], { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    return false;
  }
  return log
    .split('\n')
    .filter(Boolean)
    .some((line) => {
      const [at, sha] = line.split(' ');
      return Number(at) * 1000 > sinceMs && !taskShas.includes(sha!);
    });
}

/** What the commits of a spec say about its tasks: their shas and author times, keyed by the task trailer. */
export interface TaskHistory {
  commits: Map<string, string[]>;
  times: Map<string, number[]>;
  /** Paths changed in the working tree now. */
  dirty: Set<string>;
}

/**
 * Pending entries whose task is provably committed, with the manifest paths that differ from that commit:
 * - every path is clean with the approved content at HEAD (the original rule), or
 * - one of the task's commits holds the approved content of every path (a later task may edit them since), or
 * - the entry records when it was queued, the task was committed after that, and every path that differs from
 *   the task's commit was changed by another commit since, as when a gate added mid-task changed a file in its
 *   own commit before the task's (MDO-0001 T1). A hand commit of content nobody reviewed is never reconciled.
 * Entries without a manifest are never reconciled; a task queued again after its commit (rework) is not,
 * because its new content is in none of its commits and its commit predates the new entry.
 */
export function reconcileEntries(repo: string, history: TaskHistory, entries: Entry[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const e of entries) {
    const differs = reconcileOne(repo, history, e);
    if (differs) out.set(e.task, differs);
  }
  return out;
}

/** The paths that differ from the task's commit when the entry is reconciled; undefined when it stays pending. */
function reconcileOne(repo: string, history: TaskHistory, e: Entry): string[] | undefined {
  const shas = history.commits.get(e.task);
  const manifest = e.manifest;
  if (!shas?.length || !manifest?.length) return undefined;
  if (manifest.every((item) => !history.dirty.has(item.path) && matchesAt(repo, 'HEAD', item))) return [];
  if (shas.some((rev) => manifest.every((item) => matchesAt(repo, rev, item)))) return [];
  const queued = e.queued_at ? Date.parse(e.queued_at) : Number.NaN;
  if (!Number.isFinite(queued) || !(history.times.get(e.task) ?? []).some((t) => t > queued)) return undefined;
  const differs = manifest.filter((item) => !matchesAt(repo, shas[0]!, item)).map((item) => item.path);
  // Only a change another commit made after the entry was queued explains a difference (the gate commit of
  // MDO-0001 T1); a hand commit of content the Reviewer never saw stays pending.
  return differs.every((path) => changedElsewhereSince(repo, path, queued, shas)) ? differs : undefined;
}
