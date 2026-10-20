# 0037 — `mandao start` and the worktree setup

**Status:** Accepted · 2026-10-20 · design §14.5

MDO-0007 ran its lite session from the main checkout: `specify` created the worktree, but the session
stayed outside it and `implement` correctly refused to work there. Claude Code can move a session into an
existing worktree (`EnterWorktree`), but only with an approval that no rule can suppress, its hooks keep
pointing at the main checkout, and no other harness documents an equivalent.

## Decision

- **`mandao start "<description|ID>"` is the default entry point.** It resolves the id (a tracker id as
  given, otherwise the next local id, as `spec-new` does), creates the branch from `branching.base` (or
  `hotfix.from` with `--hotfix`) and the worktree, and runs the whole setup of §14.5 as a script with no
  model tokens: env files, dependencies by lockfile, project setup hooks, the graph cache and a baseline
  of the cheap gates. It leaves the request in the spec's `_log/start.yml` for the first command and prints
  the exact command to open the harness there (`--open` launches it when the harness CLI allows it:
  Claude Code and Codex). `mandao start --quick "<description>"` does the same for quick changes.
- **Fallback:** `specify` and `quick` run from the main checkout still create the worktree, and then show
  how to continue there (`cd <worktree> && claude --resume <session>`, or the harness's equivalent).
  `implement` keeps refusing to work outside the worktree.
- **Optional in Claude Code:** `EnterWorktree` as a convenience, never the base of the flow.
- **Env files: `.mandao/worktree-include` replaces the `.env*` patterns of the original design.** Only the
  files it lists (and the ones in Claude Code's `.worktreeinclude`, one shared list) are copied, never
  symlinked; a listed file must be gitignored, and a tracked one is skipped with a warning.
- **Cleanup:** `close` offers to remove the worktree after merge (`worktrees.cleanup: ask |
  auto-after-merge | never`); `mandao worktree list | clean` removes only merged worktrees that hold no
  work, never forced.

## Recommended flow

`mandao start` → open the harness in the worktree → lite session → `mandao approve` → continue in the
same session.

## Open

Isolated local services per worktree (a compose project name and a port offset in the copied env), and
disk limits for many parallel worktrees.
