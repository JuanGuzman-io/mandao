---
schema_version: 1
spec: MDO-0004-doctor-findings-as-json-for-ci
---

# Execution — MDO-0004-doctor-findings-as-json-for-ci

## Log

| Date | Task | Attempt | Tier | Harness | Implementer | Reviewer | Verdict | Notes |
|---|---|---|---|---|---|---|---|---|
| 2026-10-20 | T1 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-20 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/doctor-report.test.ts; `npx vitest run test/unit/doctor-report.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-20 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | REPORTED |  |
| 2026-10-20 | T1 | 1 | standard | claude | — | claude-opus-5-5 | PASS |  |
| 2026-10-20 | T1 | 1 | standard | claude | — | claude-opus-5-5 | PASS |  |
| 2026-10-20 | T3 | 1 | fast | claude | — | — | STARTED |  |
| 2026-10-20 | T2 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-20 | T2 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/integration/doctor-cli.test.ts; `npx vitest run test/integration/doctor-cli.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-20 | T3 | 1 | fast | claude | claude-haiku-5-5 | — | REPORTED |  |
| 2026-10-20 | T3 | 1 | fast | claude | — | claude-opus-5-5 | FAIL |  |
| 2026-10-20 | T3 | 2 | fast | claude | claude-haiku-5-5 | — | REPORTED |  |
| 2026-10-20 | T3 | 2 | fast | claude | — | claude-opus-5-5 | PASS |  |
| 2026-10-20 | T2 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/integration/doctor-cli.test.ts; `npx vitest run test/integration/doctor-cli.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-20 | T2 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-20 | T2 | 1 | standard | claude | claude-sonnet-5-5 | — | REPORTED |  |
| 2026-10-20 | T2 | 1 | standard | claude | claude-sonnet-5-5 | — | REPORTED |  |
| 2026-10-20 | T2 | 1 | standard | claude | — | claude-opus-5-5 | PASS |  |

## Advisories

- T1 · A1: the S-1.1 test fixtures use different message strings from the spec's Given (`test/unit/doctor-report.test.ts:7-12`); same behavior, the trace would read one-to-one with the spec's strings.
- T1 · A2: a finding with `fix: ''` would emit `fix: ""` in JSON while `printFindings` hides it (`src/cli/output.ts:76` vs `:58`); no producer emits an empty fix today.
- T1 · A3: `DoctorReport.findings` is typed `Finding[]`, so a new `Finding` key would not be flagged by the compiler; NFR-2 relies on the runtime key test.
- T3 · A1: the config-error format in `docs/schemas.md:139` (`config.yml: projects[0].path`) differs from the real `formatIssues` output (`<root>/.mandao/config.yml: projects.0.path: <zod message>`); YAML syntax errors name only the file.
- T3 · A2: the `docs/schemas.md` example is abridged: real runs emit build, model, harness and tool-version findings between the workspace findings and the lock error.
- T3 · A3: `docs/schemas.md:111-112` does not mention the crash path (CC-2 / S-2.2): exit 1 with nothing on stdout.
- T2 · A1: S-2.2's stderr and exit-1 half is not asserted end to end (it lives in `src/cli/index.ts`, premise P6); a binary-level test with an invalid lock would cover it.
- T2 · A2: `MANDAO_HOME` is set in `beforeEach` of `test/integration/doctor-cli.test.ts` but never restored.
- T2 · A3: the `--json` help text ("print the findings as one JSON document") differs from `design.md` ("print findings as JSON for CI").
