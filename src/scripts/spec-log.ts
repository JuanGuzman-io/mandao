import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tasksHaveOwnFile } from '../spec/layout.js';
import { frontmatterOf } from '../spec/markdown.js';

/**
 * Machine files of a spec live in `_log/` (the readability pass): people read the documents in the spec
 * root, scripts read and write the log. Specs started before the move keep their files in the root, and
 * every reader and writer follows the file where it already is, so a spec is never split in two.
 */
export const LOG_DIR = '_log';

export type LogFile =
  | 'execution.md'
  | 'progress.yml'
  | 'reviews'
  | 'mutations'
  | 'gates'
  | 'approvals.yml'
  | 'premises'
  | 'costs.yml'
  | 'full-runs.md'
  | 'session-cuts.md'
  | 'discrepancies.md';

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

/** The documents of a spec, by role. A lite spec keeps requirements, design and (version 1: up to 3) tasks in `spec.md`. */
export type SpecDoc = 'requirements' | 'design' | 'tasks';

export const LITE_DOC = 'spec.md';

/** True when the story's layout version keeps the tasks in `tasks.md` (the rule lives in `src/spec/layout.ts`). */
function tasksAlwaysOwnFile(specDir: string): boolean {
  const story = join(specDir, 'story.md');
  return existsSync(story) && tasksHaveOwnFile(frontmatterOf(readFileSync(story, 'utf8')).data.schema_version);
}

/**
 * The file holding a role: its own document when present, else `spec.md` when present, else its own name.
 * In a version 2 spec the tasks never fall back to `spec.md`.
 */
export function docPath(specDir: string, doc: SpecDoc): string {
  const own = join(specDir, `${doc}.md`);
  if (existsSync(own)) return own;
  if (doc === 'tasks' && tasksAlwaysOwnFile(specDir)) return own;
  const lite = join(specDir, LITE_DOC);
  return existsSync(lite) ? lite : own;
}
