VERDICT: FAIL

Reviewer model: claude-opus-5-5 (the same model as the Implementer, so independence is reduced).

I reviewed the pack /Users/jguzman/orca/projects/mandao.worktrees/MDO-0011-one-fixed-layout-for-every-spec-folder/specs/MDO-0011-one-fixed-layout-for-every-spec-folder/_log/reviews/T3-1-pack.md against T3's done-when in tasks.md:110-118, design D3/D4, src/spec/AGENTS.md and the source files it touches. Two findings block. Everything else holds or is advisory.

**Blocking findings**

[core/medium] **Readers are not tested on version 2.** Files: test/integration/state-log.test.ts, test/integration/approve.test.ts, test/unit/next.test.ts.
- Rule: tasks.md T3 done-when, "**Readers:** `next.ts` and `approve` read hashes and `shown` rows from `state.yml`, and their tests pass on both versions". Also design.md D4: "Every reader is tested on both layouts".
- What is proven on version 2: the approvals are read back (the S-3.5/C1 test approves on top of three existing rows and gets four).
- What has no version 2 evidence:
  - change-after-approval: the hash comparison in `nextStep` / `nextFor` against approval rows in `state.yml`;
  - `approve --by-running`, which reads the last `shown` row from `state.yml` (`questionBefore`, approve.ts:193-195).
- approve.test.ts and next.test.ts still run on version 1 fixtures only. The Implementer's open point is therefore a done-when item that is not met.
- Remediation: add version 2 tests to state-log.test.ts (or make the existing ones run on both versions):
  - (a) approve `story` with hashes, edit story.md, then `run next` must report the change after approval;
  - (b) `run next --shown`, edit a document, then `approve … --by-running <cmd>` must ask about the changed file.

[core/medium] **A schema error is swallowed in Kaizen's cut-estimate reader.** File: src/scripts/session-turns.ts, `cutEstimateRows`.
- Rule: the Reviewer checklist lists swallowed errors as blocking. src/spec/AGENTS.md (this diff) also says `parseState` "throws on a row that breaks its schema (never drops it)".
- The old `try/catch` covered only the read of session-cuts.md. It now also wraps `readState(specDir)`, which throws a ZodError when *any* section of state.yml is invalid (for example one bad approval row). Kaizen then quietly reports no cut estimates on version 2, which contradicts the new module's contract.
- Remediation: catch only the IO error, or let schema errors propagate. Narrowing the try around `readFileSync` for version 1 keeps the old behaviour.

**Advisory findings**

[core/medium] **Per-model costs are over-counted when a session records a version 2 spec, then a version 1 spec or quick.** Files: src/cli/run-cost.ts `claudeEntry`, test/integration/state-log.test.ts regression pin.
- In the version 1 branch, `sessionDelta(entries, session, now)` compares the `model:` keys against the last `cumulative`. A version 2 entry no longer carries those keys, so the whole session's model spend counts as new.
- The regression-pin case (version 2 record, then `run cost quick`) hits this path: the new entry gets `usd: 0.5` but `models: {claude-sonnet-5-5: 9.5}`. The test asserts only `usd` and `roles`, so it passes.
- The done-when wording ("cross-spec baseline still gives 0.5") is met for `usd`.
- Remediation: compute the model part with `modelDelta` (the sum of earlier `models`) in both branches. It equals the `model:` cumulative for version 1 histories. Then add `models: { 'claude-sonnet-5-5': 0.5 }` to the pin assertion.

[core/low] **src/scripts/spend.ts still reads `logPath(dir, 'approvals.yml')` and parses the whole file.** On version 2 that is state.yml, so it works only because state.yml has a top-level `approvals` key.
- This goes against the new `logPath` doc comment ("read and write them with the section helpers below, never as whole files"). It also skips the schema check on the other sections, which the rest of the code applies.
- Remediation: use `readApprovalLog(specDir)`.

