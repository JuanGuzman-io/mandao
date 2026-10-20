---
schema_version: 1
rule: doc-lite
---

# spec.md (lite depth)

Applies the principles in `spec-docs.md`.

At lite depth one session writes `story.md` and `spec.md`, which replaces `requirements.md`,
`design.md` and, with 3 tasks or fewer, `tasks.md`. Same ids and the same rules as the documents it
replaces: FRs and scenarios, the AC → FR matrix, decisions, changes with exemplars, the Consistency
Check, clarifications, and a Premise Ledger with **High premises only**. Tasks go inline under
`## Tasks` in the Details format, without an Overview; a fourth task means a separate `tasks.md`.
Parsers, the Consistency Check and traceability read the same sections from `spec.md`.
