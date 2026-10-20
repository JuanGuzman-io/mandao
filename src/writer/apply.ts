import type { LockFile } from '../schemas/index.js';
import { removeFile, writeText } from './files.js';
import type { Change } from './plan.js';

/** Applies a change plan and returns the lock entries to record. */
export function applyChanges(changes: Change[], stopAt: string[]): LockFile[] {
  for (const c of changes) {
    if (c.action === 'create' || c.action === 'update') writeText(c.abs, c.write!);
    else if (c.action === 'delete') {
      if (c.write !== undefined) writeText(c.abs, c.write);
      else removeFile(c.abs, stopAt);
    }
  }
  return changes.flatMap((c) => (c.lock ? [c.lock] : []));
}
