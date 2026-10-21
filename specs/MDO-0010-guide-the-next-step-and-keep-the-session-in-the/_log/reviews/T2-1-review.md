Review of MDO-0010, task T2, attempt 1

Sources read:
- /Users/jguzman/orca/projects/mandao.worktrees/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/reviews/T2-1-pack.md
- spec.md (FR-3, D2, D4), tasks.md (T2)
- src/cli/session-advice.ts, src/cli/run-leader.ts, src/cli/spec-context.ts, src/cli/start.ts
- core/commands/implement.md, docs/constitution/architecture.md

Gates: format, lint, typecheck, test, build and metrics passed (from the pack's gate table; I ran nothing). **secrets and sast are NOT_INSTALLED (exit 127), so they did not pass and nothing was checked.** Audit was SKIPPED. On TDD: red evidence is `red` and `redTests.changed` is empty, so no red test was weakened.

## Blocking findings

[core/medium] **`run step` does not give the new advice.**
- Where: `stepCut` in src/cli/session-advice.ts:61-72 still returns `{ ...advice, stop, minSavings }`, with no `{ action, then, fallback }`.
- Rule (spec.md FR-3): "The session advice of `mandao approve`, `mandao run step` and `implement-summary` comes from the harness session table for the **active** harness". tasks.md T2 What: "The advice of `approve`, `run step` and `implement-summary` becomes `{ action, then, fallback }`".
- Effect: when `session.stop: true`, implement.md:66-68 still has the agent write the "new session" advice itself. T3's "cut advice text follows D4" has no data from `run step` to use.
- Related: `run step` gets its harness from `harnessOption(o.harness)`, which defaults to `'claude'` (spec-context.ts:15), not from the new active-harness rule.
- Fix: when `stop` is true, add `advice: newSessionAdvice(harness, spec, 'implement')`, and add a test for it. Or, if this is meant for another task, record that as a decision in tasks.md. It cannot be left silently undone.

[core/medium] **`openCommand` did not move behind the table, and `resume` is missing.**
- Where: `HarnessSession` in src/adapters/types.ts has only `{ enterWorktree, newConversation? }`. `openCommand` is still a `switch` in src/cli/start.ts:44-56.
- Rule: spec.md D2 heading: "`session: { enterWorktree, newConversation, resume }` … `resume` is today's `openCommand`". tasks.md T2: "`openCommand` moves behind the table." spec.md Changes table, Adapters row: "`openCommand` moves behind it".
- Effect: the harness facts are now split between the adapters and `start.ts`, which is what D2 set out to avoid ("the facts would be copied into many files").
- Fix: add `resume(worktree, first)` (pure) to each adapter's `session`, and have `openCommand` and `sessionAdvice` delegate to it. Or record a deviation from D2 that the maintainer approves.

## Advisory findings

[core/medium] **Two rules decide the "active harness".**
- `activeHarness` (session-advice.ts:46) uses `--harness`, then `CLAUDE_CODE_SESSION_ID`, then `config.harnesses[0]`, and does not validate the id.
- `harnessOption` (spec-context.ts:14) defaults to `'claude'` and throws on an unknown id.
- So `approve --harness bogus` gives advice with no action and a "`# open bogus there`" fallback, while `run ... --harness bogus` fails.
- This is one concept with two diverging implementations. It is close to "duplicated business logic", which is blocking, so fixing it together with the first finding is strongly advised. Fix: one function in spec-context.ts that both paths use, and that validates against `HARNESS_IDS`.

[core/low] **Falling back to `config.harnesses[0]`.**
- tasks.md Done-when says "The active harness comes from `--harness` or `CLAUDE_CODE_SESSION_ID`, not `config.harnesses[0]`". D2 says the same.
- The code uses it only when neither signal is present, and the spec does not say what to do in that case. OPEN: needs the maintainer's confirmation.
- It is acceptable only if T3 makes every non-Claude command pass `--harness`. Otherwise a Codex session with `harnesses: [claude, …]` would be told `/clear`.

[core/low] **Unknown harness: no `action` key, fallback from `openCommand`.**
- This satisfies S-3.2/C2 and AC-3/C2 as written. All five known adapters declare an action, so C2 is only reachable with an unknown id. The unit test covers that path correctly.

[core/low] **Small issues in `verifyCut` (session-advice.ts:75-86).**
- It calls `newSessionAdvice` twice; compute it once.
- `_config` is now unused. Renaming it keeps the caller signature and passes the linter. Removing it, and updating run-leader.ts:279, is cleaner.
- Keeping `session.command` (equal to `advice.fallback`) for compatibility matches docs/cli.md and the public-api tag.

[core/low] **`enterWorktree` is declared but not read.**
- This is consistent with D2, which defines the table, and T3, which applies D3 through `run where` and specify/quick. It is not dead code under Biome's rules. T3 should be the task that reads it.

[core/low] **The S-3.1 test runs in-process, not as a separate process.**
- tasks.md Done-when says "`mandao approve`, run as a process". The tests in leader-scripts.test.ts call `buildProgram().parseAsync` in-process. That is a CLI-level end-to-end test in this repo's usual style, but not literally "a process".
- Also, `vi.stubEnv` for `CLAUDE_CODE_SESSION_ID` relies on env cleanup between tests. The `--harness codex` test assumes the variable is unset, so this works only if the suite calls `vi.unstubAllEnvs`. I could not confirm that from the pack.

[core/low] **The tests are meaningful.** They cover each harness's action, the `then` command, and the fallback's worktree and binary. They are not noise.

[core/low] **src/adapters/AGENTS.md is updated** to describe the session facts. Once `resume` is added, it should also say where the facts come from (the spec's Module Docs Impact asks for this) and list the docs they were taken from.

## The four points you asked me to judge

1. **biome.json exemption: acceptable, and no wider than needed.**
   - It lists four exact paths, with no globs, and turns off only `suspicious/noThenProperty`. The rule stays on everywhere else.
   - Each file creates or asserts a `then:` property, which D4's `{ action, then, fallback }` shape requires. src/cli/approve.ts is correctly left out, since it never writes a `then` literal.
   - The risk is low: `then` is always a string, so the advice object is never a thenable.

2. **tasks.md: removing test/integration/start.test.ts from T2's `files` is correct.** The diff does not touch it, it stays in `verify`, and the critical-flow Done-when is backed by the passing `test` gate.

3. **Changes outside the file list: all justified.**
   - test/integration/approve.test.ts: the string became the advice object because the public shape changed (D4). It is in T2's `verify`, so adding it to `files` would make the brief exact.
   - docs/cli.md: matches the code. It describes the default chain, including the `harnesses[0]` fallback that is still OPEN above.
   - docs/diagrams/src/lifecycle.json: only the derived hash of approve.ts was regenerated, which is expected.

4. **Implementer decisions:**
   - Active harness: works, but see the two-rules and fallback findings.
   - Unknown harness: conforms to AC-3/C2.
   - Removing `newSessionCommand`: fine, it has no callers left.
   - `_config`: fine.
   - `enterWorktree` unread: conforms to D2, to be read in T3.
   - The blocking gaps are elsewhere: `run step` (FR-3) and `resume` / `openCommand` (D2).

On the security lens: no new input reaches a shell. `openCommand` only builds text, quoting the worktree with `JSON.stringify` as before, and `launch` is unchanged. I found no security issue, but the secrets and sast scanners were not installed.

VERDICT: FAIL
Reviewed by claude-opus-5-5.
