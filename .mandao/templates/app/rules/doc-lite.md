---
schema_version: 1
rule: doc-lite
---

# spec.md (lite depth)

Applies the principles in `spec-docs.md`.

At lite depth one session writes `story.md` and `spec.md`, which replaces `requirements.md`
and `design.md`; the tasks are in `tasks.md`, as at every depth. Same ids and the same rules as the
documents it replaces: FRs and scenarios, the AC → FR matrix, decisions, changes with exemplars, the Consistency
Check, clarifications, and a Premise Ledger with **High premises only**. Parsers, the Consistency
Check and traceability read the same sections from `spec.md`.

## One session

The cost of a session is mostly writing and reading its context, so lite pays it once:
1. Write `story.md` if there is none (from `spec/story.md`), then `spec.md` from
   `spec/spec.md` instead of `requirements.md` and `design.md`: the same requirements and
   design sections and a Premise Ledger with **High premises only**. Then write `tasks.md` as
   `/mandao-tasks` does, in this same session, whatever the number of tasks.
2. Skip `/mandao-clarify` unless something is open: a `[NEEDS CLARIFICATION]`, an `OPEN` or a
   Consistency Check finding.
3. Ask for **one** approval of story, spec and tasks together. The user may give it from the terminal
   (`mandao approve <ID> spec`); approved in the session, set `status: approved` in each and commit with
   `mandao run commit-spec <ID> specify`. Next: `/mandao-implement` in a **new session** (ADR 0038):
   `mandao approve` prints the command (`newSession`); staying here re-reads this context on every turn.

