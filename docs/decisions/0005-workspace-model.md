# 0005 — Workspace model: single, monorepo, polyrepo

**Status:** Accepted

## Context
Real teams ship features across several projects: one repo with many packages, or many repos. A model
that special-cases "one repo" leaks everywhere later.

## Decision
- `config.yml` always declares `projects: [{ name, path, profile }]`. A simple repo is one project at `.`.
- `workspace.mode` is `single`, `monorepo` or `polyrepo`, detected by `init` and confirmed by the user.
- `workspace.home` holds the canonical specs, the workspace constitution and the root `AGENTS.md`.
  `paths.*` are relative to it. Harness folders (`.claude/`, `.github/`) live at the workspace root.
- Constitution has two levels: workspace (`docs/constitution/`) and project
  (`<project>/docs/constitution/`), and the project inherits from the workspace.
- A user story that touches several projects is one spec with one requirements and one design, and
  `## Contract` is mandatory.
- Polyrepo: `init` warns that root artifacts are not versioned and offers (1) a workspace repo with the
  children ignored (recommended), (2) a home repo for canonical specs, or (3) local only. `tasks` writes
  a slice (`spec-ref.md`, the repo's tasks, the contract) into each touched repo. There is one branch
  name across repos and one PR per repo.

## Consequences
- Every command reasons about `projects`, never about "the repo".
- In polyrepo, a child repo opened alone has its `AGENTS.md` block but no `/mandao-*` commands.
