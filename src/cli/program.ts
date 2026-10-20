import { Command } from 'commander';
import { packageInfo } from '../util/package-root.js';
import { registerApprove } from './approve.js';
import type { CliContext } from './context.js';
import { registerExtensions } from './extensions.js';
import { registerHook } from './hook.js';
import { registerModels } from './models-command.js';
import { registerRun } from './run.js';
import { registerSetup } from './setup.js';
import { registerStart } from './start.js';
import { registerWorktree } from './worktree.js';

/**
 * The CLI, built per call so tests can run it against a temporary workspace. Positional options keep
 * `--harness` on `models set` instead of letting the parent `models` command take it.
 */
export function buildProgram(cwd: () => string = () => process.cwd()): Command {
  const ctx: CliContext = { root: cwd };
  const program = new Command()
    .enablePositionalOptions()
    .name('mandao')
    .description('Spec-Driven Development for coding agents, across harnesses. Every command is a mandao.')
    .version(packageInfo().version);
  registerSetup(program, ctx);
  registerExtensions(program, ctx);
  registerModels(program, ctx);
  registerRun(program, ctx);
  registerApprove(program, ctx);
  registerStart(program, ctx);
  registerWorktree(program, ctx);
  registerHook(program, ctx);
  return program;
}
