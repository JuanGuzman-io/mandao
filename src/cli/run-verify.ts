import { execFileSync } from 'node:child_process';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { commitState, repoRoot, taskCommits } from '../scripts/commits.js';
import { findSpec, readSpec } from '../scripts/spec.js';
import { verifyPlan } from '../spec/index.js';
import type { CliContext } from './context.js';

const json = (value: unknown) => console.log(JSON.stringify(value, null, 2));

/**
 * Files the spec changed: those touched by the commits carrying its trailers (rebase-safe, ADR 0021),
 * plus what is not committed yet.
 */
export function specChangedFiles(repo: string, commits: string[]): string[] {
  const git = (args: string[]) => {
    try {
      return execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n');
    } catch {
      return [];
    }
  };
  const committed = commits.flatMap((sha) => git(['show', '--name-only', '--format=', sha]));
  const pending = git(['diff', '--name-only', 'HEAD']);
  const untracked = git(['ls-files', '--others', '--exclude-standard']);
  return [...new Set([...committed, ...pending, ...untracked].filter(Boolean))].sort();
}

/** `mandao run verify-plan <spec>`: suites to run, TDD evidence, and what blocks `verified`. */
export function registerVerify(run: Command, ctx: CliContext) {
  run
    .command('verify-plan <spec>')
    .description('What verify runs (suites per project, e2e flows by AC) and what blocks verified')
    .option('--ci-confirmed', 'CI passed every DEFERRED_TO_CI run')
    .action((ref: string, opts: { ciConfirmed?: boolean }) => {
      const config = readConfig(ctx.root());
      const spec = readSpec(findSpec(ctx.root(), config, ref));
      if (!spec.story || !spec.requirements) throw new Error(`${spec.name} needs story.md and requirements.md`);
      const repo = repoRoot(spec.dir);
      json({
        ...verifyPlan({
          story: spec.story,
          requirements: spec.requirements,
          tasks: spec.tasks,
          execution: spec.execution,
          ...(spec.progress ? { progress: spec.progress } : {}),
          projects: config.projects,
          // The spec folder is bookkeeping, not code under test.
          changed: specChangedFiles(repo, [...taskCommits(repo, spec.story.meta.id, config.commits.trailers).values()].flat()).filter(
            (f) => !f.startsWith(`${config.paths.specs}/`),
          ),
          commits: commitState(spec, config.commits.trailers),
          ciConfirmed: Boolean(opts.ciConfirmed),
        }),
        issues: spec.issues,
      });
    });
}
