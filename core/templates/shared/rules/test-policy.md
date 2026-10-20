---
schema_version: 1
rule: test-policy
---

# Test policy

Risk-based. Tests are declared per task in `tasks.md`; each scenario is proven at the **cheapest
level that demonstrates it**. Coverage percentages are not a goal.

## Unit tests

| Always | Never |
|---|---|
| Business rules, validations, calculations | DTOs, types, config |
| Authorization decisions | Dependency-injection wiring |
| State transitions | Generated code |
| Mappers and parsers with logic | Purely visual components |
| `BUT it must NOT` / `AND IT MUST` edge cases | Pass-throughs, trivial getters |
| Regression of every fixed bug | |

The Reviewer fails a task with a missing mandatory test and flags unnecessary tests as noise.

## E2E

- `critical-flows.md` in the constitution lists the critical flows; AC that touch them carry
  `critical: true`.
- E2E is required for: critical AC, multi-project features, and regressions of past incidents.
- Locally, `verify` runs the e2e flows tied to the spec's AC. The full suite and the smoke of every
  critical flow run in CI; locally only with `--full`.

## Which tests run

The Reviewer and `verify` run only the tests a change impacts:

- **Unit:** tests related to the touched files: reverse dependents from the code graph plus the
  runner's own selection (`vitest related`, `jest --findRelatedTests`, `nx affected`, `go test` per
  package, `pytest` per path).
- **E2E:** only the flows tied to the AC of the task (Reviewer) or of the spec (`verify`).
- **Uncertain impact:** the tests of the touched module, never the full suite.
- **Full suite and critical smoke:** in CI; locally only with `--full`.

## Resource budget

Before running tests, check cores, free RAM and load. Limit workers (default: half the cores) and
pass the limit to the runner; run at low priority; local e2e uses one headless browser with limited
workers; every run has a timeout. Only one heavy run at a time: the Leader queues runs from tasks,
Testers and parallel worktrees. Settings come from `resources` in `.mandao/config.yml`.

If resources are short, reduce workers. If that is still not enough, mark the run `DEFERRED_TO_CI`
and record in `execution.md` what was deferred and why. Deferred is not a PASS: the spec cannot reach
`verified` until CI confirms those tests.
