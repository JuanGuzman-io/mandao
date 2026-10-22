export type GitProvider = 'github' | 'other';

/** Branch names from `git ls-remote --heads`, excluding the `refs/heads/` transport prefix. */
export function parseRemoteBranches(output: string): string[] {
  return [
    ...new Set(
      output.split('\n').flatMap((line) => {
        const ref = line.trim().split(/\s+/)[1];
        return ref?.startsWith('refs/heads/') ? [ref.slice('refs/heads/'.length)] : [];
      }),
    ),
  ].sort();
}

/** Classifies only a GitHub remote as GitHub; unknown providers use the manual PR flow. */
export function providerForRemote(remote: string | undefined): GitProvider | undefined {
  if (!remote) return undefined;
  return /(?:github\.com[:/])/i.test(remote) ? 'github' : 'other';
}

/** Browser URL for a manually opened GitHub PR, or undefined for other providers. */
export function manualPullRequestUrl(remote: string | undefined, base: string, head: string): string | undefined {
  if (providerForRemote(remote) !== 'github' || !remote) return undefined;
  const path = remote
    .replace(/^git@github\.com:/i, '')
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/\/$/, '');
  if (!/^[^/]+\/[^/]+$/.test(path)) return undefined;
  return `https://github.com/${path}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}?expand=1`;
}

/** A local branch may be deleted only after Git confirms that its commits are in the selected target. */
export function canDeleteMergedBranch(isAncestor: boolean): boolean {
  return isAncestor;
}

/** Human-readable historic release evidence, kept deterministic for reports and tests. */
export function releaseLabel(input: { target: string; pr?: string; mergeSha?: string }): string {
  return [
    `released on ${input.target}`,
    ...(input.pr ? [`PR ${input.pr}`] : []),
    ...(input.mergeSha ? [`merge ${input.mergeSha.slice(0, 7)}`] : []),
  ].join(', ');
}
