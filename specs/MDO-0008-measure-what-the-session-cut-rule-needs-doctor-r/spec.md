---
schema_version: 1
spec: MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r
depth: lite
projects: [mandao]
status: approved
---

# Spec — Measure what the session-cut rule needs

`doctor` reads Claude Code's environment and settings files (never writes them) and reports the
prompt-cache TTL in effect. A new script splits a spec's Claude Code sessions into command and task
windows and counts pauses and main-session turns; `run kaizen` shows them and `run kaizen-compare`
sets them against the ADR 0038 constants and logged estimates, proposing values a person may apply.

## Functional requirements

<a id="fr1"></a>
### FR-1 — doctor reports the prompt-cache TTL in effect
Serves: AC-1, AC-1/C1, AC-1/C2
Projects: mandao

When the workspace's harnesses include `claude`, `doctor` adds one finding with the TTL for the main
conversation and for subagents, the source of each, and the ADR 0036 recommendation as its `fix`.

#### S-1.1 — unset: the documented default
- **Given** none of the variables or keys of [D1](#d1) set in the environment or in the user, project
  or project-local settings
- **When** `mandao doctor` runs
- **Then** an `info` finding says both are unset and gives the default (main 1h on a Claude subscription
  within plan usage, 5m with usage credits, an API key or a cloud provider; subagents 5m), with the fix
  "ADR 0036 recommends promptCacheTtl: 5m; Mandao never writes Claude Code settings"

#### S-1.2 — set: the winning source by precedence
- **Given** `promptCacheTtl: "1h"` in the user settings and `"5m"` in `.claude/settings.local.json`,
  and `subagentPromptCacheTtl` set nowhere but `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL=1h` in the environment
- **When** `mandao doctor` runs
- **Then** the `info` finding reports main `5m` from `.claude/settings.local.json` and subagents `1h`
  from the environment, following the order of [D1](#d1)
- **BUT it must NOT** create, change or touch the modification time of any settings file (C1)

#### S-1.3 — invalid value
- **Given** `promptCacheTtl: "10m"` in the project settings and no other TTL source
- **When** `mandao doctor` runs
- **Then** a `warn` finding names the file and the value, and the main TTL is the default
- **AND IT MUST** say the value is "not 5m or 1h" and ignored by Claude Code, never report `10m` as the
  TTL in effect (C2)

#### S-1.4 — no Claude Code
- **Given** a workspace whose harnesses do not include `claude`
- **When** `mandao doctor` runs
- **Then** there is no cache-TTL finding

#### S-1.5 — the global switches
- **Given** `FORCE_PROMPT_CACHING_5M=1` and `promptCacheTtl: "1h"` in the user settings
- **When** `mandao doctor` runs
- **Then** both TTLs are `5m` from `FORCE_PROMPT_CACHING_5M`; and with only `ENABLE_PROMPT_CACHING_1H=1`
  and `subagentPromptCacheTtl: "5m"` set, main is `1h` from `ENABLE_PROMPT_CACHING_1H` and subagents
  `5m` from the settings key

#### S-1.6 — a subagent's own TTL
- **Given** an agent file in `.claude/agents/` whose frontmatter sets `experimental.cacheTtl: 1h`, and no
  subagent variable or key
- **When** `mandao doctor` runs
- **Then** the finding names that agent as overriding the subagent TTL with `1h` (Claude Code 2.1.248+)

#### S-1.7 — a Claude Code too old for the TTL settings
- **Given** `claude --version` reports 2.1.200
- **When** `mandao doctor` runs
- **Then** the finding says this version ignores the TTL variables and keys (they need 2.1.242+) and
  reports the default; with no version available it says the version was not checked

<a id="fr2"></a>
### FR-2 — pauses and turns from the spec's transcripts
Serves: AC-2, AC-2/C1, AC-2/C2
Projects: mandao

From the sessions in the spec's `_log/costs.yml` (Claude Code entries), measure the user's pauses and
the main-session turns of each task, of verify and of close, with the windows of [D2](#d2) and the
counting of [D3](#d3).

#### S-2.1 — pauses before each user turn
- **Given** a main transcript with user prompts 1, 7 and 75 minutes after the previous main response
- **When** the spec's sessions are measured
- **Then** the pauses are 3, with median 7 minutes, 1 at most 5 minutes, 1 between 5 and 60, 1 over 60
- **AND IT MUST** leave out the session's first prompt, tool results and meta lines (C1)

#### S-2.2 — turns per task, verify and close
- **Given** a session with an implement record, commits for T1 and T2, then verify and close records
- **When** the spec's sessions are measured
- **Then** each task has the main responses between the previous boundary and its last commit, verify
  and close have those of their windows, and "after tasks" is the implement tail plus verify plus close
- **AND IT MUST** count one turn per response id, not per transcript line (C1)

#### S-2.3 — missing data is named, never zero
- **Given** a session id in `costs.yml` with no transcript on this machine, and a spec without a close record
- **When** the spec's sessions are measured
- **Then** the session is listed as missing, its windows have no counts, and close is `not recorded`
  (C1)

#### S-2.4 — subagents are not main turns
- **Given** a main transcript with `isSidechain` lines and a `subagents/` folder with responses
- **When** the spec's sessions are measured
- **Then** none of those responses is counted as a main-session turn (C2)

<a id="fr3"></a>
### FR-3 — Kaizen shows the measurements
Serves: AC-3
Projects: mandao

#### S-3.1 — run kaizen and the Kaizen document
- **Given** a spec with measured sessions
- **When** `mandao run kaizen <spec>` runs
- **Then** its JSON has `sessions` with the pauses, the turns per task, verify, close and after tasks,
  and the missing sessions; `/mandao-close` writes them under `## Sessions` in `docs/kaizen/<ID>.md`

<a id="fr4"></a>
### FR-4 — Kaizen compares with the constants and the logged estimates
Serves: AC-4, AC-4/C1, AC-4/C2
Projects: mandao

`mandao run kaizen-compare` adds `sessionCut`, built as [D4](#d4) says.

#### S-4.1 — a constant that differs gets a proposal
- **Given** 3 specs whose tasks average 22 main turns and whose verify plus close average 28
- **When** `mandao run kaizen-compare` runs
- **Then** `TURNS_PER_TASK` shows 15 against 22 with the sample size and a proposal of 22;
  `TURNS_AFTER_TASKS` shows 28 against 28 and no proposal

#### S-4.2 — logged estimates against what followed
- **Given** a `_log/session-cuts.md` row estimating 43 turns left at T2's boundary, and 51 main turns
  in the spec's sessions after that time up to the close record
- **When** `mandao run kaizen-compare` runs
- **Then** the row shows estimated 43 and actual 51, and the mean error over all rows is reported

#### S-4.3 — too few specs
- **Given** measurements from 2 specs
- **When** `mandao run kaizen-compare` runs
- **Then** the measured values and `n: 2` are shown, the result says `insufficient data (minimum 3)`,
  and no value is proposed (C1)

#### S-4.4 — proposals are advice only
- **Given** any comparison with proposals
- **When** `mandao run kaizen-compare` runs
- **Then** `src/scripts/session-cut.ts` and every config file are unchanged (C2)

## AC → FR matrix

| AC | Clause | FR / scenario | Status |
|---|---|---|---|
| AC-1 | main | FR-1 / S-1.1, S-1.2, S-1.4 to S-1.7 | covered |
| AC-1 | C1: no settings written | FR-1 / S-1.2/C1 | covered |
| AC-1 | C2: invalid value named | FR-1 / S-1.3/C2 | covered |
| AC-2 | main | FR-2 / S-2.1, S-2.2 | covered |
| AC-2 | C1: missing ≠ zero | FR-2 / S-2.3/C1 | covered |
| AC-2 | C2: no subagent turns | FR-2 / S-2.4/C2 | covered |
| AC-3 | main | FR-3 / S-3.1 | covered |
| AC-4 | main | FR-4 / S-4.1, S-4.2 | covered |
| AC-4 | C1: minimum specs | FR-4 / S-4.3/C1 | covered |
| AC-4 | C2: constants untouched | FR-4 / S-4.4/C2 | covered |

## Decisions

<a id="d1"></a>
### D1 — doctor reads the TTL the way Claude Code resolves it, and only reads

- Two buckets: main (`CLAUDE_CODE_PROMPT_CACHE_TTL` / `promptCacheTtl`) and subagents
  (`CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL` / `subagentPromptCacheTtl`). Per bucket the first valid step
  wins, in Claude Code's documented order ([P3](#p3)):
  1. `FORCE_PROMPT_CACHING_5M=1`: 5m for both.
  2. The bucket's variable.
  3. The bucket's settings key.
  4. Subagents only: `experimental.cacheTtl` in an agent's frontmatter, per agent; the finding lists
     the agents in `<root>/.claude/agents/` that set it.
  5. `ENABLE_PROMPT_CACHING_1H=1`: 1h for both.
  6. The default.
- Only `5m` and `1h` are valid; any other value is ignored by Claude Code, so it is reported (`warn`)
  and the bucket goes on to the next step.
- Variables: a settings file's `env` block is written into the process environment and replaces the
  shell value, so the highest file that defines the variable wins over the shell. The finding notes that
  the Desktop app and self-hosted runners build their own launch environment.
- Settings files, highest first: `<root>/.claude/settings.local.json`, `<root>/.claude/settings.json`,
  `$CLAUDE_CONFIG_DIR/settings.json` or else `<home>/.claude/settings.json`. A key comes from the highest
  file that sets it. Managed settings and `--settings` rank higher but are not read; the finding says so.
- The keys and variables need Claude Code 2.1.242+ (frontmatter 2.1.248+). The version comes from the
  `probe` doctor already uses; below that, the finding reports the default and says why.
- A new `src/engine/doctor-cache.ts`, pure over (env, file reader, probe), like `doctor-harness.ts`. An
  unreadable settings file is skipped and named in the finding.
- Rejected: asking `claude` for its resolved config (no such command); detecting the account type to
  pick the default (no reliable local signal; the finding gives both defaults); reading managed settings
  (platform-specific paths, out of scope).

<a id="d2"></a>
### D2 — sessions from the cost records, windows from records and commits

- Sessions: the distinct `session` of `claude` entries in `_log/costs.yml` (they exist, [P1](#p1)).
  Transcript by `findClaudeTranscript`.
- A command's window in a session runs from the previous record of that session (or its first response)
  to its own record's `at`. Inside implement windows, a task's window ends at its last commit with the
  `Mandao-Task` trailer ([P2](#p2)) and starts at the previous task's end or the window's start; the
  rest of the window is the implement tail. A new `taskCommitTimes` beside `taskCommits` in
  `src/scripts/commits.ts` gives the times.
- A task committed outside every implement window is listed as unmeasured.
- Rejected: execution-log rows (dates only, no times); `mandao run step` calls found in the transcript
  (depends on the Leader's wording).

<a id="d3"></a>
### D3 — what a turn and a pause are

- A turn is a main-session response: the same filter as `session-cut.ts` (not `isSidechain`, not
  `<synthetic>`, has usage), counted once per `message.id`. `mainResponse` is exported with its id so both
  modules count the same thing.
- A pause is a user prompt's time minus the previous main response's time. A prompt is a `user` line,
  not `isMeta`, whose content is a string or has a `text` block, and no `tool_result`. Buckets match the
  ADR 0036 addendum: ≤ 5 min, 5–60, > 60, and the median.
- Reload (for `RELOAD_TOKENS`): in a session whose first record is implement or verify, the prompt size
  of the first response that calls a subagent minus that of the session's first response.
- Only counts and durations leave the module; no prompt text.

<a id="d4"></a>
### D4 — compare across specs, propose past a threshold, never apply

- `src/spec/kaizen-sessions.ts`, pure: for `TURNS_PER_TASK` (mean over measured tasks),
  `TURNS_AFTER_TASKS` (mean over specs with verify and close recorded) and `RELOAD_TOKENS` (mean over
  measured reloads): constant, measured, `n`, and a proposal (rounded measured value) when they differ by
  more than 20%.
- Below 3 specs with measurements, `insufficient data (minimum 3)` and no proposal: the same minimum as
  the cost advice in `kaizen-costs.ts`.
- Logged estimates: each `_log/session-cuts.md` row's "Turns left" against the main turns after its
  `At` across the spec's sessions, only when the spec's close is recorded; plus the mean error.
- Proposals are text in the JSON; a person edits `session-cut.ts` (ADR 0036: recommend, never apply).
- Rejected: a TTL proposal from the pauses (out of scope; pauses are shown); writing constants to config.

## Changes by project and module

| Project | Module | Change | Exemplar file |
|---|---|---|---|
| mandao | Engine | `doctor-cache.ts`: TTL resolution and finding; wired in `runDoctor` | `src/engine/doctor-harness.ts` |
| mandao | Scripts | `session-turns.ts`: windows, turns, pauses, reloads, estimate actuals | `src/scripts/session-cut.ts` |
| mandao | Scripts | `session-cut.ts`: export `mainResponse` with id; parse of `session-cuts.md` rows | `src/scripts/session-cut.ts` |
| mandao | Scripts | `commits.ts`: `taskCommitTimes` | `src/scripts/commits.ts` |
| mandao | Spec | `kaizen-sessions.ts`: comparison and proposals; export from `spec/index.ts` | `src/spec/kaizen-costs.ts` |
| mandao | CLI | `run-close.ts`: `sessions` in `run kaizen`, `sessionCut` in `run kaizen-compare` | `src/cli/run-close.ts` |
| mandao | Content | `core/commands/close.md` step 1 and `core/templates/shared/close/kaizen.md` `## Sessions`; then `mandao sync` | `core/commands/close.md` |

## Risks and impacts

- `input`: settings files and transcripts are untrusted local JSON; bad lines are skipped, never thrown.
- `pii`: transcripts hold prompts; only counts and durations are read out (D3).
- `public-api`: `run kaizen` and `run kaizen-compare` JSON gain fields; additive only.
- Measures depend on transcripts still on the machine; missing ones are named (S-2.3).

## Constitution Impact

None.

## Product Impact

None.

## Module Docs Impact

- ADR 0036 addendum: "`doctor` reports the TTL in effect" becomes true; close may move it from proposed
  to accepted with the maintainer's approval.
- ADR 0038 Consequences: Kaizen now measures the constants (`run kaizen-compare` → `sessionCut`).

## Consistency Check

No findings. `mandao run trace` output is in [Evidence](#e3).

## Open items

- ASSUMPTION(source: ADR 0036 addendum): the default is reported, not detected ([story](story.md#assumptions)).
- ASSUMPTION(source: inference from the Claude Code docs, [P3](#p3)): a TTL variable in a settings `env`
  block beats the settings key, and an ignored value in a higher file does not let a lower file's value
  take over. Confirm: dev.
- ASSUMPTION(source: ADR 0038 Measurements): a "turn" there meant a main-session API response (D3).
  Confirm: maintainer.

## Clarifications

None.

## Premise Ledger

<a id="p1"></a>
### P1 — Each Claude Code cost record names its session and time (High)
If false: D2 cannot find a spec's sessions; the spec would need the session ids recorded first.
Evidence: [E1](#e1).

<a id="p2"></a>
### P2 — Task commits carry a `Mandao-Task` trailer and a commit time (High)
If false: task windows need another boundary (D2), and T2's design changes. Evidence: [E2](#e2).

<a id="p3"></a>
### P3 — Claude Code resolves the TTL in the order of D1 (High)
If false: the finding may name the wrong source and value; S-1.2, S-1.3 and S-1.5 change. UNVERIFIED by
a run (a search of the installed binary hit its time limit). Source: the Claude Code docs as checked by
the maintainer's delegate on 2026-10-20 ([E4](#e4)), which state the six steps, the valid values, the
versions, the file precedence and the default. Two points are inferences, not stated: that an `env`
block TTL beats the settings key, and that an ignored value in a higher file does not fall back to a
lower file.

<a id="p4"></a>
### P4 — Transcript lines carry `type`, `timestamp`, `isSidechain`, `isMeta` and `message.id` (High)
If false: D3's turn and pause definitions change. UNVERIFIED: transcripts live outside the worktree;
a read of this session's transcript (not a recorded run) shows prompts as `user` lines with string
content and tool results as `tool_result` blocks.

## Tasks

Four tasks, in [tasks.md](tasks.md).

## Evidence

<a id="e1"></a>
<details><summary>E1 — P1: cost records name their session (`_log/premises/P1.md`)</summary>

```
specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/_log/costs.yml: 4 records, 4 with session; commands: specify implement verify close
```

Only MDO-0007 has `costs.yml` today, so `kaizen-compare` will report `insufficient data (minimum 3)`
until MDO-0008 and one more spec record theirs.
</details>

<a id="e2"></a>
<details><summary>E2 — P2: task commits carry trailer and time (`_log/premises/P2.md`)</summary>

```
2026-10-20T15:58:36-05:00 MDO-0007 T2
2026-10-20T15:54:33-05:00 MDO-0007 T1
2026-10-20T14:47:24-05:00 MDO-0006 T3
```
</details>

<a id="e3"></a>
<details><summary>E3 — `mandao run trace MDO-0008`</summary>

Every AC and clause maps to FR-1…FR-4, a scenario and a task; no findings, no issues (after S-1.3's
clause got its own `AND IT MUST` line). `mandao run diagram MDO-0008`: optional.
</details>

<a id="e4"></a>
<details><summary>E4 — P3: Claude Code docs, checked 2026-10-20 by the maintainer's delegate</summary>

- https://code.claude.com/docs/en/prompt-caching#choose-the-ttl-yourself
- https://code.claude.com/docs/en/settings-reference#promptcachettl
- https://code.claude.com/docs/en/env-vars
- https://code.claude.com/docs/en/settings#settings-precedence

What they state is distilled into [D1](#d1). The inferences are named in [P3](#p3).
</details>
