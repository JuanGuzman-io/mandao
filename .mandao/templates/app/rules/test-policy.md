---
schema_version: 1
rule: test-policy
---

# Test policy

Risk-based. Each task declares in `tasks.md` the level of every scenario it cites (`test_levels`:
`unit | e2e | eval | none`); each scenario is proven at the **cheapest level that demonstrates it**.
Concrete test names are chosen by whoever writes the tests. Coverage percentages are not a goal.

## Unit tests

| Always | Never |
|---|---|
| Business rules, validations, calculations | DTOs, types, config |
| Authorization decisions | Dependency-injection wiring |
| State transitions | Generated code |
| Mappers and parsers with logic | Purely visual components |
| `BUT it must NOT` / `AND IT MUST` edge cases | Pass-throughs, trivial getters |
| Regression of every fixed bug | |

The Reviewer fails a task when a scenario has no test at its declared level, and flags unnecessary
tests as noise.

## TDD where tests are mandatory (ADR 0022)

Where the table says **Always**: red test first, derived from the scenario or clause; then the minimum
code to pass it; then refactor within the task's scope. Where it says **Never**, TDD does not apply.

- **Red evidence:** `mandao run red <spec> <Tn> <test files>` runs the tests and records
  a `RED` row only if they fail. If the first run passes, `run step` offers exactly two alternatives:
  a killed `mandao run mutation … --for-first-pass` probe, or independent review with
  `mandao run test-review <spec> <Tn> --reviewer mandao-reviewer --review <file>`. The review begins
  `TEST REVIEW: PASS`, has an `## Assertions` section and names every inspected test file. Until one is
  recorded, implementation cannot proceed; repeating the green red run is not useful evidence.
- **Removed test cases:** removing a case recorded in the task's first test run requires
  `--test-deletion-reason` at the report checkpoint. The Reviewer sees the cases and reason; a linter
  limit is never a valid reason—split the test file instead.
- **No weakening a red test.** Mandao remembers each red test's hash; a later change shows up as
  `red test changed` in `execution.md` and in the brief, and the Reviewer judges it.
- **Tests by another agent:** for tasks with risk tags or tier strong, the Tester writes the red tests
  from the spec and the Implementer makes them pass.
- Kaizen compares specs with and without TDD (rework, Reviewer FAILs, bugs after merge).

### Characterization tests

A task that **only pins down behavior that already exists** declares `evidence: mutation`. Its tests
pass from the start, so a red run proves nothing; the evidence is a recorded mutation instead:

- `mandao run mutation <spec> <Tn> <test files> --patch <diff>` applies the mutation,
  runs the tests, reverts it and checks the mutated files are back exactly as they were. Only a failing
  run with a clean revert is recorded: a `MUTANT` row, and the diff with the failing output in
  `mutations/<Tn>-<n>.md`. A surviving mutation means the tests do not protect that code.
- Each mutation changes exactly what an assertion protects (never a test or the task's own files): one
  mutation per assertion, until every assertion has failed once.
- A task that adds or changes behavior is never characterization: it needs a red test. The Reviewer
  checks the classification and FAILs a task that hides new behavior behind it.
- Kaizen counts these tasks as `characterization`, apart from `tdd` and `no-tdd`.

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
- **Tests that scan the tree by path** (architecture guards) are not found through imports. Mark them with
  a first-line comment `mandao-scans: <folder>/ …`; impact selection runs them whenever a file under one
  of those folders changes. A test that lists only its own temporary folders says `mandao-scans: none`.
  The `scan-markers` gate fails a changed test that lists or globs folders without the comment.
- **Full suite and critical smoke:** in CI; locally only with `--full`.

## Temporary folders and machine-independent tests

- Every test that needs a temporary workspace creates a unique folder with `mkdtemp` through
  `test/helpers.ts`; folders belong to the current test ID, including folders created in its hooks.
- A test may delete only folders registered to its own test ID. Cleanup uses each recorded absolute
  folder path with recursive `force: true`, so an already absent folder is harmless. Never share a
  temporary workspace across tests, delete a global collection of folders, or find cleanup targets by
  prefix, glob, or directory scan.
- Process-level fixtures also use a fresh `mkdtemp` folder per test and remove only that exact folder.
- Temporary Git repositories set local `user.name` and `user.email`, and disable automatic garbage
  collection and maintenance so Git cannot write into a repository while the test removes it. Test
  scripts use `process.exitCode` instead of `process.exit()` so buffered output can flush.
- `test/unit/architecture.test.ts` enforces these rules.

## Resource budget

Before running tests, check cores, free RAM and load. Limit workers (default: half the cores) and
pass the limit to the runner; run at low priority; local e2e uses one headless browser with limited
workers; every run has a timeout. Only one heavy run at a time: the Leader queues runs from tasks,
Testers and parallel worktrees. Settings come from `resources` in `.mandao/config.yml`.

If resources are short, reduce workers. If that is still not enough, mark the run `DEFERRED_TO_CI`
and record in `execution.md` what was deferred and why. Deferred is not a PASS: the spec cannot reach
`verified` until CI confirms those tests, or a local run of them passes (`run tests <project> --spec <ID>
--deferred <task>`), the only way where the repository has no CI.
