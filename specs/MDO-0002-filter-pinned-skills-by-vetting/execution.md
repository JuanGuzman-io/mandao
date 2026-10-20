---
schema_version: 1
spec: MDO-0002-filter-pinned-skills-by-vetting
---

# Execution — MDO-0002-filter-pinned-skills-by-vetting

## Log

| Date | Task | Attempt | Tier | Harness | Implementer | Reviewer | Verdict | Notes |
|---|---|---|---|---|---|---|---|---|
| 2026-10-20 | T1 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-20 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-implementer-standard: test/integration/cli.test.ts; `npx vitest run test/integration/cli.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-20 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | REPORTED | red test changed: test/integration/cli.test.ts |
| 2026-10-20 | T1 | 1 | standard | claude | claude-sonnet-5-5 | claude-opus-5-5 | PASS | advisories: check lives in skills.ts not extensions.ts (design summary); C1 test name promises exit code; nested ternary; no JSON check for --vetted |
