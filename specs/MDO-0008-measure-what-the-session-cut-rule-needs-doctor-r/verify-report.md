---
schema_version: 1
spec: MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r
verdict: blocked
date: 2026-10-20
---

# Verify — Measure what the session-cut rule needs

Blocked on one thing that was never done. Every AC holds in code: the unit suite passes 378/378 and
the rebuilt CLI behaves as the quickstart says. But this repo's generated close command and Kaizen
template were not re-synced after T3 and T4, so `/mandao-close` here would not write `## Sessions` or
report `sessionCut` ([B1](#b1)).

## Acceptance criteria → tests

| AC / clause | Critical | Tests | Level | Result |
|---|---|---|---|---|
| AC-1 | no | `doctor-cache.test.ts` S-1.1, S-1.2, S-1.4 to S-1.7; built `doctor` | unit, built CLI | pass |
| AC-1/C1 | no | `doctor-cache.test.ts` "S-1.2 … nothing is touched (C1)"; settings shasum/mtime on the built CLI | unit, built CLI | pass |
| AC-1/C2 | no | `doctor-cache.test.ts` "S-1.3 and S-1.3/C2", "S-1.3/C2 … next step", "S-1.6 and AC-1/C2"; built `doctor` with `10m` | unit, built CLI | pass |
| AC-2 | no | `session-turns.test.ts` S-2.1, S-2.2; `commits-times.test.ts` | unit | pass |
| AC-2/C1 | no | `session-turns.test.ts` "S-2.3/C1 …", "the measured session still counts while the missing one is named" | unit | pass |
| AC-2/C2 | no | `session-turns.test.ts` "S-2.4/C2: sidechain lines and the subagents folder add no main-session turn" | unit | pass |
| AC-3 | no | `close.test.ts` "Kaizen shows the sessions (MDO-0008 S-3.1)" (2 tests); built `run kaizen` | integration, built CLI | pass |
| AC-4 | no | `kaizen-sessions.test.ts` S-4.1, S-4.2; built `run kaizen-compare` | unit, built CLI | pass |
| AC-4/C1 | no | `kaizen-sessions.test.ts` "S-4.3/C1 …"; built `run kaizen-compare` (n < 3, no proposal) | unit, built CLI | pass |
| AC-4/C2 | no | `kaizen-sessions.test.ts` "S-4.4/C2 …"; `git status src/` empty after the built `run kaizen-compare` | unit, built CLI | pass |

### Weak spots (not failing)

- **S-1.4:** only the `cacheFindings(…, ['codex'])` guard is unit-tested. No test runs `runDoctor`
  for a workspace without `claude`. The wiring at `src/engine/doctor.ts:157` passes
  `config.harnesses` through unchanged.
- **S-4.1 to S-4.4:** no test runs `mandao run kaizen-compare` and asserts on `sessionCut`. The wiring
  at `src/cli/run-close.ts:120` was checked only on the built CLI.
- **S-4.4/C2:** the unit test re-reads files the pure function never receives, so it cannot fail on
  its own. The built-CLI `git status` check is the real proof.

## Suites

| Project | Kind | Result |
|---|---|---|
| mandao | unit (46 related files) | pass: 378/378 |
| mandao | built CLI (quickstart steps 1–4) | pass |

## TDD evidence (ADR 0022)

`missingRed`: none. RED records in `_log/progress.yml` for T1 to T4. No red test was changed during verify.

## Security mentions (not blocking)

None.

## Product bugs

None.

## Deferred to CI

None.

## Blockers

<a id="b1"></a>
### B1 — this repo's generated outputs are not synced

The spec's change table says to edit `core/commands/close.md` and `core/templates/shared/close/kaizen.md`,
"then `mandao sync`". The `core/` sources have the Sessions step and section. These generated outputs
have neither `## Sessions` nor `sessionCut`:

- `.claude/skills/mandao-close/SKILL.md`
- `.agents/skills/mandao-close/SKILL.md`
- `.mandao/templates/app/close/kaizen.md`

The built `doctor` warns that 4 generated files are out of date, `kaizen.md` among them. `close.test.ts`
proves a fresh sync produces the step and the section. Fix: run `mandao sync` and commit the outputs.
This is trivial, so `/mandao-quick` fits.

## Consistency Check

| ID | Type | Finding | Severity | Owner |
|---|---|---|---|---|
| CC-1 | `GAP` | T3 "Done when" says "After `mandao sync`, the generated close command and Kaizen template carry the step and the section" (`tasks.md`). In this repo they do not ([B1](#b1)). | normal | dev |

Story, spec and the built behaviour otherwise agree. P3 and P4 are still unverified by a run and
still marked as assumptions in `spec.md`. Nothing observed contradicts them: the real MDO-0007 and
MDO-0008 transcripts measured without errors.

## Evidence

<details><summary>Unit suite</summary>

```
$ node .mandao/bin/mandao.mjs run tests mandao core/commands/close.md core/templates/shared/close/kaizen.md src/cli/run-close.ts src/engine/doctor-cache.ts src/engine/doctor.ts src/scripts/commits.ts src/scripts/session-cut.ts src/scripts/session-turns.ts src/spec/index.ts src/spec/kaizen-sessions.ts test/integration/close.test.ts test/unit/commits-times.test.ts test/unit/doctor-cache.test.ts test/unit/kaizen-sessions.test.ts test/unit/session-turns.test.ts
status: PASS  exitCode 0
Test Files  46 passed (46)
Tests  378 passed (378)
Duration  17.56s
```
The tasks' `verify:` files (`doctor-report`, `session-cut`, `kaizen`, among others) are inside these 46 files.
</details>

<details><summary>Built CLI</summary>

```
$ node .mandao/bin/mandao.mjs run build mandao   → PASS (dist/cli.js)

$ node dist/cli.js doctor
info prompt-cache TTL: promptCacheTtl and subagentPromptCacheTtl are unset; main default (1h on a Claude subscription within plan usage, 5m with usage credits, an API key or a cloud provider); subagents default 5m; managed settings and --settings rank higher but are not read; …
  → ADR 0036 recommends promptCacheTtl: 5m; Mandao never writes Claude Code settings

# with {"promptCacheTtl": "10m"} in a temporary .claude/settings.local.json (removed afterwards)
warn promptCacheTtl is 10m (promptCacheTtl in .claude/settings.local.json), which is not 5m or 1h and is ignored by Claude Code
  → set it to 5m or 1h, or remove it
(info line still: main default …)

$ node dist/cli.js run kaizen MDO-0007   (sessions)
pauses {count:6, atMost5:6, between5And60:0, over60:0, medianMinutes:0.4}
tasks {T1:23, T2:13}  verify 7  close 18  afterTasks 28  missing []  unmeasured []

$ node dist/cli.js run kaizen MDO-0008   (sessions)
pauses {count:8, atMost5:7, between5And60:1, over60:0, medianMinutes:0.4}
tasks {T1:26, T2:43, T3:14, T4:11}  close "not recorded"  afterTasks 4  reload 9170  estimates: 5 rows

$ node dist/cli.js run kaizen-compare   (sessionCut)
turnsPerTask    15     measured 21.67  n 2  insufficient data (minimum 3)
turnsAfterTasks 28     measured 28     n 1  insufficient data (minimum 3)
reloadTokens    10000  measured 9170   n 1  insufficient data (minimum 3)
$ git status --short src/          → (empty)
$ git diff --stat src/scripts/session-cut.ts → (empty)
```

Settings files, `mtime size` and shasum, identical before and after every run:
`~/.claude/settings.json 1792524829 44579 17dfd8c5…`; `.claude/settings.json 1792531605 566 99847822…`;
`.claude/settings.local.json` absent before and after. Output held counts, durations and ids only, no prompt text.
</details>

<details><summary>Generated outputs (B1)</summary>

```
$ grep "## Sessions|sessionCut" over .mandao/templates/**, .claude/skills/mandao-close/**, core/…
core/commands/close.md:53:2. **Sessions:** show `sessions` …
core/commands/close.md:56:   Also report `sessionCut` …
core/templates/shared/close/kaizen.md:13:## Sessions
(no match in .claude/skills/mandao-close/SKILL.md or .mandao/templates/app/close/kaizen.md)
```
</details>
