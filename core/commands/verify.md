---
schema_version: 1
id: verify
title: Verify
description: "Run testers per suite on the impacted tests, trace every AC to its tests and check conformance with the spec; the full critical smoke runs in CI or with --full."
status: stub
flow: { after: [implement], next: [close] }
arguments:
  - name: spec
    description: "Spec folder or id"
inputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/" }
outputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/verify-report.md" }
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
- Runs only impacted tests under the resource budget in `{{template:rules/test-policy.md}}`: unit tests related to the touched files, e2e for the spec's AC (critical AC always). The full suite and the smoke of every critical flow run in CI, locally only with `--full`; `DEFERRED_TO_CI` runs keep the spec out of `verified` until CI confirms them.
- `ai` projects: runs evals against the baseline; a metric drop is a FAIL even when tests pass.
- Evidence is re-run by a context that did not author it. Ends with the Consistency Check.
