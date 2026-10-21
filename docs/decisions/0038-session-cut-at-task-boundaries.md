# 0038 — Cut the session at a task boundary when a new one is cheaper

**Status:** Accepted · 2026-10-20, amended the same day (natural boundaries, `cut_min_savings`) · design §2 principle 9 (ADR 0036)

MDO-0007 ran specify, implement, verify and close in one Claude Code session. It started at 34k tokens of
context and ended at 177k. Every main turn re-reads the whole context from the cache. From T2 on, those
reads cost more than starting over would have.

## Measurements (MDO-0004 to MDO-0007)

- A new session starts at 31k–34k tokens (system prompt, tools, AGENTS.md, the command). Reading back the
  spec, the tasks and the checkpoint adds about 10k: **B' ≈ first turn + 10k**.
- Main-session turns: about 15 per task (MDO-0007: 13 and 15; MDO-0004: about 20), 10 for verify and 18
  for close: **N ≈ 15 × tasks left + 28**.
- Opus and Sonnet 5.5 price a 1h cache write at 40 times a cache read (25 times for a 5m write).
- A cut at MDO-0007's T1 → T2 boundary (126k context, 42 turns left) would have saved about $0.32 of
  $5.62. A cut after specify would have saved $0.23 to $0.46, depending on B' and the TTL. A second cut
  after a first one never paid, because the context had not grown back.

## Decision

- **The rule.** Cut when `(C − B') × read × N > B' × write`. C is the current context. The write price is
  the one for the TTL the session uses (1h when it wrote any 1h entry). **Always cut** when the cache has
  expired since the last turn: staying would rewrite all of C, while a new session writes only B'.
- **Cuts go at natural boundaries, where a person pauses anyway.** The Leader is not stopped to ask at
  every boundary.
  - **After `mandao approve`** of the spec (lite) or the tasks, `approve` prints `newSession`, the command
    that opens `/mandao-implement` in the worktree. All tasks plus verify and close are still ahead, so
    the cut pays as soon as the specify context exceeds B' by about 20k with four tasks (30k with two).
    MDO-0007, with two tasks, exceeded it by 47k.
  - **Between implement and verify**, `mandao run implement-summary` applies the rule. When it says cut, it
    returns the command for `/mandao-verify` in a new session.
- **Inside implement**, at a task boundary (the task has no row past `STARTED`), `mandao run step` returns
  `session: { cut, reason, savings, stop, minSavings }`. The Leader stops to suggest a new session only
  when `stop` is true, which means the saving reaches `session.cut_min_savings`. The default is $1, or
  15% of `budget.per_spec` when that is lower. Below that, it goes on without asking.
- **Every estimate is logged.** Each estimate from `step` and from `implement-summary` goes to the
  spec's `_log/session-cuts.md` with its decision. Kaizen recalibrates the constants from it.
- **Claude Code only.** The advice reads the session transcript (`CLAUDE_CODE_SESSION_ID`). The other
  harnesses expose no transcript with cache usage, so they get no advice; `approve` still prints the
  command for a new session.

## Consequences

- The constants (`TURNS_PER_TASK`, `TURNS_AFTER_TASKS`, `RELOAD_TOKENS`) are measurements.
  `mandao run kaizen-compare` (`sessionCut`) sets them against each spec's turn counts and proposes
  values from 3 specs on; a person applies them.
- The hybrid trial (MDO-0008: specify and approve in one session, implement/verify/close in another) tests
  the rule on a spec with four or more tasks.
- OPEN: whether a smaller context also improves the quality of later tasks. MDO-0007 had no FAILs either
  way, so this needs more specs.

## Addendum (MDO-0010): the in-place action first

The advice names the harness's new-conversation action first (`/clear` in Claude Code, `/new` in Codex and
OpenCode, a new chat in Copilot and Antigravity), because it keeps the window and the worktree. When a
fresh conversation would not be inside the worktree, the advice gives the step back into it first
(`EnterWorktree` in Claude Code, the `resume` field of `run where` in the others). The `run where` check of the next
command re-enters the worktree anyway, so the advice is safe whether or not the action keeps the working
directory. The advice is no longer Claude Code only: each harness's session facts drive it, and the cut
estimate still reads the transcript only where one exists.
