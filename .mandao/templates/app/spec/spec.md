---
schema_version: 1
spec: <ID>-<slug>
depth: lite
projects: []
status: draft           # draft | approved | in-progress | blocked | verified | closed | abandoned
writes_data: <yes|no>
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

## Principle check

One row per `DP-*` principle declared in the applicable constitution. If none are declared, use `none`.

| ID | Applies? | Application or reason not applicable |
|---|---|---|
| <DP-1 or none> | <yes/no/n/a> | <how it applies, why not, or no principles are declared> |

## Justified exceptions

| Principle | Why the exception is needed | Why a simpler alternative was rejected |
|---|---|---|

## Data writes (ACID)

Required when `writes_data: yes` or the spec contains `data-model.md` or a task tagged `data` or
`migration`.

| Operation | Writes committed together | Transaction/tool | Compensation across systems | Concurrency/isolation |
|---|---|---|---|---|

## Changes by project and module

| Project | Module | Change | Exemplar file |
|---|---|---|---|

## Risks and impacts

## Constitution Impact

## Product Impact

## Module Docs Impact

## Consistency Check

No findings.

## Open items

## Clarifications

## Premise Ledger

## Evidence
