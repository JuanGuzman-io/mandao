---
schema_version: 1
spec: MDO-0010-guide-the-next-step-and-keep-the-session-in-the
depth: lite
projects: [mandao]
status: approved
---

# Spec — Guide the next step and keep the session in the spec worktree

One pure decision, `nextStep(spec)`, reads the spec's state and names the commands that can follow, the
recommended one and why. Every command and `mandao approve` end with it. A per-harness session table
says whether the session can enter a worktree and what its "new conversation" action is. In Claude Code
the commands enter the worktree they create, and a cut is advised as `/clear` plus the next command. A
quick measures its cost against the session's last record in any spec, and commits it with the quick.

## Functional requirements

<a id="fr1"></a>
### FR-1 — The next step comes from the spec's state
Serves: AC-1, AC-1/C1, AC-1/C2
Projects: mandao

`mandao run next <ID>` returns the possible next commands, the recommended one and a one-line reason.

The answer comes from:
- the story and spec status;
- critical `OPEN`s and `[NEEDS CLARIFICATION]`;
- depth (lite when `spec.md` exists);
- open tasks and pending commits;
- the verify verdict;
- whether an approved document changed after its approval.

`mandao approve` returns the same answer instead of its fixed map. Every command's report ends with it.
It never runs a command.

#### S-1.1 — An open decision leads to clarify
- **Given** an approved standard spec whose `requirements.md` still holds `[NEEDS CLARIFICATION]`
- **When** `mandao run next` runs
- **Then** it recommends `/mandao-clarify`, gives the item as the reason, and does not offer `/mandao-tasks` or `/mandao-implement`

#### S-1.2 — Approved specs by depth
- **Given** an approved lite spec, and separately an approved standard spec with no open item
- **When** `mandao run next` runs
- **Then** the lite spec recommends `/mandao-implement` and the standard spec recommends `/mandao-tasks`

#### S-1.3 — The state does not allow implement
- **Given** a spec with a critical `OPEN`, or a draft spec
- **When** `mandao run next` or `mandao approve` reports
- **Then** neither recommends `/mandao-implement`
- **BUT it must NOT** list implement among the options (C1)

#### S-1.4 — A document changed after its approval
- **Given** a spec whose `spec.md` changed after `mandao approve <ID> spec` recorded its hash
- **When** `mandao run next` runs
- **Then** it recommends approving the spec again, and names the document that changed
- **AND IT MUST** make no claim when the approval has no recorded hash (approvals made before this spec) (C1)

#### S-1.5 — Later stages
- **Given** a spec with tasks left, then one with pending commits, then an `in-progress` spec with every task done, then a `verified` spec
- **When** `mandao run next` runs
- **Then** it recommends, in order:
  - `/mandao-implement`;
  - `mandao run commit <ID>`;
  - `/mandao-verify`;
  - `/mandao-close`.

#### S-1.6 — A recommendation, never an action
- **Given** any state
- **When** `mandao run next` or `mandao approve` reports
- **Then** the result is data only: no command runs, and `run next` records no approval
- **BUT it must NOT** record an approval or a status change: only `approve` does, and FR-5 says when (C1)

<a id="fr2"></a>
### FR-2 — The session enters the worktree a command creates
Serves: AC-2, AC-2/C1, AC-2/C2
Projects: mandao

The harness session table says, per harness, whether a session can enter an existing worktree. In Claude
Code, when `mandao start` (run by the agent), the specify fallback or the quick fallback creates a
worktree, the command enters it with `EnterWorktree` and the worktree path, and continues. When a later
command finds itself outside the spec's worktree, it enters it the same way. Every other harness, or a
failed move, prints the exact resume command.

#### S-2.1 — Claude Code enters and continues
- **Given** the rendered `/mandao-specify`, `/mandao-quick` and `/mandao-implement` for `claude`
- **When** they reach the step after the worktree exists, or `run where` says the session is outside it
- **Then** they tell the agent to enter the worktree with `EnterWorktree` and the path, and to continue without a new session

#### S-2.2 — Other harnesses print the command
- **Given** the same commands rendered for `codex`, `opencode`, `copilot` and `antigravity`
- **When** they reach that step
- **Then** they print the exact resume command from the harness table, and mention no `EnterWorktree`
- **AND IT MUST** keep a printable resume command for every harness (C1)

#### S-2.3 — A failed move still leaves a step
- **Given** the Claude Code rendering
- **When** `EnterWorktree` is refused or fails
- **Then** the command prints the resume command and stops
- **BUT it must NOT** go on working in the main checkout (C1)

