import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import type { Command } from 'commander';
import type { Config, ProjectConfig } from '../schemas/index.js';
import { repoRoot } from '../scripts/commits.js';
import { excerpt } from '../scripts/gates.js';
import { runTests } from '../scripts/run-tests.js';
import { cachePath, docPath, logPath, logSections, specLogInCache, writeLogSection } from '../scripts/spec-log.js';
import { parsePremises, premiseFindings } from '../spec/index.js';
import { ensureDir, removeScratchDir, writeText } from '../writer/files.js';
import { budgetFor } from './budget.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { loadSpec } from './spec-context.js';

/** Premises with a run recorded by `mandao run premise`: `_log/premises/<Pn>.md`, or (version 2) a `## Pn — …` section of `_log/premises.md`. */
export function recordedPremises(specDir: string): Set<string> {
  if (specLogInCache(specDir)) return new Set([...logSections(specDir, 'premises.md').keys()].flatMap((t) => /^P\d+/.exec(t)?.[0] ?? []));
  const dir = logPath(specDir, 'premises');
  return new Set(existsSync(dir) ? readdirSync(dir).flatMap((f) => (/^(P\d+)\.md$/.exec(f)?.[1] ? [f.slice(0, -3)] : [])) : []);
}

/** Lines of a premise run's output kept in a version 2 `premises.md` (version 1 kept 40 in its own file). */
const PREMISE_LINES = 20;

/** Records a premise run where the spec keeps them; returns the file written. */
function recordRun(specDir: string, id: string, claim: string | undefined, command: string, at: string, exit: unknown, output?: string) {
  const facts = [`- Command: \`${command}\` (from the worktree root)`, `- Ran at: ${new Date().toISOString()} on ${at}`, `- Exit: ${exit}`];
  if (specLogInCache(specDir)) {
    const body = [...(claim ? [`- Claim: ${claim}`] : []), ...facts, '', '```', excerpt(output, PREMISE_LINES), '```'].join('\n');
    return writeLogSection(specDir, 'premises.md', `${id} — run`, body);
  }
  const file = join(logPath(specDir, 'premises'), `${id}.md`);
  writeText(file, [`# ${id} — run`, '', ...facts, '', '```', excerpt(output, 40), '```', ''].join('\n'));
  return file;
}

/** Where a premise's probes and scratch folders live: the spec's log (version 1) or its local cache (version 2). */
const premiseWorkDir = (specDir: string) => (specLogInCache(specDir) ? cachePath(specDir, 'premises') : logPath(specDir, 'premises'));

/** PREMISE_UNPROVEN findings for a spec: its design (or lite spec.md) against the recorded runs. */
export function specPremiseFindings(specDir: string) {
  const design = docPath(specDir, 'design');
  return premiseFindings(existsSync(design) ? readFileSync(design, 'utf8') : undefined, recordedPremises(specDir));
}

/** Where a spec's probe scripts live: inside its log, committed with the premise records (version 2: the local cache). */
export const probesDir = (specDir: string) => join(premiseWorkDir(specDir), 'probes');

/**
 * The paths a command names that leave the worktree: absolute or `~` paths outside it, and relative
 * ones that climb out. The first word (the program, e.g. `node`) is not checked.
 */
export function pathsOutside(words: string[], root: string, from: string = root): string[] {
  return words.slice(1).flatMap((raw) => {
    const w = raw.replace(/^['"]|['"]$/g, '').replace(/^--?[\w-]+=/, '');
    if (!/^(\/|~|\.\.?\/)/.test(w) && !w.includes('/../')) return [];
    const abs = w.startsWith('~') ? join(homedir(), w.slice(1)) : resolve(from, w);
    const rel = relative(root, abs);
    return rel.startsWith('..') || isAbsolute(rel) ? [raw] : [];
  });
}

export const sha = (dir: string) => {
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

/** Characters a shell word may hold unquoted on every platform. */
const PLAIN_WORD = /^[A-Za-z0-9_@%+=:,./-]+$/;

/**
 * One argument as the shell must read it: POSIX single quotes, or double quotes for cmd.exe on Windows, where
 * `%VAR%`, and cmd metacharacters after an embedded `"`, are still interpreted: keep Windows probes simple.
 */
export function shellQuote(word: string, platform: NodeJS.Platform = process.platform): string {
  if (PLAIN_WORD.test(word)) return word;
  if (platform === 'win32') return `"${word.replace(/"/g, '\\"')}"`;
  return `'${word.replace(/'/g, "'\\''")}'`;
}

/** The argv a caller gave, joined for `shell: true` so each argument arrives exactly as given. */
export function shellJoin(words: string[], platform: NodeJS.Platform = process.platform): string {
  return words.map((w) => shellQuote(w, platform)).join(' ');
}

/** A read-only probe: run with a timeout, through the resource queue, with its temporary files and HOME kept in `work`. */
export async function runProbe(o: {
  root: string;
  cwd: string;
  config: Config;
  project?: ProjectConfig;
  label: string;
  command: string;
  timeoutS: number;
  work: string;
  scratchId: string;
  force?: boolean;
  specDir?: string;
}) {
  const budget = budgetFor(o.root, o.config, o.project ?? o.config.projects[0], 'unit', o.label, o.force, o.specDir);
  const scratch = join(o.work, 'tmp', o.scratchId);
  const home = join(o.work, 'tmp', `${o.scratchId}-home`);
  ensureDir(scratch);
  ensureDir(home);
  try {
    return await runTests(o.cwd, o.label, `${o.command} 2>&1`, { ...budget, timeoutS: o.timeoutS }, undefined, {
      keepOutput: true,
      // HOME too: a probe that writes to `~` from its own code lands in the log, not the real home.
      env: { TMPDIR: scratch, TMP: scratch, TEMP: scratch, HOME: home, USERPROFILE: home },
    });
  } finally {
    removeScratchDir(join(o.work, 'tmp'), o.work);
  }
}

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
      const command = shellJoin(words);
      const cwd = repoRoot(spec.dir);
      // MDO-0007: probes lived in the user's home. Every path the command names stays in the worktree.
      const outside = pathsOutside(words, cwd);
      if (outside.length)
        throw new Error(
          `the command names paths outside the worktree (${outside.join(', ')}): put probes in ${relative(cwd, probesDir(spec.dir))}/`,
        );
      const result = await runProbe({
        root: ctx.root(),
        cwd,
        config,
        label: `${id} premise`,
        command,
        timeoutS: Number(o.timeout),
        work: premiseWorkDir(spec.dir),
        scratchId: id,
        force: o.force,
        specDir: spec.dir,
      });
      if (result.status !== 'PASS' && result.status !== 'FAIL') {
        json({ premise: id, recorded: false, status: result.status, reason: result.reason });
        process.exitCode = 1;
        return;
      }
      const claim = parsePremises(readFileSync(design, 'utf8')).find((p) => p.id === id)?.claim;
      const file = recordRun(spec.dir, id, claim, command, sha(cwd), result.exitCode, result.output);
      json({
        premise: id,
        recorded: true,
        exitCode: result.exitCode,
        excerpt: excerpt(result.output, 10),
        record: relative(ctx.root(), file),
      });
    });
}
