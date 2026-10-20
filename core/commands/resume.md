---
schema_version: 1
id: resume
title: Resume
description: "Dashboard of active specs with their state and the next recommended mandao."
status: stub
flow: { after: [], next: [] }
inputs:
  - { path: "{{paths.specs}}/" }
outputs:
  - { path: "(chat only)" }
capabilities: [read, search]
---

# /mandao-resume

> **Not implemented yet** in this Mandao version. This file declares the command's contract
> (arguments, inputs, outputs) so other mandaos and `AGENTS.md` can reference it.

Arguments: {{args}}

Tell the user this mandao is not available yet, summarize what it will do (below), and suggest the
closest available step.

## Planned behavior

- Scans `{{paths.specs}}/` for active specs and reports state, blockers (`OPEN`, critical findings, HALT) and the next command.
