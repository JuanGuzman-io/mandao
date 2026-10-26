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
 * - the entry records when it was queued and the task was committed after that: the entry is stale even when
 *   its content differs, as when a gate added mid-task changed a file before the commit (MDO-0001 T1).
 * Entries without a manifest are never reconciled; a task queued again after its commit (rework) is not,
 * because its new content is in none of its commits and its commit predates the new entry.
 */
export function reconcileEntries(repo: string, history: TaskHistory, entries: Entry[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const e of entries) {
    const shas = history.commits.get(e.task);
    if (!shas?.length || !e.manifest?.length) continue;
    const manifest = e.manifest;
    if (manifest.every((item) => !history.dirty.has(item.path) && matchesAt(repo, 'HEAD', item))) {
      out.set(e.task, []);
      continue;
    }
    if (shas.some((rev) => manifest.every((item) => matchesAt(repo, rev, item)))) {
      out.set(e.task, []);
      continue;
    }
    const queued = e.queued_at ? Date.parse(e.queued_at) : Number.NaN;
    if (Number.isFinite(queued) && (history.times.get(e.task) ?? []).some((t) => t > queued)) {
      const latest = shas[0]!;
      out.set(
        e.task,
        manifest.filter((item) => !matchesAt(repo, latest, item)).map((item) => item.path),
      );
    }
  }
  return out;
}
