# 0044 — Script-owned lifecycle measurement

**Status:** Accepted · 2026-10-21

## Context

Cost records and execution rows show effort and outcomes, but do not identify command boundaries,
human waits, agent waits or gate duration. Inferring waits from transcript gaps or commit timestamps
would misattribute time and create false precision. Layout v2 also fixes the `_log/` file set at six.

## Decision

- Store compact script-stamped lifecycle events as comment records in `execution.md`; this preserves
  the v2 six-file layout and leaves the existing execution table unchanged.
- Pair command, question, agent and gate intervals by generated IDs. Questions carry one of
  `product`, `external` or `technical`. Event payloads never include prompt text.
- Count active time as command elapsed time minus the union of measured human and agent waits. Report
  gate duration as a measured subset of active time.
- Exclude unmatched intervals from duration totals and report incomplete commands without estimating
  their elapsed time.
- Derive corrected historical costs separately for billed, equivalent and unknown bases from each
  session's cumulative role snapshots, retaining original `costs.yml` rows. Rows without cumulative
  snapshots keep their recorded amounts; unlike bases are never added together.
- Record cost and command-end events before a command's final commit so the completed command leaves no
  telemetry or cost write behind.

## Consequences

Commands and agent handoffs must call the helper at their boundaries. Existing specs without events
remain unmeasured for those dimensions. Corrected historical totals are an attribution view, not a
replacement for the original billed or subscription-equivalent records.
