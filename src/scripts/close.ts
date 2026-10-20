import { execFileSync } from 'node:child_process';
import type { Config } from '../schemas/index.js';

const FIELD = '\x1f';
const RECORD = '\x1e';

const git = (repo: string, args: string[]) => {
  try {
    return execFileSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};

/** A `fix` commit by its header: `🐛 fix(scope): …`, `fix: …`, `fix!: …`. */
export const isFixHeader = (subject: string) => /^(?:\S+\s+)?fix(?:\([^)]*\))?!?:/.test(subject);

/**
 * `fix` commits on any branch whose `Refs` trailer names the spec, dated after it closed (Kaizen's bugs
 * after merge). Only as good as the references: a fix without `Refs: <spec id>` is not counted.
 */
export function fixCommitsAfter(repo: string, specId: string, trailers: Config['commits']['trailers'], closedAt: string): string[] {
  const format = ['%h', '%s', '%cI', `%(trailers:key=${trailers.refs},valueonly,separator=%x2C)`].join(FIELD);
  const since = Date.parse(closedAt);
  return git(repo, ['log', '--all', `--format=${format}${RECORD}`])
    .split(RECORD)
    .map((r) => r.trim().split(FIELD))
    .filter(
      ([sha, subject = '', date = '', refs = '']) =>
        sha &&
        isFixHeader(subject) &&
        Date.parse(date) > since &&
        refs
          .split(',')
          .map((x) => x.trim())
          .includes(specId),
    )
    .map(([sha]) => sha!);
}

/** Branches with the release prefix that contain every one of the spec's commits (gitflow, ADR 0023). */
export function releaseBranchesContaining(repo: string, shas: string[], prefix: string): string[] {
  if (!prefix || !shas.length) return [];
  const per = shas.map(
    (sha) =>
      new Set(
        git(repo, ['branch', '--all', '--contains', sha, '--format=%(refname:short)'])
          .split('\n')
          .map((b) => b.trim().replace(/^[^/]+\/(?=release)/, ''))
          .filter((b) => b.startsWith(prefix)),
      ),
  );
  return [...per[0]!].filter((b) => per.every((s) => s.has(b))).sort();
}

/** Lines under `## Forced runs` in execution.md (ADR 0024). */
export function forcedRunCount(executionMd: string | undefined): number {
  const section = executionMd?.split(/^## Forced runs\s*$/m)[1]?.split(/^## /m)[0] ?? '';
  return section.split('\n').filter((l) => l.startsWith('- ')).length;
}
