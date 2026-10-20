import { join } from 'node:path';
import type { Document } from 'yaml';
import { CONFIG_FILE } from '../engine/files.js';
import { syncProject } from '../engine/sync.js';
import { editYaml } from '../writer/files.js';
import { c, printChanges, printWarnings } from './output.js';

/** What every command needs: the workspace root, resolved lazily so tests can point it anywhere. */
export interface CliContext {
  root: () => string;
}

/** Edits config.yml in place, keeping the user's comments and ordering. */
export function editConfig(ctx: CliContext, mutate: (doc: Document) => void) {
  editYaml(join(ctx.root(), CONFIG_FILE), mutate);
}

export function sync(ctx: CliContext, opts: { force?: boolean; dryRun?: boolean; verbose?: boolean }) {
  const result = syncProject(ctx.root(), opts);
  printChanges(result.changes, opts.verbose);
  printWarnings(result.warnings);
  if (opts.dryRun) console.log(c.dim('  Dry run: nothing was written.'));
}
