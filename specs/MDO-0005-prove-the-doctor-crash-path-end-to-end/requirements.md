---
schema_version: 1
spec: MDO-0005-prove-the-doctor-crash-path-end-to-end
depth: lite
projects: [mandao]
status: draft
---

# Requirements — Prove that a crashing doctor never sends garbage to CI

Test-only enhancement: every requirement below is **ADDED** test coverage. No product behavior is
added, modified or removed (story, Out of scope: "Changing the crash behavior or the error wording").

## Functional requirements

### FR-1 — Process-level proof of the invalid-lock crash path
Serves: AC-1, AC-1/C1, AC-1/C2
Projects: mandao

ADDED. A test in `npm test` starts the real CLI entry point (`src/cli/index.ts`) as a separate Node
process, runs `doctor --json` in a throwaway workspace with a valid `.mandao/config.yml` and an invalid
`.mandao/mandao.lock`, and asserts the exit code, standard error and standard output of that process.
"An error that names the lock file" means standard error contains the word `error` and the path
suffix `.mandao/mandao.lock` (story, confirmed at approval), never the YAML parser's wording.

#### S-1.1 — Lock with broken YAML syntax
- **Given** a workspace with a valid `.mandao/config.yml` and a `.mandao/mandao.lock` that is not
  valid YAML
- **When** `mandao doctor --json` runs as a separate process from that workspace
- **Then** the process exits with code 1 and its standard error contains `error` and
  `.mandao/mandao.lock`
- **BUT it must NOT** write anything to standard output: the captured stdout is the empty string,
  not even a newline (C1)
- **AND IT MUST** be part of the `test/**/*.test.ts` suite that `npm test` runs, so the CI `check`
  job fails on a regression (C2)

#### S-1.2 — Lock that is valid YAML but fails the lock schema
- **Given** a workspace with a valid `.mandao/config.yml` and a `.mandao/mandao.lock` that parses as
  YAML but does not match the lock schema
- **When** `mandao doctor --json` runs as a separate process from that workspace
- **Then** the process exits with code 1 and its standard error contains `error` and
  `.mandao/mandao.lock`
- **BUT it must NOT** write anything to standard output (C1)

### FR-2 — Process-level proof that an invalid models file is a finding, not a crash
Serves: AC-2, AC-2/C1
Projects: mandao

