# 0048 — Script-enforced loop, test and approval safety

**Status:** Accepted · 2026-10-22 · Phase 5

## Context

Several important execution rules were only prose. A repeated Leader recommendation could loop forever;
test deletions or green-first runs could be treated inconsistently; approval records did not support
revocation without editing history; and old version 1 integrity files predate the local v2 cache.

## Decision

- `run step` records the latest task/action and counts identical recommendations only while execution and
  approval logs stay unchanged. Three repetitions return `HALT`; a new log row or approval resets the count.
- Red-first compares newly added test cases in changed test files against the script-recorded first-run
  baseline. Removing cases from that baseline requires a reason on the report checkpoint, included in the
  Reviewer pack. Linter limits are not a valid deletion reason; split the file.
- A first run that passes records `TESTS_PASS` and returns two explicit next options: killed mutation
  evidence (`--for-first-pass`) or an independent test review recorded by `run test-review`. The Reviewer
  review must name every test file, begin with `TEST REVIEW: PASS` and include an Assertions section.
- `approve design` hashes every confirmed document, including an already-approved `story.md`. Revoke and
  annul are append-only events with a reason and target timestamp; consumers ignore rows targeted by a
  live event. Revoking a document approval returns its documents to draft.
- `close-summary --closed` refuses unresolved `ASSUMPTION` or `CONFLICT` markers in the story, spec,
  design or tasks. Code examples and resolved lines/rows do not block.
- Test fixtures initialize temporary repositories through one helper that sets local `user.name` and
  `user.email`. An AST guard rejects raw Git initializers and direct `process.exit()` calls in test code.
- Version 2 integrity hashes stay outside git in `.mandao/cache/<ID>/integrity.json`. Version 1 keeps its
  historical `_log/.integrity.json` location; no legacy history is migrated or rewritten.
- A successful test process is `PASS` even if its output contains text resembling “command not found”; a
  missing-tool classification requires a failing runner result.

## Consequences

- `TESTS_PASS` and `TEST_REVIEWED` are execution events, not substitutes for a successful implementation
  review; `verify` accepts only the explicit mutation or independent-review route for a green-first test.
- Approval history remains auditable. Reversing an event requires another append-only event, never editing
  an earlier row.
- Legacy v1 logs remain byte-compatible, while v2 continues to keep bulk integrity evidence local.