[core/low] **The progress record's `schema_version` now accepts 1 or 2.** src/spec/progress.ts sets `progressSchema.schema_version` to `z.literal([...LAYOUT_VERSIONS])`.
- This mixes the record's own format version with the spec layout version, and ties progress.ts to layout.ts.
- Every writer (run-ledger.ts:151, run-red, commits) still writes `schema_version: 1`. Only the Tester's unit fixture uses 2.
- Harmless today. Either decide it explicitly or keep the record at 1.

[core/low] **Assumption on `mandao start`: new specs take the last `LAYOUT_VERSIONS` entry** (`NEW_SPEC_KEEPS_STATE`, start.ts). It is acceptable today: T1/T2 made new stories version 2, and the last entry is 2.
- It does create a second source of truth next to the story template's `schema_version`. Adding a version 3 before updating the template would make them disagree.
- Suggest one exported `CURRENT_LAYOUT_VERSION` in src/spec/layout.ts, used by start.ts and pinned against the template by a test.

[core/low] start.ts:129 hard-codes `'state.yml'` instead of using `STATE_FILE` from spec-log.ts.

[core/low] **`run red` has no separate version 2 test.** It writes through the shared `writeProgress`, and the checkpoint test covers that on version 2 (progress section written, approvals kept, `readSpec` reads it back). I accept this as evidence for the "red" writer item; a direct test would be stronger.

[security/low] The secrets and sast gates are NOT_INSTALLED, so no tool checked this diff for security. I reviewed it by hand and found no new untrusted input, shell use or path built from user data. Only state.yml and story frontmatter are parsed, with the existing `yaml` library and zod schemas. No security blocker.

**Checks that hold**

- **Spec conformance:**
  - Writers on version 2 go through the new state.yml helpers: start, baseline, checkpoint/red/commit queue, approve, `run next --shown` and cut estimates.
  - S-3.5 and S-3.5/C1 are tested end to end through `run status <ID>` (no target) and `implement-summary`. Approving leaves execution.md byte-identical.
  - Kaizen reads `cut_estimates` (`measureSessions` test).
  - A new version 2 cost entry has `cumulative` per role, with no `model:` lines and `cumulative` still present.
- **Version 1 writes are unchanged.** MDO-0011's story is `schema_version: 1`. `logPath` redirects to state.yml only when `specKeepsState` is true. The version 1 branches of `writeProgress`, `appendApprovalLog`, `recordCutEstimate` (same cells: `base = first + RELOAD_TOKENS`, `toFixed(2)`) and `claudeEntry` (`rolesOnly` false) match the old code. The regression pin covers approvals.yml on version 1.
- **forced.ts and doctor-specs.ts** now call `readProgress` and behave as before: an invalid checkpoint still gives no active task and no pending commits.
- **test/integration/start.test.ts** is a legitimate contract change, not a weakened test. D3 moves start.yml and baseline.md into state.yml, and new specs are version 2 (T1/T2). The new assertions are stricter: an exact gate row, the failure excerpt, and `start` fields matched by `toMatchObject`.
- **Red test quote change (state-log.test.ts:192):** that line builds the shell command for a fixture and asserts nothing. Its current form matches start.test.ts:69, and both assertions on it (lines 215 and 1872 of the pack) are intact. I have no shell, so I could not compare it byte for byte with the Tester's original. That it is unchanged in value is an ASSUMPTION.
- **TDD:** the red evidence is in execution.md:37 (`mandao-tester`, exit 1).
- **AGENTS.md:** src/spec/AGENTS.md describes state.ts, timeline.ts and the costs change. docs/cli.md, core/commands/specify.md, the generated copies, the lock hashes and the diagram hashes are consistent.
- **Module boundaries:** pure schemas sit in src/spec and IO in src/scripts/spec-log.ts, with writes through writer `writeText`. No architecture.md violation seen.
- **Quick change start-<slug>.yml:** acceptable. The quick folder has no story and no layout version, and T3's writers item is scoped to "a version 2 spec".

**Gates:** I rely on the Leader's results in the pack (format, lint, typecheck, test, build and metrics PASS; audit SKIPPED; secrets and sast NOT_INSTALLED). I ran nothing myself.

VERDICT: FAIL
