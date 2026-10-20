# 0019 — Antigravity adapter (Google)

**Status:** Accepted for a later slice of iteration 2 · verified 2026-10-20 against antigravity.google/docs
(App v2.24.0, CLI v1.4.x). Official documentation is thin on several points, listed below.

## Sources
https://antigravity.google/docs/rules · /skills · /subagents · /migration/workflows-to-skills ·
/ide/workflows · /models · /plans · /enterprise · /hooks · /mcp · /cli/headless · /cli/reference ·
/cli/features · /cli/gcli-migration · /slash-commands · /settings · /faq · /changelog ·
https://github.com/google-antigravity/antigravity-cli (README and releases; the org is not marked verified)

## Verified format
| Concern | Antigravity |
|---|---|
| Instructions | `AGENTS.md` or `GEMINI.md` in any directory, `.agents/AGENTS.md`, `.agents/rules/*.md` (frontmatter `trigger` required or the rule is silently dropped); cumulative, more specific directory wins; global `~/.gemini/AGENTS.md` and `~/.gemini/config/…`; 24 KB per file, 20k tokens for always-on rules. No mention of `CLAUDE.md`, `.claude/` or `.github/` |
| Commands | Workflows (`.agents/workflows/`) **stopped working on 2026-10-19**; skills replace them and become slash commands (`.agents/skills/deploy-staging/SKILL.md` → `/deploy-staging`). How arguments reach a skill is **not documented** |
| Skills | Agent Skills standard; `.agents/skills/<name>/SKILL.md`; `description` required, `name` optional; no `model` field |
| Subagents | `.agents/agents/<name>.md` (or `<name>/agent.md`); `name`, `description`, optional `tools`, `model`, `skills`…; **`model` is a tier only: `inherit`, `flash` or `pro`**, not a model ID |
| Models | Picker per session (App, IDE), `/model` (CLI), `agy -p --model <slug>` (headless). Slugs only come from `agy models`; no documented settings key |
| Plans | Free and Plus: Gemini 3.8 Flash (plus models being removed on 2026-11-02). AI Pro (not on trial), Ultra, Enterprise: Gemini 4 Argon (not in the IDE), Claude Sonnet 5.5 / Opus 5.5 (Enterprise: admin opt-in). The plans page and the models page disagree about third-party models on Pro |
| Hooks | `.agents/hooks.json`, events `PreToolUse`, `PostToolUse`, `Stop`… |
| MCP | `.agents/mcp_config.json` (`mcpServers`, `serverUrl` for remote) |
| Headless | `agy -p` with `--output-format json`; the FAQ says wrapping `agy` inside third-party agents is not supported on consumer plans |
| Version | No official page documents `agy --version` |

## Decision
- **Shared `.agents/` output.** Codex and Antigravity both read skills from `.agents/skills/`. Mandao
  renders mandao skills there once, with frontmatter valid for both (`name`, `description`), when
  either harness is active, instead of two adapters writing the same files.
- **Adapter `antigravity`:** personas → `.agents/agents/mandao-<role>.md` with a model **tier**;
  instructions → the existing `AGENTS.md` blocks.
- **Recommendations** use tiers, not IDs (`model_kind: tier`). Defaults must work on every plan, and
  Free and Plus only have Flash, so the default mode is **`simple`**: implementer `inherit` (the
  session's model), reviewer `flash`. Optional: `pro` for reviewer and strong work, noted "requires AI
  Pro, Ultra or Enterprise". With the defaults the Reviewer may share the Implementer's model:
  `doctor` reports reduced independence and the review runs in a clean context, as ADR 0011 decided.
- **No separate Reviewer process** through `agy -p` on consumer plans (FAQ terms); recorded for the
  cross-harness Reviewer (MANDAO-DESIGN §23.6).
- **No minimum-version check** until `agy --version` is documented.

## Consequences
- The adapter waits until skill arguments are documented, or uses `$ARGUMENTS`-free bodies that ask
  for the input instead.
- Antigravity's format moved this week (workflows → skills); it is the least stable target.
