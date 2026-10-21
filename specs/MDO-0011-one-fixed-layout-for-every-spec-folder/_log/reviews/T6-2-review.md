T6 attempt 2 (MDO-0011): the attempt-1 blocking finding is fixed, and I found no new blocking finding.

I read the T6-2 pack and judged the tests by reading them; I ran nothing. The pack shows these gates as PASS: scan-markers, format, lint, typecheck, test, build, metrics. Three checks gave no result: secrets and sast are NOT_INSTALLED, and audit is SKIPPED. The hand mutation (`derived = (_f) => false`) is not in the log, so I did not count it as evidence. Reading the test gives the same conclusion on its own, as explained below.

## Blocking

None.

## Attempt-1 finding, now fixed

[core/medium] S-5.1 did not exercise the rule that commits files under `docs/commands/` and `docs/diagrams/`.
- `closedSpec()` no longer adds anything to the lock: the `lock.files.push` call and the `writeYaml` and `parseYaml` imports are gone.
- `REGENERATED` now holds three files the lock does not list (`test/integration/close-commit.test.ts:19`): `docs/commands/tasks.md`, `docs/diagrams/MDO-0001/tasks.mmd` and `docs/diagrams/src/command-tasks.json`.
- In `regenerated()` (`src/cli/run-ledger.ts:222-227`), unlocked files can only be committed through `derived(f)`. If that check were deleted:
  - S-5.1's `arrayContaining([...REGENERATED])` would fail.
  - S-5.2's exact `status --porcelain` check (`'M src/cli/start.ts'`) would fail, because the three files would still be uncommitted.
  - S-5.2/C1's `leftOut` equal to `['src/cli/start.ts']` would fail for the same reason.
- `.mandao/mandao.lock` changes through the real `syncProject`, so the lock and the locked-render branch (`.claude/skills/mandao-tasks/SKILL.md`) are covered too.
- The test names and the scenario assertions are unchanged, so none of them was weakened.

## The rest of the diff, re-checked

- **D6 and your union decision.** The version 2 `closePaths` (`src/cli/run-ledger.ts:933-952`) returns:
  - `docs/CHANGELOG.md`, `docs/kaizen/lessons.md` and the constitution;
  - changed module guides;
  - the paths recorded with `--applied`;
  - changed files listed in the lock, changed files under `docs/commands/` or `docs/diagrams/`, and the lock itself.

  `commitSpecDocs` adds the spec folder. This matches D6 bullet by bullet, and version 1 is unchanged.
- **AC-5/C1.** `--applied` (`src/cli/run-close.ts:819-829`) rejects paths outside the repository and inside the spec folder, and stores each path once. The commit stages only the named paths; there is no `git add -A`.
- **`leftOut`** is returned on every successful commit, for both versions (`src/scripts/commits.ts:204`).
- **Red-test changes from attempt 1.** I re-checked all three and none weakens a scenario. The `git` helper trims its output, the override is recorded as an approved edit, and v2 `story.md` belongs in the spec folder.
- **TDD.** Red evidence is recorded.
- **Module boundaries.** Only public exports are used.
- **Module guides.** No AGENTS.md needs an update.
- **Security.** The task has no risk tags and I found no security issue: git gets argument arrays with `--`, and `--applied` is checked against the repository root.

## Advisory (carried over, not blocking)

[core/low] `appliedOf` (`src/cli/run-ledger.ts:912-919`) now has a why-comment, as `docs/constitution/standards.md:48` requires for a `catch` without rethrow. The behaviour still deserves a second look: a malformed `close-summary.md` silently records nothing as applied, so approved edits end up in `leftOut` instead of the commit. Consider failing only on a malformed record, which close writes itself, and keeping the empty result for a summary with no record at all.

[core/low] `commitSpecDocs` skips extra paths that no longer exist (`src/scripts/commits.ts:194`). A file that sync or the diagram build deleted is therefore not committed as a deletion and lands in `leftOut`.

[core/low] D6 deliberately commits any changed file the lock lists and anything changed under `docs/diagrams/`, even when an unrelated manual sync produced it. That trade-off on AC-5/C1 is accepted in D6; consider saying so in close.md.

[core/low] The version 2 change to `notCode` (`src/cli/run-close.ts:858-870`) still has no test.

Files:
- specs/MDO-0011-one-fixed-layout-for-every-spec-folder/_log/reviews/T6-2-pack.md
- test/integration/close-commit.test.ts
- src/cli/run-ledger.ts
- src/cli/run-close.ts
- src/scripts/commits.ts

VERDICT: PASS
