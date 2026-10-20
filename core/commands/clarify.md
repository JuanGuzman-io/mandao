---
schema_version: 1
id: clarify
title: Clarify
description: "Resolve [NEEDS CLARIFICATION] items and Consistency Check findings, routing business questions to the PO and technical ones to the dev."
status: stub
flow: { after: [specify, tasks], next: [specify, tasks] }
arguments:
  - name: spec
    description: "Spec folder or id"
inputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/requirements.md" }
  - { path: "{{paths.specs}}/<ID>-<slug>/design.md" }
outputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/requirements.md (## Clarifications)" }
capabilities: [read, edit, mcp]
templates:
  - rules/consistency-check.md
---

# /mandao-clarify

> **Not implemented yet** in this Mandao version. This file declares the command's contract
> (arguments, inputs, outputs) so other mandaos and `AGENTS.md` can reference it.

Arguments: {{args}}

Tell the user this mandao is not available yet, summarize what it will do (below), and suggest the
closest available step.

## Planned behavior

- Triggered when specify leaves `[NEEDS CLARIFICATION]` or findings from `{{template:rules/consistency-check.md}}`; also callable by hand.
- At most 5 questions per round, ordered by impact.
- Technical questions go to the dev in chat; business questions go to the PO through the tracker or chat MCP, and answers flow back.
- Records each answer with date and author in `## Clarifications`, then re-runs the Consistency Check. A critical `OPEN` keeps blocking tasks.
