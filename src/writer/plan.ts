import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedFile } from '../adapters/types.js';
import type { LockFile } from '../schemas/index.js';
import { sha256 } from '../util/hash.js';
import { extractBlock, removeBlock, upsertBlock } from './blocks.js';

export type Action = 'create' | 'update' | 'unchanged' | 'drift' | 'delete' | 'drift-orphan';

export interface Change {
  action: Action;
  path: string;
  scope: LockFile['scope'];
  /** Absolute path on disk. */
  abs: string;
  /** Full file content to write; `undefined` with action `delete` removes the file. */
  write?: string;
  /** Lock entry to keep after this change. Absent when the entry disappears. */
  lock?: LockFile;
}

export interface Roots {
  project: string;
  /** Global install root per harness, e.g. `~/.claude`. */
  global?: Partial<Record<string, string>>;
}

export function absPath(roots: Roots, file: Pick<LockFile, 'path' | 'scope' | 'harness'>): string {
  if (file.scope === 'project') return join(roots.project, file.path);
  const root = roots.global?.[file.harness];
  if (!root) throw new Error(`No global install root for harness "${file.harness}"`);
  return join(root, file.path);
}

const read = (abs: string) => (existsSync(abs) ? readFileSync(abs, 'utf8') : undefined);
const key = (f: { scope: string; path: string }) => `${f.scope}:${f.path}`;

/**
 * Compares what adapters want to write with the disk and the previous lock.
 * Never writes. A file whose disk content differs from what the lock recorded was edited by hand
 * and is reported as drift instead of being overwritten, unless `force` is set.
 */
export function planChanges(files: GeneratedFile[], previous: LockFile[], roots: Roots, force = false): Change[] {
  const prev = new Map(previous.map((f) => [key(f), f]));
  const changes: Change[] = [];

  for (const file of files) {
    const abs = absPath(roots, file);
    const disk = read(abs);
    const recorded = prev.get(key(file));
    const hash = sha256(file.content);
    const lock: LockFile = { path: file.path, harness: file.harness, from: file.from, ownership: file.ownership, hash, scope: file.scope };
    const base = { path: file.path, scope: file.scope, abs };

    if (file.ownership === 'owned') {
      if (disk === undefined) changes.push({ ...base, action: 'create', write: file.content, lock });
      else if (sha256(disk) === hash) changes.push({ ...base, action: 'unchanged', lock });
      // An unknown file at a generated path is treated as user content, like drift.
      else if (!force && (!recorded || sha256(disk) !== recorded.hash)) changes.push({ ...base, action: 'drift', ...(recorded ? { lock: recorded } : {}) });
      else changes.push({ ...base, action: 'update', write: file.content, lock });
      continue;
    }

    const current = disk === undefined ? undefined : extractBlock(disk);
    if (disk === undefined) changes.push({ ...base, action: 'create', write: upsertBlock(undefined, file.content), lock });
    else if (current !== undefined && sha256(current) === hash) changes.push({ ...base, action: 'unchanged', lock });
    else if (!force && current !== undefined && recorded && sha256(current) !== recorded.hash) changes.push({ ...base, action: 'drift', lock: recorded });
    else changes.push({ ...base, action: 'update', write: upsertBlock(disk, file.content), lock });
  }

  const wanted = new Set(files.map(key));
  for (const old of previous) {
    if (wanted.has(key(old))) continue;
    const abs = absPath(roots, old);
    const disk = read(abs);
    const base = { path: old.path, scope: old.scope, abs };
    if (disk === undefined) continue;
    const current = old.ownership === 'owned' ? disk : extractBlock(disk);
    if (current === undefined) continue;
    if (!force && sha256(current) !== old.hash) {
      changes.push({ ...base, action: 'drift-orphan', lock: old });
    } else if (old.ownership === 'owned') {
      changes.push({ ...base, action: 'delete' });
    } else {
      const rest = removeBlock(disk);
      changes.push({ ...base, action: 'delete', ...(rest !== undefined ? { write: rest } : {}) });
    }
  }

  return changes.sort((a, b) => a.path.localeCompare(b.path));
}
