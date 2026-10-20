import { join } from 'node:path';
import type { Command } from 'commander';
import { readCatalog } from '../engine/catalog.js';
import { readConfig } from '../engine/files.js';
import { independence } from '../models/resolve.js';
import type { HarnessId } from '../schemas/index.js';
import { fingerprintProject, proposeSkills } from '../scripts/fingerprint.js';
import { analyzeDiff, collectDiff, type FileStat, type ManifestChange, sizeLimits } from '../scripts/quick-check.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { isHarness, resolveForCli } from './models.js';
import { registerLeader } from './run-leader.js';
import { registerPremise } from './run-premise.js';
import { registerQuickLog } from './run-quick.js';
import { registerSpecScripts, registerSpecWriters } from './run-spec.js';

/** run quick-check, run models, run fingerprint: JSON on stdout for the commands to read. */
export function registerRun(program: Command, ctx: CliContext) {
  const run = program.command('run').description('Helper scripts that Mandao commands call');
  registerSpecScripts(run, ctx);
  registerSpecWriters(run, ctx);
  registerQuickLog(run, ctx);
  registerLeader(run, ctx);
  registerPremise(run, ctx);
  run
    .command('quick-check')
    .description('Measure the real working-tree diff (git diff --numstat) against size_limits.quick (JSON on stdout)')
    .option('--base <ref>', 'git ref to diff against', 'HEAD')
    .option('--project <name>', "apply this project's size_limits over the workspace's")
    .option('--max-files <n>', 'override size_limits.quick.max_files')
    .option('--max-changed-lines <n>', 'override size_limits.quick.max_changed_lines')
    .action((opts: { base: string; project?: string; maxFiles?: string; maxChangedLines?: string }) => {
      const config = readConfig(ctx.root());
      const project = opts.project ? config.projects.find((p) => p.name === opts.project) : undefined;
      const quick = sizeLimits(config.size_limits, project?.size_limits).quick;
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
      const report = analyzeDiff(files, manifests, config, {
        maxFiles: Number(opts.maxFiles ?? quick.max_files),
        maxChangedLines: Number(opts.maxChangedLines ?? quick.max_changed_lines),
      });
      json(report);
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
      json(all.map((m) => ({ ...m, independence: independence(m) })));
    });
  run
    .command('fingerprint')
    .description('Stack fingerprint per project and the skills the catalog proposes (JSON on stdout)')
    .action(() => {
      const config = readConfig(ctx.root());
      const catalog = readCatalog();
      const fingerprints = config.projects.map((p) => fingerprintProject(ctx.root(), p, catalog));
      json({ fingerprints, bootstrap: catalog.bootstrap, proposal: proposeSkills(fingerprints, catalog) });
    });
}
