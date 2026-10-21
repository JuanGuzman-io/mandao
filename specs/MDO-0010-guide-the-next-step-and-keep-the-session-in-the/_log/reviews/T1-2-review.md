VERDICT: PASS

**MDO-0010 T1, attempt 2 (rework).** I checked the pack's diff against spec.md FR-1/FR-5, tasks.md T1, `src/spec/AGENTS.md`, `core/templates/shared/rules/consistency-check.md` and the other spec folders in the repo. I ran nothing; I have no shell. Every test claim below rests only on the gate table in the pack.

**Gates (from the pack only):** scan-markers, format, lint, typecheck, test, build and metrics are PASS. **secrets (gitleaks) and sast (semgrep) are NOT_INSTALLED (exit 127): no secret scan and no static security analysis ran on this diff.** They are not PASS. audit is SKIPPED.

## The attempt-1 blocking findings: all resolved

- **critical OPEN on the `tasks` step (AC-5/C3): resolved.**
  - `blockers()` in `src/cli/approve.ts` now puts `open` first in the `tasks` branch, including the no-tasks case.
  - The comment in `questionBefore` is now true: every step that approves documents refuses a critical OPEN.
  - New test: "S-5.4/C3: on the tasks step a critical OPEN in requirements.md is refused" checks `approved: false`, exit code 1, `tasks.md` still draft and `approvals.yml` unchanged.
  - Side effect: a plain `approve tasks` (without `--by-running`) is now also refused on a critical OPEN. That matches consistency-check.md "A `critical` finding blocks `tasks`" and AC-5/C3, so I do not count it as a regression.
- **Critical Consistency Check rows (AC-5/C1, FR-5, D6): resolved.**
  - `checkRows` and `conflictsAndFindings` in `src/spec/next.ts` feed `openItems().ask`.
  - `nextStep` therefore sends to `/mandao-clarify` and never offers implement (AC-1/C1).
  - Tests cover an open critical row (unit and integration), a resolved critical row (unit and integration) and a CONFLICT-type row.
- **`shown` rows replacing approval hashes (S-1.4): resolved.**
  - `settle` filters out `step === 'shown'` before calling `changedSince`.
  - `questionBefore` compares only against the last `shown` row.
  - New unit test: an approval followed by a `shown` row that carries the new hash still recommends approving again and names `spec.md`.
  - docs/cli.md and AGENTS.md state the split.
- **CONFLICT detection (attempt-1 advisory): resolved.**
  - The inline non-bullet form `CONFLICT(...)` is detected (unit test and an integration `test.each` row).
  - Consistency Check rows of Type CONFLICT are detected.
  - Resolved rows are excluded.
- **Depth (attempt-1 advisory): resolved.** `SpecFolder.lite` is now `existsSync(spec.md)`, read by the caller, so `nextStep` stays pure. The FR-1 test checks a `spec.md` with no `depth:` line.

## Your notes on the implementer's choices

- **Consistency Check rows matched anywhere in the file.** The false-positive risk is low in practice. I found no 6-cell table with `critical` or `normal` as its 4th cell outside Consistency Check tables, in `core/templates/**` or in any spec's story/requirements/spec.
  - [core/low] advisory: there are false negatives. Older 5-cell tables, such as MDO-0009 spec.md:317-320 (`| CC-2 | CONTRADICTION … | critical | maintainer | resolved … |`) and MDO-0004, are skipped silently.
  - The "resolved" rule (`^\W*resolved`) does not count statuses like "no conflict: …" or "handled in D5" as resolved. They would ask, which is the safe side.
  - The template (consistency-check.md:20-21) defines no Status column and no resolved vocabulary. Remediation: write the row shape and the "resolved…" status rule into consistency-check.md (a T3/close candidate), so the parser reads a written rule and not only code.
- **Inline CONFLICT counts as resolved if its line contains the word "resolved".** This convention exists only in code. Neither `core/templates/shared/rules/context.md:20` nor `core/commands/clarify.md` mentions it (clarify.md never mentions CONFLICT or resolved).
  - [core/low] advisory: false negative. "CONFLICT(…): not resolved yet" counts as resolved.
  - [core/low] advisory: false positives.
    - A multi-line CONFLICT stays open forever unless the first line is edited. Example: MDO-0009 story.md:139, a closed spec. `settle` runs before the closed/abandoned check in `stage`, so `run next MDO-0009` recommends `/mandao-clarify` for a closed spec.
    - A backticked `` `CONFLICT(a: …)` `` written in prose is read as an open CONFLICT.
  - Remediation:
    - document the resolution convention in context.md or clarify.md;
    - skip backticked code spans;
    - check closed/abandoned before `settle`.
