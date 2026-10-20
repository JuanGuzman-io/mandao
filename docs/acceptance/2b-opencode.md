# Iteration 2b acceptance — OpenCode with OpenCode Zen free models

Run by the Leader from the terminal, on **the Mandao repository only**: free models may use data for
training, so no private code goes through them. Implementer and Reviewer run on two different free
models (the optional `opencode-zen` set, ADR 0027).

## Prerequisites (the maintainer)

- OpenCode 2.1.1 – 2.x installed (`opencode --version`).
- In the OpenCode TUI: `/connect` → **OpenCode Zen**. Then `opencode auth list --format json` lists the
  `opencode` provider.

## Setup (the Leader, in a throwaway worktree)

```sh
git worktree add -b chore/opencode-acceptance ../mandao.worktrees/opencode-acceptance main
cd ../mandao.worktrees/opencode-acceptance && npm ci && npm run build
node dist/cli.js harness add opencode        # Claude Code and Codex stay active: the real mix
node dist/cli.js models set implementer opencode/glm-5.3-flash-free --harness opencode
node dist/cli.js models set reviewer opencode/beam-free --harness opencode
node dist/cli.js doctor                      # providers: opencode; version in range; the Zen offer
```

## Checks

| # | Check | How | Expected |
|---|---|---|---|
| 1 | Commands visible, once | `ls .opencode/commands`; `opencode run "/mandao-resume"` | One file per mandao; the dashboard prints from the command, not from a skill |
| 2 | One copy of each Mandao skill | `opencode run "List every skill whose name starts with mandao-"` | None listed: `.opencode/opencode.jsonc` hides the `.claude/skills` and `.agents/skills` copies |
| 3 | Models per role | `.opencode/agents/mandao-implementer*.md` and `mandao-reviewer.md` `model:` lines | `opencode/glm-5.3-flash-free` and `opencode/beam-free`; the Reviewer with edit and bash denied |
| 4 | Handoff from Claude Code | In Claude Code: `spec-new` + a one-task spec, checkpoint `STARTED`, stop. Then `opencode run "/mandao-resume MDO-xxxx"` | Reads the checkpoint, offers review / continue / discard, uses OpenCode's models |
| 5 | Implementer in OpenCode | Continue the task in OpenCode with `mandao-implementer-standard` | `RED` row recorded with `mandao run red`, then REPORTED with the agent identity `glm-5.3-flash-free` |
| 6 | Review as a separate process | `node dist/cli.js run review MDO-xxxx T1 --via opencode --brief … --gates …` | `VERDICT` parsed; the row records `opencode/beam-free` as reviewer and `provider independence` if implemented elsewhere |
| 7 | Commit and clean up | `mandao run commit`; then remove the worktree and branch | One commit with trailers; nothing left behind |

Record the OpenCode version, each result, and any difference between what a model says it is and what
Mandao recorded (`identity mismatch`).
