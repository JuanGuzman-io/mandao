import type { DesignFinding } from './principles.js';
import type { Requirements } from './requirements.js';
import type { Story } from './story.js';
import type { Task } from './tasks.js';

export type TraceFindingType =
  | 'GAP'
  | 'ORPHAN'
  | 'BROKEN_REF'
  | 'UNPLANNED'
  | 'UNTESTED'
  | 'E2E_MISSING'
  | 'UNCOMMITTED'
  /** A High premise with neither a recorded run nor the UNVERIFIED marker (ADR 0033). */
  | 'PREMISE_UNPROVEN'
  | 'PRINCIPLE_GATE'
  | 'DATA_WRITE'
  | 'SECURITY_GAPS'
  | 'SECURITY_CI_PENDING'
  /** A document cites a reference the spec does not define (phase 20); not blocking, the agent fixes it everywhere. */
  | 'STALE_REF';

export interface TraceFinding {
  type: TraceFindingType;
  /** The item the finding is about: `AC-1/C1`, `FR-3`, `S-2.1`, `T4`. */
  ref: string;
  message: string;
}

export interface TraceRow {
  /** `AC-1` (main) or `AC-1/C1` (edge clause). */
  ref: string;
  critical: boolean;
  requirements: string[];
  scenarios: string[];
  tasks: string[];
  tests: string[];
}

/** Commit state of the spec, resolved from git trailers by the caller (ADR 0021). */
export interface CommitState {
  /** Tasks whose last execution row is PASS or DEFERRED_TO_CI. */
  passed: string[];
  /** Tasks with a commit carrying `Refs: <spec id>` and `Mandao-Task: <task>`. */
  committed: Set<string>;
  /** Tasks queued in progress.yml `pending_commits`. */
  pending: string[];
}

/** A passed task without a commit carrying its trailers. */
export function commitFindings(state: CommitState): TraceFinding[] {
  return state.passed
    .filter((t) => !state.committed.has(t))
    .map((t) => ({
      type: 'UNCOMMITTED' as const,
      ref: t,
      message: state.pending.includes(t)
        ? `${t} passed review and its commit is pending: run \`mandao run commit <spec>\``
        : `${t} passed review but no commit carries its Mandao-Task trailer`,
    }));
}

export interface Trace {
  rows: TraceRow[];
  findings: TraceFinding[];
}

/**
 * Every reference the spec defines: AC and their clauses, requirements, scenarios and their clauses. A removed AC is
 * still defined: it keeps its number and its record (ADR 0041), so citing it is history, not a stale reference.
 */
export function definedRefs(story: Story, reqs: Requirements): Set<string> {
  const acs = story.acs.flatMap((ac) => [ac.id, ...ac.clauses.filter((c) => c.id).map((c) => `${ac.id}/${c.id}`)]);
  return new Set([...acs, ...reqs.requirements.map((r) => r.id), ...scenarioRefs(reqs)]);
}

/** Every AC and edge clause of the story, as `AC-1` and `AC-1/C1`. */
function storyRefs(story: Story): { ref: string; critical: boolean }[] {
  return story.acs
    .filter((ac) => !ac.removed)
    .flatMap((ac) => [
      { ref: ac.id, critical: ac.critical },
      ...ac.clauses.filter((c) => c.id).map((c) => ({ ref: `${ac.id}/${c.id}`, critical: ac.critical })),
    ]);
}

/** Every scenario and edge clause, as `S-1.1` and `S-1.1/C1`. */
function scenarioRefs(reqs: Requirements): string[] {
  return reqs.requirements.flatMap((r) =>
    r.scenarios.flatMap((s) => [s.id, ...s.clauses.filter((c) => c.id).map((c) => `${s.id}/${c.id}`)]),
  );
}

/** Requirements that serve nothing or cite unknown AC, and tasks that cite unknown references or no tests. */
function referenceFindings(reqs: Requirements, tasks: Task[], known: Set<string>, knownScenarios: Set<string>): TraceFinding[] {
  const out: TraceFinding[] = [];
  for (const r of reqs.requirements) {
    for (const s of r.serves.filter((x) => !known.has(x)))
      out.push({ type: 'BROKEN_REF', ref: r.id, message: `${r.id} serves ${s}, which the story does not define` });
    if (!r.serves.some((s) => known.has(s)))
      out.push({ type: 'ORPHAN', ref: r.id, message: `${r.id} serves no acceptance criterion: unrequested scope` });
  }
  for (const t of tasks) {
    for (const a of t.ac.filter((x) => !known.has(x)))
      out.push({ type: 'BROKEN_REF', ref: t.id, message: `${t.id} cites ${a}, which the story does not define` });
    for (const s of t.scenarios.filter((x) => !knownScenarios.has(x)))
      out.push({ type: 'BROKEN_REF', ref: t.id, message: `${t.id} cites ${s}, which requirements do not define` });
    if (!t.tests.unit.length && !t.tests.e2e.length) out.push({ type: 'UNTESTED', ref: t.id, message: `${t.id} declares no tests` });
  }
  return out;
}

/**
 * Structural traceability (rules/traceability.md): coverage closes per clause, and a clause is only
 * covered when something cites it exactly — a gap is never discharged by citing another reference.
 * Semantic findings (CONTRADICTION, RULE, PREMISE, CONTRACT) stay with the agent.
 */
export function trace(
  story: Story,
  reqs: Requirements,
  tasks: Task[] = [],
  commits?: CommitState,
  designChecks: DesignFinding[] = [],
): Trace {
  const findings: TraceFinding[] = [...(commits ? commitFindings(commits) : []), ...designChecks];
  const refs = storyRefs(story);
  const known = new Set(refs.map((r) => r.ref));
  const scenarios = scenarioRefs(reqs);
  const knownScenarios = new Set(scenarios);

  findings.push(...referenceFindings(reqs, tasks, known, knownScenarios));

  const rows = refs.map(({ ref, critical }): TraceRow => {
    const requirements = reqs.requirements.filter((r) => r.serves.includes(ref)).map((r) => r.id);
    const scenarioIds = reqs.requirements.filter((r) => requirements.includes(r.id)).flatMap((r) => r.scenarios.map((s) => s.id));
    const covering = tasks.filter((t) => t.ac.includes(ref));
    const row = {
      ref,
      critical,
      requirements,
      scenarios: scenarioIds,
      tasks: covering.map((t) => t.id),
      tests: covering.flatMap((t) => [...t.tests.unit, ...t.tests.e2e]),
    };
    if (!requirements.length) findings.push({ type: 'GAP', ref, message: `${ref} has no requirement citing it exactly` });
    if (critical && !ref.includes('/') && tasks.length && !covering.some((t) => t.tests.e2e.length)) {
      findings.push({ type: 'E2E_MISSING', ref, message: `${ref} is critical but no task declares an e2e test for it` });
    }
    return row;
  });

  if (tasks.length) {
    const planned = new Set(tasks.flatMap((t) => t.scenarios));
    for (const s of scenarios.filter((x) => !planned.has(x)))
      findings.push({ type: 'UNPLANNED', ref: s, message: `${s} is not cited by any task` });
  }
  return { rows, findings };
}
