---
schema_version: 1
tracker: none
type: story
id: MDO-0010
url:
parent:
projects: [mandao]
lane: normal
status: approved
sources:
  - { ref: "_log/start.yml", kind: request, date: 2026-10-21 }
  - { ref: "maintainer conversation during MDO-0009 and the kaizen-in-the-readme quick (scope items 1, 2, 3, 5; split into MDO-0010/0011/0012)", kind: conversation, date: 2026-10-21 }
  - { ref: "src/cli/approve.ts (NEXT map), src/cli/session-advice.ts (newSessionCommand), core/commands/*.md (`Next:` lines)", kind: code, date: 2026-10-21 }
  - { ref: "src/cli/start.ts, docs/decisions/0037-mandao-start-and-worktree-setup.md", kind: code, date: 2026-10-21 }
  - { ref: "docs/decisions/0038-session-cut-at-task-boundaries.md", kind: decision, date: 2026-10-21 }
  - { ref: "src/cli/run-cost.ts, src/scripts/quick-log.ts; MDO-0009 session record of 20.10 USD logged against a quick", kind: code, date: 2026-10-21 }
  - { ref: "code.claude.com/docs/en/interactive-mode (/clear); opencode.ai/docs/tui (/new); code.visualstudio.com/docs/copilot/copilot-vscode-features (new chat); antigravity.google/docs (search result only)", kind: docs, date: 2026-10-21 }
  - { ref: "docs/constitution/critical-flows.md", kind: constitution, date: 2026-10-21 }
  - { ref: "maintainer rule change: running the next command on a draft spec is the approval, except open items or a spec changed since the last summary", kind: conversation, date: 2026-10-21 }
---

# Guide the next step and keep the session in the spec worktree

When a person finishes any Mandao command, they are told which command fits next given the spec's
state, and why. In Claude Code they never have to open another session or tab to keep working in the
spec's worktree. A quick change records only what that quick cost.

## Who

The developer or tech lead who drives a spec through Mandao's commands in Claude Code or another
harness, and the maintainer who reads the cost of each piece of work.

## Problem

- **The suggested next step ignores the state.** At the end of a command, Mandao suggests the next
  one from a fixed map, for example `spec → /mandao-implement` in `approve`. It suggests the same thing
  when a decision is still open or when the spec changed after approval. During MDO-0009 the closes kept
  pointing at `mandao approve` and `/mandao-implement`.
- **The session stays behind when a worktree is created.** When `mandao start` or the quick fallback
  creates the spec's worktree, the session stays in the main checkout and the person is told to open a
  new session there. In Claude Code the session can move into the worktree itself.
- **Starting fresh means opening another session.** When the session-cut rule (ADR 0038) recommends
  starting fresh, the advice is to open a new session in another tab. Every harness has a way to start a
  new conversation in place.
- **A quick's cost includes everything before it.** A quick change records the cost of the whole
  session. On 2026-10-21 a README quick logged 20.10 USD, almost all of it MDO-0009's earlier work. Its
  cost record was also written after the quick's commit, so it was never committed.

## Value

- Fewer wrong turns: the person runs the command that fits, not the one a fixed map names.
- No context switch: the work continues in the same session and the same window.
- Costs that can be trusted per piece of work, so Kaizen compares like with like.

## Scope

- **Next step by state** at the end of every command (story, specify, clarify, tasks, implement,
  verify, close, quick) and of `mandao approve`. It names the possible next commands, the recommended
  one and why.
- **The session moves into the worktree by itself** in Claude Code when `mandao start`, the specify
  fallback or the quick fallback creates it, and carries on. Other harnesses print the command to resume
  there.
- **A fresh session in place.** When a cut is recommended, the advice is the harness's own "new
  conversation" action followed by the next command, kept inside the worktree. Opening another session
  is only the fallback.
- **The quick's own cost**, from the quick's start, committed with the quick.
- **Running the next command approves**, with a recorded note. It stops for one question only when
  something is open or the spec changed after the last summary. This is the maintainer's rule of
  2026-10-21, and it replaces "running the next command is not an approval" in `implement.md`.

## Out of scope

- **Delivery and cleanup** (MDO-0012): push, PR, merge, promotion, and leaving the worktree after the
  merge. The automatic exit is the mirror of this story's automatic entry, and belongs there.
- **Spec folder structure** (MDO-0011): the folder fixed by depth, the 6-file `_log/`, and the whole
  close in `close-summary.md`.
- Changing the session-cut thresholds themselves (ADR 0038). Kaizen recommends; the maintainer decides.
- Running any recommended command on the person's behalf.

## Acceptance criteria

### AC-1 — The next step fits the spec's state
critical: false

