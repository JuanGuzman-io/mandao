# 0002 — Canonical command format and token language

**Status:** Accepted

## Context
Each harness has its own command format: Claude Code skills use `$ARGUMENTS` and `allowed-tools`,
Copilot prompt files use `${input:name}` and `tools`. Writing per-harness copies does not scale.

## Decision
- One Markdown file per command with a zod-validated frontmatter (see `docs/command-format.md`).
- The body uses a deliberately closed token language: `{{args}}`, `{{arg:name}}`, `{{template:x}}`,
  `{{script:x}}`, `{{paths.*}}`, `{{command:x}}` and `<!-- mandao:if ... -->` blocks.
- There is no general template engine. An unknown token is a validation error, not silent output.
- Capabilities (`read`, `edit`, `search`, `shell`, `web`, `mcp`, `agents`) and model tiers
  (`fast`, `standard`, `strong`) are abstract. Each adapter maps them.
- A `harness.<id>` block is the escape hatch for harness-specific frontmatter.

## Consequences
- Adding a token requires a code change and an ADR, which keeps content portable.
- Content authors cannot express arbitrary logic. That is intentional.
