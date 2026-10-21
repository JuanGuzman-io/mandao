---
schema_version: 1
spec: MDO-0011-one-fixed-layout-for-every-spec-folder
depth: standard
projects: [mandao]
status: approved
---

# Requirements — One fixed layout for every spec folder

A spec folder at layout version 2 holds a fixed file set per depth. Its log has six committed files, and
its close is whole in `close-summary.md`. `mandao run layout` checks this and close refuses a mismatch.
Version 1 specs are read as they are, and MDO-0008 to MDO-0010 move to version 2 without changing any
recorded value.

## Functional requirements

<a id="fr1"></a>
### FR-1 — The file set depends only on depth
Serves: AC-1, AC-1/C1, AC-1/C2
Projects: mandao

A version 2 spec holds:
- `story.md`, plus `tasks.md` from the tasks step on, and the root documents its stage has reached.
- At lite depth: `spec.md`.
- At standard and full depth: `requirements.md` and `design.md`.
- After verify: `verify-report.md`. After close: `close-summary.md`.

`quickstart.md` appears only when the spec has behavior a user or PO can see, `data-model.md` only when
data changes, and `contract/` only for several projects. Tasks are read only from `tasks.md`.

#### S-1.1 — One lite task still gets tasks.md
- **Given** a lite version 2 spec with one task
- **When** the tasks step writes it
- **Then** the task is in `tasks.md`, and `spec.md` has no `## Tasks`

#### S-1.2 — Four tasks change nothing
- **Given** a lite version 2 spec whose tasks grow from 3 to 4
- **When** the layout is checked
- **Then** the file set is the same as with 3
- **BUT it must NOT** report "more than 3 go to tasks.md", nor read tasks from `spec.md` (C2)

#### S-1.3 — Conditionals by kind of content
- **Given** a spec with visible behavior, and another one with a data change
- **When** specify writes them
- **Then** the first gets `quickstart.md`, the second `data-model.md`, and neither file appears otherwise (C1)

<a id="fr2"></a>
### FR-2 — `mandao run layout` checks the folder
Serves: AC-2, AC-2/C1
Projects: mandao

`mandao run layout <ID>` compares the folder with the manifest for its depth, layout version and stage.
It returns `{ version, depth, stage, missing[], unexpected[], ok }`. `/mandao-close` runs it first and
stops when `ok` is false. The layout version is the story's `schema_version`: 2 for new specs, 1 for
older ones.

#### S-2.1 — A missing and an extra file
- **Given** a verified standard version 2 spec without `design.md` and with a stray `notes.md`
- **When** `mandao run layout` runs
- **Then** `missing` names `design.md`, `unexpected` names `notes.md`, and `ok` is false

#### S-2.2 — Close refuses a mismatch
- **Given** the same spec
- **When** `mandao run status <ID> closed` runs
- **Then** it is not allowed, and the problem names the layout findings

#### S-2.3 — An older spec in its own format
- **Given** MDO-0001, a version 1 spec with execution.md and progress.yml at its root
- **When** `mandao run layout` runs
- **Then** `ok` is true against the version 1 manifest, which lists the files version 1 allowed (C1)

<a id="fr3"></a>
### FR-3 — Six committed log files
Serves: AC-3, AC-3/C1, AC-3/C2, AC-3/C3
Projects: mandao

A version 2 spec's `_log/` holds only these six files:
- `state.yml`: the start request, baseline result, checkpoint, red tests, pending commits, approvals with their hashes, and session-cut estimates.
- `execution.md`: one row per event.
- `reviews.md`: verdict and findings per task and attempt.
- `gates.md`: a status table per attempt, with output only for failing gates, limited to the task's files and capped. A gate that is not installed is reported once.
- `premises.md`: per premise, the claim, the command, its exit code and an excerpt.
- `costs.yml`: with a per-role cumulative.

Everything else goes to `.mandao/cache/<ID>/`, which git ignores: full gate output, Reviewer packs, probes and their scratch, mutation diffs, full-run notes, discrepancies, and the integrity hashes.

#### S-3.1 — Attempts do not add files
- **Given** a version 2 spec whose 3 tasks ran 2 attempts each, with gates, reviews, a mutation and 2 premises
- **When** the task commits are made
- **Then** `git ls-files <spec>/_log` lists exactly the six files

#### S-3.2 — The bulk stays local
- **Given** the same spec
- **When** a Reviewer pack and full gate output are written
- **Then** they are under `.mandao/cache/<ID>/`, and `git status` does not show them (C1)

#### S-3.3 — Commands still read the log
- **Given** the same spec
- **When** resume, trace, verify-plan, implement-summary, kaizen, kaizen-compare, next and the integrity check run
- **Then** each gives the answer it gives on the same history in version 1 (C2)

#### S-3.4 — Nothing that matters leaves the commit
- **Given** a FAIL review, a failing gate, an approval with `--words`, and a premise run
- **When** they are committed
- **Then** `reviews.md` holds the verdict and findings, `gates.md` the failing gate's output for the task's files, `state.yml` the approval with words and hashes, and `premises.md` the exit code and the excerpt (C3)

