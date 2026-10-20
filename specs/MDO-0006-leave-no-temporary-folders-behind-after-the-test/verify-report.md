---
schema_version: 1
spec: MDO-0006-leave-no-temporary-folders-behind-after-the-test
verdict: blocked        # pending | verified | blocked
date: 2026-10-20
---

# Verify — Leave no temporary folders behind after the test run

<!-- Written by /mandao-verify from `mandao run verify-plan` and the runs it makes. Evidence is quoted as
run: command, exit code, counts. Nothing here is claimed without output. -->

`mandao run verify-plan MDO-0006`: no blockers, `missingRed: []`, nothing deferred, no trace findings.
The tree was clean at d9a8305. Two Testers ran, each in a fresh context.

## Suites

| Project | Kind | Command (as run) | Result | Evidence |
|---|---|---|---|---|
| mandao | unit | `mandao run tests mandao test/unit/architecture.test.ts test/unit/commitlint.test.ts test/unit/helpers-teardown.test.ts test/unit/helpers.test.ts` | PASS | exit 0; 4 files, 15 tests passed, 0 failed |
| mandao | e2e (AC-4 critical flows) | `mandao run tests mandao test/integration/engine.test.ts test/integration/doctor-cli.test.ts test/unit/writer.test.ts test/unit/content.test.ts` | PASS | exit 0; 4 files, 44 tests passed, 0 failed |
| mandao | static | `npm run lint`; `npm run typecheck` | PASS | both exit 0 (biome checked 166 files, no fixes) |
| mandao | full run, green (D6) | `TMPDIR=<fresh dir with mandao-test-sentinel/> npm test` | **FAIL (AC-1)** | exit 0, 43 files and 338 tests passed. Afterwards the folder held the sentinel (`keep.txt` intact), `node-compile-cache/` (Node itself), **`mandao-test-YiAvVX.worktrees/PROJ-12-fix-login/`** and **three `*.patch` files** |
| mandao | full run, forced failure (D6) | `TMPDIR=<fresh dir> npx vitest run` with a temporary failing test file | NOT RUN | The permission system denied the command three times in this non-interactive session. The temporary test file was deleted and `git status` is clean |

## Acceptance criteria → tests

| AC / clause | Critical | Tests | Level | Result |
|---|---|---|---|---|
| AC-1 | false | S-1.1 `helpers.test.ts` "removes a folder created by makeTree"; S-4.1 `commitlint.test.ts` on `makeTree`; S-1.4 D6 green full run | unit + full run | **FAIL**: S-1.1 and S-4.1 pass, but the S-1.4 green run left test-created entries in `TMPDIR` (PB-1, PB-2) |
| AC-1/C1 | false | S-1.2, S-1.2/C1, S-1.4/C1: D6 full run with a forced failure | full run | NOT VERIFIED (run not permitted) |
| AC-1/C2 | false | S-2.1, S-2.1/C1 `helpers.test.ts` "leaves a look-alike folder it did not create, content intact"; D6 sentinel survived the green run | unit + full run | PASS |
| AC-2 | false | S-3.1 `helpers-teardown.test.ts` module-level `afterAll` sees `written.txt`; S-3.2 "first test writes into it" / "second test finds it intact" | unit | PASS |
| AC-2/C1 | false | S-3.1/C1 same `afterAll` | unit | PASS |
| AC-3 | false | S-1.3: `setup.ts` `afterAll(removeTrees)` + S-1.1; `commitlint.test.ts` uses `makeTree` with no cleanup of its own | unit | PASS |
| AC-3/C1 | false | S-5.1, S-5.1/C1, S-5.2 `architecture.test.ts` "only test/helpers.ts creates temporary folders" | unit | PASS as specified. The guard does not see writes into the temp folder through `join(makeTree(), '..', …)` (PB-1, PB-2) |
| AC-4 | true | S-6.1: the four critical-flow suites pass (44 tests); `git diff $(git merge-base main HEAD)` on them is empty | e2e | PASS |
| AC-4/C1 | true | S-6.1/C1: no `.skip/.only/.todo/.fails` added, no assertion removed or weakened under `test/`. The only change to `commitlint.test.ts` is how it creates its folder | review of diff | PASS |

