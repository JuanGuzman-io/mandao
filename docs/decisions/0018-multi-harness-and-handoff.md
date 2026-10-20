# 0018 — Real multi-harness: switch harness mid-work without reinstalling

**Status:** Accepted · 2026-10-20

## Context
People use more than one agent: Claude Code at the desk, Copilot in the IDE, Codex or OpenCode
elsewhere. Mandao already renders the same content for several harnesses, but the *work in progress*
lived in the session: a run interrupted by a token limit, or a move to another harness, lost the state.

## Decisions
1. **Harnesses.** `init` lets the person pick every harness they use. `mandao harness add <tool>` adds
   one later, generated from the existing config, without repeating `init`. Adapters pending, each
   verified against official docs in its own ADR: Codex (0016), OpenCode (0017), Antigravity (0019).
2. **State lives in files.** After every step (task started, implementation reported, Reviewer verdict,
   commit) the Leader writes a checkpoint in the spec folder: task status in `tasks.md`, and a
   machine-readable `progress.yml` with the task in progress, its phase
   (`implementing | awaiting-review | rework-n`), the harness and model running it, open questions and
   the next step. `execution.md` keeps the human log. Checkpoints are frequent; Mandao never relies on
   detecting the end of a session's tokens, so an interruption loses at most the task in progress.
3. **`/mandao-resume <ID>`** works in any harness: it reads the checkpoint, checks it runs in the spec's
   worktree, and continues. On uncommitted changes from an interrupted task it offers: review the diff
   as it is, continue implementing, or discard and redo the task. Models come from `models.yml` for
   the current harness. A task implemented in one harness and reviewed in another is recorded in
   `execution.md` as **provider independence**.
4. **`doctor` per harness:** generated files up to date, model per role, minimum version met — so a
   person knows beforehand whether they can switch.

## Consequences
- `progress.yml` gets a zod schema and is written only through `src/writer/` (idempotent, never
  half-written over a concurrent edit).
- Every Leader step becomes a small write; the cost is a few files per task, the gain is resumability.
- The cross-harness Reviewer (MANDAO-DESIGN §23.6) builds on the same checkpoints.
