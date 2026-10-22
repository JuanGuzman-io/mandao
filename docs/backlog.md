# Backlog

This is the single backlog for agreed work. The improvement program below is executed directly,
without opening Mandao specs or invoking Mandao workflow commands or skills. Historical MDO IDs
remain references, not instructions to create new specs. More detailed acceptance criteria in this
backlog remain binding. TDD, the independent Reviewer and quality gates remain mandatory.

## Phase execution policy

Each phase starts with a plan (files, approach and tests) and the maintainer's OK. Use one branch
`perf/<phase>` and one PR per phase, starting from updated `main`. Make small emoji + conventional
commits without spec trailers. Every behavior change has a test; new design decisions have a short
ADR, and `MANDAO-DESIGN.md`, `README.md` and affected docs are updated in the same phase.

After each change, run lint, typecheck and only impacted tests, with limited workers. Before push,
also build. Never run the full suite locally during this program, including through hooks or
`npm run check`; the full suite runs only in PR CI. Use `vitest related` or a local impacted-test
script, adding `check:local` only if needed. Do not merge failing CI: fix, push and wait for green.
Merge with a merge commit, never squash; then pull and build in the principal checkout. Mark the
phase complete here and report changes and measurement improvements where available.

Development CLI checks use `npm run build` and `node dist/cli.js …`, never the global install.
Temporary test repositories configure local `user.name` and `user.email`. Test fixtures and scripts
use `process.exitCode` rather than `process.exit()` when output may still be pending. Technical
implementation choices are made by the agent and recorded in the ADR; ask the maintainer about
scope, product behavior, security or irreversible actions.

