import { execFileSync } from 'node:child_process';
import { type Branching, type BranchingModel, type Config, resolveBranching } from '../schemas/index.js';

/** The workspace's branching, or a polyrepo project's own (ADR 0023). */
export function branchingFor(config: Config, project?: string): Branching {
  const own = project ? config.projects.find((p) => p.name === project)?.branching : undefined;
  return resolveBranching(own ? { ...own, model: own.model ?? config.branching.model } : config.branching);
}

/** `<prefix><ID>-<slug>`: the prefix by spec type (bug → fix), `hotfix` for the hotfix lane. */
export function specBranch(config: Config, b: Branching, p: { id: string; slug: string; type?: string; hotfix?: boolean }): string {
  const kind = p.hotfix ? 'hotfix' : p.type === 'bug' ? 'fix' : 'feature';
  return config.spec.branch
    .replace('{prefix}', b.prefixes[kind])
    .replace('{type}', p.type === 'bug' ? 'fix' : 'feat')
    .replace('{id}', p.id)
    .replace('{slug}', p.slug);
}

/** Where a spec branch starts: `base`, or `hotfix.from` in the hotfix lane. */
export const startPoint = (b: Branching, hotfix = false) => (hotfix ? b.hotfix.from : b.base);

const git = (cwd: string, args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

/** Local and remote branch names, without the remote's name. */
export function branchNames(root: string): string[] {
  try {
    const local = git(root, ['for-each-ref', '--format=%(refname:lstrip=2)', 'refs/heads']).split('\n');
    const remote = git(root, ['for-each-ref', '--format=%(refname:lstrip=3)', 'refs/remotes']).split('\n');
    return [...new Set([...local, ...remote].filter((r) => r && r !== 'HEAD'))].sort();
  } catch {
    return [];
  }
}

export interface BranchingDetection {
  suggested?: BranchingModel;
  /** Models the user chooses between when the branches do not decide it. */
  ask: BranchingModel[];
  reason: string;
  branches: string[];
}

/**
 * The model the existing branches suggest (ADR 0023): `develop` or `release/*` → gitflow; `test` or
 * `staging` → env-branches; only `main` → ask between trunk and feature-branch. Always confirmed by the
 * user and documented in infrastructure.md.
 */
export function detectBranching(branches: string[]): BranchingDetection {
  const has = (n: string) => branches.includes(n);
  if (has('develop') || branches.some((b) => b.startsWith('release/'))) {
    return { suggested: 'gitflow', ask: [], reason: 'a develop or release/* branch exists', branches };
  }
  if (has('test') || has('staging')) return { suggested: 'env-branches', ask: [], reason: 'test or staging branches exist', branches };
  return { ask: ['trunk', 'feature-branch'], reason: 'only a main line: trunk and feature-branch both fit', branches };
}

/** True when `branch` exists locally or on a remote. */
export function branchExists(root: string, branch: string): boolean {
  for (const ref of [branch, `origin/${branch}`]) {
    try {
      git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
      return true;
    } catch {
      // try the next ref
    }
  }
  return false;
}

/** The branch checked out in `cwd`, if any. */
export function currentBranch(cwd: string): string | undefined {
  try {
    const b = git(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']);
    return b === 'HEAD' ? undefined : b;
  } catch {
    return undefined;
  }
}

/** Days since the first commit `branch` has that `base` does not; undefined without such commits. */
export function branchAgeDays(root: string, branch: string, base: string, now = Date.now()): number | undefined {
  try {
    const first = git(root, ['log', '--reverse', '--format=%ct', `${base}..${branch}`]).split('\n')[0];
    return first ? Math.floor((now / 1000 - Number(first)) / 86_400) : undefined;
  } catch {
    return undefined;
  }
}
