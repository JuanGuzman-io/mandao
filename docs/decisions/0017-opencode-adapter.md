# 0017 — OpenCode adapter (provider-agnostic)

**Status:** Accepted for iteration 2 · format verified 2026-10-20 against OpenCode **v1.19.3**
(2026-10-16, commit `e3c4eb2`; the repository moved from `sst/opencode` to `anomalyco/opencode`)

## Sources
- https://opencode.ai/docs/commands/, /agents/, /skills/, /config/ (and the same files at
  `anomalyco/opencode@v1.19.3:packages/web/src/content/docs/{agents,cli,commands,config,models,permissions,plugins,providers,rules,skills}.mdx`)
- `anomalyco/opencode@v1.19.3:packages/opencode/src/{config/command.ts,config/agent.ts,config/config.ts,config/paths.ts,session/instruction.ts,provider/provider.ts,auth/index.ts}`
- https://models.dev/api.json (OpenCode's model catalog)
- https://platform.claude.com/docs/en/about-claude/models/overview
- https://developers.openai.com/api/docs/models (`gpt-6-astra`, `gpt-6.1-sol`, `gpt-6-luna`)

## Verified format
| Concern | OpenCode v1.19.3 |
|---|---|
| Commands | `.opencode/commands/<name>.md` (project), `~/.config/opencode/commands/` (global); Markdown + frontmatter `description`, `agent`, `subtask`, `model`; body is the template; `$ARGUMENTS`, `$1`, `$2`…; also definable under `command` in `opencode.json` |
| Agents | `.opencode/agents/<name>.md` or `agent` in `opencode.json`; fields `description` (required), `mode` (`primary`/`subagent`/`all`), `model`, `prompt`, `permission`, `steps`, `hidden`; subagents run through the Task tool or `@mention`; **each agent can have its own model** |
| Skills | `SKILL.md` read from `.opencode/skills/`, `.claude/skills/`, `.agents/skills/` (and global equivalents); `name` must match the folder |
| Instructions | `AGENTS.md` (then `CLAUDE.md` if no `AGENTS.md`), all ancestors up to the worktree root, nested ones attached lazily when files below are read; global `~/.config/opencode/AGENTS.md`; extra files via `instructions` |
| Model IDs | `provider_id/model_id`, e.g. `anthropic/claude-sonnet-5-5`; precedence: `--model` > config `model` > last used > internal priority; an agent's or command's `model` overrides for that agent |
| Config | `opencode.json(c)`, global `~/.config/opencode/`, project found walking up to the git root; files are **merged**, later wins; `$schema: https://opencode.ai/config.json` |
| Providers configured | `~/.local/share/opencode/auth.json` (from `opencode auth login`), the provider's env vars per models.dev (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`), and `provider` / `enabled_providers` / `disabled_providers` in config; `opencode auth list`, `opencode models` |
| Hooks | JS/TS plugins (`.opencode/plugins/` or npm via `plugin`), e.g. `tool.execute.before` |
| Version | `opencode --version` |

