---
schema_version: 1
spec: MDO-0002-filter-pinned-skills-by-vetting
depth: standard
projects: [mandao]
status: approved
---

# Requirements — Filter pinned skills by vetting

## Functional requirements

### FR-1 — Filter by vetting
Serves: AC-1, AC-2, AC-2/C1
Projects: mandao

#### S-1.1 — Unvetted only
- **GIVEN** a lock with one vetted and one unvetted skill
- **WHEN** `mandao skills list --unvetted` runs
- **THEN** only the unvetted skill is printed, and `--json` prints only it

#### S-1.2 — Vetted only
- **GIVEN** a lock with one vetted and one unvetted skill
- **WHEN** `mandao skills list --vetted` runs
- **THEN** only the vetted skill is printed
- **BUT it must NOT** run when both `--vetted` and `--unvetted` are given: it fails with exit code 1 (C1)

## Non-functional requirements
None.

## AC → FR matrix

| AC | FR |
|---|---|
| AC-1 | FR-1 |
| AC-2 | FR-1 |
| AC-2/C1 | FR-1 |

## Consistency Check

| # | Type | Finding | Resolution |
|---|---|---|---|

## Open items
None.

## Clarifications
None.
