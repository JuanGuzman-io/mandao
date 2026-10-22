# 0053 — Deliveries inside a spec

**Status:** Accepted (Phase 9a, MDO-0013)

## Context

Big specs made one long implement run with one final verify and one PR. Splitting them into several specs
loses the single story, the shared design and the AC-to-test trace, and often separates work that has no
value alone. The execution needs checkpoints and a cut for the PR; the spec does not need to split.

## Decision

- A task may declare `delivery: n` in its YAML. `src/spec/deliveries.ts` groups tasks by it
  (`splitDeliveries`). An AC is met in the delivery of its last task.
- Delivery issues are reported inside `issues` and must be absent at the Check step of `/mandao-tasks`: mixed declared and undeclared tasks,
  gaps in the numbering, a dependency on a later delivery, a delivery that meets no AC.
- The `## Overview` is grouped by `### Delivery n — AC…`, each with a checkpoint
  `mandao run verify-plan <spec> --delivery n`. That plan is partial: it always carries a "partial plan"
  blocker, so it never verifies the spec. Its output adds `scope: { delivery, ac, tasks, clear }`; `clear`
  is true when that is the only blocker left, which is how a delivery checkpoint passes. A scoped plan
  drops only what belongs to later deliveries (findings, deferred runs); delivery n and earlier stay;
  suites, e2e, missing red, not-done and security cover delivery n's tasks. The final verify covers every AC; one close per spec.
- `mandao run tasks` reports `deliveries`, `delivery` (with `checkpoint` at a boundary) and
  `proposeDeliveries`. A proposal appears past `deliveries.propose_above_tasks` (config, default 8) tasks, or
  when the distinct declared files exceed `size_limits.pr.max_files`. Deliveries are grouped by AC, never
  by technical layer; the user decides. The proposal applies only while no task declares `delivery`;
  numbering is 1..n.
- `next` and `resume` take the next task from the first unfinished delivery and show "delivery n of m".
  A boundary names the partial verify and recommends a new session.
- `pr-plan` proposes stacked PRs along the declared deliveries (past `size_limits.pr`), before the
  dependency waves. Polyrepo per-repository PRs come before deliveries.
- **Criterion for separate specs** (`rules/spec-docs.md` principle 8, pointed to by story, specify and tasks): only when the parts have value on their own,
  ship independently and have independent AC. One PO story, or dependent AC, is one spec. The proposal
  states the criterion; the user decides.
- The boundary is a derived fact (tasks done against the declared deliveries); no new state is persisted.

## Consequences

Large specs keep one story, one design and one close, with a partial check and a session cut at each
delivery. Specs without `delivery` behave as before.

Stays in the backlog (MDO-0013): opening a stacked PR when each delivery closes (`pr-plan` only proposes
it) and pushing deliveries or tasks to a tracker as sub-tasks. Parallel tasks (phase 9b, MDO-0014) wait for
Kaizen evidence; `planTasks.parallel` only reports and runs nothing.
