---
schema_version: 1
spec: MDO-0011-one-fixed-layout-for-every-spec-folder
verdict: verified
date: 2026-10-21
---

# Verify — One fixed layout for every spec folder

Verified. Every clause of AC-1 to AC-6 has a passing test, and both suites and the rebuilt CLI are
green. There are no product bugs or blockers. AC-7 is `removed` (C-5) and is not tested.

## Acceptance criteria → tests

| AC / clause | Critical | Tests | Level | Result |
|---|---|---|---|---|
| AC-1 | no | S-1.1 `lite-spec.test.ts:156` | integration | pass (partial, see below) |
| AC-1/C1 | no | S-1.3, S-1.3/C1 `content.test.ts:241,247` | unit | pass |
| AC-1/C2 | no | S-1.2, S-1.2/C2 `content.test.ts:231,235,254` | unit | pass |
| AC-2 | yes | S-2.1 `layout.test.ts:63` (integration), `layout.test.ts:69` (unit); S-2.2 `layout.test.ts:70` | integration | pass |
| AC-2/C1 | yes | S-2.3 `integration/layout.test.ts:78,87`, `unit/layout.test.ts:29` | integration | pass |
| AC-3 | yes | S-3.1 `log-v2.test.ts:16`, `log-v2-wide.test.ts:115` | integration | pass |
| AC-3/C1 | yes | S-3.2, S-3.2/C1 `log-v2.test.ts:39,48`, `log-v2-wide.test.ts:128` | integration | pass |
| AC-3/C2 | yes | S-3.3, S-3.3/C2 `log-v2.test.ts:98,104`; S-3.5, S-3.5/C1 `state-log.test.ts:96,103,110` | integration | pass |
| AC-3/C3 | yes | S-3.4 `log-v2.test.ts:116`, `log-v2-wide.test.ts:147,158` | integration | pass |
| AC-4 | yes | S-4.1 `close.test.ts:238`; S-4.4 `close.test.ts:272,284` | integration | pass |
| AC-4/C1 | yes | S-4.2, S-4.2/C1 `content.test.ts:284,290,297` | unit | pass |
| AC-4/C2 | yes | S-4.1/C2 `close.test.ts:254`; S-4.3/C2 `content.test.ts:305` | integration, unit | pass |
| AC-5 | no | S-5.1 `close-commit.test.ts:44` | integration | pass |
| AC-5/C1 | no | S-5.2, S-5.2/C1 `close-commit.test.ts:65,72` | integration | pass |
| AC-6 | yes | S-6.1 `close-drift.test.ts:57` | integration | pass |
| AC-6/C1 | yes | S-6.2, S-6.2/C1 `close-drift.test.ts:64,72` | integration | pass |
| AC-7 | — | removed (C-5) | — | not applicable |

The project has no `tests.e2e` command. The critical ACs are covered by integration tests that run the
built CLI against temporary git projects, plus the smoke runs in Evidence.

### AC-1 — partial proof of S-1.1

The test checks that a version 2 lite spec with one task reads its task from `tasks.md`, that
`run tasks` gives its wave, and that `spec.md` has no `## Tasks`. "The tasks step writes it" is a prompt
step, so no test runs an agent that writes the file. The rendered command texts are covered by S-1.2/C2.

### Non-functional requirements

| NFR | Measured | Result |
|---|---|---|
| NFR-1 | 3 tasks × 2 attempts, with 10,000-line gate output: 6 files and at most 1,000 lines in `_log/` (`log-v2-wide.test.ts:115`) | pass |
| NFR-2 | `run layout MDO-0010`: 0.15 s, 0.17 s, 0.17 s (limit 0.3 s) | pass |

## Suites

| Project | Kind | Result |
|---|---|---|
| mandao | unit (impacted files, with typecheck and lint) | pass: 17 files, 211 tests |
| mandao | AC flows (scenario-tagged integration tests) | pass: 10 files, 92 tests |
| mandao | built CLI (`run build`, then smoke) | pass |

## TDD evidence (ADR 0022)

