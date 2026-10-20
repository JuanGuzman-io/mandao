---
schema_version: 1
spec: MDO-0004-doctor-findings-as-json-for-ci
depth: standard
projects: [mandao]
status: approved
---

# Requirements — Read the doctor's findings from CI as JSON

## Functional requirements

### FR-1 — Doctor report as a JSON document
Serves: AC-1, AC-1/C1
Projects: mandao

A pure function turns the doctor's findings into one report object
`{ schema_version: 1, counts: { error, warn, info, ok }, findings: [{ level, message, fix? }] }`.
`findings` keeps the order and content `runDoctor` returns, so it holds exactly what the text output
shows. `fix` is present only when the finding has one. `counts` always has the four levels, zero
included.

#### S-1.1 — Findings of every level, with and without fix
- **Given** findings `ok` "Node 22.18.0", `info` "no .mandao/sources.yml: …", `warn` "lock was written
  by mandao 0.0.9; installed is 0.1.0" with fix "run `mandao update`", and `error` "unknown harnesses: x"
- **When** the report is built
- **Then** `findings` has the four entries in the same order, each with `level` and `message`, and only
  the `warn` entry has `fix: "run \`mandao update\`"`
- **AND IT MUST** carry `counts: { error: 1, warn: 1, info: 1, ok: 1 }` and `schema_version: 1` (C1)

#### S-1.2 — Levels with no findings still counted
- **Given** only `ok` findings
- **When** the report is built
- **Then** `counts` is `{ error: 0, warn: 0, info: 0, ok: <n> }`

### FR-2 — `mandao doctor --json` prints only the report
Serves: AC-1, AC-1/C2
Projects: mandao

`mandao doctor` accepts `--json`. With it, standard output receives the FR-1 report as one
pretty-printed JSON document (2-space indent, as `skills list --json`) and nothing else.

#### S-2.1 — Single document on stdout, even on a color terminal
- **Given** a workspace with findings at several levels, stdout is a TTY and `NO_COLOR` is unset
- **When** `mandao doctor --json` runs
- **Then** stdout receives exactly one write, and `JSON.parse` of it equals the FR-1 report of the
  same findings
- **BUT it must NOT** contain ANSI escape sequences, the `→` fix arrow, headers or any other line (C1)

#### S-2.2 — Unexpected crash leaves stdout empty
- **Given** the doctor throws an error it does not turn into findings (e.g. an invalid
  `.mandao/mandao.lock` or `.mandao/models.yml`, which stay on this path in this story: CC-2)
- **When** `mandao doctor --json` runs
- **Then** the error goes to stderr and the exit code is 1, as today
- **BUT it must NOT** write anything to stdout (C1)

### FR-3 — Exit code follows errors only
Serves: AC-2, AC-2/C1, AC-3/C1
Projects: mandao

With or without `--json`, the exit code is 1 when at least one finding has level `error`, and 0
otherwise. The rule is shared by both output modes, not duplicated.

#### S-3.1 — At least one error
- **Given** findings that include one `error`
- **When** `mandao doctor --json` runs
- **Then** the exit code is 1

#### S-3.2 — Warnings, info and ok only
- **Given** findings with `warn`, `info` and `ok` but no `error`
- **When** `mandao doctor --json` runs
- **Then** the exit code is 0 (C1)

### FR-4 — Missing or invalid config still yields JSON
Serves: AC-3, AC-3/C1
Projects: mandao

The config failures `runDoctor` already reports as findings come out as a valid report under
`--json`, with exit code 1 (via FR-3).

#### S-4.1 — No `.mandao/config.yml`
- **Given** a directory without `.mandao/config.yml`
- **When** `mandao doctor --json` runs
- **Then** stdout parses as a report with an `error` finding "no .mandao/config.yml in this directory"
  and fix "run `npx mandao init`", `counts.error` ≥ 1
- **AND IT MUST** exit with code 1 (C1)

#### S-4.2 — Invalid `.mandao/config.yml` (schema or YAML syntax)
- **Given** a `.mandao/config.yml` with `workspace: galaxy`, or one that is not valid YAML
- **When** `mandao doctor --json` runs
- **Then** stdout parses as a report with one `error` finding per issue, each message naming the file
  and field path, as the text output does today; these findings carry no `fix` (CC-1)
- **AND IT MUST** exit with code 1 (C1)

### FR-5 — Text output unchanged
Serves: AC-4
Projects: mandao

Without `--json`, `mandao doctor` calls the same `printFindings` with the same findings and sets the
same exit code as before.

#### S-5.1 — Same lines and exit code
- **Given** findings `ok` "Node 22.18.0" and `warn` "x was edited by hand" with fix "move the change …",
  stdout is not a TTY
- **When** `mandao doctor` runs without `--json`
- **Then** stdout receives exactly the lines `  ok    Node 22.18.0`, `  warn  x was edited by hand` and
  `        → move the change …`, and the exit code is 0
- **AND IT MUST** keep exit code 1 when an `error` finding is added (C1)

## Non-functional requirements

