---
schema_version: 1
spec: MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r
audience: product owner
language: en
---

# Release notes — Measure what the session-cut rule needs

Teams on Claude Code can now see which prompt-cache duration they actually use and where it comes from.
Each spec's retrospective now shows how long people pause between turns and how many turns each task
takes, set against the numbers the session-cut advice relies on.

| Criterion | Status | What the user gets now |
|---|---|---|
| AC-1 | met | The health check names the cache duration for the main conversation and for helpers, its source, and the recommended setting. It never changes a setting, and it flags values Claude Code ignores. |
| AC-2 | met | A spec's pauses and turns per task, verify and close are measured from its own sessions. Missing sessions are named, never counted as zero, and helper turns are left out. |
| AC-3 | met | The retrospective shows those pauses and turns for the spec. |
| AC-4 | met | The retrospective compares the measurements with the advice's numbers across specs and proposes new values from 3 specs on. It never applies them itself. |

## Not done yet

- With measurements from fewer than 3 specs, the comparison says "insufficient data" and proposes
  nothing. That is the case today.

## Known limits

- Only Claude Code is measured; other tools keep no usable session record.
- Organization-managed settings are not read, and the health check says so.
- Measurements need the session records still on the machine that ran the spec.
- Costs shown for this work are list-price equivalents: the team works on a Claude subscription, so they
  are not what was charged. Older entries that name no basis are equivalents too.