<a id="fr3"></a>
### FR-3 — A cut is advised as a new conversation in place
Serves: AC-3, AC-3/C1, AC-3/C2
Projects: mandao

The session advice of `mandao approve`, `mandao run step` and `implement-summary` comes from the harness
session table for the **active** harness, not the first configured one. It gives:
- the harness's new-conversation action (Claude Code `/clear`, Codex `/new`, OpenCode `/new`, Copilot
  "New chat" ⌘N / Ctrl+N, Antigravity ⌘N / Ctrl+N);
- then the next command;
- the command that opens a new session in the worktree, as the fallback.

The command's `run where` check (FR-2) brings a conversation outside the worktree back in before work starts.

#### S-3.1 — Claude Code gets `/clear`
- **Given** a cut recommended in a Claude Code session for spec MDO-0001, with `/mandao-implement` next
- **When** `mandao approve` or `implement-summary` reports
- **Then** the advice reads `/clear`, then `/mandao-implement MDO-0001`, with the worktree command as the fallback

#### S-3.2 — Each harness gets its own action
- **Given** the active harness is `codex`, `opencode`, `copilot` or `antigravity`
- **When** the advice is built
- **Then** it names that harness's action from the table
- **AND IT MUST** give the open-session command when a harness has no in-place action (C2)

#### S-3.3 — Back into the worktree first
- **Given** a new conversation that starts outside the spec's worktree
- **When** the next command runs its `run where` check
- **Then** it enters the worktree (Claude Code) or prints the resume command (others) before any other step (C1)

<a id="fr4"></a>
### FR-4 — A quick records only its own cost, with the quick
Serves: AC-4, AC-4/C1
Projects: mandao

`mandao run cost <ref> --record` subtracts the session's latest `cumulative` found in **any**
`specs/*/_log/costs.yml` (and `specs/quick/_log/`), not only the file it writes. `/mandao-quick` records
its cost before `quick-log` and the commit, and the commit includes `specs/quick/_log/costs.yml`.

#### S-4.1 — Work recorded for a spec is not counted again
- **Given** a session whose earlier record for MDO-0009 holds `cumulative.main-session: 9.0`, and a transcript now at 9.5
- **When** the quick records its cost
- **Then** the quick's record is 0.5, not 9.5
- **BUT it must NOT** count what another spec's record already holds (C1)

#### S-4.2 — A session that starts with the quick
- **Given** a session with no earlier record anywhere
- **When** the quick records its cost
- **Then** the record is the whole session, which is the quick's own cost

#### S-4.3 — The record is committed with the quick
- **Given** the rendered `/mandao-quick`
- **When** its steps are read in order
- **Then** the cost record comes before `quick-log` and the commit, and the commit lists `specs/quick/_log/costs.yml`

<a id="fr5"></a>
### FR-5 — Running the command that follows an approval is the approval
Serves: AC-5, AC-5/C1, AC-5/C2, AC-5/C3
Projects: mandao

`/mandao-implement` on a lite draft spec, `/mandao-tasks` on a standard or full draft design, and
`/mandao-implement` on draft tasks first call `mandao approve <ID> <step> --by-running /mandao-<command>`.
- **Nothing open:** the call approves. `approvals.yml` records "approved by running /mandao-<command>",
  with the date and the person, and the command goes on.
- **Something open, or a changed document:** the call approves nothing and returns `ask` with the
  reason. The command asks one question.

Open means:
- a pending decision;
- a `CONFLICT`;
- a `[NEEDS CLARIFICATION]`;
- a critical Consistency Check finding;
- an approvable document whose hash differs from the one recorded when its last summary was shown.

`specify`, `tasks` and `clarify` record that summary with `mandao run next <ID> --shown`. A written
approval next to the command ("apruebo", "approve") is passed as `--words "<text>"`, and recorded
verbatim.

#### S-5.1 — Nothing open: approve and go on
- **Given** a lite draft spec with no open item, and its summary recorded as shown
- **When** `mandao approve <ID> spec --by-running /mandao-implement` runs
- **Then** story, spec and tasks become `approved`, `approvals.yml` records "approved by running /mandao-implement" with the date and the person, and the result says `go`

#### S-5.2 — Something open: one question, nothing recorded
- **Given** the same spec, with a `CONFLICT` row, a `[NEEDS CLARIFICATION]` or a pending decision
- **When** the same call runs
- **Then** the result is `ask` with the item, the documents stay `draft`, and `approvals.yml` is unchanged (C1)

