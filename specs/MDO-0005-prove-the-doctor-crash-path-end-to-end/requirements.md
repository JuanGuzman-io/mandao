---
schema_version: 1
spec: MDO-0005-prove-the-doctor-crash-path-end-to-end
depth: lite
projects: [mandao]
status: approved
---

# Requirements — Prove that a crashing doctor never sends garbage to CI

What must be true: a test in `npm test` runs the real `mandao doctor --json` process and proves that an
invalid lock crashes cleanly (error on stderr, empty stdout, exit 1) and that an invalid models file is
an `error` finding in one valid JSON report (empty stderr, exit 1).

Every requirement is **ADDED** test coverage. No product behavior is added, modified or removed (the
[story](story.md#out-of-scope) keeps "changing the crash behavior or the error wording" out of scope).

## Functional requirements

### FR-1 — Process-level proof of the invalid-lock crash path
Serves: AC-1, AC-1/C1, AC-1/C2
Projects: mandao

ADDED. A test in `npm test` starts the real CLI entry point (`src/cli/index.ts`) as a separate Node
process, runs `doctor --json` in a throwaway workspace with a valid `.mandao/config.yml` and an invalid
`.mandao/mandao.lock`, and checks the exit code, standard error and standard output of that process.

"An error that names the lock file" means standard error contains the word `error` and the path
suffix `.mandao/mandao.lock`, never the YAML parser's wording (confirmed at approval, see the
[story](story.md#assumptions-and-open-questions)).

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
`.mandao/models.yml`. It proves the doctor's current behavior (see [C-1](#c-1--modelsyml-does-not-take-the-crash-path)):
the doctor does not crash, it reports the file as an `error` finding in the `doctor --json` report
(`docs/schemas.md`, "`mandao doctor --json` — report").

- "One readable JSON report" means the whole captured stdout parses with `JSON.parse` and has
  `schema_version: 1`.
- "An error finding that names the models file" means at least one finding has `level: "error"` and a
  `message` containing the path suffix `.mandao/models.yml`, never the YAML parser's wording.

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
developer machine, as reported by `npx vitest run <file>`. It never runs the doctor's shell probes
(tool versions, npm registry), because the crash happens before them. Measured cost of the prototype:
[design P2 and P6](design.md#premise-ledger).

## AC → FR matrix

| AC | Clause | FR / scenario | Status |
|---|---|---|---|
| AC-1 | main: exit 1, stderr names the lock | FR-1 / S-1.1, S-1.2 | covered |
| AC-1 | C1: nothing on stdout | FR-1 / S-1.1/C1, S-1.2/C1 | covered |
| AC-1 | C2: runs in `npm test` | FR-1 / S-1.1/C2; NFR-1 | covered |
| AC-2 | main: exit 1, one JSON report, error finding | FR-2 / S-2.1, S-2.2 | covered |
| AC-2 | C1: nothing on stderr | FR-2 / S-2.1/C1, S-2.2/C1 | covered |

## Clarifications

### C-1 — `models.yml` does not take the crash path
- **Date:** 2026-10-20
- **Question:** AC-2 assumed that an invalid `.mandao/models.yml` crashes the doctor (error on stderr,
  empty stdout, exit 1), but the doctor reports it as an `error` finding in a valid JSON report on
  stdout, with exit 1 and an empty stderr ([design P3](design.md#p3--an-invalid-modelsyml-is-a-finding-not-a-crash)).
  Should AC-2 prove the current behavior (a), or be dropped (b)?
- **Answer:** (a), AC-2 proves the current behavior.
- **Answered by:** the maintainer's delegate, acting as PO (conversation, 2026-10-20; no tracker).
- **Effect:** the story's Scope and AC-2, FR-2, S-2.1 and S-2.2 describe the finding-based behavior;
  S-2.2 covers the schema-invalid variant, matching P3 as run. Making `models.yml` crash would be a
  behavior change and needs its own story.
- **Correction to MDO-0004:** MDO-0004 CC-2 and MDO-0004 design P5 ("`readModels` via
  `modelFindings`") claimed that an invalid `models.yml` takes the crash path. That claim was wrong;
  the closed MDO-0004 documents are not edited ([design, Product Impact](design.md#product-impact)).

## Consistency Check

Structural part: `mandao run trace MDO-0005` reports no findings and no issues (every AC clause maps to
an FR and a scenario). Semantic part per `rules/consistency-check.md`: one finding, resolved.

| ID | Type | Severity | Owner | Status |
|---|---|---|---|---|
| CC-1 | PREMISE / CONFLICT | critical | PO | resolved (C-1) |

### CC-1 — The story's models-file premise disagreed with the code
- **Side A (story premise, from MDO-0004 CC-2):** an invalid `.mandao/models.yml` takes the same crash
  path as the lock: error on stderr, nothing on stdout.
- **Side B (code at `ea98793`):** `buildProject` reads `models.yml` inside the `try` of `runDoctor`,
  which turns the error into an `error` finding. As run, `doctor --json` exits 1, prints a valid JSON
  report with an `error` finding naming `.mandao/models.yml`, and leaves stderr empty
  ([design P3](design.md#p3--an-invalid-modelsyml-is-a-finding-not-a-crash)).
- **Why critical:** AC-2 could not pass without a behavior change, which is out of scope.
- **Resolution:** [C-1](#c-1--modelsyml-does-not-take-the-crash-path), option a. AC-2 and FR-2 agree
  with the code; no finding remains open.

## Open items

None. CC-1 is resolved by [C-1](#c-1--modelsyml-does-not-take-the-crash-path). The story's
`ASSUMPTION` (CI runs `npm test` before `npm run build`) is confirmed at source and settled by design
([P4](design.md#p4--ci-runs-the-tests-before-the-build),
[D1](design.md#d1--build-the-cli-inside-the-test-with-tsup)).

<details>
<summary>Evidence: Consistency Check runs and code locations</summary>

- `mandao run trace MDO-0005`, 2026-10-20: no findings, no issues. Run again after C-1: AC-2 and FR-2
  no longer disagree with the code (design P3), no finding open.
- CC-1 side B at `ea98793`: `buildProject` reads `models.yml` at `src/engine/sync.ts:82`, inside the
  `try` at `src/engine/doctor.ts:140-148`.
- The ASSUMPTION about CI order is confirmed in `.github/workflows/ci.yml` at `ea98793`.

</details>
