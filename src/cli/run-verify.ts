import { execFileSync } from 'node:child_process';
import type { Command } from 'commander';
import { principlesForProjects } from '../engine/constitution-principles.js';
import { readConfig } from '../engine/files.js';
import { collectSecurityScanning } from '../engine/security-scanning.js';
import { commitState, repoRoot, taskCommits } from '../scripts/commits.js';
import { findSpec, readLayout, readSpec } from '../scripts/spec.js';
import { readApprovalLog } from '../scripts/spec-log.js';
import { activeApprovals } from '../spec/approvals.js';
import { securityMentions, verifyPlan } from '../spec/index.js';
import type { CliContext } from './context.js';
import { json } from './json.js';

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
    .option('--delivery <n>', 'Plan only this delivery: its AC and tasks. A partial check that never verifies the spec')
    .action((ref: string, opts: { ciConfirmed?: boolean; delivery?: string }) => {
      const delivery = opts.delivery === undefined ? undefined : Number(opts.delivery);
      if (delivery !== undefined && !(Number.isInteger(delivery) && delivery > 0))
        throw new Error(`--delivery needs a positive integer, got "${opts.delivery}"`);
      const config = readConfig(ctx.root());
      const spec = readSpec(findSpec(ctx.root(), config, ref));
      if (!spec.story || !spec.requirements) throw new Error(`${spec.name} needs story.md and requirements.md`);
      const repo = repoRoot(spec.dir);
      const principleIds = principlesForProjects(
        ctx.root(),
        config,
        spec.tasks.map((task) => task.project),
      );
      const designFindings = readLayout(spec.dir, principleIds).designFindings;
      const security = collectSecurityScanning(repo, config);
      const securityGapsApproved = activeApprovals(readApprovalLog(spec.dir)).some((row) => row.step === 'security-gaps');
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
          designFindings,
          securityCoverage: security.map((scan) => ({
            project: scan.project,
            ...Object.fromEntries(
              (['secrets', 'sast'] as const).map((kind) => [
                kind,
                {
                  local: scan.detected[kind].local.length > 0,
                  ci: scan.detected[kind].ci.length > 0,
                  provider: scan.detected[kind].provider.length > 0,
                  declared: (['local', 'ci', 'provider'] as const).some((place) => scan.recorded[kind].declared[place].length > 0),
                  state: scan.state[kind],
                },
              ]),
            ),
          })) as Parameters<typeof verifyPlan>[0]['securityCoverage'],
          securityGapsApproved,
          ciConfirmed: Boolean(opts.ciConfirmed),
          ...(delivery !== undefined ? { delivery } : {}),
        }),
        issues: spec.issues,
        // Untagged security mentions from the reviews: not blocking, listed in the report (MDO-0008).
        securityMentions: securityMentions(spec.execution),
      });
    });
}
