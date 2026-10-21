VERDICT: PASS

T1 attempt 3 passes: the one blocking finding from attempt 2 is resolved, and the advisories I raised were applied. What remains is advisory only.

I reviewed against `_log/reviews/T1-3-pack.md` (brief, gates T1-3, diff), requirements.md, design.md, tasks.md and `docs/constitution/architecture.md`. The gate results are the Leader's; I have no test output beyond them: format, lint, typecheck, test (400 tests), build and metrics PASS. Secrets and SAST were NOT_INSTALLED and did not run.

## Attempt 2 findings, now resolved
- **Leftover `src/spec/trace.ts.orig` (was blocking):** deleted. A search of `src/**/*.{orig,rej,patch,diff}` finds nothing, and the file is gone from the diff.
- **The spec-anatomy page's stage text:** `anatomyTables()` now opens with a Stages table built from `STAGE_OF_STATUS`. The page says plainly that no status maps to `specified` and that `approved` is still the draft stage. The S-8.1 test (page contains `anatomyTables()` exactly) passes after the page was regenerated, so the page and the code cannot drift apart unnoticed.
- **The version 1 lite rule lived outside the manifest:** it is now a `oneOf` entry in `layoutManifest(1, 'lite')`, and the special case in `layoutFindings` is gone. `layoutFindings` stays pure, and `readLayout` in `src/scripts/spec.ts` does the IO, as `architecture.md:41` requires.
- **The cast in `story.ts`:** replaced by `z.literal(LAYOUT_VERSIONS)`. That is valid in zod 4, and `package.json` has `"zod": "^4.6.7"`. `story.ts` imports `layout.ts`, which imports nothing, so there is no import cycle.

## Spec conformance (T1 "Done when")
- **S-2.1 and S-2.2:** covered end to end. The integration fixture now rewrites its documents to `depth: standard`, as S-2.1 requires.
- **S-2.3 and S-2.3/C1:** MDO-0001 is version 1, lite and `ok: true`.
- **Version and depth rules:** the version comes from `schema_version` (1 or 2, anything else throws), never from a `layout:` key or the files present. Depth follows D1 as written.
- **Removed ACs:** tests show they are skipped by `trace` and `acStatus`.
- **S-8.1:** the page matches `anatomyTables()` exactly, and the README links the page.
- **NFR-2:** 0.121 s, recorded in `_log/execution.md`.
- **ADR 0041 and `src/spec/AGENTS.md`:** both describe the code as it is.

## Findings
[core/low] **The stricter version 1 lite rule has no test.** Advisory.
- Where: `oneOf` and `missingOfOneOf` in `src/spec/layout.ts`.
- The change: a version 1 lite folder with `requirements.md` but no `design.md` is now reported as missing `design.md`. That fits S-2.3/C1 ("the files version 1 allowed"), but no test pins it.
- The Implementer reports that all 10 repository specs give `ok: true`. That comes from the report, not from a recorded test run.
- Fix: add one unit case with `requirements.md` only, expecting `missing: ['design.md']`.

[core/low] **The manual evidence for the removed-AC tests was not recorded by a script.** Advisory, carried over from attempt 2.
- The tests are meaningful by inspection: without the filter, trace reports a GAP for the removed AC and `acStatus` lists it.
- The task's own red evidence exists (`loop.tdd.red: true`).

[core/low] **`run layout` does not catch a thrown version error.** Advisory.
- Where: `run layout` in `src/cli/run-spec.ts` lets the error from a bad `schema_version` reach the top-level handler. The close gate does catch it and reports it as a problem.
- Fix (optional): print the error as JSON, the same way the close gate reports it.

[security/low] **Secrets and SAST did not run (NOT_INSTALLED).** Advisory.
- The security lens finds nothing in the diff: `readLayout` reads only the spec folder that `loadSpec` resolves, takes no path from outside, and writes nothing.
- I cannot speak for anything those two scanners would have checked.

Model: claude-opus-5-5

VERDICT: PASS
