---
schema_version: 1
id: implement
title: Implement
description: "Run the Leader → Implementer → Reviewer loop task by task, with checkpoints after every step and a commit after each Reviewer PASS."
status: stable
flow: { after: [tasks], next: [verify] }
arguments:
  - name: spec
    description: "Spec folder or id"
    required: true
  - name: task
    description: "Optional task id (default: the next eligible task)"
inputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/tasks.md", required: true }
  - { path: "{{paths.specs}}/<ID>-<slug>/progress.yml" }
outputs:
  - { path: "(code)", description: one local commit per task after PASS }
  - { path: "{{paths.specs}}/<ID>-<slug>/execution.md" }
  - { path: "{{paths.specs}}/<ID>-<slug>/progress.yml" }
  - { path: "{{paths.specs}}/<ID>-<slug>/tasks.md" }
capabilities: [read, search, edit, shell, agents]
templates: [rules/review.md, rules/clean-code.md, rules/test-policy.md, rules/commits.md, spec/execution.md, spec/pivot-record.md]
scripts: [where, models, tasks, brief, loop, checkpoint, tests, commit-msg]
---

# /mandao-implement

Spec: {{arg:spec}} · task: {{arg:task}}

You are the **Leader** for this spec, in this session (subagents cannot start subagents). You do not
write production code yourself. Use `{{language.technical}}` for notes; code and commits are English.

## 0. Before the first task

1. `{{script:where}} {{arg:spec}}` — if this session is not in the spec's worktree, stop and tell the user
   the path to open. Mandao never creates branches here.
2. `{{script:models}} --harness <this harness>` — compare **your own model** with `leader`. On a mismatch,
   warn (the Leader should run on `<leader>`) and continue.
3. Read `progress.yml`: if a task is in progress, continue it as `/mandao-resume` would.

## 1. For each task

Pick the task: `{{arg:task}}` or `next` from `{{script:tasks}} {{arg:spec}}` (stop if it reports
`blocked`). Then repeat until the task is done, halted or pivoted, following
`{{script:loop}} {{arg:spec}} <Tn> --harness <this harness>` at every step:

1. **Checkpoint** before anything else:
   `{{script:checkpoint}} {{arg:spec}} --task <Tn> --phase implementing --harness <h> --model <implementer model> --verdict STARTED --tier <tier> --attempt <n> --implementer <model> --next "<what comes next>"`.
   Checkpoints are the only memory between sessions: write one after every step below.
2. **Brief:** `{{script:brief}} {{arg:spec}} <Tn> --harness <h>` gives the clauses, files, exemplar,
   gates, skills, lenses, models and impacted tests.
3. **Implement** in a fresh context with the implementer for the tier:
<!-- mandao:if harness=claude -->
   the `mandao-implementer-<tier>` agent (or `mandao-implementer` in simple mode).
<!-- mandao:endif -->
<!-- mandao:if harness=copilot -->
   the `mandao-implementer-<tier>` custom agent (or `mandao-implementer` in simple mode) as a subagent.
<!-- mandao:endif -->
<!-- mandao:if harness=codex -->
   the `mandao_implementer_<tier>` custom agent (or `mandao_implementer` in simple mode). Codex loads
   `.codex/agents/` only in a trusted project; when the agent is not available, say so and record
   `reduced independence` with your own model as the implementer.
<!-- mandao:endif -->
   Send only the brief. When it reports: checkpoint with `--phase awaiting-review --verdict REPORTED`.
4. **Gates and impacted tests** (`{{template:rules/test-policy.md}}`): run the project's level 0 gates,
   and the impacted tests with `{{script:tests}} <project> <changed files>` — never the full suite.
   `DEFERRED_TO_CI` is not a PASS: record it on the checkpoint with
   `--deferred "<tests>|<reason>"`; the spec cannot reach `verified` until CI confirms those tests.
5. **Review** in a separate agent or process — never in your own context — by the reviewer `loop`
   names (`reviewer` or `reviewer_alt`), with only the diff, the brief and the active lenses
   (`{{template:rules/review.md}}`, `{{template:rules/clean-code.md}}`).
<!-- mandao:if harness=codex -->
   In Codex: the `mandao_reviewer` custom agent; if custom agents are not loaded, run the review as a
   separate process: `codex exec -m <reviewer model> -s read-only "<brief, diff and rules>"`.
<!-- mandao:endif -->
   The execution row records the model that **actually** reviewed. If the review could only run in your
   own context, it is not independent: record `reduced independence` and your own model, never the
   configured one. The Reviewer never runs on a lower tier or effort than the Implementer.
6. **Verdict:**
   - **FAIL** → checkpoint `--verdict FAIL --phase rework-<n>` with the findings; back to step 3. `loop`
     moves the task one tier up after 2 FAILs and returns `halt` after 3 FAILs at strong: stop, report.
   - **The spec is wrong** → write a Pivot Record (`{{template:spec/pivot-record.md}}`) in `execution.md`,
     checkpoint `--verdict PIVOT`, and wait for the user's sign-off. No retries are consumed.
   - **PASS** → commit (step 7). Advisories go to `## Advisories` and never reopen the loop.
7. **Commit** locally, no confirmation needed, never push. If the harness sandbox blocks writing git
   metadata, do not work around it: checkpoint `--verdict PASS --commit —` with the next step
   "commit <Tn>", and stop; the next session or another harness commits. Otherwise: message from
   `{{script:commit-msg}} {{arg:spec}} <Tn> <subject>` (`{{template:rules/commits.md}}`), with `tasks.md`
   updated in the same commit (`--done <Tn>` on the checkpoint before committing). Then checkpoint
   `--verdict PASS --commit <sha> --clear` (or the next task) so `execution.md` records the hash.

The Definition of Done includes the module's `AGENTS.md` and, when the workspace uses Claude Code, its
`CLAUDE.md` pointer.

## 2. After the last task

Report: tasks done, FAILs and escalations, reduced or provider independence, deferred tests, commits.
Next: {{command:verify}}.
