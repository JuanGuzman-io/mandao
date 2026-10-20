---
schema_version: 1
spec: MDO-0005-prove-the-doctor-crash-path-end-to-end
verdict: verified
date: 2026-10-20
---

# Verify — Prove that a crashing doctor never sends garbage to CI

Every AC and clause passes in a real process; the new file runs in `npm test` in 655 ms (budget 5 s);
the diff touches only `test/` and the spec. No product bugs, no blockers, nothing deferred to CI.

## Acceptance criteria → tests

| AC / clause | Critical | Tests | Level | Result |
|---|---|---|---|---|
| AC-1 | no | S-1.1, S-1.2 | e2e (real process) | PASS |
| AC-1/C1 | no | S-1.1, S-1.2 | e2e (real process) | PASS |
| AC-1/C2 | no | config + NFR-1 timing | config + timing | PASS |
| AC-2 | no | S-2.1, S-2.2 | e2e (real process) | PASS |
| AC-2/C1 | no | S-2.1, S-2.2 | e2e (real process) | PASS |

All in `test/integration/doctor-process.test.ts`:
- **AC-1:** S-1.1 (broken YAML lock) and S-1.2 (schema-invalid lock): `status === 1`, `stderr` matches
  `/\berror\b/` and contains `join('.mandao', 'mandao.lock')`.
- **AC-1/C1:** same tests, `stdout === ''` exactly, so a lone newline fails (mutation M2).
- **AC-1/C2:** by configuration, not assertion: vitest includes `test/**/*.test.ts`, `npm test` is
  `vitest run`, CI runs `npm test` before `npm run build`; the test builds its own bundle, so the order
  does not matter.
- **AC-2:** S-2.1 (broken YAML `models.yml`) and S-2.2 (schema-invalid): `status === 1`, `JSON.parse`
  of the whole stdout, `schema_version === 1`, a finding with `level: 'error'` whose message contains
  `join('.mandao', 'models.yml')`.
- **AC-2/C1:** same tests, `stderr === ''` exactly.

The T1 DoD's design decisions hold in the code: D1 tsup `build()` with `config: false` into `mkdtemp`
under `node_modules/.cache`; D2 no `vi.mock`, no spies; D3 no snapshots, parser wording or
`invalid configuration:` header; D4 `spawnSync` of `process.execPath`, `utf8`, 20 s timeout, isolated
`MANDAO_HOME`, two `test.each`; D5 `afterAll` removes only the build directory; D6 one comment line in
`doctor-cli.test.ts`.

## Suites

| Project | Kind | Result |
|---|---|---|
| mandao | unit (`doctor-cli`, `doctor-process`) | PASS, 12 tests |
| mandao | e2e (AC-1, AC-2 flows) | PASS, 4 tests |
| mandao | static (lint, typecheck) | PASS |

## TDD evidence (ADR 0022)

- **`missingRed: [T1]`:** expected and agreed. The tests characterize existing behavior (tasks.md
  ASSUMPTION, Leader decision) and cannot fail against unchanged code; since the spec started under
  TDD, this is a known exception, not a blocker.
- **Substitute:** the [execution log](_log/execution.md#mutation-evidence-t1) records ten local,
  uncommitted mutations, M1–M10, each failing its targeted assertion and then reverted. They cover
  every assertion: exit codes, empty stdout and stderr, the `error` label, both file paths, JSON
  parsing of the whole stdout, `schema_version`, and that the fixtures drive each path.
- **Not re-run:** verify relied on the recorded evidence, which the Reviewer accepted (PASS, attempt 2).
- **Changed red tests:** none.

## Product bugs

None. Test defects fixed: none.

## Deferred to CI

None. CI runs the file in `npm test` on push.

## Blockers

None.

## Notes (non-blocking)

- **Windows paths:** `join('.mandao', …)` gives a backslash on Windows; whether the product prints the
  same separator there is unproven. `ASSUMPTION(source: .github/workflows/ci.yml, owner: dev)`: every
  CI job runs on `ubuntu-latest`, so CI is unaffected today.
- **Identity mismatch rows:** every agent row in the execution log carries this note; it comes from
  how the log is recorded, not from the code under test.

## Consistency Check

`story.md`, `requirements.md`, `design.md`, `tasks.md` and this report checked against each other.

| ID | Type | Finding | Severity | Owner | Status |
|---|---|---|---|---|---|

No findings:
- Each AC and clause maps to FR-1, FR-2 or NFR-1 and is covered by the tests above.
- CC-1 is resolved ([C-1](requirements.md#c1)); the tests prove AC-2: models problems are a finding,
  not a crash.
- No orphan scope: the diff touches only `test/` and the spec documents.
- Premises P4 (CI test-before-build) and P5/P6 (in-repo tsup bundle) held: the tests pass.
- No constitution conflicts; the exemplar row belongs to `/mandao-close`.

<details>
<summary>Evidence (as re-run by the orchestrator after a fresh-context Tester)</summary>

- `mandao run verify-plan`: one unit suite and e2e flows for AC-1 and AC-2 (both `critical: false`) on
  the same two files; `missingRed: [T1]`, `deferred: []`, `findings: []`, `blockers: []`.
- `mandao run trace MDO-0005`: `findings: []`, `issues: []`.
- unit: `node .mandao/bin/mandao.mjs run tests mandao test/integration/doctor-cli.test.ts test/integration/doctor-process.test.ts`
  → `Test Files 2 passed (2)`, `Tests 12 passed (12)`, `Duration 788ms`; JSON `"status": "PASS"`,
  `"exitCode": 0`.
- e2e: `npx vitest run test/integration/doctor-process.test.ts` → `Test Files 1 passed (1)`,
  `Tests 4 passed (4)`, `Duration 655ms` (bundle build included).
- static: `npm run lint` → `Checked 157 files in 75ms. No fixes applied.`; `npm run typecheck`
  (`tsc --noEmit`) printed no errors.
- AC-1/C2: `vitest.config.ts:5` `include: ['test/**/*.test.ts']`; `.github/workflows/ci.yml:23` runs
  `npm test`, `npm run build` at line 24.
- Built artifact: `mandao run build` not run; the test bundles `src/cli/index.ts` in `beforeAll` (D1)
  on every run, so the tested CLI cannot be stale; `dist/` is unused.
- Scope: `git diff main..HEAD --stat` listed 8 files: 6 spec documents, `doctor-cli.test.ts` (+1
  comment line), `doctor-process.test.ts` (+76); nothing under `src/`, `core/`, `docs/`, `.github/`.

</details>
