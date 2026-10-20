---
schema_version: 1
spec: MDO-0001-list-pinned-skills
depth: lite
projects: [mandao]
status: approved
---

# Requirements — List the skills pinned in a workspace

## Functional requirements

### FR-1 — Format pinned skills
Serves: AC-1, AC-1/C1
Projects: mandao

#### S-1.1 — Pinned skills are listed
- **GIVEN** a lock with two pinned skills, one vetted and one not
- **WHEN** they are formatted for the terminal
- **THEN** each line shows the vetted badge, `id@version` and the source, sorted by id
- **BUT it must NOT** consult the catalog to decide what to print (C1)

### FR-2 — Register the command
Serves: AC-2, AC-2/C1
Projects: mandao

#### S-2.1 — No skills pinned
- **GIVEN** a lock with no skills
- **WHEN** `mandao skills list` runs
- **THEN** a hint to run `mandao skills add <id|pack>` is printed
- **AND IT MUST** exit with code 0 (C1)

### FR-3 — JSON output
Serves: AC-3
Projects: mandao

#### S-3.1 — JSON list
- **GIVEN** a lock with pinned skills
- **WHEN** `mandao skills list --json` runs
- **THEN** stdout is a JSON array of `{ id, version, vetted, source }`

## Consistency Check

No findings.

## Clarifications
