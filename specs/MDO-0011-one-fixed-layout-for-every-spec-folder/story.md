---
schema_version: 1
tracker: none
type: story
id: MDO-0011
url:
parent:
projects: [mandao]
lane: normal
status: approved
sources:
  - { ref: "_log/start.yml", kind: request, date: 2026-10-21 }
  - { ref: "maintainer conversation during MDO-0009 and MDO-0010 (scope items 6, 7, 8; split into MDO-0010/0011/0012)", kind: conversation, date: 2026-10-21 }
  - { ref: "maintainer answers in the MDO-0011 story session: lite has no diagram, close commits all it writes, migrate MDO-0008..0010", kind: conversation, date: 2026-10-21 }
  - { ref: "core/templates/shared/rules/doc-lite.md:11-22, core/commands/tasks.md:32, core/commands/implement.md:15 (inline tasks at 3 or fewer)", kind: code, date: 2026-10-21 }
  - { ref: "specs/MDO-0008…, MDO-0009…, MDO-0010… folder listings; git ls-files of MDO-0010 _log/", kind: code, date: 2026-10-21 }
  - { ref: "core/commands/close.md (docs/kaizen, docs/releases), src/cli/run-close.ts:241, src/schemas/config.ts:141", kind: code, date: 2026-10-21 }
  - { ref: "docs/releases/MDO-0010/technical.md (diagram drift not measured on a lite spec); docs/kaizen/MDO-0010.md; commit 8f5cb07 (Standardize committed apart)", kind: code, date: 2026-10-21 }
  - { ref: "docs/constitution/critical-flows.md", kind: constitution, date: 2026-10-21 }
---

# One fixed layout for every spec folder

A person who opens any spec folder finds the same files for the same depth, a short log that does not
grow with every retry, and the whole close in one document inside the spec. We will know it is done
when every new spec, and MDO-0008 to MDO-0010, match a published layout that a check enforces.

## Who

The developer or tech lead who reads and reviews a spec, the product owner who reads its outcome, and
the maintainer who compares specs in Kaizen.

## Problem

- **The folder depends on a count.** At lite depth, 3 tasks or fewer go inline in `spec.md` and a
  fourth creates `tasks.md`. MDO-0008 and MDO-0010 have `tasks.md`; MDO-0009 does not. Both kinds are
  lite story specs, so a reader cannot know where to look.
- **The log is most of the spec.** MDO-0010's `_log/` commits 39 files and 18,699 lines; reviews are
  14,883 of them and gate output 3,381. Each retry adds files. MDO-0009 had 32 files and 8,816 lines.
- **The close is scattered.** Each close writes `docs/releases/<ID>/` and `docs/kaizen/<ID>.md`, while
  the spec's `close-summary.md` is a list of links with empty fields (`Release: —`). There are 8 folders
  and 8 files under `docs/` for 8 specs, and no `docs/CHANGELOG.md`.
- **The close does not commit all it writes.** At MDO-0010's close the approved Kaizen edit to
  `core/commands/tasks.md` and the regenerated files were left out and needed a second commit
  (`8f5cb07`).
- **Lite specs break drift.** `diagram-drift` stops with an error on a lite spec, which has no
  structured graph, so MDO-0010's drift was "not measured".

## Value

- Anyone finds any fact in a spec without knowing its history.
- Reviews read a short, stable log; the full output stays on the machine that produced it.
- One document tells the whole story of a closed spec; `docs/` holds only what accumulates.
- Kaizen and release status read one format, so specs compare like with like.

## Scope

- **Folder by depth only.** A fixed file set per depth: lite and standard/full. `tasks.md` always
  exists. `quickstart.md` and `data-model.md` appear only by kind of content. A check reports missing or
  extra files, and close refuses a folder that does not match.
- **Six fixed log files**, committed, that do not grow per attempt. Full gate output, Reviewer packs,
  probes and integrity data move outside git, under the spec's local cache.
- **The whole close in `close-summary.md`:** outcome per criterion, notes for the PO, notes for
  developers, Kaizen and delivery. `docs/` gains one line per spec in `docs/CHANGELOG.md` and at most
  one Kaizen lesson index.
- **Close commits everything it wrote**, including approved edits outside the spec folder and the
  files regenerated from them.
- **Lite specs have no diagram**, and drift reports "not applicable" for them.
- **Migration of MDO-0008, MDO-0009 and MDO-0010** to the new folder, log and close. Older specs are
  read as they are.
- `docs/spec-anatomy.md`: which file exists at each depth and what it is for, linked from the README.

## Out of scope

- **Delivery** (MDO-0012): push, PR, merge, promotion, cleanup, the `Delivery` record written before the
  merge, and the environment reached derived from git. This story only gives `close-summary.md` its
  `Delivery` section.
