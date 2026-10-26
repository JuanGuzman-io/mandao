---
schema_version: 1
id: implement
title: Implement
description: "Run the Leader → Implementer → Reviewer loop task by task, with checkpoints after every step and a commit after each Reviewer PASS."
status: stable
flow: { after: [tasks], next: [verify] }
arguments:
  - name: spec
    description: "Spec folder or id"
    required: true
  - name: task
    description: "Optional task id (default: the next eligible task)"
inputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/tasks.md", required: true, description: "every depth, including lite" }
  - { path: "{{paths.specs}}/<ID>-<slug>/_log/progress.yml" }
outputs:
  - { path: "(code)", description: one local commit per task after PASS }
  - { path: "{{paths.specs}}/<ID>-<slug>/_log/execution.md" }
  - { path: "{{paths.specs}}/<ID>-<slug>/_log/progress.yml" }
  - { path: "{{paths.specs}}/<ID>-<slug>/tasks.md" }
capabilities: [read, search, edit, shell, agents]
templates: [rules/review.md, rules/clean-code.md, rules/test-policy.md, rules/commits.md, spec/execution.md, spec/pivot-record.md, rules/budget.md, rules/telemetry.md, rules/next-step.md]
scripts: [where, next, models, status, tasks, step, brief, loop, checkpoint, resources, gates, review-pack, review, test-review, commit, pr-plan, verify-plan, mutation, implement-summary, event]
# OpenCode: the commands run as the Leader agent, so the session uses the leader model.
harness: { opencode: { agent: mandao-leader } }
---

# /mandao-implement

Budget: follow `{{template:rules/budget.md}}` at the start and at the end.
Telemetry: follow `{{template:rules/telemetry.md}}` for event calls and categories.

Spec: {{arg:spec}} · task: {{arg:task}}

You are the **Leader** for this spec, in this session (subagents cannot start subagents). You do not
write production code yourself. Use `{{language.technical}}` for notes; code and commits are English.

## 0. Before the first task

1. `{{script:where}} {{arg:spec}} --harness {{harness}}` — if `inWorktree` is false, move into the worktree before any other step.
<!-- mandao:if harness=claude -->
   Call `EnterWorktree` with the worktree path (`expected.worktree` in the `where` output) and go on without a new session; if it is
   refused or fails, print the `resume` field of that output and stop: do not go on working in the main checkout. Mandao never creates branches here.
<!-- mandao:endif -->
<!-- mandao:if !harness=claude -->
   Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop. Mandao never creates branches here.
<!-- mandao:endif -->
2. `{{script:models}} --harness {{harness}}` — compare **your own model** with `leader`. On a mismatch,
   warn (the Leader should run on `<leader>`) and continue.
3. **Status.** If `story.md` says `approved`, check `{{script:status}} {{arg:spec}} in-progress` and set
   `status: in-progress` in `story.md` before the first task: `verify` can only move an `in-progress`
   spec to `verified`.
   When the spec is still `draft`, run `{{mandao}} approve --by-running /mandao-implement --harness {{harness}} {{arg:spec}} <step>`
   (`<step>` is `spec` for a lite draft and `tasks` for draft tasks; add `--words "<what the person wrote>"` when they wrote something next to the command): on `go` it has
   approved and recorded it, so go on; on `ask`, relay its one question and wait for the answer. Never
   approve by any other route than the person's explicit word or this call.
4. Read `_log/progress.yml` (older specs keep it in the spec root): if a task is in progress, continue it as `/mandao-resume` would.

## 1. For each task

Pick the task: `{{arg:task}}` or `next` from `{{script:tasks}} {{arg:spec}}` (stop if it reports
`blocked`); `next` comes from the current delivery. When `delivery.checkpoint` (in `{{script:next}}` or
`{{script:tasks}}`) reports a delivery boundary, run `{{script:verify-plan}} {{arg:spec}} --delivery <n>`,
run its suites and report. The checkpoint passes when `scope.clear` is true: `blockers` always holds the
permanent "partial plan" line, so it is never empty. When `clear` is false, rework what the other
blockers name before the next delivery starts. Then recommend a new conversation before the next
delivery, naming the harness's new-conversation action first (e.g. `/clear` in Claude Code). The partial plan never verifies the spec; the final verify covers every AC. Then repeat until the task is done, halted or pivoted. **One call per step:**
`{{script:step}} {{arg:spec}} <Tn> --harness {{harness}} [checkpoint options]` writes the checkpoint
(when you pass any), returns the next action from `loop`, and adds the brief when the action delegates
work. The mechanical parts (gates, the review input, the final report) are scripts too: run them, read
their short JSON, and decide; never paste their full output into the conversation.

