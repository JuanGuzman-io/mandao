---
schema_version: 1
spec: MDO-0010-guide-the-next-step-and-keep-the-session-in-the
status: approved
---

# Tasks — Guide the next step and keep the session in the spec worktree

Five tasks, in order:
- T1 builds the state decision behind `mandao run next` and `approve`.
- T2 adds the harness session table and the in-place cut advice.
- T3 changes the commands' content to use both and to enter the worktree.
- T4 fixes the cost baseline. It touches only the cost code, so it can run alongside the others.
- T5, added by the maintainer after the T1 and T2 reviews, tightens the next-step rules: real markers only, failed verify, closed specs, and the written resolution rule.

## Overview

### AC-1, AC-5 — The next step fits the spec's state; Running the next command approves the spec, unless something is open

- [x] T1 [AC-1, AC-5] Mandao names the next command from the spec's state — `src/spec/next.ts`
- [ ] T5 [AC-1, AC-5] The next step reads only real markers and knows failed and closed specs — `src/spec/next.ts`

**Checkpoint:** `npx vitest run test/unit/next.test.ts test/integration/approve.test.ts` passes (T1, T5); this confirms AC-1, AC-5 before the next group.

### AC-3 — Starting fresh happens in place

- [x] T2 [AC-3] Each harness's session facts drive the cut advice — `src/adapters/types.ts`

**Checkpoint:** `npx vitest run test/unit/session-advice.test.ts test/integration/leader-scripts.test.ts test/integration/start.test.ts test/integration/approve.test.ts` passes (T2); this confirms AC-3 before the next group.

### AC-2, AC-3, AC-4 — The session moves into the new worktree; Starting fresh happens in place; A quick records only its own cost

- [ ] T3 [AC-2, AC-3, AC-4] The commands enter the worktree and end with the state's next step — `core/commands/specify.md`

**Checkpoint:** `npx vitest run test/unit/content.test.ts test/integration/hook.test.ts test/integration/worktree-entry.test.ts test/unit/diagram.test.ts` passes (T3); this confirms AC-2, AC-3, AC-4 before the next group.

### AC-4 — A quick records only its own cost

- [ ] T4 [AC-4] [P] A quick's cost excludes what other specs already recorded — `src/spec/costs.ts`

**Checkpoint:** `npx vitest run test/integration/costs.test.ts test/unit/session-turns.test.ts` passes (T4); this confirms AC-4 before the next group.

## Details

### [x] T1 — Mandao names the next command from the spec's state

