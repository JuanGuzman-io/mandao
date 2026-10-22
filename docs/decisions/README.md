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
| [0030](0030-init-dir-shadow-hotfix-and-sdd-conflicts.md) | init in a new folder, shadow mode, hotfix lane, other SDD frameworks | Accepted |
| [0031](0031-work-types.md) | Work types beyond software and AI | Proposed |
| [0032](0032-mdo-0004-command-run-and-statuses.md) | Commands run for real (MDO-0004): defects fixed and command statuses | Accepted |
| [0033](0033-mdo-0005-run-identity-kind-characterization.md) | The MDO-0005 re-run: deterministic identity, task kind, characterization tests, executed premises | Accepted |
| [0034](0034-specify-data-model-and-diagram-by-change.md) | specify: a conditional data model, and the diagram chosen by what is built | Accepted |
| [0035](0035-readable-specs-and-cost-levers.md) | Readable spec documents, a real lite, Leader scripts, approvals and recorded premises | Accepted |
| [0036](0036-cost-conscious-by-design.md) | Cost-conscious by design | Accepted |
| [0037](0037-mandao-start-and-worktree-setup.md) | `mandao start` and the worktree setup | Accepted |
| [0038](0038-session-cut-at-task-boundaries.md) | Cut the session at a task boundary when a new one is cheaper | Accepted |
| [0039](0039-rules-enforced-by-scripts.md) | Rules the scripts enforce, not the text | Accepted |
| [0040](0040-approval-by-running-the-next-command.md) | Approval by running the next command, unless something is open | Accepted |
| [0041](0041-spec-folder-layout-v2.md) | Spec folder layout version 2 | Accepted |
| [0042](0042-phased-improvements-and-local-validation.md) | Phased improvements and local validation | Accepted |
| [0043](0043-https-skill-sources-and-ssh-settings.md) | HTTPS skill sources and SSH settings | Accepted |
| [0044](0044-script-owned-lifecycle-measurement.md) | Script-owned lifecycle measurement | Accepted |
| [0045](0045-structured-review-context.md) | Structured review context and findings | Accepted |
| [0046](0046-exact-gate-receipts-and-autonomous-execution.md) | Exact gate receipts and autonomous execution | Accepted |
| [0047](0047-gated-design-principles-and-data-write-validation.md) | Gated design principles and data-write validation | Accepted |
| [0048](0048-script-enforced-loop-and-approval-safety.md) | Script-enforced loop, test and approval safety | Accepted |
| [0049](0049-confirmed-delivery-and-release-status.md) | Confirmed, provider-neutral delivery and Git-derived release status | Accepted (Phase 6) |
| [0050](0050-security-scan-evidence-and-gates.md) | Per-type security-scan evidence and verification gates | Accepted (Phase 7) |
| [0051](0051-sourced-research-gates.md) | Sourced research evidence, reuse and high-impact gates | Accepted (Phase 8) |
| [0052](0052-verified-research-search.md) | Verified search for research approval | Accepted (Phase 8) |
| [0053](0053-deliveries-inside-a-spec.md) | Deliveries inside a spec | Accepted (Phase 9a) |
