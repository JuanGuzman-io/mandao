import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { type CloseSummary, sectionOf } from '../spec/index.js';

export interface PublishPayload {
  target: string;
  kind: 'comment';
  /** The exact text that will be posted. */
  text: string;
  attachments: { path: string; bytes: number; sha256: string }[];
  /** Hash of text and attachments: the same hash means nothing to update. */
  hash: string;
}

export interface PublishPlan {
  payload: PublishPayload;
  /** create: never published there · update: content changed · unchanged: skip, nothing to send. */
  action: 'create' | 'update' | 'unchanged';
  /** First publication of this spec anywhere: show the whole payload before asking (ADR 0026). */
  preview: boolean;
  previous?: CloseSummary['published'][number];
}

const sha = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');

/** PNG/SVG exports next to the release notes or in the spec's diagrams folder. */
function attachments(root: string, dirs: string[]): PublishPayload['attachments'] {
  return dirs
    .filter((d) => existsSync(d))
    .flatMap((d) =>
      readdirSync(d)
        .filter((f) => /\.(png|svg)$/i.test(f))
        .map((f) => join(d, f)),
    )
    .sort()
    .map((file) => ({ path: relative(root, file), bytes: statSync(file).size, sha256: sha(readFileSync(file)) }));
}

/** A version 2 spec publishes the `For the PO` section of its `close-summary.md`; a version 1 spec, its release notes. */
function notesText(root: string, releaseDir: string, specDir: string, version: 1 | 2): string {
  if (version === 1) {
    const notes = join(releaseDir, 'release-notes.md');
    if (!existsSync(notes)) throw new Error(`${relative(root, notes)} does not exist: close writes the release notes first`);
    return readFileSync(notes, 'utf8');
  }
  const file = join(specDir, 'close-summary.md');
  const text = existsSync(file) ? sectionOf(readFileSync(file, 'utf8'), 'For the PO')?.trim() : undefined;
  if (!text) throw new Error(`${relative(root, file)} has no "For the PO" section: close writes it first`);
  return `${text}\n`;
}

/** What would be published to `target`, and whether it is new, changed or already there. */
export function publishPlan(
  root: string,
  releaseDir: string,
  specDir: string,
  target: string,
  summary: CloseSummary,
  version: 1 | 2 = 1,
): PublishPlan {
  const text = notesText(root, releaseDir, specDir, version);
  const files = attachments(root, version === 1 ? [releaseDir, join(specDir, 'diagrams')] : [join(specDir, 'diagrams')]);
  const hash = sha(JSON.stringify({ text, files: files.map((f) => f.sha256) }));
  const payload: PublishPayload = { target, kind: 'comment', text, attachments: files, hash };
  const previous = summary.published.find((p) => p.target === target && p.kind === 'comment');
  const action = !previous ? 'create' : previous.hash === hash ? 'unchanged' : 'update';
  return { payload, action, preview: summary.published.length === 0, ...(previous ? { previous } : {}) };
}
