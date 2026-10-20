---
schema_version: 1
id: implement
title: Implement
description: "Run the Leader → Implementer → Reviewer loop task by task, committing each task after a Reviewer PASS."
status: stub
flow: { after: [tasks], next: [verify] }
arguments:
  - name: spec
    description: "Spec folder or id"
  - name: task
    description: "Optional task id to run (default: next eligible)"
inputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/tasks.md" }
outputs:
  - { path: "(code)" }
  - { path: "{{paths.specs}}/<ID>-<slug>/execution.md" }
  - { path: "{{paths.specs}}/<ID>-<slug>/tasks.md" }
tier: strong
capabilities: [read, search, edit, shell, agents]
templates:
  - rules/review.md
  - rules/clean-code.md
  - rules/test-policy.md
  - rules/commits.md
  - spec/execution.md
---

# /mandao-implement

> **Not implemented yet** in this Mandao version. This file declares the command's contract
> (arguments, inputs, outputs) so other mandaos and `AGENTS.md` can reference it.

Arguments: {{args}}

Tell the user this mandao is not available yet, summarize what it will do (below), and suggest the
closest available step.

## Planned behavior

- The Leader (`strong`) picks the next eligible task, builds a scoped brief from the graph with an exemplar file, and delegates to an Implementer at the task's tier.
- The Reviewer (`strong`, a different model from the Implementer) audits only the diff, the brief and the active lens rules per `{{template:rules/review.md}}` and `{{template:rules/clean-code.md}}`.
- Escalation: 2 FAILs at a tier → one tier up; 3 FAILs at `strong` → HALT. A wrong spec opens a Pivot Record instead of consuming retries.
- After PASS: one commit per task per `{{template:rules/commits.md}}`; `tasks.md` updated in the same commit; `execution.md` (from `{{template:spec/execution.md}}`) records the hash. Advisories are logged and never reopen the loop.
- Tests follow `{{template:rules/test-policy.md}}`; the module's `AGENTS.md` update is part of the DoD.
