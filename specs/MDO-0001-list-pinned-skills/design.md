---
schema_version: 1
spec: MDO-0001-list-pinned-skills
depth: lite
projects: [mandao]
status: approved
---

# Design — List the skills pinned in a workspace

## Summary
A pure `formatPinnedSkills(skills)` in `src/cli/skills.ts` and a `skills list` subcommand registered
next to `skills add` in `src/cli/extensions.ts`. Only the lock is read.

## Premise Ledger

| # | Claim | Evidence (as run, SHA) or UNVERIFIED | If false | Impact |
|---|---|---|---|---|
| P1 | Pinned skills live in `lock.skills` with id, version, source, author, license, vetted | `src/schemas/lock.ts`, commit on main at spec creation | the formatter reads another place | Low |

## Changes by project and module

| Project | Module | Change | Exemplar file |
|---|---|---|---|
| mandao | `src/cli` | `formatPinnedSkills`, `skillsList`, `skills list [--json]` | `src/cli/skills.ts` |

## Risks and risk tags
None.

## Constitution Impact
None.

## Product Impact
Capability map: "lists pinned skills".

## Module Docs Impact
None (no module AGENTS.md under `src/cli`).
