import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Config } from '../schemas/index.js';
import { branchAgeDays, branchExists, branchingFor, branchNames, currentBranch } from '../scripts/branching.js';
import { logPath, readProgress } from '../scripts/spec-log.js';
import type { Finding } from './doctor.js';

/**
 * Tasks that passed review and still wait for their commit (ADR 0021): any harness, the human or the
 * next session commits them with `mandao run commit`.
 */
export function pendingCommitFindings(root: string, config: Config): Finding[] {
  const dir = join(root, config.paths.specs);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(logPath(join(dir, d.name), 'progress.yml')))
    .flatMap((d): Finding[] => {
      const pending = readProgress(join(dir, d.name)).progress?.pending_commits.map((p) => p.task) ?? [];
      return pending.length
        ? [
            {
              level: 'warn',
              message: `${d.name}: ${pending.join(', ')} passed review and wait for their commit`,
              fix: `run \`mandao run commit ${d.name}\` (local only, one commit per task)`,
            },
          ]
        : [];
    });
}

/** The base branch exists; in trunk, spec branches stay short-lived (ADR 0023). Needs a repo with commits. */
export function branchingFindings(root: string, config: Config, now = Date.now()): Finding[] {
  if (!currentBranch(root)) return [];
  const b = branchingFor(config);
  const out: Finding[] = [];
  if (!branchExists(root, b.base)) {
    out.push({
      level: 'warn',
      message: `branching: base branch "${b.base}" (${b.model}) does not exist here; new spec branches start from it`,
      fix: 'create it, or set branching.base (or another branching.model) in .mandao/config.yml',
    });
  }
  const max = b.max_branch_age_days;
  if (!max) return out;
  const prefixes = [b.prefixes.feature, b.prefixes.fix, b.prefixes.hotfix].filter(Boolean);
  for (const name of branchNames(root).filter((n) => prefixes.some((p) => n.startsWith(p)))) {
    const age = branchAgeDays(root, name, b.base, now);
    if (age !== undefined && age > max) {
      out.push({
        level: 'warn',
        message: `branching: ${name} is ${age} days old; trunk keeps branches under ${max} days`,
        fix: 'split the spec into smaller tasks merged separately, stack PRs, or hide unfinished work behind a feature flag',
      });
    }
  }
  return out;
}
