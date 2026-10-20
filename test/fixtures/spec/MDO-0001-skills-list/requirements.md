---
schema_version: 1
spec: MDO-0001-skills-list
depth: lite
projects: [mandao]
status: approved
---

# Requirements — List the skills pinned in a workspace

## Functional requirements

### FR-1 — Print pinned skills
Serves: AC-1, AC-1/C1
Projects: mandao

#### S-1.1 — Pinned skills are listed
- **GIVEN** a lock with two pinned skills
- **WHEN** `mandao skills list` runs
- **THEN** both are printed with id, version, vetted flag and source
- **BUT it must NOT** read the catalog to decide what to print (C1)

### FR-2 — Empty lock hint
Serves: AC-2, AC-2/C1
Projects: mandao

#### S-2.1 — No skills pinned
- **GIVEN** a lock with no skills
- **WHEN** `mandao skills list` runs
- **THEN** a hint to run `mandao skills add` is printed
- **AND IT MUST** exit with code 0 (C1)

## Consistency Check

No findings.
