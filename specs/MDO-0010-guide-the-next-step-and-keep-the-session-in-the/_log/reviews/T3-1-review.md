VERDICT: FAIL

I'm Opus 5.5 (claude-opus-5-5). T3 fails on three blocking findings. All three are fixable, but the first needs the task's file list or the spec changed, so the Leader has to decide (HALT).

Scope of this review: the brief, the gates, the hand-written diff (core/commands/*.md, ADR 0037/0038/0040, MANDAO-DESIGN.md, the three test files), and spot-checks of the generated `.agents/`, `.claude/` and docs files. The generated files match their sources. I also read `spec.md` (FR-2, FR-5, D2, D3), `tasks.md` T3, `progress.yml`, `src/adapters/*`, `src/adapters/agents-skills.ts`, `src/render/render.ts` and `src/cli/approve.ts`. The brief lists no lenses and no risk tags, so only the core lens applies.

## Blocking findings

**[core/high] 1. The resume commands are copied into the command texts, against approved decision D2, and Antigravity gets the wrong one.**
- **What:** specify, quick, implement, verify, close and tasks each have one `<!-- mandao:if harness=X -->` block per harness with a hard-coded resume command. That is about 30 copies of the facts the adapters already own in `session.resume` (`src/adapters/{claude,codex,copilot,opencode,antigravity}.ts`).
- **Rules violated:**
  - `spec.md` D2: "**Rejected:** a `mandao:if` block per harness in every command, because the facts would be copied into many files." D3 only allows a `harness=claude` step.
  - S-2.2: "print the exact resume command **from the harness table**".
  - The reviewer rule that duplicated business logic is blocking.
- **Bug this causes:** codex and antigravity share `.agents/skills`, and when both are active only the codex copy is rendered (`renderAgentsSkills`: "conditionals see the owner as the harness"). An Antigravity user in a workspace that also has Codex is told `codex "$mandao-…"`.
- **Why the e2e test misses it:** `test/integration/worktree-entry.test.ts` maps codex and antigravity to the same `.agents/skills` directory. With all five harnesses active it reads the codex-owned file twice, so Antigravity is never really checked.
- **Fix:** produce the resume command from the adapter table. For example, add a `resume` field to the `run where` output (built from the active harness's `session.resume(expected.worktree, first)`), have the texts say "print `resume` from the `where` output", and keep only the `harness=claude` `EnterWorktree` block. This touches `src/scripts/spec.ts` or `src/render`, which are outside T3's file list, so the task or the spec has to be amended first. Do not ship the copied text as done.

**[core/medium] 2. `--by-running implement` records the wrong provenance.**
- **What:** `core/commands/implement.md` §0 step 3 and `core/commands/tasks.md` step 8 run `approve --by-running implement …`. `src/cli/approve.ts:148` writes `approved by running ${o.byRunning}`, so the record will read "approved by running implement".
- **Rules violated:**
  - FR-5: "first call `mandao approve <ID> <step> --by-running /mandao-<command>` … records 'approved by running /mandao-<command>'".
  - S-5.1: "records 'approved by running /mandao-implement'".
  - ADR 0040, as written in this diff.
- **Fix:** pass `/mandao-implement`, and extend the S-4.3/approve test to check the argument value, not just that `--harness` is present.

**[core/medium] 3. The tests do not pin S-2.2 and S-2.2/C1, only phrases.**
- **Rule:** test policy requires mandatory tests to be meaningful (brief `tests.e2e: [S-2.1, S-2.2]`, `unit: [S-2.2/C1 …]`).
- **What:** in `test/unit/content.test.ts` and `worktree-entry.test.ts` the S-2.2 checks only look for `/resume command/i` somewhere in the file. A text that says "print the resume command" with no command passes.
- The S-2.2/C1 pattern for claude, `/claude\b/`, matches any `.claude/` path, so it proves nothing. Nothing compares the rendered command with the "harness table".
- **Fix:** for each harness, assert that the rendered file contains `adapter.session.resume('<worktree>', '<first>').text`, or the `where` field from finding 1. In the e2e test, render Antigravity without Codex, or assert what the shared file says to both readers.

## Advisory findings

- **[core/medium] The Codex resume command breaks when pasted into a shell.** `cd "<worktree>" && codex "$mandao-implement <spec>"`: inside double quotes a POSIX shell expands `$mandao` to nothing, so Codex receives `-implement <spec>`. This comes from `src/adapters/codex.ts` (`JSON.stringify(skill)`, from T2), and finding 1's copies spread it into the texts. It breaks AC-2/C1 ("print the exact command that resumes there") for Codex. Fix: single-quote the skill in the adapter.
- **[core/low] `expected` is an object.** The texts say "the worktree path (`expected`, in the `where` output)", but `WhereReport.expected` is `{ branch, worktree }`. Say `expected.worktree`.
- **[core/low] `<step>` is left for the agent to guess.** Implement §0 runs `approve … <spec> <step>` without saying which step: `spec` for a lite draft, `tasks` for draft tasks. Name them, as FR-5 does.
- **[core/low] Hard-coded path in quick §6.** "The commit lists … `specs/quick/_log/costs.yml`" ignores `paths.specs`. Use `{{paths.specs}}/quick/…`. The test regex would still match with default paths.
- **[core/low] A quick-cost claim depends on T4.** Quick §6 says the record "holds only what was spent from the quick's start". That is only true once T4 lands, and T4 is still open.
- **[core/low] S-2.3 is only tested on specify and quick.** The claude implement block says "and stop" but has no "do not go on working in the main checkout"; it is equivalent, but untested.
- **[core/low] S-3.3 "before any other step" is only checked by presence.** The test looks for the text within 700 characters after the first `run where`, not that it comes before the other steps.
- **[core/low] P1 test.** `test/integration/hook.test.ts` uses two plain temp directories, not a real `git worktree add`. It shows the hook uses its working directory, which is what ADR 0037 now claims. It does not exercise `$CLAUDE_PROJECT_DIR` in the hook command line (`GRAPH_GUARD`). Using a real git worktree would match the Done-when wording.
- **[core/low] Files listed but left unchanged.**
  - Leaving `core/commands/constitution.md` alone is defensible: no spec ID exists yet, so `run next <ID>` cannot apply.
  - `docs/command-format.md` is stale in two places:
    - line 47 still says `flow` recommends the next mandao;
    - line 93 says `harness=<id>` is true "when rendering for that harness", which is wrong for the shared `.agents/skills` files.
  - The implementer should have said why each file was left out.

## TDD and evidence

- **Red run:** recorded (`_log/execution.md` line 30, exit 1).
- **Red tests changed after the red run** (`redTests.changed`: all three files): I have no shell, so I could not compare the red versions with the current ones. The test names in `progress.yml` (red time) match the current files exactly, and I see no weakened assertion in the current code. The Leader's statement that the assertions stayed identical is an unchecked ASSUMPTION; confirm it with `git diff` against the red snapshot.
- **No green evidence for T3's own tests (OPEN):** the test gate in `_log/gates/T3-1.md` shows "Affected 8 of 70 test files", 115 passed, 1.86 s, and does not list the files. Nothing shown proves that `worktree-entry.test.ts`, `hook.test.ts` or `diagram.test.ts` ran green, and the T3 verify command's output was not provided. I make no claim that they passed.

VERDICT: FAIL
