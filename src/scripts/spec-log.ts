import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Machine files of a spec live in `_log/` (the readability pass): people read the documents in the spec
 * root, scripts read and write the log. Specs started before the move keep their files in the root, and
 * every reader and writer follows the file where it already is, so a spec is never split in two.
 */
export const LOG_DIR = '_log';

export type LogFile = 'execution.md' | 'progress.yml' | 'reviews' | 'mutations';

/** Where a machine file of the spec is: `_log/<name>`, or the root when an older spec keeps it there. */
export function logPath(specDir: string, name: LogFile): string {
  const inLog = join(specDir, LOG_DIR, name);
  if (existsSync(inLog)) return inLog;
  const legacy = join(specDir, name);
  if (existsSync(legacy)) return legacy;
  // A new file goes where the spec already keeps its log: the root for an older spec, else `_log/`.
  const older = !existsSync(join(specDir, LOG_DIR)) && ROOT_MARKERS.some((m) => existsSync(join(specDir, m)));
  return older ? legacy : inLog;
}

const ROOT_MARKERS = ['execution.md', 'progress.yml'];

/** True when the folder holds a spec's execution log, in `_log/` or (older specs) in the root. */
export const hasExecutionLog = (specDir: string) =>
  existsSync(join(specDir, LOG_DIR, 'execution.md')) || existsSync(join(specDir, 'execution.md'));
