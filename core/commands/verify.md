---
schema_version: 1
id: verify
title: Verify
description: "Run testers per suite on the impacted tests, trace every AC to its tests and check conformance with the spec; the full critical smoke runs in CI or with --full."
status: stable
flow: { after: [implement], next: [close] }
arguments:
  - name: spec
    description: "Spec folder or id"
    required: true
inputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/", description: "the documents in the root; _log/ is read through scripts" }
outputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/verify-report.md" }
  - { path: "{{paths.specs}}/<ID>-<slug>/story.md", description: "status: verified when nothing blocks" }
  - { path: "{{paths.specs}}/<ID>-<slug>/quickstart.md", description: "updated when it exists" }
capabilities: [read, search, shell, agents]
templates:
  - rules/spec-docs.md
  - spec/verify-report.md
  - rules/test-policy.md
  - rules/traceability.md
  - rules/consistency-check.md
scripts: [where, verify-plan, tests, build, status, trace, commit-spec]
---

# /mandao-verify

Spec: {{arg:spec}}

You verify that what was built is what the spec asked for, with evidence. Write the report in
`{{language.technical}}`. Never claim a test passed without its output.

## 1. Plan

1. `{{script:where}} {{arg:spec}}` — work in the spec's worktree.
2. `{{script:verify-plan}} {{arg:spec}}` gives the suites per project (unit over the files the spec's
   commits touched; e2e for the flows of its AC, critical ones always), `missingRed` (tasks with declared
   tests and no RED evidence), the runs deferred to CI, the trace findings and the `blockers`.
3. If `blockers` lists open tasks or uncommitted work, stop: verify comes after `/mandao-implement`.

## 2. Run, one Tester per suite

For each suite, a `tester` agent in a fresh context (it did not author the code):
- **Unit:** `{{script:tests}} <project> <files>` — impacted tests only, under the resource budget.
- **E2E:** the flows of the suite's AC with the project's `tests.e2e` command; the full suite and the
  smoke of every critical flow run in CI, locally only with `--full`.
- **Built binary or app:** before testing what the project builds (a CLI, a bundle, an app), rebuild it
  with `{{script:build}} <project>` — it respects the `build` memory floor and the test queue. If it
  says `DEFERRED`, do not force it: report that the built artifact was not re-checked (ADR 0026,
  Kaizen of MDO-0002: a stale build hid the real behavior).
- The Tester traces each test to its AC and clause, re-runs the evidence, and labels a real failure
  `PRODUCT_BUG` with the evidence; it fixes only test defects and never weakens an assertion.
<!-- mandao:if profile=ai -->
- `ai` projects: run the evals against the baseline; a metric drop is a FAIL even when tests pass.
<!-- mandao:endif -->

## 3. Report

Write `verify-report.md` from `{{template:spec/verify-report.md}}`, following
`{{template:rules/spec-docs.md}}`: the verdict as the summary, AC → tests clause by clause first
(`{{template:rules/traceability.md}}`), then suites, TDD evidence (`missingRed`, changed red tests),
product bugs, deferred runs and the remaining blockers; commands and outputs only in `## Evidence`. When
the spec has a `quickstart.md`, bring its steps in line with what was built. Then run the semantic
Consistency Check (`{{template:rules/consistency-check.md}}`) over story, requirements, design and the
report.

## 4. Status

- Any `PRODUCT_BUG`, failing suite or blocker → `verdict: blocked`; list what must be fixed and
  suggest `/mandao-implement` (a new task) or `/mandao-quick` when it is trivial.
- Otherwise `{{script:status}} {{arg:spec}} verified` (add `--ci-confirmed` only when CI confirmed every
  deferred run). If it is allowed, set `status: verified` in `story.md` and `verdict: verified` in the
  report. `missingRed` on a spec started before TDD (ADR 0022) is reported, not blocking.
- Either way, commit the report on its own: `{{script:commit-spec}} {{arg:spec}} verify` (a `docs`
  commit with `Refs: <ID>` and a fixed subject; never pushed).

Next: {{command:close}}.
