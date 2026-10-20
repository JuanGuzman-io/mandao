# 0008 — GitHub Copilot as the second adapter

**Status:** Accepted · format verified 2026-10-19 against
[prompt files](https://code.visualstudio.com/docs/agent-customization/prompt-files) and
[custom agents](https://code.visualstudio.com/docs/agent-customization/custom-agents)

## Context
The MVP needs a second harness to prove the abstraction. The candidates were Copilot and Cursor.

## Decision
Copilot (VS Code): commands become `.github/prompts/mandao-<id>.prompt.md` with `agent: agent`,
`tools`, optional `model`, `argument-hint`, and arguments as `${input:name:hint}`. Personas become
`.github/agents/mandao-<id>.agent.md`. Tool sets used: `read`, `search`, `edit`, `execute`, `web`, `agent`;
Copilot ignores tools that are unavailable at run time. Its frontmatter and argument model differ the most from Claude
Code, so it stresses the canonical format harder than Cursor would.

## Consequences
- Copilot model names are not portable, so `models.copilot` is left empty by default and `model` is
  omitted unless configured.
- Cursor remains a straightforward third adapter.