| Phase / item | Historical reference | Depends on | Status |
|---|---|---|---|
| [0 — Documentation and backlog](#phase-0--documentation-and-backlog) | MDO-0011 / ADR 0040–0041 | current code and decisions | complete; see the design reconciliation audit |
| [1 — Security before beta](#security-quick-before-the-beta) | ADR 0043 | phase 0 | complete |
| [2 — Measurement](#phase-2--measurement) | latency audit / ADR 0044 | phase 0 | complete; PR #8 merged (`d17ba2c`) |
| [3 — Context and rework](#phase-3--context-and-rework) | latency audit | phase 0 | complete; PR #9 merged (`c315d3c`) |
| [3b — Gated design principles](#phase-3b--gated-design-principles) | Spec Kit Constitution Check | phase 3 | agreed, pending phase plan approval |
| [4 — Repetition and autonomy](#phase-4--repetition-and-autonomy) | launcher; commit manifest | phases 2–3 | in progress; plan approved |
| [5 — Script-enforced rules](#rules-enforced-by-script) | former rules spec | phases 2–4 | agreed, pending phase plan approval |
| [6 — Delivery](#mdo-0012--delivery-and-research) | delivery part of MDO-0012 | phases 2–5 | agreed, pending phase plan approval; no new spec |
| [7 — User CI security gates](#security-gates-from-the-users-ci) | former security-gates spec | phase 6 delivery | agreed, pending phase plan approval |
| [8 — Research in specify](#mdo-0012--delivery-and-research) | research part of MDO-0012 | phase 0 layout manifest | agreed, pending phase plan approval; no new spec |
| [9 — Large specs and parallel tasks](#mdo-0013--deliveries-inside-a-spec) | MDO-0013 and MDO-0014 | phases 2–6 | agreed, pending phase plan approval; no new specs |
| [10 — Version release notes](#phase-10--version-release-notes) | — | phase 6 release-status | agreed, pending phase plan approval |
| [Migrate MDO-0008 to MDO-0010](#migrate-mdo-0008-to-mdo-0010-to-layout-v2) | excluded from MDO-0011 | layout v2 proven on a real spec | agreed; outside phases 0–10, blocked on evidence |

## Phase 0 — Documentation and backlog

- [x] Compare every section of `MANDAO-DESIGN.md` against ADRs and current implementation; list
  decided/implemented but undocumented behavior and documented but obsolete behavior, with evidence.
- [x] Correct §13 using MDO-0011: depth-based fixed files, content-dependent conditional files,
  manifest, six `_log/` files including `state.yml`, local `.mandao/cache/<ID>/`, and `logs.level`;
  link `docs/spec-anatomy.md`.
- [x] Correct §18: Outcome, For the PO, For developers, Kaizen and Delivery in `close-summary.md`,
  one line per spec in `docs/CHANGELOG.md`; `docs/releases/` and `docs/kaizen/<ID>.md` are v1 only.
- [x] Correct principle 3 and §18.3: Archify is required; Mermaid only through explicit
  `diagrams.engine: mermaid`, never an automatic fallback.
- [x] Document ADR 0040 approval/autonomy and reversible technical decisions; list `research` as
  planned in §10; replace §24 MVP with current status and a link to this roadmap.
- [x] Mark DECIDED / PROPOSED / OPEN accurately, preserving decisions and escalating ambiguity.
- [x] Reconcile this single backlog with every requirement of phases 0–10 and their dependencies;
  preserve detailed historical acceptance criteria and keep migration outside the program.
- [x] Publish the existing latency diagnosis under `docs/audits/2026-10-latency.md` with portable
  links, and record design reconciliation in `docs/audits/2026-10-design-reconciliation.md`.

Evidence: [design reconciliation](audits/2026-10-design-reconciliation.md) and
[ADR 0042](decisions/0042-phased-improvements-and-local-validation.md). No product behavior or
latency improvement is claimed by this documentation phase.

## Phase 2 — Measurement

**Complete:** PR #8 merged into `main` (`d17ba2c`).

- [x] Script-stamped command, question/answer, agent and gate lifecycle events, with question classes.
- [x] Kaizen reports active, user-wait and agent-wait timing by command and spec; incomplete intervals remain unknown.
- [x] Cost instructions record before final/task commits, and historical duplicated snapshots have a corrected derived view.
- [x] Added ADR 0044 and updated the design, README, CLI docs and generated command/diagram docs.

Acceptance criteria:

- Scripts, not the model, record `command_start` / `command_end` and `asked` / `answered` events;
  question classes are product, external or technical.
- Kaizen separates active time, user wait and agent wait, and reports duration by command and spec,
  as well as cost. Unknown historical waiting time is not invented.
- Every command records cost before its final commit, including integrity changes, so commands do
  not leave `costs.yml` and `.integrity.json` dirty after completion.
- Historical duplicate costs have a corrected view without modifying original logs.

## Phase 3 — Context and rework

**Complete:** PR #9 merged into `main` (`c315d3c`). See [ADR 0045](decisions/0045-structured-review-context.md).

- [x] Reviewer diff uses canonical changed files; verified generated harness files and diagram SVGs
  have hash/origin receipts, with full-diff fallback on provenance mismatch.
- [x] Implementer brief includes task-linked decisions and rejected alternatives plus an AC/scenario ID
  checklist; task rules no longer duplicate rationale.
- [x] Reviewer findings use a validated status/severity schema; only open high/critical security
  findings block PASS.

Acceptance criteria:

- The Reviewer pack includes only canonical source diff. Generated harness copies and diagram SVGs
  are replaced by receipts containing hash and origin; a mismatch includes the full diff as today.
- The Implementer brief contains task-relevant design decisions and rejected alternatives, plus a
  scenario/clause checklist generated from their IDs. Resolve contradictory decision-repetition
  instructions in `core/commands/tasks.md` and `doc-tasks.md`.
- Reviewer findings have `status: open | resolved` and severity. The security guard blocks only
  open high/critical findings, never a regex over free text.

## Phase 3b — Gated design principles

**Agreed, pending phase plan approval. Modelled on Spec Kit.**

**Origin:** Spec Kit uses neither SOLID nor ACID, but its plan goes through a "Constitution Check"
with concrete questions and justifies exceptions in a "Complexity Tracking" table; its articles VII
and VIII (simplicity and anti-abstraction) stop unnecessary abstractions. AKILI-SPECS only mentions
SOLID as a reference inside the `software-architect` skill, and does not cover ACID.

1. **Principles in the constitution:** a section with the concrete version for the project's stack:
   SOLID (especially single responsibility and dependency inversion, and where they are required),
   ACID (which operations need a transaction, compensation across systems, isolation under
   concurrency) and **simplicity / anti-abstraction as the counterweight** (use the framework
   directly; no "just in case" abstractions; no interface with a single implementation without a
   reason). `constitution` proposes it from the detected stack and the user approves it.
2. **Precedence:** (1) the architecture the project declared in `architecture.md` (for example,
   hexagonal on NestJS); (2) the framework's conventions, taken from the stack skill (for example,
   modules, providers and dependency injection in Nest); (3) generic principles (SOLID) only where 1
   and 2 say nothing. The framework is never wrapped in custom abstractions that duplicate what it
   already solves. `constitution` records the chosen architecture and does not infer it from the
   framework (NestJS is modular with DI by default; hexagonal is a team decision).
3. **Principles gate in the design** (or in the spec, in lite): the model states in one line per
   principle whether it applies and how, or why not (for example, "SOLID/DIP: solved by Nest's DI
   per architecture.md").
4. **ACID is framework-independent:** when the spec writes data, it always declares which writes go
   together, the transaction with the stack's tool (for example, Prisma's `$transaction`), the
   compensation when it crosses systems (for example, database + auth provider), concurrency
   handling, and a partial-failure test for every multi-write operation.
5. **Justified exceptions** in a table: which principle is violated, why it is needed, and why the
   simpler alternative was rejected.
6. **The Reviewer** checks only the principles the design declared as applying: unjustified
   violations block; design suggestions outside them are advisory.

## Phase 4 — Repetition and autonomy

Acceptance criteria:

- [x] Gate receipts are reused by Implementer, Leader, pre-commit and verify only when the code tree,
  configuration, selected tests and tool versions are unchanged; invalidation is exact.
- [x] Session-cut suggestions persist a boundary ID and appear only once per boundary.
- [x] All users' commands let the agent resolve and record reversible technical questions covered by
  the constitution. Product, scope, security and external actions still reach the user.
- [x] `run commit` uses the reviewed, approved change manifest rather than just task file declarations.
  Undeclared and unreviewed changes stop the commit; no non-building state is committed. This
  supersedes the older task-list-only implementation proposal, preserving its safety requirement.
- [x] Implement [launcher version](#launcher-version), including the old-global/new-lock regression.
- [x] `init` installs missing Archify with confirmation and a pinned version; a Mandao script invokes it
  for every harness. Without it, `doctor` errors and required diagram steps stop with instructions,
  unless the user explicitly configures `diagrams.engine: mermaid`.

## Launcher version

**Phase 4; implemented (ADR 0046).**

`.mandao/bin/mandao.mjs` compares the version of the `mandao` it is about to run (local, global or
`npx`) with the one pinned in `mandao.lock`.

- On a mismatch it runs the pinned version (`npx mandao@<lock version>`); when it cannot, it warns
  and reports the mismatch.
- `mandao doctor` reports runner resolution and version problems.
- In the Mandao repository (dogfooding) it prefers the worktree's own build.
- A regression covers an old global install and a newer lock.

## MDO-0012 — Delivery and research

**Historical spec proposal, now executed without a new spec: delivery in phase 6, research in
phase 8. Both agreed, pending their phase plans.**

**Delivery after close or quick** (new ADR; updates `MANDAO-DESIGN.md`). "Never push" becomes "push
and PR only with confirmation".

1. **Target from `branching`:** env-branches → PR to the first branch of `promotion`; gitflow →
   `develop`; trunk or feature-branch → `main` (or `base`).
2. **No `branching`:** ask whether the merge goes to the worktree's base branch and save the answer
   in `config.yml`.
3. **One grouped confirmation:** push, PR to the target, merge when CI is green (merge commit, never
   squash), and cleanup. Options: everything / only push and PR / nothing. A failing CI is shown and
   never merged.
4. **Progressive promotion:** after a merge into an environment branch, offer the PR to the next
   environment in `promotion`, always confirmed. Never push to `protected` branches.
5. **Cleanup:** leave the worktree (automatic in Claude Code, a printed command elsewhere), update
   the base branch, delete the worktree and the local and remote branches. Uncommitted changes stop
   and ask. This mirrors the automatic move into the worktree at start.

6. **Pre-push checks:** `delivery.pre_push: impacted | full | none`, default `impacted`: lint,
   typecheck, build and impacted tests with limited workers and the resource guard. `full` runs only
   when explicitly configured by the user; the normal full suite belongs to PR CI, and merge always
   requires green CI. Report when the full suite was not run. Docker or `act` is optional, not default.
   Check npm/git lifecycle hooks as well: `prepublishOnly` currently invokes `npm run check`; ordinary
   phase delivery must not trigger a full local suite indirectly. Manual first publication is outside
   this program; preserve full validation in release CI.
7. If the project only has `main`, propose that delivery directly. Without `branching`, ask the base
   destination once and persist it; do not repeatedly ask.
8. `implement` automatically chains `verify` because there is no intervening human decision.

**Delivery record and `release-status`,** with no extra commit to a protected branch:

1. **Before the merge, in the same PR:** the delivery step writes the target and the PR URL into
   `close-summary.md` `Delivery` and adds the spec's line to `docs/CHANGELOG.md`.
2. **After the merge, derived from git:** `mandao run release-status <ID>` finds the `Refs: <ID>`
   commits, the branches that contain them and, with `branching.promotion`, the environment reached
   ("in dev", "released on main"), with merge date and SHA. Nothing is stored in a file.
3. `resume`, `doctor` and the README show where each spec is through `release-status`.
4. **Check:** MDO-0009 reports released on `main`, PR #1, merge `99451ba`.

Lessons from doing it by hand after MDO-0009: `mandao worktree clean` removes every merged worktree,
not only the current one; the worktree guard blocks `git -C <main checkout>`, so leave the worktree
first; `git branch -d` refuses a branch ahead of its upstream even when it is in `main`, so check
`merge-base --is-ancestor` first; `git worktree remove` needs `--force` for untracked files, so look
at them first.

**Research with sources in specify,** modelled on Spec Kit's phase 0 of `plan`:

- Each `[NEEDS RESEARCH]` becomes a research task delegated to a subagent ("Research <unknown> for
  <feature context>"), so the Leader's context stays light; the tasks can run in parallel.
- The result goes to `research.md`, present only when there was research: Decision, Rationale,
  Alternatives considered, and a **source with URL and date for every claim**. A claim without one
  is marked "unverified (model knowledge)".
- It is a gate: the design is not approved while a `[NEEDS RESEARCH]` is open.
- `research.md` joins the layout manifest (MDO-0011) as a conditional file.
- Research covers new libraries/patterns, version-dependent behavior and a framework's current
  structure. Every claim requires its own URL and date; without web search, mark it
  "unverified (model knowledge)", which cannot support high-impact decisions.
- `specify` consults the Skill Map skills relevant to the modules it changes.

## MDO-0013 — Deliveries inside a spec

**Phase 9; historical spec proposal, executed in this phase without opening a spec.**

Big specs split the execution, not the spec.

1. **Criterion before proposing separate specs** (story, specify and tasks rules): separate specs
   only when the parts have value on their own, ship independently and have independent AC. One
   story for the PO, or dependent AC, means one spec. The proposal states the criterion; the user
   decides.
2. **Deliveries in `tasks.md`:** tasks are grouped by delivery; each delivery declares the AC it
   meets end to end and depends only on earlier deliveries.
   - At the end of a delivery: a checkpoint, a partial verify of its AC, and optionally its own PR
     stacked on the previous one. `pr-plan` proposes the cut by delivery past the size thresholds.
   - The final verify covers every AC; one close per spec.
   - `next` and `resume` show "delivery 2 of 3". Delivery boundaries are recommended session cuts.
   - With a tracker, deliveries (or tasks) can be pushed as sub-tasks of the story.
3. **When tasks proposes deliveries:** more than N tasks (configurable), or a PR foreseen above the
   threshold. Always grouped by AC, never by technical layer.

## MDO-0014 — Parallel tasks

**Phase 9; historical spec proposal, executed in this phase without opening a spec.**

Several subagents run tasks at the same time.

1. **Eligibility, decided by a script:** two tasks run in parallel only when they are in the same wave,
   do not depend on each other, both have `parallel_safe: true`, and their `files` lists do not
   overlap. Overlapping tasks run in sequence even when they declare `parallel_safe`.
2. **Isolation:** each parallel task works in its own sub-worktree (a branch from the spec's branch)
   with its own setup, and is integrated into the spec's branch once its review passes. The spec
   measures the setup cost per sub-worktree (dependencies) and proposes how to reduce it without
   linking `node_modules`.
3. **Queued commits:** one per task, in the order the tasks reach PASS, with their trailers. A conflict
   on integration sends the task back to rework; it is never resolved silently.
4. **Configurable limit:** `resources.max_parallel_tasks` (default 2). The resource guard and the
   queue for heavy runs still apply. The Testers writing the red tests of parallel tasks can run in
   parallel too.
5. **Visibility:** `status` and `resume` show which tasks run in parallel and the phase of each. A
   session cut waits for the running tasks to finish.
6. **Measurement:** Kaizen compares total time and cost with and without parallelism. The goal is
   less time, not less cost; a cost increase is reported.

## Migrate MDO-0008 to MDO-0010 to layout v2

Taken out of MDO-0011 before implement (MDO-0011 C-5). It runs once layout v2 has been proven on a
real spec; until then the scripts read both layouts by the story's `schema_version`.

## Security quick before the beta

**Phase 1; implemented in `perf/fase-1`.**

Before the beta is published.

- [x] **Skill sources over `https:` only.** `http:`, `file:`, `ssh:` and `git:` sources are refused
  by schema and runtime guard, with tests.
- [x] **The user's `GIT_SSH_COMMAND` is kept.** `BatchMode=yes` is appended only when neither
  `BatchMode=yes` nor `BatchMode=no` is explicitly set.
- [x] **Graphify install, checked.** Its pinned command installer is used; the repository is not
  copied whole into skill folders.

Related, already listed: [maintainer-checklist.md](maintainer-checklist.md#secret-scanning-and-dependency-security)
and the [exposure audit](security/exposure-audit.md).

## Rules enforced by script

**Phase 5, except cost recording (phase 2) and approved commit manifests (phase 4).**

Rules the commands state as prose become checks a script enforces.

- **Loop brake.** When `run step` returns the same action for the same task N times in a row
  (default 3) with no progress in the log, it returns HALT with the reason and the options.
- **A new test that passes on its first run.** `run step` stops asking for red and offers `mutation`
  evidence (existing behavior) or a review of the test.
- **`run commit` never drops files outside the task's list.** When the diff holds undeclared and unreviewed files it
  stops until the approved manifest is updated; it never commits a state that does not build.
- **The test gate is not `NOT_INSTALLED` when the runner exits successfully.** A "command not found"
  in a test's output does not decide the gate's status.
- **Deleting tests to meet a linter limit is a FAIL for the Reviewer;** the file is split instead.
- **Close refuses an unresolved `ASSUMPTION` or `CONFLICT`.** Each one is marked resolved (with the
  decision and the link) or moves to this backlog with an owner.
- **`mandao approve` can revoke an approval and annul a log row.** Both record the reason
  append-only; nothing is deleted.
- **Decide where `.integrity.json` lives:** in git on every task, only at close, or outside git.
- **Red first only for the tests the task added or changed.** The red-first guard (`testsWithoutRed`)
  asks for red only for tests added or changed in the task's diff against the base, not for every test
  in the declared files. A declared file the diff does not touch asks for nothing (MDO-0011 T4 pivot).
- **Each command records its cost before its last commit.** `run cost --record` runs before the
  command's final commit, so `costs.yml` and `.integrity.json` are not left modified after every step
  (seen after verify and close of MDO-0011).
- **`approve design` clears what `next` reports.** It hashes every approvable document it confirms, including an already approved `story.md`, so
  "changed after its approval" can be cleared by the command `next` recommends (Kaizen MDO-0011 L3).

- **Machine-independent test guard:** check local `user.name` and `user.email` in temporary git
  repositories and prohibit `process.exit()` with pending output in test fixtures/scripts; use
  `process.exitCode`.

## Security gates from the user's CI

**Phase 7; depends on phase 6 delivery.**

- **`constitution` detects scanning in the project's CI** (GitHub Actions, GitLab CI and others):
  secret scanning and SAST. It records the result in `infrastructure.md` as
  `security_scanning: local | ci | none`, and `doctor` checks it again.
- **verify follows what exists:**
  - local tools available → they run;
  - no local tools, but the CI scans → "pending: PR CI", and delivery merges only with the CI green;
  - neither → reported; tasks with a security tag require `mandao approve <spec> security-gaps`,
    offering to install the tools (the command for the operating system, confirmed) or a quick that
    adds scanning to the CI.
- **Before merging, delivery reads the PR's real checks** and warns when none is a security check.
- **A scan that ran nowhere is never reported as PASS.**

## Phase 10 — Version release notes

Acceptance criteria: a command generates a version's release notes by collecting the "For the PO"
section of every spec merged since the previous tag, using `language.business`. Keep per-spec close
summaries and changelog lines as the sources; do not restore the v1 per-spec release artifact layout.
