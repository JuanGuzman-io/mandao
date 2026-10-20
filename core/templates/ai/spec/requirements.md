---
schema_version: 1
spec: <ID>-<slug>
depth: standard          # lite | standard | full
projects: []
status: draft           # draft | approved | in-progress | blocked | verified | closed | abandoned
---

# Requirements — <title>

<2–3 lines: what must be true, and how it is checked.>

## Functional requirements

<a id="fr1"></a>
### FR-1 — <name>
Serves: AC-1, AC-1/C1
Projects: <project>

<The requirement, in one or two sentences.>

#### S-1.1 — <scenario>
- **Given** …
- **When** …
- **Then** …
- **BUT it must NOT** … (C1)

## Eval thresholds

| ID | Serves | Metric | Threshold | Tolerance vs baseline | Dataset (version) |
|---|---|---|---|---|---|
| EV-1 | AC-1 | faithfulness | ≥ 0.90 | −0.02 | <dataset>@<version> |

## Non-functional requirements

### NFR-1 — <name>
Serves: AC-…

<A number and how it is measured.>

## AC → FR matrix

| AC | Clause | FR / scenario | Status |
|---|---|---|---|
| AC-1 | main | FR-1 / S-1.1 | covered |

## Clarifications

## Consistency Check

No findings.

## Open items