#### S-5.3 — A document changed after its summary was shown
- **Given** a draft spec whose `spec.md` changed after `mandao run next <ID> --shown`
- **When** the same call runs
- **Then** the result is `ask`, naming `spec.md`, and nothing is recorded (C2)

#### S-5.4 — A critical OPEN is never approved
- **Given** a draft spec with a critical `OPEN`
- **When** the call runs, with or without `--words`
- **Then** it refuses, as `approve` does today, whatever the answer (C3)

#### S-5.5 — Written approval words are recorded verbatim
- **Given** the person wrote "apruebo" next to the command
- **When** `mandao approve <ID> spec --by-running /mandao-implement --words "apruebo"` runs
- **Then** `approvals.yml` records the words "apruebo" exactly, with the command, the date and the person

## AC → FR matrix

| AC | Clause | FR / scenario | Status |
|---|---|---|---|
| AC-1 | main | FR-1 / S-1.1, S-1.2, S-1.4, S-1.5 | covered |
| AC-1 | C1: never a command the state does not allow | FR-1 / S-1.3 | covered |
| AC-1 | C2: never runs it nor treats it as approval | FR-1 / S-1.6 | covered |
| AC-2 | main | FR-2 / S-2.1 | covered |
| AC-2 | C1: other harnesses print the resume command | FR-2 / S-2.2 | covered |
| AC-2 | C2: a failed move prints the resume command | FR-2 / S-2.3 | covered |
| AC-3 | main | FR-3 / S-3.1, S-3.2 | covered |
| AC-3 | C1: back into the worktree first | FR-3 / S-3.3 | covered |
| AC-3 | C2: fallback without an in-place action | FR-3 / S-3.2 | covered |
| AC-4 | main | FR-4 / S-4.1, S-4.2, S-4.3 | covered |
| AC-4 | C1: never counts another spec's recorded work | FR-4 / S-4.1 | covered |
| AC-5 | main | FR-5 / S-5.1, S-5.5 | covered |
| AC-5 | C1: something open asks one question | FR-5 / S-5.2 | covered |
| AC-5 | C2: changed since the last summary asks | FR-5 / S-5.3 | covered |
| AC-5 | C3: never approved with a critical OPEN | FR-5 / S-5.4 | covered |

<a id="decisions"></a>
## Decisions

<a id="d1"></a>
### D1 — One pure decision `nextStep(spec)` in `src/spec/next.ts`, behind `mandao run next`

- **Why:** the state is already read by `readSpec`, `blockingMarkers`, `commitState` and `checkTransition`. One function in the `loop.ts` style (a structured answer, no IO) keeps every command and `approve` consistent.
- **"Changed since approval":** `mandao approve` adds an optional `sha256` of each approved document to its `approvals.yml` row, using `util/hash.ts`. An older row without a hash yields no claim (S-1.4/C1).
- **Rejected:**
  - Keeping `NEXT` in `approve.ts` and the fixed `Next:` lines, because they ignore the state.
  - Detecting changes from git commit times, because a spec edited and approved in one commit cannot be told apart.
  - Each command's agent deciding from its own reading, because the result is not deterministic and costs tokens.

<a id="d2"></a>
### D2 — A harness session table in the adapters: `session: { enterWorktree, newConversation, resume }`

- **Why:** the facts differ per harness and are needed by start, the session advice and the rendered commands.
- **Values:**

  | Harness | Enter a worktree | New conversation |
  |---|---|---|
  | claude | yes | `/clear` |
  | codex | no | `/new` |
  | opencode | no | `/new` |
  | copilot | no | ⌘N / Ctrl+N "New chat" |
  | antigravity | no | ⌘N / Ctrl+N |

  `resume` is today's `openCommand`.
- **Active harness:** taken from `--harness` or `CLAUDE_CODE_SESSION_ID`. This replaces `config.harnesses[0]` in `newSessionCommand`.
- **Rejected:** a `mandao:if` block per harness in every command, because the facts would be copied into many files.

<a id="d3"></a>
### D3 — Claude Code enters the worktree with `EnterWorktree`; `run where` re-enters it

- **Why:** this conversation used `EnterWorktree` with an existing path twice, and the session kept its conversation (P1 covers the hooks).
- **ADR 0037 is amended:** in Claude Code, entering is the default after a worktree is created, and the `cd … && claude --resume` text becomes the fallback.
- **Permission prompt:** when the harness asks for approval to enter, that prompt is the single confirmation.
- **Where it applies:**
  - The command content gets a `mandao:if harness=claude` step after worktree creation in specify and quick.
  - The §0 `run where` check of implement, verify and close enters the worktree instead of stopping. In the other harnesses it stops with the resume command, as today.
