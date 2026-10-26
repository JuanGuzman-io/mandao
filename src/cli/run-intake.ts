import type { Command } from 'commander';
import { answerIntakeQuestion, checkIntake, extractIntake, intakeStory, openIntakeStory } from '../scripts/intake.js';
import type { CliContext } from './context.js';
import { json } from './json.js';

interface ExtractFlags {
  nativePages?: string;
  batchChars?: string;
  force?: boolean;
}

/** A flag that must be a positive whole number. */
function wholeNumber(value: string | undefined, flag: string): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!/^\d+$/.test(value) || n < 1) throw new Error(`${flag} must be a positive whole number, not "${value}"`);
  return n;
}

/** `mandao run intake-extract|intake-check|intake-open|intake-story`: requirements document intake (phase 14), JSON out. */
export function registerIntakeScripts(run: Command, ctx: CliContext) {
  run
    .command('intake-extract <file>')
    .description(
      'Extract a Markdown or PDF requirements document into anchored sections and batches, cached in .mandao/cache/intake/<doc>/ (JSON)',
    )
    .option('--native-pages <n>', 'the agent read the PDF natively: record pages p. 1…p. n, no text')
    .option('--batch-chars <n>', 'characters per batch (default 40000)')
    .option('--force', 'replace a cache extracted from another file or version of the document')
    .action((file: string, o: ExtractFlags) => {
      const nativePages = wholeNumber(o.nativePages, '--native-pages');
      const batchChars = wholeNumber(o.batchChars, '--batch-chars');
      const report = extractIntake(ctx.root(), file, {
        ...(nativePages === undefined ? {} : { nativePages }),
        ...(batchChars === undefined ? {} : { batchChars }),
        ...(o.force ? { force: true } : {}),
      });
      if (report.status === 'refused') {
        console.error(report.hint);
        process.exitCode = 1;
      }
      json(report);
    });
  run
    .command('intake-check <proposal>')
    .description('Check an intake proposal: references, dependencies, coverage and OCR sections (JSON; exit code 1 on problems)')
    .action((proposal: string) => {
      const result = checkIntake(ctx.root(), proposal);
      if (!result.ok) process.exitCode = 1;
      json(result);
    });
  run
    .command('intake-open <proposal> <story>')
    .description('Record the spec ID or tracker URL an intake story was opened as (JSON)')
    .requiredOption('--as <ref>', 'spec ID or tracker URL')
    .action((proposal: string, story: string, o: { as: string }) => json(openIntakeStory(ctx.root(), proposal, story, o.as)));
  run
    .command('intake-answer <proposal> <question>')
    .description("Record the PE's answer to an OPEN or CONFLICT row of the proposal: its status becomes resolved (JSON)")
    .requiredOption('--answer <text>', 'the answer, on one line')
    .action((proposal: string, question: string, o: { answer: string }) =>
      json(answerIntakeQuestion(ctx.root(), proposal, question, o.answer)),
    );
  run
    .command('intake-story <proposal> <story>')
    .description('Prefill for /mandao-story --intake: the story, its AC, its open rows and the source (JSON)')
    .action((proposal: string, story: string) => json(intakeStory(ctx.root(), proposal, story)));
}