- **GIVEN** a command or `mandao approve` has just finished for a spec
- **WHEN** it reports its result
- **THEN** it lists the commands that can follow, marks the recommended one, and says in one line why,
  from the spec's state: open decisions or critical `OPEN`s, depth, verify findings, pending commits,
  and whether the spec changed after its approval. For example, an open decision leads to
  `/mandao-clarify`, an approved standard spec to `/mandao-tasks`, and an approved lite spec to
  `/mandao-implement`.
- **BUT it must NOT** recommend a command the spec's state does not allow, such as implement while a
  critical `OPEN` remains (C1)
- **BUT it must NOT** run the next command itself, or record an approval or a status change: it only
  recommends, and the person runs the command (C2)

### AC-2 — The session moves into the new worktree
critical: true

- **GIVEN** a Claude Code session in which `mandao start`, the specify fallback or the quick fallback
  creates a spec's worktree
- **WHEN** the worktree is ready
- **THEN** the session continues inside that worktree with the same conversation, and the command goes
  on without asking for a new session
- **AND IT MUST**, in a harness that cannot move its session, print the exact command that resumes
  there, as today (C1)
- **BUT it must NOT** leave the person in the main checkout with no step to follow when the move fails;
  it then prints the resume command (C2)

### AC-3 — Starting fresh happens in place
critical: true

- **GIVEN** the session-cut rule recommends a fresh session for a spec
- **WHEN** the command reports it
- **THEN** the advice is the active harness's own "new conversation" action (in Claude Code, `/clear`)
  followed by the next command, and that next command still runs inside the spec's worktree
- **AND IT MUST**, if the fresh conversation would not be inside the worktree, give first the step back
  into it (C1)
- **AND IT MUST** fall back to the command that opens a new session in the worktree when the harness
  has no in-place action (C2)

### AC-4 — A quick records only its own cost
critical: false

- **GIVEN** a session that did other work before a quick change, for example a spec's implement
- **WHEN** the quick records its cost
- **THEN** the record holds only what was spent from the quick's start, and it is committed with the
  quick
- **BUT it must NOT** count work already recorded for another spec or command in the same session (C1)

### AC-5 — Running the next command approves the spec, unless something is open
critical: true

- **GIVEN** a spec in `draft`, and the person runs the command that follows its approval (for example
  `/mandao-implement` on a lite spec, or `/mandao-tasks` on a standard design)
- **WHEN** the command starts
- **THEN** it records the approval as given by running the command ("aprobado al correr
  /mandao-<command>"), sets the documents to `approved`, and goes on without asking
- **AND IT MUST** ask one question first, and record nothing until it is answered, when something is
  open: a pending decision, a `CONFLICT`, a `[NEEDS CLARIFICATION]` or a critical Consistency Check
  finding (C1)
- **AND IT MUST** ask one question first when the spec changed after the last summary shown to the
  person (C2)
- **BUT it must NOT** record an approval while a critical `OPEN` remains, whatever is answered (C3)

## Dependencies

- ADR 0037 (`mandao start` and the worktree setup) and ADR 0038 (session cut): both change here.
- The harness's ability to move a session into an existing worktree. Claude Code can do this; it was
  used in this conversation.
- The `/mandao-start` → story → specify flow, unchanged apart from the suggested next step.

## UX references

The terminal reports of the commands, and the "Next:" lines in `core/commands/*.md`. No new screens.

## Data involved

- The spec's state as Mandao already records it: story and spec status, approvals, open items, the
  execution log, and the verify verdict.
- The session cost records (`costs.yml`) and the quick log.

No personal or business data.

<a id="assumptions"></a>
## Assumptions and open questions

- `OPEN` (not critical): does a Claude Code session stay in the worktree after `/clear`, including a
  worktree entered mid-session? Claude Code's documentation says `/clear` "starts a new session" and
  says nothing about the working directory. It must be tested with a real run in specify, and AC-3/C1
  covers the case where it does not stay. Source: code.claude.com/docs/en/interactive-mode, read
  2026-10-21.
- `ASSUMPTION`: the "new conversation" action of each harness is:
  - Codex `/new` (confirmed by the maintainer);
  - OpenCode `/new`, alias `/clear` (opencode.ai/docs/tui);
  - Copilot in VS Code "Start a new chat", ⌘N / Ctrl+N or `/clear` (code.visualstudio.com docs);
  - Antigravity ⌘N / Ctrl+N, CLI `/clear` (search result only; the page has not been read).

  Each is to be re-checked against official docs as a premise in specify.
- `ASSUMPTION`: the quick's start can be told apart in the session record, for example by when the
  quick's command began. If it cannot, the quick records its cost as not measured instead of the session
  total.
- `ASSUMPTION`: moving the session uses the harness's own mechanism. Mandao detects the harness and
  hands it the worktree path; it does not reimplement session handling.
