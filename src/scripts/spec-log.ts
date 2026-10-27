import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { effectiveLayoutVersion, HARNESS_IDS, keepsLogCache } from '../schemas/index.js';
import { type Approval, parseApprovals, renderApprovals } from '../spec/approvals.js';
import { renderCosts } from '../spec/costs.js';
import { LAYOUT_VERSIONS, layoutManifest, tasksHaveOwnFile } from '../spec/layout.js';
import { frontmatterOf } from '../spec/markdown.js';
import { type Progress, progressSchema } from '../spec/progress.js';
import { parseState, renderState, type State } from '../spec/state.js';
import { createIfMissing, removeScratchDir, writeText } from '../writer/files.js';
import { cacheRoot, specCacheDir } from '../writer/log-integrity.js';

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

/** The version 2 home of the logical logs merged into `_log/state.yml` (design D3). */
export const STATE_FILE = 'state.yml';
const IN_STATE: ReadonlySet<LogFile> = new Set<LogFile>(['progress.yml', 'approvals.yml', 'session-cuts.md']);

/** True when a layout version (a story's `schema_version`) keeps start, baseline, progress, approvals and cut estimates in `state.yml`. */
export function keepsStateFile(schemaVersion: unknown): boolean {
  const version = LAYOUT_VERSIONS.find((v) => v === schemaVersion);
  return version !== undefined && layoutManifest(version, 'lite').log.includes(STATE_FILE);
}

/** The spec's layout version: the story's `schema_version`, or the current layout before the story when `mandao start` wrote `_log/state.yml`. */
function storyVersion(specDir: string): unknown {
  const story = join(specDir, 'story.md');
  const hasStory = existsSync(story);
  const declared = hasStory ? frontmatterOf(readFileSync(story, 'utf8')).data.schema_version : undefined;
  return effectiveLayoutVersion(declared, hasStory, existsSync(join(specDir, LOG_DIR, STATE_FILE)));
}

/** True when this spec keeps its state in `_log/state.yml`; a version 1 spec, or a folder without a story, keeps its own files. */
export const specKeepsState = (specDir: string) => keepsStateFile(storyVersion(specDir));

/**
 * Where a machine file of the spec is: `_log/<name>`, or the root when an older spec keeps it there. In a
 * version 2 spec, `progress.yml`, `approvals.yml` and `session-cuts.md` are sections of `_log/state.yml`:
 * read and write them with the section helpers below, never as whole files.
 */
