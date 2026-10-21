# Backlog

Work the maintainer has agreed to do and has not opened yet. Each item becomes a spec (or a quick)
only when the maintainer opens it; until then it lives here, not in an agent's memory.

| Item | Kind | Depends on | Status |
|---|---|---|---|
| [Launcher version](#launcher-version) | quick | MDO-0011 closed | next, from `main` in its own worktree |
| [MDO-0012 — Delivery and research](#mdo-0012--delivery-and-research) | spec | MDO-0011 | agreed |
| [MDO-0013 — Deliveries inside a spec](#mdo-0013--deliveries-inside-a-spec) | spec | MDO-0011 | agreed |
| [MDO-0014 — Parallel tasks](#mdo-0014--parallel-tasks) | spec | — | agreed |
| [Migrate MDO-0008 to MDO-0010 to layout v2](#migrate-mdo-0008-to-mdo-0010-to-layout-v2) | spec | MDO-0011 proven | agreed |
| [Security quick before the beta](#security-quick-before-the-beta) | quick | — | agreed |
| [Rules enforced by script](#rules-enforced-by-script) | spec | — | agreed |
| [Security gates from the user's CI](#security-gates-from-the-users-ci) | spec | MDO-0012 (delivery) | agreed |

## Launcher version

`.mandao/bin/mandao.mjs` compares the version of the `mandao` it is about to run (local, global or
`npx`) with the one pinned in `mandao.lock`.

- On a mismatch it runs the pinned version (`npx mandao@<lock version>`); when it cannot, it warns
  and records the mismatch.
- `mandao doctor` reports the mismatch too.
- In the Mandao repository (dogfooding) it prefers the worktree's own build.
- A test reproduces the case: an old global install, a newer lock.

## MDO-0012 — Delivery and research

**Delivery after close or quick** (new ADR; updates `MANDAO-DESIGN.md`). "Never push" becomes "push
and PR only with confirmation".

1. **Target from `branching`:** env-branches → PR to the first branch of `promotion`; gitflow →
   `develop`; trunk or feature-branch → `main` (or `base`).
2. **No `branching`:** ask whether the merge goes to the worktree's base branch and save the answer
   in `config.yml`.
3. **One grouped confirmation:** push, PR to the target, merge when CI is green (merge commit, never
   squash), and cleanup. Options: everything / only push and PR / nothing. A failing CI is shown and
   never merged.
4. **Progressive promotion:** after a merge into an environment branch, offer the PR to the next
   environment in `promotion`, always confirmed. Never push to `protected` branches.
5. **Cleanup:** leave the worktree (automatic in Claude Code, a printed command elsewhere), update
   the base branch, delete the worktree and the local and remote branches. Uncommitted changes stop
   and ask. This mirrors the automatic move into the worktree at start.

**Delivery record and `release-status`,** with no extra commit to a protected branch:

1. **Before the merge, in the same PR:** the delivery step writes the target and the PR URL into
   `close-summary.md` `Delivery` and adds the spec's line to `docs/CHANGELOG.md`.
2. **After the merge, derived from git:** `mandao run release-status <ID>` finds the `Refs: <ID>`
   commits, the branches that contain them and, with `branching.promotion`, the environment reached
   ("in dev", "released on main"), with merge date and SHA. Nothing is stored in a file.
3. `resume`, `doctor` and the README show where each spec is through `release-status`.
4. **Check:** MDO-0009 reports released on `main`, PR #1, merge `99451ba`.

Lessons from doing it by hand after MDO-0009: `mandao worktree clean` removes every merged worktree,
not only the current one; the worktree guard blocks `git -C <main checkout>`, so leave the worktree
first; `git branch -d` refuses a branch ahead of its upstream even when it is in `main`, so check
`merge-base --is-ancestor` first; `git worktree remove` needs `--force` for untracked files, so look
at them first.

**Research with sources in specify,** modelled on Spec Kit's phase 0 of `plan`:

- Each `[NEEDS RESEARCH]` becomes a research task delegated to a subagent ("Research <unknown> for
  <feature context>"), so the Leader's context stays light; the tasks can run in parallel.
- The result goes to `research.md`, present only when there was research: Decision, Rationale,
  Alternatives considered, and a **source with URL and date for every claim**. A claim without one
  is marked "unverified (model knowledge)".
- It is a gate: the design is not approved while a `[NEEDS RESEARCH]` is open.
- `research.md` joins the layout manifest (MDO-0011) as a conditional file.

## MDO-0013 — Deliveries inside a spec

Big specs split the execution, not the spec.

1. **Criterion before proposing separate specs** (story, specify and tasks rules): separate specs
   only when the parts have value on their own, ship independently and have independent AC. One
   story for the PO, or dependent AC, means one spec. The proposal states the criterion; the user
   decides.
2. **Deliveries in `tasks.md`:** tasks are grouped by delivery; each delivery declares the AC it
   meets end to end and depends only on earlier deliveries.
   - At the end of a delivery: a checkpoint, a partial verify of its AC, and optionally its own PR
     stacked on the previous one. `pr-plan` proposes the cut by delivery past the size thresholds.
   - The final verify covers every AC; one close per spec.
   - `next` and `resume` show "delivery 2 of 3". Delivery boundaries are recommended session cuts.
   - With a tracker, deliveries (or tasks) can be pushed as sub-tasks of the story.
3. **When tasks proposes deliveries:** more than N tasks (configurable), or a PR foreseen above the
   threshold. Always grouped by AC, never by technical layer.

## MDO-0014 — Parallel tasks

Several subagents run tasks at the same time.

1. **Eligibility, decided by a script:** two tasks run in parallel only when they are in the same wave,
   do not depend on each other, both have `parallel_safe: true`, and their `files` lists do not
   overlap. Overlapping tasks run in sequence even when they declare `parallel_safe`.
2. **Isolation:** each parallel task works in its own sub-worktree (a branch from the spec's branch)
   with its own setup, and is integrated into the spec's branch once its review passes. The spec
   measures the setup cost per sub-worktree (dependencies) and proposes how to reduce it without
   linking `node_modules`.
3. **Queued commits:** one per task, in the order the tasks reach PASS, with their trailers. A conflict
   on integration sends the task back to rework; it is never resolved silently.
4. **Configurable limit:** `resources.max_parallel_tasks` (default 2). The resource guard and the
   queue for heavy runs still apply. The Testers writing the red tests of parallel tasks can run in
   parallel too.
5. **Visibility:** `status` and `resume` show which tasks run in parallel and the phase of each. A
   session cut waits for the running tasks to finish.
6. **Measurement:** Kaizen compares total time and cost with and without parallelism. The goal is
   less time, not less cost; a cost increase is reported.

## Migrate MDO-0008 to MDO-0010 to layout v2

Taken out of MDO-0011 before implement (MDO-0011 C-5). It runs once layout v2 has been proven on a
real spec; until then the scripts read both layouts by the story's `schema_version`.

## Security quick before the beta

Before the beta is published.

- **Skill sources over `https:` only.** `http:` and `file:` sources are refused, with a test.
- **The user's `GIT_SSH_COMMAND` is kept.** When BatchMode is needed, it is added without
  overwriting the user's setting.
- **Graphify install, checked.** When the catalog source is the whole repository with no skill path,
  it is not copied whole into the skill folders: use its own installer, or the skill folder the
  repository defines.

Related, already listed: [maintainer-checklist.md](maintainer-checklist.md#secret-scanning-and-dependency-security)
and the [exposure audit](security/exposure-audit.md).

## Rules enforced by script

Rules the commands state as prose become checks a script enforces.

- **Loop brake.** When `run step` returns the same action for the same task N times in a row
  (default 3) with no progress in the log, it returns HALT with the reason and the options.
- **A new test that passes on its first run.** `run step` stops asking for red and offers `mutation`
  evidence (existing behavior) or a review of the test.
- **`run commit` never drops files outside the task's list.** When the diff holds undeclared files it
  stops and asks to update the list; it never commits a state that does not build.
- **The test gate is not `NOT_INSTALLED` when the runner exits successfully.** A "command not found"
  in a test's output does not decide the gate's status.
- **Deleting tests to meet a linter limit is a FAIL for the Reviewer;** the file is split instead.
- **Close refuses an unresolved `ASSUMPTION` or `CONFLICT`.** Each one is marked resolved (with the
  decision and the link) or moves to this backlog with an owner.
- **`mandao approve` can revoke an approval.** The revocation is recorded with its reason; nothing is
  deleted.
- **Decide where `.integrity.json` lives:** in git on every task, only at close, or outside git.
- **Red first only for the tests the task added or changed.** The red-first guard (`testsWithoutRed`)
  asks for red only for tests added or changed in the task's diff against the base, not for every test
  in the declared files. A declared file the diff does not touch asks for nothing (MDO-0011 T4 pivot).

## Security gates from the user's CI

- **`constitution` detects scanning in the project's CI** (GitHub Actions, GitLab CI and others):
  secret scanning and SAST. It records the result in `infrastructure.md` as
  `security_scanning: local | ci | none`, and `doctor` checks it again.
- **verify follows what exists:**
  - local tools available → they run;
  - no local tools, but the CI scans → "pending: PR CI", and delivery merges only with the CI green;
  - neither → reported; tasks with a security tag require `mandao approve <spec> security-gaps`,
    offering to install the tools (the command for the operating system, confirmed) or a quick that
    adds scanning to the CI.
- **Before merging, delivery reads the PR's real checks** and warns when none is a security check.
- **A scan that ran nowhere is never reported as PASS.**
