---
schema_version: 1
spec: MDO-0004-doctor-findings-as-json-for-ci
depth: standard
projects: [mandao]
status: approved
---

# Design — Read the doctor's findings from CI as JSON

## Summary
`runDoctor` is unchanged. A pure `doctorReport(findings)` in `src/cli/output.ts`, next to
`printFindings`, builds `{ schema_version: 1, counts, findings }`. The `doctor` command in
`src/cli/setup.ts` gets `--json`: it prints `JSON.stringify(doctorReport(findings), null, 2)` with a
single `console.log` instead of calling `printFindings`. The exit-code rule (`error` → 1) stays one
line shared by both modes. Crashes keep the existing path in `src/cli/index.ts` (stderr, exit 1), and
stdout stays empty because nothing is printed before `runDoctor` returns.

## Premise Ledger

Evidence is read at source on `main` at `ec386e1`. Commands in throwaway directories needed approval
prompts during specify, so none of these were run; the existing tests named below run them in `npm test`.

| # | Claim | Evidence (as run, SHA) or UNVERIFIED | If false | Impact |
|---|---|---|---|---|
| P1 | `runDoctor(root)` returns `Finding[]` (`level`, `message`, `fix?`) and prints nothing itself | `src/engine/doctor.ts:23-29,105`; grep for `console.`/`process.stdout` in `src/engine/doctor*.ts`, `tools.ts`: no hits (`ec386e1`) | `--json` stdout gets extra text: AC-1/C2 breaks | High |
| P2 | Shell probes do not write to the parent's stdout | `src/engine/tools.ts:13` `stdio: ['ignore', 'pipe', 'ignore']` (`ec386e1`) | probe output leaks into the JSON | High |
| P3 | Missing config → one `error` finding with fix `run \`npx mandao init\``, then return | `src/engine/doctor.ts:116-119` (`ec386e1`) | AC-3 needs new code in the engine | Low |
| P4 | Invalid config (schema **or** YAML syntax) → `error` findings, no throw | `src/engine/files.ts:33-41` wraps parse errors in `ConfigError`; `src/engine/doctor.ts:128-131` turns it into findings; test `invalid config is an error with the field path` in `test/integration/engine.test.ts` (`ec386e1`) | AC-3 falls into the crash path | High |
| P5 | Invalid lock or `models.yml` throws out of `runDoctor` (not findings) | `src/engine/doctor.ts:138` `readLock` outside `try`; `readModels` via `modelFindings` (`ec386e1`) | CC-2 does not exist | Low |
| P6 | Uncaught errors print to stderr and set exit code 1 | `src/cli/index.ts:6-16` (`ec386e1`) | OPEN-1 resolution needs new code | Low |
| P7 | Text mode colors depend on `process.stdout.isTTY` and `NO_COLOR`; `LEVEL` labels are colored when `output.ts` loads | `src/cli/output.ts:4,48-53` (`ec386e1`) | none for JSON (it does not use `c`); S-5.1 runs non-TTY | Low |
| P8 | CLI tests drive commands through `buildProgram(() => root)` with `console.log` spied | `test/integration/cli.test.ts:10-27` (`ec386e1`) | tests need another harness | Low |
| P9 | No test in the repo uses `vi.mock` for a module yet | grep `vi.mock(` in `test/`: no hits (`ec386e1`) | none: it is a new but standard vitest pattern (D3) | Low |

## Diagram
<!-- Written by `mandao run diagram --stamp`. -->

## Decisions

