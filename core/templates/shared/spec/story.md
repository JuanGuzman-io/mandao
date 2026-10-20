---
schema_version: 1
tracker: none            # jira | linear | clickup | monday | none
type: story              # epic | story | bug | enhancement | task | performance
id: MDO-0000             # tracker id, or a local id when there is no tracker
url:
parent:
projects: []             # project names from .mandao/config.yml
status: draft           # draft | approved | in-progress | blocked | verified | closed | abandoned
sources: []              # [{ ref, kind, date }] every source consulted
# models: { claude: { reviewer: opus } }   # optional per-spec model overrides
---

# <Title in business language>

## Who
<!-- The user or role, in the product's own words (see glossary.md). -->

## Problem
## Value
## Scope
## Out of scope

## Acceptance criteria

<!--
One block per AC. Numbers are stable. Flag critical: true when the AC touches a flow in
critical-flows.md. Use BUT it must NOT / AND IT MUST for the edges that matter.
-->

### AC-1 — <short name>
critical: false

- **Given** …
- **When** …
- **Then** …
- **BUT it must NOT** …

## Dependencies
## UX references
## Data involved

## Assumptions and open questions
<!-- ASSUMPTION / OPEN / CONFLICT, each with its source. A critical OPEN blocks specify. -->
