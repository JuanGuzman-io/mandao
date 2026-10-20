# 0020 — Iteration 2a: worktrees, impacted tests, test runs, Codex defaults, Reviewer tier rule

**Status:** Accepted · 2026-10-20

## Decisions

1. **Worktrees** live in a sibling folder, `paths.worktrees` (default `../{repo}.worktrees`, `{repo}` =
   the main checkout's folder name). Paths resolve from the main checkout (`git rev-parse
   --git-common-dir`), so they agree from every worktree.
2. **Impacted tests.** Mandao detects the runner (vitest, jest, nx, pytest, go) and uses its native
   related-test selection plus graph reverse dependents; `projects[].tests.impacted` (with `{files}` and
   `{workers}`) wins over detection when set. Uncertain impact runs the touched modules, never the
   full suite.
3. **`mandao run tests` executes** — the documented exception to "scripts are read-only" (ADR 0006),
   because it is the only way to guarantee the worker limit, low priority, the timeout and a single
   queue (`.mandao/run.lock`, git-ignored, stale locks of dead processes are taken over). `mandao run
   checkpoint` also writes, through `src/writer/`.
4. **Codex defaults** target the paid plans (Plus, Pro, Business) and API keys:

   | Role | Model | Effort |
   |---|---|---|
   | leader | `gpt-6.1-sol` | high |
   | implementer.fast | `gpt-6-luna` | medium |
   | implementer.standard | `gpt-6.1-sol` | medium |
   | implementer.strong | `gpt-6.1-sol` | high |
   | reviewer | `gpt-6-sol` | high |
   | reviewer_alt | `gpt-6.1-sol` | high |
   | tester | `gpt-6.1-sol` | medium |

   Notes in `recommendations.yml` and `doctor`: Free/Go cannot run routed mode (only `gpt-6-luna`, in
   the desktop app); Enterprise/Edu admins must enable the models; API keys follow their project.
5. **Strong equal to standard** is judged on the pair (model, effort): the same model with a higher
   effort is a real escalation (Codex); the same model and effort is reported (Copilot Pro).
6. **Reviewer tier rule (every harness).** The Reviewer never runs on a lower tier or effort than the
   Implementer. Mandao classifies models into tiers in `recommendations.yml` (a judgement, labelled as
   such). When no reviewer on another model qualifies, the review runs on the implementer's model in a
   clean context and `reduced independence` is recorded; `doctor` recommends an optional model of the
   same tier or reviewing in another harness. Consequence: Claude Code no longer defaults to a
   `reviewer_alt` (Sonnet is below Opus); Fable is optional.
7. **Antigravity** is marked `experimental` in the CLI and the docs until its format settles (2b).
8. **One skill per harness.** Every Mandao skill must be visible exactly once per harness; OpenCode reads
   both `.claude/skills` and `.agents/skills`, which 2b resolves with a snapshot for Claude Code + Codex +
   OpenCode active together.

## Consequences
- Worktrees need their own dependencies (`node_modules`): found during the 2a acceptance run.
- `progress.yml` carries `deferred_to_ci`; `mandao run status <spec> verified` refuses until CI confirms.
