---
schema_version: 1
id: perf
title: Perf
description: "Find and fix performance problems with evidence: budgets, protocol, baseline, diagnosis by layer, one measured optimization per task."
status: stub
flow: { after: [], next: [implement] }
arguments:
  - name: scope
    description: "A project, route or critical flow"
  - name: target
    description: "frontend | backend | db | mobile | ai | all"
inputs:
  - { path: "{{paths.constitution}}/performance.md" }
  - { path: "{{paths.constitution}}/critical-flows.md" }
outputs:
  - { path: "{{paths.specs}}/<ID>-perf-<slug>/perf-report.md" }
capabilities: [read, search, edit, shell, mcp, web]
---

# /mandao-perf

> **Not implemented yet** in this Mandao version. This file declares the command's contract
> (arguments, inputs, outputs) so other mandaos and `AGENTS.md` can reference it.

Arguments: {{args}}

Tell the user this mandao is not available yet, summarize what it will do (below), and suggest the
closest available step.

## Planned behavior

- Budgets and a measurement protocol (N ≥ 5 runs, median and spread) fixed before measuring; spread larger than the effect disqualifies the number.
- Baseline, diagnosis by layer with measured evidence, prioritization with the user, then a `type: performance` spec.
- One optimization per task and commit; kept only if the gain exceeds the noise and nothing regresses.
