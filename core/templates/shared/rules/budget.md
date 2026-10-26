---
schema_version: 1
rule: budget
---

# Budget and cost

At the first step, record `node .mandao/bin/mandao.mjs run event <ID|quick> command_start --command <this mandao>` before the budget check.

Cost-conscious by design (ADR 0036): every command knows what the spec has spent and records its own
spend.

- **At the start:** `mandao run cost <ID>`. `no-budget` (no `budget.per_spec`): there is no cap; say the
  spend so far in one line and go on. Never set or suggest a budget yourself: only a person, or a rule
  they approved, sets it. `warn` (80% of `budget.per_spec` or more): say it in one line. `over` (100% or
  more): before any work, ask whether to go on past the budget, inside the same grouped confirmation as
  the command's external or irreversible actions; stop if the answer is no, and stop too when no person
  can answer (a headless run). A yes is recorded with `mandao approve <ID> budget --to <usd>`: the new
  cap for this spec (`--to none` removes it). The budget is off by default. Inside implement, `mandao run step` returns `await-budget` and no brief until it is.
- **Before the final commit:** `mandao run cost <ID> --record --command <this mandao> --harness <claude|codex|copilot|opencode|antigravity>`
  (`quick` for quick changes). Claude Code: the script reads this session's own record. Other harnesses:
  add `--usd <amount>` when the harness shows the session's cost; otherwise say the cost was not
  recorded. Report the amount and the spec's total in one line, with its `basis`: `billed` (API key,
  cloud provider) or `equivalent` (a Claude subscription: the same tokens at API list prices, not what
  was charged).
- In `implement`, record before each task commit, including the last one. In `quick`, record before its
  code commit. The cost write and the lifecycle end event must be included in the final commit.
- Never change a model or the profile to save money; Kaizen recommends, the user decides.
