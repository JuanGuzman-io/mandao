---
schema_version: 1
spec: MDO-0002-filter-pinned-skills-by-vetting
verdict: verified
date: 2026-10-20
---

# Verify — Filter pinned skills by vetting

## Suites

| Project | Kind | Command (as run) | Result | Evidence |
|---|---|---|---|---|
| mandao | unit | `npx vitest related src/cli/extensions.ts src/cli/skills.ts test/integration/cli.test.ts --run --maxWorkers=5` | PASS | exit 0; 4 files, 21 tests (Tester, fresh context) |

## Acceptance criteria → tests

| AC / clause | Critical | Tests | Level | Result |
|---|---|---|---|---|
| AC-1 | no | `--unvetted prints only unvetted skills, in text and JSON` | integration | PASS |
| AC-2 | no | `--vetted prints only vetted skills` | integration | PASS |
| AC-2/C1 | no | `--vetted with --unvetted fails with exit code 1`; built CLI re-run: `skills list --vetted --unvetted` exited 1 | integration + CLI | PASS |

## TDD evidence (ADR 0022)

T1: RED row (3 of 8 tests failed before implementing). The REPORTED row notes `red test changed`; the
Reviewer judged the current assertions strict (a formatter reflow), but could not compare byte for byte:
the red hashes were dropped by a checkpoint bug, fixed in 03b1184. `missingRed`: none.

## Product bugs

None. The worktree's `dist/` was stale when the Tester started (built before T1); rebuilt, not a product
defect.

## Deferred to CI

None.

## Blockers

None.
