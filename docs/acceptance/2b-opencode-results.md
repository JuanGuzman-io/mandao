# Iteration 2b acceptance — OpenCode results (2026-10-20)

OpenCode **2.1.1**, OpenCode Zen free models with no login (`opencode models` lists them;
`opencode auth list` is empty). Public code only: the Mandao repository. Implementer
`opencode/glm-5.3-flash-free`, Reviewer `opencode/beam-free` (optional set `opencode-zen`).
Throwaway branches `chore/opencode-acceptance` and `feat/MDO-0003-count-pinned-skills`, removed after.

| # | Check | Result | Evidence |
|---|---|---|---|
| 0 | Setup and doctor | ✅ after two fixes | Detection saw no provider (ADR 0029, edb6798); doctor flagged Zen models as unknown and the offer left leader/tester on Anthropic (3a4fcc2) |
| 1 | Commands visible, once | ✅ files and loading; ⚠️ not invocable from `opencode run` | 13 files in `.opencode/commands/`. OpenCode 2's `run` sends the message as plain text (no slash parsing, `--command` removed), so a command is invoked from the TUI or the server API only |
| 2 | One copy of each Mandao skill | ✅ | The model listed 120 skills, none `mandao-*`; `opencode debug agents` shows `skill mandao-* deny` on every agent |
| 3 | Models per role | ✅ | `opencode debug agents`: `mandao-reviewer` mode `all`, `opencode/beam-free`, edit/shell/webfetch/subagent denied; `mandao-leader` primary on `glm-5.3-flash-free` |
| 4 | Handoff from Claude Code | ✅ state; ⚠️ model and skill | OpenCode read Claude Code's STARTED checkpoint and the next step. Run as plain text it used the default `build` agent on `big-pickle` (a free model whose data may be used) and the user's global AKILI resume skill, and quoted recommendations instead of `mandao run models` |
| 5 | Implementer in OpenCode | ✅ | `opencode run --agent mandao-implementer-standard`: RED (2 failed for `unknown option '--count'`), green, `npm run check` 285 tests; rows carry `opencode/glm-5.3-flash-free` from the agent file |
| 6 | Review as a separate process | ✅ | `mandao run review --via opencode`: `VERDICT: PASS` parsed, row with `opencode/beam-free` from the process, review saved |
| 7 | Commit | ✅ after a fix | `--pending-commit` refused the PASS already written by `review --via` (fixed in e07cde8); then one commit 3fe7e3e with trailers, PASS row inside, `trace` clean |

Evidence: `evidence/2b-opencode-MDO-0003-execution.md`, `evidence/2b-opencode-MDO-0003-review.md`.

## Open

- **Invoking mandaos non-interactively in OpenCode 2** needs the server API (`session.command`); until
  then the TUI is the way, and `implement` / `resume` checklists say so.
- **Global skills leak into OpenCode**: OpenCode reads `~/.claude/skills`, so a user's other SDD skills
  (AKILI here) compete with Mandao's commands when a mandao is typed as plain text.
- The optional-set offer still shows after the set is applied (cosmetic).
