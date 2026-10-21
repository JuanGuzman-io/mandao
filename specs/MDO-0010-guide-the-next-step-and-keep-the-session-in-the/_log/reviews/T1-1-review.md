VERDICT: FAIL

I reviewed MDO-0010 T1, attempt 1, against spec.md (FR-1, FR-5, D1, D6), tasks.md T1, `src/spec/AGENTS.md` and the code the pack points to. There are two blocking spec gaps and one blocking defect. I ran nothing: I have no shell, so test claims below rest only on the gate table in the pack.

**Gates (from the pack only):** format, lint, typecheck, test, build, metrics and scan-markers are PASS. **secrets (gitleaks) and sast (semgrep) are NOT_INSTALLED (exit 127).** So no secret scan and no static security analysis ran on this diff, and this review is not a substitute for them. audit is SKIPPED.

## Blocking findings

[core/high] **AC-5/C3 is broken on the `tasks` step.** In `src/cli/approve.ts`, `blockers()` (lines 54-58) checks for critical OPENs only on `story`, `design` and `spec`. The `tasks` branch never checks them.
- `questionBefore()` reads only `openItems(spec).ask`, which leaves critical OPENs out. Its comment says "a critical OPEN never gets here: `blockers` refuses it", and that is false for `tasks`.
- FR-5 names "`/mandao-implement` on draft tasks" as a `--by-running` entry point. So `mandao approve <ID> tasks --by-running /mandao-implement` on a standard spec whose requirements.md gained an `OPEN(critical…)` after design approval records an approval and returns `go`.
- Rule: AC-5/C3 "**BUT it must NOT** record an approval while a critical `OPEN` remains, whatever is answered" (spec.md FR-5 / story.md).
- The tests cover only the lite `spec` step, so they cannot catch this.
- Fix: add the critical-OPEN check to the `tasks` branch of `blockers()` (at least under `--by-running`), fix the comment, and add an S-5.4 case for `approve tasks --by-running`.

[core/high] **Your point 2: the "critical Consistency Check finding" gap is not acceptable.** The spec names this item three times:
- AC-5/C1 "a pending decision, a `CONFLICT`, a `[NEEDS CLARIFICATION]` or a critical Consistency Check finding";
- FR-5 "Open means: … a critical Consistency Check finding";
- D6 "`approve` … now also reads: … the Consistency Check's critical rows".

The implementer's "no machine marker" premise is wrong. `core/templates/shared/rules/consistency-check.md:20-26` defines the table: each row has a severity (`critical` or …), and "A `critical` finding blocks `tasks`". spec.md:340 shows the live shape, `| ID | Type | Finding | Severity | Owner | Status |`.
- Fix: parse the `## Consistency Check` table in `openItems`. Treat a row with Severity `critical` and a Status that is not resolved as an `ask` item (or as a blocker). Do the same in `nextStep`, so implement is not offered past it (AC-1/C1).
- Add the missing case to the S-5.2 `test.each`.
- If the team decides otherwise, that needs a spec amendment through clarify, not a silent drop.

[core/medium] **`shown` rows hide "changed after its approval" (AC-1, S-1.4).** `nextFor` passes every row, `shown` included, to `changedSince`, which runs `Object.assign` over the rows in file order. A later `shown` row overwrites the hash recorded at approval.
- FR-5 has specify, tasks and clarify end with `run next --shown`. So: edit an approved spec.md, then `run next --shown`, then `run next`, and the change is no longer reported. It recommends `/mandao-implement` on a spec that changed after its approval.
- ASSUMPTION: clarify does not set the document back to `draft` (if it did, `draftStep` would catch it). I did not confirm this.
- Rule: AC-1 THEN "…and whether the spec changed after its approval"; FR-1 "whether an approved document changed after its approval".
- Fix: in `nextFor`/`settle`, compare against approval rows only (`step !== 'shown'`). Keep the `shown` comparison only in `questionBefore`. Add a unit test where an approval is followed by a `shown` row.

## Advisory findings

