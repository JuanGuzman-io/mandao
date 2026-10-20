---
schema_version: 1
spec: <ID>-<slug>
depth: lite
projects: []
status: draft           # draft | approved | in-progress | blocked | verified | closed | abandoned
---

# Spec — <title>

<2–3 lines: what must be true and how it is built.>

## Functional requirements

<a id="fr1"></a>
### FR-1 — <name>
Serves: AC-1
Projects: <project>

<The requirement, in one or two sentences.>

#### S-1.1 — <scenario>
- **Given** …
- **When** …
- **Then** …

## AC → FR matrix

| AC | Clause | FR / scenario | Status |
|---|---|---|---|
| AC-1 | main | FR-1 / S-1.1 | covered |

## Decisions

<a id="d1"></a>
### D1 — <decision>

- <Why, and the alternatives rejected.>

## Changes by project and module

| Project | Module | Change | Exemplar file |
|---|---|---|---|

## Risks and impacts

## Consistency Check

No findings.

## Open items

## Clarifications

## Premise Ledger

## Tasks

### [ ] T1 — <result, in plain words>

- **What:** <what it does and why>.
- **Done when:**
  - S-1.1 holds: <behavior>.

```yaml
project: <project>
kind: feat
tier: standard
files: [path/to/file.ts]
exemplar: path/to/similar.ts
ac: [AC-1]
scenarios: [S-1.1]
test_levels: { S-1.1: unit }
evidence: tdd
risk_tags: []
depends_on: []
parallel_safe: false
verify: <command>
```

## Evidence
