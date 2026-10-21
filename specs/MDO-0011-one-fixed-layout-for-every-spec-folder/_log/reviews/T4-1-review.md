VERDICT: FAIL

Reviewer model: Opus 5.5 (claude-opus-5-5). The implementer was the same model, so the brief notes "reduced independence".

Review of MDO-0011 T4, attempt 1. I read the pack (`specs/MDO-0011-one-fixed-layout-for-every-spec-folder/_log/reviews/T4-1-pack.md`), the untracked `test/integration/log-v2.test.ts`, tasks.md T4 (lines 136-160), design D3/D4, `src/writer/log-integrity.ts`, `src/writer/files.ts`, `src/scripts/spec-log.ts`, the readers in `src/cli/run-close.ts` and `src/scripts/spec.ts`, and `docs/constitution/security.md`. I did not run anything. Test results are only what the Leader reported: 6 files and 53 tests passed, the Implementer says 721 tests passed, and the gates passed except test, secrets and sast, which are not installed.

Most of the change matches AC-3. The log has the six files, and packs, full gate output, probes, mutations, discrepancies and integrity hashes go to `.mandao/cache/<ID>/`. `.mandao/cache/` is in the managed ignore block. In `gates.md`, only failing gates get output, and a gate that is not installed appears once, in the table. Premises keep claim, command, sha, exit and 20 lines. Full runs become a `## Full runs` section of `execution.md`. Version 1 output is unchanged for gates, reviews, packs, premises, mutations and integrity. The tests are not weakened: `redTests.changed` is empty and the red evidence is recorded. The verdict is FAIL because of one high security finding and gaps in the Definition of Done evidence.

## Findings

**[security/high] Close can recursively delete folders outside the cache. Blocking.**
- **Where:** `src/scripts/spec-log.ts` `dropLogCache` and `src/writer/log-integrity.ts` `specCacheDir`/`storyField`.
- **How it happens:**
  - `specCacheDir` takes the cache folder name from a regex read of `story.md` front matter: `id:` matched by `[^'"\s#]+`. Nothing checks it against the story schema pattern (`src/spec/story.ts:13`, `^[A-Z][A-Z0-9_]*-\d+$`).
  - `dropLogCache` then calls `removeScratchDir(dir, dirname(dir))`. Using the folder's own parent as `within` always passes, so the guard checks nothing.
  - A story with `schema_version: 2` and `id: ..` resolves to `<ws>/.mandao`, which deletes the config and lock. `id: ../..` resolves to the workspace root, `.git` included.
- **Why the normal checks don't stop it:**
  - `readSpec` only collects story schema issues; it does not throw.
  - `close-summary` reads the id as `spec.story?.meta.id ?? spec.name` (`run-close.ts:170`), so it carries on and reaches `dropLogCache` on `--closed`.
  - The same unvalidated id also lets every `cachePath` write (gate output, packs, mutations, `integrity.json`) land outside `.mandao/cache/`.
- **Rules violated:**
  - `src/writer/files.ts` `removeScratchDir`: "Removes a folder Mandao created, but only one strictly inside `within` … Never anything else."
  - `security.md` threat model, "User repository" asset (Mandao must not destroy user content).
  - `security.md` threat model, "Parsed spec content" row: "Only YAML/JSON through `src/engine/frontmatter.ts`". The writer now parses spec front matter with a regex and no schema.
- **Fix:**
  - In `specCacheDir`, accept the id only when it matches the story id pattern, otherwise throw. Apply the same check to the folder-name fallback.
  - In `dropLogCache`, pass `join(workspace, '.mandao', 'cache')` as `within`.
  - Add a unit test for an `id: ../..` story.

**[core/medium] Done-when evidence is incomplete. Blocking under "Done means the whole Definition of Done is met, with evidence for each item" (ADR 0022).**
- **S-3.1:** the Done-when asks for "3 tasks × 2 attempts, gates, reviews, a mutation and 2 premises … a 5,000-line pack per attempt". `log-v2.test.ts` runs 1 task (T2) × 2 attempts, with no mutation and no large pack. The version 2 mutation path (`keepEvidence` in `run-mutation.ts`) is not exercised by any test.
- **S-3.4:** nothing checks "premises.md keeps … at most 20 lines" (the probes print one line), or "names a not-installed gate once".
- **S-3.3:** the Done-when lists resume, but the comparison does not include it.
- **Fix:** widen the `history()` fixture to 3 tasks with a `mutation` run, a large pack, a long premise output and a not-installed gate, and add resume to `answers()`.

**[core/medium] Two separate checks decide "is this version 2". Advisory, because the writer may only depend on schemas.**
- **Where:** `specLogInCache` (`spec-log.ts`) reads the YAML front matter and asks the layout manifest. `usesLogCache` (`log-integrity.ts`) reads `Number(regex) >= 2`.
- **How they disagree:** with `schema_version: '2'` (quoted), or a future 3 that is not yet in `LAYOUT_VERSIONS`, the per-attempt files go to `_log/` the version 1 way while the hashes go to the cache.
- **Fix:** derive one from the other, or put the version predicate somewhere both modules may import.

**[core/low] The routing is not in `logPath` as D3 describes. Advisory.**
- D3 says "`logPath(spec, file)` maps each logical log to its version 2 home. Callers keep their `LogFile` names."
- Instead, every caller branches on `specLogInCache`: checkpoint-guards, run-leader (twice), run-review, run-premise, run-mutation and forced. Each new caller has to remember the branch.

**[core/low] Merged-log parsing depends on headings in free text. Advisory.**
- `logSections` splits on `^## (T\d+ — attempt \d+|P\d+ — )`. Reviewer answers are free text and are stored unfenced in `reviews.md`.
- A line in that form inside a review would split the section on the next rewrite.
- `recordedPremises` uses `/^P\d+/.exec(t)!`, which throws if a `T…` heading ever ends up in `premises.md`.

**[core/low] The version 2 full-run path is untested. Advisory.**
- `recordFullRun` writing the `## Full runs` section of `execution.md` has no test.

**[core/low] Stale option text. Advisory.**
- `src/cli/run-ledger.ts:191` still says "kept in _log/reviews/". It should mention `reviews.md` for version 2.

## The open points you raised

1. **gates.md cap:** I read D3 and the Done-when as at most 40 lines per failing gate per attempt, and the code does that. The test's whole-file count of 40 is stricter, and it passes only because a repeated attempt becomes a pointer. That is not a defect, and the pointer supports AC-3. ASSUMPTION: "the failing gate" in the Done-when means each failing gate.
2. **Empty files and costs.yml on the first log write:** this is consistent with "the six files are always there". The S-3.3 equality test covers that the extra empty `costs.yml` does not change readers.
3. **Cache root and ID:** finding the nearest `.mandao/config.yml` is fine. Taking the ID from the story id is the security/high finding above, and it is acceptable once validated.
4. **run-ledger text:** confirmed, advisory (above).

The touched-module guides are updated: `src/spec/AGENTS.md` and `src/writer/AGENTS.md`. The changes outside the task's file list are justified by the Done-when: `run-close.ts`, and the `.gitignore` regex in `engine.test.ts`.

VERDICT: FAIL
