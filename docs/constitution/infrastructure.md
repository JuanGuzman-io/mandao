---
schema_version: 1
level: workspace
last_reviewed: 2026-10-20
status: draft
---

# Infrastructure

## Environments

Local developer machines only. Distribution through npm (`npx mandao`). Not published yet.

## CI/CD

`.github/workflows/ci.yml`: Node 22 and 24, `npm ci`, lint, typecheck, test, build. Releases through
changesets (`npm run release`), not wired to CI yet.

## Cloud and services

None.

## Observability

None; the CLI reports through its own output.
