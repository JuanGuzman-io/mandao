# 0060 — Gates from the start, task-scoped commits

**Status:** Accepted (Phase 17). Amends ADR 0021 (pending commits) and the phase 11 out-of-scope brake.

## Context

The beta trial (MDO-0001, MDO-0002) hit the same walls on every task: a new project ran its first
implementation with no lint, format or typecheck gate because the constitution left them open and nothing
picked them up; `run commit` asked for a `build` gate at the end; security gates were configured
mid-implementation; T1 could not pass its own build gate; the evaluation gate had no slot; red runs called a
bare `pytest` from the repository root; one deferred e2e run was logged three times and blocked verify in a
repository without CI although it had passed locally; a task's manifest took every change in the tree, so the
`tasks.md` edits, the lock and other tasks' files needed separate commits; per-task cost depended on the agent
remembering; and a hand edit of a log kept no reason.

## Decision

1. **Gates in one approval.** The constitution proposes every gate a later command needs (format, lint,
   typecheck, test, `build` or `none`, secrets, sast, audit, `eval` when it applies), as proposed in
   `standards.md` when no manifest exists. `approve tasks` / `run tasks` refuse a project with no gates unless a
   task declares `.mandao/config.yml`, and a first code task with no test file where there is a test gate.
2. **`eval` gate** (PE decision): runs only in verify (`run tests <project> --eval`) and by hand, never among
   the task gates.
3. **Red and mutation runs** use `tests.impacted`, else the test gate when it runs the detected runner, else the
   runner's command, from the project folder with project-relative files.
4. **Deferred runs:** no duplicates; `run tests <project> --spec <ID> --deferred <task>` runs them here and a
   PASS clears them; without CI, verify names that run.
5. **Task-scoped manifests** (PE decision: out-of-list files only when named): the review pack, the PASS
   manifest and the commit cover the task's declared files, `--include` files and what the phase 11 brake
   accepts; the lock also rides with the task's config change; `run commit` compares only the approved paths.
   A queued task's box, `files` and `kind` edits, written by `run task-files`, ride with its commit.
6. **Cost in the commit:** `run commit` records the task cost (Claude transcript, `--usd` elsewhere) and never
   blocks on it.
7. **Discrepancy reason** (PE decision: refuse, not warn): checkpoint and commit refuse after a hand edit of a
   script log until `--discrepancy-reason` is given; the reason is recorded with the row.

## Consequences

- Unrelated changes in the tree no longer block a task commit; they stay uncommitted, visible to the user.
- A file of the task that is neither declared nor named is left out of its review and commit; the Leader names
  it with `--include` or declares it with `run task-files`.
- Projects without a test gate, or whose first task is docs or chore, are not checked for a test file; the build
  entry-file check stays a rule for the planner, not a refusal.