- **Rejected:** launching a new `claude` process with `start --open`, because it is another session; it stays as an option.

<a id="d4"></a>
### D4 — The cut advice names the in-place action first

- **Why:** a new conversation in place keeps the window and the worktree.
- **Robustness:** whether `/clear` keeps the working directory is unverified (P2). D3's re-entry in `run where` makes the advice safe either way (S-3.3).
- **Advice shape:** `{ action, then, fallback }`. ADR 0038 gets an addendum.
- **Rejected:** always advising a new tab, because it switches context; waiting for P2 before deciding, because D3 already covers it.

<a id="d5"></a>
### D5 — The cost delta uses the session's latest record in any spec; quick records before committing

- **Why:** `sessionDelta` only searched the file being written. The quick file had no earlier record for the session, so the delta was the whole session (P4). `readCostEntries` already reads every spec's `costs.yml`.
- **Quick order:** `quick.md` §6 moves the cost record before `quick-log`. The commit stages `specs/quick/_log/costs.yml`.
- **Rejected:** prompt timestamps in the transcript, which are more complex and only needed when no record exists; that case is the quick's own cost anyway (S-4.2).

<a id="d6"></a>
### D6 — `approve --by-running` decides; the command only relays the question

- **Why:** the rule must hold in every harness and be testable. The agent's own reading is neither.
- **Mechanism:**
  - `approve` already refuses critical OPENs (`blockers()`). It now also reads:
    - `CONFLICT` and pending-decision markers;
    - the Consistency Check's critical rows;
    - the D1 hashes against the last `shown` record.
  - `mandao run next --shown` writes that record into `approvals.yml` as a `shown` row with the hash of each approvable document.
  - `--by-running` and `--words` go into the approval row.
- **It replaces** the rule MDO-0009 added to `implement.md` §0: "running the next command is not one". A new ADR 0040 amends it, and `MANDAO-DESIGN.md` §5 ("Human in the loop") is updated.
- **Rejected:**
  - The agent judging "changed since the summary" from memory, because it is not checkable and is lost after `/clear`.
  - Asking every time, because the person already said yes by running the command.
  - Approving silently despite open items, because that is what went wrong at the start of MDO-0009.

## Changes by project and module

| Project | Module | Change | Exemplar file |
|---|---|---|---|
| mandao | Spec domain (`src/spec/`) | `next.ts`: `nextStep(spec)` (D1); approvals row gets optional `sha256` | `src/spec/loop.ts`, `src/spec/approvals.ts` |
| mandao | CLI (`src/cli/`) | `run next`; `approve` uses `nextStep` and hashes the approved docs; session advice from the table for the active harness (D2, D4) | `src/cli/run-spec.ts`, `src/cli/approve.ts`, `src/cli/session-advice.ts` |
| mandao | Adapters (`src/adapters/`) | the `session` entry per harness (D2); `openCommand` moves behind it | `src/adapters/types.ts`, `src/adapters/claude.ts` |
| mandao | Scripts / Spec domain | `sessionDelta` baseline across specs (D5) | `src/spec/costs.ts`, `src/scripts/session-turns.ts` (`readCostEntries`) |
| mandao | Content (`core/`) | `Next:` lines call `{{script:next}}`; the specify and quick fallbacks and the §0 `run where` enter the worktree in Claude Code (D3); the cut advice text (D4); quick §6 order (D5) | `core/commands/implement.md` (existing `mandao:if harness=codex` block) |
| mandao | CLI / Spec domain | `approve --by-running <command> [--words <text>]` returns `go` or `ask`; `run next --shown` records the shown hashes (D6) | `src/cli/approve.ts`, `src/spec/approvals.ts` |
| mandao | Docs | ADR 0037 amended, ADR 0038 addendum, new ADR 0040 (approval by running the next command), `MANDAO-DESIGN.md` §5, `docs/cli.md` (`run next`, `approve --by-running`), `docs/command-format.md` | `docs/decisions/0039-rules-enforced-by-scripts.md` |

## Risks and impacts

- `public-api`: a new `mandao run next` JSON, and an optional `sha256` in `approvals.yml`. Both are additive.
- **Critical flow** "start creates an isolated spec worktree and resolves the next session": its tests (`start.test.ts`, `branching.test.ts`, `shadow.test.ts`) must keep passing. `approve.test.ts` changes its `next` expectation.
- **Diagrams** are derived from `flow:` frontmatter, which stays as is. `npm run diagrams` is needed after the command content changes (MDO-0009 Kaizen line 2).
- **Permission prompt:** `EnterWorktree` can prompt for approval. That prompt is one confirmation, not a failure. When it is refused, S-2.3 applies.