1. **Checkpoint** before anything else:
   `{{script:step}} {{arg:spec}} <Tn> --phase implementing --harness <h> --verdict STARTED --tier <tier> --next "<what comes next>"`.
   The script computes the attempt from the log (one plus the task's FAILs). When `loop.action` is
   `await-budget`, the spec spent past its cap with no authorization recorded: stop, tell the user the
   `reason`, and wait for `mandao approve <spec> budget --to <usd>`; with no person to ask (a headless
   run), stop and leave it pending.
   When the reply has `session.stop: true` (a new session saves at least `session.cut_min_savings`,
   ADR 0038), stop before delegating: tell the user the `reason` and `savings`, give
   `session.advice.action` first and then `session.advice.then` (the new conversation continues from the
   checkpoint with `/mandao-implement {{arg:spec}}`). Otherwise go on without asking:
   the estimate is already in `_log/session-cuts.md`.
   Checkpoints are the only memory between sessions: write one after every step below (the same
   options work on `{{script:checkpoint}}` when you need no next action).
   **Identity is never typed by hand.** `--implementer` and `--reviewer` take the **agent you invoked**
   (`mandao-implementer-<tier>`, `mandao-reviewer`, with `@<harness>` when another harness ran it, or
   `self` when it ran in your own context); the script reads its model and effort from the agent file the
   harness loads, and the Leader's model from `models.yml`. Pass what the agent said about itself, verbatim,
   as `--claimed-implementer` / `--claimed-reviewer`: it is only compared, never recorded as the identity,
   and only a claim that names a different model is recorded as `identity mismatch`.
2. **Brief:** the `brief` field of `step` (or `{{script:brief}} {{arg:spec}} <Tn> --harness <h>`) gives
   the clauses, files, exemplar, gates, skills, lenses, models and impacted tests. A UI task also carries
   `mockup: { readme, files, source, artboard? }`: the Implementer follows the approved mock in those files
   (never the private `/design` link) and justifies each deviation in its report; the Reviewer fails an
   unjustified one. Load the installed mock skill (`ai-design-skills`) for such a task only when the spec's
   mock was accepted.
3. **Red tests first** when `loop` returns `write-red-tests` (TDD, ADR 0022: the task declares tests).
   Send the brief to the agent `loop` names (`tdd.testsBy`: the `tester` for risk tags or tier strong,
   else the Implementer) asking **only** for the tests from the spec, recorded with `mandao run red` (a
   `RED` row, only if they fail). The red run is recorded before any code of the task, including helpers
   the new tests call. `step` gives no implementation step until that row exists.
   An `evidence: mutation` task (`tdd.evidence: mutation` in `loop`) has no red step: its tests pin down existing
   behavior, and the Implementer proves each assertion with `{{script:mutation}}` (rules/test-policy.md)
   before reporting.
   If a new test passes on its first run, `step` returns `choose-test-evidence`: do not repeat the red
   command. Choose one route from its `evidenceOptions`: a killed mutation with
   `{{script:mutation}} … --for-first-pass`, or an independent Reviewer test inspection recorded with
   `{{script:test-review}} … --reviewer <agent> --review <file>`. Both routes need script-owned evidence
   before the implementation step is released.
   **Implement** in a fresh context with the implementer for the tier:
<!-- mandao:if harness=claude -->
   the `mandao-implementer-<tier>` agent (or `mandao-implementer` in simple mode).
<!-- mandao:endif -->
<!-- mandao:if harness=copilot -->
   the `mandao-implementer-<tier>` custom agent (or `mandao-implementer` in simple mode) as a subagent.
<!-- mandao:endif -->
<!-- mandao:if harness=codex -->
   the `mandao_implementer_<tier>` custom agent (or `mandao_implementer` in simple mode). Codex loads
   `.codex/agents/` only in a trusted project; when the agent is not available, say so and record
   `reduced independence` with your own model as the implementer.
<!-- mandao:endif -->
   Send only the brief. When it reports: checkpoint with `--phase awaiting-review --verdict REPORTED
   --implementer <agent>`.
4. **Gates and impacted tests** (`{{template:rules/test-policy.md}}`): before a build, check
   `{{script:resources}} --project <project> --kind build`; when it says `defer`, do not force it — report
   and wait, unless the user asks (a forced run is recorded). `{{script:gates}} {{arg:spec}} <Tn>` runs
   the project's level 0 gates and the impacted tests (never the full suite), and returns pass/fail per
   gate with the excerpt of a failure; the whole output stays in `_log/gates/<Tn>-<attempt>.md` for the
   Reviewer and verify. A gate that is not installed or not configured is reported, never skipped silently.
   `DEFERRED_TO_CI` is not a PASS: record it on the checkpoint with
   `--deferred "<tests>|<reason>"`; the spec cannot reach `verified` until CI confirms those tests.
5. **Review** in a separate agent or process — never in your own context — with only the diff, the brief
   (its `graph` field is the code-graph context: the Reviewer has no shell for `graphify query`), the
   step 4 results (a read-only reviewer cannot run tests) and the active lenses
   (`{{template:rules/review.md}}`, `{{template:rules/clean-code.md}}`):
   `{{script:review-pack}} {{arg:spec}} <Tn>` writes all of it to one file; send the Reviewer only its
   path. Who reviews comes from `loop`:
   - `crossReview` present → another installed harness reviews, as a read-only process Mandao launches
     and records itself: save the brief to a file, then
     `{{script:review}} {{arg:spec}} <Tn> --via <harness> --brief <file> --gates _log/gates/<Tn>-<attempt>.md`. It writes the
     execution row (PASS or FAIL) with the identity it launched; do not checkpoint the verdict again.
     If it fails (not logged in, no verdict), fall back to the next option and say why.
   - otherwise the `reviewer` agent `loop` names; checkpoint the verdict with `--reviewer <agent>` and
     the Reviewer's **whole answer** on stdin, `--review - <<'EOF'` … `EOF`. The script checks its
     `VERDICT` line and required `Findings (JSON)` schema, refuses a PASS that carries an open
     high/critical security finding, and keeps the whole answer in `_log/reviews/`.
<!-- mandao:if harness=codex -->
   In Codex: the `mandao_reviewer` custom agent. If custom agents are not loaded (untrusted project),
   use `{{script:review}} … --via codex`, which runs `codex exec` read-only on the reviewer model.
<!-- mandao:endif -->
   With neither, review in your own context: `--reviewer self`, which the script records as `reduced
   independence`. The Reviewer never runs on a lower tier or effort than the Implementer.
6. **Verdict:**
   - **FAIL** → checkpoint `--verdict FAIL --phase rework-<n> --reason "<the first blocking finding>"`
     (required: the log keeps why the task failed); back to step 3. A test the rework adds runs red
     first too (`mandao run red`), before the fix: `REPORTED` is refused for a test no red run saw. `loop`
     moves the task one tier up after 2 FAILs and returns `halt` after 3 FAILs at strong: stop, report.
   - **The spec is wrong** → write a Pivot Record (`{{template:spec/pivot-record.md}}`) in `_log/execution.md`,
     checkpoint `--verdict PIVOT`, and wait for the user's sign-off. No retries are consumed.
   - **PASS** → commit (step 7). Advisories go to `## Advisories` and never reopen the loop.
   Logs (`_log/`, `progress.yml`, `execution.md`) are written only by the scripts. Never edit them by
   hand: `checkpoint` records any such edit as a discrepancy. When a script refuses, fix the input
   (for example a shorter `--pending-commit` subject), never the log.
7. **Commit** locally, no confirmation needed, never push, never on a protected branch (`branching.protected`;
   the script refuses). Hashes are never recorded: the commit is
   found by its `Refs` and `Mandao-Task` trailers, so the PASS row goes **inside** the task's commit.
   1. Checkpoint the PASS and queue the commit:
      `--verdict PASS --reviewer <agent> --done <Tn> --pending-commit "<subject>" --clear` (or
      `--next-task`). `<subject>` is **only the subject** (`add --json to mandao doctor`): the script
      adds the emoji, type and scope itself (`{{template:rules/commits.md}}`). When `{{script:review}}` already wrote
      the PASS row, leave out `--verdict` and `--reviewer`: `--done <Tn> --pending-commit "<subject>"`.
   Before step 2, stage with `git add --` every file of the reviewed diff outside the task's `files`:
   the commit must build on its own.
   2. `{{script:commit}} {{arg:spec}} --trailer "<your Co-Authored-By trailer, if any>"` makes one commit
      per pending task with its trailers.
<!-- mandao:if harness=codex -->
   The Codex sandbox keeps `.git` read-only: run step 2 as a command that asks for approval to run
   outside the sandbox (`.codex/rules/mandao.rules` makes Codex prompt for exactly this command in a
   trusted project). In `codex exec`, or if the user declines, leave it pending.
<!-- mandao:endif -->
   If the commit cannot run, do not work around it: the task stays `PASS · pending-commit`, `resume` and
   `doctor` show it, and anyone — the user, the next session, another harness — runs
   `{{script:commit}} {{arg:spec}}`. Start the next task only if it touches none of the pending files.

The Definition of Done includes the module's `AGENTS.md` and, when the workspace uses Claude Code, its
`CLAUDE.md` pointer. A task that edits `core/` runs `mandao sync` and commits the generated files with
the task.

## 2. After the last task

Report from `{{script:implement-summary}} {{arg:spec}}` (verdicts, FAIL reasons, identities, commits,
deferred tests and advisories, read from the log and git): tasks done, FAILs and escalations, reduced or
provider independence, deferred tests, commits, and every `securityMentions` entry verbatim: they did not
block, so the user must see them.
Then `{{script:pr-plan}} {{arg:spec}}` says how to deliver: one PR, one per repository (polyrepo), or
stacked PRs along the declared deliveries or the task dependencies — decided by the structure and the **real** size of the commits
against `size_limits.pr`, never by an estimate. Propose it; nothing is written into the spec.
End with `{{template:rules/next-step.md}}`: `{{script:next}} {{arg:spec}} --harness {{harness}}`. Verify always
follows implement in this same session (`autoContinue`); report the implementation and verify results
together. If the implementation summary has `session.cut: true`, start the recommended fresh conversation
first and continue with verify there (ADR 0038). Any verification blocker or question that requires the
user still pauses normally.
