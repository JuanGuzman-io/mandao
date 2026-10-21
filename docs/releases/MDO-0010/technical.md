---
schema_version: 1
spec: MDO-0010-guide-the-next-step-and-keep-the-session-in-the
audience: developers
language: en
---

# Technical notes — Guide the next step and keep the session in the spec worktree

`nextStep(spec)` (`src/spec/next.ts`) is the single, pure state-to-next-command decision, behind
`mandao run next`, `mandao approve` and every command's `Next:` line. Adapters now own a per-harness
`session` table that drives the worktree entry and the in-place cut advice. `approve --by-running`
turns running the next command into the approval unless something is open.

## What was built

All in project `mandao`, found by their `Mandao-Task` trailers:

| Task | Commit | Modules |
|---|---|---|
| T1 | `ebf5bfe` | Spec domain (`next.ts`, `approvals.ts`, `markdown.ts`), CLI (`run next`, `approve --by-running --words`, `--shown`) |
| T2 | `06be0aa` | Adapters (`session: { enterWorktree, newConversation, resume }` per harness), CLI (`session-advice.ts`, active harness, `{ action, then, fallback }`) |
| T3 | `9c7db39` | Content (`core/commands/*.md`: `{{script:next}}`, `EnterWorktree` under `harness=claude`, the resume field from `run where`, quick cost order, `approve --by-running --harness`), ADRs 0037, 0038, 0040, `MANDAO-DESIGN.md` §5 |
| T4 | `1a621a7` | Spec domain / CLI (`sessionDelta` baseline from any spec's `costs.yml`) |
| T5 | `79171b6` | Spec domain (`withoutCode`, failed verify, closed-spec delivery from git), `consistency-check.md` row shape and resolution |

- **Next step (`next.ts`):**
  - Reads story and spec status, real markers (code spans and fences stripped), critical Consistency Check rows, depth, tasks, pending commits, the verify verdict, and approval hashes.
  - A closed spec names push, PR and merge from git, or nothing once merged. It performs none of them (MDO-0012).
- **Approvals (`approvals.yml`):**
  - Rows gain an optional `sha256` per approved document.
  - `shown` rows hold the hashes of the last summary shown.
  - `--by-running` and `--words` are recorded verbatim.
- **Session advice:**
  - The active harness comes from `--harness`, then `CLAUDE_CODE_SESSION_ID`.
  - Claude Code gets `/clear`, then the next command. Codex and OpenCode get `/new`. Copilot and Antigravity get ⌘N / Ctrl+N.
  - The fallback is `session.resume`. The Codex resume command single-quotes `$mandao-…`.
- **Cost:** a record subtracts the session's latest `cumulative` across every spec and the quick log. `/mandao-quick` records before `quick-log` and commits `specs/quick/_log/costs.yml`.

## Decisions and pivots

- D1–D6 as approved in [spec.md](../../../specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/spec.md#decisions); CC-1 amended ADR 0037.
- **T5, added by the maintainer after the T1 and T2 reviews:** real markers only. Without it, MDO-0010's own prose blocked `run next`. It also added the failed-verify and closed-spec rules, and the written resolution rule in `consistency-check.md`.
- **T3 rework:** the per-harness copies of the resume command were replaced by the `resume` field of `run where`, so only the `EnterWorktree` step stays a conditional (D2).
- No pivots, escalations or HALTs.

## Contract changes

All additive (`public-api`):
- `mandao run next <ID> [--shown]` returns JSON: `{ recommended: { command, reason }, options }`.
- `mandao approve … --by-running <command> [--words <text>] [--harness <id>]` returns `go` or `ask`. The `next` field is now `nextStep`'s answer, and `newSession` is `{ action, then, fallback }`.
- `approvals.yml` rows gain an optional `sha256` map and `by_running` / `words` fields, plus `shown` rows.
- `mandao run where` returns the active harness's `resume` command.
- `recommended.command` can name a slash command, a `mandao` command, or a git delivery step (T5 review, advisory).

## Diagram and drift

Not measured: `mandao run diagram-drift MDO-0010` reports "design.md has no diagram with a structured
graph". This is a lite spec, and specify drew no stamped graph. There is no approved diagram to compare
against, so no drift is claimed either way. Open item for MDO-0011 (the spec folder by depth): decide
whether a lite spec carries a graph.

## How to test

- `npx vitest run test/unit/next.test.ts test/integration/approve.test.ts test/unit/session-advice.test.ts test/integration/leader-scripts.test.ts test/unit/content.test.ts test/integration/worktree-entry.test.ts test/integration/costs.test.ts`
- By hand: the [quickstart](../../../specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/quickstart.md). Step 5 is the only proof of P2 (`/clear` keeps the worktree) and has not been run.

## Open items

- **P2 unverified:** whether a `/clear` in a session entered with `EnterWorktree` stays in the worktree. The `run where` re-entry (S-3.3) covers the case where it does not.
- **P1:** `hook.test.ts` runs `mandao hook graph-guard` with a worktree `cwd` and shows it reads that worktree. A live hook's `CLAUDE_PROJECT_DIR` was not observed.
- **Verify CC-3:** story AC-5 quotes the approval note in Spanish, while the code records "approved by running …".
- **Advisory from the T2 review:** with no `--harness` and no Claude Code signal, the active harness falls back to `config.harnesses[0]`.

## Links

- [Spec](../../../specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/spec.md) ·
  [Tasks](../../../specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/tasks.md) ·
  [Verify report](../../../specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/verify-report.md) ·
  [Kaizen](../../kaizen/MDO-0010.md)
- ADRs: [0037](../../decisions/0037-mandao-start-and-worktree-setup.md),
  [0038](../../decisions/0038-session-cut-at-task-boundaries.md),
  [0040](../../decisions/0040-approval-by-running-the-next-command.md)

## Evidence

- `git log main..HEAD`: `ebf5bfe` T1, `06be0aa` T2, `9c7db39` T3, `1a621a7` T4, `79171b6` T5,
  `dddfb48` verify report. 89 files changed, 2,117 insertions, 487 deletions under `src`, `core`, `docs`, `test`.
- `node .mandao/bin/mandao.mjs run diagram-drift MDO-0010`: `error design.md has no diagram with a structured graph`.
- `node dist/cli.js sync --dry-run` at close: `0 created, 0 updated, 0 deleted, 133 unchanged, 0 drifted`.
