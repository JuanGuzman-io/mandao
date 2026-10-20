---
schema_version: 1
id: close
title: Close
description: "Kaizen, apply approved constitution and product impacts, sync AGENTS.md, and produce technical docs, release notes and a diagram."
status: stub
flow: { after: [verify], next: [] }
arguments:
  - name: spec
    description: "Spec folder or id"
inputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/" }
outputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/close-summary.md" }
  - { path: "{{paths.releases}}/<ID>/" }
  - { path: "docs/kaizen/<ID>.md" }
  - { path: "{{paths.constitution}}/CHANGELOG.md" }
capabilities: [read, search, edit, shell, mcp]
templates:
  - rules/context.md
---

# /mandao-close

> **Not implemented yet** in this Mandao version. This file declares the command's contract
> (arguments, inputs, outputs) so other mandaos and `AGENTS.md` can reference it.

Arguments: {{args}}

Tell the user this mandao is not available yet, summarize what it will do (below), and suggest the
closest available step.

## Planned behavior

- Kaizen: measure (rework, pivots, bugs, review FAILs) → learn (0–3 lessons with evidence) → standardize (1–3 line edits) → record.
- Applies Constitution and Product Impact with approval; the single writer, on the apply-capable branch only.
- Syncs `AGENTS.md`, updates the graph, writes the technical doc, release notes criterion by criterion against the story, and a diagram (Archify, Mermaid as fallback).
- Publishes to the tracker story only after confirmation, idempotently (stores published ids); without MCP writes `{{paths.releases}}/<ID>/` plus a copy-paste block. Follows `{{template:rules/context.md}}`.
