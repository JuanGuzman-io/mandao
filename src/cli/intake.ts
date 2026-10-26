import { join } from 'node:path';
import type { Command } from 'commander';
import { hasConfig, readConfig } from '../engine/files.js';
import { cleanIntake, closeIntake } from '../scripts/intake.js';
import type { CliContext } from './context.js';
import { json } from './json.js';

/** `paths.intake` (default `docs/product/intake/`) under the workspace home; the default when there is no config. */
function proposalsDir(root: string): string {
  if (!hasConfig(root)) return join(root, 'docs', 'product', 'intake');
  const config = readConfig(root);
  return join(root, config.home, config.paths.intake);
}

/** `mandao intake close|clean`: closing an intake proposal and its local cache (phase 14). */
export function registerIntake(program: Command, ctx: CliContext) {
  const intake = program.command('intake').description('Requirements document intake: close a proposal, clean the extraction cache');
  intake
    .command('close <proposal>')
    .description('Check the proposal, refuse on problems, set status: closed and delete .mandao/cache/intake/<doc>/ (JSON)')
    .action((proposal: string) => json(closeIntake(ctx.root(), proposal)));
  intake
    .command('clean [doc]')
    .description("Delete a doc's intake cache; without a doc, every cache whose proposals are all closed (JSON)")
    .action((doc: string | undefined) => {
      const root = ctx.root();
      json(cleanIntake(root, doc, proposalsDir(root)));
    });
}