## Constitution Impact

Proposals; /mandao-close applies them with approval.

- `critical-flows.md`: the "Human approval refuses critical OPENs and records its provenance" row adds
  "running the next command approves, except open items or a changed document" (`approve.test.ts`).
- `critical-flows.md`: the "start creates an isolated spec worktree and resolves the next session" row
  adds "in Claude Code the session enters the worktree it creates". Suites: `start.test.ts` and the
  content render test.
- `architecture.md`: the adapters own the harness session table (D2).

## Product Impact

- `product.md` capability map: "Recommends the next command from the spec's state", implemented.

## Module Docs Impact

- `src/spec/AGENTS.md`: `next.ts` is the state-to-next-command decision; it returns data and never acts.
- `src/adapters/AGENTS.md`: the `session` entry per harness and where its facts come from.

## Consistency Check

| ID | Type | Finding | Severity | Owner | Status |
|---|---|---|---|---|---|
| CC-1 | CONFLICT | The approved ADR 0037 says "`EnterWorktree` as a convenience, never the base of the flow", but this spec's D3 makes it the default in Claude Code. | normal | maintainer | resolved 2026-10-21: the maintainer chose to amend ADR 0037 (D3) when approving |
| CC-2 | PREMISE | ADR 0037 says Claude Code hooks "keep pointing at the main checkout" after `EnterWorktree`; P1 tests it. | normal | dev | see [P1](#p1) |

## Open items

- `OPEN` (from the story, not critical): `/clear` and the working directory, P2. D4 is safe either way.
- **The double count is not limited to quick.** This spec's own first record
  (`mandao run cost MDO-0010 --record --command specify`, 2026-10-21) logged 27.08 USD, because the
  session had already recorded MDO-0009 in another file. D5's baseline across specs fixes the first
  record of any spec. The wrong record stays in `_log/costs.yml` as evidence; the log is never edited
  by hand.
- `ASSUMPTION`: the new-conversation actions in D2 for Copilot and Antigravity come from docs and
  search results, not runs. They are advice text only, and wrong text costs one step.

## Clarifications

## Premise Ledger

<a id="p1"></a>
### P1 — After `EnterWorktree`, Claude Code hooks see the worktree as the project (High)

`.claude/settings.json` runs `mandao hook graph-guard` with `$CLAUDE_PROJECT_DIR`. If that still names
the main checkout, the hooks read the main checkout's graph and config: D3 then needs a note in the ADR,
and the hooks need to resolve the project from the working directory instead.

`UNVERIFIED`. The recorded run (`_log/premises/P1.md`) shows that the session's shell is in the worktree:
`pwd` and `git rev-parse --show-toplevel` both name it. But `CLAUDE_PROJECT_DIR` is `<unset>` in the
shell. It exists only in the hook's own process, so a shell command cannot prove what the hook sees.
`mandao hook graph-guard` resolves `root` from its process and hands stdin to `graphify hook-guard`
(`src/cli/hook.ts:41-53`). T3 adds a test that runs the hook with a worktree `cwd`.

<a id="p2"></a>
### P2 — After `/clear`, a Claude Code session stays in the worktree it entered (High)

If false, D4's advice still works through D3's re-entry (S-3.3). It cannot be proven by a command from
inside a session: `/clear` is an interactive harness action. `UNVERIFIED` until the maintainer runs it
once (the check is in the quickstart).

<a id="p3"></a>
### P3 — `EnterWorktree` keeps the conversation when entering an existing worktree path (High)

Seen twice in the session that wrote this spec, once for the quick worktree and once for this
worktree. It is a harness tool, not a shell command, so a recorded run is not possible. `UNVERIFIED` as
a recorded premise, and observed in this session.

<a id="p4"></a>
### P4 — A session's earlier cost records live in another spec's `costs.yml` (High)

If false, D5 would change nothing and the double count would have another cause.

Verified by the recorded run in `_log/premises/P4.md`: `specs/MDO-0009-…/_log/costs.yml` holds 3 records for
session `bcd55241-…`, the last with `main-session: 6.869611`. The quick's file had none, so the quick
was charged the whole main session (10.95) instead of about 4.08.

## Tasks

The four tasks are in [tasks.md](tasks.md).

## Evidence
