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
| Full test suite | wall time | `ASSUMPTION`: < 5 s (≈0.5 s today per vitest output) | `npm test` |

## Measurement protocol

Production build (`npm run build`), same machine, N ≥ 5 runs, median and spread. Not run yet.
