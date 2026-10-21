VERDICT: FAIL

Review of MDO-0011 T1, attempt 1. I worked from the pack (`specs/MDO-0011-one-fixed-layout-for-every-spec-folder/_log/reviews/T1-1-pack.md`), requirements.md, design.md, tasks.md, `docs/constitution/architecture.md` and the repository files listed below. The gate results are the Leader's and I only repeat them: format, lint, typecheck, test, build and metrics PASS. Secrets and SAST are NOT_INSTALLED, so they were not run anywhere.

## Findings

[core/high] **Depth rule does not follow design D1, and ADR 0041 now says something the code does not do (Implementer point 1).** Blocking.
- Where: `src/spec/layout.ts`, `depthOf`.
- Rule: D1 in `design.md` says "Depth: read from `depth:` in `spec.md`, or in `requirements.md` / `design.md`. When the frontmatter has no `depth:`, it falls back to `lite` if `spec.md` exists." The new `docs/decisions/0041-spec-folder-layout-v2.md` repeats that rule word for word.
- What the code does: it ignores `depth: lite` on requirements.md and design.md. As a result `run layout` reports MDO-0001, MDO-0005 and MDO-0006 as `depth: standard`, although their files say `lite`. This is a public-api output (risk tag `public-api`), and T7 depends on knowing which specs are lite.
- My decision on point 1: both the test fixture and the code are wrong; the spec is right.
  - S-2.1 says "a verified **standard** version 2 spec". `brokenV2()` in `test/integration/layout.test.ts` copies `test/fixtures/spec/MDO-0001-skills-list/requirements.md`, which carries `depth: lite`, so the fixture contradicts its own scenario.
  - The real cause is the version 1 manifest. Version 1 lite specs used requirements.md plus design.md (MDO-0001, 0005 and 0006 all do). S-2.3/C1 asks for "the files version 1 allowed", so `layoutManifest(1, 'lite')` must accept that pair.
- Fix:
  - Make `depthOf` follow D1 as written.
  - Let the version 1 lite manifest accept `requirements.md` + `design.md` as its documents, alongside `spec.md`.
  - In `brokenV2()`, rewrite the copied frontmatter to `depth: standard`. This makes the fixture match S-2.1 and does not weaken any assertion.

[core/high] **The spec domain now does filesystem IO, against the architecture rule (Implementer point 2).** Blocking.
- Where: `src/spec/layout.ts` imports `existsSync`, `readdirSync` and `readFileSync`. It is the only file in `src/spec` that imports `node:fs`.
- Rules:
  - `docs/constitution/architecture.md:41` (Spec domain): "IO belongs in scripts/writer".
  - `architecture.md:54`: "Pure core, impure edges".
  - Design D1: "`layoutFindings(folder)` is pure".
- The new line in `src/spec/AGENTS.md` makes it worse: it says the IO is there "by design D1", and D1 says the opposite.
- Fix:
  - In `src/spec/layout.ts`, keep a pure `layoutFindings` that takes data (story frontmatter, the depth frontmatter of the documents, the folder entries).
  - Put the folder reading in `src/scripts/spec.ts`, which is in the task's file list and which the design assigns "version and depth (D1)". The CLI and the tests call that wrapper.
  - Correct the AGENTS.md line.

[core/high] **One "Done when" item has no test (removed ACs).** Blocking.
- Where: `src/spec/story.ts` (`removed`), `src/spec/trace.ts` (`storyRefs`), `src/spec/release.ts` (`acStatus`).
- Rule: T1 "Done when" in tasks.md: "The story parser reads an AC's `status: removed` … and `trace` and `release-status` skip it, so this spec's AC-7 gives no GAP." The persona also requires mandatory tests to be present and meaningful.
- No test under `test/` mentions `status: removed` or `.removed`.
- Fix: add tests showing that `parseStory` sets `removed`, that `trace` gives no GAP for a removed AC, and that `acStatus` leaves it out.

[core/medium] **No evidence for NFR-2.** Blocking under the Definition of Done.
- Rule: T1 "Done when": "`time node dist/cli.js run layout MDO-0010` is under 300 ms, and the output goes in the task's evidence."
- Neither `_log/gates/T1-1.md`, `_log/execution.md` nor `progress.yml` contains a timing. OPEN: I cannot say whether it is met.
- Fix: run the command and record its output in the task's evidence.

[core/medium] **The S-8.1 test does not check "the same files per depth" (Implementer point 5).** Blocking, because the test is not meaningful.
- Where: `test/unit/layout.test.ts`, the S-8.1 test.
- Rule: requirements S-8.1: "it lists the same files per depth". T1 "Done when": "a test compares the `docs/spec-anatomy.md` table with the manifest".
- The test only checks that each manifest file name appears somewhere on the page. Wrong rows under a depth, extra rows, or a stale "When" column would all pass. Also, nothing ever rebuilds the page from `anatomyTables()`.
- Fix: assert `expect(page).toContain(anatomyTables())`. The current page matches the function's output, so this passes today and catches drift from then on.

[core/medium] **Story status `approved` is mapped to the `specified` stage (Implementer point 4).** Advisory.
- Where: `STAGE_OF_STATUS` in `src/spec/layout.ts`.
- Rule: D1 only says "The stage is taken from the story status".
- `core/commands/story.md:67` sets `status: approved` as soon as the PO approves the story, before specify runs. `run layout` would then report `requirements.md`/`design.md` (or `spec.md`) as missing on a folder that is in a correct state.
- Fix: map `approved` to `draft`, since that status covers both before and after specify. Otherwise record an ASSUMPTION in the design.
- On "required cumulatively": that part is correct.
- The close gate uses the current status (`verified`), so it never requires `close-summary.md`. That is acceptable until T5 decides when the file is written; worth a note in ADR 0041.

[core/low] **The version 1 manifest is lenient (Implementer point 3).** Advisory.
- It requires nothing after the documents and tasks, and accepts `spec.md` at standard depth.
- This matches S-2.3/C1 and the ADR ("asks for nothing after the documents and tasks"). `V1_LEGACY` covers every `LogFile` in `src/scripts/spec-log.ts`.
- No change needed, apart from the lite-pair fix in the first finding.

[core/low] **The allowed versions {1, 2} are written in three places.** Advisory.
- The rule appears in the `storyFrontmatterSchema` union (`src/spec/story.ts`), the check in `layoutFindings`, and the `LayoutVersion` type.
- Fix: export one `LAYOUT_VERSIONS` constant or schema and use it in all three.

[core/low] **`manifest.log` is never checked by `layoutFindings`.** Advisory.
- `_log/` is accepted as a whole. That fits T1, since FR-3 belongs to T4. T4 should check `_log/` against `LOG_FILES_V2`.

[core/low] **Changes outside the file list (Implementer points 6 and 7).** Advisory.
- `src/spec/AGENTS.md` is required by the design's Module Docs Impact and the persona's step 3, so changing it is correct. Its content needs the correction from the second finding.
- `redTests.changed` lists `test/unit/layout.test.ts`. The Implementer says biome only reformatted one line. ASSUMPTION: I could not see the red-run version, but no assertion in the current file is weaker than the scenarios ask.
- The brief's `src/schemas/story.ts` does not exist. The story schema already lived in `src/spec/story.ts`, so editing it there is correct.

[security/low] **Secrets and SAST did not run (NOT_INSTALLED).** Advisory.
- The security lens found nothing in the diff: the command reads a folder from the spec loaded by `loadSpec`, takes no outside path, and writes nothing.
- This review cannot confirm anything those two scanners would have checked.

Model: claude-opus-5-5

VERDICT: FAIL
