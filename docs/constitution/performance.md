---
schema_version: 1
level: workspace
last_reviewed: 2026-10-20
status: draft
---

# Performance

## Budgets

| Flow / route | Metric | Budget | Measured with |
|---|---|---|---|
| `mandao sync` on a monorepo with two harnesses | wall time | `ASSUMPTION`: < 1 s (no measurement yet) | `time node dist/cli.js sync` |
| Full test suite | wall time | `OPEN(owner: tech lead)`: no approved measured budget; remove the obsolete 0.5 s claim | `npm test` |

## Measurement protocol

Production build (`npm run build`), same machine, N ≥ 5 runs, median and spread. Not run yet.

## Resource and model cost controls

Before builds and impacted test runs, resource planning chooses run/reduce/defer using machine load,
free memory and configured operation floors (`src/scripts/resources.ts`, ADR 0024). A forced run is
recorded. Deferred tests remain pending until authoritative CI confirmation.

Mechanical work runs in scripts. Costs and session-cut estimates are recorded; a configured spending
cap pauses delegation until a person authorizes more (`src/spec/costs.ts`, ADR 0036, 0038, 0039).
No default cap or new latency budget is introduced by this review. List-price estimates are distinct
from actual provider billing. Benchmark claims require the protocol above, not one local test run.
