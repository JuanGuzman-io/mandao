---
schema_version: 1
tracker: none
type: story
id: MDO-0001
projects: [mandao]
status: approved
sources:
  - { ref: "src/skills/install.ts (pinSkills)", kind: code, date: 2026-10-20 }
  - { ref: "codebase-conventions eval prompt", kind: conversation, date: 2026-10-20 }
---

# List the skills pinned in a workspace

## Who
A developer or tech lead who wants to know which skills Mandao has pinned for this workspace.

## Problem
`mandao skills add` pins skills in `.mandao/mandao.lock`, but there is no way to see them without
reading the lock by hand.

## Value
Teammates can check, before switching harness or reviewing a change, which skills (and versions) the
workspace relies on.

## Scope
`mandao skills list`, plain text and JSON.

## Out of scope
Removing or updating skills.

## Acceptance criteria

### AC-1 — See pinned skills
critical: false

- **GIVEN** a workspace whose lock pins skills
- **WHEN** I run `mandao skills list`
- **THEN** I see each skill with its version, whether it is vetted, and its source
- **BUT it must NOT** show skills that are only in the catalog and not pinned (C1)

### AC-2 — Nothing pinned
critical: false

- **GIVEN** a lock without skills
- **WHEN** I run `mandao skills list`
- **THEN** I am told how to add one
- **AND IT MUST** exit with code 0 (C1)

### AC-3 — Machine-readable list
critical: false

- **GIVEN** a workspace whose lock pins skills
- **WHEN** I run `mandao skills list --json`
- **THEN** I get a JSON array with id, version, vetted and source for each pinned skill

## Dependencies
None.

## Assumptions and open questions
None.
