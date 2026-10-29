---
schema_version: 2
tracker: none            # jira | linear | clickup | monday | none
type: story              # epic | story | bug | enhancement | task | performance
id: MDO-0000             # local id (PROJ-123 shape); names the folder and the branch
tracker_id:              # the tracker's own item id, quoted ("86e3w5954", "VZ-12"): branch, commits and PR carry it
url:
parent:
projects: []             # project names from .mandao/config.yml
lane: normal             # normal | hotfix (branched from branching.hotfix.from, merged back at close)
status: draft           # draft | approved | in-progress | blocked | verified | closed | abandoned
sources: []              # [{ ref, kind, date }] every source consulted
# models: { claude: { reviewer: opus } }   # optional per-spec model overrides
---

# <Title in business language>

<2–3 lines: who needs what, and how we will know it is done.>

## Who

## Problem

## Value

## Scope

## Out of scope

## Acceptance criteria

### AC-1 — <short name>
critical: false

- **GIVEN** …
- **WHEN** …
- **THEN** …
- **BUT it must NOT** … (C1)

## Dependencies

## UX references

## Data involved

<a id="assumptions"></a>
## Assumptions and open questions
