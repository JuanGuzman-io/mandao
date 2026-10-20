---
schema_version: 1
spec: MDO-0006-leave-no-temporary-folders-behind-after-the-test
verdict: verified        # pending | verified | blocked
date: 2026-10-20
---

# Verify — Leave no temporary folders behind after the test run

<!-- Written by /mandao-verify from `mandao run verify-plan` and the runs it makes. Evidence is quoted as
run: command, exit code, counts. Nothing here is claimed without output. -->

This is the second verify of this spec. The first one, on d9a8305, blocked on PB-1 and PB-2 and left
AC-1/C1 unverified (see History below). T3 fixed both bugs in 87d380e.

`mandao run verify-plan MDO-0006` on 87d380e reported:
- no blockers;
- `missingRed: []`;
- nothing deferred;
- no trace findings.

The tree was clean. Two Testers ran, each in a fresh context.

## Suites

| Project | Kind | Command (as run) | Result | Evidence |
|---|---|---|---|---|
| mandao | unit | `mandao run tests mandao test/helpers.ts test/integration/characterization.test.ts test/integration/scripts.test.ts test/setup.ts test/unit/architecture.test.ts test/unit/commitlint.test.ts test/unit/helpers-teardown.test.ts test/unit/helpers.test.ts vitest.config.ts` (runs `vitest related`) | PASS | `"status": "PASS"`, `"exitCode": 0`; 43 files, 339 tests passed, 0 failed |
| mandao | static | `npm run lint`; `npm run typecheck` | PASS | both exit 0; biome checked 166 files, no fixes applied |
| mandao | e2e (AC-4 critical flows) | `mandao run tests mandao test/integration/engine.test.ts test/integration/doctor-cli.test.ts test/unit/writer.test.ts test/unit/content.test.ts` | PASS | `"exitCode": 0`; 4 files, 44 tests passed, 0 failed |
| mandao | full run, green (D6) | `TMPDIR="$D" npm test`, with `$D` a fresh `mktemp -d` folder seeded with `mandao-test-sentinel/keep.txt` | PASS | exit 0; 43 files, 339 tests passed. Afterwards `$D` held only `mandao-test-sentinel/` (`keep.txt` intact) and `node-compile-cache/`, which Node itself creates |
| mandao | full run, forced failure (D6) | `TMPDIR="$D2" npx vitest run`, with `$D2` seeded the same way and a temporary `test/unit/zz-forced-failure.test.ts` (a module-level `makeTree`, a `makeTree` inside the test, then `expect(1).toBe(2)`) | PASS | exit 1 as expected; only the forced file failed (`1 failed \| 43 passed (44)` files, `1 failed \| 339 passed (340)` tests). Afterwards `$D2` held only the sentinel (`keep.txt` intact) and `node-compile-cache/`. The temporary file was deleted, and `git status --porcelain` printed nothing |

The built CLI was not rebuilt: this spec changes only test infrastructure, and nothing under `src/`
changed.

## Acceptance criteria → tests

