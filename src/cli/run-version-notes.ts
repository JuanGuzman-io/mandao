import { existsSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { branchingFor } from '../scripts/branching.js';
import { collectSpecs, loadTemplate, versionRange } from '../scripts/version-notes.js';
import { releaseVersion, unifiedDiff, versionNotes } from '../spec/index.js';
import { type WriteOutcome, writeText } from '../writer/files.js';
import type { CliContext } from './context.js';
import { json } from './json.js';

interface Options {
  from?: string;
  to?: string;
  write?: boolean;
  force?: boolean;
}

interface Saved {
  written: WriteOutcome | false;
  warning?: string;
  diff?: string;
}

/** Writes the notes; an existing file that differs is kept (warning, diff, exit code 1) unless `force`. */
function save(abs: string, file: string, markdown: string, force: boolean): Saved {
  const before = existsSync(abs) ? readFileSync(abs, 'utf8') : undefined;
  const diff = before === undefined || before === markdown ? undefined : unifiedDiff(before, markdown, file);
  if (diff && !force) {
    const warning = `${file} exists and differs from the generated notes: not overwritten (review the diff, then rerun with --force)`;
    console.error(warning);
    process.exitCode = 1;
    return { written: false, warning, diff };
  }
  return { written: writeText(abs, markdown), ...(diff ? { diff } : {}) };
}

/** `mandao run version-notes`: a version's release notes from the specs closed since the previous tag (phase 10). */
export function registerVersionNotes(run: Command, ctx: CliContext) {
  run
    .command('version-notes <version>')
    .description('Release notes of a version: the "For the PO" text of every spec closed since the previous tag, by type (JSON)')
    .option('--from <tag>', 'start of the range (default: the previous tag reachable from --to)')
    .option('--to <ref>', 'end of the range (default: origin/<base> when it exists, else HEAD)')
    .option('--write', 'write <paths.releases>/v<version>.md')
    .option('--force', 'with --write, overwrite an existing file that differs')
    .action((input: string, o: Options) => {
      const version = releaseVersion(input);
      const root = ctx.root();
      const config = readConfig(root);
      const range = versionRange(root, version, branchingFor(config).base, o);
      const { entries, straddling } = collectSpecs(root, config, range);
      const loaded = loadTemplate(root, config);
      const { markdown, specs, missing } = versionNotes(loaded.template, version, entries);
      const file = posix.join(config.paths.releases, `v${version}.md`);
      const saved: Saved = o.write ? save(join(root, file), file, markdown, o.force ?? false) : { written: false };
      json({
        version,
        range,
        file,
        specs,
        missing,
        straddling,
        language: config.language.business,
        templateLanguage: loaded.language,
        template: loaded.path,
        fallback: loaded.fallback,
        markdown,
        ...saved,
      });
    });
}
