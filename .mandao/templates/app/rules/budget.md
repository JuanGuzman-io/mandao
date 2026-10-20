---
schema_version: 1
rule: budget
---

# Budget and cost

Cost-conscious by design (ADR 0036): every command knows what the spec has spent and records its own
spend.

- **At the start:** `mandao run cost <ID>`. `warn` (80% of `budget.per_spec` or more): say it in one
  line. `over` (100% or more): before any work, ask whether to go on past the budget, inside the same
  grouped confirmation as the command's external or irreversible actions; stop if the answer is no.
- **At the end:** `mandao run cost <ID> --record --command <this mandao> --harness <this harness>`
  (`quick` for quick changes). Claude Code: the script reads this session's own record. Other harnesses:
  add `--usd <amount>` when the harness shows the session's cost; otherwise say the cost was not
  recorded. Report the amount and the spec's total in one line.
- Never change a model or the profile to save money; Kaizen recommends, the user decides.
