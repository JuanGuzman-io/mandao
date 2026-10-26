import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { buildCommand, type Config, declaresNoBuild } from '../schemas/index.js';
import { branchingFor } from '../scripts/branching.js';
import { commitPending, reconciledTasks, repoRoot } from '../scripts/commits.js';
import { runWithGateReceipt } from '../scripts/gate-receipts.js';
import { inProjectDir, runTests } from '../scripts/run-tests.js';
import type { SpecFolder } from '../scripts/spec.js';
import { logPath } from '../scripts/spec-log.js';
import { removeFile, writeText } from '../writer/files.js';
import { logDiscrepancies } from '../writer/log-integrity.js';
import { budgetFor } from './budget.js';
import { recordLogEdits, requireDiscrepancyReason } from './checkpoint-guards.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { logDirFor } from './log-dir.js';
import { recordCost } from './run-cost.js';
import { loadSpec } from './spec-context.js';

/** `mandao run commit`: the pending task commits, one each, with trailers. Local only. */
export function registerCommit(run: Command, ctx: CliContext) {
  run
    .command('commit <spec>')
    .description('Commit the tasks that passed review and wait for their commit, one commit per task (never pushes)')
    .option('--trailer <text...>', 'extra trailers, e.g. "Co-Authored-By: …"')
    .option('--harness <id>', 'harness of the session, for the cost record', 'claude')
    .option('--session <id>', 'Claude Code session id (default: $CLAUDE_CODE_SESSION_ID)')
    .option('--usd <amount>', 'the task cost by hand, where the harness has no readable transcript')
    .option('--basis <basis>', 'with --usd: billed | equivalent | unknown', 'unknown')
    .option('--discrepancy-reason <text>', 'why a script-owned log was edited by hand (required then)')
    .action(async (ref: string, opts: CommitOptions) => {
      const { config, spec } = loadSpec(ctx, ref);
      if (!spec.story || !spec.progress) throw new Error(`${spec.name} needs story.md and progress.yml`);
      requireDiscrepancyReason(spec, opts.discrepancyReason);
      await requirePreCommitBuilds(ctx, config, spec);
      const discrepancy = discrepancyTrailers(spec, opts.discrepancyReason);
      const costs = costsFile(ctx, ref);
      const cost = spec.progress.pending_commits.length ? taskCost(ctx, ref, opts) : undefined;
      const result = commitPending({
        repo: repoRoot(spec.dir),
        specDir: spec.dir,
        config,
        story: spec.story,
        tasks: spec.tasks,
        progress: spec.progress,
        trailers: [...(opts.trailer ?? []), ...discrepancy],
        protectedBranches: branchingFor(config).protected,
        home: ctx.root(),
      });
      // Nothing committed: the cost goes back and the hand edit stays unaccepted, so a retry neither counts the
      // cost twice (F7) nor loses the reason (F6). Something committed: the edit is recorded and accepted.
      if (cost?.recorded && !result.committed.length) costs.restore();
      if (result.committed.length) recordLogEdits(spec, new Date().toISOString(), 'commit', opts.discrepancyReason);
      json({ ...result, ...skippedBuilds(config), ...(cost ? { cost } : {}) });
      if (result.error) process.exitCode = 1;
    });
}

interface CommitOptions {
  trailer?: string[];
  harness: string;
  session?: string;
  usd?: string;
  basis?: string;
  discrepancyReason?: string;
}

/**
 * The task's cost, recorded by the commit itself so its costs.yml rides in the task commit (phase 17; MDO-0002:
 * the agent forgot the rule and recorded once at the end). Never blocks the commit: when nothing can be read
 * (no session, no transcript and no `--usd`), it says so.
 */
/**
 * A log edited by hand, as a commit trailer: version 2 keeps the list in the git-ignored cache (review F6).
 * Nothing is accepted here: the edit is recorded and accepted only once a commit carrying it exists.
 */
function discrepancyTrailers(spec: SpecFolder, reason: string | undefined): string[] {
  const edited = logDiscrepancies(spec.dir);
  if (!edited.length) return [];
  return [`Mandao-Discrepancy: ${edited.join(', ')} · reason: ${(reason ?? '').trim().replace(/\s+/g, ' ')}`];
}

/** Projects whose pre-commit build was skipped by `build: none`, for the commit's JSON. */
function skippedBuilds(config: Config) {
  const skipped = declaredNoBuild(config);
  return skipped.length ? { builds: Object.fromEntries(skipped.map((name) => [name, 'declared-none'])) } : {};
}

/** The spec's costs.yml as it is now, with a way to put it back. */
function costsFile(ctx: CliContext, ref: string) {
  const file = logPath(logDirFor(ctx.root(), readConfig(ctx.root()), ref), 'costs.yml');
  const before = existsSync(file) ? readFileSync(file, 'utf8') : undefined;
  return { restore: () => (before === undefined ? removeFile(file, []) : writeText(file, before)) };
}

function taskCost(ctx: CliContext, ref: string, o: CommitOptions) {
  try {
    const entry = recordCost(ctx, ref, { record: true, command: 'implement', ...o });
    return { recorded: true, usd: entry.usd };
  } catch (error) {
    return { recorded: false, reason: (error as Error).message };
  }
}

/** Projects whose pre-commit build is skipped because they declared `build: none` (recorded, never a PASS). */
export const declaredNoBuild = (config: Config): string[] => config.projects.filter(declaresNoBuild).map((p) => p.name);

export async function requirePreCommitBuilds(ctx: CliContext, config: Config, spec: SpecFolder): Promise<void> {
  if (!spec.progress?.pending_commits.length) return;
  const reconciled = reconciledTasks(
    repoRoot(spec.dir),
    spec.story?.meta.id ?? spec.name,
    config.commits.trailers,
    spec.progress.pending_commits,
  );
  if (spec.progress.pending_commits.every((e) => reconciled.has(e.task))) return;
  const projects = config.projects.filter((project) => buildCommand(project));
  if (!projects.length && !declaredNoBuild(config).length)
    throw new Error('run commit needs a configured build gate: configure a build command or `build: none` in .mandao/config.yml');
  for (const project of projects) {
    const command = buildCommand(project)!;
    const budget = budgetFor(ctx.root(), config, project, 'build', `${project.name} pre-commit build`, false, spec.dir);
    const result = await runWithGateReceipt(
      {
        root: ctx.root(),
        project: project.name,
        gate: 'build',
        command,
        configuration: config,
        selectedTests: [],
        budget,
        projectRoot: join(ctx.root(), project.path),
      },
      () => runTests(ctx.root(), `${project.name} build`, inProjectDir(command, project.path), budget),
    );
    if (result.status !== 'PASS') throw new Error(`${project.name} build is ${result.status}: ${result.reason ?? 'commit refused'}`);
  }
}
