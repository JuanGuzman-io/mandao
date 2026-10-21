---
schema_version: 1
spec: MDO-0011-one-fixed-layout-for-every-spec-folder
status: approved
---

# Tasks — One fixed layout for every spec folder

Seven tasks, in this order:
- T1 builds the layout manifest and its check.
- T2 makes `tasks.md` fixed.
- T3 and T4 build the version 2 log.
- T5 to T7 build the close changes.

Older specs are read as they are, and their migration is a separate spec ([C-5](requirements.md#clarifications)).

## Overview

### AC-2 — A check enforces the layout

- [x] T1 [AC-2] Mandao checks every spec folder against one layout per depth — `src/spec/layout.ts`

**Checkpoint:** `npx vitest run test/unit/layout.test.ts test/integration/layout.test.ts` passes (T1); this confirms AC-2 before the next group.

### AC-1 — The folder depends only on depth

- [x] T2 [AC-1] Every spec keeps its tasks in one place, whatever their number — `src/scripts/spec-log.ts`

**Checkpoint:** `npx vitest run test/integration/lite-spec.test.ts test/unit/content.test.ts test/unit/layout.test.ts` passes (T2); this confirms AC-1 before the next group.

### AC-3 — The log has six fixed files

- [ ] T3 [AC-3] One state file holds the start, progress, approvals and cut estimates — `src/spec/state.ts`
- [ ] T4 [AC-3] The committed log is six files; the bulk stays in a local cache — `src/scripts/spec-log.ts`

**Checkpoint:** `npx vitest run test/unit/state.test.ts test/integration/state-log.test.ts test/integration/approve.test.ts test/integration/costs.test.ts test/unit/next.test.ts` and `npx vitest run test/integration/log-v2.test.ts test/integration/spec-log.test.ts test/integration/ledger.test.ts test/integration/enforced-rules.test.ts test/integration/tdd.test.ts` passes (T3, T4); this confirms AC-3 before the next group.

### AC-4 — The whole close lives in the spec

- [ ] T5 [AC-4] The whole close is one document inside the spec — `src/spec/close-summary.ts`

**Checkpoint:** `npx vitest run test/integration/close.test.ts test/unit/release.test.ts test/integration/spec-log.test.ts test/unit/content.test.ts` passes (T5); this confirms AC-4 before the next group.

### AC-5 — Close commits everything it wrote

- [ ] T6 [AC-5] Close commits what it applied and what was regenerated from it — `src/cli/run-ledger.ts`

**Checkpoint:** `npx vitest run test/integration/close-commit.test.ts test/integration/mdo-0005-defects.test.ts` passes (T6); this confirms AC-5 before the next group.

### AC-6 — Lite specs have no diagram

- [ ] T7 [AC-6] [P] Drift says "not applicable" for lite specs — `src/cli/run-diagram.ts`

**Checkpoint:** `npx vitest run test/integration/close.test.ts` passes (T7); this confirms AC-6 before the next group.

## Details

### [x] T1 — Mandao checks every spec folder against one layout per depth

- **What:** the manifest, `mandao run layout` and the close gate ([D1](design.md#d1)), with `docs/spec-anatomy.md` built from the same manifest. ADR 0041 records layout version 2.
- **Done when:**
  - **S-2.1 and S-2.2 hold as processes:** `run layout` names a missing `design.md` and a stray `notes.md`, and `run status <ID> closed` refuses with those findings.
  - **S-2.3 and S-2.3/C1 hold:** MDO-0001 (version 1, root execution.md and progress.yml) gives `ok: true` against the version 1 manifest. The story parser reads an AC's `status: removed` (`traceability.md:12`), and `trace` and `release-status` skip it, so this spec's AC-7 gives no GAP.
  - **Version and depth:** the version is the story's `schema_version` (1 or 2; anything else is an error). The depth is the `depth:` frontmatter, or lite when it is missing and `spec.md` exists. It must NOT read a separate `layout:` key, nor infer the version from the files present.
  - **S-8.1 holds:** a test compares the `docs/spec-anatomy.md` table with the manifest, and the README links the page.
  - **NFR-2:** `time node dist/cli.js run layout MDO-0010` is under 300 ms, and the output goes in the task's evidence.

```yaml
project: mandao
kind: feat
tier: standard
files: [src/spec/layout.ts, src/spec/index.ts, src/spec/story.ts, src/spec/trace.ts, src/spec/release.ts, src/schemas/story.ts, src/scripts/spec.ts, src/cli/run-spec.ts, docs/spec-anatomy.md, README.md, docs/cli.md, docs/decisions/0041-spec-folder-layout-v2.md, docs/decisions/README.md, test/unit/layout.test.ts, test/integration/layout.test.ts]
exemplar: src/spec/next.ts
ac: [AC-2, AC-2/C1]
scenarios: [S-2.1, S-2.2, S-2.3, S-2.3/C1, S-8.1]
test_levels: { S-2.1: e2e, S-2.2: e2e, S-2.3: e2e, S-2.3/C1: unit, S-8.1: unit }
evidence: tdd
risk_tags: [public-api]
depends_on: []
parallel_safe: false
verify: npx vitest run test/unit/layout.test.ts test/integration/layout.test.ts
```

### [x] T2 — Every spec keeps its tasks in one place, whatever their number

- **What:** for version 2, `docPath('tasks')` no longer falls back to `spec.md`, and the inline-count rule applies only to version 1 ([D2](design.md#d2)). The content is updated to match, and new stories start at `schema_version: 2`.
- **Done when:**
  - **S-1.1 holds:** a lite version 2 spec with one task has it in `tasks.md`. `checkpoint`, `run tasks` and the `approve tasks` gate read and tick it there.
  - **S-1.2 and S-1.2/C2 hold:** 4 tasks give the same file set as 3. There is no "more than 3" issue, and `## Tasks` in `spec.md` is never read for version 2.
  - **Version 1 is read as it is:** `lite-spec.test.ts` keeps a version 1 case with inline tasks and the "more than 3" message. No new spec uses that format, and `/mandao-tasks` never writes tasks inside `spec.md`: run on an open version 1 spec, it warns and does not convert it, because migration goes through the backlog spec.
  - **Content:** `doc-lite.md`, `specify.md`, `tasks.md`, `implement.md` and `clarify.md` no longer say "3 tasks or fewer" or "inline", and the spec template has no `## Tasks`. It must NOT keep inline tasks for a single task.
  - **S-1.3 and S-1.3/C1 hold in the rendered specify:** `quickstart.md` only for visible behavior, `data-model.md` only for data changes. `mandao sync` and `npm run diagrams` run, and their files are committed with the task.

```yaml
project: mandao
kind: feat
tier: standard
files: [src/scripts/spec-log.ts, src/spec/task-index.ts, src/cli/run-spec.ts, src/cli/approve.ts, src/scripts/checkpoint.ts, core/templates/shared/rules/doc-lite.md, core/templates/shared/spec/spec.md, core/templates/shared/spec/story.md, core/commands/specify.md, core/commands/tasks.md, core/commands/implement.md, core/commands/clarify.md, src/spec/layout.ts, src/spec/AGENTS.md, test/integration/lite-spec.test.ts, test/unit/content.test.ts, test/unit/layout.test.ts]
exemplar: src/spec/task-index.ts
ac: [AC-1, AC-1/C1, AC-1/C2]
scenarios: [S-1.1, S-1.2, S-1.2/C2, S-1.3, S-1.3/C1]
test_levels: { S-1.1: e2e, S-1.2: unit, S-1.2/C2: unit, S-1.3: unit, S-1.3/C1: unit }
evidence: tdd
risk_tags: []
depends_on: [T1]
parallel_safe: false
verify: npx vitest run test/integration/lite-spec.test.ts test/unit/content.test.ts test/unit/layout.test.ts
```

### [x] T3 — One state file holds the start, progress, approvals and cut estimates

- **What:** `state.yml` replaces `start.yml`, `baseline.md`, `progress.yml`, `approvals.yml` and `session-cuts.md` for version 2, behind `logPath` and one zod schema ([D3](design.md#d3), C-1, C-3). `costs.yml` keeps one cumulative per role (C-2). `run status <ID>` without a target, and `implement-summary`, show the timeline.
- **Done when:**
  - **Writers:** `mandao start`, the baseline, checkpoint, red, approve, `run next --shown` and the cut estimates write their section of `state.yml` in a version 2 spec. They keep their version 1 file in a version 1 spec.
  - **S-3.5 and S-3.5/C1 hold:** the timeline lists approvals by date among the execution rows, and `execution.md` gets no approval row.
  - **Readers:** `next.ts` and `approve` read hashes and `shown` rows from `state.yml`, and their tests pass on both versions.
  - **Kaizen:** reads the cut estimates from `state.yml`.
  - **Costs:** a new `costs.yml` entry has `cumulative` per role and no `model:` lines, and the cross-spec baseline still gives 0.5 for S-4.1 of MDO-0010, from version 1 and version 2 records. It must NOT drop `cumulative`.

```yaml
project: mandao
kind: feat
tier: strong
files: [src/spec/state.ts, src/spec/progress.ts, src/spec/approvals.ts, src/spec/costs.ts, src/spec/timeline.ts, src/scripts/spec-log.ts, src/scripts/spec.ts, src/scripts/checkpoint.ts, src/scripts/session-cut.ts, src/scripts/session-turns.ts, src/cli/start.ts, src/cli/approve.ts, src/cli/run-ledger.ts, src/cli/run-red.ts, src/cli/run-spec.ts, src/cli/run-leader.ts, src/cli/run-cost.ts, test/unit/state.test.ts, test/integration/state-log.test.ts]
exemplar: src/spec/approvals.ts
ac: [AC-3, AC-3/C2, AC-3/C3]
scenarios: [S-3.5, S-3.5/C1]
test_levels: { S-3.5: e2e, S-3.5/C1: e2e }
evidence: tdd
risk_tags: [public-api]
depends_on: [T1]
parallel_safe: false
verify: npx vitest run test/unit/state.test.ts test/integration/state-log.test.ts test/integration/approve.test.ts test/integration/costs.test.ts test/unit/next.test.ts
```

### [x] T4 — The committed log is six files; the bulk stays in a local cache

- **What:** `reviews.md`, `gates.md` and `premises.md` replace their per-attempt files for version 2. Packs, full gate output, probes, mutations, discrepancies and integrity hashes go to `.mandao/cache/<ID>/`, which the managed ignore block lists. Full runs become a section of `execution.md` ([D3](design.md#d3), [D4](design.md#d4)).
- **Done when:**
  - **S-3.1 holds as a process:** a version 2 fixture with 3 tasks × 2 attempts, gates, reviews, a mutation and 2 premises has exactly the six files in `_log/` in its task commits. With a 10,000-line failing gate output and a 5,000-line pack per attempt, those files total at most 1,000 lines (NFR-1).
  - **S-3.2 and S-3.2/C1 hold:** the pack and the full gate output are under `.mandao/cache/<ID>/`, and `git status` is clean of them.
  - **S-3.4 and S-3.4/C3 hold:** `reviews.md` keeps the FAIL verdict and findings; `gates.md` keeps at most 40 lines of the failing gate's output, for the task's files only, and names a not-installed gate once; `premises.md` keeps the exit code and at most 20 lines.
  - **S-3.3 and S-3.3/C2 hold on both versions:** resume, trace, verify-plan, implement-summary, kaizen, kaizen-compare, next and the checkpoint's edit detection give equal answers on the same history.
  - **`logs.level`:** `full` keeps the cache at close, and the default `summary` deletes it. It must NOT commit the packs, compressed or not.

```yaml
project: mandao
kind: feat
tier: strong
files: [src/scripts/spec-log.ts, src/scripts/gates.ts, src/scripts/forced.ts, src/cli/run-leader.ts, src/cli/run-review.ts, src/cli/checkpoint-guards.ts, src/cli/run-premise.ts, src/cli/run-mutation.ts, src/writer/log-integrity.ts, src/engine/graph.ts, src/schemas/config.ts, src/cli/run-verify.ts, test/integration/log-v2.test.ts]
exemplar: src/scripts/spec-log.ts
ac: [AC-3, AC-3/C1, AC-3/C2, AC-3/C3]
scenarios: [S-3.1, S-3.2, S-3.2/C1, S-3.3, S-3.3/C2, S-3.4, S-3.4/C3]
test_levels: { S-3.1: e2e, S-3.2: e2e, S-3.2/C1: e2e, S-3.3: e2e, S-3.3/C2: e2e, S-3.4: e2e, S-3.4/C3: unit }
evidence: tdd
risk_tags: [public-api]
depends_on: [T3]
parallel_safe: false
verify: npx vitest run test/integration/log-v2.test.ts test/integration/spec-log.test.ts test/integration/ledger.test.ts test/integration/enforced-rules.test.ts test/integration/tdd.test.ts
```

### [x] T5 — The whole close is one document inside the spec

- **What:** `close-summary.md` becomes a record plus five sections, from a new template. `run close-summary` rewrites only Outcome and Delivery, `--closed` upserts the `docs/CHANGELOG.md` line, and approved lessons go to `docs/kaizen/lessons.md` ([D5](design.md#d5)). `publish-plan` reads `For the PO` for version 2. The close command and its rules change to match.
- **Done when:**
  - **S-4.1 and S-4.1/C2 hold as a process:** a closed version 2 spec has the five sections and one `docs/CHANGELOG.md` line, and no `docs/releases/<ID>/` or `docs/kaizen/<ID>.md`.
  - **S-4.2 and S-4.2/C1 hold** with `language.business: es`, from the rendered close command and the template.
  - **S-4.3 and S-4.3/C2 hold:** with no environment and no publication, no `—` field and no empty section is written.
  - **S-4.4 holds:** a second `--closed` keeps `For the PO` byte-identical and keeps one CHANGELOG line.
  - **Version 1 and rules:** version 1 keeps `release-notes.md` as the publish source (`release.test.ts` keeps its case), and `spec-docs.md` no longer says "generated record and links". It must NOT copy the notes into `docs/releases/`, nor generate the prose from code.

```yaml
project: mandao
kind: feat
tier: standard
files: [src/spec/close-summary.ts, src/cli/run-close.ts, src/scripts/publish.ts, core/templates/shared/close/close-summary.md, core/templates/shared/rules/doc-close.md, core/templates/shared/rules/spec-docs.md, core/commands/close.md, docs/CHANGELOG.md, docs/kaizen/lessons.md, test/integration/close.test.ts, test/unit/release.test.ts, test/integration/spec-log.test.ts, test/unit/content.test.ts]
exemplar: src/spec/close-summary.ts
ac: [AC-4, AC-4/C1, AC-4/C2]
scenarios: [S-4.1, S-4.1/C2, S-4.2, S-4.2/C1, S-4.3, S-4.3/C2, S-4.4]
test_levels: { S-4.1: e2e, S-4.1/C2: e2e, S-4.2: unit, S-4.2/C1: unit, S-4.3: unit, S-4.3/C2: unit, S-4.4: e2e }
evidence: tdd
risk_tags: [public-api]
depends_on: [T1]
parallel_safe: false
verify: npx vitest run test/integration/close.test.ts test/unit/release.test.ts test/integration/spec-log.test.ts test/unit/content.test.ts
```

### [x] T6 — Close commits what it applied and what was regenerated from it

- **What:** `run close-summary --applied <path>` records each approved edit. `commit-spec <ID> close` stages the spec, the changelog and lessons, the constitution, the module guides, the recorded paths and their regenerated files, and returns `leftOut` ([D6](design.md#d6)).
- **Done when:**
  - **S-5.1 holds as a process:** an applied edit to `core/commands/tasks.md`, followed by `mandao sync` and the diagrams, lands in one close commit. That commit holds the regenerated command files, the lock and the diagram sources.
  - **S-5.2 and S-5.2/C1 hold:** an unrecorded change to `src/cli/start.ts` stays uncommitted and is named in `leftOut`.
  - **Old test updated:** `mdo-0005-defects.test.ts` expects the new path list.
  - It must NOT use `git add -A`, nor ask the agent for a path list at commit time.

```yaml
project: mandao
kind: fix
tier: standard
files: [src/cli/run-ledger.ts, src/scripts/commits.ts, src/spec/close-summary.ts, src/cli/run-close.ts, core/commands/close.md, test/integration/mdo-0005-defects.test.ts, test/integration/close-commit.test.ts]
exemplar: src/cli/run-ledger.ts
ac: [AC-5, AC-5/C1]
scenarios: [S-5.1, S-5.2, S-5.2/C1]
test_levels: { S-5.1: e2e, S-5.2: e2e, S-5.2/C1: e2e }
evidence: tdd
risk_tags: []
depends_on: [T5]
parallel_safe: false
verify: npx vitest run test/integration/close-commit.test.ts test/integration/mdo-0005-defects.test.ts
```

### [ ] T7 — Drift says "not applicable" for lite specs

- **What:** `diagram-drift` returns `{ applicable: false, reason }` and exits 0 for a lite spec ([D7](design.md#d7)).
- **Done when:**
  - **S-6.1 holds as a process:** for a lite spec, the result is `applicable: false` with the reason "lite specs have no diagram".
  - **S-6.2 and S-6.2/C1 hold:** a stamped standard spec reports its drift as before, and an unstamped standard spec still fails.
  - It must NOT stamp a graph for lite specs.

```yaml
project: mandao
kind: fix
tier: fast
files: [src/cli/run-diagram.ts, test/integration/close.test.ts]
exemplar: src/cli/run-diagram.ts
ac: [AC-6, AC-6/C1]
scenarios: [S-6.1, S-6.2, S-6.2/C1]
test_levels: { S-6.1: e2e, S-6.2: e2e, S-6.2/C1: e2e }
evidence: tdd
risk_tags: []
depends_on: []
parallel_safe: true
verify: npx vitest run test/integration/close.test.ts
```
