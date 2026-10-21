import {
  chmodSync,
  constants,
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative } from 'node:path';
import { type Document, parseDocument } from 'yaml';
import { sha256 } from '../util/hash.js';
import { recordLogWrite } from './log-integrity.js';

/**
 * The only place Mandao writes to disk (ADR 0007). Every write is idempotent: identical content is
 * never rewritten. Edits of user-intent files (config.yml, models.yml) are optimistic: they fail
 * when the file changed on disk after it was read.
 */
export type WriteOutcome = 'created' | 'updated' | 'unchanged';

export function writeText(abs: string, content: string): WriteOutcome {
  const before = existsSync(abs) ? readFileSync(abs, 'utf8') : undefined;
  if (before !== content) {
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  // A spec log written by a script: remember it, so an edit made any other way is caught.
  recordLogWrite(abs, content);
  if (before === content) return 'unchanged';
  return before === undefined ? 'created' : 'updated';
}

/** Writes only when the file does not exist yet; user content is never replaced. */
/** Creates a directory (and its parents) if it does not exist. */
export function ensureDir(abs: string): void {
  mkdirSync(abs, { recursive: true });
}

export function createIfMissing(abs: string, content: string): WriteOutcome {
  return existsSync(abs) ? 'unchanged' : writeText(abs, content);
}

export function removeFile(abs: string, pruneUpTo: string[]): void {
  rmSync(abs, { force: true });
  let current = dirname(abs);
  while (!pruneUpTo.includes(current) && current !== dirname(current)) {
    try {
      if (readdirSync(current).length > 0) return;
      rmdirSync(current);
    } catch {
      return;
    }
    current = dirname(current);
  }
}

/**
 * Removes a folder Mandao created, but only one strictly inside `within`: a scratch folder in a spec's
 * `_log/`, a temporary clone in `os.tmpdir()`, or a partial skill copy in the workspace. Never anything else.
 */
export function removeScratchDir(abs: string, within: string): void {
  const rel = relative(within, abs);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error(`${abs} is not inside ${within}`);
  rmSync(abs, { recursive: true, force: true });
}

/** A fresh folder under the OS temporary folder; the caller removes it with `removeScratchDir(dir, tmpdir())`. */
export function makeScratchDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

/**
 * Copies one regular file to a path that must not exist yet (a skill copy, D3 of MDO-0009), keeping its
 * permission bits. Refuses a symlink or anything that is not a regular file; never overwrites.
 */
export function copyNewFile(src: string, dest: string): void {
  const stat = lstatSync(src);
  if (!stat.isFile()) throw new Error(`${src} is not a regular file`);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest, constants.COPYFILE_EXCL);
  chmodSync(dest, stat.mode & 0o777);
}

/** Copies a file or a folder into place (worktree setup: env files, the graph cache). Never a symlink. */
export function copyInto(src: string, dest: string): void {
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true, dereference: true, force: true });
}

export class ConcurrentEditError extends Error {
  constructor(readonly path: string) {
    super(`${path} changed on disk while Mandao was editing it. Nothing was written; run the command again.`);
  }
}

export interface Snapshot {
  abs: string;
  content: string | undefined;
  hash: string | undefined;
}

export function snapshot(abs: string): Snapshot {
  const content = existsSync(abs) ? readFileSync(abs, 'utf8') : undefined;
  return { abs, content, hash: content === undefined ? undefined : sha256(content) };
}

/** Writes `content` only if the file still matches the snapshot taken before editing. */
export function writeFromSnapshot(snap: Snapshot, content: string): WriteOutcome {
  const now = snapshot(snap.abs);
  if (now.hash !== snap.hash) throw new ConcurrentEditError(snap.abs);
  return writeText(snap.abs, content);
}

/** Edits a YAML file in place, keeping comments and order; creates it from `initial` when missing. */
export function editYaml(abs: string, mutate: (doc: Document) => void, initial = ''): WriteOutcome {
  const snap = snapshot(abs);
  const doc = parseDocument(snap.content ?? initial);
  mutate(doc);
  return writeFromSnapshot(snap, doc.toString({ lineWidth: 0 }));
}
