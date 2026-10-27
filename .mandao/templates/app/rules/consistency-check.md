---
schema_version: 1
rule: consistency-check
---

# Consistency Check

Runs at the end of `specify`, `tasks` and `verify`. The result is a table in the output document,
even when it is empty ("No findings" is written, not omitted).

| Type | Finding | Example |
|---|---|---|
| `CONTRADICTION` | An AC and an FR, or two FRs, cannot both hold | AC-2 allows guests; FR-4 requires login |
| `GAP` | An AC (or one of its clauses) has no FR | AC-3 "BUT it must NOT email twice" has no FR |
| `ORPHAN` | An FR serves no AC: unrequested scope | FR-7 adds CSV export nobody asked for |
| `RULE` | An FR conflicts with `business-rules.md` or the constitution | FR-2 allows 40% discount; rule caps at 30% |
| `PREMISE` | A Premise Ledger claim turned out false | design assumes `orders.status` is an enum; it is free text |
| `CONTRACT` | A side disagrees with the contract | web sends `amount` as string, contract says integer |

For each finding: ID, type, the two sides quoted with their location, severity (`critical` or
`normal`), and the owner (business → PE, technical → PE).

## Row shape

One row per finding, in this table (the header is part of the shape; `mandao run next` reads it):

```
| ID | Type | Finding | Severity | Owner | Status |
|---|---|---|---|---|---|
| CC-1 | PREMISE | The refund limit is unknown. | critical | PE | open |
```

Status values: `open`, or `resolved <date>: <how>` once the owner answered. A row is resolved only when
its Status starts with `resolved` (any case); anything else, including `unresolved`, is open.

An unresolved `critical` row, or any unresolved row of type `CONFLICT`, is an open item: it needs one
question (`/mandao-clarify`) and blocks the next step and `approve`. A resolved row is ignored. An inline
`CONFLICT(a: …, b: …, decides: …)` is open until its line says `resolved` (a `resolved` word in backticks does not
count). Markers written in backticks or in a fenced block in the prose are examples, not open items.
Table rows are read by their cells; a backticked Type still counts.

## Resolution

- No finding is resolved silently. Each one goes to `/mandao-clarify`.
- A `critical` finding blocks `tasks`. Say so and stop.
- After clarify, re-run the check and record what changed.

When the spec has a `data-model.md`: every field the requirements need exists there (`GAP`), and every
new field there has a requirement that justifies it (`ORPHAN`).
