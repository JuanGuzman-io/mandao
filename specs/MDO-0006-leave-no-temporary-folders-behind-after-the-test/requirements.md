---
schema_version: 1
spec: MDO-0006-leave-no-temporary-folders-behind-after-the-test
depth: lite
projects: [mandao]
status: approved
---

# Requirements — Leave no temporary folders behind after the test run

Test-infrastructure enhancement. **ADDED**: removal of the temporary folders that test code creates,
and a guard against creating them by a path that bypasses that removal. **MODIFIED**: the commitlint
test creates its folder through the shared helper. **REMOVED**: nothing. No file under `src/` changes
and no product behavior changes (story, Out of scope).

"Temporary folder created by the run" means a folder that test code under `test/` creates in the
operating system's temp folder (`os.tmpdir()`). The process-level CLI test's build folder lives in
`node_modules/.cache/`, not in the temp folder, and keeps its own cleanup (story, Scope).

## Functional requirements

### FR-1 — Every workspace from the shared helper is removed when its test file finishes
Serves: AC-1, AC-1/C1, AC-3
Projects: mandao

ADDED. Every folder that `makeTree` (`test/helpers.ts`) creates is removed when the test file that
created it finishes, without any code in that test file. This covers workspaces created at module
level, in `beforeAll`/`beforeEach` and inside tests. "When the test run ends" is satisfied per test
file (story, confirmed at approval). A test file that fails while loading, before its tests run, is
out of scope: like an abrupt crash, its cleanup is best effort (story, Out of scope; CC-1).

#### S-1.1 — A passing test file
- **Given** a test file that creates workspaces with `makeTree` at module level, in a hook and inside
  tests, and adds no cleanup of its own
- **When** the test file finishes and every test in it passed
- **Then** none of those workspaces exists any more

#### S-1.2 — A failing test file
- **Given** the same test file, where a test fails (a failed assertion or a thrown error)
- **When** the test file finishes
- **Then** none of its workspaces exists any more
- **AND IT MUST** remove them in the same way whether its tests pass or fail; there is no "keep on
  failure" switch (story, confirmed at approval) (C1)

#### S-1.3 — A new test needs no cleanup of its own
- **Given** a contributor adds a test that calls `makeTree` the way existing tests do
- **When** the run ends
- **Then** its folder has been removed, with no `afterAll`, `afterEach` or `rmSync` in the new test

#### S-1.4 — A full run leaves the temp folder as it found it
- **Given** an empty temp folder dedicated to the run (`TMPDIR` set to it)
- **When** `npm test` runs to completion, once with every test passing and once with a test made to
  fail
- **Then** the temp folder holds no folder created by that run
- **AND IT MUST** hold for the failing run too (C1)

### FR-2 — Only what the run created is removed
Serves: AC-1/C2
Projects: mandao

ADDED. The removal acts only on the exact folders that `makeTree` returned in this test file. It never
selects folders by name or prefix, and never touches the temp folder itself.

#### S-2.1 — Folders the run did not create survive
- **Given** the temp folder already holds a folder named like a test workspace (`mandao-test-…`) that
  this run did not create
- **When** a test file that uses `makeTree` finishes
- **Then** that folder still exists, with its content intact
- **BUT it must NOT** remove any folder by name pattern, nor the temp folder itself (C1)

#### S-2.2 — A workspace the test already removed
- **Given** a test that removed part or all of its own workspace
- **When** the test file finishes
- **Then** the removal completes without failing the file
- **AND IT MUST** still remove whatever is left of the other workspaces of that file (C1)

### FR-3 — Workspaces stay available until their test file has finished
Serves: AC-2, AC-2/C1
Projects: mandao

ADDED. The removal runs after every test and every hook of the test file, including the file's own
`afterAll`/`afterEach`.

#### S-3.1 — The file's own teardown still sees its workspaces
- **Given** a test file that creates a workspace at module level and reads it in its own `afterAll`
- **When** that `afterAll` runs
- **Then** the workspace exists and holds what the tests wrote into it
- **BUT it must NOT** be removed before the last test and the last hook of that file have run (C1)

#### S-3.2 — Workspaces shared by several tests
- **Given** a workspace created once at module level (for example `process.env.MANDAO_HOME =
  makeTree({})`) and used by every test of the file
- **When** the second and later tests run
- **Then** the workspace exists and is intact

### FR-4 — The commitlint test creates its folder through the shared helper
Serves: AC-1, AC-3
Projects: mandao

MODIFIED. `test/unit/commitlint.test.ts` creates the folder for `commitlint.config.mjs` with
`makeTree` instead of `mkdtempSync(join(tmpdir(), 'mandao-cl-'))`, so FR-1 removes it. What the test
asserts does not change.

#### S-4.1 — No `mandao-cl-` folder after the run
- **Given** the commitlint test file
- **When** it finishes
- **Then** no folder it created remains in the temp folder, and every assertion it had still runs and
  passes

### FR-5 — The suite fails when test code bypasses the cleanup
Serves: AC-3/C1
Projects: mandao