### NFR-1 — Machine-readable in every mode
Serves: AC-1/C2
Under `--json`, `JSON.parse(stdout)` succeeds in 100% of the CLI tests that cover findings (S-2.1,
S-3.x, S-4.x), including the run with `process.stdout.isTTY = true` and `NO_COLOR` unset. Measured by
those tests in `npm test`.

### NFR-2 — Stable report contract
Serves: AC-1, AC-1/C1
The report's top-level keys are exactly `schema_version`, `counts`, `findings`; finding keys are only
`level`, `message`, `fix`. Any change to that set or to the meaning of a key bumps `schema_version`.
Measured by a unit test that asserts the exact key sets (0 extra keys allowed).

### NFR-3 — No extra cost
Serves: AC-1
`--json` runs the same checks as the text mode: 0 extra filesystem reads, processes or network calls.
Measured by review of the diff: the JSON path only changes how `runDoctor`'s return value is printed.

## AC → FR matrix

| AC | Clause | FR / scenario | Status |
|---|---|---|---|
| AC-1 | main: one JSON document, every finding with level, message, fix | FR-1 / S-1.1, FR-2 / S-2.1 | covered |
| AC-1 | AND IT MUST include per-level counts (C1) | FR-1 / S-1.1 C1, S-1.2 | covered |
| AC-1 | BUT must NOT print anything else, even on a color terminal (C2) | FR-2 / S-2.1 C1, S-2.2 C1, NFR-1 | covered |
| AC-2 | main: non-zero exit with at least one error | FR-3 / S-3.1 | covered |
| AC-2 | AND IT MUST exit 0 with only warn, info, ok (C1) | FR-3 / S-3.2 C1 | covered |
| AC-3 | main: valid JSON explaining the problem and the fix | FR-4 / S-4.1, S-4.2 | covered (invalid config: file and field path, no `fix`, per CC-1) |
| AC-3 | AND IT MUST exit non-zero (C1) | FR-4 / S-4.1 C1, S-4.2 C1, FR-3 | covered |
| AC-4 | main: same output and exit code without `--json` | FR-5 / S-5.1 | covered |

## Consistency Check

Both findings resolved in `/mandao-clarify` on 2026-10-20 (see `## Clarifications`); re-run after
clarify: no open findings.

| ID | Type | Sides (quoted, with location) | Severity | Owner |
|---|---|---|---|---|
| CC-1 | CONTRADICTION | `story.md` AC-3 THEN: "valid JSON whose findings explain the problem **and how to fix it**" ↔ `story.md` AC-4: "exactly the same output … as before". Today an invalid config produces `error` findings with the field path but **no `fix`** (`src/engine/doctor.ts:128-131`); adding a fix there changes the text output. | normal | PO |
| CC-2 | GAP | `story.md` AC-3 GIVEN covers only `.mandao/config.yml`; an invalid `.mandao/mandao.lock` or `.mandao/models.yml` makes `runDoctor` throw (`src/engine/doctor.ts:138`, `src/engine/files.ts:33-41`), so `--json` prints nothing on stdout and exits 1 (S-2.2), as resolved in OPEN-1. A CI job then sees a parse failure instead of a finding. | normal | PO |

## Open items

- CC-1, CC-2 and the test-level assumption are resolved; see `## Clarifications`.
- `OPEN-2` (from the story, non-critical, owner: PO): stable per-check ids, out of scope.
  `schema_version` lets a later version add them.

## Clarifications

All answers by the maintainer's delegate, acting as PO and dev for the MDO-0004 command test.

| Date | Question | Answer | Who | What changed |
|---|---|---|---|---|
| 2026-10-20 | CC-1: for an invalid config, is a message naming the file and field path enough as "how to fix it" (AC-3)? | Agree with the proposal: yes. Keep the findings as they are and add no `fix`, so AC-4 holds | PO | CC-1 resolved; S-4.2 states that these findings carry no `fix`; AC → FR matrix row AC-3 updated |
| 2026-10-20 | CC-2: should an invalid `.mandao/mandao.lock` or `.mandao/models.yml` also come out as JSON findings? | Agree with the proposal: no, not in this story. It stays the OPEN-1 crash path (stderr, exit 1, empty stdout); a follow-up story can turn those into findings for both outputs | PO | CC-2 resolved; S-2.2 names the lock and `models.yml` cases; story Out of scope gains the item; design Risks gains a row |
| 2026-10-20 | For the critical AC-2 and AC-4, is a CLI-level test through `buildProgram()` in `test/integration/doctor-cli.test.ts`, with `runDoctor` mocked (D3) except for the AC-3 cases, enough end-to-end proof? | Yes | dev | The `ASSUMPTION` is confirmed and removed from Open items; design D3 records the confirmation |
| 2026-10-20 | Join the wrapped AC-1 edge clauses in `story.md` onto one line each, so the trace reads their explicit `(C1)`/`(C2)` ids? | Yes, join the lines | dev | `story.md` AC-1: line breaks only, wording and ids unchanged; trace issues cleared |

Approval: `requirements.md` and `design.md` approved by the maintainer's delegate on 2026-10-20, after
clarify (trace: no findings, no issues; diagram not stale).
