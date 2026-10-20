---
schema_version: 1
spec: <ID>-<slug>
depth: standard          # lite | standard | full
projects: []
status: draft
---

# Requirements — <title>

## Functional requirements

### FR-1 — <name>
Serves: AC-1
Projects: <project>

<Requirement statement.>

#### S-1.1 — <scenario>
- **Given** …
- **When** …
- **Then** …
- **BUT it must NOT** …   <!-- clause C1 -->
- **AND IT MUST** …       <!-- clause C2 -->

## Non-functional requirements

### NFR-1 — <name>
Serves: AC-…
<Measurable target and how it is measured. A number, not an adjective.>

## AC → FR matrix

| AC | Clause | FR / scenario | Status |
|---|---|---|---|
| AC-1 | main | FR-1 / S-1.1 | covered |
| AC-1 | BUT must NOT … | FR-1 / S-1.1 C1 | covered |

## Consistency Check
<!-- Per rules/consistency-check.md. Write "No findings" when empty. -->

| ID | Type | Sides (quoted, with location) | Severity | Owner |
|---|---|---|---|---|

## Open items
<!-- [NEEDS CLARIFICATION] items, ASSUMPTION, OPEN, CONFLICT. -->

## Clarifications
<!-- Filled by /mandao-clarify: date, question, answer, who answered, what changed. -->
