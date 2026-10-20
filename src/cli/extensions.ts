import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { HARNESS_IDS, type HarnessId } from '../schemas/index.js';
import { type CliContext, editConfig, sync } from './context.js';
import { c, harnessSetupNotes } from './output.js';
import { skillsAdd, skillsList } from './skills.js';

/** harness add, skills list, skills add. */
export function registerExtensions(program: Command, ctx: CliContext) {
  const harness = program.command('harness').description('Manage harnesses');
  harness
    .command('add <ids...>')
    .description('Generate files for more harnesses')
    .action((ids: string[]) => {
      const bad = ids.filter((h) => !(HARNESS_IDS as readonly string[]).includes(h));
      if (bad.length) throw new Error(`Unknown harness: ${bad.join(', ')}. Available: ${HARNESS_IDS.join(', ')}`);
      const current = readConfig(ctx.root()).harnesses;
      const added = (ids as HarnessId[]).filter((h) => !current.includes(h));
      if (!added.length) return console.log(c.dim('  Nothing to add.'));
      editConfig(ctx, (doc) => doc.set('harnesses', [...current, ...added]));
      sync(ctx, {});
      for (const line of harnessSetupNotes(added)) console.log(c.dim(line));
    });

  const skills = program.command('skills').description('Manage project skills');
  skills
    .command('list')
    .description('List pinned skills')
    .option('--json', 'print a JSON array of id, version, vetted and source')
    .action((opts: { json?: boolean }) => skillsList(ctx, opts));
  skills
    .command('add <ids...>')
    .description('Install catalog skills (or packs) with their ecosystem tool, verify them and pin them in the lock')
    .option('-y, --yes', 'install without asking for confirmation (CI)')
    .action((ids: string[], opts: { yes?: boolean }) => skillsAdd(ctx, ids, opts));
}
