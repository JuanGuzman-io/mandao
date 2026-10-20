---
schema_version: 1
spec: MDO-0005-prove-the-doctor-crash-path-end-to-end
verdict: verified
date: 2026-10-20
---

# Verify — Prove that a crashing doctor never sends garbage to CI

Does it do what was asked? Yes: every acceptance criterion and clause passes in a real process, the
new file runs in `npm test` well inside its 5 s budget, and the change touches only `test/` and the
spec. No product bugs, no blockers, nothing deferred to CI.

## Acceptance criteria → tests

| AC / clause | Critical | Tests | Level | Result |
|---|---|---|---|---|
| AC-1 | no | S-1.1, S-1.2 | e2e (real process) | PASS |
| AC-1/C1 | no | S-1.1, S-1.2 | e2e (real process) | PASS |
| AC-1/C2 | no | config + NFR-1 timing | config + timing | PASS |
| AC-2 | no | S-2.1, S-2.2 | e2e (real process) | PASS |
| AC-2/C1 | no | S-2.1, S-2.2 | e2e (real process) | PASS |

## How each criterion is proven

All tests live in `test/integration/doctor-process.test.ts`.

### AC-1 — Invalid lock: error on stderr, exit 1
S-1.1 (broken YAML lock) and S-1.2 (schema-invalid lock) check `status === 1` and that `stderr`
matches `/\berror\b/` and contains `join('.mandao', 'mandao.lock')`.

