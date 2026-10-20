---
schema_version: 1
level: workspace
last_synced: 2026-10-20
owner: PO
status: draft
---

# Product

Derived from code and `MANDAO-DESIGN.md` only; `.mandao/sources.yml` declares no tracker or documents.

## Vision

Spec-Driven Development for AI coding agents across harnesses: every command is a *mandao* given to
the agent, done exactly as asked, with a receipt (`MANDAO-DESIGN.md` §1).

## Users and roles

| Role | Uses |
|---|---|
| Developer | init, sync, constitution, specify, quick, implement… |
| PO / PM | story, clarify answers, release notes (business language) |
| Tech lead | constitution approval, standards, models |

## Scope

In this version: CLI (`init`, `sync`, `doctor`, `update`, `harness add`, `skills add`, `models`,
`run`), adapters for Claude Code, GitHub Copilot and `AGENTS.md`, and real content for `constitution`,
`specify` and `quick`. Other commands are stubs.

## Capability map

| Capability | Evidence in code | Documented in | Status |
|---|---|---|---|
| Detects single / monorepo / polyrepo workspaces | `src/workspace/detect.ts` | MANDAO-DESIGN §6 | implemented |
| Generates the same commands for several agents | `src/adapters/claude.ts`, `copilot.ts`, `agents-md.ts` | §4.3 | implemented |
| Never overwrites a hand-edited generated file | `src/writer/plan.ts` | ADR 0003 | implemented |
| Team customizations survive updates | `src/resolver/resolve.ts` (patches) | ADR 0004 | implemented |
| Chooses a model per role with dated recommendations | `src/models/`, `core/models/recommendations.yml` | §14.3 | implemented |
| Blocks risky changes from the quick lane | `src/scripts/quick-check.ts` | §21 | implemented |
| Installs vetted skills after confirmation | `src/skills/install.ts` | §17.2 | implemented |
| Publishes release notes to trackers | — | §18.2 | not implemented (out of MVP) |