export function logPath(specDir: string, name: LogFile): string {
  if (IN_STATE.has(name) && specKeepsState(specDir)) return join(specDir, LOG_DIR, STATE_FILE);
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
const tasksAlwaysOwnFile = (specDir: string) => tasksHaveOwnFile(storyVersion(specDir));

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

const readIf = (file: string) => (existsSync(file) ? readFileSync(file, 'utf8') : undefined);

/** `_log/state.yml` of a version 2 spec; empty when it does not exist yet. A section that breaks its schema throws. */
export const readState = (specDir: string): State => parseState(readIf(join(specDir, LOG_DIR, STATE_FILE)));

/** Rewrites `_log/state.yml` with one change applied, keeping every other section as it was. */
export function updateState(specDir: string, change: (state: State) => State): void {
  ensureLogFiles(specDir);
  writeText(join(specDir, LOG_DIR, STATE_FILE), renderState(change(readState(specDir))));
}

/** Every approval row of the spec: the `approvals` section of `state.yml` (version 2) or `approvals.yml` (version 1). */
export function readApprovalLog(specDir: string): Approval[] {
  return specKeepsState(specDir) ? readState(specDir).approvals : parseApprovals(readIf(logPath(specDir, 'approvals.yml')));
}

/** Appends an approval row, never rewriting the earlier ones. */
export function appendApprovalLog(specDir: string, row: Approval): void {
  if (specKeepsState(specDir)) updateState(specDir, (s) => ({ ...s, approvals: [...s.approvals, row] }));
  else writeText(logPath(specDir, 'approvals.yml'), renderApprovals([...readApprovalLog(specDir), row]));
}

/**
 * The spec's checkpoint, from the `progress` section of `state.yml` (version 2) or `progress.yml`
 * (version 1, read as before). `invalid` when the checkpoint is there but does not match its schema.
 */
export function readProgress(specDir: string): { progress?: Progress; invalid?: true } {
  const text = readIf(logPath(specDir, 'progress.yml'));
  if (!text) return {};
  let data: unknown = parseYaml(text);
  if (specKeepsState(specDir)) {
    data = (data as { progress?: unknown } | null)?.progress;
    if (data === undefined) return {};
  }
  const r = progressSchema.safeParse(data);
  return r.success ? { progress: r.data } : { invalid: true };
}

/** True when the spec keeps a six-file `_log/` (layout version 2): reviews, gates and premises are one file each. */
export const specLogInCache = (specDir: string) => keepsLogCache(storyVersion(specDir));

/** A path in the spec's local cache, `.mandao/cache/<ID>/…`: never committed, deleted at close unless `logs.level: full`. */
export const cachePath = (specDir: string, ...parts: string[]) => join(specCacheDir(specDir), ...parts);

/**
 * At close: deletes the spec's local cache, unless `logs.level: full` keeps it. A version 1 spec has none.
 * Throws when the story id is not a story id; the removal never reaches outside `.mandao/cache/`.
 */
export function dropLogCache(specDir: string, level: 'summary' | 'full'): boolean {
  if (level === 'full' || !specLogInCache(specDir)) return false;
  const dir = specCacheDir(specDir);
  if (!existsSync(dir)) return false;
  removeScratchDir(dir, cacheRoot(specDir));
  return true;
}

/** The version 2 log files made of one section per task attempt or per premise. */
export type SectionLog = 'reviews.md' | 'gates.md' | 'premises.md';

/** A section heading of a merged log: `## Tn — attempt k…` or `## Pn — …`. Other headings inside a section's body do not end it. */
const SECTION_HEAD = /^## (?:T\d+ — attempt \d+|P\d+ — )/;

const FILE_TITLE: Record<SectionLog, string> = {
  'reviews.md': '# Reviews',
  'gates.md': '# Gates',
  'premises.md': '# Premises',
};

/** The sections of a merged log by title (the heading without `## `), in file order. */
export function logSections(specDir: string, file: SectionLog): Map<string, string> {
  const sections = new Map<string, string>();
  let title: string | undefined;
  let body: string[] = [];
  const flush = () => {
    if (title !== undefined) sections.set(title, body.join('\n').trim());
  };
  for (const line of (readIf(join(specDir, LOG_DIR, file)) ?? '').split('\n')) {
    if (SECTION_HEAD.test(line)) {
      flush();
      title = line.slice(3).trim();
      body = [];
    } else if (title !== undefined) body.push(line);
  }
  flush();
  return sections;
}

const REVIEW_TITLE = /^(T\d+) — attempt (\d+)(?: \(via [^)]+\))?$/;
/**
 * v1: `Tn-k-review.md` (checkpoint) or `Tn-k-<harness>.md` (`run review --via`). Packs (`Tn-k-pack.md`) and test
 * reviews (`Tn-k-test-review.md`) share the folder and are not task reviews.
 */
const REVIEW_FILE = new RegExp(`^(T\\d+)-(\\d+)-(?:review|${HARNESS_IDS.join('|')})\\.md$`);

/** Every Reviewer answer of the spec by task and attempt: `reviews.md` sections (version 2) or `_log/reviews/` files. */
export function taskReviews(specDir: string): { task: string; attempt: number; text: string }[] {
  if (specLogInCache(specDir)) {
    return [...logSections(specDir, 'reviews.md')].flatMap(([title, text]) => {
      const m = REVIEW_TITLE.exec(title);
      return m ? [{ task: m[1]!, attempt: Number(m[2]), text }] : [];
    });
  }
  const dir = logPath(specDir, 'reviews');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const m = REVIEW_FILE.exec(name);
    return m ? [{ task: m[1]!, attempt: Number(m[2]), text: readFileSync(join(dir, name), 'utf8') }] : [];
  });
}

/**
 * The six files of a version 2 log are always there (FR-3): the first write to the log creates the ones
 * whose events may never happen (no review, no gate, no premise, no cost recorded) with their empty form.
 * `state.yml` and `execution.md` keep being created by their own writers.
 */
function ensureLogFiles(specDir: string): void {
  if (!specLogInCache(specDir)) return;
  for (const [file, title] of Object.entries(FILE_TITLE)) createIfMissing(join(specDir, LOG_DIR, file), `${title}\n`);
  createIfMissing(join(specDir, LOG_DIR, 'costs.yml'), renderCosts([]));
}

/** Writes one section of a merged log, replacing the section with the same title and keeping every other one. */
export function writeLogSection(specDir: string, file: SectionLog, title: string, body: string): string {
  ensureLogFiles(specDir);
  const sections = logSections(specDir, file);
  sections.set(title, body.trim());
  const path = join(specDir, LOG_DIR, file);
  writeText(path, `${FILE_TITLE[file]}\n\n${[...sections].map(([t, b]) => `## ${t}\n\n${b}\n`).join('\n')}`);
  return path;
}
