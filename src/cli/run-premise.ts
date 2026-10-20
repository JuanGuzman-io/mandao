import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import type { Command } from 'commander';
import { repoRoot } from '../scripts/commits.js';
import { excerpt } from '../scripts/gates.js';
import { runTests } from '../scripts/run-tests.js';
import { docPath, logPath } from '../scripts/spec-log.js';
import { parsePremises, premiseFindings } from '../spec/index.js';
import { ensureDir, removeScratchDir, writeText } from '../writer/files.js';
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

/** Where a spec's probe scripts live: inside its log, committed with the premise records. */
export const probesDir = (specDir: string) => join(logPath(specDir, 'premises'), 'probes');

/**
 * The paths a command names that leave the worktree: absolute or `~` paths outside it, and relative
 * ones that climb out. The first word (the program, e.g. `node`) is not checked.
 */
export function pathsOutside(words: string[], root: string): string[] {
  return words.slice(1).flatMap((raw) => {
    const w = raw.replace(/^['"]|['"]$/g, '').replace(/^--?[\w-]+=/, '');
    if (!/^(\/|~|\.\.?\/)/.test(w) && !w.includes('/../')) return [];
    const abs = w.startsWith('~') ? join(homedir(), w.slice(1)) : resolve(root, w);
    const rel = relative(root, abs);
    return rel.startsWith('..') || isAbsolute(rel) ? [raw] : [];
  });
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
      const cwd = repoRoot(spec.dir);
      // MDO-0007: probes lived in the user's home. Every path the command names stays in the worktree.
      const outside = pathsOutside(words, cwd);
      if (outside.length)
        throw new Error(
          `the command names paths outside the worktree (${outside.join(', ')}): put probes in ${relative(cwd, probesDir(spec.dir))}/`,
        );
      const project = config.projects[0]!;
      const budget = budgetFor(ctx.root(), config, project, 'unit', `${id} premise`, o.force, spec.dir);
      // Temporary files the probe makes go inside the spec's log, and are removed after the run.
      const scratch = join(logPath(spec.dir, 'premises'), 'tmp', id);
      ensureDir(scratch);
      let result: Awaited<ReturnType<typeof runTests>>;
      try {
        result = await runTests(cwd, `${id} premise`, `${command} 2>&1`, { ...budget, timeoutS: Number(o.timeout) }, undefined, {
          keepOutput: true,
          env: { TMPDIR: scratch, TMP: scratch, TEMP: scratch },
        });
      } finally {
        removeScratchDir(join(logPath(spec.dir, 'premises'), 'tmp'), spec.dir);
      }
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
          `- Command: \`${command}\` (from the worktree root)`,
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
