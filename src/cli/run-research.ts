import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { researchContext } from '../scripts/research.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { harnessOption } from './spec-context.js';

/** Registers the pre-research question budget and prior-evidence report. */
export function registerResearch(run: Command, ctx: CliContext): void {
  run
    .command('research <spec>')
    .description('List NEEDS RESEARCH questions, apply the configured cap, and find reusable current evidence (JSON)')
    .option('--select <ids...>', 'prioritized question IDs; invalid or over-limit selections dispatch nothing')
    .option('--harness <id>', 'active harness for research-tool capability (default: claude)')
    .action((ref: string, options: { select?: string[]; harness?: string }) =>
      json(researchContext(ctx.root(), readConfig(ctx.root()), ref, options.select, harnessOption(options.harness))),
    );
}