#### S-3.5 — Approvals in the timeline, stored once
- **Given** a spec with approvals in `state.yml` and events in `execution.md`
- **When** `mandao run status <ID>`, without a target status, or `implement-summary` runs
- **Then** the timeline shows the approvals in date order among the execution rows
- **BUT it must NOT** write an approval row into `execution.md` (C1)

<a id="fr4"></a>
### FR-4 — The whole close in `close-summary.md`
Serves: AC-4, AC-4/C1, AC-4/C2
Projects: mandao

For a version 2 spec, `close-summary.md` holds the frontmatter record and these sections:
- `Outcome`: one row per AC from `release-status`.
- `For the PO`, in `language.business`.
- `For developers`, in `language.technical`.
- `Kaizen`.
- `Delivery`.

`run close-summary` updates the record and the `Outcome` and `Delivery` sections, and keeps the prose
sections as written. `--closed` adds the spec's line to `docs/CHANGELOG.md`. Approved Kaizen lessons go
to `docs/kaizen/lessons.md`. `publish-plan` takes its text from `For the PO`.

#### S-4.1 — One document
- **Given** a verified version 2 spec
- **When** it is closed
- **Then** `close-summary.md` has the five sections, `docs/CHANGELOG.md` has one line with the ID, title, type and a link to the folder, and neither `docs/releases/<ID>/` nor `docs/kaizen/<ID>.md` exists (C2)

#### S-4.2 — Languages per section
- **Given** `language.business: es` and `language.technical: en`
- **When** close writes the summary
- **Then** `For the PO` is in Spanish and `For developers` in English (C1)

#### S-4.3 — No empty parts
- **Given** a close with no environment and no publication
- **When** `run close-summary` writes
- **Then** no empty field (`Release: —`) and no empty section appears (C2)

#### S-4.4 — Rewriting keeps the prose
- **Given** a `close-summary.md` whose `For the PO` was written by the agent
- **When** `run close-summary --closed` runs again
- **Then** that section is unchanged, and `docs/CHANGELOG.md` still has a single line for the spec

<a id="fr5"></a>
### FR-5 — Close commits what it wrote and was approved
Serves: AC-5, AC-5/C1
Projects: mandao

During close, each approved edit outside the spec folder is recorded with `run close-summary --applied <path>`.
`commit-spec <ID> close` then stages:
- the spec folder;
- `docs/CHANGELOG.md` and `docs/kaizen/lessons.md`;
- the constitution;
- the recorded paths;
- the files regenerated from them: lock-listed outputs, `docs/commands/` and `docs/diagrams/` that changed.

#### S-5.1 — A Standardize edit is in the close commit
- **Given** a close that applied an approved edit to `core/commands/tasks.md`, ran `mandao sync` and the diagrams
- **When** `commit-spec <ID> close` runs
- **Then** the one commit holds the spec, the changelog line, `core/commands/tasks.md`, the regenerated command files, the lock and the diagram sources

#### S-5.2 — An unrelated change stays out
- **Given** an uncommitted change to `src/cli/start.ts` that close did not record
- **When** the same call runs
- **Then** the file is not committed, and the result names it as left out (C1)

<a id="fr6"></a>
### FR-6 — Drift does not apply to lite specs
Serves: AC-6, AC-6/C1
Projects: mandao

`mandao run diagram-drift <ID>` returns `{ applicable: false, reason }` for a lite spec. A standard or
full spec without a stamped graph is still an error.

#### S-6.1 — Lite
- **Given** a lite spec at close
- **When** `diagram-drift` runs
- **Then** it exits 0 with `applicable: false` and the reason "lite specs have no diagram"

#### S-6.2 — Standard is unchanged
- **Given** a standard spec with a stamped graph, and another without one
- **When** `diagram-drift` runs
- **Then** the first reports its drift as today, and the second fails as today (C1)

<a id="fr7"></a>
### FR-7 — MDO-0008, MDO-0009 and MDO-0010 move to version 2
Serves: AC-7, AC-7/C1, AC-7/C2
Projects: mandao

`mandao run migrate-spec <ID>` converts a closed version 1 spec to version 2:
- tasks to `tasks.md`;
- the log to the six files;
- `docs/releases/<ID>/` and `docs/kaizen/<ID>.md` into `close-summary.md`, plus its `docs/CHANGELOG.md` line.

It captures the answers of trace, kaizen, implement-summary and release-status before the move and
compares them after. It writes nothing when any answer differs.

#### S-7.1 — The three specs pass
- **Given** MDO-0008, MDO-0009 and MDO-0010 on this branch
- **When** each is migrated
- **Then** `mandao run layout` gives `ok: true` for each, at version 2

#### S-7.2 — Same answers
- **Given** each spec before and after the move
- **When** trace, kaizen, implement-summary and release-status run
- **Then** the JSON answers are equal (C1)

