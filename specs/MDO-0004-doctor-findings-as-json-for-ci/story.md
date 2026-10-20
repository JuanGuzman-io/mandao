---
schema_version: 1
tracker: none
type: story
id: MDO-0004
url:
parent:
projects: [mandao]
lane: normal
status: in-progress
sources:
  - { ref: "user request in /mandao-story (tech lead running a Mandao pilot)", kind: conversation, date: 2026-10-20 }
  - { ref: "src/cli/setup.ts:62-69 (doctor command, exit code 1 on error)", kind: code, date: 2026-10-20 }
  - { ref: "src/engine/doctor.ts:23-29 (Finding: level, message, fix)", kind: code, date: 2026-10-20 }
  - { ref: "src/cli/output.ts:50-60 (printFindings, colored text)", kind: code, date: 2026-10-20 }
  - { ref: "src/cli/skills.ts:63-70 (existing --json precedent in skills list)", kind: code, date: 2026-10-20 }
  - { ref: "specs/MDO-0001-list-pinned-skills/story.md (AC-3, JSON precedent)", kind: spec, date: 2026-10-20 }
  - { ref: "docs/constitution/critical-flows.md (init → sync → doctor clean)", kind: constitution, date: 2026-10-20 }
  - { ref: "docs/constitution/ux.md:15-18 (findings with fix, NO_COLOR / non-TTY)", kind: constitution, date: 2026-10-20 }
  - { ref: "approval by the maintainer's delegate for the MDO-0004 command test (answers 1-4 accepted, OPEN-2 deferred)", kind: conversation, date: 2026-10-20 }
---

# Read the doctor's findings from CI as JSON

## Who
A tech lead running a Mandao pilot who wants the workspace health check (`mandao doctor`) to run in
the team's CI pipeline.

## Problem
`mandao doctor` only prints colored, human-oriented lines (`ok`, `info`, `warn`, `error`, with an
optional `→ fix`). A CI pipeline that wants to fail on errors and keep an eye on warnings has to parse
that text, which is brittle: the wording and layout can change between versions.

## Value
The pilot team can gate merges on a healthy Mandao setup and track warnings over time with a few lines
of CI configuration, without writing or maintaining a text parser. It lowers the cost of adopting
Mandao in a team setting.

## Scope
- A `--json` option on `mandao doctor` that prints every finding as machine-readable JSON.
- Each finding carries its level, its message and, when there is one, its fix.
- The same exit-code behavior as today, so CI can fail on errors.

## Out of scope
- Failing the command on warnings (a "strict" mode); CI can decide that from the JSON.
- Stable identifiers per check so a specific warning can be tracked across runs (see OPEN-2).
- JSON output for other commands (`sync`, `update`, `models`).
- Changing the text output of `mandao doctor`.
- Turning an invalid `.mandao/mandao.lock` or `.mandao/models.yml` into findings; they keep the crash
  path agreed in OPEN-1 (clarify, CC-2, 2026-10-20).

## Acceptance criteria

### AC-1 — Findings as JSON
critical: false

- **GIVEN** a Mandao workspace
- **WHEN** I run `mandao doctor --json`
- **THEN** I get a single JSON document with every finding the text output would show, each with its
  level (`error`, `warn`, `info` or `ok`), its message and its fix when it has one
- **AND IT MUST** include a count of findings per level, so CI can read the number of errors and warnings without walking the list (C1)
- **BUT it must NOT** print anything else on standard output: no colors, no headers, no extra lines, even when the terminal supports colors (C2)

### AC-2 — CI fails on errors
critical: true

- **GIVEN** a workspace where the doctor finds at least one error
- **WHEN** I run `mandao doctor --json`
- **THEN** the command exits with a non-zero code, as `mandao doctor` does today
- **AND IT MUST** exit with code 0 when there are only warnings, info or ok findings (C1)

### AC-3 — Broken or missing setup still gives JSON
critical: false

- **GIVEN** a directory without `.mandao/config.yml`, or with an invalid one
- **WHEN** I run `mandao doctor --json`
- **THEN** I still get valid JSON whose findings explain the problem and how to fix it
- **AND IT MUST** exit with a non-zero code (C1)

### AC-4 — Text output unchanged
critical: true

- **GIVEN** any workspace
- **WHEN** I run `mandao doctor` without `--json`
- **THEN** I see exactly the same output and exit code as before this change

## Dependencies
None. Builds on the existing doctor checks (`src/engine/doctor.ts`) and follows the `--json` precedent
of `mandao skills list` (MDO-0001).

## UX references
- `docs/constitution/ux.md`: findings name the fix; respect `NO_COLOR` and non-TTY output.
- `mandao skills list --json` for the option name and pretty-printed style.

## Data involved
Doctor findings only: level, message, fix. Messages can contain local paths, project names and tool
names from the workspace; no credentials or personal data are read by the doctor.
`ASSUMPTION(source: src/engine/doctor.ts, owner: tech lead): messages carry no secrets, so printing
them in CI logs is as safe as the text output already is.`

## Assumptions and open questions

Confirmed at approval (maintainer's delegate, 2026-10-20):

- The JSON is an object with the list of findings plus per-level counts (AC-1 C1) and a schema version,
  rather than the bare array used by `skills list --json`.
- Exit codes stay as today (non-zero only on errors); failing on warnings is left to CI.
- All levels, including `ok` and `info`, are in the JSON.
- OPEN-1 resolved: if the doctor itself crashes unexpectedly, an error on standard error and a non-zero
  exit; standard output stays empty.

Still open:

- `OPEN-2(non-critical, owner: PO)`: a stable identifier per check, to track one specific warning across
  runs. Deferred to a follow-up story if the pilot asks for it.