| AC / clause | Critical | Tests | Level | Result |
|---|---|---|---|---|
| AC-1 | false | S-1.1: `helpers.test.ts:7` "removes a folder created by makeTree". S-4.1: `commitlint.test.ts:40`, now on `makeTree`. S-1.4: `scripts.test.ts:25,48` and `characterization.test.ts:74`, which now stay inside a workspace. D6 green full run | unit + full run | PASS |
| AC-1/C1 | false | S-1.2, S-1.2/C1, S-1.4/C1: D6 full run with a forced failure; the failing file's workspaces were removed | full run | PASS |
| AC-1/C2 | false | S-2.1, S-2.1/C1: `helpers.test.ts:14`, where a look-alike folder survives with its content intact. S-2.2, S-2.2/C1: `helpers.test.ts:27`. In both D6 runs the sentinel survived | unit + full run | PASS |
| AC-2 | false | S-3.1: `helpers-teardown.test.ts:8-12`, where the file's own `afterAll` sees `written.txt`. S-3.2: `helpers-teardown.test.ts:15,20` | unit | PASS |
| AC-2/C1 | false | S-3.1/C1: the same `afterAll` | unit | PASS |
| AC-3 | false | S-1.3: `setup.ts` has `afterAll(removeTrees)`, plus S-1.1. `commitlint.test.ts` and the forced-failure file used `makeTree` with no cleanup of their own | unit + full run | PASS |
| AC-3/C1 | false | S-5.1, S-5.1/C1, S-5.2: `architecture.test.ts:20` "only test/helpers.ts creates temporary folders"; `ALLOWED` holds only `doctor-process.test.ts`. S-5.1/C2: `architecture.test.ts:33` "no test climbs out of a folder with join(<folder>, '..')"; it does not flag `join(root, f, '..')` at `mdo-0005-defects.test.ts:263` | unit | PASS |
| AC-4 | true | S-6.1: the four critical-flow suites pass (44 tests). `git diff $(git merge-base main HEAD)` on those four files is empty | e2e | PASS |
| AC-4/C1 | true | S-6.1/C1: the branch diff under `test/` adds no `.skip`, `.only`, `.todo` or `.fails`. The T3 diff removes or weakens no assertion; the only assertion edit is the worktree path in `scripts.test.ts:48`, which checks the same thing | review of diff | PASS |

## TDD evidence (ADR 0022)

- `missingRed: []`.
- **T1:** RED recorded in `execution.md` (exit 1) for `helpers.test.ts` and `helpers-teardown.test.ts`.
- **T2:** RED recorded in `execution.md` (exit 1) for `architecture.test.ts`.
- **T3:** RED recorded in `execution.md:21` for `architecture.test.ts` (`npx vitest run test/unit/architecture.test.ts --maxWorkers=5 failed (exit 1)`).
  - The entry does not quote which files the failure named.
  - The `tasks.md` header records that the regex matched exactly `scripts.test.ts` and `characterization.test.ts` at d9a8305, and the T3 diff changes exactly those two lines.
- **Changed red tests:** none.
  - The `progress.yml` hashes match the current files for `helpers.test.ts`, `helpers-teardown.test.ts` and the T3 entry for `architecture.test.ts`.
  - The T2 entry for `architecture.test.ts` matches the file at d9a8305. T3 then added a test to that file, which is expected.

## Product bugs

None in this run.

**Test defects fixed:** none.

## Deferred to CI

None.

## Blockers

None.

## History

- **First verify, d9a8305:** blocked.
  - PB-1: `scripts.test.ts` left a `.worktrees` folder in the temp folder.
  - PB-2: `characterization.test.ts` left `.patch` files in the temp folder.
  - CC-V1 (PREMISE) and CC-V2 (GAP) went to clarify.
  - The forced-failure run was denied by permissions.
- **Resolution:** the Clarifications of 2026-10-20 (`requirements.md`) and T3 in 87d380e.
- **This run:** PB-1 and PB-2 are fixed, as the D6 green run shows. AC-1/C1 is now verified by the forced-failure run.

## Consistency Check

Checked over story, requirements, design, tasks and this report.

| ID | Type | Sides (quoted, with location) | Severity | Owner |
|---|---|---|---|---|
| CC-V1 | PREMISE | **Resolved.** `design.md` P5 was corrected and D7 added. T3 moved the worktree and the patch files inside `makeTree` workspaces. The D6 green run confirms it | normal | dev |
| CC-V2 | GAP | **Resolved.** FR-5 and S-5.1/C2 widen the guard to `join(<folder>, '..', …)`. It is covered by `architecture.test.ts:33` | normal | dev |

No new findings. For close, two non-blocking notes from the T3 Reviewer (`execution.md:33-34`):
- The `join(…, '..')` guard catches only the shape where `'..'` is the second argument. `join(a, b, '..')` is deliberately allowed.
- The literal `repo.worktrees` in `scripts.test.ts:48` depends on the `repo/` key at `:31`.
