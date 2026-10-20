---
schema_version: 1
spec: MDO-0005-prove-the-doctor-crash-path-end-to-end
depth: lite
projects: [mandao]
status: approved
---

# Requirements — Prove that a crashing doctor never sends garbage to CI

A test in `npm test` runs the real `mandao doctor --json` process: an invalid lock crashes cleanly
(stderr error, empty stdout, exit 1); an invalid models file is an `error` finding in one JSON report
(empty stderr, exit 1). Test coverage only, all **ADDED**; no product behavior changes.

## Functional requirements

<a id="fr1"></a>
### FR-1 — Process-level proof of the invalid-lock crash path
Serves: AC-1, AC-1/C1, AC-1/C2
Projects: mandao

ADDED. A test starts the real CLI entry point (`src/cli/index.ts`) as a separate Node process, runs
`doctor --json` in a throwaway workspace with a valid `.mandao/config.yml` and an invalid
`.mandao/mandao.lock`, and checks exit code, stderr and stdout. "An error that names the lock file":
stderr contains the word `error` and the path suffix `.mandao/mandao.lock`, never the YAML parser's
wording ([story](story.md#assumptions)).

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

ADDED. The same test for a valid `.mandao/config.yml` and an invalid `.mandao/models.yml`. It proves
current behavior ([C-1](#c1)): no crash, an `error` finding in the `doctor --json` report
(`docs/schemas.md`, "`mandao doctor --json` — report"). "One readable JSON report": the whole stdout
parses with `JSON.parse` and has `schema_version: 1`. "An error finding that names the models file":
some finding has `level: "error"` and a `message` containing `.mandao/models.yml`, never the parser's
wording.

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

The new test file, CLI build included, takes **under 5 s** of wall time on a developer machine, as
reported by `npx vitest run <file>` (prototype cost: [design P2, P6](design.md#p2)). It never runs the
doctor's shell probes (tool versions, npm registry): the crash happens before them.

## AC → FR matrix

| AC | Clause | FR / scenario | Status |
|---|---|---|---|
| AC-1 | main: exit 1, stderr names the lock | FR-1 / S-1.1, S-1.2 | covered |
| AC-1 | C1: nothing on stdout | FR-1 / S-1.1/C1, S-1.2/C1 | covered |
| AC-1 | C2: runs in `npm test` | FR-1 / S-1.1/C2; NFR-1 | covered |
| AC-2 | main: exit 1, one report, error finding | FR-2 / S-2.1, S-2.2 | covered |
| AC-2 | C1: nothing on stderr | FR-2 / S-2.1/C1, S-2.2/C1 | covered |

## Clarifications

<a id="c1"></a>
### C-1 — `models.yml` does not take the crash path (2026-10-20)
- **Question:** AC-2 assumed an invalid `.mandao/models.yml` crashes the doctor (stderr error, empty
  stdout, exit 1), but it is an `error` finding in a valid JSON report on stdout, exit 1, empty stderr
  ([design P3](design.md#p3)). Prove current behavior (a) or drop AC-2 (b)?
- **Answer:** (a). Answered by the maintainer's delegate acting as PO (conversation; no tracker).
- **Effect:** story Scope, AC-2, FR-2, S-2.1 and S-2.2 (the schema-invalid variant, as run in P3)
  describe the finding path. Making `models.yml` crash is a behavior change for its own story.
- **MDO-0004 was wrong:** its CC-2 and design P5 ("`readModels` via `modelFindings`") said
  `models.yml` takes the crash path. Its closed documents stay unedited ([design](design.md#product-impact)).

## Consistency Check

`mandao run trace MDO-0005` (2026-10-20, also re-run after C-1): no findings, no issues. Semantic
check per `rules/consistency-check.md`:

<a id="cc1"></a>
### CC-1 — PREMISE / CONFLICT, critical, owner PO: resolved by [C-1](#c1)
- **Story (from MDO-0004 CC-2):** an invalid `models.yml` takes the lock's crash path.
- **Code at `ea98793`:** `buildProject` reads `models.yml` (`src/engine/sync.ts:82`) inside the `try`
  at `src/engine/doctor.ts:140-148`, which turns the error into an `error` finding; as run, stderr is
  empty ([design P3](design.md#p3)).
- **Critical because** AC-2 could not pass without a behavior change, which is out of scope.

## Open items

None. The story's CI-order `ASSUMPTION` is confirmed in `.github/workflows/ci.yml` (`ea98793`) and
settled by [design D1](design.md#d1).
