VERDICT: PASS

Reviewer model: Opus 5.5 (claude-opus-5-5). The Implementer is the same model, so the brief's "reduced independence" note applies.

I review T4 attempt 2 as PASS. Both blocking findings from attempt 1 are fixed, the Done-when items all have tests, version 1 output is unchanged, and I found no weakened test.

**What I read:**
- The pack: `specs/MDO-0011-one-fixed-layout-for-every-spec-folder/_log/reviews/T4-2-pack.md`.
- The attempt-1 review: `specs/MDO-0011-one-fixed-layout-for-every-spec-folder/_log/reviews/T4-1-review.md`.
- tasks.md T4, lines 136-160.
- design.md D3 and D4.
- The current `src/writer/log-integrity.ts`, `src/writer/files.ts` (`removeScratchDir`), `src/scripts/spec-log.ts` and `src/cli/run-premise.ts`.
- The new files: `src/schemas/spec.ts`, `test/integration/log-v2.test.ts`, `test/integration/log-v2-wide.test.ts`, `test/log-v2-helpers.ts`, `test/unit/log-cache.test.ts`.
- The Tester's split script, `/private/tmp/claude-501/-Users-jguzman-orca-projects-mandao-worktrees-MDO-0011-one-fixed-layout-for-every-spec-folder/d23e1705-0503-4eeb-88fe-7f6f70d705ca/scratchpad/split.py`.

**Test results:** I ran nothing. All I have are the Leader's results:
- `npx vitest run`: 79 files, 757 tests passed.
- Gates: format, lint, typecheck, build and metrics passed. test, secrets and sast are not installed.

## Attempt-1 blocking findings

**1. [security/high] Close could recursively delete folders outside the cache. Fixed.**
- `specCacheDir` now accepts only an id that matches the anchored `STORY_ID` pattern (`^[A-Z][A-Z0-9_]*-\d+$`, no `m` flag), whether it comes from the story's `id` or from the folder-name fallback. Anything else throws, so `..`, `../..`, a path or lower case can no longer name the cache folder.
- `dropLogCache` checks `level === 'full'` and the version before it computes any path. It then calls `removeScratchDir(dir, cacheRoot(specDir))`, so the guard now checks against `.mandao/cache/` instead of the folder's own parent.
- `integrityFile` goes through `specCacheDir` for version 2. A bad id therefore makes the hash write throw, and nothing lands outside the cache.
- Tests cover it:
  - `test/unit/log-cache.test.ts`: refused ids, refused folder-name fallbacks, a removal that leaves sibling caches and `.mandao/` alone, and no stray `integrity.json`.
  - The `security:` describe in `log-v2.test.ts`: end-to-end `close-summary --closed` and `premise` runs with path ids, checking that `.git/HEAD`, the config, `package.json` and the sources survive.
- `src/writer/AGENTS.md` documents the change.

**2. [core/medium] Done-when evidence was incomplete. Fixed.**
- **S-3.1:** `log-v2-wide.test.ts` runs 3 tasks × 2 attempts with FAIL then PASS. It includes a characterization mutation on T3, 2 premises, a 10,000-line failing gate and a 5,000-line change per attempt (so a pack per attempt). It checks:
  - `git ls-files` lists exactly the six files;
  - every commit touches only those six;
  - the committed `_log` is at most 1,000 lines;
  - the MUTANT row's evidence path points into the cache.
- **S-3.2:** at least 6 packs, the 10,000-line gate output and `mutations/T3-1.md` are in the cache, none in `_log/`, and `git status` is clean of them.
- **S-3.4:** each `premises.md` section keeps at most 20 lines of a 100-line output. A not-installed gate is named once per attempt section, and its command never appears.
- **S-3.3:** `answers()` now includes resume (`step … --no-brief`).
- The version 2 full-run path (`recordFullRun`) is tested, and so is the version 1 `full-runs.md`.
- `logs.level` summary and full are tested.

## Attempt-1 advisories
- **Two version checks: fixed**, apart from one edge case (finding below).
  - Both checks now go through `keepsLogCache` in `src/schemas/spec.ts`.
  - `LAYOUT_VERSIONS` and `STORY_ID` are each written once. `src/spec/layout.ts` re-exports `LAYOUT_VERSIONS`, and `story.ts` uses `STORY_ID`.
  - A table test pins `2`, `'2'`, `"2"`, `3` and `1` for both checks.
- **`recordedPremises` `!`: fixed.** It now uses `?.[0] ?? []`.
- **run-ledger.ts option text: fixed.**
- **Routing not in `logPath` as D3 says: still open, still advisory** (finding below).
- **Merged-log headings in free-text reviews: still open, still advisory (low).**

