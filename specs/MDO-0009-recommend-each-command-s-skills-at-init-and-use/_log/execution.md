---
schema_version: 1
spec: MDO-0009-recommend-each-command-s-skills-at-init-and-use
---

# Execution — MDO-0009-recommend-each-command-s-skills-at-init-and-use

## Log

| Date | Task | Attempt | Tier | Harness | Implementer | Reviewer | Verdict | Notes |
|---|---|---|---|---|---|---|---|---|
| 2026-10-21 | T1 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-21 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/command-skills.test.ts, test/unit/content.test.ts; `npx vitest run test/unit/command-skills.test.ts test/unit/content.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | REPORTED | red test changed: test/unit/command-skills.test.ts |
| 2026-10-21 | T1 | 1 | standard | claude | — | claude-opus-5-5 | FAIL | red test changed: test/unit/command-skills.test.ts; FAIL: harnesses field and harness filtering added, rejected by D1/C-1; S-1.2 test asserts the opposite of the spec |
| 2026-10-21 | T1 | 2 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/command-skills.test.ts, test/unit/content.test.ts; `npx vitest run test/unit/command-skills.test.ts test/unit/content.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T1 | 2 | standard | claude | claude-sonnet-5-5 | — | REPORTED | red test changed: test/unit/command-skills.test.ts, test/unit/content.test.ts |
| 2026-10-21 | T1 | 2 | standard | claude | — | claude-opus-5-5 | PASS | red test changed: test/unit/command-skills.test.ts, test/unit/content.test.ts |
| 2026-10-21 | T2 | 1 | strong | claude | — | — | STARTED |  |
| 2026-10-21 | T2 | 1 | strong | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/skills.test.ts, test/integration/init-skills.test.ts; `npx vitest run test/unit/skills.test.ts test/integration/init-skills.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T2 | 1 | strong | claude | claude-opus-5-5 | — | REPORTED | red test changed: test/unit/skills.test.ts, test/integration/init-skills.test.ts |
| 2026-10-21 | T2 | 1 | strong | claude | — | claude-opus-5-5 | FAIL | red test changed: test/unit/skills.test.ts, test/integration/init-skills.test.ts; FAIL: a filesystem error during the git copy crashes init and leaves a half-copied folder (AC-3/C1, S-3.3/C1) |
| 2026-10-21 | T2 | 2 | strong | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/git-copy.test.ts; `npx vitest run test/unit/git-copy.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T2 | 2 | strong | claude | claude-opus-5-5 | — | REPORTED | red test changed: test/unit/skills.test.ts, test/integration/init-skills.test.ts |
| 2026-10-21 | T2 | 2 | strong | claude | — | claude-opus-5-5 | PASS | red test changed: test/unit/skills.test.ts, test/integration/init-skills.test.ts |
