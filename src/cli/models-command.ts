import type { Command } from 'commander';
import { type HarnessId, ROLES, TIERS, type Tier } from '../schemas/index.js';
import { type CliContext, sync } from './context.js';
import { isHarness, printModels, resolveForCli, setMode, setModel } from './models.js';

/** models, models set, models mode. Positional options keep `--harness` on the subcommand. */
export function registerModels(program: Command, ctx: CliContext) {
  const models = program
    .command('models')
    .enablePositionalOptions()
    .description('Show the model each role uses per harness, with its source')
    .option('--project <name>', 'resolve for one project')
    .option('--harness <id>', 'only this harness')
    .action((opts: { project?: string; harness?: string }) => {
      if (opts.harness && !isHarness(opts.harness)) throw new Error(`Unknown harness "${opts.harness}"`);
      printModels(resolveForCli(ctx.root(), { project: opts.project, harness: opts.harness as HarnessId | undefined }));
    });
  models
    .command('set <role> <model>')
    .description(`Choose the model for a role (${ROLES.join(', ')}) and regenerate`)
    .option('--harness <id>', 'only this harness (default: every active harness)')
    .option('--tier <tier>', 'implementer tier in routed mode: fast | standard | strong')
    .option('--project <name>', 'write to the project models.yml instead of the workspace one')
    .action((role: string, model: string, opts: { harness?: string; tier?: string; project?: string }) => {
      if (opts.harness && !isHarness(opts.harness)) throw new Error(`Unknown harness "${opts.harness}"`);
      if (opts.tier && !(TIERS as readonly string[]).includes(opts.tier)) throw new Error(`Unknown tier "${opts.tier}"`);
      setModel(ctx.root(), {
        role,
        model,
        harness: opts.harness as HarnessId | undefined,
        tier: opts.tier as Tier | undefined,
        project: opts.project,
      });
      sync(ctx, {});
    });
  models
    .command('mode <mode>')
    .description('simple: one model to implement and one to review · routed: the Implementer follows each task tier')
    .action((mode: string) => {
      setMode(ctx.root(), mode);
      sync(ctx, {});
    });
}
