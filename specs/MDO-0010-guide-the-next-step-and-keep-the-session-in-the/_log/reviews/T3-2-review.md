VERDICT: PASS

Model identity: Opus 5.5 (claude-opus-5-5).

T3 attempt 2 passes: all three blocking findings from attempt 1 are fixed, and I found no new blocking issue. Only the core lens applies, because the brief lists no lenses and no risk tags.

What I read: the brief, the gates, every hand-written diff (core/commands/*.md, the src changes, ADRs 0037/0038/0040, MANDAO-DESIGN.md, docs/cli.md, docs/command-format.md and the tests) and tasks.md T3 as widened. I spot-checked the generated `.agents/skills/mandao-{implement,quick,specify}` files against their core sources, and they match. I also checked by grep that `harnessOption` (src/cli/spec-context.ts:17), `approve --by-running/--words/--harness` (src/cli/approve.ts:202-204), `run next --shown` (src/cli/run-spec.ts:109) and `run cost quick --record` (src/cli/run-cost.ts:62-65) exist.

## Attempt 1 blocking findings

1. **[core/high] Resume commands copied into the texts (D2), and Antigravity got the Codex one: resolved.**
   - `run where` now returns a `resume` field built from `ADAPTERS[harness].session.resume(expected.worktree, first)` (src/cli/run-spec.ts, src/scripts/spec.ts `WhereReport.resume`).
   - Every command text prints that field. The only per-harness blocks left are `harness=claude` (EnterWorktree) and its complement `!harness=claude`, which holds no harness facts. That is allowed by D3 and by the D2 amendment in tasks.md.
   - The shared `.agents/skills` text is now neutral: each agent passes `--harness <this harness>`, so Antigravity gets its own command.
   - test/integration/where.test.ts checks that the `resume` field equals the adapter's output for all five harnesses. content.test.ts renders each harness alone, Antigravity included.
2. **[core/medium] Provenance of `--by-running`: resolved.** implement and tasks pass `/mandao-implement`. content.test.ts checks `approve --by-running \/mandao-implement\b` for every harness.
3. **[core/medium] The tests only pinned phrases: resolved.**
   - Every render must point at the `resume` field and contain no copied resume command. The `COPIED` regex covers the `claude` and `codex` quoted forms and the copilot, opencode and antigravity text forms. `claude --resume` is banned.
   - where.test.ts pins the exact string for each harness.
   - The S-2.2/C1 check that each command passes its own harness is pinned per render.

## Leader questions

- **`--harness`/`--first`/`resume` on `run spec-new`: sound.** specify and quick run before a spec folder exists, so `run where <spec>` cannot resolve the spec at that point. Returning `resume` from spec-new for the proposed worktree is the only way to keep D2 (facts from the adapter) for the fallbacks. Details:
  - It stays inside the widened files and is documented in docs/cli.md.
  - Each harness is tested in where.test.ts.
  - An unknown `--harness` fails the same way as the other `run` commands.
- **Shared `.agents/skills` still using Codex `$mandao-…` for other commands:** this predates T3 and is outside its scope. I agree it is out of scope. It is worth an OPEN item for a later spec, since an Antigravity reader of that shared file sees Codex syntax.
- **test/integration/start.test.ts (outside T3's files):** the only change is the Codex expectation, now single-quoted, as the maintainer authorised. It is consistent with the adapter change.

## Advisory findings (non-blocking)

- **[core/low] Mixed instruction in the non-claude specify render.** core/commands/specify.md, `!harness=claude` path: "print the `resume` field … and stop. Then go on. **A story written before the worktree existed** … move the whole spec folder into the worktree". "Then go on" comes right after "stop", so an agent may continue in the main checkout, or the story move may never happen. Fix: put "Then go on" inside the claude block, or say that the resumed session does the story move.
- **[core/low] Hard-coded path in quick §6.** The line lists `specs/quick/quick-log.md`; the costs path next to it now uses `{{paths.specs}}`. Use `{{paths.specs}}/quick/quick-log.md`.
- **[core/low] Quick cost claim depends on T4.** Quick §6 still says the cost record "holds only what was spent from the quick's start". That is only true once T4 lands, and T4 is still open (tasks.md line 39).
- **[core/low] S-2.3/C1 is tested only for specify and quick.** The implement, verify, close and tasks claude blocks now say "do not go on working in the main checkout", but the S-2.3 test (content.test.ts) only covers specify and quick.
- **[core/low] S-3.3 "before any other step" is checked by presence.** The test looks within 700 characters after the first `run where`, not at the order. The check is the first step in implement §0, verify §1 and close §0, so the text is right today.
- **[core/low] P1 test uses temp directories.** test/integration/hook.test.ts uses two temporary directories, not a real `git worktree add`. It does show the guard resolves the project from its working directory, which is what ADR 0037 claims.
- **[core/low] Worktree path quoting.** The adapters double-quote the worktree with `JSON.stringify`, so a path containing `$` or backticks would still be expanded by a shell. This is an edge case, and it predates T3.
- **[core/low] src/adapters/AGENTS.md is incomplete.** It describes `session.resume` but does not name its new consumers (`run where` and `run spec-new` `resume`) or the single-quoted Codex form. Add one line.

## TDD and evidence

- **Red evidence:** tdd is required and red is true; the notes contain no "no red evidence".
- **Red tests changed after the red run** (hook, content and worktree-entry; worktree-entry and hook appear as new files in the pack):
  - The current content.test.ts assertions are stricter than attempt 1's: they check the `resume` field, no copied command, the `/mandao-implement` value and the named step.
  - I see no weakened assertion.
  - The maintainer dropped a rewritten shared `.agents/skills` test that had no red run, on purpose.
  - ASSUMPTION: I have no shell, so I did not compare these files with their red versions.
- **Green evidence:**
  - The T3-2 gates show format, lint, typecheck, test (`npm test`, exit 0), build and metrics passing. secrets and sast are NOT_INSTALLED, and audit was SKIPPED.
  - Verify output: "Test Files 8 passed (8), Tests 96 passed (96)". The output does not list which 8 files ran, although the handoff says it is per file. I cannot tie any single file (for example where.test.ts) to that run beyond the full `npm test` gate passing.

VERDICT: PASS
