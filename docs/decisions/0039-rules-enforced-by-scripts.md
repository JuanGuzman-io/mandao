# 0039 — Rules the scripts enforce, not the text

**Status:** Accepted · 2026-10-20 · after MDO-0008 implement

In MDO-0008 the Leader and the Reviewer broke five rules that the commands only stated in text:

- a high-severity security advisory (front matter evaluated as JavaScript) was passed;
- the spec went past its budget without anyone confirming;
- tests added during rework were never seen failing;
- rows recorded attempt 1 at attempt 3;
- the Leader edited `progress.yml` and `tasks.md` by hand.

Text that a model can skip under pressure is not a control.

## Decision

Each rule is checked by the script that records the step, which refuses the step or records the breach.

1. **Security blocks a PASS.**
   - The Reviewer tags every finding `[<lens>/<severity>]`.
   - `mandao run checkpoint --verdict PASS|FAIL --reviewer …` needs the Reviewer's whole answer
     (`--review <file|->`). The script checks that its `VERDICT` line matches, refuses a PASS that
     carries `[security/high]` or `[security/critical]`, and keeps the answer in `_log/reviews/`.
   - An untagged line that names a high or critical severity and a security concern counts too.
   - `mandao run review --via` records such a PASS as a FAIL.
2. **Budget.**
   - Past 100% of the spec's cap, `mandao run step` returns `await-budget` with no brief.
   - The cap is the last `mandao approve <spec> budget --to <usd>`, else `budget.per_spec`. Without either
     there is no cap (ADR 0036).
   - A headless run stops there and the request stays pending: every `step` derives it again until a
     person records an authorization.
3. **Red first, rework included.**
   - `mandao run red` records the test names each file declared when it ran red.
   - A `REPORTED` row for an `evidence: tdd` task is refused while its test files declare a name no red
     run saw.
4. **The attempt comes from the log:** one plus the task's FAILs. `--attempt` no longer exists on
   `checkpoint`, `step`, `gates`, `red` or `mutation`.
5. **Logs are written by scripts only.**
   - Every script write to a spec log (`_log/`, `progress.yml`, `execution.md`) records its hash in
     `.integrity.json`.
   - `checkpoint` compares the logs with those hashes. An edit made any other way goes to
     `_log/discrepancies.md` and into the row's notes (`log edited outside the scripts`), once.
   - `--pending-commit` checks the commit subject when it is queued, so the queue never needs a hand
     fix.

## Consequences

- The Leader passes the Reviewer's answer to the script verbatim, through a heredoc. The answer is kept,
  so Kaizen and verify read what the Reviewer said, not a summary.
- Test names come from patterns (`test(…)`/`it(…)`, `def test_…`, `func Test…`). A table-driven or
  generated test is invisible to the rule, which errs toward not refusing.
- Premise probes and scratch folders under `_log/premises/` are not logs: the model writes them by
  design (`rules/doc-design.md`).
