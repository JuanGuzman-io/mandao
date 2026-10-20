---
schema_version: 1
spec: <ID>-<slug>
status: draft
---

# Tasks — <title>

<!--
Order by dependencies. Multi-project: contract → back and front in parallel against a mock →
integration → e2e. Tests follow rules/test-policy.md; tiers: fast | standard | strong.
-->

### T-1 — <name>
- **Project:** <project>
- **Tier:** standard
- **Files / modules:** …
- **Exemplar:** <file to mimic>
- **Risk tags:** …
- **AC / scenarios:** AC-1 · S-1.1 (C1, C2)
- **Tests:** unit: …; e2e: … (only when required)
- **DoD:** … and the module's AGENTS.md is created or updated
- **Verify:** `<command>`
- **Depends on:** — · **Parallel-safe:** yes
- **Status:** pending
