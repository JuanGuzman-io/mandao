import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
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

const integrityFile = (specDir: string) =>
  existsSync(join(specDir, '_log')) ? join(specDir, '_log', INTEGRITY) : join(specDir, INTEGRITY);

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
