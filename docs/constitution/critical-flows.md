---
schema_version: 1
level: workspace
last_reviewed: 2026-10-20
status: draft
---

# Critical flows

Flows that require e2e coverage and performance budgets. AC touching them carry `critical: true`.

| Flow | Projects | E2E suite | Budget (see performance.md) |
|---|---|---|---|
| `init` → `sync` → `doctor` clean on a new workspace | mandao | `test/integration/engine.test.ts` (engine level; no CLI e2e yet) | sync < 1 s |
| Hand edit of a generated file is never overwritten | mandao | `test/unit/writer.test.ts`, `test/integration/engine.test.ts` | — |
| Every core command renders for every harness, profile and mode | mandao | `test/unit/content.test.ts` | — |
| `skills add` runs nothing before confirmation | mandao | `OPEN`: only the install module is tested, not the confirmation prompt | — |