ADDED. The same process-level test for a workspace with a valid `.mandao/config.yml` and an invalid
`.mandao/models.yml`. It proves today's behavior (CC-1, option a): the doctor does not crash, it
reports the file as an `error` finding in the `doctor --json` report (`docs/schemas.md`, "`mandao
doctor --json` — report"). "One readable JSON report" means the whole captured stdout parses with
`JSON.parse` and has `schema_version: 1`. "An error finding that names the models file" means at
least one finding has `level: "error"` and a `message` containing the path suffix
`.mandao/models.yml`, never the YAML parser's wording.

#### S-2.1 — Models file with broken YAML syntax
- **Given** a workspace with a valid `.mandao/config.yml` and a `.mandao/models.yml` that is not
  valid YAML
- **When** `mandao doctor --json` runs as a separate process from that workspace
- **Then** the process exits with code 1, its whole standard output parses as one JSON report with
  `schema_version: 1`, and that report has an `error` finding whose `message` contains
  `.mandao/models.yml`
- **BUT it must NOT** write anything to standard error: the captured stderr is the empty string (C1)

#### S-2.2 — Models file that is valid YAML but fails the models schema
- **Given** a workspace with a valid `.mandao/config.yml` and a `.mandao/models.yml` that parses as
  YAML but does not match the models schema
- **When** `mandao doctor --json` runs as a separate process from that workspace
- **Then** the same outcome as S-2.1: exit code 1, one JSON report with an `error` finding whose
  `message` contains `.mandao/models.yml`
- **BUT it must NOT** write anything to standard error (C1)

## Non-functional requirements

### NFR-1 — The process-level tests stay cheap in `npm test`
Serves: AC-1/C2

The new test file, including building the CLI it starts, takes **under 5 s** of wall time on a
developer machine, as reported by `npx vitest run <file>` (prototype at `ea98793`: about 70 ms to build,
about 100 ms per doctor process). It never runs the shell probes of the doctor (tool versions, npm
registry), because the crash happens before them.

## AC → FR matrix

| AC | Clause | FR / scenario | Status |
|---|---|---|---|
| AC-1 | main (exit 1, stderr names the lock file) | FR-1 / S-1.1, S-1.2 | covered |
| AC-1 | C1: BUT must NOT write anything to stdout | FR-1 / S-1.1/C1, S-1.2/C1 | covered |
| AC-1 | C2: AND MUST run as part of `npm test` | FR-1 / S-1.1/C2; NFR-1 | covered |
| AC-2 | main (exit 1, one JSON report with an error finding naming the models file) | FR-2 / S-2.1, S-2.2 | covered |
| AC-2 | C1: BUT must NOT write anything to stderr | FR-2 / S-2.1/C1, S-2.2/C1 | covered |

## Consistency Check

Structural part: `mandao run trace MDO-0005` on 2026-10-20 reported no findings and no issues (every
AC clause maps to an FR and a scenario; tasks and tests come later). Semantic part per
`rules/consistency-check.md`:

| ID | Type | Sides (quoted, with location) | Severity | Owner | Resolution |
|---|---|---|---|---|---|
| CC-1 | PREMISE / CONFLICT | `story.md` Scope: "an invalid `.mandao/models.yml`, which takes the same crash path (CC-2 of MDO-0004)" and AC-2: "standard error carries an error that names the models file … must NOT write anything to standard output" ↔ the code at `ea98793`: `buildProject` reads `models.yml` (`src/engine/sync.ts:82`) inside the `try` at `src/engine/doctor.ts:140-148`, which turns the error into an `error` finding. As run: `doctor --json` exits 1, prints a valid JSON report with an `error` finding naming `.mandao/models.yml`, and leaves stderr **empty** (design P3). MDO-0004 design P5 ("`readModels` via `modelFindings`") was wrong. | critical (AC-2 cannot pass without a behavior change, which is out of scope) | PO | **Resolved** 2026-10-20 (option a): AC-2 rewritten to today's behavior; FR-2, S-2.1 and S-2.2 follow it |

Re-check after clarify (2026-10-20): `mandao run trace MDO-0005` re-run after these edits; AC-2 and
FR-2 no longer disagree with the code (design P3), so no finding remains open.

## Open items

- None open. CC-1 is resolved (see Clarifications).
- The story's `ASSUMPTION` (CI runs `npm test` before `npm run build`) is confirmed at source
  (`.github/workflows/ci.yml`, `ea98793`) and settled by design D1.

## Clarifications
<!-- Filled by /mandao-clarify: date, question, answer, who answered, what changed. -->

### C-1 — CC-1: `models.yml` does not take the crash path (2026-10-20)
- **Question:** AC-2 says an invalid `.mandao/models.yml` crashes the doctor (error on stderr, empty
  stdout, exit 1), but today it is reported as an `error` finding in a valid JSON report on stdout,
  with exit 1 and an empty stderr (design P3). Rewrite AC-2 to prove today's behavior (a), or drop
  AC-2 (b)?
- **Answer:** (a), rewrite AC-2 to prove today's behavior.
- **Answered by:** the maintainer's delegate, acting as PO (conversation, 2026-10-20; no tracker).
- **What changed:** `story.md` Scope, AC-2 and the confirmed assumptions; FR-2 rewritten, S-2.1
  rewritten and S-2.2 added (schema-invalid variant, matching P3 as run); AC → FR matrix and CC-1
  marked resolved; design Summary, P3, D3, D4, the Changes table and Product Impact updated. Making
  `models.yml` crash would be a behavior change and needs its own story.
