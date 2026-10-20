---
schema_version: 1
spec: MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r
---

# Execution — MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r

## Log

| Date | Task | Attempt | Tier | Harness | Implementer | Reviewer | Verdict | Notes |
|---|---|---|---|---|---|---|---|---|
| 2026-10-20 | T1 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-20 | T2 | 1 | strong | claude | — | — | STARTED |  |
| 2026-10-20 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/doctor-cache.test.ts; `npx vitest run test/unit/doctor-cache.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-20 | T2 | 1 | strong | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/session-turns.test.ts; `npx vitest run test/unit/session-turns.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-20 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | REPORTED |  |
| 2026-10-20 | T1 | 1 | standard | claude | — | — | FAIL | FAIL: gates: runDoctor exceeds complexity 29 and 82 lines; doctor-cache.test.ts uses mkdtemp/tmpdir outside the allowed helper; import order |
| 2026-10-20 | T2 | 1 | strong | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/session-turns.test.ts; `npx vitest run test/unit/session-turns.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-20 | T1 | 2 | standard | claude | claude-sonnet-5-5 | — | REPORTED | red test changed: test/unit/doctor-cache.test.ts |
| 2026-10-20 | T1 | 1 | standard | claude | — | claude-opus-5-5 | FAIL | red test changed: test/unit/doctor-cache.test.ts; FAIL: B1: agent experimental.cacheTtl resolved after ENABLE_PROMPT_CACHING_1H, against D1 order; B2: invalid agent cacheTtl reported as in effect (AC-1/C2) |
| 2026-10-20 | T2 | 1 | strong | claude | claude-opus-5-5 | — | REPORTED | red test changed: test/unit/session-turns.test.ts |
| 2026-10-20 | T1 | 3 | strong | claude | claude-opus-5-5 | — | REPORTED | red test changed: test/unit/doctor-cache.test.ts |
| 2026-10-20 | T2 | 1 | strong | claude | — | claude-opus-5-5 | FAIL | red test changed: test/unit/session-turns.test.ts; FAIL: B1: taskCommitTimes in commits.ts has no test and never ran (test-policy: parsers with logic; D2 source of every task window) |
| 2026-10-20 | T2 | 1 | strong | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/session-turns.test.ts; `npx vitest run test/unit/session-turns.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-20 | T2 | 1 | strong | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/session-turns.test.ts; `npx vitest run test/unit/session-turns.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-20 | T1 | 1 | strong | claude | — | claude-opus-5-5 | PASS | red test changed: test/unit/doctor-cache.test.ts; advisories: A1 high: gray-matter default engines eval ---js front matter in .claude/agents (doctor-cache.ts:99), restrict engines as close-summary.ts:36; A2 FORCE skips warning on invalid later values; A3 no tests for settings env over shell, CLAUDE_CONFIG_DIR, unreadable settings; A4 module reads node:fs directly |
| 2026-10-20 | T2 | 2 | strong | claude | claude-opus-5-5 | — | REPORTED |  |
| 2026-10-20 | T2 | 1 | strong | claude | — | claude-opus-5-5 | PASS | advisories: A-b Task tool name untested; A-c pauses counted over whole transcript, not record windows; A-d commits-times test depends on global git config (gpgsign/hooksPath); A-e t>0 guard untested |