- Migrating MDO-0001 to MDO-0007.
- Changing what Kaizen measures, or the session-cut constants.

## Acceptance criteria

### AC-1 — The folder depends only on depth
critical: false

- **GIVEN** a new spec at lite, standard or full depth
- **WHEN** specify and tasks have written it
- **THEN** it holds exactly the files of its depth, with `tasks.md` even for a single task
- **AND IT MUST** add `quickstart.md` only for behavior a user or PO can see, and `data-model.md` only
  for data changes (C1)
- **BUT it must NOT** place tasks or any other file according to how many tasks, requirements or
  scenarios there are (C2)

### AC-2 — A check enforces the layout
critical: true

- **GIVEN** a spec folder and the published layout for its depth
- **WHEN** the layout check runs, or close starts
- **THEN** the check names every missing and every unexpected file, and close refuses a folder that
  does not match
- **AND IT MUST** accept an older spec in its own format, recognised by its `schema_version` (C1)

### AC-3 — The log has six fixed files
critical: true

- **GIVEN** a spec whose tasks went through several attempts, gates, reviews and premises
- **WHEN** its log is committed
- **THEN** it holds only the six fixed files, and their number does not grow with attempts
- **AND IT MUST** keep the full gate output, Reviewer packs, probes and integrity data in the spec's
  local cache, outside git (C1)
- **AND IT MUST** keep resume, trace, verify, Kaizen and the integrity check working on it (C2)
- **BUT it must NOT** lose a verdict, a failing gate's relevant output, an approval or a premise result
  from the committed log (C3)

### AC-4 — The whole close lives in the spec
critical: true

- **GIVEN** a verified spec
- **WHEN** it is closed
- **THEN** `close-summary.md` holds the outcome per criterion, the notes for the PO, the notes for
  developers, the Kaizen and a `Delivery` section, and `docs/CHANGELOG.md` gains the spec's line
- **AND IT MUST** write the PO notes in the business language and the developer notes in the technical
  language (C1)
- **BUT it must NOT** write `docs/releases/<ID>/` or `docs/kaizen/<ID>.md`, nor write empty sections or
  fields (C2)

### AC-5 — Close commits everything it wrote
critical: false

- **GIVEN** a close that applied approved edits outside the spec folder, for example to the
  constitution or to command content, and regenerated files from them
- **WHEN** close commits
- **THEN** one commit holds the spec folder, the changelog line, the approved edits and the regenerated
  files
- **BUT it must NOT** commit a file the close did not write or that the person did not approve (C1)

### AC-6 — Lite specs have no diagram
critical: true

- **GIVEN** a lite spec at close
- **WHEN** drift is checked
- **THEN** it reports "not applicable" and the close goes on
- **AND IT MUST** keep checking drift for standard and full specs as today (C1)

### AC-7 — The recent specs match the layout
critical: false

- **GIVEN** MDO-0008, MDO-0009 and MDO-0010, already closed
- **WHEN** they are migrated
- **THEN** each one passes the layout check, with its tasks in `tasks.md`, its six-file log and its
  whole close in `close-summary.md`
- **AND IT MUST** keep trace, Kaizen, implement-summary and release status giving the same answers as
  before the move (C1)
- **BUT it must NOT** change a verdict, a cost, an approval or a commit link in the move (C2)

## Dependencies

- MDO-0010, closed and merged (`e0b45ab`): next-step advice reads the spec folder.
- MDO-0012 depends on this story for the `Delivery` section and the changelog line.
- Critical flows: "Script-owned logs record outside edits and preserve task commit evidence" and
  "Closure preserves publication identity and detects diagram drift" (`critical-flows.md`).

## UX references

The spec folder as a person browses it, `docs/spec-anatomy.md`, and the terminal report of close. No
new screens.

## Data involved

- Spec documents and the `_log/` evidence (execution, reviews, gates, premises, costs, approvals).
- Close documents and Kaizen measurements.

No personal or business data.

<a id="assumptions"></a>
## Assumptions and open questions

- The six log files, and where approvals, costs and estimates live, are settled in
  [requirements.md](requirements.md#clarifications) (C-1 to C-3).
- `ASSUMPTION` (source: maintainer request): the local cache is deleted at close unless the project
  asks to keep full logs. In a worktree it disappears with the worktree anyway.
- `ASSUMPTION` (source: maintainer answer): the migration of MDO-0008 to MDO-0010 moves content and
  never edits a recorded value. Where a recorded value cannot move without a script, the old file
  stays and the check accepts it, and that is reported.
- `OPEN` (not critical, owner: maintainer): tracker publication takes the `For the PO` text and the
  diagram. A lite spec has no diagram, so does it publish text only? There is no tracker today
  (`tracker: none`).