The diff was taken against the merge-base (90b3307), not the `main` tip. `main` has since added
`test/integration/run-queue.test.ts`, which this branch never had.

## TDD evidence (ADR 0022)

- `missingRed: []`.
- **T1:** RED is recorded in `execution.md` (exit 1) for `helpers.test.ts` and `helpers-teardown.test.ts`.
- **T2:** RED is recorded in `execution.md` (exit 1) for `architecture.test.ts`.
- **Changed red tests:** none. The sha256 of all three files equals the `red_tests` entries in
  `progress.yml`.

## Product bugs

### PB-1: `scripts.test.ts` leaves a `.worktrees` folder in the temp folder
- **Test:** `test/integration/scripts.test.ts:44-49`, "worktrees go next to the repository, also from
  inside a worktree".
- **Expected (AC-1, S-1.4):** after `npm test` nothing created by the run remains in the temp folder.
- **Actual:** the test runs `git worktree add` at `join(root, '..', '<root>.worktrees', 'PROJ-12-fix-login')`.
  That path is a sibling of the `makeTree` root, not inside it, so `removeTrees()` never removes it.
- **Evidence:** the D6 green run left `mandao-test-YiAvVX.worktrees/PROJ-12-fix-login/.git` in the
  dedicated `TMPDIR`.

### PB-2: `characterization.test.ts` leaves `.patch` files in the temp folder
- **Test:** `test/integration/characterization.test.ts:74`. Its `patch()` helper writes
  `join(root, '..', `${Date.now()}-${Math.random()}.patch`)`.
- **Expected (AC-1, S-1.4):** as for PB-1.
- **Actual:** each patch file is written next to the `makeTree` root, in the temp folder itself, and is
  never removed.
- **Evidence:** the D6 green run left three `*.patch` files in the dedicated `TMPDIR`. Their content
  is the mutation diff.

Both are premises the design missed. P5 searched only for `mkdtemp|tmpdir`, but these files write
outside the workspace without either token. The FR-5 guard has the same blind spot.

**Test defects fixed:** none.

## Deferred to CI

None. The forced-failure full run (AC-1/C1) is not deferred to CI; it was blocked locally by the
permission system. A maintainer must run it by hand.

## Blockers

1. **PB-1 and PB-2 (AC-1):** test code still leaves entries in the temp folder.
   - **Suggested fix:** keep everything inside the `makeTree` root. For example, run the worktree test
     against a repository in a `makeTree` subfolder, and write patch files inside the root or register
     their paths for removal.
   - **Guard:** consider extending the FR-5 guard to flag `join(<root>, '..'` writes.
   - **Route:** `/mandao-implement` with a new task (a test change plus a premise fix to the design).
2. **AC-1/C1 not verified:** after the fix, re-run D6 with a forced failure. Use a fresh `TMPDIR`
   seeded with `mandao-test-sentinel/` and a temporary failing test file, then delete the file.

## Consistency Check

| ID | Type | Sides (quoted, with location) | Severity | Owner |
|---|---|---|---|---|
| CC-V1 | PREMISE | Design P5: "`mkdtemp\|tmpdir` over `test/` matches only test/helpers.ts, test/unit/commitlint.test.ts and test/integration/doctor-process.test.ts" (`design.md`, Premise Ledger; `tasks.md` header). As run: `scripts.test.ts:44-49` and `characterization.test.ts:74` also write into the temp folder, through `join(root, '..', …)` | normal | dev |
| CC-V2 | GAP | Story AC-3/C1: "fail the test suite if test code creates a temporary folder by a path that bypasses the cleanup" (`story.md`). FR-5 scopes the guard to `mkdtemp`, `mkdtempSync` and `tmpdir` tokens (`requirements.md`, FR-5), so the PB-1 and PB-2 bypasses pass it | normal | dev |