| # | Decision | Alternatives | Why |
|---|---|---|---|
| D1 | Report shape `{ schema_version: 1, counts: { error, warn, info, ok }, findings: [{ level, message, fix? }] }`; `fix` key omitted when absent; `counts` always has all four levels | (a) bare array like `skills list --json`; (b) `fix: null` | The story confirmed an object with counts and a schema version. Omitting `fix` mirrors the `Finding` type and `JSON.stringify` already drops `undefined`. Fixed count keys let CI read `.counts.error` without a default |
| D2 | `doctorReport` lives in `src/cli/output.ts`, pure, typed by `Finding` | (a) in `src/engine/doctor.ts`; (b) a zod schema in `src/schemas/` | It is presentation of findings, like `printFindings` and `pinnedSkillsJson`. The engine stays output-agnostic. A zod schema is for input we parse; this is output we write, guarded by the NFR-2 key test |
| D3 | CLI tests for exit codes and stdout use `vi.mock('../../src/engine/doctor.js')` with fixed findings, in a new `test/integration/doctor-cli.test.ts`; AC-3 cases run the real `runDoctor` (they return before any shell probe) | (a) add a `probe` to `buildProgram`/`CliContext`; (b) run the real doctor on a synced workspace | (a) widens the CLI context for one test. (b) depends on installed tools and the npm registry through `runnerFindings`, so it is slow and flaky. The mock is file-scoped and does not leak into other suites. Confirmed by the dev in clarify (2026-10-20) as the end-to-end proof for the critical AC-2 and AC-4 |
| D4 | One `console.log` call for the whole document, 2-space indent | streaming one finding per line (NDJSON) | Matches `skills list --json` and the story ("a single JSON document"). Doctor output is small |
| D5 | Exit code computed once after printing, for both modes | separate rule per mode | AC-2 and AC-4 require the same rule. One line keeps them from drifting apart |

## Changes by project and module

| Project | Module | Change | Exemplar file |
|---|---|---|---|
| mandao | `src/cli` (`output.ts`) | `doctorReport(findings)`: pure, returns the D1 shape | `src/cli/skills.ts` (`pinnedSkillsJson`) |
| mandao | `src/cli` (`setup.ts`) | `doctor` gets `.option('--json', 'print findings as JSON for CI')`; the action branches on `opts.json` between `console.log(JSON.stringify(doctorReport(f), null, 2))` and `printFindings(f)`; exit-code line unchanged | `src/cli/skills.ts:63-70` (`skillsList` `--json` branch) |
| mandao | `test/unit` | `doctorReport`: S-1.1, S-1.2, NFR-2 key sets | `test/unit/models.test.ts` |
| mandao | `test/integration` | new `doctor-cli.test.ts`: S-2.1 (TTY forced, `NO_COLOR` unset), S-2.2, S-3.1, S-3.2, S-4.1, S-4.2, S-5.1 | `test/integration/cli.test.ts` |
| mandao | docs | `README.md` command table: mention `--json`; `docs/schemas.md`: a "`mandao doctor --json` — report" section with the D1 shape and the `schema_version` rule | `docs/schemas.md` (`.mandao/mandao.lock` section) |

## Contract
Single project, so no `contract/` folder. The report shape in D1 is the public contract for CI and is
documented in `docs/schemas.md`. NFR-2 guards it.

## Risks and risk tags

| Change | Tags | Risk | Mitigation |
|---|---|---|---|
| `--json` output | `public-api` | CI scripts depend on the shape; a later key rename breaks them | `schema_version`, NFR-2 key-set test, `docs/schemas.md` |
| `doctor` action | — | Text mode regresses (AC-4, critical) | S-5.1 asserts exact lines and exit codes; `printFindings` untouched |
| Invalid lock or `models.yml` | — | CI sees no JSON, only stderr and exit 1 (CC-2, accepted by the PO) | Exit code still fails the job; turning these into findings is a follow-up story |
| Messages in CI logs | — | Paths and project names are published in CI logs | Same content as the text output already shows; story `ASSUMPTION` (no secrets) stands |

## Constitution Impact
- `docs/constitution/critical-flows.md`: the row "`init` → `sync` → `doctor` clean" can name
  `test/integration/doctor-cli.test.ts` as CLI-level coverage of the doctor's exit code.
- `docs/constitution/standards.md` § Logging: add "commands with `--json` print exactly one JSON document
  on stdout; errors go to stderr".

## Product Impact
Capability map in `product.md`: "doctor findings as JSON for CI (`mandao doctor --json`)".

## Module Docs Impact
None. `src/cli` has no `AGENTS.md`.
