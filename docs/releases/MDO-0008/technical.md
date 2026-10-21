---
schema_version: 1
spec: MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r
audience: developers
language: en
---

# Technical notes — Measure what the session-cut rule needs

`doctor` now reports the Claude Code prompt-cache TTL and its source, reading settings without ever
writing them. `run kaizen` measures a spec's pauses and main-session turns from its transcripts, and
`run kaizen-compare` sets them against the ADR 0038 constants. Know first: until this is released,
`.mandao/bin/mandao.mjs` runs the installed Mandao, so use `node dist/cli.js run …` to see the new fields.

## What was built

Project `mandao`.

| Module | Change | Commit |
|---|---|---|
| Engine | `src/engine/doctor-cache.ts`: TTL resolution per bucket (D1) and the `prompt-cache TTL` finding; wired in `runDoctor` | c1fcc52 (T1), 2c58a69 (T1) |
| Scripts | `src/scripts/session-turns.ts`: command and task windows, turns, pauses, reload, turns after each logged estimate | 451a3bf (T2) |
| Scripts | `src/scripts/session-cut.ts`: `mainResponse` exported with its id; parser for `_log/session-cuts.md` rows | 451a3bf (T2) |
| Scripts | `src/scripts/commits.ts`: `taskCommitTimes` | 451a3bf (T2) |
| CLI | `src/cli/run-close.ts`: `sessions` in `run kaizen`, `sessionCut` in `run kaizen-compare` | df1ec7c (T3), 4ba790b (T4) |
| Spec | `src/spec/kaizen-sessions.ts`: comparison, 20% threshold, minimum 3 specs; exported from `spec/index.ts` | 4ba790b (T4) |
| Content | `core/commands/close.md` step 1.2 and `## Sessions` in `core/templates/shared/close/kaizen.md` | df1ec7c (T3), 4ba790b (T4) |
| Generated | Close command for Claude Code, Codex and Copilot, the Kaizen template, the lock | 7af5b78 |

- **TTL resolution, per bucket:** `FORCE_PROMPT_CACHING_5M`, then the bucket's variable, then its
  settings key, then (subagents only) `experimental.cacheTtl` in `.claude/agents/*.md`, then
  `ENABLE_PROMPT_CACHING_1H`, then the default.
  - Settings files are read highest first: local, then project, then `$CLAUDE_CONFIG_DIR` or the user's home.
  - A value other than `5m` or `1h` is a `warn` and resolution goes on to the next step.
  - Claude Code below 2.1.242 reports the default.
  - Managed settings and `--settings` are not read, and the finding says so.
- **Agent front matter:** parsed as YAML only, never with gray-matter's default engines, so a `---js` block is
  never executed (2c58a69).
- **A turn and a pause:**
  - A turn is one main-session response per `message.id`, excluding `isSidechain` lines, `<synthetic>`
    and the `subagents/` folder.
  - A pause is a user prompt's time minus the previous main response's time. The first prompt,
    tool results and meta lines are not pauses.
- **Missing data:** a missing transcript is listed under `missing` and its windows have no counts.
  A close not yet recorded is `"not recorded"`.
- **Known limits:**
  - Pauses are counted over each whole transcript, not per command window.
  - The commit-time test depends on the global git config (gpgsign, hooksPath).
  - The `Task` tool name used for the reload has no test of its own.
  - No test runs `run kaizen-compare` end to end for `sessionCut`; verify checked it on the built CLI.

## Decisions and pivots

D1–D4 in [spec.md](../../../specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/spec.md#d1):
- doctor resolves the TTL the way Claude Code documents it, and only reads;
- windows come from cost records and `Mandao-Task` commit times;
- one turn per response id;
- compare across specs, propose only past 20% and from 3 specs, never apply.

No pivots. T1 took four attempts: precedence and invalid agent values, then the front-matter engine.

## Contract changes

Additive JSON fields only:
- `run kaizen` gains `sessions`;
- `run kaizen-compare` gains `sessionCut`;
- `doctor` gains one `info` finding, plus a `warn` per ignored TTL value.

## Module docs applied at close

- ADR 0036, cache-duration addendum: accepted. `doctor` reports the TTL in effect and its source, and
  Kaizen shows the pauses.
- ADR 0038, Consequences: `run kaizen-compare` (`sessionCut`) measures the constants and proposes values
  from 3 specs on; a person applies them.
- `docs/constitution/` unchanged, so no CHANGELOG entry.

## Cost

The total cost lives in `specs/MDO-0008-…/_log/costs.yml`, by command and role. This account is a Claude subscription, so every amount is a
list-price equivalent: the same tokens at API list prices, not what was charged. `run cost` shows
`basis: mixed` only because entries recorded before the `basis` field existed carry none; they are
equivalents too.

## Diagram and drift

No diagram: optional at lite depth and none was approved. `mandao run diagram-drift` has nothing to
compare (`design.md has no diagram with a structured graph`). No drift recorded.

## How to test

- `npx vitest run test/unit/doctor-cache.test.ts test/unit/session-turns.test.ts test/unit/commits-times.test.ts test/unit/kaizen-sessions.test.ts test/integration/close.test.ts`.
- By hand: the steps in [quickstart.md](../../../specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/quickstart.md).
  Use `node dist/cli.js` after `npm run build`.

## Open items

- **Kaizen standardizations 1 and 2 (approved; 1 amended):** apply in a follow-up change.
  - 1: a `core/` task runs `mandao sync`, and only blocking Reviewer findings become a task.
  - 2: the dogfooding note in `AGENTS.md`.
  - Both are listed in [docs/kaizen/MDO-0008.md](../../kaizen/MDO-0008.md#standardize).
  - Standardization 3 is already on main (ADR 0039).
- **Unconfirmed premise P3:** two inferences about Claude Code's TTL resolution are not confirmed by a run.
  They are that an `env`-block variable beats the settings key, and that an ignored higher value does not fall back.
- **Mean error of the logged estimates:** available from the first `kaizen-compare` after this close is recorded.

## Links

- [Verify report](../../../specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/verify-report.md)
- [Kaizen](../../kaizen/MDO-0008.md)
- ADR 0036 (cost-conscious by design, cache addendum), ADR 0038 (session cut at task boundaries).

## Evidence

- Commits found by trailers `Mandao-Task: T1…T4` on this branch: c1fcc52, 2c58a69 (T1), 451a3bf (T2),
  df1ec7c (T3), 4ba790b (T4); sync 7af5b78 (`Mandao-Quick: mdo-0008-sync`).
- Verify: unit suite 46 files, 378 tests passed; built CLI quickstart passed (verify-report.md, Evidence).
