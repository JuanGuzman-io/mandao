---
schema_version: 1
spec: <ID>-<slug>
verdict: pending        # pending | verified | blocked
date:
---

# Verify — <title>

<!-- Written by /mandao-verify from `mandao run verify-plan` and the runs it makes. Evidence is quoted as
run: command, exit code, counts. Nothing here is claimed without output. -->

## Suites

| Project | Kind | Command (as run) | Result | Evidence |
|---|---|---|---|---|

## Acceptance criteria → tests

| AC / clause | Critical | Tests | Level | Result |
|---|---|---|---|---|

## TDD evidence (ADR 0022)

<!-- Tasks with declared tests and their RED row; `missingRed` from verify-plan, and changed red tests. -->

## Product bugs

<!-- PRODUCT_BUG findings from the testers: test, expected, actual, evidence. Test defects fixed are listed
separately, never mixed with product bugs. -->

## Deferred to CI

<!-- Runs the budget deferred; `verified` waits for CI to confirm them. -->

## Blockers

<!-- `blockers` from verify-plan that remain; empty when the verdict is `verified`. -->
