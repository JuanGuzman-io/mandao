# 0033 — The MDO-0005 re-run: deterministic identity, task kind, characterization tests, executed premises

**Status:** Accepted · 2026-10-20

MDO-0005 (prove the doctor's crash path end to end) re-ran every command for real after the MDO-0004
fixes. It closed with both criteria met. `specify` and `verify` ran clean. `implement`, `close` and `quick`
showed new defects, fixed here, each with a test (`test/integration/mdo-0005-defects.test.ts`,
`test/integration/characterization.test.ts`). Cost: 10.67 USD, plus 1.03 USD for two `quick` runs
(`docs/pilot/plan.md`).

## Defects fixed

1. **False `identity mismatch` on every row.** `--claimed-*` received free text ("mandao-reviewer
   (identity not stated)") and any difference counted as a mismatch. A claim is now compared only when
   it names a model, normalized (`Claude Sonnet 5.5` = `claude-sonnet-5-5`); a bare vendor name is not a
   claim.
2. **A test-only task committed as `✨ feat`.** Each task declares its `kind` in `tasks.md` (a commit type:
   feat, fix, test, docs, refactor, chore, perf, style, build, ci). The commit takes it and checks it
   against the real diff: only tests changed → it must be `test`; only documentation → `docs`. A
   contradiction stops the commit. Specs planned before `kind` existed fall back to what the diff proves,
   then to the spec type; `mandao run tasks` reports a task without one.
3. **A Reviewer FAIL without its reason.** `checkpoint --verdict FAIL` requires `--reason "<first blocking
   finding>"`; the row records `FAIL: <reason>`.
4. **`close` left its documents uncommitted.** `mandao run commit-spec <spec> close` commits the spec
   folder, `<releases>/<ID>/`, `docs/kaizen/<ID>.md`, the constitution and the changed module guides, and
   nothing else.
5. **`quick` logged the reviewer's model from what the model said** ("reviewer on sonnet" while the agent
   file pins Opus). Same root cause as the identity incident of ADR 0021: an identity typed by the model.
   Every place that records who did a step now uses a deterministic source:
   - execution rows (`checkpoint`, `red`, `mutation`, `review --via`): the agent file the harness loads,
     or the process Mandao launched;
   - `progress.yml` `current.model`: the Leader's model in `models.yml` for the harness (`--model` was
     removed);
   - the quick log: `mandao run quick-log`, which also measures files and lines from the diff;
   - verify reports, close summaries, Kaizen and release documents record no identity of their own: they
     read the execution log.
   A test walks every CLI option that records an identity and fails when a new one does not resolve
   through an agent file or `models.yml`; another fails when a command or persona asks the model to type
   a model name into a record.
6. **`commit-spec` subjects were free text and ambiguous** ("clarify record the PO answer…"). The command
   now takes a step (`specify`, `clarify`, `close`) and writes a fixed subject.

## Decision 1 — characterization tests, proven by recorded mutations (amends ADR 0022)

- Only for a task that **pins down existing behavior** (`characterization: true`). A task that adds or
  changes behavior still needs a red test; the Reviewer checks the classification against the diff and
  FAILs a task that hides new behavior behind it.
- Evidence: `mandao run mutation <spec> <Tn> <tests> --patch <diff> --agent <agent>`. It refuses a
  mutation of a test or of the task's own files, applies the patch, runs the tests under the budget and
  the queue, **always reverts**, and checks the mutated files are back to their exact state before.
  Only a failing run with a clean revert is recorded: a `MUTANT` row and `mutations/<Tn>-<n>.md` with the
  diff and the tail of the failing output. A surviving mutation is not evidence.
- `loop` and `verify` expect `MUTANT` rows instead of `RED` for these tasks; there is no Tester-first step.
- Kaizen counts them as `characterization` (`tasksCharacterized`, `tasksWithMutants`), apart from `tdd`
  and `no-tdd`; a spec made only of them is in neither comparison group.

## Decision 2 — high-impact premises are executed in `specify`

A Premise Ledger row of impact **High** is verified by running it, not by reading code (MDO-0004 read a
premise about `models.yml` and was wrong). Only safe runs: read-only, inside the worktree or a sandbox, no
writes to real systems and no external effects, with a timeout, through the resource guard when it builds
or tests. The command and an excerpt of its output are the citation. If it cannot run safely, the row
stays `UNVERIFIED`.

## Cost reporting

From the next run on, cost is reported per command and, inside `implement`, per role. The per-model cost
comes from the session's `modelUsage`; within one model it is split between the main session (the
Leader) and each subagent by price-weighted tokens from the transcripts. MDO-0005 `implement` (1.84 USD):
Leader 1.03, Reviewer 0.57, Implementer 0.24.

## Command statuses

| Status | Commands | Why |
|---|---|---|
| stable | `constitution`, `resume`, `story`, `clarify`, `tasks`, `specify`, `verify` | ran clean for real |
| beta → stable after a short real run | `implement`, `close`, `quick` | their MDO-0005 defects are fixed and tested |
| planned | `research`, `perf`, `audit` | no real content |
