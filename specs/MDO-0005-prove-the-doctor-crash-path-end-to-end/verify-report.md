---
schema_version: 1
spec: MDO-0005-prove-the-doctor-crash-path-end-to-end
verdict: verified
date: 2026-10-20
---

# Verify — Prove that a crashing doctor never sends garbage to CI

<!-- Written by /mandao-verify from `mandao run verify-plan` and the runs it makes. Evidence is quoted as
run: command, exit code, counts. Nothing here is claimed without output. -->

`verify-plan` output: one unit suite and e2e flows for AC-1 and AC-2 (both `critical: false`), all
on the same two files. `missingRed: [T1]`, `deferred: []`, `findings: []` and `blockers: []`.
`mandao run trace MDO-0005` reported `findings: []` and `issues: []`.

## Suites

The Tester ran in a fresh context and the orchestrator re-ran every command. The numbers below come
from the re-run.

| Project | Kind | Command (as run) | Result | Evidence |
|---|---|---|---|---|
| mandao | unit | `node .mandao/bin/mandao.mjs run tests mandao test/integration/doctor-cli.test.ts test/integration/doctor-process.test.ts` | PASS | `Test Files 2 passed (2)`, `Tests 12 passed (12)`, `Duration 788ms`; JSON `"status": "PASS"`, `"exitCode": 0` |
| mandao | e2e (AC-1, AC-2 flows) | `npx vitest run test/integration/doctor-process.test.ts` | PASS | `Test Files 1 passed (1)`, `Tests 4 passed (4)`, `Duration 655ms` (bundle build included) |
| mandao | static | `npm run lint`; `npm run typecheck` | PASS | `Checked 157 files in 75ms. No fixes applied.`; `tsc --noEmit` printed no errors |

**Built artifact:** I did not run `mandao run build`. The process test builds its own bundle from
`src/cli/index.ts` with tsup in `beforeAll` (D1) on every run, so the tested CLI cannot be stale.
`dist/` is not used.

**Scope check:** `git diff main..HEAD --stat` lists 8 files: 6 spec documents,
`test/integration/doctor-cli.test.ts` (+1 comment line) and `test/integration/doctor-process.test.ts`
(+76). Nothing changed under `src/`, `core/`, `docs/` or `.github/`.

## Acceptance criteria → tests

<!-- First column: the bare id, `AC-n` or `AC-n/Cn`, nothing else — release-status reads it. Describe
the scope in the Tests column. -->

| AC / clause | Critical | Tests | Level | Result |
|---|---|---|---|---|
| AC-1 | no | `doctor-process.test.ts` S-1.1 (broken YAML lock) and S-1.2 (schema-invalid lock): `status === 1`, `stderr` matches `/\berror\b/` and contains `join('.mandao', 'mandao.lock')` | e2e (real process) | PASS |
| AC-1/C1 | no | Same S-1.1 and S-1.2 tests: `stdout === ''` exactly, so a lone newline fails (mutation M2) | e2e (real process) | PASS |
| AC-1/C2 | no | Proven by configuration, not by an assertion. `vitest.config.ts:5` has `include: ['test/**/*.test.ts']`, `npm test` = `vitest run`, and `.github/workflows/ci.yml:23` runs `npm test` before `npm run build` (line 24). The test builds its own bundle, so the order does not matter. NFR-1: 655 ms against the 5 s budget | config + timing | PASS |
| AC-2 | no | `doctor-process.test.ts` S-2.1 (broken YAML models.yml) and S-2.2 (schema-invalid models.yml): `status === 1`, `JSON.parse(stdout)` of the whole output, `schema_version === 1`, a finding with `level: 'error'` and a message containing `join('.mandao', 'models.yml')` | e2e (real process) | PASS |
| AC-2/C1 | no | Same S-2.1 and S-2.2 tests: `stderr === ''` exactly | e2e (real process) | PASS |

The design decisions in the T1 DoD hold in the code:

- **D1:** tsup `build()` with `config: false`, writing into `mkdtemp` under `node_modules/.cache`.
- **D2:** no `vi.mock` and no spies.
- **D3:** no snapshots, no parser wording and no `invalid configuration:` header.
- **D4:** the cases run with `spawnSync` from `process.execPath`, with `utf8` encoding, a 20 s timeout, an isolated `MANDAO_HOME`, and two `test.each` blocks.
- **D5:** `afterAll` removes only the build directory.
- **D6:** the only change to `doctor-cli.test.ts` is a comment line.

## TDD evidence (ADR 0022)

- **`missingRed: [T1]`.** This was expected and agreed: the tests characterize behavior that already
  exists (tasks.md ASSUMPTION, Leader decision), so they cannot fail against unchanged code. Because
  the spec started under TDD, this is reported here as a known exception and is not a blocker.
- **Substitute evidence.** `execution.md` § Mutation evidence records ten local, uncommitted
  mutations, M1–M10. Each one made its targeted assertion fail and was then reverted. Together they
  cover every assertion in the file:
  - exit codes
  - empty stdout and empty stderr
  - the `error` label
  - both file paths
  - JSON parsing of the whole stdout
  - `schema_version`
  - that the fixtures really drive each path
- **Not re-run.** Verify did not re-run the mutations; it relied on the recorded evidence, which the
  Reviewer accepted with a PASS on attempt 2.
- **Changed red tests:** none.

## Product bugs

None.

Test defects fixed: none.

## Deferred to CI

None. CI runs the same file as part of `npm test` on push (`ci.yml:23`).

## Blockers

None.

## Notes (non-blocking)

- **Windows paths.** The path assertions use `join('.mandao', …)`, which gives a backslash on Windows.
  Whether the product prints the same separator there is unproven. `ASSUMPTION(source:
  .github/workflows/ci.yml, owner: dev)`: every CI job runs on `ubuntu-latest`, so this does not affect
  CI today.
- **Identity mismatch rows.** Every agent row in `execution.md` carries an "identity mismatch" note.
  This comes from how the log is recorded, not from the code under test.

## Consistency Check

I checked `story.md`, `requirements.md`, `design.md`, `tasks.md` and this report against each other.

| ID | Type | Finding | Severity | Owner | Status |
|---|---|---|---|---|---|

No findings. Details:

- **AC-1 and AC-2.** Each AC and each clause (AC-1, AC-1/C1, AC-1/C2, AC-2, AC-2/C1) maps to FR-1,
  FR-2 or NFR-1, and the tests above cover it.
- **CC-1 of the specify phase** is resolved (option a), and the tests prove the rewritten AC-2: models
  problems show up as a finding, not as a crash.
- **Scope.** No orphan scope was found: the diff touches only `test/` and the spec documents.
- **Premises.** P4 (CI test-before-build order) and P5/P6 (in-repo tsup bundle) held: the tests pass.
- **Constitution.** No rule conflicts. The constitution impact (exemplar row) is due at
  `/mandao-close`.
