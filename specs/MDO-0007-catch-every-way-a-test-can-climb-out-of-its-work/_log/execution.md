---
schema_version: 1
spec: MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work
---

# Execution — MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work

## Log

| Date | Task | Attempt | Tier | Harness | Implementer | Reviewer | Verdict | Notes |
|---|---|---|---|---|---|---|---|---|
| 2026-10-20 | T1 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-20 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-implementer-standard: test/unit/guards.test.ts; `npx vitest run test/unit/guards.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-20 | T1 | 1 | — | claude | claude-sonnet-5-5 | — | REPORTED | red test changed: test/unit/guards.test.ts |
| 2026-10-20 | T1 | 1 | — | claude | — | claude-opus-5-5 | PASS | red test changed: test/unit/guards.test.ts; Advisories: (1) gates' related run skipped architecture.test.ts; Leader ran it: 2 files, 14 tests passed. (2) compiler host keeps fs-backed directoryExists/getDirectories/realpath, unreached with noResolve/noLib. (3) not covered, out of scope: path.posix.join, import { posix }, templates with substitutions, path['join']. (4) bare 'path' specifier untested. (5) makeTree matched by name. UP='..' snippet edit after red judged not a weakening; T2 removes its cause. |
