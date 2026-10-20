---
schema_version: 1
id: resume
title: Resume
description: "Without an id: dashboard of active specs. With an id: continue that spec from its last checkpoint, in any harness."
status: stable
flow: { after: [], next: [implement] }
arguments:
  - name: spec
    description: "Spec id to continue (empty for the dashboard)"
inputs:
  - { path: "{{paths.specs}}/" }
  - { path: "{{paths.specs}}/<ID>-<slug>/progress.yml" }
outputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/progress.yml" }
  - { path: "{{paths.specs}}/<ID>-<slug>/execution.md" }
capabilities: [read, search, edit, shell, agents]
templates: [rules/review.md]
scripts: [where, models, tasks, loop, checkpoint, commit]
---

# /mandao-resume

Spec: {{arg:spec}}

## Without a spec id: dashboard

For each folder in `{{paths.specs}}/` with a `story.md`, show: id, title, status, the task in progress
and its phase (from `progress.yml`), blockers (`OPEN`, HALT, pivots, `DEFERRED_TO_CI`), commits pending
(`pending_commits` in `progress.yml`), and the next mandao to run. Stop there.

## With a spec id: continue

1. **Place.** `{{script:where}} {{arg:spec}}`. Outside the spec's worktree: stop and give the path.
2. **Checkpoint.** Read `progress.yml` and the last rows of `execution.md`. Say what was happening,
   in which harness and on which model, the open questions and the recorded next step.
3. **Models.** Use `models.yml` for **this** harness: `{{script:models}} --harness <this harness>`.
   Never assume the previous harness's models are available here.
4. **Commits pending.** Tasks in `pending_commits` passed review; their changes are not "uncommitted
   work". Commit them first with `{{script:commit}} {{arg:spec}}` (local, one commit per task, never
   pushes). If this harness cannot write git metadata either, tell the user to run that command, and
   leave their files out of step 5.
5. **Uncommitted work.** If `git status` shows other changes and the checkpoint has a task in progress,
   show the diff summary and offer exactly three options:
   - **review the diff as it is** → checkpoint `--verdict REPORTED --implementer <agent>@<harness of the
     checkpoint>` (the agent that was running, never a model name) and go to the review step;
   - **continue implementing** → brief the implementer with the diff as the starting point;
   - **discard and redo the task** → only after confirming, restore the task's `files` (from `tasks.md`) and start it again. Never restore `{{paths.specs}}/`: it holds the checkpoint and rows of tasks that already passed.
6. **Provider independence** is recorded by the scripts when the implementer and the reviewer ran in
   different harnesses; `{{script:loop}} {{arg:spec}} <Tn> --harness <h>` reports it.
7. **Continue** with the `/mandao-implement` loop from that step, checkpointing as it does
   (`{{script:checkpoint}}`).
