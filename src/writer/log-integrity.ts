import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { keepsLogCache, STORY_ID } from '../schemas/index.js';
import { sha256 } from '../util/hash.js';

/**
 * Spec logs are written only by Mandao's scripts (MDO-0008: the Leader edited progress.yml and tasks.md by
 * hand). Every script write of a log records its hash here; `checkpoint` compares, and an edit made any
 * other way becomes a recorded discrepancy. Probes and scratch folders of premises are not logs.
 */
const INTEGRITY = '.integrity.json';
const ROOT_LOGS = new Set(['execution.md', 'progress.yml']);
const NOT_LOGS = /\/_log\/(premises\/(probes|tmp)\/|\.integrity\.json$)/;

/** The spec folder a log belongs to, or undefined when the path is not a spec log. */
function specDirOf(abs: string): string | undefined {
  const p = abs.replace(/\\/g, '/');
  if (NOT_LOGS.test(p)) return undefined;
  const i = p.lastIndexOf('/_log/');
  if (i >= 0) return abs.slice(0, i);
  const dir = dirname(abs);
  return ROOT_LOGS.has(basename(abs)) && existsSync(join(dir, 'story.md')) ? dir : undefined;
}

/**
 * A scalar of the story's front matter, read without the spec domain (the writer depends on schemas only):
 * a quoted value is a string and an unquoted integer a number, as YAML reads them. Any other value is
 * returned as written, and the caller's check (a layout version, a story id) refuses it.
 */
function storyField(specDir: string, field: string): string | number | undefined {
  const story = join(specDir, 'story.md');
  if (!existsSync(story)) return undefined;
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(story, 'utf8'))?.[1] ?? '';
  const m = new RegExp(`^${field}:[ \\t]*(?:'([^']*)'|"([^"]*)"|([^\\s#]\\S*))`, 'm').exec(front);
  if (!m) return undefined;
  if (m[3] === undefined) return m[1] ?? m[2];
  return /^\d+$/.test(m[3]) ? Number(m[3]) : m[3];
}

/**
 * True when the spec's layout (its story's `schema_version`) keeps only six files in `_log/` and the rest,
 * integrity hashes included, in the spec's local cache (MDO-0011 design D3). It is the predicate the spec
 * domain's `specLogInCache` uses, so a quoted or unknown version never splits one spec between two layouts.
 */
export const usesLogCache = (specDir: string) => keepsLogCache(storyField(specDir, 'schema_version'));

/** The workspace root of a spec: the nearest folder above it with `.mandao/config.yml`, else the folder above `specs/`. */
function workspaceOf(specDir: string): string {
  for (let dir = dirname(specDir); dir !== dirname(dir); dir = dirname(dir)) if (existsSync(join(dir, '.mandao', 'config.yml'))) return dir;
  return dirname(dirname(specDir));
}

/** `.mandao/cache/`: where every spec's local cache lives, and the only folder a cache removal may reach into. */
export const cacheRoot = (specDir: string) => join(workspaceOf(specDir), '.mandao', 'cache');

/**
 * `.mandao/cache/<ID>/`: the spec's local bulk, ignored by git (packs, full gate output, probes, mutations,
 * hashes). The ID is the story's `id`, else the story id the folder name starts with. Anything that is not a
 * story id (`..`, a path, lower case) throws, so no cache write or removal can land outside `.mandao/cache/`.
 */
export function specCacheDir(specDir: string): string {
  const fromStory = storyField(specDir, 'id');
  const id = fromStory === undefined ? /^[A-Z][A-Z0-9_]*-\d+(?=-|$)/.exec(basename(specDir))?.[0] : String(fromStory);
  if (id === undefined || !STORY_ID.test(id)) {
    const shown = JSON.stringify(id ?? basename(specDir));
    throw new Error(`${specDir}: ${shown} is not a story id like PROJ-123, so it cannot name the spec's cache folder`);
  }
  return join(cacheRoot(specDir), id);
}

const integrityFile = (specDir: string) => {
  if (usesLogCache(specDir)) return join(specCacheDir(specDir), 'integrity.json');
  return existsSync(join(specDir, '_log')) ? join(specDir, '_log', INTEGRITY) : join(specDir, INTEGRITY);
};

const readHashes = (file: string): Record<string, string> => {
  try {
    return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>) : {};
  } catch {
    return {};
  }
};

function saveHashes(specDir: string, update: (h: Record<string, string>) => void): void {
  const file = integrityFile(specDir);
  const hashes = readHashes(file);
  update(hashes);
  const sorted = Object.fromEntries(Object.entries(hashes).sort(([a], [b]) => a.localeCompare(b)));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(sorted, null, 2)}\n`);
}

/** Called by writeText: remembers what a script wrote to a spec log. */
export function recordLogWrite(abs: string, content: string): void {
  const specDir = specDirOf(abs);
  if (!specDir) return;
  saveHashes(specDir, (h) => {
    h[relative(specDir, abs).replace(/\\/g, '/')] = sha256(content);
  });
}

/** Logs whose content differs from what a script last wrote, or that were deleted. */
export function logDiscrepancies(specDir: string): string[] {
  const hashes = readHashes(integrityFile(specDir));
  return Object.entries(hashes)
    .filter(([path, hash]) => {
      const file = join(specDir, path);
      return !existsSync(file) || sha256(readFileSync(file, 'utf8')) !== hash;
    })
    .map(([path]) => path);
}

/** After a discrepancy is recorded in the ledger, the current content becomes the reference. */
export function acceptLogs(specDir: string, paths: string[]): void {
  saveHashes(specDir, (h) => {
    for (const path of paths) {
      const file = join(specDir, path);
      if (existsSync(file)) h[path] = sha256(readFileSync(file, 'utf8'));
      else delete h[path];
    }
  });
}
