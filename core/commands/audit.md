---
schema_version: 1
id: audit
title: Audit
description: "Read-only audit by lenses (drift, docs, architecture, security, quality, performance, infra, ai, process, skills) with scored findings."
status: stub
flow: { after: [], next: [quick, story] }
arguments:
  - name: lens
    description: "One lens, or empty for all"
inputs:
  - { path: "{{paths.constitution}}/" }
outputs:
  - { path: "docs/audits/<date>.md" }
capabilities: [read, search, shell]
---

# /mandao-audit

> **Not implemented yet** in this Mandao version. This file declares the command's contract
> (arguments, inputs, outputs) so other mandaos and `AGENTS.md` can reference it.

Arguments: {{args}}

Tell the user this mandao is not available yet, summarize what it will do (below), and suggest the
closest available step.

## Planned behavior

- Read-only. Score per lens, findings with severity, evidence and remediation.
- Each finding can become a quick (low) or a story (medium/high) with context preloaded.