- **`lite: boolean` added to `SpecFolder` in `src/scripts/spec.ts`, outside the task's file list.** Acceptable: it is a one-line, same-module read that keeps IO out of `nextStep` (exemplar `loop.ts`), and typecheck passed. Advisory: add the file to T1's `files` in tasks.md so the scope stays honest.
- **Not done: the verify-verdict input, the helper placement, and checking the `--by-running` command against the step.** All three were advisory in attempt 1 and remain advisory.
  - OPEN: the verify-verdict input (AC-1 "verify findings", FR-1 "the verify verdict") is still missing. It should be deferred in tasks.md explicitly, not dropped silently.

## New findings

[core/medium] **`[NEEDS CLARIFICATION]` written in prose is read as an open item.** Advisory, but I recommend fixing it before T3 depends on `--by-running`.
- `openItems` now uses `blockingMarkers(t).needsClarification` (`src/spec/markdown.ts:134`, regex `/\[NEEDS CLARIFICATION\]:?\s*([^\n]*)/g`). Before this diff, nothing in `approve` used that regex.
- The regex matches the marker anywhere, including backticked prose.
- This spec's own documents mention the marker in prose: spec.md:28, 38, 172, 186 and story.md:141.
- So `mandao run next MDO-0010` will always recommend `/mandao-clarify` (with a reason like "open item: `;"), and `approve MDO-0010 spec --by-running …` will always return `ask`.
- This conflicts with the AC-5 THEN "goes on without asking" when nothing is open. No scenario covers the case, and the error falls on the safe side (it asks rather than approves), so I do not block on it.
- Remediation:
  - ignore markers inside inline code spans in `openItems`, for both the needs-clarification markers and the inline CONFLICT;
  - add a unit test showing that a backticked `` `[NEEDS CLARIFICATION]` `` in prose recommends implement on an approved lite spec.

[core/low] **Matching style, advisory.** The decision-pending regex and the CONFLICT parsing live in next.ts, while the OPEN and NEEDS CLARIFICATION parsing lives in markdown.ts's `blockingMarkers`. This is not duplicated business logic, but consolidating all the marker parsing in markdown.ts would keep one place to fix the code-span issue above.

## Other checks

- **TDD:** `loop.tdd.required` is true with red evidence recorded, and `redTests.changed` is empty. Nothing to judge for weakened red tests.
- **Tests:** they are meaningful and target exactly the attempt-1 findings, with no noise tests added. The S-5.2 `test.each` now has 6 cases, and the resolved-row case shows `go`.
- **Module docs:** the `src/spec/AGENTS.md` line is updated with the open-item list, how lite is decided (`SpecFolder.lite`), and the approval vs `shown` hash split. docs/cli.md is updated too, including the note that an older spec with no `shown` row makes no change claim.
- **Module boundaries:** no violations. next.ts is pure domain code, the IO stays in the CLI, and run-spec.ts imports from approve.ts within the CLI module (the placement advisory carries over).
- [security/low] **Security, advisory:** `--by-running` and `--words` are written verbatim through `yaml.stringify` into `approvals.yml`. I found no injection or path issue, and no high or critical security issue. Keep in mind that secrets and sast did not run.

Files: /Users/jguzman/orca/projects/mandao.worktrees/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/src/spec/next.ts, /Users/jguzman/orca/projects/mandao.worktrees/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/src/cli/approve.ts, /Users/jguzman/orca/projects/mandao.worktrees/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/src/spec/markdown.ts, /Users/jguzman/orca/projects/mandao.worktrees/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/src/scripts/spec.ts, /Users/jguzman/orca/projects/mandao.worktrees/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/spec.md, /Users/jguzman/orca/projects/mandao.worktrees/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/core/templates/shared/rules/consistency-check.md

VERDICT: PASS
Model: Opus 5.5 (claude-opus-5-5).