- **What:**
  - `nextStep(spec)` and `mandao run next <ID>`; `mandao approve` returns the same answer and records a hash of each approved document ([D1](spec.md#d1)).
  - `mandao run next --shown` records the hashes of a shown summary.
  - `approve --by-running <command> [--words <text>]` approves and returns `go`, or approves nothing and returns `ask` with the open item or the changed document ([D6](spec.md#d6)).
- **Done when:**
  - S-1.1, S-1.2 and S-1.5 hold on synthetic spec folders; S-1.3 and S-1.3/C1 hold: no implement for a draft spec or one with a critical `OPEN`.
  - S-1.4 and S-1.4/C1 hold: a changed approved document is named, and an approval without a hash makes no claim.
  - S-1.6 and S-1.6/C1 hold: plain `run next` writes nothing (the spec folder is byte-identical after the run).
  - S-5.1, S-5.4 and S-5.5 hold with `approve` run as a process: it approves and goes on in the normal case, refuses on a critical `OPEN`, and records "approved by running /mandao-implement" or the exact `--words`, with the date and the person.
  - S-5.2 and S-5.3 hold: it returns `ask` and records nothing for each of a `CONFLICT`, a `[NEEDS CLARIFICATION]`, a pending decision and a document changed since `--shown`.

```yaml
project: mandao
kind: feat
tier: standard
files: [src/spec/next.ts, src/spec/approvals.ts, src/spec/markdown.ts, src/spec/index.ts, src/cli/run-spec.ts, src/cli/approve.ts, docs/cli.md, test/unit/next.test.ts, test/integration/approve.test.ts]
exemplar: src/spec/loop.ts
ac: [AC-1, AC-1/C1, AC-1/C2, AC-5, AC-5/C1, AC-5/C2, AC-5/C3]
scenarios: [S-1.1, S-1.2, S-1.3, S-1.3/C1, S-1.4, S-1.4/C1, S-1.5, S-1.6, S-1.6/C1, S-5.1, S-5.2, S-5.2/C1, S-5.3, S-5.3/C2, S-5.4, S-5.4/C3, S-5.5]
test_levels: { S-1.1: unit, S-1.2: unit, S-1.3: unit, S-1.3/C1: e2e, S-1.4: e2e, S-1.4/C1: unit, S-1.5: unit, S-1.6: e2e, S-1.6/C1: e2e, S-5.1: e2e, S-5.2: e2e, S-5.2/C1: e2e, S-5.3: e2e, S-5.3/C2: e2e, S-5.4: e2e, S-5.4/C3: e2e, S-5.5: e2e }
evidence: tdd
risk_tags: [public-api]
depends_on: []
parallel_safe: false
verify: npx vitest run test/unit/next.test.ts test/integration/approve.test.ts
```

### [x] T2 — Each harness's session facts drive the cut advice

- **What:** the `session` entry per adapter ([D2](spec.md#d2)). The advice of `approve`, `run step` and `implement-summary` becomes `{ action, then, fallback }` for the active harness ([D4](spec.md#d4)). `openCommand` moves behind the table.
- **Done when:**
  - S-3.1 holds end to end: `mandao approve`, run as a process with Claude Code as the active harness, returns `/clear`, then `/mandao-implement MDO-0001`, with the worktree command as the fallback.
  - S-3.2 and S-3.2/C2 hold for codex, opencode, copilot and antigravity.
  - The active harness comes from `--harness` or `CLAUDE_CODE_SESSION_ID`, not `config.harnesses[0]`.
  - `start.test.ts`, `branching.test.ts` and `shadow.test.ts` still pass (critical flow).

```yaml
project: mandao
kind: feat
tier: standard
files: [src/adapters/types.ts, src/adapters/claude.ts, src/adapters/codex.ts, src/adapters/opencode.ts, src/adapters/copilot.ts, src/adapters/antigravity.ts, src/cli/session-advice.ts, src/cli/start.ts, src/cli/approve.ts, src/cli/run-leader.ts, src/adapters/AGENTS.md, test/unit/session-advice.test.ts, test/integration/leader-scripts.test.ts]
exemplar: src/adapters/types.ts
ac: [AC-3, AC-3/C2]
scenarios: [S-3.1, S-3.2, S-3.2/C2]
test_levels: { S-3.1: e2e, S-3.2: unit, S-3.2/C2: unit }
evidence: tdd
risk_tags: [public-api]
depends_on: [T1]
parallel_safe: false
verify: npx vitest run test/unit/session-advice.test.ts test/integration/leader-scripts.test.ts test/integration/start.test.ts test/integration/approve.test.ts
```

### [x] T3 — The commands enter the worktree and end with the state's next step

- **What:** the command content ([D3](spec.md#d3), [D4](spec.md#d4), [D5](spec.md#d5)):
  - every `Next:` line uses `{{script:next}}`;
  - in Claude Code, the specify and quick fallbacks and the §0 `run where` check enter the worktree with `EnterWorktree`;
  - the cut advice text follows D4;
  - quick records its cost before `quick-log` and the commit;
  - `implement.md` §0 and `tasks.md` call `approve --by-running` on a draft spec and relay its one question ([D6](spec.md#d6)), replacing "running the next command is not one";
  - specify, tasks and clarify end with `run next --shown`;
  - every `approve --by-running` call in the command texts passes `--harness <this harness>`, so Codex or Copilot are never told to type `/clear` (T2 review, OPEN on the no-signal default);
  - `run where` returns the active harness's resume command, built from its adapter's `session.resume`, and the texts print that field instead of a copy per harness ([D2](spec.md#d2)); only the `harness=claude` `EnterWorktree` step stays a conditional. The Codex resume command single-quotes the skill so a shell does not expand `$mandao-…` (added by the maintainer after the T3 review).

  ADR 0037 is amended, ADR 0038 gets an addendum, the new ADR 0040 records the approval rule, and `MANDAO-DESIGN.md` §5 is updated. `mandao sync` and `npm run diagrams` run after the content change.
- **Done when:**
  - S-2.1 and S-2.2 hold end to end: `mandao sync` run as a process in a temporary workspace with all five harnesses writes the `EnterWorktree` step only into the Claude Code files, and the resume command into the others. S-2.2/C1 holds per render.
  - S-2.3 and S-2.3/C1 hold: the `claude` render prints the resume command and stops when `EnterWorktree` is refused.
  - S-3.3 and S-3.3/C1 hold: implement, verify and close re-enter before any other step.
  - S-4.3 holds: in quick, the cost record comes before `quick-log` and the commit, and the commit lists `specs/quick/_log/costs.yml`. The rendered implement and tasks commands, for every harness, call `approve --by-running --harness <this harness>` on a draft spec, and no longer say that running the command is not an approval.
  - P1: a test runs `mandao hook graph-guard` with a worktree as its working directory and shows it reads that worktree.

```yaml
project: mandao
kind: feat
tier: standard
files: [core/commands/specify.md, core/commands/quick.md, core/commands/implement.md, core/commands/verify.md, core/commands/close.md, core/commands/story.md, core/commands/clarify.md, core/commands/tasks.md, core/commands/constitution.md, docs/decisions/0037-mandao-start-and-worktree-setup.md, docs/decisions/0038-session-cut-at-task-boundaries.md, docs/decisions/0040-approval-by-running-the-next-command.md, MANDAO-DESIGN.md, docs/command-format.md, src/scripts/spec.ts, src/cli/run-spec.ts, src/adapters/codex.ts, docs/cli.md, test/unit/content.test.ts, test/unit/session-advice.test.ts, test/integration/hook.test.ts, test/integration/worktree-entry.test.ts, test/integration/where.test.ts]
exemplar: core/commands/implement.md
ac: [AC-2, AC-2/C1, AC-2/C2, AC-3/C1, AC-4]
scenarios: [S-2.1, S-2.2, S-2.2/C1, S-2.3, S-2.3/C1, S-3.3, S-3.3/C1, S-4.3]
test_levels: { S-2.1: e2e, S-2.2: e2e, S-2.2/C1: unit, S-2.3: unit, S-2.3/C1: unit, S-3.3: unit, S-3.3/C1: unit, S-4.3: unit }
evidence: tdd
risk_tags: []
depends_on: [T1, T2]
parallel_safe: false
verify: npx vitest run test/unit/content.test.ts test/integration/hook.test.ts test/integration/worktree-entry.test.ts test/unit/diagram.test.ts
```

### [ ] T4 — A quick's cost excludes what other specs already recorded

- **What:** the cost delta subtracts the session's latest `cumulative` from any spec's `costs.yml` or the quick log, not only the file it writes ([D5](spec.md#d5), [P4](spec.md#p4)).
- **Done when:**
  - S-4.1 and S-4.1/C1 hold: 9.5 in the transcript and 9.0 recorded for MDO-0009 give 0.5 for the quick.
  - S-4.2 holds: with no earlier record anywhere, the record is the whole session.
  - The existing "delta since the last record" and "quick changes have their own log" tests in `costs.test.ts` still pass.

```yaml
project: mandao
kind: fix
tier: standard
files: [src/spec/costs.ts, src/cli/run-cost.ts, src/scripts/session-turns.ts, test/integration/costs.test.ts]
exemplar: src/spec/costs.ts
ac: [AC-4, AC-4/C1]
scenarios: [S-4.1, S-4.1/C1, S-4.2]
test_levels: { S-4.1: e2e, S-4.1/C1: e2e, S-4.2: e2e }
evidence: tdd
risk_tags: []
depends_on: []
parallel_safe: true
verify: npx vitest run test/integration/costs.test.ts test/unit/session-turns.test.ts
```

### [ ] T5 — The next step reads only real markers and knows failed and closed specs

- **What:** the next-step rules ([D1](spec.md#d1), [D6](spec.md#d6)), added by the maintainer after the T1 and T2 reviews:
  - markers (`[NEEDS CLARIFICATION]`, `OPEN`, `CONFLICT`) inside inline code spans or fenced code blocks are not open items; only real markers count (otherwise MDO-0010 blocks itself);
  - a spec whose verify failed recommends the rework (`/mandao-implement`), not `/mandao-verify` again (FR-1 "the verify verdict");
  - a closed spec recommends its delivery (push, PR, merge), derived from git, or nothing once delivered; never `/mandao-story` or `/mandao-clarify`, whatever markers remain. It only names the step: performing the delivery stays in MDO-0012;
  - when a Consistency Check row or a `CONFLICT` counts as resolved is written in `core/templates/shared/rules/consistency-check.md`, and the code follows that text.
- **Done when:**
  - On synthetic spec folders, a `[NEEDS CLARIFICATION]`, `OPEN` or `CONFLICT` in backticks or a code block is not an open item, and a real one still is.
  - `run next` on this spec (MDO-0010) does not recommend `/mandao-clarify` for a marker written in prose.
  - A spec with a failed verify recommends `/mandao-implement`.
  - A closed spec recommends its delivery, or nothing when its branch is merged, and never `/mandao-story` or `/mandao-clarify`.
  - `consistency-check.md` states the row shape and when a row or a `CONFLICT` is resolved, and a test pins the code to the statuses it names.

```yaml
project: mandao
kind: feat
tier: standard
files: [src/spec/next.ts, src/spec/markdown.ts, src/cli/approve.ts, src/spec/AGENTS.md, core/templates/shared/rules/consistency-check.md, test/unit/next.test.ts, test/integration/approve.test.ts]
exemplar: src/spec/next.ts
ac: [AC-1, AC-1/C1, AC-5, AC-5/C1]
scenarios: []
test_levels: {}
evidence: tdd
risk_tags: [public-api]
depends_on: [T1]
parallel_safe: false
verify: npx vitest run test/unit/next.test.ts test/integration/approve.test.ts
```
