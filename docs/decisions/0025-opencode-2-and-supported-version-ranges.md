# 0025 — OpenCode 2, and a supported version range per adapter

**Status:** Accepted · 2026-10-20 · verified against OpenCode **v2.1.1** (tag source, bundled docs
`packages/web/src/content/docs/*.mdx`, `CHANGELOG.md` v2.0.26–v2.1.0, local `--help`)

## OpenCode 2.1.1, item by item

| Item | Holds? | Evidence | Change |
|---|---|---|---|
| Commands in `.opencode/commands/*.md`, `description`, `agent`, `model`, `$ARGUMENTS`, `$1…` | Yes | `core/config/plugin/command.ts:159`, `schema/config/command.ts:7-13`, `command.ts:199-213` | None. Skills no longer appear in the `/` menu at all (`tui/…/autocomplete.tsx:484-494`), so only Mandao's commands show there |
| Agents in `.opencode/agents/*.md` with `mode`, `model`, `variant`, `permission` | Yes, through the v1 decoder | `core/config/plugin/agent.ts:22,186-201`; `v1/config/migrate.ts:28-53` maps `variant` → `model#variant`, `bash` → `shell`, `task` → `subagent` | None now; native fields (`permissions` rules, `model#variant`) when v1 support ends |
| Skills from `.claude/skills`, `.agents/skills`, `.opencode/skills`; one per name; `permission.skill` deny hides | Yes | `core/config/discovery.ts:85`, `config/plugin/compatibility.ts:43,53`, `core/skill.ts:33-34` | None |
| `.opencode/opencode.json(c)` merged | Yes | `discovery.ts:12,126`, `config.ts:211-287`, `normalize.ts:180` | None |
| `opencode run` | Partly | `--help`: `--agent`, `-m provider/model#variant`, `--format`, stdin; **no `--variant`, `--dir`, `--command`**; a `subagent` is no longer swapped for the default agent (`core/agent.ts:98-102`) | `mandao run review --via opencode` passes `-m <model>#<effort>` and runs in the workspace as cwd |
| Credentials | **Changed** | Stored in SQLite (`opencode.db`); `auth.json` is only imported once by a migration (`core/database/migration/20260805200742_import_legacy_credentials.ts:39`). The docs (`cli.mdx:142`, `providers.mdx:21`) still say `auth.json`: the code wins | Providers come from `opencode auth list --format json` (ids only, never secrets), then `auth.json` (v1), then env vars; `enabled_providers`/`disabled_providers` still apply (`normalize.ts:409-427`) |
| Breaking changes for Mandao's files | None | Compatibility decoders for every key Mandao writes (`normalize.ts:118-180`); v2.1 breaks SDK, HTTP and plugin contracts only | None; `opencode agent` became `opencode debug agents` (Mandao does not call it) |

## Supported version range per adapter

`harness_version` in `recommendations.yml` is now `{ min, max_major, command }`: `min` is the oldest
release with the recommended models and verified formats, `max_major` the newest major whose formats
Mandao verified. `doctor` warns below `min` and above `max_major`. A harness without a verifiable
version states why in `version_unchecked`, shown as info.

| Harness | Range | Note |
|---|---|---|
| Claude Code | 2.1.293 – 2.x | |
| Codex | 0.155.0 – 0.x | |
| OpenCode | 2.1.1 – 2.x | 1.19.3 files still load, but `review --via opencode` and provider detection follow v2 |
| Copilot | not checked | adapter verified against the VS Code docs, not a recorded release |
| Antigravity | not checked | no documented version command |
