---
schema_version: 1
level: workspace
last_synced: 2026-10-20
owner: PO
status: draft
---

# Product

Derived from code and `MANDAO-DESIGN.md` only; `.mandao/sources.yml` declares no tracker or documents.

## Vision

Spec-Driven Development for AI coding agents across harnesses: every command is a *mandao* given to
the agent, done exactly as asked, with a receipt (`MANDAO-DESIGN.md` §1).

## Users and roles

| Role | Uses |
|---|---|
| Developer | init, sync, constitution, specify, quick, implement… |
| PO / PM | story, clarify answers, release notes (business language) |
| Tech lead | constitution approval, standards, models |

## Scope

The repository implements the full core command flow: constitution, story, specify, clarify, tasks,
implement, verify and close, plus init, quick and resume (`core/commands/*.md`, status: stable).
The CLI also provides start/worktree setup, human approvals, models, skills and mechanical helpers
(`src/cli/program.ts`). Research is planned in README; perf and audit are stubs, not stable commands.

Adapters target Claude Code, GitHub Copilot, Codex, OpenCode and experimental Antigravity, with a generic
AGENTS.md fallback (`src/adapters/index.ts`). Enabled here: Claude, Copilot and Codex. Harness test
levels differ; `docs/harnesses.md` and README distinguish live from snapshot evidence.

## Capability map

| Capability | Evidence in code | Documented in | Status |
|---|---|---|---|
| Detects single / monorepo / polyrepo workspaces | `src/workspace/detect.ts` | MANDAO-DESIGN §6 | implemented |
| Generates the same commands for several agents | `src/adapters/index.ts`, `claude.ts`, `copilot.ts`, `codex.ts`, `opencode.ts`, `antigravity.ts` | §4.3 | implemented |
| Never overwrites a hand-edited generated file | `src/writer/plan.ts` | ADR 0003 | implemented |
| Team customizations survive updates | `src/resolver/resolve.ts` (patches) | ADR 0004 | implemented |
| Chooses a model per role with dated recommendations | `src/models/`, `core/models/recommendations.yml` | §14.3 | implemented |
| Blocks risky changes from the quick lane | `src/scripts/quick-check.ts` | §21 | implemented |
| Installs vetted skills after confirmation | `src/skills/install.ts` | §17.2 | implemented |
| Recommends the commands' skills at init, for every harness | `src/cli/init-skills.ts`, `src/skills/command-skills.ts` | MDO-0009 | implemented |
| Recommends the next command from the spec's state | `src/spec/next.ts`, `src/cli/approve.ts` | MDO-0010 | implemented |
| Doctor findings as JSON for CI | `src/cli/output.ts` (`doctorReport`), `src/cli/setup.ts` | `docs/schemas.md` | implemented |
| Starts isolated work and approves documents from the terminal | `src/cli/start.ts`, `src/cli/approve.ts` | ADR 0037 | implemented |
| Executes tasks with red evidence, gates, independent review and local commits | `src/spec/loop.ts`, `src/cli/run-leader.ts` | ADR 0022, 0039 | implemented |
| Verifies acceptance criteria and closes with Kaizen and release notes | `core/commands/verify.md`, `close.md`, `src/cli/run-close.ts` | ADR 0026 | implemented |
| Records costs and suggests session cuts | `src/spec/costs.ts`, `src/cli/session-advice.ts` | ADR 0036, 0038 | implemented; list-price equivalents are not subscription bills |
| Derives diagrams and detects stale documentation | `scripts/diagrams/derive.mjs`, `check.mjs` | `docs/process-map.md` | implemented |
| Prepares tracker publication with deduplication and approval | `src/scripts/publish.ts`, `core/commands/close.md` | ADR 0026 | implemented planning; posting requires a configured tracker MCP |
