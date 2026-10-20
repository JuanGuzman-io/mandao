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

## Advisories

- T1 · A1: the S-1.1 test fixtures use different message strings from the spec's Given (`test/unit/doctor-report.test.ts:7-12`); same behavior, the trace would read one-to-one with the spec's strings.
- T1 · A2: a finding with `fix: ''` would emit `fix: ""` in JSON while `printFindings` hides it (`src/cli/output.ts:76` vs `:58`); no producer emits an empty fix today.
- T1 · A3: `DoctorReport.findings` is typed `Finding[]`, so a new `Finding` key would not be flagged by the compiler; NFR-2 relies on the runtime key test.
