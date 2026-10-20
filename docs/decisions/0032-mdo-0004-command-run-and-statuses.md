# 0032 — Commands run for real (MDO-0004): defects fixed and command statuses

**Status:** Accepted · 2026-10-20

MDO-0004 (`mandao doctor --json`) was run end to end by invoking each mandao in its own Claude Code
session: story → specify → clarify → tasks → implement → verify → close. It closed with every
criterion met. Cost: 8.58 USD (corrected from 17.18, which added up the cumulative figures of resumed sessions; recorded in `docs/pilot/plan.md`).

## Defects found, each fixed with a test

1. A queued task commit took every changed file, so another task's work in progress rode along. It now
   takes only the files the task declares (plus the spec folder).
2. `pr-plan` counted the spec documents in the PR size. It now leaves out the spec folders, release docs,
   Kaizen, diagrams and every file Mandao generates.
3. `implement` did not say that `--pending-commit` takes only the subject; the header came out doubled.
4. `specify` did not describe moving a story written before the worktree into it.
5. The verify report did not require the bare `AC-n` id in its first column.
6. `release-status` only read a bare `AC-n`; it now reads the id at the start of the cell.
7. `impacts` cut wrapped bullets and dropped paragraphs.
8. A clause id on a wrapped line was lost by the parser.

Also: **a local id was reused** (MDO-0003) after its branch was deleted. `spec-new` now looks at spec
folders on every local branch, active worktrees, branch names, `Refs` trailers anywhere in history
(reflog included) and tracked paths that carry an id. And **spec documents get their own commits**:
`specify` on approval and `clarify` after recording answers run `mandao run commit-spec`, a `docs`
commit with `Refs: <ID>`, never on a protected branch, never pushed.

## Command statuses

| Status | Commands | Why |
|---|---|---|
| stable | `constitution`, `resume`, `story`, `clarify`, `tasks` | run clean for real |
| beta → stable after a clean real re-run (MDO-0005) | `specify`, `implement`, `verify`, `close` | their defects are fixed and tested; the affected steps must pass again for real |
| beta | `quick` | no real run yet; included in MDO-0005 |
| planned | `research`, `perf`, `audit` | no real content |
