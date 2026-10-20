# 0038 — Cut the session at a task boundary when a new one is cheaper

**Status:** Accepted · 2026-10-20 · design §2 principle 9 (ADR 0036)

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

- At a task boundary (the task has no row past `STARTED`), `mandao run step` reads this Claude Code
  session's transcript (`CLAUDE_CODE_SESSION_ID`). It returns `session: { cut, reason, savings }`.
- **Cut** when `(C − B') × read × N > B' × write`, with C the current context and the write price of the
  TTL the session uses (1h when it wrote any 1h entry).
- **Always cut** when the cache has expired since the last turn. Staying would rewrite all of C; a new
  session writes only B'.
- The Leader stops before delegating and passes on the reason and the savings. A new session continues
  from the checkpoint. The user may choose to stay.
- Other harnesses expose no transcript with cache usage, so they get no advice.

## Consequences

- The constants (`TURNS_PER_TASK`, `TURNS_AFTER_TASKS`, `RELOAD_TOKENS`) are measurements. Kaizen
  revisits them with each spec's turn counts.
- The hybrid trial (MDO-0008: specify and approve in one session, implement/verify/close in another) tests
  the rule on a spec with four or more tasks.
- OPEN: whether a smaller context also improves the quality of later tasks. MDO-0007 had no FAILs either
  way, so this needs more specs.
