VERDICT: PASS

I reviewed the T2 follow-up on top of commit 879fa53, using the review pack, the diff and the repo files. Nothing blocks it.

**What the person asked for**
1. **`/mandao-tasks` wording: met.** `core/commands/tasks.md` now has the paragraph, and it carries all four statements:
   - version 1 specs are read as they are, and lite keeps its tasks in `spec.md`;
   - no new spec uses that format, and the command never writes tasks inside `spec.md`;
   - on an open version 1 spec it warns and does not convert it;
   - migration goes through the backlog spec.

   The paragraph appears word for word in the three rendered files (Claude, Codex, Copilot). The three lock hashes and the `core/commands/tasks.md` sha256 in all 21 diagram source files were updated together, which matches running `sync` and `diagrams`. I can't confirm the exact hash values because I have no shell.
2. **Tests that prove the fix: met, both ways.**
   - **New approve test:** removing line 61 of `src/scripts/spec-log.ts` (`if (doc === 'tasks' && tasksAlwaysOwnFile(specDir)) return own;`) makes `docPath` fall back to `spec.md`. The approve gate would then read the 4 inline tasks and report "spec.md: 4 tasks inline; more than 3 go to tasks.md" instead of "no tasks to approve" (`src/cli/approve.ts:55-57`). So the test's `toContain('no tasks to approve')` check fails without the fix and passes with it. This fits the implementer's claim. The `approved: false` check alone would not tell the two cases apart; the message check does.
   - **Renamed tests:** the two older tests were renamed "(regression pin)" and the diff shows their assertions unchanged.
   - **Content test:** I checked its four regexes against the new paragraph and all of them match. Before the change the text had no "warns ... does not convert" wording, so the claim that it was red then fits.
3. **T2 entry in `tasks.md`: met.** The file list includes `src/spec/layout.ts`, `src/spec/AGENTS.md` and `test/unit/layout.test.ts`. "Done when" has exactly 5 bullets, and the version 1 sentence is folded into the "Version 1 is read as it is" bullet.

**Spec and contract**
- AC-1/C2 ("BUT it must NOT place tasks ... according to how many tasks"): the new test adds approve-gate coverage, alongside the existing `readSpec` test at `lite-spec.test.ts:188`.
- The version 1 "more than 3" case is still covered (`lite-spec.test.ts:132-136`), as the Done-when requires.

**TDD (ADR 0022)**
- `loop.tdd.required` is true and `red` is true, so red evidence is recorded and the notes do not say "no red evidence".
- `redTests.changed` is empty: no red test was weakened.

**Module boundaries and AGENTS.md:** no source code changed in this follow-up, so boundaries are unaffected. `core/AGENTS.md` needs no update for a prose-only change to a command.

**Gates:** I rely only on the pack's results, as reported, not as run by me. format, lint, typecheck, test, build and metrics passed, and scan-markers passed. secrets and sast are NOT_INSTALLED, and audit was SKIPPED. No security lens applies (`risk_tags: []`).

**Findings (both advisory)**
- [core/low] The new warn/do-not-convert behaviour in `core/commands/tasks.md` is prose only. No step says how to detect `schema_version: 1` or what the warning says, so the content test checks only the wording, not behaviour. No written rule requires a script check here. If wanted, add a concrete step (read `story.md`, compare `schema_version`, print a fixed warning) once the migration spec in the backlog exists.
- [core/low] The new test in `test/integration/lite-spec.test.ts:215` partly repeats the setup of the test at line 188 (same inline fixture). It checks the approve gate rather than `readSpec`, so it is not noise. A shared fixture helper would remove the repetition.

Model identity: Claude Opus 5.5 (claude-opus-5-5).

VERDICT: PASS
