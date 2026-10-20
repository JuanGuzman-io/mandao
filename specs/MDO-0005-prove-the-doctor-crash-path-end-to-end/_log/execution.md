---
schema_version: 1
spec: MDO-0005-prove-the-doctor-crash-path-end-to-end
---

# Execution — MDO-0005-prove-the-doctor-crash-path-end-to-end

Machine log of `/mandao-implement`: one row per Leader step, written by `mandao run checkpoint`, and
the mutation evidence that stands in for red tests on T1. People read [tasks.md](../tasks.md) and
[verify-report.md](../verify-report.md) first.

## Log

| Date | Task | Attempt | Tier | Harness | Implementer | Reviewer | Verdict | Notes |
|---|---|---|---|---|---|---|---|---|
| 2026-10-20 | T1 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-20 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | REPORTED | identity mismatch: implementer claimed claude-sonnet-5-5 mandao-implementer-standard, invoked claude-sonnet-5-5 |
| 2026-10-20 | T1 | 1 | standard | claude | — | claude-opus-5-5 | FAIL | identity mismatch: reviewer claimed mandao-reviewer (identity not stated), invoked claude-opus-5-5 |
| 2026-10-20 | T1 | 2 | standard | claude | — | — | STARTED |  |
| 2026-10-20 | T1 | 2 | standard | claude | claude-sonnet-5-5 | — | REPORTED | identity mismatch: implementer claimed claude-sonnet-5-5 mandao-implementer-standard, invoked claude-sonnet-5-5 |
| 2026-10-20 | T1 | 2 | standard | claude | — | claude-opus-5-5 | PASS | identity mismatch: reviewer claimed mandao-reviewer (identity not stated), invoked claude-opus-5-5 |

## Mutation evidence (T1)

The tests characterize existing behavior, so there is no red row (Leader decision). Each assertion was
shown to fail once with a local, uncommitted mutation, reverted afterwards (`git status` shows no `src/`
change). Run: `npx vitest run test/integration/doctor-process.test.ts`.

| # | Mutation | Failing tests | Assertion proven |
|---|---|---|---|
| M1 | `src/cli/index.ts`: `process.exitCode = 0` in the catch | S-1.1, S-1.2 | lock `status === 1` |
| M2 | `src/cli/index.ts`: `console.log()` in the catch | S-1.1, S-1.2 | lock `stdout === ''` (a lone newline fails) |
| M3 | `src/cli/index.ts`: `'error'` label renamed `'oops'` | S-1.1, S-1.2 | stderr matches `/\berror\b/` |
| M4 | `src/cli/index.ts`: issues (file path) not printed | S-1.1, S-1.2 | stderr contains `.mandao/mandao.lock` |
| M5 | `src/cli/index.ts`: `console.error('noise')` before the run | S-2.1, S-2.2 | models `stderr === ''` |
| M6 | `src/cli/index.ts`: `console.log('noise')` before the run | S-1.1, S-1.2, S-2.1, S-2.2 | `JSON.parse` of the whole stdout fails; lock stdout empty |
| M7 | `src/cli/index.ts`: `process.exitCode = 0` after the run | S-2.1, S-2.2 | models `status === 1` |
| M8 | test fixture: models file misnamed | S-2.1, S-2.2 | error finding naming `.mandao/models.yml` |
| M9 | test fixture: lock file misnamed | S-1.1, S-1.2 | the fixture really drives the lock crash |
| M10 | `src/cli/output.ts:73`: `schema_version: 2` | S-2.1, S-2.2 (line 71) | `report.schema_version === 1` |
