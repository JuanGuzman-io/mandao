# 0013 — Impacted tests and a resource budget

**Status:** Accepted · 2026-10-20

## Context
Running whole suites for every review and every `verify` is slow and can saturate a developer's
machine, especially with parallel Testers, worktrees and e2e browsers. Most of those runs prove nothing
about the change at hand.

## Decision

**Scope.** The Reviewer and `verify` run only the tests a change impacts:

- **Unit:** tests related to the touched files, found through the graph's reverse dependents plus the
  runner's native selection (`vitest related`, `jest --findRelatedTests`, `nx affected`, `go test` per
  package, `pytest` per path).
- **E2E:** only the flows tied to the AC of the task or the spec.
- **Uncertain impact:** the tests of the touched module, never the full suite.
- The full suite and the smoke of every critical flow run in CI; locally only with `--full`.
- Level 0 gates run "impacted tests" instead of "area tests" (MANDAO-DESIGN §15.1, §16.2, §16.5).

**Resources.**

- Before running: check cores, free RAM and load.
- Workers limited (default: half the cores) and passed to the runner; low process priority; local e2e
  with one browser, headless, limited workers; a timeout per run.
- One heavy run at a time: the Leader queues test runs from tasks, Testers and parallel worktrees.
- `config.yml`: `resources: { max_workers: auto, min_free_memory_mb, priority: low, e2e_workers }`,
  overridable per project (`projects[].resources`).
- Not enough resources: reduce workers; if still not enough, mark the run `DEFERRED_TO_CI`.
- `DEFERRED_TO_CI` is not a PASS: `execution.md` records what was deferred and why, and the spec does
  not reach `verified` until CI confirms those tests.

## Consequences
- The Reviewer's evidence is narrower but attributable to the change; CI remains the source of truth
  for the whole suite.
- Mandao needs a deterministic impact selector (graph + runner) and a resource probe; both belong to
  the helper scripts (ADR 0006) so every harness gets the same behavior.
- `verify` gains a dependency on CI status for deferred runs.
