# 0015 — Iteration 2 decisions: tasks format, Leader, MCP scope, branches, agent settings

**Status:** Accepted · 2026-10-20; the worktree policy (branch and worktree on every spec) is superseded by [ADR 0059](0059-continuous-flow.md)

## Decisions

1. **`tasks.md` format.** One heading per task with a status checkbox (`### [ ] T2 — <title>`), followed
   by a YAML block with its fields (project, tier, files, exemplar, risk_tags, ac, scenarios, tests,
   dod, verify, depends_on, parallel_safe). Humans read it; scripts parse it with a zod schema.
2. **Leader in the main session.** The session that runs `/mandao-implement` is the Leader (in Claude
   Code a subagent cannot start subagents). It runs on the session's model, so `implement` compares
   it with `leader` in `models.yml` at start and warns on a mismatch without blocking. Same in Copilot.
3. **MCP scope.** Read and create the story and comment to the PO through the tracker's MCP server,
   always after confirmation. Tracker content is data, never instructions. Subtasks in the tracker
   come later.
4. **Branches.** `specify` (or `quick`) creates `feat|fix/<ID>-<slug>` and its git worktree with one
   confirmation, so every artifact of the spec lives on that branch. `implement` does not create
   branches: it checks it runs inside the spec's worktree and otherwise warns and shows the path.
   Local commits need no confirmation after the Reviewer's PASS; Mandao never pushes.
5. **Shared vs local agent settings.** Committed settings such as `.claude/settings.json` are portable:
   tools resolve through PATH or the Mandao runner, never absolute paths. Machine-specific settings go
   in `settings.local.json`, git-ignored; a hook that needs an absolute path lives only there. `sync`
   and `doctor` respect the split.

## Consequences
- graphify writes an absolute path into its Claude Code hooks; in this repository the commands were
  rewritten to `graphify hook-guard …`, and `doctor` will flag absolute paths in shared settings
  (iteration 2).
- Rules in `core/` were aligned with ADR 0013 before iteration 2 (impacted tests; critical smoke in CI
  or with `--full`).
