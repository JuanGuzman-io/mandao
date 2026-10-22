---
schema_version: 1
id: tasks
title: Tasks
description: "Break an approved spec into Tn tasks: an overview by acceptance criterion with checkpoints, and per task what, done when, test levels and dependencies."
status: stable
flow: { after: [specify, clarify], next: [implement] }
arguments:
  - name: spec
    description: "Spec folder or id"
    required: true
inputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/requirements.md", required: true, description: "spec.md at lite depth" }
  - { path: "{{paths.specs}}/<ID>-<slug>/design.md", required: true }
outputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/tasks.md" }
  - { path: "<project>/{{paths.specs}}/<ID>/spec-ref.md", description: polyrepo slices }
capabilities: [read, search, edit, shell]
templates: [rules/spec-docs.md, spec/tasks.md, rules/test-policy.md, rules/traceability.md, rules/review.md, rules/doc-tasks.md, rules/budget.md, rules/telemetry.md]
scripts: [where, next, trace, tasks, commit-spec, event]
approval: required
---

# /mandao-tasks

Budget: follow `{{template:rules/budget.md}}` at the start and at the end.
Telemetry: follow `{{template:rules/telemetry.md}}` for event calls and categories.

Spec: {{arg:spec}}

Write task content in `{{language.technical}}`; headings, ids and YAML keys stay in English.

The tasks go in `tasks.md` at every depth (lite, standard and full), whatever their number, even a
single one; `spec.md` never holds them. At lite depth `/mandao-specify` runs this step in its own session.

Version 1 specs (`schema_version: 1` in `story.md`) are read as they are: lite keeps its tasks inside
`spec.md`. No new spec uses that format, and this command never writes tasks inside `spec.md`. On an
open version 1 spec it warns and does not convert it; the migration goes through the backlog spec.

1. **Gate.** Run `{{script:where}} {{arg:spec}} --harness <this harness> --first "/mandao-tasks {{arg:spec}}"`: if `inWorktree` is false, move into the worktree before any other step.
<!-- mandao:if harness=claude -->
   Call `EnterWorktree` with the worktree path (`expected.worktree` in the `where` output) and go on without a new session; if it is
   refused or fails, print the `resume` field of that output and stop: do not go on working in the main checkout.
<!-- mandao:endif -->
<!-- mandao:if !harness=claude -->
   Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop.
<!-- mandao:endif -->
   Run
   `{{script:trace}} {{arg:spec}}`: a critical `OPEN` or critical Consistency Check finding blocks this
   mandao — stop and recommend {{command:clarify}}.
2. **Write `## Details`** in `tasks.md` from `{{template:spec/tasks.md}}`, following
   `{{template:rules/spec-docs.md}}` and `{{template:rules/doc-tasks.md}}`. Per task: `### [ ] Tn — <result>` (never a file path), **What**
   (1–2 sentences, linking the design for the how), **Done when** (3–5 behavior bullets citing scenarios
   by id), **Notes** only for a visible exception, and the YAML block without prose:
   - `kind`: what the task changes, which becomes its commit type (only tests → `test`, only
     documentation → `docs`);
   - `tier` (`fast | standard | strong`), `files` and an `exemplar` from the graph, `risk_tags`
     (`{{template:rules/review.md}}`), the `ac` and `scenarios` it implements
     (`{{template:rules/traceability.md}}`);
   - `test_levels`: the level of every scenario it cites, `unit | e2e | eval | none`, as
     `{{template:rules/test-policy.md}}` requires; concrete test names are chosen by whoever writes them;
   - `partial_failure_tests`: concrete test names for partial-failure behavior when the design declares or implies data writes;
   - `evidence`: `tdd`, `mutation` (it only pins down existing behavior) or `none`;
   - `verify`, `decisions` (linked `D<n>` ids), `depends_on`, `parallel_safe`;
   - `delivery` (a number, optional): the delivery the task belongs to, see step 2b.
   A task's **Done when** lists every entry point, list item and clause of the FRs it serves; include a
   rejected option only as an observable must-not when it adds a behavior constraint. Rationale and
   alternatives stay in `design.md` and are included in the Implementer brief for linked decisions.
   A task added after specify declares scenarios
   through {{command:clarify}}, never `scenarios: []`. A task that builds a filesystem path from spec
   or story content and deletes or writes there carries the `input` risk tag and a Done-when item that
   the path stays inside its root.
   The module `AGENTS.md` (and its `CLAUDE.md` pointer) is part of every task's definition of done; do
   not list it.
2b. **Deliveries** (ADR 0053). Big specs split the execution, not the spec. Separate specs follow principle 8 of
   `{{template:rules/spec-docs.md}}`. When `{{script:tasks}} {{arg:spec}}` reports `proposeDeliveries.propose`, propose
   grouping the tasks by delivery with its reasons (task count or files above the limits), grouped by AC
   and never by technical layer; state that criterion and let the user decide. The proposal applies only while no task declares
   `delivery`. If they accept, give every task a `delivery: n`, numbered 1..n; each delivery meets its AC end to end and depends only on earlier ones.
3. **Premises that a run can prove:** a High premise in `design.md` still `UNVERIFIED` whose proof is a
   command goes into the **Done when** of the first task that can run it (recorded with
   `mandao run premise`), so a false premise fails in implement, not in verify. A search never counts as
   proof.
4. **Write `## Overview`:** `{{script:tasks}} {{arg:spec}} --index --write` generates it from the details,
   grouped by acceptance criterion (by `### Delivery n — AC…` when tasks declare `delivery`), with a checkpoint per group. Never edit it by hand.
<!-- mandao:if multiProject -->
5. **Order across projects:** contract → back and front in parallel against a mock → integration → e2e.
<!-- mandao:endif -->
<!-- mandao:if mode=polyrepo -->
6. **Slices:** in each touched repository write `{{paths.specs}}/<ID>/spec-ref.md` (link and summary),
   that repository's tasks and the contract, on the same branch name.
<!-- mandao:endif -->
7. **Check:** `{{script:tasks}} {{arg:spec}}` must show no issues, no cycles and no delivery issue (they are reported inside `issues`);
   `{{script:trace}} {{arg:spec}}` must show no `UNPLANNED` or `BROKEN_REF`. Fix and re-run.
8. **Approve:** show the overview and the first eligible task, then record what was shown with
   `{{script:next}} {{arg:spec}} --shown --harness <this harness>`. The user may approve from the terminal instead (`mandao approve {{arg:spec}} tasks --harness <this harness>`, no model session): when they say so, the status and `_log/approvals.yml` already show it, and the commit is made; do not ask again. When the person runs {{command:implement}} while `tasks.md` is still `draft`, that command runs
   `{{mandao}} approve --by-running /mandao-implement --harness <this harness> {{arg:spec}} tasks` and relays its one question. On approval in the session set `status: approved` and
   commit the spec documents on their own: `{{script:commit-spec}} {{arg:spec}} tasks` (a `docs` commit
   with `Refs: <ID>` and a fixed subject; never pushed). Pushing subtasks to the tracker is not
   available yet. Next: `{{script:next}} {{arg:spec}} --harness <this harness>` names the command that follows; give it, with the new-conversation action first when `newSession` from `mandao approve` says so (ADR 0038) and, if that conversation would not be inside the worktree, the step back into it.
