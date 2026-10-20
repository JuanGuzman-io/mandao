---
schema_version: 1
id: tasks
title: Tasks
description: "Break an approved spec into T-n tasks with project, tier, files, risk tags, tests, AC, DoD and dependencies."
status: stub
flow: { after: [specify, clarify], next: [implement] }
arguments:
  - name: spec
    description: "Spec folder or id"
inputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/requirements.md" }
  - { path: "{{paths.specs}}/<ID>-<slug>/design.md" }
outputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/tasks.md" }
  - { path: "<project>/{{paths.specs}}/<ID>/spec-ref.md (polyrepo slices)" }
tier: strong
capabilities: [read, search, edit, mcp]
templates:
  - spec/tasks.md
  - rules/test-policy.md
  - rules/consistency-check.md
  - rules/traceability.md
---

# /mandao-tasks

> **Not implemented yet** in this Mandao version. This file declares the command's contract
> (arguments, inputs, outputs) so other mandaos and `AGENTS.md` can reference it.

Arguments: {{args}}

Tell the user this mandao is not available yet, summarize what it will do (below), and suggest the
closest available step.

## Planned behavior

- Blocked while a critical `OPEN` or Consistency Check finding remains.
- Writes `tasks.md` from `{{template:spec/tasks.md}}`: each `T-n` has project, tier (`fast | standard | strong`), files and modules from the graph, exemplar, risk tags, tests per `{{template:rules/test-policy.md}}`, AC and scenarios per `{{template:rules/traceability.md}}`, DoD (including the module's `AGENTS.md`), verify command, dependencies and parallel safety.
- Multi-project order: contract → back and front in parallel against a mock → integration → e2e.
- Polyrepo: writes a slice in each touched repo (`spec-ref.md`, that repo's tasks, the contract).
- Runs the Consistency Check again; optionally pushes subtasks to the tracker after confirmation.
