import { mkdirSync, readdirSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { LockFile } from '../schemas/index.js';
import type { Change } from './plan.js';

function pruneEmptyDirs(dir: string, stopAt: string[]) {
  let current = dir;
  while (!stopAt.includes(current) && current !== dirname(current)) {
    try {
      if (readdirSync(current).length > 0) return;
      rmdirSync(current);
    } catch {
      return;
    }
    current = dirname(current);
  }
}

/** Applies a change plan and returns the lock entries to record. */
export function applyChanges(changes: Change[], stopAt: string[]): LockFile[] {
  for (const c of changes) {
    if (c.action === 'create' || c.action === 'update') {
      mkdirSync(dirname(c.abs), { recursive: true });
      writeFileSync(c.abs, c.write!);
    } else if (c.action === 'delete') {
      if (c.write !== undefined) {
        writeFileSync(c.abs, c.write);
      } else {
        rmSync(c.abs, { force: true });
        pruneEmptyDirs(dirname(c.abs), stopAt);
      }
    }
  }
  return changes.flatMap((c) => (c.lock ? [c.lock] : []));
}
