# Backlog

Work the maintainer has agreed to do and has not opened yet. Each item becomes a spec (or a quick)
only when the maintainer opens it; until then it lives here, not in an agent's memory.

| Item | Kind | Depends on | Status |
|---|---|---|---|
| [Launcher version](#launcher-version) | quick | — | next |
| [MDO-0012 — Delivery and research](#mdo-0012--delivery-and-research) | spec | MDO-0011 | agreed |
| [MDO-0013 — Deliveries inside a spec](#mdo-0013--deliveries-inside-a-spec) | spec | MDO-0011 | agreed |
| [Migrate MDO-0008 to MDO-0010 to layout v2](#migrate-mdo-0008-to-mdo-0010-to-layout-v2) | spec | MDO-0011 proven | agreed |
| [Security quick before the beta](#security-quick-before-the-beta) | quick | — | scope to confirm |
| [Rules enforced by script](#rules-enforced-by-script) | spec | — | scope to confirm |
| [Security gates from the user's CI](#security-gates-from-the-users-ci) | spec | — | scope to confirm |

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

## Migrate MDO-0008 to MDO-0010 to layout v2

Taken out of MDO-0011 before implement (MDO-0011 C-5). It runs once layout v2 has been proven on a
real spec; until then the scripts read both layouts by the story's `schema_version`.

## Security quick before the beta

A quick before the beta release. Pending items already listed in
[maintainer-checklist.md](maintainer-checklist.md#secret-scanning-and-dependency-security) and the
[exposure audit](security/exposure-audit.md) (for example the machine paths in MDO-0007's `_log/`).
Scope to confirm with the maintainer when it opens.

## Rules enforced by script

Rules the commands state as prose become checks a script enforces. Scope to confirm with the
maintainer when it opens.

## Security gates from the user's CI

Security gates chosen from what the user's CI already runs. Scope to confirm with the maintainer
when it opens.
