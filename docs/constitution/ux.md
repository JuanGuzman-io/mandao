---
schema_version: 1
level: workspace
last_reviewed: 2026-10-20
status: draft
---

# UX

Mandao's interface is a terminal CLI and the generated agent commands.

## Principles

- Defaults that work with `--yes`; every prompt has a flag (`src/cli/index.ts`).
- Show what will happen before doing it: change lists with `+ ~ - !` symbols (`src/cli/output.ts`),
  installers printed before confirmation.
- Errors name the field path and the fix (`formatIssues`, `doctor` findings with `→ fix`).
- Respect `NO_COLOR` and non-TTY output.

## Design tokens

Terminal colors only: green created/ok, blue updated/info, red deleted/error, yellow drift/warn,
dim for secondary text.

## Accessibility target

Every status is conveyed by a symbol or word as well as color.

## Workflow and documentation

- `mandao start` prints the exact worktree and next-session command; `mandao approve` records human
  authorization from the terminal without a model session (`src/cli/start.ts`, `approve.ts`).
- Long mechanical output stays in evidence files; scripts return concise JSON. Missing tools,
  deferred gates, model fallback and reduced independence are stated, never presented as PASS
  (`core/commands/implement.md`, `src/engine/doctor-models.ts`).
- README diagrams use light/dark `<picture>` sources. `docs/process-map.md` distinguishes required,
  automatic and optional steps. Approvals and planned commands must remain visible.
