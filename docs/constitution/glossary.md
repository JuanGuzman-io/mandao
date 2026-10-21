---
schema_version: 1
level: workspace
last_synced: 2026-10-20
---

# Glossary

| Business term | Code name(s) | Definition | Source |
|---|---|---|---|
| Mandao | `/mandao-<id>`, `ResolvedCommand` | One command given to the agent | MANDAO-DESIGN §1 |
| Harness | `HarnessId`, `Adapter` | A coding agent tool (Claude Code, Copilot, Codex, OpenCode or experimental Antigravity) | `src/adapters/types.ts` |
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
| Worktree | `mandao start`, `src/cli/worktree.ts` | Isolated checkout for one spec or quick change | ADR 0037 |
| Approval | `mandao approve`, `_log/approvals.yml` | Human authorization for a named step, with provenance | `src/cli/approve.ts` |
| Evidence log | `_log/`, `.integrity.json` | Script-owned execution evidence; outside edits are recorded as discrepancies | ADR 0039 |
| Recommendation receipt | `Lock.recommendations` | Hash of recommendations already offered, not the list of enabled harnesses | `src/models/offers.ts`, `src/cli/setup.ts` |
| Cost basis | `src/spec/costs.ts` | Recorded cost interpretation; subscription list-price equivalents are not a bill | ADR 0036 |
| Derived diagram | `derivedFrom`, `specSha256` | Diagram linked to exact source hashes and generated exports | `scripts/diagrams/check.mjs` |
