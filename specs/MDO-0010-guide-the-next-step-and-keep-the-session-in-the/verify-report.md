---
schema_version: 1
spec: MDO-0010-guide-the-next-step-and-keep-the-session-in-the
verdict: verified
date: 2026-10-21
---

# Verify — Guide the next step and keep the session in the spec worktree

Verified: every AC and clause traces to a passing test, and the critical AC-2, AC-3 and AC-5 have
process-level tests. 285 tests passed across both suites, with no product bug and no blocker. One
premise, P2 (`/clear` keeps the working directory), still needs one live Claude Code run (quickstart
step 5). D3's re-entry makes the advice safe either way.

## Acceptance criteria → tests

| AC / clause | Critical | Tests | Level | Result |
|---|---|---|---|---|
| AC-1 | no | `next.test.ts` S-1.1, S-1.2, S-1.4, S-1.5; `approve.test.ts` S-1.4 (changed `spec.md` named) | unit, e2e | pass |
| AC-1/C1 | no | `next.test.ts` S-1.3; `approve.test.ts` "approve lists no implement… draft spec", "run next lists no implement… critical OPEN" | unit, e2e | pass |
| AC-1/C2 | no | `approve.test.ts` "plain run next writes nothing: spec folder byte-identical, still draft, no approval" | e2e | pass |
| AC-2 | yes | `worktree-entry.test.ts` "S-2.1: EnterWorktree only in the Claude Code files" (specify, quick, implement; `mandao sync` spawned) | e2e | pass |
| AC-2/C1 | yes | `worktree-entry.test.ts` "S-2.2: the other harnesses print the resume field"; `content.test.ts` S-2.2, S-2.2/C1 | e2e, unit | pass |
| AC-2/C2 | yes | `content.test.ts` "S-2.3 and S-2.3/C1: claude prints the resume command and stops when EnterWorktree is refused" | unit | pass |
| AC-3 | yes | `leader-scripts.test.ts` "approve in Claude Code advises /clear, then the next command, with the worktree command as the fallback" (plus `--harness` and implement-summary); `session-advice.test.ts` S-3.2 | e2e, unit | pass |
| AC-3/C1 | yes | `content.test.ts` "S-3.3 and S-3.3/C1: … re-enters the worktree (claude) or prints the resume field (others)" | unit | pass |
| AC-3/C2 | yes | `session-advice.test.ts` "S-3.2/C2: a harness with no in-place action gets the open-session command" | unit | pass |
| AC-4 | no | `costs.test.ts` S-4.1, S-4.2; `content.test.ts` S-4.3 (cost recorded before `quick-log`, commit lists the quick costs file) | e2e, unit | pass |
| AC-4/C1 | no | `costs.test.ts` "the quick does not count what the other spec record already holds" | e2e | pass |
| AC-5 | yes | `approve.test.ts` S-5.1 "nothing open and the summary shown: approves… says go", S-5.5 "words… recorded verbatim" | e2e | pass |
| AC-5/C1 | yes | `approve.test.ts` S-5.2 `test.each` (`CONFLICT`, `[NEEDS CLARIFICATION]`, pending decision → `ask`, nothing recorded); "a resolved critical Consistency Check row does not ask" | e2e | pass |
| AC-5/C2 | yes | `approve.test.ts` "spec.md changed after --shown returns ask naming spec.md and records nothing" | e2e | pass |
| AC-5/C3 | yes | `approve.test.ts` S-5.4 `test.each` (critical OPEN refused with and without `--words apruebo`); "on the tasks step a critical OPEN… is refused" | e2e | pass |

### Level of the e2e tests

The `approve` and `run next` tests run the real CLI program through `buildProgram(...).parseAsync`, in
process, against git fixture workspaces. `worktree-entry.test.ts` spawns the built `cli.js sync`. Separately,
`run next` was run on the rebuilt `dist/cli.js` (see Evidence). The project has no separate `tests.e2e`
command.

### T5 (no declared scenarios)

`verify-plan` reports T5 as `UNTESTED` because its `scenarios` list is empty. Its done-when items are
tested in `next.test.ts`, and all of them pass:
- Markers in code spans and fenced blocks are ignored, per marker.
- A blocked verify recommends `/mandao-implement`.
- A closed spec recommends its delivery, or nothing once merged. It never recommends story or clarify.
- `consistency-check.md` statuses are pinned by the describe block "consistency-check.md and the code agree…".

