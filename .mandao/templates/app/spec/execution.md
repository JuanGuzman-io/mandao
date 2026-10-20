---
schema_version: 1
spec: <ID>-<slug>
---

# Execution — <title>

<!-- Written by the Leader through `mandao run checkpoint`; one row per step. -->

## Log

| Date | Task | Attempt | Tier | Harness | Implementer | Reviewer | Verdict | Notes |
|---|---|---|---|---|---|---|---|---|

<!--
Verdict: STARTED | REPORTED | PASS | FAIL | HALT | PIVOT | DEFERRED_TO_CI.
Notes: `reduced independence` (review on the implementer's model), `provider independence`
(implemented in one harness, reviewed in another), `identity mismatch` (a model claimed to be other
than the process the script invoked), deferred tests and why, advisories.
No commit column: each task's commit is found in git by its `Refs` and `Mandao-Task` trailers, so a
rebase never breaks the log. The PASS row lands in the task's own commit.
-->

## Pivot Records
<!-- From pivot-record.md when the spec itself is wrong. -->

## Advisories
<!-- Non-blocking review findings. They feed Kaizen and never reopen the loop. -->
