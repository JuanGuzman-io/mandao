---
schema_version: 1
tracker: none
type: story
id: MDO-0008
url:
parent:
projects: [mandao]
lane: normal
status: closed
sources:
  - { ref: "user request (/mandao-specify input) and specs/MDO-0008-…/_log/start.yml", kind: chat, date: 2026-10-20 }
  - { ref: "docs/decisions/0038-session-cut-at-task-boundaries.md (Measurements, Consequences)", kind: repo, date: 2026-10-20 }
  - { ref: "docs/decisions/0036-cost-conscious-by-design.md:59-79 (Addendum — cache duration)", kind: repo, date: 2026-10-20 }
  - { ref: "src/scripts/session-cut.ts:13-17 (TURNS_PER_TASK, TURNS_AFTER_TASKS, RELOAD_TOKENS)", kind: code, date: 2026-10-20 }
  - { ref: "Claude Code docs: prompt-caching#choose-the-ttl-yourself, settings-reference#promptcachettl, env-vars, settings#settings-precedence (checked by the maintainer's delegate)", kind: doc, date: 2026-10-20 }
---

# Measure what the session-cut rule needs

A maintainer needs Mandao to show, from real sessions, the numbers the session-cut rule depends on:
the prompt-cache duration Claude Code uses, how long people pause between turns, and how many turns
a task, verify and close take. It is done when `doctor` reports the cache duration and Kaizen shows the
measurements and proposes new constants when they differ from the ones in the code.

## Who
The Mandao maintainer who tunes the cost rules (ADR 0036, ADR 0038), and any team running Mandao on
Claude Code that wants to know whether its cache duration fits how it works.

## Problem
The session-cut rule uses three constants measured by hand on MDO-0004 to MDO-0007 (turns per task,
turns after the tasks, tokens a new session reads back). Nobody re-measures them, so they drift from
reality without anyone noticing. The cache-duration recommendation (5 minutes) rests on one sample of
pauses, and no command tells a user which duration their Claude Code actually uses.

## Value
The cut advice stays accurate as specs and habits change, and the cache-duration choice can be
revisited with each spec's data instead of a one-off measurement.

## Scope
- `mandao doctor` reports the prompt-cache duration Claude Code uses for the main conversation and for
  subagents, where it comes from, and the ADR 0036 recommendation.
- From a spec's Claude Code session transcripts: the pauses between the user's turns, and the main-session
  turns per task, for verify and for close.
- Kaizen shows those measurements for a spec.
- Kaizen compares them, across specs, with the session-cut constants and with the estimates logged in
  `_log/session-cuts.md`, and proposes new values when they differ.

## Out of scope
- Writing any Claude Code setting (ADR 0036: Mandao recommends, never writes user settings).
- Changing the constants automatically; a person applies a proposal.
- Proposing a different cache duration from the pauses (they are shown; the choice stays human).
- Reading managed (organization) settings and `--settings`; they rank higher, and `doctor` says it did
  not read them.
- Harnesses other than Claude Code: they expose no transcript with cache usage (ADR 0038).

## Acceptance criteria

### AC-1 — doctor reports the cache duration in use
critical: false

- **GIVEN** a workspace whose harnesses include Claude Code
- **WHEN** the maintainer runs `mandao doctor`
- **THEN** an info finding gives the cache duration for the main conversation and for subagents, where
  each comes from (environment, project or user settings, or the default when unset), and the ADR 0036
  recommendation
- **BUT it must NOT** write or change any Claude Code settings file (C1)
- **AND IT MUST** say "not 5m or 1h" for a value Claude Code ignores, instead of reporting it as in effect (C2)

### AC-2 — pauses and turns are measured from the spec's sessions
critical: false

- **GIVEN** a spec whose commands ran in Claude Code and recorded their sessions
- **WHEN** its sessions are measured
- **THEN** the result has the pauses before each user turn and the main-session turns of each task, of
  verify and of close
- **BUT it must NOT** count a session whose transcript is missing as zero turns or zero pauses (C1)
- **BUT it must NOT** count subagent turns as main-session turns (C2)

### AC-3 — Kaizen shows the measurements
critical: false

- **GIVEN** a spec with measured sessions
- **WHEN** Kaizen runs for it at close
- **THEN** the Kaizen output and the spec's Kaizen document show the pauses and the turns per task, verify and close

### AC-4 — Kaizen compares with the rule and proposes new values
critical: false

- **GIVEN** specs with measured sessions
- **WHEN** Kaizen compares across specs
- **THEN** it shows each session-cut constant next to its measured value and each logged estimate of turns
  left next to the turns that followed, and proposes a new value for a constant whose measurement differs
- **BUT it must NOT** propose a value from fewer specs than the minimum it states (C1)
- **BUT it must NOT** change the constants itself (C2)

## Dependencies
- ADR 0038 cut advice and its log `_log/session-cuts.md` (MDO-0007 follow-up, merged).
- Cost records with session ids in `_log/costs.yml` (ADR 0036).

## UX references
None: CLI output (`doctor` findings, `mandao run kaizen` JSON) and the Kaizen document.

## Data involved
Local Claude Code transcripts and settings files on the maintainer's machine, read only. Measurements
keep counts and durations, never prompt text.

<a id="assumptions"></a>
## Assumptions and open questions
- ASSUMPTION(source: ADR 0036 addendum): an unset duration is reported as the documented default
  (1h main and 5m subagents on a subscription within plan usage; 5m otherwise), without guessing the
  account type. Confirm: maintainer.
- ASSUMPTION(source: inference from the Claude Code docs): a TTL variable in a settings `env` block
  beats the settings key, and an ignored value in a higher settings file does not let a lower file's
  value take over. The rest of the order is documented. Confirm: dev ([spec.md](spec.md#p3)).
