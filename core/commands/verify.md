---
schema_version: 1
id: verify
title: Verify
description: "Run testers per suite, trace every AC to its tests, check conformance with the spec and run the critical smoke suite."
status: stub
flow: { after: [implement], next: [close] }
arguments:
  - name: spec
    description: "Spec folder or id"
inputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/" }
outputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/verify-report.md" }
tier: strong
capabilities: [read, search, shell, agents]
templates:
  - rules/test-policy.md
  - rules/traceability.md
  - rules/consistency-check.md
---

# /mandao-verify

> **Not implemented yet** in this Mandao version. This file declares the command's contract
> (arguments, inputs, outputs) so other mandaos and `AGENTS.md` can reference it.

Arguments: {{args}}

Tell the user this mandao is not available yet, summarize what it will do (below), and suggest the
closest available step.

## Planned behavior

- Testers author and run one suite each and tell test defects from `PRODUCT_BUG`.
- AC → test traceability per `{{template:rules/traceability.md}}`, clause by clause.
- Always runs the existing critical suite as smoke; e2e for critical AC per `{{template:rules/test-policy.md}}`.
- `ai` projects: runs evals against the baseline; a metric drop is a FAIL even when tests pass.
- Evidence is re-run by a context that did not author it. Ends with the Consistency Check.
