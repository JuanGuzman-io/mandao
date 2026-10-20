---
schema_version: 1
spec: MDO-0004-doctor-findings-as-json-for-ci
verdict: verified        # pending | verified | blocked
date: 2026-10-20
---

# Verify — Read the doctor's findings from CI as JSON

<!-- Written by /mandao-verify from `mandao run verify-plan` and the runs it makes. Evidence is quoted as
run: command, exit code, counts. Nothing here is claimed without output. -->

`verify-plan`: `missingRed: []`, `deferred: []`, `blockers: []`, `issues: []`; one trace finding
(`UNTESTED T3 — T3 declares no tests`: a docs-only task, checked by hand below).

## Suites

| Project | Kind | Command (as run) | Result | Evidence |
|---|---|---|---|---|
| mandao | build | `node .mandao/bin/mandao.mjs run build mandao` | PASS | `"status": "PASS"`, `exitCode: 0`; `ESM dist/cli.js 296.22 KB`, `Build success` |
| mandao | unit | `node .mandao/bin/mandao.mjs run tests mandao test/unit/doctor-report.test.ts src/cli/output.ts` | PASS | exit 0; `Test Files 8 passed (8)`, `Tests 50 passed (50)` |
| mandao | lint | `npm run lint` | PASS | `Checked 155 files in 84ms. No fixes applied.` |
| mandao | typecheck | `npm run typecheck` | PASS | `tsc --noEmit`, no errors |
| mandao | e2e (CLI integration, D3) | `node .mandao/bin/mandao.mjs run tests mandao test/integration/doctor-cli.test.ts test/integration/cli.test.ts test/integration/engine.test.ts` | PASS | exit 0; `Test Files 3 passed (3)`, `Tests 31 passed (31)` |
| mandao | built binary smoke | `node dist/cli.js doctor --json` in temp dirs and in the worktree | PASS | see table below |

Built binary smoke (`dist/cli.js`, rebuilt above):

| Case | Exit | Output |
|---|---|---|
| `doctor --json`, empty dir | 1 | valid JSON, `schema_version` 1, counts `{error:1,warn:0,info:0,ok:1}`, fix `run \`npx mandao init\``, stderr empty |
| `doctor --json`, invalid YAML `config.yml` | 1 | valid JSON, 1 `error` naming `…/config.yml` with line, no `fix` |
| `doctor --json`, `workspace: galaxy` | 1 | valid JSON, 1 `error` `…/config.yml: workspace: Invalid option …`, no `fix` |
| `doctor --json`, worktree | 0 | valid JSON, counts `{error:0,warn:3,info:11,ok:8}` |
| `doctor` (text), worktree | 0 | same exit code as `--json` |
| `FORCE_COLOR=1 doctor --json`, worktree | 0 | 0 ESC bytes |

## Acceptance criteria → tests

| AC / clause | Critical | Tests | Level | Result |
|---|---|---|---|---|
| AC-1 | no | main (every finding with level, message, fix): `doctor-report.test.ts` S-1.1; `doctor-cli.test.ts` S-2.1; binary smoke | unit + e2e | PASS |
| AC-1/C1 (per-level counts) | no | `doctor-report.test.ts` S-1.1 (C1), S-1.2, NFR-2 key-set test | unit | PASS |
| AC-1/C2 (nothing else on stdout, even on a color TTY) | no | `doctor-cli.test.ts` S-2.1 (isTTY true, NO_COLOR unset: one `console.log`, no ANSI, no `→`), S-2.2 (throw → no stdout write); `FORCE_COLOR=1` smoke | e2e | PASS |
| AC-2 | **yes** | main (non-zero exit on error): `doctor-cli.test.ts` S-3.1; S-4.1, S-4.2 (real `runDoctor`); binary smoke exit 1 | e2e | PASS |
| AC-2/C1 (exit 0 with warn/info/ok only) | **yes** | `doctor-cli.test.ts` S-3.2; binary smoke in worktree exit 0 | e2e | PASS |
| AC-3 | no | main (valid JSON explaining problem and fix): `doctor-cli.test.ts` S-4.1, S-4.2 (real `runDoctor`); binary smoke ×3 | e2e | PASS |
| AC-3/C1 (non-zero exit) | no | `doctor-cli.test.ts` S-4.1, S-4.2; binary smoke exit 1 | e2e | PASS |
| AC-4 | **yes** | main (text output and exit code unchanged): `doctor-cli.test.ts` S-5.1 and its C1 (error → exit 1); `printFindings` untouched (`git diff main -- src/cli/output.ts` is additions only) | e2e | PASS |

