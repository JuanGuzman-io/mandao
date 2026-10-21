# 0040 — Approval by running the next command, unless something is open

**Status:** Accepted · 2026-10-21 · design §2 principle 5 · amends the rule MDO-0009 added to `implement.md` §0

MDO-0009 told `implement` that "running the next command is not an approval". At the start of that spec
the opposite problem showed: the person ran the command the previous summary named, and was asked to
approve again in words. Approving silently despite open items is the other failure, and the worse one.

## Decision

- **Running the next command is an approval of the spec's pending step, when nothing is open.**
  `mandao approve --by-running <command> [--words <text>] --harness <id> <spec> <step>` decides, not the
  agent: it approves and returns `go`, or approves nothing and returns `ask` with one question.
- **It asks, and records nothing, when** the step has a critical `OPEN`, a `CONFLICT`, a
  `[NEEDS CLARIFICATION]`, a pending decision or a critical Consistency Check row, or when an approvable
  document changed since the summary shown (`mandao run next --shown` records its hashes in
  `approvals.yml`). A spec with no `shown` row makes no claim about changes.
- **It records** "approved by running /mandao-<command>", or the exact `--words`, with the date and the
  person. The approval row also holds a hash of each approved document, so a later change is named.
- **The command only relays the question.** `implement` §0 and `tasks` call it on a draft spec and pass
  `--harness <this harness>`, so the advice never names an action another harness lacks.
- **Other approvals are unchanged:** the person's explicit word, or their own `mandao approve`. Budget
  and publication still need the person's own word.

## Consequences

- The rule holds in every harness and is testable as a process, not as an agent's reading.
- A spec edited after its summary was shown is never approved by a bare command.
- Rejected: asking every time (the person already said yes by running it), and the agent judging "changed
  since the summary" from memory (not checkable, lost after a new conversation).
