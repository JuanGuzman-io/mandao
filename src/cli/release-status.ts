import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { branchingFor } from '../scripts/branching.js';
import { commitState, repoRoot, taskCommits } from '../scripts/commits.js';
import { releaseLabel } from '../scripts/delivery.js';
import { findSpec, readSpec } from '../scripts/spec.js';
import { acStatus, parseCloseSummary, verifyResults } from '../spec/index.js';
import type { CliContext } from './context.js';
import { json } from './json.js';

const readIf = (file: string) => (existsSync(file) ? readFileSync(file, 'utf8') : undefined);

/** Registers criterion status plus git-derived delivery evidence for a spec. */
export function registerReleaseStatus(run: Command, ctx: CliContext): void {
  run
    .command('release-status <spec>')
    .description('Acceptance criteria and Git-derived delivery status, PR and merge evidence')
    .action((ref: string) => {
      const config = readConfig(ctx.root());
      const spec = readSpec(findSpec(ctx.root(), config, ref));
      if (!spec.story) throw new Error(`${spec.name} needs story.md`);
      json(releaseResult(spec, config));
    });
}

function releaseResult(spec: ReturnType<typeof readSpec>, config: ReturnType<typeof readConfig>) {
  const story = spec.story!;
  const committed = commitState(spec, config.commits.trailers).committed;
  const verify = verifyResults(readIf(join(spec.dir, 'verify-report.md')));
  const summary = parseCloseSummary(readIf(join(spec.dir, 'close-summary.md')), spec.name);
  const target = summary.delivery?.target ?? branchingFor(config, story.meta.projects[0]).base;
  const repo = repoRoot(spec.dir);
  const commits = [...taskCommits(repo, story.meta.id, config.commits.trailers).values()].flat();
  const merged = commits.length > 0 && commits.every((sha) => gitOk(repo, ['merge-base', '--is-ancestor', sha, `origin/${target}`]));
  const mergeSha = merged ? mergeCommit(repo, target, commits) : undefined;
  const pr = summary.delivery?.pr_number
    ? `#${summary.delivery.pr_number}`
    : summary.delivery?.pr_url?.match(/\/pull\/(\d+)/)?.[0]?.replace('/pull/', '#');
  return {
    criteria: acStatus(story, spec.tasks, spec.execution, committed, verify),
    delivery: {
      state: merged ? 'released' : summary.delivery ? 'pending' : 'unknown',
      target,
      ...(summary.delivery?.pr_url ? { pr_url: summary.delivery.pr_url } : {}),
      ...(merged ? { report: releaseLabel({ target, ...(pr ? { pr } : {}), ...(mergeSha ? { mergeSha } : {}) }) } : {}),
    },
    language: config.language,
  };
}

const gitOk = (repo: string, args: string[]) => {
  try {
    execFileSync('git', args, { cwd: repo, stdio: 'ignore' });
    return true;
  } catch {
    return false; // Missing remote refs or non-ancestor commits mean release is not yet proven.
  }
};

function mergeCommit(repo: string, target: string, commits: string[]): string | undefined {
  let candidates: string[];
  try {
    candidates = execFileSync('git', ['log', '--first-parent', '--merges', '--format=%H', `origin/${target}`], {
      cwd: repo,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return undefined; // The repository may have only a fast-forward or no fetched target ref.
  }
  return candidates.find((candidate) => commits.every((sha) => gitOk(repo, ['merge-base', '--is-ancestor', sha, candidate])));
}
