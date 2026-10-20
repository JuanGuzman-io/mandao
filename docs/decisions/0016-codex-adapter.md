# 0016 — Codex adapter (OpenAI)

**Status:** Accepted for iteration 2 · verified 2026-10-20 against Codex CLI **0.163.0**
(`openai/codex@rust-v0.163.0`, commit `83086188`, released 2026-10-15)

## Sources
`developers.openai.com/codex/*` now redirects to `learn.chatgpt.com/docs/*`, where the content was read:
- learn.chatgpt.com/docs/agent-configuration/agents-md.md
- learn.chatgpt.com/docs/custom-prompts.md
- learn.chatgpt.com/docs/build-skills.md
- learn.chatgpt.com/docs/config-file/config-basic.md, config-advanced.md, config-reference.md
- learn.chatgpt.com/docs/agent-configuration/subagents.md
- learn.chatgpt.com/docs/non-interactive-mode.md
- learn.chatgpt.com/docs/hooks.md
- learn.chatgpt.com/docs/models.md, pricing.md, enterprise/workspace-model-availability.md
- learn.chatgpt.com/docs/extend/mcp.md
- `openai/codex@rust-v0.163.0`: `codex-rs/core/src/agents_md.rs`, `codex-rs/ext/skills/src/host_roots.rs`,
  `codex-rs/models-manager/models.json` (minimum client versions), `codex-rs/cli/src/main.rs`

## Verified format
| Concern | Codex 0.163.0 |
|---|---|
| Instructions | `AGENTS.override.md`, else `AGENTS.md` (one per directory), global `~/.codex/` first, then from the git root down to the cwd, concatenated, closer wins; combined budget `project_doc_max_bytes` (32 KiB). **Does not read `CLAUDE.md`** |
| Commands | Custom prompts (`~/.codex/prompts/*.md`, user-only, `/prompts:<name>`) are **deprecated in favour of skills**; there is no project-scoped prompt folder |
| Skills | `SKILL.md` with `name` and `description`; project `.agents/skills/` (every directory from cwd up to the repo root), user `~/.agents/skills/`; invoked with `/skills` or `$skill-name`; `agents/openai.yaml` can set `policy.allow_implicit_invocation: false` |
| Model | `~/.codex/config.toml` and project `.codex/config.toml` (only when the project is trusted); `model`, `model_reasoning_effort`, `review_model`; `-m/--model`, `-p/--profile` (separate `~/.codex/<name>.config.toml` since 0.134.0), `-c key=value`; precedence: flags > project > profile > user > managed > defaults |
| Subagents | Supported and on by default; custom agents are TOML files in `.codex/agents/` (project) or `~/.codex/agents/`, fields `name`, `description`, `developer_instructions`, and **their own `model` and `model_reasoning_effort`**; they inherit permissions, provider and MCP servers |
| Separate process | `codex exec -m <model> "<prompt>"` (read-only sandbox by default, `--json`, `--output-schema`, `-o`) and `codex review --uncommitted` |
| Hooks | `.codex/hooks.json` or `[hooks]` in config (project ones only when trusted, each hook reviewed and trusted by hash); events include `PreToolUse`, `PostToolUse`, `SubagentStart`, `Stop` |
| MCP | `[mcp_servers.<name>]` in config.toml |
| Version | `codex --version` → `codex-cli 0.163.0` |

## Decision
- **Adapter `codex`:**
  - mandaos → skills in `.agents/skills/mandao-<id>/SKILL.md` plus `agents/openai.yaml` with
    `policy.allow_implicit_invocation: false` (they are given explicitly, like `disable-model-invocation`
    in Claude Code). Prompts are not used: deprecated and user-only.
  - personas → `.codex/agents/mandao-<role>.toml` (one per implementer tier in routed mode, plus
    `mandao-reviewer-alt`) with `model` and `model_reasoning_effort`.
  - instructions → the existing `AGENTS.md` managed blocks (Codex does not read `CLAUDE.md`).
  - Nothing is written into the user's `config.toml`; project `.codex/` files only take effect in a
    trusted project, which `doctor` reports. Hooks written by other tools must follow ADR 0015
    (portable commands only in committed files).
- **Mode:** Codex supports a model per agent, so `routed` is the default (full roles).
- **Recommendations** (`codex` block, minimum CLI **0.155.0**, the oldest that knows `gpt-6-sol` and
  `gpt-6-luna`):

  | Role | Model | Effort |
  |---|---|---|
  | leader | `gpt-6.1-sol` (session) | — |
  | implementer.fast | `gpt-6-luna` | medium |
  | implementer.standard | `gpt-6.1-sol` | medium |
  | implementer.strong | `gpt-6.1-sol` | high |
  | reviewer | `gpt-6-sol` | high |
  | reviewer_alt | `gpt-6.1-sol` | high |
  | tester | `gpt-6.1-sol` | medium |
  | simple mode | implementer `gpt-6.1-sol`, reviewer `gpt-6-sol` | |

  Optional: `gpt-6-astra` ("plan availability is documented only for Plus and Business; off by default
  on Enterprise/Edu") and the `gpt-5.6-*` family ("kept during the rollout").
- **Plans.** No Codex model is available on every plan: Free and Go only get `gpt-6-luna` in the
  desktop app during rollout. Defaults therefore target Plus, Pro, Business and API keys without admin
  action; Enterprise/Edu admins must enable `gpt-6.1-sol` and `gpt-6-sol`. Both facts are written in
  `recommendations.yml` and shown by `doctor`.
- **Strong equals standard.** `implementer.strong` uses the same model as `standard`; escalation raises
  reasoning effort only. `recommendations.yml` says so and `doctor` reports it (same rule for Copilot,
  where `strong` and `standard` are both `Claude Sonnet 5.5`).

## Consequences
- Roles need an optional `effort` next to `model` (Codex `model_reasoning_effort`); harnesses without
  per-agent effort ignore it.
- `.agents/skills/` is also read by OpenCode, which reads `.claude/skills/` too: with Claude Code and
  Codex both active, OpenCode would list each mandao twice. The OpenCode adapter must account for it
  (decided in the iteration plan).
- `codex exec` makes the cross-harness Reviewer (MANDAO-DESIGN §23.6) feasible later.
- Unverified: the default model when `model` is unset; `gpt-6-astra` availability on Pro.
