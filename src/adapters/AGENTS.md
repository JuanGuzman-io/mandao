# src/adapters — canonical → harness files

Purpose: pure functions `render(input) → { files, warnings }` (ADR 0007). No filesystem access.

- Contract: `types.ts` (`Adapter`, `AdapterInput`, `GeneratedFile`). Each adapter records `verified`
  (date + official docs) for its target format.
- Session facts: each adapter declares `session: { enterWorktree, newConversation, resume }` (spec MDO-0010 D2);
  `src/cli/session-advice.ts` reads them for the cut advice and `openCommand` in `src/cli/start.ts` delegates
  to `resume(worktree, first)` (pure; same `{ text, launch? }` as before). `newConversation` is absent when
  there is no in-place action. Facts come from each harness's docs, recorded in its `verified.docs`:
  Claude Code `/clear` and `claude "<prompt>"` (code.claude.com/docs/en/cli-reference), Codex `/new` and
  `codex "<prompt>"` with `$` skills, Copilot Chat "New chat", OpenCode `/new`, Antigravity new conversation
  (⌘N / Ctrl+N); Copilot, OpenCode and Antigravity cannot be launched with a prompt, so `resume` has no `launch`.
  An unknown harness id falls back to `openByHand` in `shared.ts`.
- Shared helpers in `shared.ts`: capability mapping, persona variants per role/tier, body rendering.
- `agents-md.ts` writes managed blocks only (`<!-- mandao:begin/end -->`).

Conventions: follow `copilot.ts` as the exemplar; add snapshots in `test/adapters/` for every mode.
Gotcha: a format change in a harness shows up as a snapshot diff; review it, then `vitest -u`.
