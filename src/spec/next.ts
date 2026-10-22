import { type Approval, activeApprovals } from './approvals.js';
import { blockingMarkers, withoutCode, withoutFences } from './markdown.js';
import type { Requirements } from './requirements.js';
import type { Story } from './story.js';
import type { Task } from './tasks.js';

/** The part of a spec folder the next step reads (`SpecFolder` satisfies it). */
export interface NextSpec {
  name: string;
  story?: Story;
  requirements?: Requirements;
  tasks: Task[];
  /** The spec keeps its documents in `spec.md` (FR-1); the caller reads it from the folder. */
  lite?: boolean;
}

/** What `nextStep` needs beyond the spec folder, all of it read by the caller (IO stays out of the domain). */
export interface NextFacts {
  /** Tasks passed but not yet committed (`progress.yml`). */
  pendingCommits?: string[];
  approvals?: Approval[];
  /** The `status:` of `tasks.md` when the spec has one: approved tasks mean the documents before them were reviewed. */
  tasksStatus?: string;
  /** The current hash of each approvable document, by file name (`docHash`). */
  hashes?: Record<string, string>;
  /** The `verdict:` of `verify-report.md` when there is one: `blocked` means the verify failed. */
  verifyVerdict?: string;
  /** Where a closed spec's branch stands in git: not pushed, pushed and not merged, or merged into its base. */
  delivery?: 'unpushed' | 'pushed' | 'merged';
}

export interface NextStep {
  recommended: { command: string; reason: string };
  /** Every command that can follow, the recommended one first. */
  options: string[];
  /** The agent should invoke this next command without returning control when the transition is safe. */
  autoContinue?: true;
}

