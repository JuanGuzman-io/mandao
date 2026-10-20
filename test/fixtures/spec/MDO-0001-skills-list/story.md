---
schema_version: 1
tracker: none
type: story
id: MDO-0001
projects: [mandao]
status: approved
sources: []
---

# List the skills pinned in a workspace

## Acceptance criteria

### AC-1 — See pinned skills
critical: false

- **GIVEN** a workspace whose lock pins skills
- **WHEN** I run `mandao skills list`
- **THEN** I see each skill with its version, whether it is vetted, and its source
- **BUT it must NOT** show skills that are not pinned in the lock (C1)

### AC-2 — Nothing pinned
critical: false

- **GIVEN** a lock without skills
- **WHEN** I run `mandao skills list`
- **THEN** I am told how to add one
- **AND IT MUST** exit with code 0 (C1)
