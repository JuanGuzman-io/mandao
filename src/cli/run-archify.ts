import { spawnSync } from 'node:child_process';
import type { Command } from 'commander';
import { archifyScript } from '../engine/archify.js';
import { readConfig } from '../engine/files.js';
import { home } from '../engine/global.js';
import type { CliContext } from './context.js';

/** Registers the common Archify entry point used by every harness-generated command. */
export function registerArchify(run: Command, ctx: CliContext) {
  run
    .command('archify [args...]')
    .description('Run the project-pinned Archify skill')
    .allowUnknownOption()
    .allowExcessArguments()
    .action((args: string[]) => {
      const config = readConfig(ctx.root());
      if (config.diagrams.engine !== 'archify') throw new Error('Archify is disabled by diagrams.engine: mermaid in .mandao/config.yml');
      const script = archifyScript(ctx.root(), home());
      if (!script)
        throw new Error('Archify is required for diagrams but is not installed; run `mandao init` and confirm the pinned Archify install');
      const result = spawnSync(process.execPath, [script, ...(args ?? [])], { cwd: ctx.root(), stdio: 'inherit' });
      if (result.error) throw result.error;
      process.exitCode = result.status ?? 1;
    });
}