## Spec conformance
- **AC-3 / C1 / C2 / C3:** met. Six committed files. The bulk goes to `.mandao/cache/<ID>/`, which the managed ignore block lists. The readers give equal answers on both versions, including the edit detection (S-3.3/C2). Verdict, findings, the failing gate's lines for the task's files, the approval with words and hashes, and premise exit plus excerpt all stay committed.
- **D3:** the routing table is implemented as written. The one exception is the `logPath` mechanism.
- **D4:** version 1 is unchanged. I compared each version 1 branch with the code it replaced:
  - `gatesLog` builds the same text (title, verdict line, table, `## Output`, blocks).
  - The premise record's lines and its 40-line excerpt are the same.
  - Review, pack and mutation paths are the same, and the mutation `where` is `relative(specDir, file)` as before.
  - `recordedPremises` is unchanged for version 1, and so is discrepancies.md.
  - The only version 1 difference: the premise scratch-dir guard is now `within` the premises folder instead of the spec folder. That is narrower, so it is still safe.
  - `S-3.1 (regression pin)` and the version 1 full-runs test pin this.
- **Module guides:** `src/spec/AGENTS.md` and `src/writer/AGENTS.md` are updated.
- **Changes outside the task's file list:** each one is justified:
  - `src/schemas/spec.ts` and `src/schemas/index.ts`: needed so the writer, which may depend on schemas only, can share the predicate.
  - `src/spec/layout.ts` and `src/spec/story.ts`: they now import the definitions written once in `src/schemas/spec.ts`.
  - `run-ledger.ts`: the advisory text fix.
  - `run-close.ts` and `engine.test.ts`: carried over from attempt 1.

## TDD (ADR 0022)
- **Red evidence:** recorded, per the brief (`tdd.red: true`, evidence `red`) and the Leader's notes.
- **The changed test (`redTests.changed: test/integration/log-v2.test.ts`) is not weakened.**
  - `split.py` moves the test bodies by line-range slices (original lines 143-269 and 418-468 to the main file, 271-416 to the wide file). The only text substitution is `JSON.parse(out.at(-1)!)` → `lastOut()`, which behaves the same.
  - The hooks moved into `useLogEnv()` unchanged.
  - The count matches the Leader's account: 5 wide tests.
- **OPEN:** the script replaces the old `wideHistory` body with `wideAttempt` plus a shorter `wideHistory`. The pre-split body is not available to me, so I cannot confirm it was the same. The new helper does build exactly the history the Done-when asks for, so nothing is weaker against the spec.

## Findings

**[core/low] The two version checks still disagree on numeric forms YAML reads as 2. Advisory.**
- **Where:** `src/writer/log-integrity.ts` `storyField` against `src/scripts/spec-log.ts` `storyVersion`, which goes through `frontmatterOf`.
- **How:** with `schema_version: 2.0` (also `+2` or `0x2`), YAML returns the number 2, and the story schema's `z.literal([1, 2])` accepts it. The regex only turns `^\d+$` into a number, so it returns the string `'2.0'`.
  - `specLogInCache` then says true and `usesLogCache` says false.
  - The hashes would go to `_log/.integrity.json`, a seventh file in `_log/`.
- **Rule:** the module's own statement in `src/writer/AGENTS.md` that it is "the same predicate as the spec domain's `specLogInCache`". No constitution rule covers this, so it stays advisory.
- **Fix:** have `storyField` read the version as YAML does for these forms, or reject the forms in the story schema. Add `2.0` to the version table test.

**[security/low] The writer reads front matter with a regex, not through `src/engine/frontmatter.ts`. Advisory.**
- **Rule:** `security.md` "Parsed spec content" row: "Only YAML/JSON through `src/engine/frontmatter.ts`".
- **Why it stays advisory:**
  - The threat that row names, executable front matter, cannot happen with a regex.
  - The id now fails closed against `STORY_ID`. For example, `id: >-` on its own line throws.
  - `architecture.md` lets the writer depend on schemas only, so it cannot import `frontmatter.ts`.
- **Fix:** record the exception in security.md, or move a YAML-only front matter reader where the writer may use it.

**[core/low] Routing is not centralised in `logPath` as D3 says. Advisory, carried from attempt 1.**
- **Rule:** design.md D3 says "`logPath(spec, file)` maps each logical log to its version 2 home. Callers keep their `LogFile` names."
- **Where:** six callers branch on `specLogInCache` themselves: checkpoint-guards, run-leader, run-review, run-premise, run-mutation and forced.
- **Fix:** amend D3 to describe the caller-side branch, or centralise it in a later task.

**[core/low] `src/schemas/spec.ts` holds constants and a predicate, not zod schemas. Advisory.**
- **Rule:** `architecture.md` describes Schemas as "zod schemas, single source of types".
- **Fix:** none needed for this task. It is the only module both the writer and the spec domain may import. Note it in the module index if it is kept.

**[core/low] A version 2 integrity check finds nothing after close. Advisory, a consequence of the design.**
- `integrity.json` lives in the cache, and `logs.level: summary` deletes the cache at close. After close, `logDiscrepancies` therefore sees no hashes.
- This is consistent with D3 (integrity data in the cache), so it is noted only for awareness.

**[core/low] Merged-log parsing depends on headings in free text. Advisory, unchanged from attempt 1.**
- A line `## Tn — attempt k` inside a review answer stored in `reviews.md` would split that section on the next rewrite.

No blocking findings remain. There is no high or critical security finding.

VERDICT: PASS
Model: Opus 5.5 (claude-opus-5-5)
