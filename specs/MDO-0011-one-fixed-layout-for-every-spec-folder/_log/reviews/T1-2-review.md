VERDICT: FAIL

T1 attempt 2 fixes every blocking finding from attempt 1. It fails on one new problem: a leftover file, `src/spec/trace.ts.orig`, is in the diff. Deleting it is the only blocking change; with it gone I would pass this attempt.

I worked from `_log/reviews/T1-2-pack.md` (brief, gates T1-2, diff) and checked it against requirements.md, design.md, tasks.md, `docs/constitution/architecture.md`, `_log/execution.md` and the working tree. Gates are as the Leader reported them: all PASS. Secrets and SAST are NOT_INSTALLED and did not run.

## Findings

[core/medium] **A stray copy of trace logic, `src/spec/trace.ts.orig`, is in the diff.** Blocking.
- What: it is the old `trace.ts` without the removed-AC filter, left over from the hand-run mutation check. It exists on disk at `/Users/jguzman/orca/projects/mandao.worktrees/MDO-0011-one-fixed-layout-for-every-spec-folder/src/spec/trace.ts.orig`.
- Rule (persona clean-code list, blocking items): "duplicated business logic". This is a second, stale copy of the trace rules inside `src/spec`, and it is outside the task's file list.
- Fix: delete the file and confirm `git status` no longer shows it before `mandao run commit`.

[core/low] **`docs/spec-anatomy.md` still lists the old status-to-stage mapping.** Advisory.
- Where: the page says "the stage comes from the story status (draft, approved, in-progress or blocked, verified, closed)", which reads as one status per stage.
- What changed: `approved` now maps to `draft`, so no status maps to `specified`, and spec documents are required only from `in-progress`.
- ADR 0041 records this, but the page does not. The code is acceptable under D1 ("The stage is taken from the story status").
- Fix: state the real mapping on the page, or drop the `specified` stage and fold its documents into `planned`.

[core/low] **The version 1 lite rule sits outside the manifest.** Advisory.
- Where: `layoutFindings` adds `spec.md` as missing only when neither `spec.md` nor `requirements.md` is present.
- Effects: a version 1 lite folder with `requirements.md` but no `design.md` passes, and `layoutManifest(1, 'lite')` alone does not show this rule.
- This is lenient but within S-2.3/C1 ("the files version 1 allowed").
- Fix, if wanted: model "spec.md OR (requirements.md + design.md)" as an alternative in the manifest.

[core/low] **The removed-AC tests went green with no recorded red.** Advisory.
- Where: the "a removed AC is skipped" tests in `test/unit/layout.test.ts`.
- What happened: `run mutation` refused, and the Implementer stopped there instead of working around it. That was correct.
- Evidence: the hand-run patch and revert are noted in `_log/execution.md` line 18, but no script recorded them, so I cannot cite test output for them. (OPEN)
- Reading the code: the tests are meaningful. Without the filter in `storyRefs`, trace would report a GAP for AC-3, since no requirement serves it. Without the filter in `acStatus`, AC-3 would be listed. The task's own red evidence exists (`loop.tdd.red: true`).

[core/low] **`story.ts` casts the version union through `as unknown as`.** Advisory.
- Where: `src/spec/story.ts`, `z.union(LAYOUT_VERSIONS.map(...) as unknown as [z.ZodLiteral<1>, z.ZodLiteral<2>])`. The cast compiles even if `LAYOUT_VERSIONS` changes.
- Fix: build the tuple without a cast, or add a type-level check that ties the tuple to `LAYOUT_VERSIONS`.

[core/low] **Red-test changes (`redTests.changed`: `test/unit/layout.test.ts`) are not weakened.** Advisory.
- The tests now call the pure `layoutFindings({ story, docs, entries })` and the `readLayout(dir)` wrapper.
- Three checks are stricter than before: version 1 passes and version 2 fails on the same files; S-8.1 compares the page with `anatomyTables()` exactly; schema_version 0, '1' and undefined now throw.
- The integration fixture now rewrites its documents to `depth: standard`, as asked in attempt 1.
- The biome reformat changed no assertions.

[security/low] **Secrets and SAST did not run (NOT_INSTALLED).** Advisory.
- The security lens finds nothing: `readLayout` reads only the folder that `loadSpec` resolves, takes no path from outside, and writes nothing. I cannot vouch for anything those two scanners would have checked.

## Attempt 1 findings: all resolved
- **D1 depth:** `depthOf` reads `depth:` from spec.md, requirements.md or design.md, and falls back to lite only when spec.md exists. A new test pins MDO-0001 as `depth: lite`.
- **Architecture:** `src/spec/layout.ts` no longer imports `node:fs`. `readLayout` in `src/scripts/spec.ts` does the IO, which follows `architecture.md:41`. The AGENTS.md line is corrected.
- **Removed-AC tests:** present (see the advisory above).
- **NFR-2:** recorded in `_log/execution.md:18`: 0.121 s total, ok true, under 300 ms.
- **S-8.1:** checked exactly against `anatomyTables()`.

Model: claude-opus-5-5

VERDICT: FAIL
