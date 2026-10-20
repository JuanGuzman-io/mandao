---
schema_version: 1
tracker: none
type: story
id: MDO-0002
projects: [mandao]
status: closed
sources:
  - { ref: "specs/MDO-0001-list-pinned-skills (skills list)", kind: code, date: 2026-10-20 }
  - { ref: "iteration 3 plan: dogfooding spec with TDD", kind: conversation, date: 2026-10-20 }
---

# Filter pinned skills by vetting

## Who
A tech lead reviewing which pinned skills nobody has vetted yet.

## Problem
`mandao skills list` shows every pinned skill; finding the unvetted ones means scanning the badges.

## Value
Unvetted skills can be reviewed (or removed) before a team relies on them.

## Scope
`--vetted` and `--unvetted` on `mandao skills list`, for text and JSON output.

## Out of scope
Changing a skill's vetting.

## Acceptance criteria

### AC-1 — Only unvetted skills
critical: false

- **GIVEN** a lock with vetted and unvetted skills
- **WHEN** I run `mandao skills list --unvetted`
- **THEN** I see only the unvetted ones, in text or with `--json`

### AC-2 — Only vetted skills
critical: false

- **GIVEN** a lock with vetted and unvetted skills
- **WHEN** I run `mandao skills list --vetted`
- **THEN** I see only the vetted ones
- **BUT it must NOT** accept `--vetted` and `--unvetted` together (C1)

## Dependencies
MDO-0001 (`skills list`).

## Assumptions and open questions
None.
