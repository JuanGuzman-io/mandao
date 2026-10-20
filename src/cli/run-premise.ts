import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Command } from 'commander';
import { repoRoot } from '../scripts/commits.js';
import { excerpt } from '../scripts/gates.js';
import { runTests } from '../scripts/run-tests.js';
import { docPath, logPath } from '../scripts/spec-log.js';
import { parsePremises, premiseFindings } from '../spec/index.js';
import { writeText } from '../writer/files.js';
import { budgetFor } from './budget.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { loadSpec } from './spec-context.js';

/** Premises with a run recorded by `mandao run premise` (`_log/premises/<Pn>.md`). */
export function recordedPremises(specDir: string): Set<string> {
  const dir = logPath(specDir, 'premises');
  return new Set(existsSync(dir) ? readdirSync(dir).flatMap((f) => (/^(P\d+)\.md$/.exec(f)?.[1] ? [f.slice(0, -3)] : [])) : []);
}

/** PREMISE_UNPROVEN findings for a spec: its design (or lite spec.md) against the recorded runs. */
export function specPremiseFindings(specDir: string) {
  const design = docPath(specDir, 'design');
  return premiseFindings(existsSync(design) ? readFileSync(design, 'utf8') : undefined, recordedPremises(specDir));
}

const sha = (dir: string) => {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'no commit';
  }
};

/**
 * `mandao run premise <spec> <Pn> -- <command>`: runs the command that proves a High premise in the
 * spec's worktree, with a timeout and through the queue and the resource budget, and records the run.
 * Only a recorded run makes the premise verified (ADR 0033). The command must be read-only: Mandao
 * cannot enforce it, the rule in specify does.
 */
export function registerPremise(run: Command, ctx: CliContext) {
  run
    .command('premise <spec> <premise> <command...>')
    .description('Run the command that proves a High premise (read-only, timeout, resource queue) and record the run')
    .option('--timeout <s>', 'seconds before the run is stopped', '120')
    .option('--force', 'run even when the budget defers (recorded; ADR 0024)')
    .action(async (ref: string, id: string, words: string[], o: { timeout: string; force?: boolean }) => {
      const { config, spec } = loadSpec(ctx, ref);
      const design = docPath(spec.dir, 'design');
      const known = existsSync(design) ? parsePremises(readFileSync(design, 'utf8')).map((p) => p.id) : [];
      if (!known.includes(id)) throw new Error(`${id} is not in the Premise Ledger of ${relative(ctx.root(), design)}`);
      const command = words.join(' ');
      const project = config.projects[0]!;
      const budget = budgetFor(ctx.root(), config, project, 'unit', `${id} premise`, o.force, spec.dir);
      const cwd = repoRoot(spec.dir);
      const result = await runTests(cwd, `${id} premise`, `${command} 2>&1`, { ...budget, timeoutS: Number(o.timeout) }, undefined, {
        keepOutput: true,
      });
      if (result.status !== 'PASS' && result.status !== 'FAIL') {
        json({ premise: id, recorded: false, status: result.status, reason: result.reason });
        process.exitCode = 1;
        return;
      }
      const file = join(logPath(spec.dir, 'premises'), `${id}.md`);
      const cut = excerpt(result.output, 40);
      writeText(
        file,
        [
          `# ${id} — run`,
          '',
          `- Command: \`${command}\``,
          `- Ran at: ${new Date().toISOString()} on ${sha(cwd)}`,
          `- Exit: ${result.exitCode}`,
          '',
          '```',
          cut,
          '```',
          '',
        ].join('\n'),
      );
      json({
        premise: id,
        recorded: true,
        exitCode: result.exitCode,
        excerpt: excerpt(result.output, 10),
        record: relative(ctx.root(), file),
      });
    });
}