ADDED. A guard test, in the spirit of `test/unit/architecture.test.ts` (story, confirmed at approval),
scans every file under `test/` and fails, naming the file, when a file other than `test/helpers.ts`
creates a temporary folder directly (`mkdtemp`, `mkdtempSync`, or a reference to `tmpdir`).
`test/integration/doctor-process.test.ts` is the only allowed exception, recorded in the guard with
its reason: its folder is in `node_modules/.cache/`, not the temp folder, and it removes it in its own
`afterAll` (story, Scope).

#### S-5.1 — A bypass is caught
- **Given** a test file under `test/` that calls `mkdtempSync(join(tmpdir(), …))` directly
- **When** the suite runs
- **Then** the guard test fails and its output names that file
- **AND IT MUST** catch it in any folder under `test/`, at any depth (C1)

#### S-5.2 — The tree as delivered passes
- **Given** the test tree after this spec
- **When** the suite runs
- **Then** the guard test passes: the only files that create temporary folders are `test/helpers.ts`
  and the allowed exception

### FR-6 — Existing coverage is unchanged
Serves: AC-4, AC-4/C1
Projects: mandao

MODIFIED (test infrastructure only). The critical-flow suites `test/integration/engine.test.ts`,
`test/integration/doctor-cli.test.ts`, `test/unit/writer.test.ts` and `test/unit/content.test.ts`
verify exactly what they verified before and still pass.

#### S-6.1 — The critical-flow suites are untouched and pass
- **Given** the four critical-flow suites
- **When** the cleanup is in place
- **Then** `git diff main` shows no change to those four files, and each of them passes
- **BUT it must NOT** add `.skip`, `.only`, `.todo` or `.fails`, or remove or weaken any assertion,
  in any test file under `test/` (C1)

## Non-functional requirements

None at lite depth. The story leaves the suite's speed budgets out of scope ("Changing what any test
verifies, or the speed budgets of the test suite").

## AC → FR matrix

| AC | Clause | FR / scenario | Status |
|---|---|---|---|
| AC-1 | main: no folder created by the run remains | FR-1 / S-1.1, S-1.4; FR-4 / S-4.1 | covered |
| AC-1 | AND IT MUST hold whether tests pass or fail (C1) | FR-1 / S-1.2 C1, S-1.4 C1 | covered |
| AC-1 | BUT it must NOT remove anything the run did not create (C2) | FR-2 / S-2.1 C1, S-2.2 | covered |
| AC-2 | main: workspace still there and intact while the file uses it | FR-3 / S-3.1, S-3.2 | covered |
| AC-2 | BUT it must NOT be removed before the file finished (C1) | FR-3 / S-3.1 C1 | covered |
| AC-3 | main: removed without the test adding its own cleanup | FR-1 / S-1.3; FR-4 / S-4.1 | covered |
| AC-3 | AND IT MUST fail the suite on a bypass (C1) | FR-5 / S-5.1, S-5.1 C1, S-5.2 | covered |
| AC-4 | main: critical-flow suites verify the same and pass | FR-6 / S-6.1 | covered |
| AC-4 | BUT it must NOT weaken or skip any assertion (C1) | FR-6 / S-6.1 C1 | covered |

## Consistency Check
<!-- Per rules/consistency-check.md. Write "No findings" when empty. -->

| ID | Type | Sides (quoted, with location) | Severity | Owner |
|---|---|---|---|---|
| CC-1 | GAP | Story AC-1/C1: "hold whether every test passes or some tests fail" (`story.md`, AC-1). Design P4, as run: a test file that throws **while loading**, after calling `makeTree`, never runs the cleanup hook and its folder stays (`design.md`, Premise Ledger P4). The story's Out of scope named only "Runs that are killed or crash abruptly (Ctrl+C, out of memory)". **Resolved 2026-10-20**: option (a), a load failure counts as an abrupt crash; story Out of scope updated, no design change (see Clarifications) | normal | PO |

`mandao run trace MDO-0006`: no structural findings (no GAP, ORPHAN or broken reference; every clause
covered). CC-1 is semantic and resolved (Clarifications, 2026-10-20).

## Open items
<!-- [NEEDS CLARIFICATION] items, ASSUMPTION, OPEN, CONFLICT. -->

None. CC-1 was resolved in Clarifications.

## Clarifications
<!-- Filled by /mandao-clarify: date, question, answer, who answered, what changed. -->

### 2026-10-20 — CC-1: a test file that fails while loading
- **Question**: a test file that fails before its tests run (a syntax error, or an error thrown while
  the file loads after calling `makeTree`) does not get its folders removed (design P4, as run).
  (a) treat it like an abrupt crash, best effort, no design change; or (b) add a process-exit handler
  in the test worker.
- **Answer**: option (a). A file that fails to load is treated like an abrupt crash: best effort, no
  design change; record it in AC-1's out-of-scope wording.
- **Answered by**: the PO (the maintainer's delegate, MDO-0006 short run).
- **What changed**: `story.md` Out of scope now names load failures next to abrupt crashes, plus a
  Confirmed line under Assumptions; FR-1 states the exclusion; `design.md` Summary and Risks record
  the limit as accepted. D1 is unchanged and no scenario is added.
