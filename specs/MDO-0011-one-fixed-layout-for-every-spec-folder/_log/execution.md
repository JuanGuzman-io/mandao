---
schema_version: 1
spec: MDO-0011-one-fixed-layout-for-every-spec-folder
---

# Execution — MDO-0011-one-fixed-layout-for-every-spec-folder

## Log

| Date | Task | Attempt | Tier | Harness | Implementer | Reviewer | Verdict | Notes |
|---|---|---|---|---|---|---|---|---|
| 2026-10-21 | T1 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-21 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/layout.test.ts, test/integration/layout.test.ts; `npx vitest run test/unit/layout.test.ts test/integration/layout.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/layout.test.ts, test/integration/layout.test.ts; `npx vitest run test/unit/layout.test.ts test/integration/layout.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T1 | 1 | standard | claude | claude-sonnet-5-5 | — | REPORTED | red test changed: test/unit/layout.test.ts |
| 2026-10-21 | T1 | 1 | standard | claude | — | claude-opus-5-5 | FAIL | red test changed: test/unit/layout.test.ts; FAIL: depth rule does not follow design D1 (lite on requirements.md ignored); fixture brokenV2 carries depth: lite |
| 2026-10-21 | T1 | 2 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/layout.test.ts, test/integration/layout.test.ts; `npx vitest run test/unit/layout.test.ts test/integration/layout.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T1 | 2 | standard | claude | claude-sonnet-5-5 | — | REPORTED | red test changed: test/unit/layout.test.ts; NFR-2: node dist/cli.js run layout MDO-0010 -> ok:true, 0.121 total (< 300 ms). Removed-AC tests: run mutation refused (not a characterization task); manual patch/revert of the filter in trace.ts and release.ts each made one test fail. |
| 2026-10-21 | T1 | 2 | standard | claude | — | claude-opus-5-5 | FAIL | red test changed: test/unit/layout.test.ts; FAIL: stray src/spec/trace.ts.orig (stale copy of trace logic) left in the diff by the manual mutation check |
| 2026-10-21 | T1 | 3 | standard | claude | claude-opus-5-5 | — | REPORTED | red test changed: test/unit/layout.test.ts |
| 2026-10-21 | T1 | 3 | standard | claude | — | claude-opus-5-5 | PASS | red test changed: test/unit/layout.test.ts; Advisories: v1 lite oneOf has no test; removed-AC manual mutation evidence not script-recorded; run layout does not catch a bad schema_version as JSON; secrets/SAST NOT_INSTALLED. |
| 2026-10-21 | T2 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-21 | T2 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-implementer-standard: test/integration/lite-spec.test.ts, test/unit/content.test.ts; `npx vitest run test/integration/lite-spec.test.ts test/unit/content.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T2 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-implementer-standard: test/integration/lite-spec.test.ts, test/unit/content.test.ts; `npx vitest run test/integration/lite-spec.test.ts test/unit/content.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T2 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-21 | T2 | 1 | standard | claude | claude-sonnet-5-5 | — | REPORTED |  |
| 2026-10-21 | T2 | 1 | standard | claude | — | claude-opus-5-5 | FAIL | FAIL: new stories still start at schema_version 1: core/templates/shared/spec/story.md unchanged |
| 2026-10-21 | T2 | 2 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-implementer-standard: test/integration/lite-spec.test.ts, test/unit/content.test.ts; `npx vitest run test/integration/lite-spec.test.ts test/unit/content.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T2 | 2 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-implementer-standard: test/integration/lite-spec.test.ts, test/unit/content.test.ts, test/unit/layout.test.ts; `npx vitest run test/integration/lite-spec.test.ts test/unit/content.test.ts test/unit/layout.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T2 | 2 | standard | claude | claude-sonnet-5-5 | — | REPORTED | red test changed: test/unit/content.test.ts |
| 2026-10-21 | T2 | 2 | standard | claude | — | claude-opus-5-5 | PASS | red test changed: test/unit/content.test.ts |
| 2026-10-21 | T2 | 2 | standard | claude | — | — | STARTED |  |
| 2026-10-21 | T2 | 2 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-implementer-standard: test/integration/lite-spec.test.ts, test/unit/content.test.ts, test/unit/layout.test.ts; `npx vitest run test/integration/lite-spec.test.ts test/unit/content.test.ts test/unit/layout.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T2 | 2 | standard | claude | claude-sonnet-5-5 | — | REPORTED |  |
| 2026-10-21 | T2 | 2 | standard | claude | — | claude-opus-5-5 | PASS |  |
| 2026-10-21 | T3 | 1 | strong | claude | — | — | STARTED |  |
| 2026-10-21 | T3 | 1 | strong | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/state.test.ts, test/integration/state-log.test.ts; `npx vitest run test/unit/state.test.ts test/integration/state-log.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T3 | 1 | strong | claude | — | — | STARTED |  |
| 2026-10-21 | T3 | 1 | strong | claude | claude-opus-5-5 | — | REPORTED | red test changed: test/integration/state-log.test.ts |
| 2026-10-21 | T3 | 1 | strong | claude | — | claude-opus-5-5 | FAIL | red test changed: test/integration/state-log.test.ts; FAIL: readers not tested on version 2: next change-after-approval and approve --by-running shown rows from state.yml |
| 2026-10-21 | T3 | 2 | strong | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/integration/state-log.test.ts, test/unit/state.test.ts; `npx vitest run test/integration/state-log.test.ts test/unit/state.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T3 | 2 | strong | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/integration/state-log.test.ts, test/unit/state.test.ts; `npx vitest run test/integration/state-log.test.ts test/unit/state.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T3 | 2 | strong | claude | — | — | STARTED |  |
| 2026-10-21 | T3 | 2 | strong | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/layout-version.test.ts; `npx vitest run test/unit/layout-version.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T3 | 2 | strong | claude | claude-opus-5-5 | — | REPORTED | red test changed: test/integration/state-log.test.ts, test/unit/state.test.ts |
| 2026-10-21 | T3 | 2 | strong | claude | — | claude-opus-5-5 | PASS | red test changed: test/integration/state-log.test.ts, test/unit/state.test.ts |
| 2026-10-21 | T4 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-21 | T4 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/integration/log-v2.test.ts; `npx vitest run test/integration/log-v2.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T4 | 1 | strong | claude | — | — | PIVOT | red test changed: test/integration/log-v2.test.ts; Pivot Record T4: drop untouched test files from files:; approved by the maintainer; log edited outside the scripts: _log/execution.md |
| 2026-10-21 | T4 | 1 | strong | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/integration/log-v2.test.ts; `npx vitest run test/integration/log-v2.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T4 | 1 | strong | claude | claude-opus-5-5 | — | REPORTED |  |
| 2026-10-21 | T4 | 1 | strong | claude | — | claude-opus-5-5 | FAIL | FAIL: [security/high] close can recursively delete outside the cache: unvalidated story id in specCacheDir, removeScratchDir within=dirname(dir); untagged security mention: Most of the change matches AC-3. The log has the six files, and packs, full gate output, probes, mutations, discrepancies and integrity hashes go to `.mandao/cache/<ID>/`. `.mandao/cache/` is in the managed ignore block. In `gates.md`, only failing gates get output, and a gate that is not installed appears once, in the table. Premises keep claim, command, sha, exit and 20 lines. Full runs become a `## Full runs` section of `execution.md`. Version 1 output is unchanged for gates, reviews, packs, premises, mutations and integrity. The tests are not weakened: `redTests.changed` is empty and the red evidence is recorded. The verdict is FAIL because of one high security finding and gaps in the Definition of Done evidence. \| 3. **Cache root and ID:** finding the nearest `.mandao/config.yml` is fine. Taking the ID from the story id is the security/high finding above, and it is acceptable once validated. |
| 2026-10-21 | T4 | 2 | strong | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/integration/log-v2.test.ts, test/unit/log-cache.test.ts; `npx vitest run test/integration/log-v2.test.ts test/unit/log-cache.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T4 | 2 | strong | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/unit/log-cache.test.ts; `npx vitest run test/unit/log-cache.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T4 | 2 | strong | claude | claude-opus-5-5 | — | REPORTED | red test changed: test/integration/log-v2.test.ts; test split for lint by mandao-tester: 5 wide tests moved from log-v2.test.ts to log-v2-wide.test.ts, names unchanged |
| 2026-10-21 | T4 | 2 | strong | claude | — | claude-opus-5-5 | PASS | red test changed: test/integration/log-v2.test.ts; advisories: storyField 2.0/+2/0x2 version split; writer regex front matter (security/low); logPath routing not centralised (D3); schemas/spec.ts not zod; integrity gone after close; free-text headings in reviews.md; untagged security mention: No blocking findings remain. There is no high or critical security finding.; log edited outside the scripts: _log/execution.md |
| 2026-10-21 | T5 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-21 | T5 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/integration/close.test.ts, test/unit/release.test.ts, test/integration/spec-log.test.ts, test/unit/content.test.ts; `npx vitest run test/integration/close.test.ts test/unit/release.test.ts test/integration/spec-log.test.ts test/unit/content.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T5 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/integration/close.test.ts, test/unit/release.test.ts, test/integration/spec-log.test.ts, test/unit/content.test.ts; `npx vitest run test/integration/close.test.ts test/unit/release.test.ts test/integration/spec-log.test.ts test/unit/content.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T5 | 1 | standard | claude | claude-sonnet-5-5 | — | REPORTED | red test changed: test/integration/close.test.ts, test/unit/content.test.ts |
| 2026-10-21 | T5 | 1 | standard | claude | — | claude-opus-5-5 | FAIL | red test changed: test/integration/close.test.ts, test/unit/content.test.ts; FAIL: run close-summary deletes the lead text the template asks for between the title and ## Outcome (D5: rewrites only Outcome and Delivery) |
| 2026-10-21 | T5 | 2 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-tester: test/integration/close.test.ts; `npx vitest run test/integration/close.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T5 | 2 | standard | claude | claude-sonnet-5-5 | — | REPORTED | red test changed: test/unit/content.test.ts |
| 2026-10-21 | T5 | 2 | standard | claude | — | claude-opus-5-5 | PASS | red test changed: test/unit/content.test.ts |
| 2026-10-21 | T6 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-21 | T6 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-implementer-standard: test/integration/close-commit.test.ts, test/integration/mdo-0005-defects.test.ts; `npx vitest run test/integration/close-commit.test.ts test/integration/mdo-0005-defects.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T6 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-implementer-standard: test/integration/close-commit.test.ts, test/integration/mdo-0005-defects.test.ts; `npx vitest run test/integration/close-commit.test.ts test/integration/mdo-0005-defects.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T6 | 1 | standard | claude | claude-sonnet-5-5 | — | RED | red tests by mandao-implementer-standard: test/integration/close-commit.test.ts, test/integration/mdo-0005-defects.test.ts; `npx vitest run test/integration/close-commit.test.ts test/integration/mdo-0005-defects.test.ts --maxWorkers=5` failed (exit 1) |
| 2026-10-21 | T6 | 1 | standard | claude | claude-sonnet-5-5 | — | REPORTED | red test changed: test/integration/close-commit.test.ts |
| 2026-10-21 | T6 | 1 | standard | claude | — | claude-opus-5-5 | FAIL | red test changed: test/integration/close-commit.test.ts; FAIL: S-5.1 fixture locks docs/commands and docs/diagrams files, so the unlocked derived-path branch that commits diagram sources is never tested |
| 2026-10-21 | T6 | 2 | standard | claude | claude-sonnet-5-5 | — | REPORTED | red test changed: test/integration/close-commit.test.ts |
| 2026-10-21 | T6 | 2 | standard | claude | — | claude-opus-5-5 | PASS | red test changed: test/integration/close-commit.test.ts |
| 2026-10-21 | T7 | 1 | standard | claude | — | — | STARTED |  |
| 2026-10-21 | T7 | 1 | standard | claude | claude-haiku-5-5 | — | RED | red tests by mandao-implementer-fast: test/integration/close.test.ts; `npx vitest run test/integration/close.test.ts --maxWorkers=4` failed (exit 1) |
| 2026-10-21 | T7 | 1 | standard | claude | claude-haiku-5-5 | — | RED | red tests by mandao-implementer-fast: test/integration/close-drift.test.ts; `npx vitest run test/integration/close-drift.test.ts --maxWorkers=4` failed (exit 1) |
| 2026-10-21 | T7 | 1 | standard | claude | claude-haiku-5-5 | — | REPORTED | red test changed: test/integration/close.test.ts |
| 2026-10-21 | T7 | 1 | standard | claude | — | claude-opus-5-5 | PASS | red test changed: test/integration/close.test.ts |

### Pivot Record — T4 — 2026-10-21

- **What is wrong with the spec:** T4 `files:` lists `test/integration/spec-log.test.ts`, `test/integration/ledger.test.ts` and `test/integration/enforced-rules.test.ts`, which the T4 diff does not touch.
- **Evidence:** `mandao run checkpoint … --verdict REPORTED` refused: "T4: tests with no red run: test/integration/spec-log.test.ts: …; test/integration/ledger.test.ts: …; test/integration/enforced-rules.test.ts: …" (about 20 existing, passing tests in those files); `git diff --stat HEAD -- test/` shows only `engine.test.ts` changed and `log-v2.test.ts` new. The red-first guard (`testsWithoutRed`, `src/scripts/red.ts:52`) demands red for every test in a declared file, so untouched files cannot satisfy it honestly.
- **Proposal:** remove the three untouched test files from T4 `files:` (they stay in `verify:` as regression tests). Record a real red run for the new `logs.level` test in `log-v2.test.ts` by reverting its fix temporarily (as in T2). Backlog: the red-first guard should demand red only for tests added or changed in the task's diff against the base; a declared file the diff does not touch demands nothing.
- **Impact:** T4 only; no AC or scenario changes.
- **Decision:** approved by Juan D. Guzmán on 2026-10-21 (in the T4 implement session).

### Decision — T4 — 2026-10-21 — the PASS security guard reads only the current findings

- **Context:** T4 attempt 2 was reviewed PASS. `checkpoint --verdict PASS --review` refused it with "a PASS cannot carry an open high-severity security finding", because the Reviewer's recap of attempt 1 cites "**1. [security/high] Close could recursively delete folders outside the cache. Fixed.**" (`securityBlockers`, `src/spec/review-findings.ts`, matches every tagged line).
- **Decision:** only the findings in the current attempt's findings section count as open. Findings of earlier attempts that the Reviewer cites as resolved, in its summary or a section on earlier attempts, do not block. The Reviewer is not asked to reword its answer.
- **Delivery:** the guard fix and a test reproducing this case (resolved `[security/high]` in the recap + PASS is accepted; the same tag in the current findings is refused) are committed separately, before T4. T4's PASS is then recorded with the Reviewer's answer as written.
- **Decided by:** Juan D. Guzmán, 2026-10-21, in the T4 implement session.

### Decision — 2026-10-21 — which mandao runs this spec

- **Finding:** `.mandao/bin/mandao.mjs` finds no `node_modules/.bin/mandao` in this worktree and falls back to the global `mandao`, a link to the main checkout (`/Users/jguzman/orca/projects/mandao`). Every `mandao run` of this spec until now (T1 to T4: step, checkpoint, red, gates, review-pack, commit, approve) therefore ran the code of `main`, not this branch's.
- **Decision:** from T4's PASS until close, every command runs this worktree's build (`npm run build`, then `node dist/cli.js …`). Kaizen should take into account that the earlier evidence was recorded by `main`'s code. That includes the refusal of T4's PASS by the old `securityBlockers`, fixed in 47b0c66.
- **Decided by:** Juan D. Guzmán, 2026-10-21, in the T4 implement session.
