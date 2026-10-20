---
schema_version: 1
level: workspace
last_synced: 2026-10-20
owner: PO
status: draft
---

# Business rules

Every rule has a source and a date. Sources here are code and the design document (no business
documents are configured).

| ID | Rule | Implemented in | Source | Date | Status |
|---|---|---|---|---|---|
| BR-1 | A quick change touches one project, ≤ 3 files and ~≤ 100 lines, with no new dependencies, migrations or public contracts | `src/scripts/quick-check.ts` (`DEFAULT_LIMITS`, `analyzeDiff`) | MANDAO-DESIGN §21 | 2026-10-20 | implemented |
| BR-2 | `auth`, `payments`, `pii`, `migration` never go through quick | `QUICK_FORBIDDEN_TAGS` in `src/schemas/common.ts` | §15.1 | 2026-10-20 | implemented |
| BR-3 | At most ~10 project skills on top of the bootstrap | `MAX_PROJECT_SKILLS` in `src/schemas/catalog.ts`; `skills add` | §17.2 | 2026-10-20 | implemented |
| BR-4 | One primary skill per technology | catalog shape (`technologies.<t>.primary`) | §17.2 | 2026-10-20 | implemented |
| BR-5 | The Reviewer runs on a different model than the Implementer when one is available; otherwise `reduced independence` is recorded, never blocking | `src/models/resolve.ts` (`independence`), Leader persona | §14.3, ADR 0011 | 2026-10-20 | implemented (generation + doctor); runtime in `implement` is a stub |
| BR-6 | Model precedence: flag > spec > project > workspace > recommendation | `resolveModels` | ADR 0011 | 2026-10-20 | implemented |
| BR-7 | Commit headers start with the type's emoji and stay ≤ 72 characters without it | `src/commits/commitlint.ts` | §16.4 | 2026-10-20 | implemented |
| BR-8 | Third-party skills are referenced, never vendored | `src/skills/install.ts` (no copy into the package) | §17.2 | 2026-10-20 | implemented |
