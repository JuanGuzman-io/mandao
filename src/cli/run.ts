import { join } from 'node:path';
import type { Command } from 'commander';
import { readCatalog } from '../engine/catalog.js';
import { readConfig } from '../engine/files.js';
import { independence } from '../models/resolve.js';
import type { HarnessId } from '../schemas/index.js';
import { fingerprintProject, proposeSkills } from '../scripts/fingerprint.js';
import { analyzeDiff, collectDiff, DEFAULT_LIMITS, type FileStat, type ManifestChange } from '../scripts/quick-check.js';
import type { CliContext } from './context.js';
import { isHarness, resolveForCli } from './models.js';

/** run quick-check, run models, run fingerprint: JSON on stdout for the commands to read. */
export function registerRun(program: Command, ctx: CliContext) {
  const run = program.command('run').description('Helper scripts that Mandao commands call');
  run
    .command('quick-check')
    .description('Measure the working-tree diff against the quick limits (JSON on stdout)')
    .option('--base <ref>', 'git ref to diff against', 'HEAD')
    .option('--max-files <n>', 'file limit', String(DEFAULT_LIMITS.maxFiles))
    .option('--max-loc <n>', 'changed-lines limit', String(DEFAULT_LIMITS.maxLoc))
    .action((opts: { base: string; maxFiles: string; maxLoc: string }) => {
      const config = readConfig(ctx.root());
      const repos =
        config.workspace === 'polyrepo'
          ? config.projects.map((p) => ({ dir: join(ctx.root(), p.path), prefix: p.path }))
          : [{ dir: ctx.root(), prefix: '' }];
      const files: FileStat[] = [];
      const manifests: ManifestChange[] = [];
      for (const r of repos) {
        const diff = collectDiff(r.dir, opts.base, r.prefix);
        files.push(...diff.files);
        manifests.push(...diff.manifests);
      }
      const report = analyzeDiff(files, manifests, config, { maxFiles: Number(opts.maxFiles), maxLoc: Number(opts.maxLoc) });
      console.log(JSON.stringify(report, null, 2));
    });
  run
    .command('models')
    .description('Resolved model per role (flag > spec > project > workspace > recommendation), JSON on stdout')
    .option('--project <name>', 'project of the task')
    .option('--spec <dir>', 'spec folder whose story.md frontmatter may set models')
    .option('--set <role=model...>', 'command-line overrides, e.g. reviewer=sonnet or implementer.strong=opus')
    .option('--harness <id>', 'only this harness')
    .action((opts: { project?: string; spec?: string; set?: string[]; harness?: string }) => {
      if (opts.harness && !isHarness(opts.harness)) throw new Error(`Unknown harness "${opts.harness}"`);
      const all = resolveForCli(ctx.root(), { ...opts, harness: opts.harness as HarnessId | undefined });
      console.log(
        JSON.stringify(
          all.map((m) => ({ ...m, independence: independence(m) })),
          null,
          2,
        ),
      );
    });
  run
    .command('fingerprint')
    .description('Stack fingerprint per project and the skills the catalog proposes (JSON on stdout)')
    .action(() => {
      const config = readConfig(ctx.root());
      const catalog = readCatalog();
      const fingerprints = config.projects.map((p) => fingerprintProject(ctx.root(), p, catalog));
      console.log(JSON.stringify({ fingerprints, bootstrap: catalog.bootstrap, proposal: proposeSkills(fingerprints, catalog) }, null, 2));
    });
}