[core/medium] **The "verify verdict / verify findings" input is missing.** AC-1 THEN lists "verify findings" and FR-1 lists "the verify verdict". `stage()` reads only `story.status === 'verified'`. A spec whose verify failed, with every task done, gets `/mandao-verify` again instead of a fix step. No scenario or Done-when item checks this, so it is advisory. OPEN: fix it in this retry or defer it in tasks.md explicitly.

[core/medium] **CONFLICT detection is narrow.** The regex `^[ \t]*[-*][ \t]+(CONFLICT\b…)` in `src/spec/next.ts`:
- matches only a bullet that starts with bare `CONFLICT`;
- misses the documented inline form `CONFLICT(a: …, b: …, decides: …)` (`core/templates/shared/rules/context.md:20`) when it is not a bullet;
- misses backticked forms;
- misses Consistency Check rows of Type `CONFLICT`. S-5.2 says "a `CONFLICT` row", and this spec's own CC-1 is one.
- It has no notion of resolved, so a resolved CONFLICT bullet asks forever.
- Fix: share one marker parser with the Consistency Check table parse above, and exclude resolved rows.

## Your point 3: the implementer-chosen rules

- **Depth read from frontmatter:** this contradicts FR-1 "depth (lite when `spec.md` exists)". It works today because the template writes `depth: lite` (`core/templates/shared/spec/spec.md:4`), but a spec.md without that line would be treated as standard and recommend `/mandao-tasks`. [core/low] advisory: decide lite by whether `spec.md` exists (`LITE_DOC`), passed in by the caller so `nextStep` stays pure.
- **Draft requirements ignored once tasks.md is approved:** acceptable, since it is an odd state. Advisory only: write the rule down in `src/spec/AGENTS.md` or in a clarification.
- **tasks.md and the `status:` line excluded from hashes:** acceptable. It follows D1's purpose, and the tasks.md exclusion is documented in docs/cli.md and AGENTS.md.
- **No `shown` row means `--by-running` makes no change claim:** acceptable. It mirrors S-1.4/C1, and T3 makes the commands write `--shown`. [core/low] advisory: say this in docs/cli.md, because older specs then approve without the change check.
- **closed/abandoned → `/mandao-story`, blocked → `/mandao-clarify`:** acceptable as advisory. The spec does not fix these and they are reasonable.

## Your point 1: files outside the task list

- **`src/spec/AGENTS.md`:** acceptable and in fact required. spec.md "Module Docs Impact" asks for this line. The line will need updating once the `shown`/approval split above is fixed.
- **`test/integration/approve.test.ts`:** it is in the task's `files` list. Its two changed assertions move from the old fixed string to the new `next` shape, as the spec expects ("`approve.test.ts` changes its `next` expectation", Risks). This is not a red test weakened to pass, so there is no TDD violation. The `// mandao-scans: none` header and the biome formatting are fine.
- **TDD:** red evidence is recorded (`loop.tdd.red: true`, `evidence: red`).

## Other checks

[core/low] **Placement (advisory):** `currentHashes`, `recordShown` and `nextFor` live in `src/cli/approve.ts`, and `run-spec.ts` imports them from `./approve.js`. It is CLI to CLI, so it breaks no `architecture.md` boundary, but a small `src/cli/next-facts.ts` would separate the IO that gathers the facts from the approve command.

[core/low] **Command not checked (advisory):** `--by-running` accepts any command for any step, for example `approve story --by-running /mandao-implement`. Consider checking the command against the step.

[security/low] **Security (advisory):** `--by-running` and `--words` are written through `yaml.stringify`, and I found no injection or path issue. I found no high or critical security issue, keeping in mind that secrets and sast did not run.

**Exemplar and module boundaries:** `next.ts` follows `loop.ts` (pure, structured answer, IO left to the caller). No other module's internals are touched.

**Test quality:** the tests are meaningful. S-1.6 takes a byte snapshot of the spec folder, and S-5.2 re-runs `--shown` so that the open item, not a changed document, is what triggers `ask`. Coverage is missing for the `tasks` step, Consistency Check rows and the `shown`-after-approval case above.

Files: `src/spec/next.ts`, `src/cli/approve.ts` and `src/spec/approvals.ts`, all under /Users/jguzman/orca/projects/mandao.worktrees/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/

VERDICT: FAIL

Model: Opus 5.5 (claude-opus-5-5).
