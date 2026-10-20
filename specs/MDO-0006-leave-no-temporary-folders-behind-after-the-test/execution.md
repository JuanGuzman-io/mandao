---
schema_version: 1
spec: MDO-0006-leave-no-temporary-folders-behind-after-the-test
---

# Execution — MDO-0006-leave-no-temporary-folders-behind-after-the-test

## Log

| Date | Task | Attempt | Tier | Harness | Implementer | Reviewer | Verdict | Notes |
|---|---|---|---|---|---|---|---|---|
| 2026-10-20 | T1 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-20 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-implementer-standard: test/unit/helpers.test.ts, test/unit/helpers-teardown.test.ts; `npx vitest run test/unit/helpers.test.ts test/unit/helpers-teardown.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-20 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | REPORTED |  |
| 2026-10-20 | T1 | 1 | standard | claude | — | claude-opus-5-5 | PASS |  |
| 2026-10-20 | T2 | 1 | fast | claude | — | — | STARTED |  |
| 2026-10-20 | T2 | 1 | fast | claude | claude-haiku-5-5 | — | RED | red tests by mandao-implementer-fast: test/unit/architecture.test.ts; `npx vitest run test/unit/architecture.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-20 | T2 | 1 | fast | claude | claude-haiku-5-5 | — | REPORTED |  |
| 2026-10-20 | T2 | 1 | fast | claude | — | claude-opus-5-5 | PASS |  |
| 2026-10-20 | T3 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-20 | T3 | 1 | standard | claude | self | — | RED | red tests by self: test/unit/architecture.test.ts; `npx vitest run test/unit/architecture.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-20 | T3 | 1 | standard | claude | claude-sonnet-5-5 | — | REPORTED |  |
| 2026-10-20 | T3 | 1 | standard | claude | claude-sonnet-5-5 | claude-opus-5-5 | PASS |  |

## Advisories

- T1 (reviewer): `test/unit/helpers-teardown.test.ts` asserts `typeof removeTrees === 'function'` only to make its red fail; S-3.1/S-3.2 are regression guards whose red is structural.
- T1 (reviewer): the S-2.1 look-alike folder uses a fixed name (`mandao-test-lookalike-S21`); a run killed before `finally` makes the next run fail with EEXIST. A unique suffix would avoid it.
- T1 (reviewer): the setup-file wiring (S-1.2, S-1.4) is only proven by the D6 full run; /mandao-verify must not skip it.
- T1 (reviewer): AC-2/C1 relies on vitest's default `sequence.hooks: 'stack'`; setting it to `parallel` later would race. Candidate for a comment or explicit pin at /mandao-close.
- T2 (reviewer): the guard compares `/`-separated paths against `relative()` output, which uses `\` on Windows (same assumption as the existing writer guard).
- T2 (reviewer): the guard matches text, not calls, so a comment mentioning `tmpdir` fails it (as designed in D4).
- T3 (reviewer): the `join(<x>, '..'` guard catches only the single-argument shape D4 defines; `join(a, b, '..')`, `resolve(x, '..')` or writing to `dirname(makeTree(...))` would still escape unseen. Kaizen candidate at /mandao-close.
- T3 (reviewer): `'repo.worktrees'` in `scripts.test.ts:48` is tied to the `'repo/README.md'` key at `:31`; a shared constant would keep them in step (style only).