Scenario clauses: S-1.1, S-1.1/C1, S-1.2, S-2.1, S-2.1/C1, S-2.2/C1, S-3.1, S-3.2, S-3.2/C1, S-4.1,
S-4.1/C1, S-4.2, S-4.2/C1, S-5.1, S-5.1/C1 are covered as above. NFR-1: `JSON.parse` succeeds in every
`--json` test and smoke. NFR-2: exact key-set test. NFR-3: diff review (Reviewer PASS on T2, unit
Tester): the JSON path only changes how `runDoctor`'s result is printed.

**Partial:** S-2.2 main ("the error goes to stderr and the exit code is 1"): the test proves the
rejection and the empty stdout (C1); the stderr text and exit 1 live in pre-existing `src/cli/index.ts`
(premise P6) and are not asserted by a test or by a binary smoke in this run. The declared test name
in `tasks.md` T2 claims more than the test asserts. Not blocking: the behavior is unchanged code and
the clause the story requires (AC-1/C2) is proven. Follow-up: a binary-level test with an invalid
`.mandao/mandao.lock` (execution.md advisory T2 · A1).

T3 (docs, no declared tests): `README.md:59` mentions `mandao doctor --json`; `docs/schemas.md:108-140`
matches the real `doctorReport` output (D1 shape, `fix` omitted when absent, four counts, bump rule,
exit rule, no-`fix` note for config errors).

## TDD evidence (ADR 0022)

- `missingRed`: none.
- T1: RED recorded (`npx vitest run test/unit/doctor-report.test.ts` failed, exit 1); red file hash in
  `progress.yml`.
- T2: RED recorded (`npx vitest run test/integration/doctor-cli.test.ts` failed, exit 1); red file hash
  in `progress.yml`.
- Changed red tests: none reported; no test edited during verify.

## Product bugs

None. Neither Tester found a `PRODUCT_BUG` or a test defect, and no files were changed during verify.

Advisories carried over (non-blocking, from `execution.md`): S-1.1 fixtures use different strings
from the spec; `fix: ''` would serialize; `docs/schemas.md` config-error example path format and
missing crash-path note (T3 · A1, A3); `MANDAO_HOME` not restored in `doctor-cli.test.ts` (T2 · A2);
`--json` help text wording differs from design (T2 · A3).

## Deferred to CI

None (`deferred: []`). Not covered locally: Windows and a real CI runner.

## Blockers

None.

## Consistency Check

| ID | Type | Sides (quoted, with location) | Severity | Owner |
|---|---|---|---|---|
| CC-V1 | GAP | `tasks.md` T2 test "S-2.2: … the error reaches stderr and the exit code is 1" ↔ `test/integration/doctor-cli.test.ts` S-2.2 asserts only the rejection and an empty stdout | normal | dev |
| CC-V2 | CONTRACT | `docs/schemas.md:139` config-error example `config.yml: projects[0].path` ↔ real output `<root>/.mandao/config.yml: projects.0.path: <zod message>` (smoke: `…/config.yml: workspace: Invalid option …`) | normal | dev |

Neither finding contradicts an AC: story, requirements and design agree with each other and with the
behavior observed. Both are candidates for `/mandao-quick` or the Kaizen at `/mandao-close`.
