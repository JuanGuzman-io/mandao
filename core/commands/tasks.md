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
templates: [rules/spec-docs.md, spec/tasks.md, rules/test-policy.md, rules/traceability.md, rules/review.md, rules/doc-tasks.md]
scripts: [where, trace, tasks, commit-spec]
approval: required
---

# /mandao-tasks

Spec: {{arg:spec}}

Write task content in `{{language.technical}}`; headings, ids and YAML keys stay in English.

At lite depth with 3 tasks or fewer, `/mandao-specify` already wrote them inline in `spec.md`: there is
nothing to do here. Otherwise:

1. **Gate.** Run `{{script:where}} {{arg:spec}}`; work in the spec's worktree. Run
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
   - `evidence`: `tdd`, `mutation` (it only pins down existing behavior) or `none`;
   - `verify`, `depends_on`, `parallel_safe`.
   The module `AGENTS.md` (and its `CLAUDE.md` pointer) is part of every task's definition of done; do
   not list it.
3. **Premises that a run can prove:** a High premise in `design.md` still `UNVERIFIED` whose proof is a
   command goes into the **Done when** of the first task that can run it (recorded with
   `mandao run premise`), so a false premise fails in implement, not in verify. A search never counts as
   proof.
4. **Write `## Overview`:** `{{script:tasks}} {{arg:spec}} --index --write` generates it from the details,
   grouped by acceptance criterion, with a checkpoint per group. Never edit it by hand.
<!-- mandao:if multiProject -->
5. **Order across projects:** contract → back and front in parallel against a mock → integration → e2e.
<!-- mandao:endif -->
<!-- mandao:if mode=polyrepo -->
6. **Slices:** in each touched repository write `{{paths.specs}}/<ID>/spec-ref.md` (link and summary),
   that repository's tasks and the contract, on the same branch name.
<!-- mandao:endif -->
7. **Check:** `{{script:tasks}} {{arg:spec}}` must show no issues and no cycles;
   `{{script:trace}} {{arg:spec}}` must show no `UNPLANNED` or `BROKEN_REF`. Fix and re-run.
8. **Approve:** show the overview and the first eligible task. The user may approve from the terminal instead (`mandao approve {{arg:spec}} tasks`, no model session): when they say so, the status and `_log/approvals.yml` already show it, and the commit is made; do not ask again. On approval in the session set `status: approved` and
   commit the spec documents on their own: `{{script:commit-spec}} {{arg:spec}} tasks` (a `docs` commit
   with `Refs: <ID>` and a fixed subject; never pushed). Pushing subtasks to the tracker is not
   available yet. Next: {{command:implement}}.