`missingRed` is empty: every task with declared tests has RED evidence. The changed red tests were
reviewed in each task's review. No assertion was weakened during verify, and the Testers changed no
test.

## Security mentions (not blocking)

- **T4, attempt 1:** "Most of the change matches AC-3. The log has the six files, and packs, full gate output, probes, mutations, discrepancies and integrity hashes go to `.mandao/cache/<ID>/`. `.mandao/cache/` is in the managed ignore block. In `gates.md`, only failing gates get output, and a gate that is not installed appears once, in the table. Premises keep claim, command, sha, exit and 20 lines. Full runs become a `## Full runs` section of `execution.md`. Version 1 output is unchanged for gates, reviews, packs, premises, mutations and integrity. The tests are not weakened: `redTests.changed` is empty and the red evidence is recorded. The verdict is FAIL because of one high security finding and gaps in the Definition of Done evidence."
- **T4, attempt 1:** "3. **Cache root and ID:** finding the nearest `.mandao/config.yml` is fine. Taking the ID from the story id is the security/high finding above, and it is acceptable once validated."
- **T4, attempt 2:** "No blocking findings remain. There is no high or critical security finding."

## Product bugs

None.

Observation, not a bug: version 1 execution rows have a date and no time. So in `run status`, an
approval stamped with a time sorts after every row from the same day, even when it came first. On
MDO-0010, the spec approval appears after T5. This still meets S-3.5's "in date order".

## Deferred to CI

None. The `secrets` (gitleaks) and `sast` (semgrep) gates are not installed on this machine, and
`audit` was skipped (T7-1 gate log). CI runs them.

## Blockers

None. Main's launcher (`.mandao/bin/mandao.mjs`) reports `GAP AC-7` because its build cannot yet read
`status: removed`. The worktree build reports no findings.

## Consistency Check

| ID | Type | Finding | Severity | Owner | Status |
|---|---|---|---|---|---|

No findings. Story, requirements, design and this report agree. Every active AC clause maps to an FR
scenario with a passing test. AC-7 is `removed` in both the story and the matrix (C-5). FR-8 serves
AC-1 and AC-2 and is proven by S-8.1 (`unit/layout.test.ts:137,141`). MDO-0011 is itself a version 1
spec (`run layout` gives `ok: true`, version 1), as C-5 expects.

## Evidence

```
$ node dist/cli.js run verify-plan MDO-0011
"missingRed": [], "deferred": [], "findings": [], "blockers": [], "issues": []

$ node dist/cli.js run tests mandao <16 impacted files>      # runner added architecture.test.ts
Test Files  17 passed (17)
Tests  211 passed (211)
Duration  12.36s          {"status":"PASS","exitCode":0}

$ npm run typecheck   -> tsc --noEmit, no errors
$ npm run lint        -> Checked 246 files in 122ms. No fixes applied.

$ node dist/cli.js run build mandao
{"status":"PASS"}  ESM Build success

$ node dist/cli.js run tests mandao <9 scenario files>
Test Files  10 passed (10)
Tests  92 passed (92)

$ node dist/cli.js run layout MDO-0001
{"version":1,"depth":"lite","stage":"draft","missing":[],"unexpected":[],"ok":true}
$ node dist/cli.js run layout MDO-0010      # real 0.15 / 0.17 / 0.17 s
{"version":1,"depth":"lite","stage":"closed","missing":[],"unexpected":[],"ok":true}
$ node dist/cli.js run layout MDO-0011
{"version":1,"depth":"standard","stage":"planned","missing":[],"unexpected":[],"ok":true}
$ node dist/cli.js run diagram-drift MDO-0010
{"applicable":false,"reason":"lite specs have no diagram"}   exit=0
$ node dist/cli.js doctor
ok    134 generated file(s) in sync   (no error lines; environment warnings only)
```

Gate log `_log/gates/T7-1.md`: "Every configured gate passed". format, lint, typecheck, test, build and
metrics are PASS. secrets and sast are NOT_INSTALLED (127), and audit is SKIPPED.
