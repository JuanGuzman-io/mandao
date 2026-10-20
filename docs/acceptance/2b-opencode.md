# Iteration 2b acceptance — OpenCode, from the terminal

Run by the Leader once OpenCode (2.1.1 – 2.x, ADR 0025) is installed and a provider is configured.

| # | Check | How | Expected |
|---|---|---|---|
| 1 | Version and providers | `opencode --version`; `node dist/cli.js doctor` | 2.x in range; `opencode: providers configured: …`; no role on an unconfigured provider |
| 2 | Commands visible, once | `harness add opencode` in a throwaway worktree with Claude Code and Codex also active; list `.opencode/commands/`; `opencode run "/mandao-resume"` | One command per mandao; the dashboard prints |
| 3 | One copy of each Mandao skill | `opencode run "List every skill you can load whose name starts with mandao-"` | None: `permission.skill` hides the `.claude/skills` and `.agents/skills` copies |
| 4 | Models per provider | `.opencode/agents/*.md` vs `node dist/cli.js models --harness opencode` | The set matching the detected providers; Reviewer `mode: all` with edit and bash denied |
| 5 | Handoff from Claude Code | Start a task in Claude Code (checkpoint STARTED), stop; `opencode run "/mandao-resume MDO-xxxx"` | It reads the checkpoint, offers review / continue / discard, uses OpenCode's models |
| 6 | Review as a separate process | `node dist/cli.js run review <spec> <Tn> --via opencode --brief … --gates …` | A `VERDICT` parsed, the row records OpenCode's reviewer model |
