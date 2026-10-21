VERDICT: PASS

**Review of MDO-0010, task T4, attempt 1.** This is reviewer persona output. Mandao records which model reviewed from what it invoked; the caller asked for my identity, and I am Opus 5.5 (claude-opus-5-5).

**Spec conformance**
- **FR-4 / D5:** `mandao run cost --record` now builds its baseline from every `specs/*/_log/costs.yml`, the quick log included (`allEntries` in `src/cli/run-cost.ts:69-77`). Those entries are sorted by `at` and passed to the unchanged `sessionDelta`. Writes and summaries still use only the target file (`entries`, lines 135-145). This matches "subtracts the session's latest `cumulative` found in **any** `specs/*/_log/costs.yml` (and `specs/quick/_log/`), not only the file it writes".
- **S-4.1 and S-4.1/C1:** the 9.0 record for MDO-0009 plus a 9.5 transcript gives a 0.5 record. The test checks `usd`, `roles.quick`, `total`, and that 9.5 never reaches `specs/quick/_log/costs.yml`. Both pass in the verify output (lines 27-28).
- **S-4.2:** with no earlier record anywhere, the quick is charged the whole session (9.5). It passes (line 29). It was green before the change, which is right: it pins existing behavior.
- **The two existing tests named in T4's "Done when"** ("delta since the last record", "quick changes have their own log") still pass: 28/28 in the verify output, and the full `test` gate passed.
- **Correctness cases you asked about:**
  - **Two records for one session in one spec:** the sort by `at` is stable, and `sessionDelta` takes the latest. A session's cumulative only grows, so the latest record is the right baseline.
  - **A regular spec recording after a quick:** the pool includes the quick's record, so the same fix also stops double counting in that direction.
  - **Missing `costs.yml` in other specs:** filtered out by `existsSync`.
  - **Non-directory entries under `specs/`:** `logPath` points to a file that does not exist, so they are filtered out too.
  - **A corrupt `costs.yml` in another spec:** this fails, but loudly. See the first finding.
- **TDD:** `loop.tdd.required` is true, `red: true`, `evidence: red`, and `redTests.changed` is empty, so no red test was weakened.
- **Module boundaries:** the pooling belongs in `src/cli/run-cost.ts`, not `src/spec/costs.ts`.
  - `src/spec/AGENTS.md` says: "The CLI and scripts gather inputs; writer helpers own persistence", and "keep side effects in scripts/CLI".
  - `sessionDelta` stays pure in `src/spec/costs.ts` and the file-system reading stays in the CLI. No module's internals are touched.
- **Module docs:** `src/cli/` has no `AGENTS.md`, and the behavior of `src/spec/` did not change, so no guide update is needed.
- **Gates:** format, lint, typecheck, test, build and metrics passed. secrets and sast are NOT_INSTALLED (exit 127) and audit was SKIPPED, so I make no claim about those three.

**Findings (all advisory, none blocking)**

1. [core/medium] `src/cli/run-cost.ts:75`: one corrupt `costs.yml` anywhere under `specs/` now stops every `--record`, in every spec and in the quick log. Before, only the target file's own corruption did. This is not a swallowed error, so the rule in `docs/constitution/standards.md` §Errors is not broken. It does make failures spread wider: a bad file in an unrelated, maybe closed, spec blocks recording costs for `/mandao-implement`. Advisory, since no written rule covers it.
   - Remediation: parse the target file strictly as now. Read the other specs' files best-effort, like `readCostEntries` in `src/scripts/session-turns.ts:130-137`, with the comment `standards.md` §Errors requires ("`catch {}` without rethrow is allowed only for best-effort reads … and must say why in a comment").
2. [core/low] The sort by `at` (`run-cost.ts:76`) has no test. Without it, `readdirSync` order would decide the baseline: `MDO-…` sorts before `quick`, so an older quick record would win over a newer spec record. Advisory. The mandatory S-4.x tests are present and meaningful.
   - Remediation: add one case with an older quick record (for example cumulative 5.0) and a newer MDO-0009 record (9.0), and expect 0.5.
3. [core/low] The S-4.1/C1 test sets up the same fixture as S-4.1 and asserts its negation (`not 9.5`). It adds one check, that the file holds no `usd: 9.5`, but otherwise repeats S-4.1. Advisory; you could merge it into S-4.1 and keep both scenario IDs in the title.
4. [core/low] `findSpec` accepts a path to a spec folder outside `config.paths.specs` (`src/scripts/spec.ts:40`). In that case the target spec's own entries are no longer in the pool, which would bring back the double count for that spec. Advisory.
   - Remediation: use the union of `entries` and `allEntries(ctx)`, dropping duplicates by `at`+`session`, or document that refs must live under `specs/`.
5. [core/low] `allEntries` repeats the path logic that `specsDir(root, config)` in `src/scripts/spec.ts` already provides, and calls `readConfig` a second time per invocation (the `action` already has `config`). Advisory: pass `config` in and reuse `specsDir`.

**Open points**
- OPEN: records written in another git worktree's `specs/` are not seen. If a session records MDO-0009 in its worktree and then runs the quick in the main checkout before merging, the quick is still charged the whole session. The spec only names `specs/*/_log/costs.yml`, so this is outside T4's written scope. It is worth noting because MDO-0010 moves sessions between worktrees.
- ASSUMPTION: D5 says "`readCostEntries` already reads every spec's `costs.yml`", but it reads one spec folder (`session-turns.ts:130`). So the new helper does not duplicate existing logic; the spec's wording is just slightly off.

VERDICT: PASS
