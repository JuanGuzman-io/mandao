---
schema_version: 1
spec: MDO-0004-doctor-findings-as-json-for-ci
audience: developers
language: en
---

# Technical notes — Read the doctor's findings from CI as JSON

## What was built
- mandao · `src/cli/output.ts`: pure `doctorReport(findings)` returning
  `{ schema_version: 1, counts: { error, warn, info, ok }, findings: [{ level, message, fix? }] }`.
  Commit d3548d2 (Refs: MDO-0004, Mandao-Task: T1).
- mandao · `src/cli/setup.ts`: `mandao doctor --json` prints that report with one `console.log`
  (2-space indent); text mode still goes through the unchanged `printFindings`. The exit code is
  computed once after printing, for both modes (1 when any finding is `error`). Commit 42d6e4b (T2).
- mandao · docs: `README.md` mentions `--json`; `docs/schemas.md` gets a "`mandao doctor --json` —
  report" section with the shape, the `schema_version` bump rule and the exit rule. Commit abb28cc (T3).
- Tests: `test/unit/doctor-report.test.ts` (shape, counts, exact key sets for NFR-2) and the new
  `test/integration/doctor-cli.test.ts` (stdout purity on a forced TTY, exit codes, real `runDoctor`
  for a missing and an invalid `config.yml`, text mode unchanged).

## Decisions and pivots
D1–D5 as designed (`design.md`): object with counts rather than a bare array; `fix` omitted when absent;
`doctorReport` in `src/cli`, not the engine; `vi.mock` of the doctor for the CLI tests; one shared exit
rule. No pivots. One Reviewer FAIL on T3 (docs), fixed on attempt 2.

Accepted limits (from the story and clarify): an invalid `.mandao/mandao.lock` or `.mandao/models.yml`
still crashes `runDoctor` — stderr, exit 1, empty stdout — instead of becoming a finding (CC-2). No
stable per-check id yet (OPEN-2).

Open follow-ups from `execution.md` and `verify-report.md` (none blocks):
- CC-V1 / T2 · A1: S-2.2's stderr and exit-1 half is not asserted end to end; add a binary-level test
  with an invalid lock.
- CC-V2 / T3 · A1, A3: `docs/schemas.md:139` shows `config.yml: projects[0].path`, but the real output is
  `<root>/.mandao/config.yml: projects.0.path: <zod message>`; the section does not mention the crash path.
- T2 · A2: `MANDAO_HOME` is not restored in `doctor-cli.test.ts`.
- T2 · A3: `--json` help text differs from the design wording.
- T1 · A2: `fix: ''` would serialize as `"fix": ""` while text mode hides it (no producer emits it today).

## Contract changes
New public output: the `mandao doctor --json` report (D1), `schema_version: 1`, documented in
`docs/schemas.md` and guarded by the NFR-2 key-set test. Text output and exit codes unchanged.

## Diagram and drift
Not computed. `design.md` `## Diagram` was never stamped (only the stamp comment), so
`mandao run diagram-drift MDO-0004` fails: "design.md has no diagram with a structured graph". There is
no approved graph to compare against and no `diagrams/implemented.graph.json`. Checked by hand against
the "Changes by project and module" table: every listed change was made, in `src/cli/output.ts`,
`src/cli/setup.ts`, `test/unit`, `test/integration`, `README.md` and `docs/schemas.md`; no other source
module was touched (`git diff --stat main..HEAD`). See Kaizen lesson 3.

## How to test
`npx vitest run test/unit/doctor-report.test.ts test/integration/doctor-cli.test.ts`; by hand, after
`npm run build`: in an empty directory `node dist/cli.js doctor --json; echo $?` → valid JSON with
`counts.error: 1` and exit 1; in a healthy workspace → exit 0; `mandao doctor` without `--json` →
the same exit code.

## Links
Spec `specs/MDO-0004-doctor-findings-as-json-for-ci/`; verify report in the same folder; no tracker story
(local id); Kaizen `docs/kaizen/MDO-0004.md`.
