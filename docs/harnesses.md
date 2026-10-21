# Harnesses

One canonical source in `core/` is rendered into each harness's own format (ADR 0002, ADR 0007). Every
harness also gets a managed block in `AGENTS.md`, so any other agent can follow the flow.

| Harness | Commands | Personas | Verified | Tested |
|---|---|---|---|---|
| Claude Code | `.claude/skills/mandao-*/SKILL.md` | `.claude/agents/mandao-*.md` | 2026-10-19 | live |
| GitHub Copilot (VS Code) | `.github/prompts/mandao-*.prompt.md` | `.github/agents/mandao-*.agent.md` | 2026-10-19 | snapshots |
| Codex (OpenAI) | `.agents/skills/mandao-*/SKILL.md` (`$mandao-<id>`) | `.codex/agents/mandao-*.toml` | 2026-10-20 | live |
| OpenCode (2.1.1 – 2.x) | `.opencode/commands/mandao-*.md` | `.opencode/agents/mandao-*.md` | 2026-10-20 | **live-tested (TUI)**; non-interactive invocation needs OpenCode 2's server API (OPEN) |
| Antigravity (Google) — **experimental** | `.agents/skills/mandao-*/SKILL.md`, shared with Codex | `.agents/agents/mandao-*.md` | 2026-10-20 | **not live-tested**: snapshots only |
| Any other agent | `AGENTS.md` (managed block) | — | — | — |

- Supported versions per harness are checked by `mandao doctor` (ADR 0025).
- Add a harness to an existing workspace with `mandao harness add <id>` (ids: `claude`, `copilot`,
  `codex`, `opencode`, `antigravity`).
- **Codex** loads `.codex/agents/` only in a trusted project; without trust it has no Implementer or
  Reviewer agents, and `doctor` says so.
- **Claude Code** is the only harness whose session cost Mandao reads by itself (from the session
  transcript). The others record their cost by hand: see [Cost](cli.md#cost).
