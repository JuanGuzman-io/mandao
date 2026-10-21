# 0037 — `mandao start` and the worktree setup

**Status:** Accepted · 2026-10-20, amended by MDO-0010 (the session enters the worktree in Claude Code) · design §14.5

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
- **Fallback:** `specify` and `quick` run from the main checkout still create the worktree.
  **Amended (MDO-0010):** in Claude Code they then enter it with `EnterWorktree` and the worktree path, and
  continue in the same conversation. The permission prompt the harness shows is the single confirmation.
  If `EnterWorktree` is refused or fails, they print the `resume` field of the `spec-new` output and stop;
  they never go on in the main checkout. The other harnesses print the same field. It is built from the
  active harness's adapter (`session.resume`), so no command text carries a resume command of its own;
  only the `harness=claude` `EnterWorktree` step is a conditional.
- **Re-entry:** the §0 `run where` check of implement, verify and close enters the worktree the same way
  (Claude Code) or prints the `resume` field of the `where` output and stops (the others), before any other step. A new
  conversation that starts outside the worktree is covered by this check.
- **`EnterWorktree` was optional and is now the default in Claude Code.** The hooks keep working because
  `mandao hook graph-guard` resolves its project from its working directory, which is the worktree after
  entering (covered by `test/integration/hook.test.ts`).
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
