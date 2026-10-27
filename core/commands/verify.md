---
schema_version: 1
id: verify
title: Verify
description: "Run testers per suite on the impacted tests, trace every AC to its tests and check conformance with the spec; the full critical smoke runs in CI or with --full."
summary: "Impacted tests, e2e on critical flows, and every acceptance criterion traced"
status: stable
flow: { after: [implement], next: [close] }
arguments:
  - name: spec
    description: "The spec id or folder"
    required: true
examples:
  - { run: "/mandao-verify MDO-0003", does: "runs the impacted tests and traces every acceptance criterion" }
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
  - rules/doc-verify.md
  - rules/doc-quickstart.md
  - rules/budget.md
  - rules/telemetry.md
  - rules/next-step.md
scripts: [where, next, verify-plan, security-scanning, tests, build, status, trace, commit-spec, event]
---

# /mandao-verify

Budget: follow `{{template:rules/budget.md}}` at the start and at the end.
Telemetry: follow `{{template:rules/telemetry.md}}` for event calls and categories.

Spec: {{arg:spec}}

You verify that what was built is what the spec asked for, with evidence. Write the report in
`{{language.technical}}`. Never claim a test passed without its output.

## 1. Plan

1. `{{script:where}} {{arg:spec}} --harness {{harness}} --first "/mandao-verify {{arg:spec}}"` — go on when `ready` is true (on the spec branch, in its worktree or in place, ADR 0059). Otherwise, when
   the `where` message says another worktree holds the branch:
<!-- mandao:if harness=claude -->
   Call `EnterWorktree` with that worktree path and go on without a new session. Otherwise run the same `where`
   command with `--switch`: it moves this checkout onto the spec branch (never run git yourself); go on when it
   reports `ready`. If either fails, print the `resume` field and stop.
<!-- mandao:endif -->
<!-- mandao:if !harness=claude -->
   Print the `resume` field of the `where` output (the command that opens this harness in that worktree) and
   stop. Otherwise run the same `where` command with `--switch`: it moves this checkout onto the spec branch
   (never run git yourself); go on when it reports `ready`.
<!-- mandao:endif -->
2. `{{script:verify-plan}} {{arg:spec}}` gives the suites per project (unit over the files the spec's
   commits touched; e2e for the flows of its AC, critical ones always), `missingRed` (tasks with declared
   tests and no RED evidence), the runs deferred to CI, the trace findings and the `blockers`.
3. If `blockers` lists open tasks or uncommitted work, stop: verify comes after `/mandao-implement`.
4. Run `{{script:security-scanning}}` and read each project's `security_scanning` record and
   `verify-plan` security status. Run configured
   local `secrets` and `sast` gates. If coverage exists only in CI, report it as pending PR CI and do
   not claim that it passed. If a task has the `security` risk tag and neither type has verified
   coverage, stop until the person records `mandao approve <spec> security-gaps --reason <why>`.
   An `audit` finding that cannot be fixed in this spec is accepted only by the person, with
   `mandao approve <spec> vulnerability --package <p> --id <advisory> --reason <reachability> --review <trigger>`;
   close carries it to the delivery notes.
   Offer either a confirmed local-tool installation (with an OS-specific command) or a quick that
   adds the scan to CI. A declared scanner is labeled declared, not detected; unknown is not none.
   For each security-tagged task, require an executed PASS in its `_log/gates/` receipt for the
   applicable local scanner; if absent, run `{{mandao}} run gates <spec> <task>` and include its output
   in Evidence. A configured or installed scanner without an executed PASS is never a scan PASS.
   After PR CI reports green, rerun `verify-plan --ci-confirmed` to discharge CI-only scan findings.
   A project with an `eval` gate (model or quality evaluations) runs it here, once:
   `{{mandao}} run tests <project> --eval --spec {{arg:spec}}`; it never runs among the task gates.
   A run deferred to CI clears when it passes here: `{{mandao}} run tests <project> --spec {{arg:spec}} --deferred <task>`
   (it runs the project's e2e command, else its test gate). Without CI in the repository that is the only way;
   never claim `--ci-confirmed` for a CI that does not exist.

## 2. Run, one Tester per suite

For each suite, a `tester` agent in a fresh context (it did not author the code):
- **Unit:** `{{script:tests}} <project> <files>` — impacted tests only, under the resource budget.
- **E2E:** the flows of the suite's AC with the project's `tests.e2e` command; the full suite and the
  smoke of every critical flow run in CI, locally only with `--full`.
- **Built binary or app:** before testing what the project builds (a CLI, a bundle, an app), rebuild it
  with `{{script:build}} <project>` — it respects the `build` memory floor and the test queue. If it
  says `DEFERRED`, do not force it: report that the built artifact was not re-checked (ADR 0026,
  Kaizen of MDO-0002: a stale build hid the real behavior).
- The Tester traces each test to its AC and clause, reads the gate logs the Leader left in
  `_log/gates/` instead of asking for them again, re-runs the evidence, and labels a real failure
  `PRODUCT_BUG` with the evidence; it fixes only test defects and never weakens an assertion.
<!-- mandao:if profile=ai -->
- `ai` projects: run the evals against the baseline; a metric drop is a FAIL even when tests pass.
<!-- mandao:endif -->

## 3. Report

Write `verify-report.md` from `{{template:spec/verify-report.md}}`, following
`{{template:rules/spec-docs.md}}` and `{{template:rules/doc-verify.md}}`: the verdict as the summary, AC → tests clause by clause first
(`{{template:rules/traceability.md}}`), then suites, TDD evidence (`missingRed`, changed red tests),
the untagged security mentions from `verify-plan` (`securityMentions`, listed verbatim per task; they do
not block, a person reads them), product bugs, deferred runs and the remaining blockers; commands and outputs only in `## Evidence`. When
the spec has a `quickstart.md`, bring its steps in line with what was built
(`{{template:rules/doc-quickstart.md}}`). Then run the semantic
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

End with `{{template:rules/next-step.md}}`: `{{script:next}} {{arg:spec}} --harness {{harness}}`.