## Decision
- **Adapter `opencode`:** commands → `.opencode/commands/mandao-<id>.md`; personas → `.opencode/agents/mandao-<role>.md` with `mode: subagent` and the role's `model` (Leader: `mode: primary`). Skills need nothing: OpenCode already reads `.claude/skills/` and `.agents/skills/`. Nothing is written into the user's `opencode.json`; when a key is ever needed it is merged, never replaced, and nothing absolute is committed.
- **Instructions:** OpenCode prefers `AGENTS.md` and only falls back to `CLAUDE.md`, so the existing managed blocks suffice.
- **Recommendations per provider set** (OpenCode has no universal default; IDs from each provider's docs, 2026-10-20):

  | Role | `anthropic` | `openai` | `anthropic+openai` |
  |---|---|---|---|
  | leader | `anthropic/claude-opus-5-5` | `openai/gpt-6-astra` | `anthropic/claude-opus-5-5` |
  | implementer.fast | `anthropic/claude-haiku-5-5` | `openai/gpt-6-luna` | `anthropic/claude-haiku-5-5` |
  | implementer.standard | `anthropic/claude-sonnet-5-5` | `openai/gpt-6.1-sol` | `anthropic/claude-sonnet-5-5` |
  | implementer.strong | `anthropic/claude-opus-5-5` | `openai/gpt-6-astra` | `anthropic/claude-opus-5-5` |
  | reviewer | `anthropic/claude-opus-5-5` | `openai/gpt-6-astra` | `openai/gpt-6-astra` (other provider) |
  | reviewer_alt | `anthropic/claude-sonnet-5-5` | `openai/gpt-6.1-sol` | `openai/gpt-6.1-sol` |
  | tester | `anthropic/claude-sonnet-5-5` | `openai/gpt-6.1-sol` | `anthropic/claude-sonnet-5-5` |

  With both providers, Implementer and Reviewer run on different providers by default.
- **Optional:** `anthropic/claude-fable-5-1`; local models (e.g. `ollama/*`, `lmstudio/*`) only for `implementer.fast`, noted "local models vary widely in quality and tool use; verify on your tasks before relying on them".
- **`init`** detects configured providers (auth.json keys, provider env vars, `enabled_providers`/`disabled_providers`) without running OpenCode, asks when detection finds none or is ambiguous, and applies the matching set.
- `recommendations.yml` gains `provider_sets` for this harness; `doctor` reports the detected providers and flags a role whose provider is not configured.

## Consequences and caveats
- Anthropic subscriptions (Pro/Max) are not a supported way to use OpenCode; an Anthropic API key is.
- OpenAI's minimum usage tier per model is not stated in its docs; the `openai` set carries that note.
- `gpt-6.1-sol` lists Chat Completions "without tool calling"; tool calls need the Responses API. To be
  confirmed against OpenCode's OpenAI provider before making it a default for tool-using roles.
- `opencode/slash` and `opencode/autoinvoke` skill metadata exist only on OpenCode's `dev` branch.

## Implementation (iteration 2b, 2026-10-20, against v1.19.3 source)

- **Each mandao once.** OpenCode keys skills by name: the copies Claude Code (`.claude/skills/`) and Codex
  (`.agents/skills/`) need collapse into one entry, and a command of the same name shadows it in the
  command registry (`command/index.ts`). Mandao's commands in `.opencode/commands/` are what users
  invoke. To keep the other harnesses' copies out of the skill tool too, Mandao owns
  `.opencode/opencode.jsonc` with `permission.skill: { "mandao-*": "deny" }`; OpenCode merges config from
  `.opencode/` directories (`config/config.ts`), so the user's `opencode.json` is never touched. A test
  renders Claude Code, Codex and OpenCode together and checks each mandao is visible exactly once per
  harness, with a snapshot of the three.
- **Agents:** `.opencode/agents/mandao-*.md`; Leader `mode: primary` (the `implement` and `resume`
  commands run as it: `agent: mandao-leader`), Reviewer `mode: all` (as a `subagent`, `opencode run
  --agent` falls back to the default agent and drops its permissions), others `subagent`. Permissions
  deny `edit`, `bash`, `webfetch` and `task` when the persona lacks the capability. An effort becomes the
  agent's `variant` (OpenCode's variants are effort names).
- **Cross-harness review:** `mandao run review --via opencode` runs `opencode run --agent mandao-reviewer
  -m <model> --dir <root>` with the prompt on stdin.
- **`gpt-6.1-sol` caveat resolved:** OpenCode's `openai` provider always uses the Responses API
  (`provider/provider.ts`), so tool calling works.
- **Providers:** `init` detects them (keys of `auth.json` only, provider env vars, enabled/disabled
  providers in config) and applies the largest matching set; `doctor` warns for a role whose provider is
  not configured. Local providers (`ollama`, `lmstudio`) need no credentials.
- Not verified live: OpenCode is not installed on the machine that built this; the acceptance run needs it.

**Superseded in part by ADR 0025** (OpenCode 2.1.1): credentials, `opencode run` flags and the supported range.