/** A Consistency Check row: `| ID | Type | Finding | Severity | Owner | Status |`. Header and separator rows have no `critical`/`normal` severity. */
function checkRows(text: string): { type: string; finding: string; severity: string; resolved: boolean }[] {
  const rows = withoutFences(text)
    .split('\n')
    .filter((l) => l.trimStart().startsWith('|'))
    .map((l) =>
      l
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => c.trim()),
    );
  return rows
    .filter((c) => c.length >= 6 && /^(critical|normal)$/i.test(c[3]!))
    .map((c) => ({ type: c[1]!.replace(/`/g, ''), finding: c[2]!, severity: c[3]!.toLowerCase(), resolved: /^resolved/i.test(c[5]!) }));
}

/** Items that need one question: unresolved critical or `CONFLICT` Consistency Check rows, and inline `CONFLICT(a: …, b: …, decides: …)`. */
function conflictsAndFindings(text: string): string[] {
  const rows = checkRows(text)
    .filter((r) => !r.resolved && (r.severity === 'critical' || r.type.toUpperCase() === 'CONFLICT'))
    .map((r) => r.finding);
  const inline = withoutCode(text)
    .split('\n')
    .filter((l) => !l.trimStart().startsWith('|') && !/\bresolved\b/i.test(l))
    .flatMap((l) => [...l.matchAll(/\bCONFLICT\(([^\n]*)/g)].map((m) => `CONFLICT(${m[1]!.trim()}`));
  return [...rows, ...inline];
}

/** What is still open in the story and requirements: a critical OPEN blocks approval, the rest needs one question. */
export function openItems(spec: Pick<NextSpec, 'story' | 'requirements'>): { criticalOpen: string[]; ask: string[] } {
  const raw = [spec.story?.raw, spec.requirements?.raw].filter((t): t is string => Boolean(t));
  const criticalOpen = raw.flatMap((t) => blockingMarkers(t).criticalOpen);
  const ask = raw.flatMap((t) => [
    ...blockingMarkers(t).needsClarification.map((q) => q || '[NEEDS CLARIFICATION]'),
    ...conflictsAndFindings(t),
    ...[...withoutCode(t).matchAll(/^[ \t]*(?:[-*][ \t]+)?(\*\*Decision:\*\*[ \t]*pending\b[^\n]*)/gim)].map((m) => m[1]!.trim()),
  ]);
  return { criticalOpen, ask };
}

/** The documents that changed since their last recorded hash, by file name. Without a recorded hash, none (no claim). */
export function changedSince(rows: Approval[], hashes: Record<string, string>): string[] {
  const recorded: Record<string, string> = {};
  for (const row of rows) Object.assign(recorded, row.sha256);
  return Object.keys(recorded).filter((file) => hashes[file] !== undefined && hashes[file] !== recorded[file]);
}

const approve = (id: string, step: string) => `mandao approve ${id} ${step}`;

/** Draft documents lead to the approval that moves them on; `undefined` when nothing is draft. */
function draftStep(spec: NextSpec, lite: boolean, tasksStatus: string | undefined): string | undefined {
  if (spec.requirements?.status === 'draft' && tasksStatus !== 'approved') return lite ? 'spec' : 'design';
  if (spec.story?.meta.status === 'draft') return 'story';
  return undefined;
}

const rec = (command: string, reason: string, ...others: string[]): NextStep => ({
  recommended: { command, reason },
  options: [command, ...others],
});

/** What must be settled before the spec moves on: open items, draft documents, a document changed after its approval. */
function settle(spec: NextSpec, facts: NextFacts, lite: boolean): NextStep | undefined {
  const id = spec.story?.meta.id ?? spec.name;
  const open = openItems(spec);
  const item = open.criticalOpen[0] ?? open.ask[0];
  if (item) return rec('/mandao-clarify', `${open.criticalOpen.length ? 'critical OPEN' : 'open item'}: ${item}`);
  const draft = draftStep(spec, lite, facts.tasksStatus);
  if (draft) return rec(approve(id, draft), `the ${draft === 'story' ? 'story' : 'spec'} is still draft`, '/mandao-clarify');
  const approvals = activeApprovals(facts.approvals ?? []).filter((a) => a.step !== 'shown');
  const changed = changedSince(approvals, facts.hashes ?? {});
  if (!changed.length) return undefined;
  return rec(approve(id, lite ? 'spec' : 'design'), `${changed.join(', ')} changed after its approval`, '/mandao-clarify');
}

/** Where an approved, settled spec stands: tasks, commits, verify, close. */
function stage(spec: NextSpec, facts: NextFacts, lite: boolean): NextStep {
  const id = spec.story?.meta.id ?? spec.name;
  const status = spec.story?.meta.status ?? 'draft';
  if (status === 'abandoned') return rec('/mandao-story', `the spec is ${status}`);
  if (status === 'blocked') return rec('/mandao-clarify', 'the spec is blocked');
  if (!spec.requirements) return rec('/mandao-specify', 'the story is approved and has no requirements yet');
  if (facts.pendingCommits?.length) {
    return rec(`mandao run commit ${id}`, `${facts.pendingCommits.join(', ')} passed and wait for their commit`);
  }
  if (status === 'verified') return rec('/mandao-close', 'the spec is verified');
  if (facts.tasksStatus === 'draft') return rec('/mandao-tasks', 'tasks.md is not approved yet', '/mandao-clarify');
  if (!lite && !spec.tasks.length) return rec('/mandao-tasks', 'the spec is approved and has no tasks yet', '/mandao-clarify');
  if (facts.verifyVerdict === 'blocked')
    return rec('/mandao-implement', 'the verify failed: rework what it listed', '/mandao-verify', '/mandao-clarify');
  if (spec.tasks.length && spec.tasks.every((t) => t.done)) return rec('/mandao-verify', 'every task is done');
  return rec('/mandao-implement', spec.tasks.length ? 'tasks are left' : 'the spec is approved', '/mandao-clarify');
}

/** A closed spec has only its delivery left (push, PR, merge), read from git by the caller; naming it performs nothing (MDO-0012 does). */
function delivery(facts: NextFacts): NextStep {
  if (facts.delivery === 'merged')
    return { recommended: { command: 'none', reason: 'the spec is closed and its branch is merged' }, options: [] };
  if (facts.delivery === 'pushed') return rec('open the PR and merge it', 'the spec is closed and its branch is pushed, not merged');
  return rec('push the branch', 'the spec is closed and its branch is not pushed');
}

/**
 * The command that follows from the spec's state, and the others that can follow. Pure: it recommends and
 * never runs, records or changes anything (MDO-0010, AC-1). Never offers implement before the spec is
 * approved and free of open items.
 */
export function nextStep(spec: NextSpec, facts: NextFacts): NextStep {
  const lite = spec.lite ?? false;
  if (spec.story?.meta.status === 'closed') return delivery(facts);
  const next = settle(spec, facts, lite) ?? stage(spec, facts, lite);
  const allTasksDone = spec.tasks.length > 0 && spec.tasks.every((task) => task.done);
  if (next.recommended.command === '/mandao-verify' && allTasksDone && !facts.pendingCommits?.length && facts.verifyVerdict !== 'blocked')
    return { ...next, autoContinue: true };
  return next;
}
