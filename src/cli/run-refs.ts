import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Command } from 'commander';
import type { SpecFolder } from '../scripts/spec.js';
import { definedRefs, REF_DOCS, renameRef, staleRefs, type TraceFinding } from '../spec/index.js';
import { writeText } from '../writer/files.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { loadSpec } from './spec-context.js';

/** The spec documents that exist, with their text. */
function refDocs(spec: SpecFolder): { name: string; file: string; text: string }[] {
  return REF_DOCS.map((name) => ({ name, file: join(spec.dir, name) }))
    .filter((d) => existsSync(d.file))
    .map((d) => ({ ...d, text: readFileSync(d.file, 'utf8') }));
}

/** `trace`'s phase 20 check: references a document cites that the spec does not define. */
export function specStaleRefs(spec: SpecFolder): TraceFinding[] {
  if (!spec.story || !spec.requirements) return [];
  return staleRefs(refDocs(spec), definedRefs(spec.story, spec.requirements));
}

/**
 * `mandao run rename-ref <spec> <from> <to>`: a reference fix applies to every document of the spec that carries it
 * (phase 20: at MDO-0001's close the PE's answer was applied to the story only).
 */
export function registerRenameRef(run: Command, ctx: CliContext) {
  run
    .command('rename-ref <spec> <from> <to>')
    .description('Replace a reference (AC-2, FR-3, NFR-1, S-1.2) in every document of the spec; prints each file and count')
    .option('--force', 'rename onto a reference the spec already defines (the two merge)')
    .action((ref: string, from: string, to: string, o: { force?: boolean }) => {
      const { spec } = loadSpec(ctx, ref);
      // A rename onto a defined ID merges two references and trace cannot see it afterwards: swap through a free ID.
      if (!o.force && spec.story && spec.requirements && definedRefs(spec.story, spec.requirements).has(to))
        throw new Error(`${to} is already defined in ${spec.name}: rename through a free ID to swap, or pass --force to merge`);
      const files = refDocs(spec).flatMap((d) => {
        const r = renameRef(d.text, from, to);
        if (!r.count) return [];
        writeText(d.file, r.text);
        return [{ file: relative(ctx.root(), d.file).split('\\').join('/'), count: r.count }];
      });
      // The spec read again after the writes: what still cites an undefined reference.
      json({ from, to, files, stale: specStaleRefs(loadSpec(ctx, ref).spec) });
    });
}
