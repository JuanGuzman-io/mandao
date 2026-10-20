# Architecture Decision Records

Short ADRs for decisions taken while building Mandao. One file per decision, numbered, never rewritten: a
later ADR supersedes an earlier one.

Format: **Status**, **Context**, **Decision**, **Consequences**.

| # | Title | Status |
|---|---|---|
| [0001](0001-content-over-code.md) | Content over code | Accepted |
| [0002](0002-canonical-command-format.md) | Canonical command format and token language | Accepted |
| [0003](0003-config-vs-lock.md) | Config is intent, lock is resolution | Accepted |
| [0004](0004-layered-resolution.md) | Layered resolution with frontmatter patches | Accepted |
| [0005](0005-workspace-model.md) | Workspace model: single, monorepo, polyrepo | Accepted |
| [0006](0006-scripts-via-mandao-run.md) | Helper scripts run through `mandao run` | Accepted |
| [0007](0007-pure-adapters.md) | Pure adapters, one writer for every file | Accepted (amended 2026-10-20) |
| [0008](0008-copilot-second-adapter.md) | GitHub Copilot as the second adapter | Accepted |
| [0009](0009-rules-live-in-templates.md) | Methodology rules live in templates, commands stay lean | Accepted |
| [0010](0010-design-document-alignment.md) | Alignment with the design document | Accepted |
| [0011](0011-models-languages-and-iteration-2-decisions.md) | Models per role, profiles vs presets, skill installs, quick review, hooks, spec states, languages | Accepted |
| [0012](0012-dogfooding-corrections.md) | Corrections from the first dogfooding run | Accepted |
| [0013](0013-impacted-tests-and-resource-budget.md) | Impacted tests and a resource budget | Accepted |
| [0014](0014-pin-claude-5-5-models.md) | Pin the Claude 5.5 family by model ID | Accepted |
| [0015](0015-iteration-2-decisions.md) | Iteration 2 decisions: tasks format, Leader, MCP scope, branches, agent settings | Accepted |
| [0018](0018-multi-harness-and-handoff.md) | Real multi-harness: switch harness mid-work without reinstalling | Accepted |
| [0016](0016-codex-adapter.md) | Codex adapter (OpenAI) | Accepted for iteration 2 |
| [0017](0017-opencode-adapter.md) | OpenCode adapter (provider-agnostic) | Accepted for iteration 2 |
| [0019](0019-antigravity-adapter.md) | Antigravity adapter (Google) | Accepted for a later slice |
| [0020](0020-iteration-2a-execution-rules.md) | Iteration 2a: worktrees, impacted tests, test runs, Codex defaults, Reviewer tier rule | Accepted |
| [0021](0021-iteration-2a-acceptance-lessons.md) | Iteration 2a acceptance: commits by trailer, deterministic identity, cross-harness review | Accepted |
| [0022](0022-tdd-discipline-and-spec-diagrams.md) | TDD and professional discipline; diagrams to approve in specify | Accepted (design; 2b) |
| [0023](0023-branching-strategy-presets.md) | Branching strategy that adapts to the team (presets) | Accepted (design; 2b) |
| [0024](0024-resource-floors-and-verified-suggestions.md) | Memory floors per operation, recorded forced runs, verified model suggestions | Accepted |
| [0025](0025-opencode-2-and-supported-version-ranges.md) | OpenCode 2, and a supported version range per adapter | Accepted |
| [0026](0026-verify-and-close.md) | Iteration 3: verify and close | Accepted |
| [0027](0027-iteration-3-decisions.md) | Iteration 3 decisions: release, gates, diagram freshness, free models, Antigravity status | Accepted |
| [0028](0028-no-size-estimates.md) | No size estimates: measure the real diff | Accepted |
| [0029](0029-opencode-free-models-detection.md) | OpenCode: providers from the models it lists | Accepted |
