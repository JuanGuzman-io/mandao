VERDICT: FAIL

Reviewer identity: Opus 5.5 (claude-opus-5-5).

Scope: spec MDO-0011, task T2, attempt 1. I worked from the pack `/Users/jguzman/orca/projects/mandao.worktrees/MDO-0011-one-fixed-layout-for-every-spec-folder/specs/MDO-0011-one-fixed-layout-for-every-spec-folder/_log/reviews/T2-1-pack.md` and read repo files for context. Gates as reported: format, lint, typecheck, test, build and metrics PASS. secrets and sast are NOT_INSTALLED, and audit was SKIPPED. I ran nothing myself, so I make no test claim beyond those results. No lenses are active (risk_tags: []).

**Your two questions**

- **Version 1 specs keep their old behavior: yes.** `docPath` in `src/scripts/spec-log.ts` only takes the new branch when tasks.md is missing and the story says `schema_version >= 2`. Otherwise the old order is unchanged (own file, then spec.md, then own name). The `inline` flag in `run-spec.ts:99` and `approve.ts:57` comes from `docPath`, so the "more than 3 go to tasks.md" rule still fires for version 1 and can't fire for version 2. The existing test `lite-spec.test.ts:132-136` (schema_version 1, 4 inline tasks, expects `spec.md: 4 tasks inline; more than 3 go to tasks.md`) still passes under the test gate. That meets the "Version 1 is unchanged" done-when.
- **Do the red tests cover the scenarios: partly.** Two tests really exercise the new code path:
  - "before the tasks step, the tasks path is tasks.md"
  - "four tasks written inline in spec.md are not read as the spec tasks"

  Several others would also pass on the old code:
  - S-1.1 first test and S-1.2 with tasks.md present: `docPath` already preferred an existing tasks.md.
  - S-1.2 file-set test: readLayout does not depend on task count.
  - S-1.3 data-model regex: the old heading `## 5c. data-model.md (only when data changes)` already matched it.

  These are fine as regression pins. They match your note that 4 of 8 were green before. The S-1.1 done-when is not fully covered (finding 3).

**Findings**

1. [core/high] Blocking. New stories still start at `schema_version: 1`. `core/templates/shared/spec/story.md:2` is unchanged, although it is in the task's file list.
   - Rule: tasks.md T2 "What": "The content is updated to match, and new stories start at `schema_version: 2`." AC-1: "**GIVEN** a new spec … **THEN** it holds exactly the files of its depth, with `tasks.md` even for a single task."
   - Effect: a new spec created from the template is version 1. The new version 2 branch of `docPath` and the version 2 manifest never apply to it, and the layout check still treats it as version 1. So the change does nothing for the specs AC-1 is about.
   - Remediation: set `schema_version: 2` in the story template, regenerate with `npm run build && node dist/cli.js sync`, and add a test that a story rendered from the template is version 2 (or that readLayout on a fresh lite spec uses the version 2 manifest). Check that fixtures relying on the template's version still pass.

2. [core/medium] Blocking (duplicated business logic, magic number in a business rule). `tasksAlwaysOwnFile` in `src/scripts/spec-log.ts:48-53` decodes the layout version a second time with a literal `version >= 2`.
   - Rule: `src/spec/layout.ts:6` says `LAYOUT_VERSIONS` is "the one place the set is written", and `layoutFindings` throws on any other value. `src/spec/AGENTS.md`: "the version is the story's `schema_version` (`LAYOUT_VERSIONS`, 1 or 2, anything else throws), never a `layout:` key or the files present."
   - Effect: the two readers disagree. `schema_version: 3` or `2.5` makes `docPath` treat the spec as version 2, while the layout check rejects it.
   - Remediation: put the rule in `src/spec/layout.ts`, for example an exported pure predicate over a `LayoutVersion` that the manifest also uses, or derive it from `layoutManifest(version, 'lite')` requiring `tasks.md`. Have `docPath` call it, validating the version through `LAYOUT_VERSIONS` instead of `>= 2`.

3. [core/medium] Blocking (Definition of Done evidence). The S-1.1 done-when says "`checkpoint`, `run tasks` and the `approve tasks` gate read and tick it there". Only `run tasks` is tested for version 2. Nothing exercises `markTask` (`src/scripts/checkpoint.ts:42`) or the `approve tasks` blockers and documents (`src/cli/approve.ts:54-58, 74`) on a lite version 2 spec. The code path probably works because it goes through `docPath`, but done means every item has evidence.
   - Remediation: add a version 2 lite case that ticks a task via checkpoint and asserts the change is in tasks.md and not spec.md. Add an `approve tasks` case on the same fixture with no "inline" issue.

4. [core/low] Advisory. `src/spec/task-index.ts:95` still says "A lite `spec.md` carries its tasks inline, up to this many", which now only holds for version 1. The type comment in spec-log.ts was updated; this one was not.
   - Remediation: say "version 1 only".

5. [core/low] Advisory. The brief sets S-1.1 at level `e2e`, but the test is an integration test through `buildProgram` in-process.
   - Remediation: accept it explicitly as e2e for this CLI, or record the level difference in the notes.

6. [core/low] Advisory. The new specify sentence repeats its own heading ("`data-model.md` only when data changes … When the spec adds or changes …").
   - Remediation: fold the "never by how many tasks, requirements or scenarios" clause into one sentence.

7. [core/low] Advisory. OPEN: the rendered `/mandao-tasks` now says "`spec.md` never holds them", even for version 1 lite specs already in progress with inline tasks. The code still supports those specs. Decide whether the command should name the version 1 exception or whether the migration story covers it.

**Checked and fine**
- Content: no rendered specify, tasks, implement or clarify command, and not doc-lite, still decides task placement by count. The spec template no longer has `## Tasks`. Regenerated harness copies, guide, lock hashes, docs/commands and the diagram source hashes match the core edits.
- Module boundaries: `src/scripts` importing `src/spec/markdown.js` follows the existing pattern.
- AGENTS.md: `src/spec/AGENTS.md` is still accurate. `src/scripts` has no guide.
- TDD: `redTests.changed` is empty, so no red test was weakened.

VERDICT: FAIL
