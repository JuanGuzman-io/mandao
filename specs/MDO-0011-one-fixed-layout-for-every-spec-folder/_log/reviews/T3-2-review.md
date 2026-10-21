VERDICT: PASS

Reviewer model: claude-opus-5-5. This is the same model as the Implementer, so independence is reduced and I reviewed adversarially.

Both blocking findings from attempt 1 are fixed, the advisories are fixed or deliberately left, and I found nothing new that blocks. I ran nothing. For gates and tests I rely only on the Leader's output in `_log/gates/T3-2.md`: format, lint, typecheck, test (52 files, 493 tests), build and metrics PASS; audit SKIPPED; secrets and sast NOT_INSTALLED.

**Attempt 1 blocking findings**

1. **Readers not tested on version 2: fixed.** test/integration/state-log.test.ts has a new "T3 readers" block:
   - (a) It approves `story` on a version 2 spec, checks the row in `state.yml` carries the `story.md` hash, edits the story, and asserts that `run next` gives the reason `story.md changed after its approval`.
   - (b) It runs `run next --shown`, edits the story, then runs `approve tasks --by-running /mandao-implement`. It asserts `result: 'ask'`, that the output names `story.md`, and that `state.yml` is unchanged.
   - Both are meaningful. Version 1 coverage stays in approve.test.ts and next.test.ts, so the done-when item "their tests pass on both versions" is now met.
2. **Swallowed schema error in Kaizen: fixed.** In `src/scripts/session-turns.ts:240-251`, `cutEstimateRows` lets `readState` errors through on version 2. The `try/catch` now wraps only the version 1 `readFileSync`, so version 1 behaves as before.
   - The new "T3 Kaizen" test puts a bad approval row in `state.yml` and expects `measureSessions` to throw. It was red on attempt 1 code.
   - The bare `toThrow()` is acceptable: the cut-estimates test just above uses the same setup without the bad row and does not throw, which isolates the cause.
   - The Implementer's choice (propagate on version 2, catch only IO on version 1) is correct and matches the src/spec/AGENTS.md contract.

**Attempt 1 advisories**

- **Per-model over-count: fixed.**
  - `modelBaseline` in `src/cli/run-cost.ts` uses the `model:` lines of the session's last `cumulative` when they exist. Version 1 histories therefore get the same numbers as before, because `sessionDelta` used that same last-cumulative baseline.
  - Otherwise it falls back to `sessionModelTotals`.
  - I traced the mixed histories (version 1 then version 2 then quick, and version 2 then version 1) and none double-counts.
  - The new test asserts `models: { 'claude-sonnet-5-5': 0.5 }`.
  - The fixture change (the person's decision 1) is a defect fix, not a weakened test. A record with `usd: 9` and `models: {}` gives no per-model history to derive 0.5 from. The default parameter applies to that test only, and no assertion changed. I accept the Leader's statement that it was red on HEAD's code (9.5 vs 0.5).
- **spend.ts reading `approvals.yml` as a whole file: fixed.** It now uses `readApprovalLog`.
- **progress `schema_version`: fixed as the person decided (decision 2).** progress.ts has a comment-only diff and keeps `schema_version` at 1. The state.test.ts fixture went from 2 to 1, which matches the record's own format version and weakens no assertion.
- **`CURRENT_LAYOUT_VERSION`: fixed.** It is added in layout.ts, used by start.ts, and pinned against the story template by test/unit/layout-version.test.ts.
- **Hard-coded `'state.yml'` in start.ts: fixed.** It now uses `STATE_FILE`.
- **`run red` has no direct version 2 test: deliberately left.** This was accepted in attempt 1 because the write goes through the shared `writeProgress`, which the checkpoint test covers on version 2.

**TDD evidence (ADR 0022)**

- `loop.tdd.required` is true and the evidence is red.
- Execution rows 41 and 42 are both RED for attempt 2. Row 41 was recorded while the Tester had deliberately broken approve.ts to prove the reader tests can fail. It proves those tests discriminate, not that the code was red.
- Row 42 is from the restored tree: the Kaizen and cost tests fail on attempt 1 code. That is valid red evidence, so the evidence stands. The duplicate row is noise in a log that cannot be edited, not a defect.
- Row 44 (layout-version.test.ts) is labelled "red tests by mandao-tester" with claude-sonnet-5-5, but the Leader says the Implementer recorded it. See the provenance finding below.

**Version 1 writes are unchanged (MDO-0011 is version 1)**

- story.md has `schema_version: 1`, and `_log/` has no `state.yml`.
- progress.yml, session-cuts.md (same columns, `toFixed(2)` savings), approvals.yml, start.yml and baseline.md are still written in their old formats.
- `logPath` redirects to `state.yml` only when `specKeepsState` is true. The version 1 branches of `writeProgress`, `appendApprovalLog`, `recordCutEstimate`, `baseline`, `recordRequest` and `claudeEntry` (with `rolesOnly` false, `cumulative` stays the role and model totals) match the old code.
- Integrity: `state.yml` is under `_log/`, so the writer's integrity tracking (`recordLogWrite`) covers it.

**Spec conformance**

- S-3.5 and S-3.5/C1 are tested end to end through `run status <ID>` with no target and through `implement-summary`. Both `execution.md` and `state.yml` stay byte-identical after showing the timeline. Approving adds no row to `execution.md`.
- The writers, readers, Kaizen and costs (`cumulative` per role, kept, no `model:` lines; the 0.5 pin on version 1 and version 2) items of T3's done-when are met.
- The public-api change (`status <spec> [to]`) is documented in docs/cli.md.
- **AGENTS.md:** src/spec/AGENTS.md describes state.ts, timeline.ts, costs and `CURRENT_LAYOUT_VERSION`.

**Findings (all advisory)**

[core/low] Duplicated delta rule: `modelDelta` in src/cli/run-cost.ts repeats `sessionDelta`'s subtract-and-threshold loop, including the `0.000001` epsilon from src/spec/costs.ts.
- The checklist lists "duplicated business logic" as blocking. I judge this a small arithmetic duplicate rather than a business rule, so it is advisory.
- Remediation: export one `deltaAgainst(before, now)` from src/spec/costs.ts and use it in both places. `modelBaseline` could live there too, since it is cost logic that ended up in the CLI.

[core/low] Stale glossary: docs/constitution/glossary.md:24 still places Approval in `_log/approvals.yml`. Version 2 approvals live in the `approvals` section of `_log/state.yml`.
- Remediation: update the row now or in the spec's docs/close task.

[core/low] Execution row 44 attributes the layout-version.test.ts red run to `mandao-tester` and claude-sonnet-5-5, but the Leader says the Implementer recorded it.
- OPEN: is this a `run red` attribution default or a wrong flag? Check how `run red` sets the role, so the provenance in the log is right.

[core/low] I cannot confirm from the test gate output that test/unit/layout-version.test.ts ran. The gate ran the impacted set (52 of 76 files) and lists no file names.
- ASSUMPTION: it was included, since layout.ts changed.
- Remediation: run it explicitly in the checkpoint command.

[core/low] forced.ts, doctor-specs.ts and spend.ts are outside T3's file list (forced.ts belongs to T4). The changes are a refactor onto `readProgress` and `readApprovalLog` with the same behaviour. They were accepted in attempt 1 and are noted here for scope only.

[security/low] The secrets and sast gates are NOT_INSTALLED, so no tool checked this diff for security. I reviewed it by hand:
- There is no new untrusted input, shell use or path built from user data.
- `state.yml` and story frontmatter are parsed with the existing `yaml` library and zod schemas.
- No security blocker.

VERDICT: PASS
