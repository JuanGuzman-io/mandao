---
schema_version: 1
tracker: none
type: enhancement
id: MDO-0005
url:
parent: MDO-0004
projects: [mandao]
lane: normal
status: in-progress
sources:
  - { ref: "approval by the maintainer's delegate for the MDO-0005 command re-run (answers 1-4 accepted as proposed)", kind: conversation, date: 2026-10-20 }
  - { ref: "user request in /mandao-story (tech lead)", kind: conversation, date: 2026-10-20 }
  - { ref: "specs/MDO-0004-doctor-findings-as-json-for-ci/verify-report.md (Partial S-2.2, CC-V1)", kind: spec, date: 2026-10-20 }
  - { ref: "specs/MDO-0004-doctor-findings-as-json-for-ci/requirements.md:50-55 (S-2.2) and :165 (CC-2 clarification)", kind: spec, date: 2026-10-20 }
  - { ref: "specs/MDO-0004-doctor-findings-as-json-for-ci/story.md (OPEN-1 resolved, Out of scope: invalid lock/models.yml)", kind: spec, date: 2026-10-20 }
  - { ref: "src/cli/index.ts:6-16 (catch: error on stderr, exitCode 1)", kind: code, date: 2026-10-20 }
  - { ref: "src/engine/files.ts:32-56 (readYamlFile throws ConfigError; readLock, readModels)", kind: code, date: 2026-10-20 }
  - { ref: "src/engine/doctor.ts:138,159,172 (runDoctor reads the project and global locks)", kind: code, date: 2026-10-20 }
  - { ref: "test/integration/doctor-cli.test.ts:70-78 (S-2.2 asserts rejection and empty stdout only)", kind: code, date: 2026-10-20 }
  - { ref: "docs/constitution/critical-flows.md (init → sync → doctor clean)", kind: constitution, date: 2026-10-20 }
  - { ref: ".github/workflows (npm test runs before npm run build)", kind: code, date: 2026-10-20 }
---

# Prove that a crashing doctor never sends garbage to CI

## Who
A tech lead who relies on `mandao doctor --json` in the team's CI pipeline (the user of MDO-0004).

## Problem
MDO-0004 promised that when the doctor itself crashes (for example on an invalid
`.mandao/mandao.lock`), `mandao doctor --json` writes the error to standard error, leaves standard
output empty and exits with code 1. Only part of that promise is proven: the existing test shows that
nothing reaches standard output, but the error message on standard error and the exit code 1 are not
checked by any test or smoke (MDO-0004 verify report, "Partial: S-2.2", finding CC-V1). A future
change to the CLI entry point could break them silently, and a CI job would then read an empty or
half-written document as success or as an unexplained parse failure.

## Value
The crash contract that CI scripts depend on is guarded by a test, so a regression fails the build
instead of a team's pipeline. It closes the gap left open by MDO-0004 verify.

## Scope
- An end-to-end check that runs `mandao doctor --json` as a real process in a workspace whose
  `.mandao/mandao.lock` is invalid, and asserts standard error, standard output and the exit code.
- The same kind of check for an invalid `.mandao/models.yml`. Contrary to CC-2 of MDO-0004, it does
  not take the crash path: the doctor reports it as an `error` finding in the JSON report (MDO-0005
  CC-1, resolved by the PO on 2026-10-20). The check proves that behavior.

## Out of scope
- Turning an invalid lock or `models.yml` into doctor findings (deferred by MDO-0004 CC-2; a separate
  story).
- Changing the crash behavior or the error wording; this story only proves today's behavior.
- The text mode (`mandao doctor` without `--json`).
- Editing the closed MDO-0004 documents (its `tasks.md` T2 test name stays as recorded; this story is
  the follow-up it names).

## Acceptance criteria

### AC-1 — Invalid lock: error on stderr, empty stdout, exit 1
critical: false

- **GIVEN** a Mandao workspace with a valid `.mandao/config.yml` and an invalid `.mandao/mandao.lock`
- **WHEN** I run `mandao doctor --json` as a separate process
- **THEN** the exit code is 1 and standard error carries an error that names the lock file
- **BUT it must NOT** write anything to standard output, not even an empty line (C1)
- **AND IT MUST** run as part of `npm test`, so CI fails when the behavior regresses (C2)

### AC-2 — Invalid models file: reported as a finding, not a crash
critical: false

- **GIVEN** a Mandao workspace with a valid `.mandao/config.yml` and an invalid `.mandao/models.yml`
- **WHEN** I run `mandao doctor --json` as a separate process
- **THEN** the exit code is 1 and standard output carries exactly one readable JSON report with an
  error finding that names the models file
- **BUT it must NOT** write anything to standard error (C1)

<!-- Rewritten in /mandao-clarify on 2026-10-20 (CC-1, option a, PO). Before: "THEN the exit code is
1 and standard error carries an error that names the models file; BUT it must NOT write anything to
standard output". -->

## Dependencies
- MDO-0004 (closed): the `--json` option and the crash path agreed in its OPEN-1 and CC-2.
- The CLI entry point's error handler (`src/cli/index.ts`), unchanged.

## UX references
- `docs/constitution/ux.md`: errors are explicit; CI-facing output stays machine-readable.
- `docs/schemas.md` "`mandao doctor --json` — report" section (MDO-0004 T3).

## Data involved
Throwaway test workspaces only: a minimal config plus a deliberately broken lock or models file. No
user data, no credentials.

## Assumptions and open questions

Confirmed at approval (maintainer's delegate, 2026-10-20):

- `models.yml` stays in scope (AC-2), which closes CC-2 of MDO-0004 entirely. Corrected in
  `/mandao-clarify` (PO, 2026-10-20, CC-1 option a): it does not take the same crash path; AC-2 now
  proves today's finding-based behavior.
- "Carries an error that names the file" means standard error contains the word `error` and the file
  path, not the exact header or message, so the test survives YAML parser wording changes.
- Both AC are `critical: false`; the crash path is not part of the "init → sync → doctor clean" flow.
- The text mode (`mandao doctor` without `--json`) stays out of scope.

Still open:

- `ASSUMPTION(source: .github/workflows, owner: dev)`: CI runs `npm test` before `npm run build`, so
  the process under test cannot be the built `dist/cli.js`; how to start the real CLI from the
  sources is a design decision for `/mandao-specify`.
- No critical `OPEN`.
