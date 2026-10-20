---
schema_version: 1
id: tasks
title: Tasks
description: "Break an approved spec into Tn tasks with project, tier, files, risk tags, tests, AC, DoD and dependencies."
status: stable
flow: { after: [specify, clarify], next: [implement] }
arguments:
  - name: spec
    description: "Spec folder or id"
    required: true
inputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/requirements.md", required: true }
  - { path: "{{paths.specs}}/<ID>-<slug>/design.md", required: true }
outputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/tasks.md" }
  - { path: "<project>/{{paths.specs}}/<ID>/spec-ref.md", description: polyrepo slices }
capabilities: [read, search, edit, shell]
templates: [spec/tasks.md, rules/test-policy.md, rules/traceability.md, rules/review.md]
scripts: [where, trace, tasks]
approval: required
---

# /mandao-tasks

Spec: {{arg:spec}}

Write task content in `{{language.technical}}`; headings, ids and YAML keys stay in English.

1. **Gate.** Run `{{script:where}} {{arg:spec}}`; work in the spec's worktree. Run
   `{{script:trace}} {{arg:spec}}`: a critical `OPEN` or critical Consistency Check finding blocks this
   mandao — stop and recommend {{command:clarify}}.
2. **Write `tasks.md`** from `{{template:spec/tasks.md}}`: `### [ ] Tn — title` plus a YAML block per
   task with project, tier (`fast | standard | strong`), files and modules from the graph, an exemplar
   file, risk tags (`{{template:rules/review.md}}`), the AC and scenario clauses it implements
   (`{{template:rules/traceability.md}}`), the tests the policy requires
   (`{{template:rules/test-policy.md}}`), DoD (module `AGENTS.md` and its `CLAUDE.md` pointer), a verify
   command, dependencies and parallel safety.
<!-- mandao:if multiProject -->
3. **Order across projects:** contract → back and front in parallel against a mock → integration → e2e.
<!-- mandao:endif -->
<!-- mandao:if mode=polyrepo -->
4. **Slices:** in each touched repository write `{{paths.specs}}/<ID>/spec-ref.md` (link and summary),
   that repository's tasks and the contract, on the same branch name.
<!-- mandao:endif -->
5. **Check:** `{{script:tasks}} {{arg:spec}}` must show no issues and no cycles;
   `{{script:trace}} {{arg:spec}}` must show no `UNPLANNED` or `BROKEN_REF`. Fix and re-run.
6. **Approve:** show the waves and the first eligible task; on approval set `status: approved`.
   Pushing subtasks to the tracker is not available yet. Next: {{command:implement}}.
