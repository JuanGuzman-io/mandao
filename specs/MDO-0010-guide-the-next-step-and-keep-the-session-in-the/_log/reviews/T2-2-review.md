Review of MDO-0010, task T2, attempt 2 (rework after a FAIL)

**The task passes.** All five attempt-1 findings are fixed, I found no regressions, and nothing below blocks.

I read the pack, the attempt-1 review, spec.md (D2 and the active-harness line), tasks.md (T2), docs/constitution/architecture.md, src/cli/run-leader.ts (leaderStep, implement-summary) and the env cleanup in test/integration/leader-scripts.test.ts. I ran nothing.

**Gates (from the pack's gate table):**
- scan-markers, format, lint, typecheck, test, build and metrics passed.
- **secrets and sast are NOT_INSTALLED (exit 127). They did not pass: no secret scan and no SAST ran on this diff.**
- audit was SKIPPED.

**TDD:** `loop.tdd.required` is true and the evidence is `red`. `redTests.changed` lists only test/unit/session-advice.test.ts. Its diff is the new file, and its assertions match the attempt-1 red contract (each harness's action, `then`, the fallback, and `resume` equal to `openCommand`). I agree the change is only an import reorder, and no red test was weakened.

## Attempt-1 findings

1. **`run step` advice (FR-3, tasks.md T2 What): fixed.**
   - `stepCut` adds `advice: newSessionAdvice(harness, spec, 'implement')` when `stop` is true (src/cli/session-advice.ts).
   - `harness` comes from `harnessOption(o.harness)` in leaderStep (run-leader.ts:135, :149).
   - The new test "FR-3/D4: step that stops…" checks the exact `{ action, then, fallback }`.
2. **`resume` in the session facts, `openCommand` delegating (D2: "`resume` is today's `openCommand`"): fixed.**
   - `HarnessSession.resume` is declared in src/adapters/types.ts, and each of the five adapters implements it.
   - `openCommand` in src/cli/start.ts now delegates to it, with `openByHand` for an unknown id.
   - The D2 test in session-advice.test.ts pins the old text of all five harnesses, so the move changes no output: `resume === openCommand === advice.fallback`.
3. **One active-harness rule: fixed.**
   - `activeHarness` is gone. `approve` uses the same `harnessOption` as `run`, and calls it before anything is approved.
   - The `--harness bogus` test checks that it throws and that no approvals.yml is written.
4. **`verifyCut` cleanups: fixed.** `newSessionAdvice` is computed once, the `config` parameter is removed and run-leader.ts:279 is updated, and `session.command` is kept as `next.fallback` for public-api compatibility.
5. **AGENTS.md sources: fixed.** src/adapters/AGENTS.md now describes `resume`, the `openCommand` delegation, the docs each fact comes from, the harnesses with no `launch`, and the `openByHand` fallback.

## Judging the implementer's notes

- **`harnessOption` as the single rule: conforms.**
  - Done-when says "from `--harness` or `CLAUDE_CODE_SESSION_ID`, not `config.harnesses[0]`".
  - With `--harness`, it is that id (validated against HARNESS_IDS). With `CLAUDE_CODE_SESSION_ID` set, the result is `claude`. `config.harnesses[0]` is never read.
  - Not reading the env var changes no output: both of the other cases give `claude`, and `claudeSession(harness)` already gates cost reads on `claude`.
  - The no-signal case is not specified, so its default is covered as an OPEN item below.
  - The test that removes the env var and reorders `harnesses` to `[codex, claude]` covers it. Env cleanup is safe because leader-scripts.test.ts:24-25 calls `vi.unstubAllEnvs()` in afterEach. That settles the attempt-1 doubt.
- **`openByHand` in shared.ts, the spec-context.ts doc comment, and the regenerated diagrams: justified.**
  - `openByHand` keeps opencode, antigravity and the unknown fallback in one place instead of three copies.
  - The diagram JSON changes are only the derived hashes of approve.ts and start.ts.
  - These files are outside the brief's file list, so the commit must stage them deliberately.
- **The import reorder in session-advice.test.ts:** accepted, see TDD above.
- **The `run step` e2e test covers Claude Code only:** acceptable.
  - S-3.1 is the e2e scenario and names Claude Code. S-3.2 is unit-level, and session-advice.test.ts tests every harness.
  - Cost reads in `stepCut` exist only for Claude Code, so a cut cannot be forced for another harness at e2e level today.

## Findings (all advisory)

- [core/low] **src/cli/start.ts imports `openByHand` from `../adapters/shared.js`, not from the adapters' registry/contract (`index.ts` / `types.ts`).**
  - architecture.md allows CLI to depend on adapters, and src/engine/sync.ts already imports `agents-md.ts` directly, so I do not count this as a boundary violation.
  - Re-exporting it from `src/adapters/index.ts` would make it clearly public. Not blocking.
- [core/medium] **OPEN: with no signal, the default is `claude`.**
  - A non-Claude session that runs `mandao approve` without `--harness` is told `/clear`.
  - The rendered commands already pass `--harness <this harness>` to `run step`, `models` and `loop`. The `approve --by-running` calls in core/commands do not, as far as grep shows.
  - Fix in T3: pass `--harness <this harness>` to `approve`. Otherwise AC-3 holds only for Claude Code in practice.
- [core/low] **The S-3.1 "run as a process" Done-when is met in-process** (`buildProgram().parseAsync`), as in attempt 1. This is the repo's usual CLI e2e style.
- [core/low] **The biome `noThenProperty` exemption is unchanged and still narrow** (four exact paths, one rule).
- [security/low] **No new shell input.**
  - `resume` quotes the worktree with `JSON.stringify` as before. `launch` arrays are unchanged for claude and codex, and absent for the others.
  - `approve --harness` is validated before any write.
  - I found no security issue, but the secrets and sast scanners did not run.

VERDICT: PASS
Reviewed by claude-opus-5-5.
