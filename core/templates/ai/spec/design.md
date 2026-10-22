---
schema_version: 1
spec: <ID>-<slug>
depth: standard
projects: []
status: draft           # draft | approved | in-progress | blocked | verified | closed | abandoned
writes_data: <yes|no>
---

# Design — <title>

<2–3 lines: how the requirements are met.>

## Decisions

<a id="d1"></a>
### D1 — <decision>

- <Why, and the alternatives rejected.>

## Principle check

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

## Model and prompts

| Concern | Choice | Version / reference |
|---|---|---|
| Model | | |
| Prompts | | prompts/<name>@<version> |
| Chunking / embedding | | |
| Retrieval (k, filters, reranking) | | |
| Guardrails | | |
| Fallback | | |

## Changes by project and module

| Project | Module | Change | Exemplar file |
|---|---|---|---|

## Diagram

## Contract

## Risks and risk tags

## Constitution Impact

## Product Impact

## Module Docs Impact

## Premise Ledger

<a id="p1"></a>
### P1 — <claim about the existing system> (High)

- **If false:** <what changes>.
- **Evidence:** UNVERIFIED — confirm at source before relying on it.

## Evidence
