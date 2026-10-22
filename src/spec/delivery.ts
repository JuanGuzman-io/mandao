import type { Branching } from '../schemas/branching.js';
import { type CloseSummary, sectionOf } from './close-summary.js';

export interface DeliveryTarget {
  branch: string;
  label: string;
  default: boolean;
  difference?: string;
}

/** Targets available for delivery: the worktree's start (or hotfix source) first, then configured branches. */
export function deliveryTargets(
  startBase: string | undefined,
  branching: Branching,
  remoteBranches: string[],
  hotfix = false,
): DeliveryTarget[] {
  const preferred = hotfix ? branching.hotfix.from : (startBase ?? branching.base);
  const configured = [
    ...new Set([branching.base, ...branching.promotion, branching.production, branching.hotfix.from, ...branching.hotfix.merge_to]),
  ];
  const branches = [...new Set([preferred, ...configured])].filter((branch) => remoteBranches.includes(branch));
  return branches.map((branch, index) => ({
    branch,
    label: branch,
    default: index === 0,
    ...(branch === preferred && preferred !== branching.base ? { difference: `worktree/config target is ${branching.base}` } : undefined),
    ...(branch !== preferred && branch === branching.base && preferred !== branching.base
      ? { difference: `worktree/config target is ${preferred}` }
      : undefined),
  }));
}

/** Resolves a selected configured target or an explicitly typed existing remote branch. */
export function resolveDeliveryTarget(target: string, candidates: DeliveryTarget[], remoteBranches: string[]): string {
  const branch = target.startsWith('other:') ? target.slice('other:'.length).trim() : target;
  if (!branch || !remoteBranches.includes(branch)) throw new Error(`delivery target "${branch}" does not exist on the remote`);
  if (!target.startsWith('other:') && !candidates.some((candidate) => candidate.branch === branch))
    throw new Error(`delivery target "${branch}" is not configured; choose "other" to enter an existing remote branch`);
  return branch;
}

/** PR description from the close record and its PO/developer outcome, with a relative spec link. */
export function pullRequestBody(closeText: string | undefined, summary: CloseSummary, specHref: string): string {
  const outcome = sectionOf(closeText, 'Outcome')?.trim();
  const developers = sectionOf(closeText, 'For developers')?.trim();
  return [
    '## Outcome',
    outcome || 'See the spec for acceptance criteria and verification.',
    ...(developers ? ['', '## For developers', developers] : []),
    '',
    `Spec: [${summary.spec}](${specHref})`,
  ].join('\n');
}