### AC-1/C1 — Nothing on stdout
The same S-1.1 and S-1.2 tests check `stdout === ''` exactly, so a lone newline fails (mutation M2 in
the [execution log](_log/execution.md#mutation-evidence-t1)).

### AC-1/C2 — Runs in `npm test`
Proven by configuration, not by an assertion: vitest includes `test/**/*.test.ts`, `npm test` is
`vitest run`, and CI runs `npm test` before `npm run build`. The test builds its own bundle, so that
order does not matter. NFR-1: the file takes 655 ms against the 5 s budget.

### AC-2 — Invalid models file: one JSON report with an error finding, exit 1
S-2.1 (broken YAML `models.yml`) and S-2.2 (schema-invalid `models.yml`) check `status === 1`,
`JSON.parse(stdout)` of the whole output, `schema_version === 1`, and a finding with `level: 'error'`
whose message contains `join('.mandao', 'models.yml')`.

### AC-2/C1 — Nothing on stderr
The same S-2.1 and S-2.2 tests check `stderr === ''` exactly.

## Design decisions in the code

The design decisions in the T1 DoD hold in the code:

- **D1:** tsup `build()` with `config: false`, writing into `mkdtemp` under `node_modules/.cache`.
- **D2:** no `vi.mock` and no spies.
- **D3:** no snapshots, no parser wording and no `invalid configuration:` header.
- **D4:** the cases run with `spawnSync` from `process.execPath`, with `utf8` encoding, a 20 s
  timeout, an isolated `MANDAO_HOME`, and two `test.each` blocks.
- **D5:** `afterAll` removes only the build directory.
- **D6:** the only change to `doctor-cli.test.ts` is a comment line.

## Suites

| Project | Kind | Files | Result |
|---|---|---|---|
| mandao | unit | `doctor-cli.test.ts`, `doctor-process.test.ts` | PASS, 12 tests |
| mandao | e2e (AC-1, AC-2 flows) | `doctor-process.test.ts` | PASS, 4 tests |
| mandao | static | lint, typecheck | PASS |

Commands and outputs: see [Evidence](#evidence).

## TDD evidence (ADR 0022)

- **`missingRed: [T1]`.** Expected and agreed: the tests characterize behavior that already exists
  (the ASSUMPTION in [tasks.md](tasks.md#notes), Leader decision), so they cannot fail against
  unchanged code. Because the spec started under TDD, this is a known exception and not a blocker.
- **Substitute evidence.** The [execution log](_log/execution.md#mutation-evidence-t1) records ten
  local, uncommitted mutations, M1–M10. Each one made its targeted assertion fail and was then
  reverted. Together they cover every assertion in the file:
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

None. CI runs the same file as part of `npm test` on push.

## Blockers

None.

## Notes (non-blocking)

- **Windows paths.** The path assertions use `join('.mandao', …)`, which gives a backslash on Windows.
  Whether the product prints the same separator there is unproven. `ASSUMPTION(source:
  .github/workflows/ci.yml, owner: dev)`: every CI job runs on `ubuntu-latest`, so this does not affect
  CI today.
- **Identity mismatch rows.** Every agent row in the [execution log](_log/execution.md#log) carries an
  "identity mismatch" note. It comes from how the log is recorded, not from the code under test.

## Consistency Check

I checked `story.md`, `requirements.md`, `design.md`, `tasks.md` and this report against each other.

| ID | Type | Finding | Severity | Owner | Status |
|---|---|---|---|---|---|

No findings. Details:

- **AC-1 and AC-2.** Each AC and each clause (AC-1, AC-1/C1, AC-1/C2, AC-2, AC-2/C1) maps to FR-1,
  FR-2 or NFR-1, and the tests above cover it.
- **CC-1 of the specify phase** is resolved
  ([requirements C-1](requirements.md#c-1--modelsyml-does-not-take-the-crash-path)), and the tests
  prove AC-2 as written: models problems show up as a finding, not as a crash.
- **Scope.** No orphan scope: the diff touches only `test/` and the spec documents.
- **Premises.** P4 (CI test-before-build order) and P5/P6 (in-repo tsup bundle) held: the tests pass.
- **Constitution.** No rule conflicts. The constitution impact (exemplar row) belongs to
  `/mandao-close` ([design, Constitution Impact](design.md#constitution-impact)).

## Evidence

<details>
<summary>Plan and trace</summary>

- `mandao run verify-plan`: one unit suite and e2e flows for AC-1 and AC-2 (both `critical: false`),
  all on the same two files. `missingRed: [T1]`, `deferred: []`, `findings: []`, `blockers: []`.
- `mandao run trace MDO-0005`: `findings: []`, `issues: []`.

</details>

<details>
<summary>Suite commands and outputs (as re-run by the orchestrator)</summary>

The Tester ran in a fresh context and the orchestrator re-ran every command; the numbers come from the
re-run.

- **unit:** `node .mandao/bin/mandao.mjs run tests mandao test/integration/doctor-cli.test.ts test/integration/doctor-process.test.ts`
  → `Test Files 2 passed (2)`, `Tests 12 passed (12)`, `Duration 788ms`; JSON `"status": "PASS"`,
  `"exitCode": 0`.
- **e2e (AC-1, AC-2 flows):** `npx vitest run test/integration/doctor-process.test.ts`
  → `Test Files 1 passed (1)`, `Tests 4 passed (4)`, `Duration 655ms` (bundle build included).
- **static:** `npm run lint` → `Checked 157 files in 75ms. No fixes applied.`; `npm run typecheck`
  → `tsc --noEmit` printed no errors.

</details>

<details>
<summary>AC-1/C2 configuration</summary>

- `vitest.config.ts:5`: `include: ['test/**/*.test.ts']`.
- `package.json`: `npm test` = `vitest run`.
- `.github/workflows/ci.yml:23` runs `npm test`; `npm run build` follows at line 24.

</details>

<details>
<summary>Built artifact and scope check</summary>

- **Built artifact:** `mandao run build` was not run. The process test builds its own bundle from
  `src/cli/index.ts` with tsup in `beforeAll` (D1) on every run, so the tested CLI cannot be stale.
  `dist/` is not used.
- **Scope check:** `git diff main..HEAD --stat` listed 8 files: 6 spec documents,
  `test/integration/doctor-cli.test.ts` (+1 comment line) and `test/integration/doctor-process.test.ts`
  (+76). Nothing changed under `src/`, `core/`, `docs/` or `.github/`.

</details>
