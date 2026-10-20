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
