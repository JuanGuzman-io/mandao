# 0021 — Iteration 2a acceptance: commits by trailer, deterministic identity, cross-harness review

**Status:** Accepted · 2026-10-20

Context: the 2a acceptance ran a real spec (`specs/MDO-0001-list-pinned-skills/`) across Claude Code and
Codex: (a) interruption between tasks, resumed in Codex; (b) interruption with uncommitted changes,
resumed in Codex; (c) implemented in Claude Code, reviewed in Codex. All three passed. What broke on the
way, and what was decided because of it, is recorded here.

## Decisions

1. **No hashes in the log.** `execution.md` drops the `Commit` column (old logs still parse; the column
   is ignored) and `progress.yml` holds no hash. A task's commit is found in git by its `Refs` and
   `Mandao-Task` trailers (`taskCommits`), so a rebase or cherry-pick never breaks traceability, and the
   PASS row goes into the task's own commit — no bookkeeping commit. `trace` reports `UNCOMMITTED` for
   a passed task without such a commit. A test rebases a branch and checks that `trace` stays clean.
2. **Identity is established by the script, never by the model.** `checkpoint --implementer/--reviewer`
   take the *agent* invoked (`mandao-reviewer`, `mandao_reviewer@codex`, `self`); the model and effort
   come from the agent file the harness loads (`.claude/agents/*.md`, `.codex/agents/*.toml`,
   `.github/agents/*.agent.md`). `mandao run review` records the command line it launched. What a model
   says about itself is passed as `--claimed-*`; a difference is recorded as `identity mismatch`. A
   `self` review is recorded as `reduced independence`. Root cause of scenario (a)'s incident, where
   Codex reviewed its own work and recorded a reviewer that never ran.
3. **Pending commits, every harness.** Codex can run one command outside its sandbox after the user
   approves it: a `prefix_rule(..., decision="prompt")` in the project's `.codex/rules/` (TUI only, trusted
   project only; `codex exec` never asks, so it never escalates). Mandao generates
   `.codex/rules/mandao.rules` for `mandao run commit`. In general, a PASS can be queued
   (`checkpoint --pending-commit "<subject>"`, recording the task's changed files) and `mandao run
   commit <spec>` makes one local commit per pending task with its trailers — the Leader, the user or
   the next session, in any harness. A failed commit keeps the task pending; two pending tasks sharing a
   file are refused. `resume` handles pending commits before uncommitted work; `doctor` warns about them.
4. **Cross-harness Reviewer: optional, decided** (was OPEN in design §23). When `loop` would record
   `reduced independence` and another harness is installed with its CLI on PATH, it offers that
   harness's `reviewer` as `crossReview`, never below the Implementer's tier. `mandao run review <spec>
   <Tn> --via codex|claude --brief <f> --gates <f>` runs it as a read-only process (`codex exec -s
   read-only`; `claude -p --tools Read,Grep,Glob --disallowedTools mcp__* --permission-mode plan`) with
   the reviewer persona of that harness, parses `VERDICT: PASS|FAIL`, saves the review under
   `reviews/` and writes the row. Without another harness: same model, clean context, `reduced
   independence`. `claude-fable-5-1` stays optional.
5. **graphify's hook only for roles with a shell.** Claude Code passes `agent_type` to PreToolUse hooks;
   `mandao hook graph-guard <mode>` skips the guard for subagents whose definition has no `Bash` and
   delegates to `graphify hook-guard` otherwise. `doctor` warns when settings call graphify's guard
   directly. The Reviewer gets graph context in the brief (`graph.dependents`). Codex hooks do not
   identify the subagent, and the Codex reviewer has a read-only shell, so nothing changes there.
6. **Codex trust is checked.** `init` and `harness add codex` explain the step; `doctor` reads
   `[projects."<path>"] trust_level` in `~/.codex/config.toml` (each worktree is its own path) and
   checks `codex login status`.

## Defects found and fixed during the acceptance

| Defect | Fix |
|---|---|
| The `tasks.md` template put free text in YAML flow sequences: a comma split one test name into several | Quoted, with a test that fails on the old template (8969f97) |
| `resume` "discard" could restore the spec folder, losing the rows of tasks that passed | Restores only the task's `files` (4bb87d8) |
| A read-only reviewer cannot run tests (vitest needs to write `node_modules/.vite-temp`) | The Leader hands it the step 4 results (2a99086) |
| `mandao run tests` printed the runner's report into stdout, breaking its JSON | Runner output goes to stderr, streamed live (b2fe029, then live streaming) |

Earlier in 2a: `checkpoint --task` with `--clear` labelled one task's PASS row with the next task
(`--next-task`, 58af67d), and Codex recorded a self-review as independent (3e5249b).

## Lessons

- **Codex sandbox:** `workspace-write` keeps `.git` read-only recursively, even with `--add-dir` on the
  git directory. Commits need the approval path above or another process.
- **Untrusted Codex projects** load no `.codex/agents`: without trust, Codex implements and reviews in
  its own context. That is why trust is now a `doctor` check and identity is never self-reported.
- **Read-only reviewers have no tests:** the Leader runs gates and impacted tests and passes the output;
  the Reviewer judges code and evidence, and never claims more than that output shows.
- **Worktrees need their own dependencies.** A symlinked `node_modules` made vitest fail with EPERM
  inside the Codex sandbox; `specify`/`quick` install dependencies inside the worktree.
- **Rebases rewrite hashes**, which is why the hash left the log (decision 1).
- An independent reviewer in another provider caught what a self-review missed (T2 exit code proof,
  T3 duplicated ordering), which supports offering it by default when independence would be reduced.
