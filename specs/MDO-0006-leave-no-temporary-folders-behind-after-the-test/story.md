---
schema_version: 1
tracker: none
type: enhancement
id: MDO-0006
url:
parent:
projects: [mandao]
lane: normal
status: approved
sources:
  - { ref: "user request (/mandao-story input)", kind: chat, date: 2026-10-20 }
  - { ref: "specs/quick/quick-log.md:10 (restore-mandao-home) and commit 893722f", kind: repo, date: 2026-10-20 }
  - { ref: "test/helpers.ts:6-18 (makeTree)", kind: code, date: 2026-10-20 }
  - { ref: "test/unit/commitlint.test.ts:40 (mkdtempSync, mandao-cl-)", kind: code, date: 2026-10-20 }
  - { ref: "test/integration/doctor-process.test.ts:17,30-31 (mkdtemp in node_modules/.cache, removed in afterAll)", kind: code, date: 2026-10-20 }
  - { ref: "vitest.config.ts; package.json:36 (npm test = vitest run)", kind: code, date: 2026-10-20 }
  - { ref: "npm test run and find over os.tmpdir(), as run", kind: command, date: 2026-10-20 }
  - { ref: "docs/constitution/critical-flows.md", kind: constitution, date: 2026-10-20 }
  - { ref: "PO approval by the maintainer's delegate (proposed answers 1-4 accepted)", kind: chat, date: 2026-10-20 }
  - { ref: "docs/constitution/standards.md:68 (filesystem writes outside src/writer/)", kind: constitution, date: 2026-10-20 }
---

# Leave no temporary folders behind after the test run

## Who
A Mandao maintainer (or contributor) who runs the full test suite locally, many times a day.

## Problem
Every `npm test` creates hundreds of throwaway workspaces in the operating system's temp folder and
never removes them. The shared helper that builds test workspaces (`makeTree`, `test/helpers.ts:6`)
and the commitlint test (`test/unit/commitlint.test.ts:40`) create folders and leave them. Only the
process-level CLI test removes what it creates (`test/integration/doctor-process.test.ts:30-31`).

Measured on 2026-10-20 on the maintainer's machine: about 550 new `mandao-*` folders appeared in the
temp folder during one `npm test` (about 80 MB), and 14,940 had already accumulated
(14,778 `mandao-test-*`, 162 `mandao-cl-*`). The run passed; the leftovers are silent.

The Reviewer raised this as a non-blocking point during the `restore-mandao-home` quick change
(`specs/quick/quick-log.md:10`).

## Value
- The maintainer's disk stops filling up silently with test leftovers.
- A test run behaves like a good citizen: what it creates, it removes.
- Leftovers from one run can no longer mask or influence another, and the temp folder stays easy to
  inspect when something does go wrong.

## Scope
- Every temporary folder created by test code under `test/` (the `makeTree` helper and any direct
  temp-folder creation in a test file) is removed by the time the test run ends.
- This holds whether the tests pass or fail.
- The process-level CLI test keeps cleaning up its build output as it does today.

## Out of scope
- Removing the folders already accumulated by past runs (a one-time manual cleanup).
- Temporary files that the product code itself creates at runtime (none found today: no temp-folder
  creation under `src/`).
- Runs that are killed or crash abruptly (Ctrl+C, out of memory); cleanup there is best effort only.
  A test file that fails before its tests run (a syntax error or an error thrown while the file
  loads) counts as such a crash for AC-1: folders it created before failing may remain. The runner
  still reports that file as failed.
- Changing what any test verifies, or the speed budgets of the test suite.

## Acceptance criteria

### AC-1 — A full run leaves the temp folder as it found it
critical: false

- **GIVEN** the temp folder holds no `mandao-*` folders created by the current run
- **WHEN** the maintainer runs `npm test` to completion
- **THEN** no folder created by that run remains in the operating system's temp folder
- **AND IT MUST** hold whether every test passes or some tests fail (C1)
- **BUT it must NOT** remove anything in the temp folder that the run did not create (C2)

### AC-2 — Workspaces stay available while a test uses them
critical: false

- **GIVEN** a test builds a temporary workspace with the shared helper
- **WHEN** the test (and its setup and teardown in the same file) reads or writes that workspace
- **THEN** the workspace is still there and intact
- **BUT it must NOT** be removed before the test file that created it has finished (C1)

### AC-3 — New tests are covered without extra effort
critical: false

- **GIVEN** a contributor adds a test that needs a temporary workspace
- **WHEN** they use the shared helper the way existing tests do
- **THEN** its temporary folder is removed at the end of the run without the test adding its own
  cleanup
- **AND IT MUST** fail the test suite if test code creates a temporary folder by a path that bypasses
  the cleanup (C1)

### AC-4 — Existing coverage is unchanged
critical: true

- **GIVEN** the critical-flow suites (`test/integration/engine.test.ts`,
  `test/integration/doctor-cli.test.ts`, `test/unit/writer.test.ts`, `test/unit/content.test.ts`)
- **WHEN** the cleanup is in place
- **THEN** they verify exactly what they verified before and still pass
- **BUT it must NOT** weaken or skip any existing assertion (C1)

## Dependencies
- None outside the repository. The test runner is vitest (`package.json:36`, `vitest.config.ts`).

## UX references
- None: this is developer experience only; nothing user-facing changes.

## Data involved
- Throwaway test workspaces only (generated config files, fake `package.json`, temporary git
  repositories). No user or personal data.

## Assumptions and open questions

- Confirmed (source: PO approval, 2026-10-20): "when the test run ends" is satisfied if each folder is
  removed when the test file that created it finishes; the observable outcome is AC-1.
- Confirmed (source: PO approval, 2026-10-20): folders are always removed, even for failing tests;
  there is no "keep on failure" switch for debugging.
- Confirmed (source: PO approval, 2026-10-20): AC-3 C1 asks for a regression guard in the suite, in
  the spirit of the existing architecture guard (`test/unit/architecture.test.ts`).
- Confirmed (source: PO approval, 2026-10-20): removing the folders already accumulated stays out of
  scope, as a one-time manual cleanup.
- Confirmed (source: PO answer to CC-1 by the maintainer's delegate, 2026-10-20): a test file that
  fails while loading is treated like an abrupt crash; its cleanup is best effort (Out of scope).
- ASSUMPTION(source: docs/constitution/critical-flows.md): AC-4 is `critical: true` because it touches
  the suites that prove the critical flows, even though no product behaviour changes.
- ASSUMPTION(source: command output, 2026-10-20): the "about 550 folders per run" figure counts
  `mandao-*` folders modified within three minutes of one run; another process writing to the temp
  folder at the same time could inflate it slightly.
