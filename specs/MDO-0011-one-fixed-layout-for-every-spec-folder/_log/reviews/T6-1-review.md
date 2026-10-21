VERDICT: FAIL

Review of T6 (MDO-0011, "Close commits what it applied and what was regenerated from it"), attempt 1. I worked only from the review pack, design.md D5/D6, `docs/constitution/standards.md` and the source files listed below. I did not run anything myself. The gates (format, lint, typecheck, test, build, metrics) show PASS in the pack. secrets and sast show NOT_INSTALLED and audit shows SKIPPED, so those three checks gave no result.

## Blocking

[core/medium] The S-5.1 test never reaches the code that actually commits the diagram sources and command pages.
- Where: `test/integration/close-commit.test.ts:20` and `:39`, against `src/cli/run-ledger.ts:235`.
- What happens: the fixture adds both `REGENERATED` files (`docs/commands/tasks.md`, `docs/diagrams/MDO-0001/tasks.mmd`) to the lock. In `regenerated()` they are then picked up by the `locked.has(f)` check, so the `derived(f)` check for the `docs/commands/` and `docs/diagrams/` prefixes is never used in any test. The mdo-0005 v2 test has no files under `docs/diagrams/` either.
- Why it matters: you noted that a real `sync` does not lock `docs/commands/` or `docs/diagrams/`. In a real close, the "diagram sources" part of S-5.1 therefore depends entirely on `derived(f)`, and the tests would still pass if that branch were deleted. So the fixture does not match the real repo, and the evidence does not show S-5.1 as it actually works.
- Rule: reviewer checklist step 2, "mandatory tests present and meaningful". S-5.1 (e2e, `test_levels`) requires "the regenerated command files, the lock and the diagram sources". D6 lists "every changed file listed in the lock, under `docs/commands/` or under `docs/diagrams/`" as three separate sources.
- Fix: in `closedSpec()`, stop adding the `docs/commands`/`docs/diagrams` files to the lock, or add at least one regenerated file that is not in the lock (for example `docs/diagrams/src/command-tasks.json`) and assert it is in the commit. The S-5.2 check that `status --porcelain` shows exactly `M src/cli/start.ts` then also proves that unlocked derived files are not left out.

## Checks with no blocking finding

- **D6 / your union decision.** `closePaths` for version 2 (`run-ledger.ts:232-250`) returns the spec folder (through `commitSpecDocs`), `docs/CHANGELOG.md`, `docs/kaizen/lessons.md`, the constitution, changed module guides, `applied`, every changed file listed in the lock, changed files under `docs/commands/` or `docs/diagrams/`, and `.mandao/mandao.lock`. That is the union you described, and it matches D6 bullet by bullet. Version 1 behaves as before.
- **`leftOut`.** It is computed after the commit (`commits.ts:204`) for every step and both versions, but only when the commit succeeds. It is missing on the "nothing to commit" and failure paths, which is acceptable for S-5.2/C1.
- **AC-5/C1.** The new `--applied` input (`run-close.ts:157-168`) rejects paths outside the repo and paths inside the spec folder, and stores them normalised and without duplicates. Nothing is staged with `git add -A`.
- **Red-test changes.** None of the three weakens a scenario:
  - The S-5.2 porcelain string change is equivalent because the `git` helper `.trim()`s its output (`test/log-v2-helpers.ts:27`). The exact-equality check is strong: it proves nothing else was left uncommitted.
  - Recording the override with a second `--applied` matches a real approved edit (in the fixture, sync renders from the package's `core/`, not the repo's). Without it, S-5.2 would fail because of an unrecorded file, not because of the code under test. The S-5.1 assertions are unchanged.
  - The mdo-0005 v2 expectation of `${SPEC}/story.md` is correct: close sets `status: closed` in story.md, which is inside the spec folder.
- **TDD.** `tdd.required` is true and `evidence: red` is present. `redTests.changed` lists only close-commit.test.ts, and I reviewed its changes above.
- **Module boundaries.** `run-ledger.ts` uses only public exports (`parseCloseSummary` from `spec/index.js`, `readLock`/`LOCK_FILE`, `specLogInCache`). I found no reaching into another module's internals.
- **Module guides.** `src/cli/` and `src/scripts/` have no AGENTS.md. `core/` changed only command prose, which `core/AGENTS.md` does not describe.
- **Security.** The brief has no risk tags and no active lenses, and I found no security issue. `--applied` is checked against the repo root, and git is called with argument arrays and `--`.

## Advisory

[core/low] `appliedOf` (`src/cli/run-ledger.ts:223-229`) returns `[]` when the record is unreadable. `docs/constitution/standards.md:48` allows a `catch {}` without rethrow only for best-effort reads, and only with a comment saying why. The JSDoc says what happens, not why. Effect: if close-summary.md is malformed, the approved edits drop silently into `leftOut` instead of making the close commit fail. Suggestion: add the why comment, or better, let a malformed record (as opposed to a missing one) throw, since close-summary.md is a file close writes itself. The v2 mdo-0005 fixture currently writes `'closed\n'` without frontmatter and relies on this catch.

[core/low] Files that a sync or diagram rebuild deleted are lost. `commitSpecDocs` drops any extra path that no longer exists (`commits.ts:194`, `existsSync`), so the deletion goes to `leftOut` instead of the close commit. Consider staging deletions of lock-listed or derived paths.

[core/low] D6 accepts a trade-off that touches AC-5/C1. Any changed lock-listed file and anything changed under `docs/diagrams/` is committed, even if an unrelated manual `sync` produced it. This follows D6 and is not a defect, but it is worth mentioning in close.md or the close report.

[core/low] The `notCode` change in `run-close.ts:290-299` (version 2: no `releases` or `docs/kaizen` folders, only the CHANGELOG and lessons files) has no test in this task. A short pr-plan check on a version 2 spec would cover it.

## Files

- src/cli/run-ledger.ts
- src/cli/run-close.ts
- src/scripts/commits.ts
- test/integration/close-commit.test.ts
- test/integration/mdo-0005-defects.test.ts
- specs/MDO-0011-one-fixed-layout-for-every-spec-folder/design.md (D6)

VERDICT: FAIL
