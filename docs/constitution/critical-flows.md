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
| `init` → `sync` → `doctor` clean on a new workspace | mandao | `test/integration/engine.test.ts` (engine level); `test/integration/doctor-cli.test.ts` (CLI exit code) | sync < 1 s |
| Hand edit of a generated file is never overwritten | mandao | `test/unit/writer.test.ts`, `test/integration/engine.test.ts` | — |
| Every core command renders for every harness, profile and mode | mandao | `test/unit/content.test.ts` | — |
| `skills add` runs nothing before confirmation | mandao | `test/integration/init-skills.test.ts` (shared `installAndPin` path after the selection) | — |
| `init` runs no skill installer or copy before the person selects it | mandao | `test/integration/init-skills.test.ts` (S-2.3/C1, S-4.1/C1) | — |
| Start creates an isolated spec worktree and resolves the next session | mandao | `test/integration/start.test.ts`, `branching.test.ts`, `shadow.test.ts` | no measured budget |
| Human approval refuses critical OPENs and records its provenance | mandao | `test/integration/approve.test.ts`, `premise.test.ts` | — |
| RED precedes implementation; FAIL escalates; tagged security findings block PASS | mandao | `test/integration/tdd.test.ts`, `enforced-rules.test.ts`, `review.test.ts` | — |
| Script-owned logs record outside edits and preserve task commit evidence | mandao | `test/integration/ledger.test.ts`, `spec-log.test.ts`, `run-queue.test.ts` | — |
| Closure preserves publication identity and detects diagram drift | mandao | `test/integration/close.test.ts` | — |
| Packed package installs and initializes from scratch | mandao | `scripts/smoke.mjs`, CI Node 22/24 | — |

Coverage labels above describe existing suites: integration/unit coverage is not a live harness e2e
claim. `OPEN(owner: tech lead)`: the skills confirmation prompt still needs dedicated process-level
coverage; the approved CI freshness step covers derived docs (`.github/workflows/ci.yml`).