#### S-7.3 — Recorded values do not change
- **Given** a migrated spec
- **When** its verdicts, cost entries, approvals and task commit links are compared with version 1
- **Then** they are identical
- **BUT it must NOT** write anything when a comparison differs (C2)

<a id="fr8"></a>
### FR-8 — `docs/spec-anatomy.md`
Serves: AC-1, AC-2
Projects: mandao

`docs/spec-anatomy.md` lists, per depth, which files exist, what each one is for, when a conditional
file appears, and the six log files. The README links it, and `mandao run layout` and the page are
built from the same manifest.

#### S-8.1 — The page matches the manifest
- **Given** the manifest in code
- **When** the content test renders the page's table
- **Then** it lists the same files per depth

## Non-functional requirements

### NFR-1 — The committed log stays small
Serves: AC-3

MDO-0010 after migration has 6 files and at most 2,000 lines in `_log/`. Today it has 39 files and 18,699 lines. Its review texts and other logs total about 1,000 lines without the packs and the full gate output. Measured with `git ls-files <spec>/_log | wc -l` and `wc -l`.

### NFR-2 — The layout check is fast
Serves: AC-2

`mandao run layout` finishes in under 300 ms on this repository's largest spec. Measured with `time node dist/cli.js run layout MDO-0010`.

## AC → FR matrix

| AC | Clause | FR / scenario | Status |
|---|---|---|---|
| AC-1 | main | FR-1 / S-1.1 | covered |
| AC-1 | C1: conditionals by kind | FR-1 / S-1.3 | covered |
| AC-1 | C2: never by count | FR-1 / S-1.2 | covered |
| AC-2 | main | FR-2 / S-2.1, S-2.2 | covered |
| AC-2 | C1: older specs in their format | FR-2 / S-2.3 | covered |
| AC-3 | main | FR-3 / S-3.1 | covered |
| AC-3 | C1: bulk in the local cache | FR-3 / S-3.2 | covered |
| AC-3 | C2: commands keep working | FR-3 / S-3.3, S-3.5 | covered |
| AC-3 | C3: nothing that matters lost | FR-3 / S-3.4 | covered |
| AC-4 | main | FR-4 / S-4.1, S-4.4 | covered |
| AC-4 | C1: languages per section | FR-4 / S-4.2 | covered |
| AC-4 | C2: no releases/kaizen files, no empty parts | FR-4 / S-4.1, S-4.3 | covered |
| AC-5 | main | FR-5 / S-5.1 | covered |
| AC-5 | C1: nothing unrecorded | FR-5 / S-5.2 | covered |
| AC-6 | main | FR-6 / S-6.1 | covered |
| AC-6 | C1: standard and full unchanged | FR-6 / S-6.2 | covered |
| AC-7 | main | FR-7 / S-7.1 | covered |
| AC-7 | C1: same answers | FR-7 / S-7.2 | covered |
| AC-7 | C2: recorded values unchanged | FR-7 / S-7.3 | covered |

## Clarifications

### C-1 — Where approvals live (2026-10-21)
- **Answer:** in `state.yml`, as a structured list with their hashes, `shown` rows and words. `mandao run status <ID>` and the implement summary show them in the timeline when they read it, without storing them twice.
- **Answered by:** maintainer, in the specify session.
- **Effect:** FR-3, S-3.5. This replaces "approvals become `APPROVED` rows of `execution.md`" from the request.

### C-2 — The `cumulative` block of costs.yml (2026-10-21)
- **Answer:** keep one cumulative per role, and drop the per-model lines, which can be derived.
- **Answered by:** maintainer.
- **Effect:** FR-3. The cross-spec session baseline of MDO-0010 D5 keeps working.

### C-3 — Session-cut estimates (2026-10-21)
- **Answer:** in `state.yml`, not in the cache, so Kaizen keeps measuring the estimate error across closed specs.
- **Answered by:** maintainer.
- **Effect:** FR-3.

### C-4 — Lite specs, close commit, migration (2026-10-21)
- **Answer:** lite has no diagram, and drift says "not applicable". Close commits all it wrote and was approved. MDO-0008 to MDO-0010 are migrated.
- **Answered by:** maintainer, in the story session.
- **Effect:** FR-5, FR-6, FR-7.

## Consistency Check

| ID | Type | Finding | Severity | Owner | Status |
|---|---|---|---|---|---|
| CC-1 | RULE | `doc-lite.md` says a lite spec is "one session" with tasks inline, and `spec-docs.md` calls `close-summary.md` "generated record and links". FR-1 and FR-4 change both rules. | normal | dev | resolved 2026-10-21: design D2 and D5 update both rules |
| CC-2 | RULE | MDO-0010 D5 needs a cumulative per session; the request dropped it. | normal | maintainer | resolved 2026-10-21: C-2 keeps it per role |

## Open items

- `OPEN` (not critical, owner: maintainer, from the story): a lite spec has no diagram, so its tracker publication would carry only the `For the PO` text. There is no tracker today.
- `ASSUMPTION`: the cache is deleted at close unless `logs.level: full` is set in `.mandao/config.yml`. A worktree's cache also goes when the worktree is removed.
