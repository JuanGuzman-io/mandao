VERDICT: PASS

Reviewer identity: Opus 5.5 (claude-opus-5-5).

**Scope**
- Spec MDO-0011, task T2, attempt 2. This attempt reworks attempt 1, which failed review.
- Sources:
  - The pack: /Users/jguzman/orca/projects/mandao.worktrees/MDO-0011-one-fixed-layout-for-every-spec-folder/specs/MDO-0011-one-fixed-layout-for-every-spec-folder/_log/reviews/T2-2-pack.md
  - The attempt 1 review: /Users/jguzman/orca/projects/mandao.worktrees/MDO-0011-one-fixed-layout-for-every-spec-folder/specs/MDO-0011-one-fixed-layout-for-every-spec-folder/_log/reviews/T2-1-review.md
  - Repo files I read for context: src/spec/layout.ts, src/spec/AGENTS.md, the T2 entry in tasks.md, and a grep of core/.
- Gates as reported:
  - PASS: scan-markers, format, lint, typecheck, test, build, metrics.
  - NOT_INSTALLED: secrets, sast.
  - SKIPPED: audit.
- I ran nothing myself. I make no test claim beyond those results.
- No lenses are active (risk_tags: []).

**Attempt 1 blocking findings: all three are resolved**

1. **Resolved: new stories start at version 2.** `core/templates/shared/spec/story.md` now says `schema_version: 2`, and the rendered `.mandao/templates/app/spec/story.md` and its lock hash were regenerated. A new test in `test/unit/content.test.ts`, "a story rendered from the template starts at layout version 2", parses the template's front matter and expects 2. Strictly, it reads the core template file rather than a rendered story, but that file is the template's single source. The leader reports it was red before the fix. `src/spec/story.ts:10` accepts `z.literal(LAYOUT_VERSIONS)`, so a version 2 story parses. The test gate passed, so no fixture breaks.

2. **Resolved: the rule for where tasks live is in one place.**
   - `tasksHaveOwnFile(schemaVersion)` is new in `src/spec/layout.ts:68-72`.
   - It checks the value against `LAYOUT_VERSIONS`.
   - It takes the answer from `layoutManifest(version, 'lite').required.planned.includes('tasks.md')`.
   - The literal `>= 2` is gone from `src/scripts/spec-log.ts`, whose `docPath` now calls this function.
   - `test/unit/layout.test.ts` pins it: 2 gives true; 1, 3, 2.5, '2', undefined and null give false.
   - `src/spec/AGENTS.md` describes the rule.

3. **Resolved: there is now evidence for every part of the S-1.1 done-when.**
   - The new test "S-1.1: the checkpoint ticks the task in tasks.md and leaves spec.md alone" asserts `### [x] T1 — Step 1` is in tasks.md and that spec.md is byte-identical before and after.
   - The new test "S-1.1: approve tasks on the same fixture approves tasks.md with no inline issue" asserts `approved: true` and no `inline` or `more than 3` text.
   - `run tasks` was already covered.
   - The leader says the checkpoint and approve tests were green in the red run. That fits: those paths go through `docPath`. They count as done-when evidence, not as red tests.

**Re-check of the brief**
- **AC-1, AC-1/C1, AC-1/C2:** met.
  - For version 2, `docPath('tasks')` never falls back to spec.md.
  - The spec template has no `## Tasks`.
  - In specify, `quickstart.md` and `data-model.md` depend on the kind of content, never on a count.
  - A grep for `inline|3 tasks|fewer` in core specify, tasks, implement, clarify and doc-lite finds nothing.
- **Version 1 is unchanged:** `tasksHaveOwnFile(1)` is false, so the old fallback and the "more than 3" check still apply. The version 1 test in `lite-spec.test.ts` is untouched, and the test gate passed.
- **TDD (ADR 0022):** red evidence is present (`loop.tdd.red: true`). `redTests.changed` lists `test/unit/content.test.ts`. Compared with the attempt 1 diff, the only change is the new template-version test, which is an addition. No assertion was weakened.
- **Generated files:** the regenerated harness copies, guide, lock hashes, docs/commands and diagram source hashes all follow from the core edits. They belong in the commit, as the leader notes say.
- **Module boundaries (`architecture.md`):** `src/scripts` calls the public `src/spec/layout.js` and `markdown.js`. That is the existing pattern, and nothing reaches into another module's internals.
- **AGENTS.md:** `src/spec/AGENTS.md` is updated for the new function. `src/scripts` has no guide.

**Findings (all advisory)**

1. [core/low] Advisory. Three files outside the task's file list were changed: `src/spec/layout.ts`, `src/spec/AGENTS.md` and `test/unit/layout.test.ts`. Attempt 1 finding 2 asked for exactly this change, so I see no scope problem. Remediation: stage them with the task commit, as the memory note on `mandao run commit` says.

2. [core/low] Advisory. A story version outside `LAYOUT_VERSIONS` (for example 3) is handled two ways. `docPath` treats it as version 1 and uses the old fallback, while `layoutFindings` throws. This is now deliberate and documented in `src/spec/AGENTS.md` ("any value outside `LAYOUT_VERSIONS` counts as version 1 there"), and it does not duplicate the rule. Remediation, optional: let `docPath` surface the same error, so a bad version fails in one place.

3. [core/low] Advisory, carried over and deliberately left. Attempt 1 advisory 5: S-1.1 is declared at level e2e, but the test runs in-process as an integration test. Attempt 1 advisory 7: the rendered `/mandao-tasks` says "`spec.md` never holds them" without naming the version 1 exception.

4. [core/low] Advisory. OPEN: a story created from the template is now version 2, so its folder is checked against the version 2 manifest, which includes the six-file `_log/` (FR-3). Whether the other tasks of this spec make the current scripts write that log is outside T2. I could not verify it here.

VERDICT: PASS
