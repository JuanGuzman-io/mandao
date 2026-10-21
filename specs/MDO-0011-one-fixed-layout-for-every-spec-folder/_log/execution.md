---
schema_version: 1
spec: MDO-0011-one-fixed-layout-for-every-spec-folder
---

# Execution — MDO-0011-one-fixed-layout-for-every-spec-folder

## Log

| Date | Task | Attempt | Tier | Harness | Implementer | Reviewer | Verdict | Notes |
|---|---|---|---|---|---|---|---|---|
| 2026-10-21 | T1 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-21 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/layout.test.ts, test/integration/layout.test.ts; `npx vitest run test/unit/layout.test.ts test/integration/layout.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/layout.test.ts, test/integration/layout.test.ts; `npx vitest run test/unit/layout.test.ts test/integration/layout.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | REPORTED | red test changed: test/unit/layout.test.ts |
| 2026-10-21 | T1 | 1 | standard | claude | — | claude-opus-5-5 | FAIL | red test changed: test/unit/layout.test.ts; FAIL: depth rule does not follow design D1 (lite on requirements.md ignored); fixture brokenV2 carries depth: lite |
| 2026-10-21 | T1 | 2 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/layout.test.ts, test/integration/layout.test.ts; `npx vitest run test/unit/layout.test.ts test/integration/layout.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T1 | 2 | standard | claude | claude-sonnet-5-5 | — | REPORTED | red test changed: test/unit/layout.test.ts; NFR-2: node dist/cli.js run layout MDO-0010 -> ok:true, 0.121 total (< 300 ms). Removed-AC tests: run mutation refused (not a characterization task); manual patch/revert of the filter in trace.ts and release.ts each made one test fail. |
| 2026-10-21 | T1 | 2 | standard | claude | — | claude-opus-5-5 | FAIL | red test changed: test/unit/layout.test.ts; FAIL: stray src/spec/trace.ts.orig (stale copy of trace logic) left in the diff by the manual mutation check |
| 2026-10-21 | T1 | 3 | standard | claude | claude-opus-5-5 | — | REPORTED | red test changed: test/unit/layout.test.ts |
| 2026-10-21 | T1 | 3 | standard | claude | — | claude-opus-5-5 | PASS | red test changed: test/unit/layout.test.ts; Advisories: v1 lite oneOf has no test; removed-AC manual mutation evidence not script-recorded; run layout does not catch a bad schema_version as JSON; secrets/SAST NOT_INSTALLED. |
| 2026-10-21 | T2 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-21 | T2 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-implementer-standard: test/integration/lite-spec.test.ts, test/unit/content.test.ts; `npx vitest run test/integration/lite-spec.test.ts test/unit/content.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T2 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-implementer-standard: test/integration/lite-spec.test.ts, test/unit/content.test.ts; `npx vitest run test/integration/lite-spec.test.ts test/unit/content.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T2 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-21 | T2 | 1 | standard | claude | claude-sonnet-5-5 | — | REPORTED |  |
| 2026-10-21 | T2 | 1 | standard | claude | — | claude-opus-5-5 | FAIL | FAIL: new stories still start at schema_version 1: core/templates/shared/spec/story.md unchanged |
| 2026-10-21 | T2 | 2 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-implementer-standard: test/integration/lite-spec.test.ts, test/unit/content.test.ts; `npx vitest run test/integration/lite-spec.test.ts test/unit/content.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T2 | 2 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-implementer-standard: test/integration/lite-spec.test.ts, test/unit/content.test.ts, test/unit/layout.test.ts; `npx vitest run test/integration/lite-spec.test.ts test/unit/content.test.ts test/unit/layout.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T2 | 2 | standard | claude | claude-sonnet-5-5 | — | REPORTED | red test changed: test/unit/content.test.ts |
| 2026-10-21 | T2 | 2 | standard | claude | — | claude-opus-5-5 | PASS | red test changed: test/unit/content.test.ts |
| 2026-10-21 | T2 | 2 | standard | claude | — | — | STARTED |  |
| 2026-10-21 | T2 | 2 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-implementer-standard: test/integration/lite-spec.test.ts, test/unit/content.test.ts, test/unit/layout.test.ts; `npx vitest run test/integration/lite-spec.test.ts test/unit/content.test.ts test/unit/layout.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T2 | 2 | standard | claude | claude-sonnet-5-5 | — | REPORTED |  |
| 2026-10-21 | T2 | 2 | standard | claude | — | claude-opus-5-5 | PASS |  |
