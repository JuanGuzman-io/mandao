---
schema_version: 1
level: workspace
last_synced: 2026-10-20
---

# Glossary

| Business term | Code name(s) | Definition | Source |
|---|---|---|---|
| Mandao | `/mandao-<id>`, `ResolvedCommand` | One command given to the agent | MANDAO-DESIGN §1 |
| Harness | `HarnessId`, `Adapter` | A coding agent tool (Claude Code, Copilot) | `src/adapters/types.ts` |
| Workspace | `config.workspace`, `DetectedWorkspace` | The folder Mandao manages: single, monorepo or polyrepo | `src/workspace/detect.ts` |
| Project | `ProjectConfig` | One code unit with a path and a profile | `src/schemas/config.ts` |
| Profile | `Profile` (`app`, `ai`, `data`) | Template variant chosen per project | ADR 0011 |
| Preset | `Layer` with `kind: 'preset'` | Team customization layer in the resolution stack | ADR 0004, 0011 |
| Override | `.mandao/overrides/`, `*.patch.yml` | Project-local replacement or frontmatter patch | ADR 0004 |
| Drift | `Action` `'drift'` | A generated file edited by hand since the last sync | ADR 0003 |
| Role | `Role` | leader, reviewer, reviewer_alt, implementer, tester | ADR 0011 |
| Tier | `Tier` (`fast`, `standard`, `strong`) | Task difficulty that routes the Implementer's model | §14.3 |
| Reduced independence | `IndependenceCheck.reduced` | Review ran on the Implementer's model | ADR 0011 |
| Gate | `Gate`, `projects[].gates` | A deterministic check (lint, tests…) | §15.1 |