## Suites

| Project | Kind | Result |
|---|---|---|
| mandao | unit (15 related files) | pass — 202/202 |
| mandao | e2e (integration flows, 8 related files) | pass — 83/83 |
| mandao | build (`dist/cli.js`) | pass — rebuilt before the e2e run |

## TDD evidence (ADR 0022)

`missingRed` is empty: every task with declared tests has RED evidence. No red test changed during verify.

## Security mentions (not blocking)

None.

## Product bugs

None.

## Deferred to CI

None.

## Blockers

None.

## Consistency Check

| ID | Type | Finding | Severity | Owner | Status |
|---|---|---|---|---|---|
| CC-1 | GAP | `tasks.md` T5 lists `scenarios: []`, so `mandao run trace` reports it untested, though its done-when items have passing tests in `next.test.ts`. | normal | dev | open |
| CC-2 | PREMISE | P2 (`spec.md#p2`): whether `/clear` keeps the worktree as the working directory is still `UNVERIFIED`. AC-3/C1's re-entry (S-3.3, passing) covers the case where it does not. | normal | maintainer | open |
| CC-3 | CONTRADICTION | Story AC-5 quotes the record text as "aprobado al correr /mandao-<command>". `spec.md` FR-5 and the code record "approved by running /mandao-<command>". The meaning matches; the wording differs by language. | normal | PO | open |

No critical finding. Each open row goes to `/mandao-close` or `/mandao-clarify` for the owner; none
blocks verification.

## Evidence

Unit suite:

```
$ node .mandao/bin/mandao.mjs run tests mandao test/unit/next.test.ts test/unit/session-advice.test.ts test/unit/content.test.ts test/unit/diagram.test.ts test/unit/session-turns.test.ts test/integration/approve.test.ts test/integration/costs.test.ts test/integration/hook.test.ts test/integration/leader-scripts.test.ts test/integration/start.test.ts test/integration/where.test.ts test/integration/worktree-entry.test.ts test/integration/branching.test.ts test/integration/shadow.test.ts
 Test Files  15 passed (15)
   Affected  15 of 71 test files (related to 15 files)
      Tests  202 passed (202)
   Duration  7.48s (tests 90%, import 9%)
{"status":"PASS",...,"exitCode":0,"durationMs":8003,"reason":"10 cores, 3650 MB free, load 3.3","impact":"runner"}
```

Build and e2e suite:

```
$ node .mandao/bin/mandao.mjs run build mandao
PASS (exit 0) — tsup rebuilt dist/cli.js (446.57 KB)

$ node .mandao/bin/mandao.mjs run tests mandao test/integration/{approve,costs,worktree-entry,leader-scripts,start,where,hook}.test.ts
Test Files  8 passed (8)
Affected  8 of 71 test files (related to 8 files)
Tests  83 passed (83)
Duration  6.70s
```

Built CLI on this spec (the marker appears only in prose and backticks here, so no clarify); `git status --short` was identical before and after:

```
$ node dist/cli.js run next MDO-0010
{"recommended":{"command":"/mandao-verify","reason":"every task is done"},"options":["/mandao-verify"]}
```

Built CLI on a throwaway draft fixture (quickstart step 3):

```
baseline:                         {"recommended":{"command":"mandao approve MDO-0001 design","reason":"the spec is still draft"},"options":["mandao approve MDO-0001 design","/mandao-clarify"]}
marker only in prose/backticks:   identical to baseline
real "- [NEEDS CLARIFICATION] who approves refunds?":
                                  {"recommended":{"command":"/mandao-clarify","reason":"open item: who approves refunds?"},"options":["/mandao-clarify"]}
```

Plan and status:

```
$ node .mandao/bin/mandao.mjs run verify-plan MDO-0010
missingRed: [], deferred: [], blockers: [], securityMentions: [], findings: [{"type":"UNTESTED","ref":"T5","message":"T5 declares no tests"}]

$ node .mandao/bin/mandao.mjs run status MDO-0010 verified
{"from":"in-progress","to":"verified","allowed":true,"problems":[]}
```
