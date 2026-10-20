---
schema_version: 1
spec: MDO-0002-filter-pinned-skills-by-vetting
depth: standard
projects: [mandao]
status: approved
---

# Design — Filter pinned skills by vetting

## Summary
A pure `filterByVetting(skills, filter)` in `src/cli/skills.ts`, used by both the text and the JSON
output of `skillsList`; `src/cli/extensions.ts` adds the two options and rejects them together.

## Premise Ledger

| # | Claim | Evidence (as run, SHA) or UNVERIFIED | If false | Impact |
|---|---|---|---|---|
| P1 | `skillsList` builds both outputs from `lock.skills` | `src/cli/skills.ts` (`formatPinnedSkills`, `pinnedSkillsJson`) at 1299ba9 | the filter would need two call sites | Low |

## Diagram

<!-- mandao:diagram type=workflow tool=mermaid file=inline graph=diagrams/proposed.graph.json source=sha256:31c21dfdb1088660 -->
Derived from this design; regenerated whenever it changes. Part of the design approval.

```mermaid
flowchart LR
  cli["skills list --vetted / --unvetted"] --> lock["mandao.lock"]
```

## Decisions

| # | Decision | Alternatives | Why |
|---|---|---|---|
| D1 | Filter before formatting, once | Filter inside each formatter | One rule, both outputs (codebase-conventions: share one function) |

## Changes by project and module
- mandao · `src/cli`: options and the filter.

## Contract
None (single project).

## Risks and risk tags
None.

## Constitution Impact
None.

## Product Impact
None.

## Module Docs Impact
None.
