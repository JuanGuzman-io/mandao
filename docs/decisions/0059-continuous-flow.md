# 0059 — Continuous flow: the spec's branch in the session, chaining by default

**Status:** Accepted (Phase 16). Supersedes the "every spec runs in its own worktree" of ADRs 0015 and 0037;
amends ADR 0038 (session cuts) for subscriptions and chaining.

## Context

Running the beta on a real project, getting from an intake to the first `implement` took many turns, most of
them spent on hand-overs and git by hand: `story --from` recommended `mandao start` in a terminal, `start` cut a
worktree without the uncommitted proposal (`git stash` by hand) and opened `specify --depth lite`, `specify`
elicited as if there were no proposal, a mistaken spec needed `git worktree remove` and `git branch -D`, `next`
named bare commands (`/mandao-specify` with no ID), each command handed control back although nothing needed a
decision, and delivery had to run in a terminal. The PE decided (2026-10-26):

1. No new agent commands; each command carries the work on to the next.
2. The branch is always created automatically by the command that creates the spec; the worktree is optional.
3. Commands chain by default and stop only where a decision belongs to the PE.
4. Every stop names the next step complete, with the spec ID.
5. `mandao start` leaves the flow; the terminal commands are classified and documented.

## Decision

- **Opening a spec:** `run spec-new --create` (run by `story`, `specify` and `quick`) creates the branch per
  `branching` (or reuses an explicit id's existing branch with no spec), in this checkout by default carrying the
  uncommitted work, or in a worktree with `--worktree` or when another spec's branch is checked out here; then
  the uncommitted constitution, intake, config and spec-folder changes move into it. It records the request and
  the baseline. `--discard <ID>` removes a spec started by mistake, never uncommitted work. `sharedState` warns
  about another open spec's unmerged shared changes; `--carry-from` takes them. The start steps live in
  `src/cli/spec-open.ts`; `mandao start` is deprecated and runs them too.
- **One place rule:** `run where` reports `ready` on the spec's branch (`mode: worktree | in-place`); the flow
  commands go on only then; `--switch` moves this checkout onto the branch, never one another worktree holds.
- **Next step:** `run next` adds `recommended.invocation` and `invocations` in the active harness's syntax with the
  spec ID (`/mandao-implement MDO-1`, `$mandao-implement MDO-1` in Codex), and `autoContinue` on chainable steps
  when `flow.chain` is on (default true): specify, tasks, implement, verify, close and `run commit`. Clarify,
  approvals, story, delivery and a delivery checkpoint stop. `rules/next-step.md` is the one closing rule.
- **Chaining in Claude Code:** with `flow.chain`, the rendered flow commands (story, specify, clarify, tasks,
  implement, verify, close) drop `disable-model-invocation`; init, constitution, quick and the rest keep it.
- **Session cuts:** on a subscription with no `session.cut_min_savings`, no cut is suggested for list-price
  savings; `init` asks the threshold. With `flow.chain`, approving the spec or tasks no longer advises a new
  session.
- **Delivery in the session:** `mandao deliver --list`, then `--target <branch> --scope <all|push-pr|nothing>`
  after one grouped question.
- **Intake:** stories with the same `group` open as one spec; `run intake-answer` records the PE's answers; the
  intake folder is `paths.intake`; a command with no spec yet logs to `.mandao/log/` (`workspace`).
- **Terminal commands:** `src/schemas/cli-commands.ts` classifies them (for the user, for maintainers, internal,
  deprecated). `docs/cli.md` carries an index generated from the CLI (`npm run docs:cli`), and a test fails when
  it differs; the installed guide lists the user's commands. `run impact`, which nothing called, is removed.

## Consequences

- In place, two specs in the same checkout would fight over it: the second one gets a worktree automatically.
- A subscription user sees no cost-driven session cuts; context limits are left to the harness's compaction.
- Codex and Copilot cannot always invoke the next command themselves; there the closing rule gives the complete
  invocation to copy.
- Not done here: moving the events a command recorded under `workspace` into the spec it then creates (the run's
  start and end land in different logs, and Kaizen treats that run as incomplete).
