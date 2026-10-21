# Review pack — T3, attempt 2

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T3-2.md`.

## Brief

```json
{
  "spec": "MDO-0010-guide-the-next-step-and-keep-the-session-in-the",
  "task": {
    "project": "mandao",
    "kind": "feat",
    "tier": "standard",
    "files": [
      "core/commands/specify.md",
      "core/commands/quick.md",
      "core/commands/implement.md",
      "core/commands/verify.md",
      "core/commands/close.md",
      "core/commands/story.md",
      "core/commands/clarify.md",
      "core/commands/tasks.md",
      "core/commands/constitution.md",
      "docs/decisions/0037-mandao-start-and-worktree-setup.md",
      "docs/decisions/0038-session-cut-at-task-boundaries.md",
      "docs/decisions/0040-approval-by-running-the-next-command.md",
      "MANDAO-DESIGN.md",
      "docs/command-format.md",
      "src/scripts/spec.ts",
      "src/cli/run-spec.ts",
      "src/adapters/codex.ts",
      "docs/cli.md",
      "test/unit/content.test.ts",
      "test/unit/session-advice.test.ts",
      "test/integration/hook.test.ts",
      "test/integration/worktree-entry.test.ts",
      "test/integration/where.test.ts"
    ],
    "exemplar": "core/commands/implement.md",
    "ac": [
      "AC-2",
      "AC-2/C1",
      "AC-2/C2",
      "AC-3/C1",
      "AC-4"
    ],
    "scenarios": [
      "S-2.1",
      "S-2.2",
      "S-2.2/C1",
      "S-2.3",
      "S-2.3/C1",
      "S-3.3",
      "S-3.3/C1",
      "S-4.3"
    ],
    "test_levels": {
      "S-2.1": "e2e",
      "S-2.2": "e2e",
      "S-2.2/C1": "unit",
      "S-2.3": "unit",
      "S-2.3/C1": "unit",
      "S-3.3": "unit",
      "S-3.3/C1": "unit",
      "S-4.3": "unit"
    },
    "evidence": "tdd",
    "risk_tags": [],
    "depends_on": [
      "T1",
      "T2"
    ],
    "parallel_safe": false,
    "verify": "npx vitest run test/unit/content.test.ts test/integration/hook.test.ts test/integration/worktree-entry.test.ts test/unit/diagram.test.ts",
    "tests": {
      "unit": [
        "S-2.2/C1",
        "S-2.3",
        "S-2.3/C1",
        "S-3.3",
        "S-3.3/C1",
        "S-4.3"
      ],
      "e2e": [
        "S-2.1",
        "S-2.2"
      ]
    },
    "dod": [],
    "characterization": false,
    "id": "T3",
    "title": "The commands enter the worktree and end with the state's next step",
    "done": false,
    "line": 99
  },
  "acceptance": [
    {
      "ref": "AC-2",
      "text": "**GIVEN** a Claude Code session in which `mandao start`, the specify fallback or the quick fallback creates a spec's worktree · **WHEN** the worktree is ready · **THEN** the session continues inside that worktree with the same conversation, and the command goes on without asking for a new session · **AND IT MUST**, in a harness that cannot move its session, print the exact command that resumes there, as today · **BUT it must NOT** leave the person in the main checkout with no step to follow when the move fails; it then prints the resume command"
    },
    {
      "ref": "AC-2/C1",
      "text": "**AND IT MUST**, in a harness that cannot move its session, print the exact command that resumes there, as today"
    },
    {
      "ref": "AC-2/C2",
      "text": "**BUT it must NOT** leave the person in the main checkout with no step to follow when the move fails; it then prints the resume command"
    },
    {
      "ref": "AC-3/C1",
      "text": "**AND IT MUST**, if the fresh conversation would not be inside the worktree, give first the step back into it"
    },
    {
      "ref": "AC-4",
      "text": "**GIVEN** a session that did other work before a quick change, for example a spec's implement · **WHEN** the quick records its cost · **THEN** the record holds only what was spent from the quick's start, and it is committed with the quick · **BUT it must NOT** count work already recorded for another spec or command in the same session"
    }
  ],
  "scenarios": [
    {
      "ref": "S-2.1",
      "text": "**Given** the rendered `/mandao-specify`, `/mandao-quick` and `/mandao-implement` for `claude` · **When** they reach the step after the worktree exists, or `run where` says the session is outside it · **Then** they tell the agent to enter the worktree with `EnterWorktree` and the path, and to continue without a new session"
    },
    {
      "ref": "S-2.2",
      "text": "**Given** the same commands rendered for `codex`, `opencode`, `copilot` and `antigravity` · **When** they reach that step · **Then** they print the exact resume command from the harness table, and mention no `EnterWorktree` · **AND IT MUST** keep a printable resume command for every harness"
    },
    {
      "ref": "S-2.2/C1",
      "text": "**AND IT MUST** keep a printable resume command for every harness"
    },
    {
      "ref": "S-2.3",
      "text": "**Given** the Claude Code rendering · **When** `EnterWorktree` is refused or fails · **Then** the command prints the resume command and stops · **BUT it must NOT** go on working in the main checkout"
    },
    {
      "ref": "S-2.3/C1",
      "text": "**BUT it must NOT** go on working in the main checkout"
    },
    {
      "ref": "S-3.3",
      "text": "**Given** a new conversation that starts outside the spec's worktree · **When** the next command runs its `run where` check · **Then** it enters the worktree (Claude Code) or prints the resume command (others) before any other step"
    },
    {
      "ref": "S-3.3/C1",
      "text": "**Then** it enters the worktree (Claude Code) or prints the resume command (others) before any other step"
    },
    {
      "ref": "S-4.3",
      "text": "**Given** the rendered `/mandao-quick` · **When** its steps are read in order · **Then** the cost record comes before `quick-log` and the commit, and the commit lists `specs/quick/_log/costs.yml`"
    }
  ],
  "project": {
    "name": "mandao",
    "path": ".",
    "gates": {
      "format": "npx biome format .",
      "lint": "npm run lint",
      "typecheck": "npm run typecheck",
      "test": "npm test",
      "build": "npm run build",
      "secrets": "gitleaks git . --redact --no-banner",
      "audit": "npm audit --omit=dev",
      "sast": "semgrep scan --config p/typescript --config p/javascript --error --metrics=off",
      "metrics": "npx biome lint --only=complexity/noExcessiveCognitiveComplexity --only=complexity/noExcessiveLinesPerFunction --only=style/noExcessiveLinesPerFile"
    }
  },
  "skillMap": [
    "| graphify | core | constitution, specify, implement, close | all | 0.9.92, pinned in the lock; Claude Code hooks through `mandao hook graph-guard` (roles with a shell only, ADR 0021) and git hooks installed |",
    "| codebase-conventions | stack | specify, implement, verify | `src/`, `test/`, `core/` | project skill in `.claude/skills/codebase-conventions/`; Codex copy in `.agents/skills/codebase-conventions/`; generated with skill-creator from `docs/constitution/standards.md` and `architecture.md` |"
  ],
  "lenses": [],
  "loop": {
    "task": "T3",
    "tier": "standard",
    "attempt": 2,
    "failsAtTier": 1,
    "tdd": {
      "required": true,
      "testsBy": "implementer",
      "red": true,
      "evidence": "red"
    },
    "implementer": {
      "model": "claude-sonnet-5-5"
    },
    "reviewer": {
      "role": "reviewer",
      "model": "claude-opus-5-5"
    },
    "notes": [],
    "action": "review",
    "reason": "implementation reported, awaiting review"
  },
  "impact": {
    "source": "runner",
    "runner": "vitest",
    "graphTests": [
      "test/adapters/adapters.test.ts",
      "test/integration/approve.test.ts",
      "test/integration/branching.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/cli.test.ts",
      "test/integration/close.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/doctor-cli.test.ts",
      "test/integration/enforced-rules.test.ts",
      "test/integration/engine.test.ts",
      "test/integration/leader-scripts.test.ts",
      "test/integration/ledger.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/review.test.ts",
      "test/integration/scripts.test.ts",
      "test/integration/shadow.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/start.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/commits-times.test.ts",
      "test/unit/doctor-cache.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/next.test.ts"
    ],
    "files": [
      "core/commands/specify.md",
      "core/commands/quick.md",
      "core/commands/implement.md",
      "core/commands/verify.md",
      "core/commands/close.md",
      "core/commands/story.md",
      "core/commands/clarify.md",
      "core/commands/tasks.md",
      "core/commands/constitution.md",
      "docs/decisions/0037-mandao-start-and-worktree-setup.md",
      "docs/decisions/0038-session-cut-at-task-boundaries.md",
      "docs/decisions/0040-approval-by-running-the-next-command.md",
      "MANDAO-DESIGN.md",
      "docs/command-format.md",
      "src/scripts/spec.ts",
      "src/cli/run-spec.ts",
      "src/adapters/codex.ts",
      "docs/cli.md",
      "test/unit/content.test.ts",
      "test/unit/session-advice.test.ts",
      "test/integration/hook.test.ts",
      "test/integration/worktree-entry.test.ts",
      "test/integration/where.test.ts",
      "test/adapters/adapters.test.ts",
      "test/integration/approve.test.ts",
      "test/integration/branching.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/cli.test.ts",
      "test/integration/close.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/doctor-cli.test.ts",
      "test/integration/enforced-rules.test.ts",
      "test/integration/engine.test.ts",
      "test/integration/leader-scripts.test.ts",
      "test/integration/ledger.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/review.test.ts",
      "test/integration/scripts.test.ts",
      "test/integration/shadow.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/start.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/commits-times.test.ts",
      "test/unit/doctor-cache.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/next.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related core/commands/specify.md core/commands/quick.md core/commands/implement.md core/commands/verify.md core/commands/close.md core/commands/story.md core/commands/clarify.md core/commands/tasks.md core/commands/constitution.md docs/decisions/0037-mandao-start-and-worktree-setup.md docs/decisions/0038-session-cut-at-task-boundaries.md docs/decisions/0040-approval-by-running-the-next-command.md MANDAO-DESIGN.md docs/command-format.md src/scripts/spec.ts src/cli/run-spec.ts src/adapters/codex.ts docs/cli.md test/unit/content.test.ts test/unit/session-advice.test.ts test/integration/hook.test.ts test/integration/worktree-entry.test.ts test/integration/where.test.ts test/adapters/adapters.test.ts test/integration/approve.test.ts test/integration/branching.test.ts test/integration/characterization.test.ts test/integration/cli.test.ts test/integration/close.test.ts test/integration/costs.test.ts test/integration/doctor-cli.test.ts test/integration/enforced-rules.test.ts test/integration/engine.test.ts test/integration/leader-scripts.test.ts test/integration/ledger.test.ts test/integration/lite-spec.test.ts test/integration/mdo-0004-defects.test.ts test/integration/mdo-0005-defects.test.ts test/integration/mdo-0006-defects.test.ts test/integration/premise.test.ts test/integration/review.test.ts test/integration/scripts.test.ts test/integration/shadow.test.ts test/integration/spec-log.test.ts test/integration/start.test.ts test/integration/tdd.test.ts test/unit/commits-times.test.ts test/unit/doctor-cache.test.ts test/unit/doctor-report.test.ts test/unit/next.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": [
      "src/adapters/index.ts",
      "src/cli/approve.ts",
      "src/cli/checkpoint-guards.ts",
      "src/cli/run-close.ts",
      "src/cli/run-cost.ts",
      "src/cli/run-diagram.ts",
      "src/cli/run-leader.ts",
      "src/cli/run-ledger.ts",
      "src/cli/run-mutation.ts",
      "src/cli/run-red.ts",
      "src/cli/run-review.ts",
      "src/cli/run-verify.ts",
      "src/cli/run.ts",
      "src/cli/session-advice.ts",
      "src/cli/spec-context.ts",
      "src/cli/start.ts",
      "src/cli/worktree.ts",
      "src/scripts/brief.ts",
      "src/scripts/commits.ts",
      "test/adapters/adapters.test.ts",
      "test/integration/branching.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/enforced-rules.test.ts",
      "test/integration/ledger.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/scripts.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/next.test.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/integration/hook.test.ts",
      "test/unit/content.test.ts",
      "test/integration/worktree-entry.test.ts",
      "test/integration/where.test.ts",
      "test/unit/session-advice.test.ts"
    ],
    "changed": [
      "test/integration/hook.test.ts",
      "test/unit/content.test.ts",
      "test/integration/worktree-entry.test.ts"
    ]
  }
}
```

## Gates — T3, attempt 2

Every configured gate passed.

| Gate | Status | Exit |
|---|---|---|
| scan-markers | PASS | — |
| format | PASS | 0 |
| lint | PASS | 0 |
| typecheck | PASS | 0 |
| test | PASS | 0 |
| build | PASS | 0 |
| secrets | NOT_INSTALLED | 127 |
| audit | SKIPPED | — |
| sast | NOT_INSTALLED | 127 |
| metrics | PASS | 0 |


## Diff

```diff
diff --git a/.agents/skills/mandao-clarify/SKILL.md b/.agents/skills/mandao-clarify/SKILL.md
index d0c609e..3e2ebc3 100644
--- a/.agents/skills/mandao-clarify/SKILL.md
+++ b/.agents/skills/mandao-clarify/SKILL.md
@@ -29,5 +29,7 @@ Follow `.mandao/templates/app/rules/context.md` and `.mandao/templates/app/rules
 5. Re-run `node .mandao/bin/mandao.mjs run trace <spec>`. A critical finding still open keeps blocking
    $mandao-tasks; say so.
 
+End by recording what was shown with `node .mandao/bin/mandao.mjs run next <spec> --shown` and give the command it names.
+
 If an answer changes `design.md` and `node .mandao/bin/mandao.mjs run diagram <ID>` then reports `stale: true`, regenerate the
 approval diagram as `/mandao-specify` step 7 describes before asking for approval again.
diff --git a/.agents/skills/mandao-close/SKILL.md b/.agents/skills/mandao-close/SKILL.md
index c616760..41a61cf 100644
--- a/.agents/skills/mandao-close/SKILL.md
+++ b/.agents/skills/mandao-close/SKILL.md
@@ -16,8 +16,9 @@ instructions.
 
 ## 0. Gate
 
-`node .mandao/bin/mandao.mjs run where <spec>`, then `node .mandao/bin/mandao.mjs run status <spec> closed` must be allowed (the spec is
-`verified`). If not, stop and say what is missing.
+`node .mandao/bin/mandao.mjs run where <spec> --harness <this harness> --first "/mandao-close <spec>"`: if `inWorktree` is false, move into the worktree before any other step.
+   Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop.
+Then `node .mandao/bin/mandao.mjs run status <spec> closed` must be allowed (the spec is `verified`). If not, stop and say what is missing.
 
 ## 1. Kaizen (design §18.1)
 
diff --git a/.agents/skills/mandao-implement/SKILL.md b/.agents/skills/mandao-implement/SKILL.md
index 0e2b642..bab49c7 100644
--- a/.agents/skills/mandao-implement/SKILL.md
+++ b/.agents/skills/mandao-implement/SKILL.md
@@ -15,15 +15,17 @@ write production code yourself. Use `en` for notes; code and commits are English
 
 ## 0. Before the first task
 
-1. `node .mandao/bin/mandao.mjs run where <spec>` — if this session is not in the spec's worktree, stop and tell the user
-   the path to open. Mandao never creates branches here.
+1. `node .mandao/bin/mandao.mjs run where <spec> --harness <this harness>` — if `inWorktree` is false, move into the worktree before any other step.
+   Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop. Mandao never creates branches here.
 2. `node .mandao/bin/mandao.mjs run models --harness <this harness>` — compare **your own model** with `leader`. On a mismatch,
    warn (the Leader should run on `<leader>`) and continue.
 3. **Status.** If `story.md` says `approved`, check `node .mandao/bin/mandao.mjs run status <spec> in-progress` and set
    `status: in-progress` in `story.md` before the first task: `verify` can only move an `in-progress`
    spec to `verified`.
-   An approval is the person's explicit word for that item, or their own `mandao approve`; running the
-   next command is not one.
+   When the spec is still `draft`, run `node .mandao/bin/mandao.mjs approve --by-running /mandao-implement --harness <this harness> <spec> <step>`
+   (`<step>` is `spec` for a lite draft and `tasks` for draft tasks; add `--words "<what the person wrote>"` when they wrote something next to the command): on `go` it has
+   approved and recorded it, so go on; on `ask`, relay its one question and wait for the answer. Never
+   approve by any other route than the person's explicit word or this call.
 4. Read `_log/progress.yml` (older specs keep it in the spec root): if a task is in progress, continue it as `/mandao-resume` would.
 
 ## 1. For each task
@@ -139,5 +141,7 @@ block, so the user must see them.
 Then `node .mandao/bin/mandao.mjs run pr-plan <spec>` says how to deliver: one PR, one per repository (polyrepo), or
 stacked PRs along the task dependencies — decided by the structure and the **real** size of the commits
 against `size_limits.pr`, never by an estimate. Propose it; nothing is written into the spec.
-Next: $mandao-verify. When the summary has `session.cut: true`, give its `command`: verify starts in a
-new session (ADR 0038).
+Next: `node .mandao/bin/mandao.mjs run next <spec>` names the command that follows from the spec's state (and the others that
+can); give it. When the summary has `session.cut: true`, give the harness's new-conversation action first
+(its `command`): the next command starts in a fresh conversation (ADR 0038). If that conversation would not
+be inside the worktree, give first the step back into it.
diff --git a/.agents/skills/mandao-quick/SKILL.md b/.agents/skills/mandao-quick/SKILL.md
index 3354c72..ce7459d 100644
--- a/.agents/skills/mandao-quick/SKILL.md
+++ b/.agents/skills/mandao-quick/SKILL.md
@@ -25,11 +25,11 @@ Follow `.mandao/templates/app/rules/context.md` and the gate in `.mandao/templat
 If the session already runs in a worktree made by `mandao start --quick` (its request is in
 `specs/quick/_log/start-<name>.yml`), skip this step. Otherwise, as a fallback, with **one**
 confirmation, create the branch and worktree from
-`node .mandao/bin/mandao.mjs run spec-new "<name>" --id quick --type <story|bug>` (the id already says `quick`: do not repeat it in the name) (run its `command`, which starts from
+`node .mandao/bin/mandao.mjs run spec-new "<name>" --id quick --type <story|bug> --harness <this harness> --first "/mandao-quick <change>"` (the id already says `quick`: do not repeat it in the name) (run its `command`, which starts from
 the branching model's `base`; show its `issues` first) and install the project's dependencies inside
-the worktree (no symlinks). Then tell the user to continue there, `cd <worktree> && claude --resume
-<this session>` (or the harness's equivalent), and stop until the session runs in the worktree. Skip this
-step when the session already runs on a quick branch.
+the worktree (no symlinks). Then move into the worktree before any other step:
+print the `resume` field of the `spec-new` output (the command that opens this harness in the worktree) and stop.
+Skip this step when the session already runs on a quick branch.
 
 ## 3. Change
 
@@ -58,13 +58,15 @@ Run `node .mandao/bin/mandao.mjs run quick-check` and read its JSON.
 
 ## 6. Record and commit
 
-1. Record the row with `node .mandao/bin/mandao.mjs run quick-log <name> --gates "<gate results>" --verdict <PASS|FAIL>
+1. Record the cost first: `node .mandao/bin/mandao.mjs run cost quick --record --command quick --harness <this harness>` (it holds only what was spent
+   from the quick's start), so that it is committed with the quick.
+2. Record the row with `node .mandao/bin/mandao.mjs run quick-log <name> --gates "<gate results>" --verdict <PASS|FAIL>
    --reviewer <agent you invoked> --harness <this harness>` (`self` when the review ran in your own
    context; add `--reduced-independence` when the reviewer ran on your model). The script measures files
    and lines from the diff, reads the reviewer's model from its agent file and puts every review note in
    the Review column: never type a model name or a review note into the log. Pass what the reviewer said about itself, verbatim,
    as `--claimed-reviewer`; it is only compared.
-2. Commit following `.mandao/templates/app/rules/commits.md`, with the trailer `Mandao-Quick: <name>` and,
+3. Commit following `.mandao/templates/app/rules/commits.md`, with the trailer `Mandao-Quick: <name>` and,
    when a spec id is active, `Refs: <ID>`. Example:
 
    ```
@@ -72,4 +74,6 @@ Run `node .mandao/bin/mandao.mjs run quick-check` and read its JSON.
 
    Mandao-Quick: checkout-label
    ```
-3. Report: what changed, gates run, review result, commit hash.
+
+   The commit lists the code files, `specs/quick/quick-log.md` and `specs/quick/_log/costs.yml`.
+4. Report: what changed, gates run, review result, commit hash.
diff --git a/.agents/skills/mandao-specify/SKILL.md b/.agents/skills/mandao-specify/SKILL.md
index 651affc..7d74c0e 100644
--- a/.agents/skills/mandao-specify/SKILL.md
+++ b/.agents/skills/mandao-specify/SKILL.md
@@ -37,14 +37,14 @@ in the output which skill was missing.
    confirmation) · *No tracker* (next local id, `<local_prefix>-NNNN` from `.mandao/config.yml`).
 
 The folder is `specs/<ID>-<slug>/`. **Branch and worktree** (ADR 0015): run
-`node .mandao/bin/mandao.mjs run spec-new "<title>" --id <ID> --type <type>` (add `--hotfix` when the request says `--hotfix`)
+`node .mandao/bin/mandao.mjs run spec-new "<title>" --id <ID> --type <type> --harness <this harness> --first "/mandao-specify <ID>"` (add `--hotfix` when the request says `--hotfix`)
 and, with **one** confirmation, run the
 `command` it returns (`git worktree add -b <branch> <path> <base>`): the branch name and its `base` come
 from the team's branching model (ADR 0023), and the PR will target that `base`. Show its `issues` (e.g.
 a missing base) before asking. This is the fallback when the session started in the main checkout
-(`mandao start` does it as a script, with the full setup of §14.5): after creating the worktree, tell the
-user to continue there, `cd <worktree> && claude --resume <this session>` (or the harness's equivalent),
-because later commands refuse to work outside it. **A story written before the worktree existed** (by $mandao-story,
+(`mandao start` does it as a script, with the full setup of §14.5): after creating the worktree, move into it before any other step, because later commands refuse to work outside it:
+print the `resume` field of the `spec-new` output (the command that opens this harness in the worktree) and stop.
+Then go on. **A story written before the worktree existed** (by $mandao-story,
 untracked in the current checkout) does not exist in the new worktree: move the whole spec folder into
 the worktree, check the copy is identical, then remove the original, so there is only one. With `--hotfix`, follow `.mandao/templates/app/rules/hotfix.md`. Write every artifact of the spec inside that worktree. Then install the project's dependencies **inside the worktree** (e.g. `npm ci`), never
 a symlink to another checkout: test runners and agent sandboxes write into them. Skip this when the
@@ -129,4 +129,5 @@ and `.mandao/templates/app/rules/consistency-check.md` for the semantic part, ov
   may approve from the terminal instead (`mandao approve <ref> design`): the status,
   `_log/approvals.yml` and the commit then exist already; do not ask again. Approved in the session: set
   `status: approved` in both (and in a `draft` story) and run `node .mandao/bin/mandao.mjs run commit-spec <ref> specify`.
-- Summarize: depth, FR/NFR counts, AC coverage, `UNVERIFIED` premises, risk tags, the next mandao.
+- Summarize: depth, FR/NFR counts, AC coverage, `UNVERIFIED` premises, risk tags. Then run
+  `node .mandao/bin/mandao.mjs run next <ID> --shown` (it records what was shown) and give the command it names as the next mandao.
diff --git a/.agents/skills/mandao-story/SKILL.md b/.agents/skills/mandao-story/SKILL.md
index 2a45433..9c919b4 100644
--- a/.agents/skills/mandao-story/SKILL.md
+++ b/.agents/skills/mandao-story/SKILL.md
@@ -50,4 +50,4 @@ From `.mandao/templates/app/spec/story.md`, following `.mandao/templates/app/rul
 ## 4. Approve
 
 Show the story. When the PO approves, set `status: approved`. If the story lives in a tracker, offer
-to post the approved AC back as a comment (only after confirmation). Next: $mandao-specify.
+to post the approved AC back as a comment (only after confirmation). Next: `node .mandao/bin/mandao.mjs run next <ID>` names the command that follows from the spec's state; give it.
diff --git a/.agents/skills/mandao-tasks/SKILL.md b/.agents/skills/mandao-tasks/SKILL.md
index 5e647b4..d9b8b3b 100644
--- a/.agents/skills/mandao-tasks/SKILL.md
+++ b/.agents/skills/mandao-tasks/SKILL.md
@@ -15,7 +15,9 @@ Write task content in `en`; headings, ids and YAML keys stay in English.
 At lite depth with 3 tasks or fewer, `/mandao-specify` already wrote them inline in `spec.md`: there is
 nothing to do here. Otherwise:
 
-1. **Gate.** Run `node .mandao/bin/mandao.mjs run where <spec>`; work in the spec's worktree. Run
+1. **Gate.** Run `node .mandao/bin/mandao.mjs run where <spec> --harness <this harness> --first "/mandao-tasks <spec>"`: if `inWorktree` is false, move into the worktree before any other step.
+   Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop.
+   Run
    `node .mandao/bin/mandao.mjs run trace <spec>`: a critical `OPEN` or critical Consistency Check finding blocks this
    mandao — stop and recommend $mandao-clarify.
 2. **Write `## Details`** in `tasks.md` from `.mandao/templates/app/spec/tasks.md`, following
@@ -41,7 +43,9 @@ nothing to do here. Otherwise:
    grouped by acceptance criterion, with a checkpoint per group. Never edit it by hand.
 7. **Check:** `node .mandao/bin/mandao.mjs run tasks <spec>` must show no issues and no cycles;
    `node .mandao/bin/mandao.mjs run trace <spec>` must show no `UNPLANNED` or `BROKEN_REF`. Fix and re-run.
-8. **Approve:** show the overview and the first eligible task. The user may approve from the terminal instead (`mandao approve <spec> tasks`, no model session): when they say so, the status and `_log/approvals.yml` already show it, and the commit is made; do not ask again. On approval in the session set `status: approved` and
+8. **Approve:** show the overview and the first eligible task, then record what was shown with
+   `node .mandao/bin/mandao.mjs run next <spec> --shown`. The user may approve from the terminal instead (`mandao approve <spec> tasks`, no model session): when they say so, the status and `_log/approvals.yml` already show it, and the commit is made; do not ask again. When the person runs $mandao-implement while `tasks.md` is still `draft`, that command runs
+   `node .mandao/bin/mandao.mjs approve --by-running /mandao-implement --harness <this harness> <spec> tasks` and relays its one question. On approval in the session set `status: approved` and
    commit the spec documents on their own: `node .mandao/bin/mandao.mjs run commit-spec <spec> tasks` (a `docs` commit
    with `Refs: <ID>` and a fixed subject; never pushed). Pushing subtasks to the tracker is not
-   available yet. Next: $mandao-implement, in a new session (`newSession` from `mandao approve`, ADR 0038).
+   available yet. Next: `node .mandao/bin/mandao.mjs run next <spec>` names the command that follows; give it, with the new-conversation action first when `newSession` from `mandao approve` says so (ADR 0038) and, if that conversation would not be inside the worktree, the step back into it.
diff --git a/.agents/skills/mandao-verify/SKILL.md b/.agents/skills/mandao-verify/SKILL.md
index 24afbdd..3b1af50 100644
--- a/.agents/skills/mandao-verify/SKILL.md
+++ b/.agents/skills/mandao-verify/SKILL.md
@@ -15,7 +15,8 @@ You verify that what was built is what the spec asked for, with evidence. Write
 
 ## 1. Plan
 
-1. `node .mandao/bin/mandao.mjs run where <spec>` — work in the spec's worktree.
+1. `node .mandao/bin/mandao.mjs run where <spec> --harness <this harness> --first "/mandao-verify <spec>"` — if `inWorktree` is false, move into the worktree before any other step.
+   Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop.
 2. `node .mandao/bin/mandao.mjs run verify-plan <spec>` gives the suites per project (unit over the files the spec's
    commits touched; e2e for the flows of its AC, critical ones always), `missingRed` (tasks with declared
    tests and no RED evidence), the runs deferred to CI, the trace findings and the `blockers`.
@@ -57,4 +58,4 @@ report.
 - Either way, commit the report on its own: `node .mandao/bin/mandao.mjs run commit-spec <spec> verify` (a `docs`
   commit with `Refs: <ID>` and a fixed subject; never pushed).
 
-Next: $mandao-close.
+Next: `node .mandao/bin/mandao.mjs run next <spec>` names the command that follows from the spec's state; give it, and if a fresh conversation would not be inside the worktree, give first the step back into it.
diff --git a/.claude/skills/mandao-clarify/SKILL.md b/.claude/skills/mandao-clarify/SKILL.md
index a6b66d5..626e3c2 100644
--- a/.claude/skills/mandao-clarify/SKILL.md
+++ b/.claude/skills/mandao-clarify/SKILL.md
@@ -34,5 +34,7 @@ Follow `.mandao/templates/app/rules/context.md` and `.mandao/templates/app/rules
 5. Re-run `node .mandao/bin/mandao.mjs run trace $spec`. A critical finding still open keeps blocking
    /mandao-tasks; say so.
 
+End by recording what was shown with `node .mandao/bin/mandao.mjs run next $spec --shown` and give the command it names.
+
 If an answer changes `design.md` and `node .mandao/bin/mandao.mjs run diagram <ID>` then reports `stale: true`, regenerate the
 approval diagram as `/mandao-specify` step 7 describes before asking for approval again.
diff --git a/.claude/skills/mandao-close/SKILL.md b/.claude/skills/mandao-close/SKILL.md
index 75b58b7..6114451 100644
--- a/.claude/skills/mandao-close/SKILL.md
+++ b/.claude/skills/mandao-close/SKILL.md
@@ -21,8 +21,10 @@ instructions.
 
 ## 0. Gate
 
-`node .mandao/bin/mandao.mjs run where $spec`, then `node .mandao/bin/mandao.mjs run status $spec closed` must be allowed (the spec is
-`verified`). If not, stop and say what is missing.
+`node .mandao/bin/mandao.mjs run where $spec --harness <this harness> --first "/mandao-close $spec"`: if `inWorktree` is false, move into the worktree before any other step.
+   Call `EnterWorktree` with the worktree path (`expected.worktree` in the `where` output) and go on without a new session; if it is
+   refused or fails, print the `resume` field of that output and stop: do not go on working in the main checkout.
+Then `node .mandao/bin/mandao.mjs run status $spec closed` must be allowed (the spec is `verified`). If not, stop and say what is missing.
 
 ## 1. Kaizen (design §18.1)
 
diff --git a/.claude/skills/mandao-implement/SKILL.md b/.claude/skills/mandao-implement/SKILL.md
index 931f782..789519f 100644
--- a/.claude/skills/mandao-implement/SKILL.md
+++ b/.claude/skills/mandao-implement/SKILL.md
@@ -21,15 +21,18 @@ write production code yourself. Use `en` for notes; code and commits are English
 
 ## 0. Before the first task
 
-1. `node .mandao/bin/mandao.mjs run where $spec` — if this session is not in the spec's worktree, stop and tell the user
-   the path to open. Mandao never creates branches here.
+1. `node .mandao/bin/mandao.mjs run where $spec --harness <this harness>` — if `inWorktree` is false, move into the worktree before any other step.
+   Call `EnterWorktree` with the worktree path (`expected.worktree` in the `where` output) and go on without a new session; if it is
+   refused or fails, print the `resume` field of that output and stop: do not go on working in the main checkout. Mandao never creates branches here.
 2. `node .mandao/bin/mandao.mjs run models --harness <this harness>` — compare **your own model** with `leader`. On a mismatch,
    warn (the Leader should run on `<leader>`) and continue.
 3. **Status.** If `story.md` says `approved`, check `node .mandao/bin/mandao.mjs run status $spec in-progress` and set
    `status: in-progress` in `story.md` before the first task: `verify` can only move an `in-progress`
    spec to `verified`.
-   An approval is the person's explicit word for that item, or their own `mandao approve`; running the
-   next command is not one.
+   When the spec is still `draft`, run `node .mandao/bin/mandao.mjs approve --by-running /mandao-implement --harness <this harness> $spec <step>`
+   (`<step>` is `spec` for a lite draft and `tasks` for draft tasks; add `--words "<what the person wrote>"` when they wrote something next to the command): on `go` it has
+   approved and recorded it, so go on; on `ask`, relay its one question and wait for the answer. Never
+   approve by any other route than the person's explicit word or this call.
 4. Read `_log/progress.yml` (older specs keep it in the spec root): if a task is in progress, continue it as `/mandao-resume` would.
 
 ## 1. For each task
@@ -138,5 +141,7 @@ block, so the user must see them.
 Then `node .mandao/bin/mandao.mjs run pr-plan $spec` says how to deliver: one PR, one per repository (polyrepo), or
 stacked PRs along the task dependencies — decided by the structure and the **real** size of the commits
 against `size_limits.pr`, never by an estimate. Propose it; nothing is written into the spec.
-Next: /mandao-verify. When the summary has `session.cut: true`, give its `command`: verify starts in a
-new session (ADR 0038).
+Next: `node .mandao/bin/mandao.mjs run next $spec` names the command that follows from the spec's state (and the others that
+can); give it. When the summary has `session.cut: true`, give the harness's new-conversation action first
+(its `command`): the next command starts in a fresh conversation (ADR 0038). If that conversation would not
+be inside the worktree, give first the step back into it.
diff --git a/.claude/skills/mandao-quick/SKILL.md b/.claude/skills/mandao-quick/SKILL.md
index deffc42..aa1047a 100644
--- a/.claude/skills/mandao-quick/SKILL.md
+++ b/.claude/skills/mandao-quick/SKILL.md
@@ -30,11 +30,12 @@ Follow `.mandao/templates/app/rules/context.md` and the gate in `.mandao/templat
 If the session already runs in a worktree made by `mandao start --quick` (its request is in
 `specs/quick/_log/start-<name>.yml`), skip this step. Otherwise, as a fallback, with **one**
 confirmation, create the branch and worktree from
-`node .mandao/bin/mandao.mjs run spec-new "<name>" --id quick --type <story|bug>` (the id already says `quick`: do not repeat it in the name) (run its `command`, which starts from
+`node .mandao/bin/mandao.mjs run spec-new "<name>" --id quick --type <story|bug> --harness <this harness> --first "/mandao-quick <change>"` (the id already says `quick`: do not repeat it in the name) (run its `command`, which starts from
 the branching model's `base`; show its `issues` first) and install the project's dependencies inside
-the worktree (no symlinks). Then tell the user to continue there, `cd <worktree> && claude --resume
-<this session>` (or the harness's equivalent), and stop until the session runs in the worktree. Skip this
-step when the session already runs on a quick branch.
+the worktree (no symlinks). Then move into the worktree before any other step:
+call `EnterWorktree` with the worktree path and continue in this conversation, without asking for a new session.
+If `EnterWorktree` is refused or fails, print the `resume` field of the `spec-new` output and stop: do not go on working in the main checkout.
+Skip this step when the session already runs on a quick branch.
 
 ## 3. Change
 
@@ -63,13 +64,15 @@ Run `node .mandao/bin/mandao.mjs run quick-check` and read its JSON.
 
 ## 6. Record and commit
 
-1. Record the row with `node .mandao/bin/mandao.mjs run quick-log <name> --gates "<gate results>" --verdict <PASS|FAIL>
+1. Record the cost first: `node .mandao/bin/mandao.mjs run cost quick --record --command quick --harness <this harness>` (it holds only what was spent
+   from the quick's start), so that it is committed with the quick.
+2. Record the row with `node .mandao/bin/mandao.mjs run quick-log <name> --gates "<gate results>" --verdict <PASS|FAIL>
    --reviewer <agent you invoked> --harness <this harness>` (`self` when the review ran in your own
    context; add `--reduced-independence` when the reviewer ran on your model). The script measures files
    and lines from the diff, reads the reviewer's model from its agent file and puts every review note in
    the Review column: never type a model name or a review note into the log. Pass what the reviewer said about itself, verbatim,
    as `--claimed-reviewer`; it is only compared.
-2. Commit following `.mandao/templates/app/rules/commits.md`, with the trailer `Mandao-Quick: <name>` and,
+3. Commit following `.mandao/templates/app/rules/commits.md`, with the trailer `Mandao-Quick: <name>` and,
    when a spec id is active, `Refs: <ID>`. Example:
 
    ```
@@ -77,4 +80,6 @@ Run `node .mandao/bin/mandao.mjs run quick-check` and read its JSON.
 
    Mandao-Quick: checkout-label
    ```
-3. Report: what changed, gates run, review result, commit hash.
+
+   The commit lists the code files, `specs/quick/quick-log.md` and `specs/quick/_log/costs.yml`.
+4. Report: what changed, gates run, review result, commit hash.
diff --git a/.claude/skills/mandao-specify/SKILL.md b/.claude/skills/mandao-specify/SKILL.md
index f5f1530..bc817c8 100644
--- a/.claude/skills/mandao-specify/SKILL.md
+++ b/.claude/skills/mandao-specify/SKILL.md
@@ -44,14 +44,15 @@ in the output which skill was missing.
    confirmation) · *No tracker* (next local id, `<local_prefix>-NNNN` from `.mandao/config.yml`).
 
 The folder is `specs/<ID>-<slug>/`. **Branch and worktree** (ADR 0015): run
-`node .mandao/bin/mandao.mjs run spec-new "<title>" --id <ID> --type <type>` (add `--hotfix` when the request says `--hotfix`)
+`node .mandao/bin/mandao.mjs run spec-new "<title>" --id <ID> --type <type> --harness <this harness> --first "/mandao-specify <ID>"` (add `--hotfix` when the request says `--hotfix`)
 and, with **one** confirmation, run the
 `command` it returns (`git worktree add -b <branch> <path> <base>`): the branch name and its `base` come
 from the team's branching model (ADR 0023), and the PR will target that `base`. Show its `issues` (e.g.
 a missing base) before asking. This is the fallback when the session started in the main checkout
-(`mandao start` does it as a script, with the full setup of §14.5): after creating the worktree, tell the
-user to continue there, `cd <worktree> && claude --resume <this session>` (or the harness's equivalent),
-because later commands refuse to work outside it. **A story written before the worktree existed** (by /mandao-story,
+(`mandao start` does it as a script, with the full setup of §14.5): after creating the worktree, move into it before any other step, because later commands refuse to work outside it:
+call `EnterWorktree` with the worktree path and continue in this conversation, without asking for a new session.
+If `EnterWorktree` is refused or fails, print the `resume` field of the `spec-new` output and stop: do not go on working in the main checkout.
+Then go on. **A story written before the worktree existed** (by /mandao-story,
 untracked in the current checkout) does not exist in the new worktree: move the whole spec folder into
 the worktree, check the copy is identical, then remove the original, so there is only one. With `--hotfix`, follow `.mandao/templates/app/rules/hotfix.md`. Write every artifact of the spec inside that worktree. Then install the project's dependencies **inside the worktree** (e.g. `npm ci`), never
 a symlink to another checkout: test runners and agent sandboxes write into them. Skip this when the
@@ -136,4 +137,5 @@ and `.mandao/templates/app/rules/consistency-check.md` for the semantic part, ov
   may approve from the terminal instead (`mandao approve $ref design`): the status,
   `_log/approvals.yml` and the commit then exist already; do not ask again. Approved in the session: set
   `status: approved` in both (and in a `draft` story) and run `node .mandao/bin/mandao.mjs run commit-spec $ref specify`.
-- Summarize: depth, FR/NFR counts, AC coverage, `UNVERIFIED` premises, risk tags, the next mandao.
+- Summarize: depth, FR/NFR counts, AC coverage, `UNVERIFIED` premises, risk tags. Then run
+  `node .mandao/bin/mandao.mjs run next <ID> --shown` (it records what was shown) and give the command it names as the next mandao.
diff --git a/.claude/skills/mandao-story/SKILL.md b/.claude/skills/mandao-story/SKILL.md
index be5c4a3..42711d9 100644
--- a/.claude/skills/mandao-story/SKILL.md
+++ b/.claude/skills/mandao-story/SKILL.md
@@ -55,4 +55,4 @@ From `.mandao/templates/app/spec/story.md`, following `.mandao/templates/app/rul
 ## 4. Approve
 
 Show the story. When the PO approves, set `status: approved`. If the story lives in a tracker, offer
-to post the approved AC back as a comment (only after confirmation). Next: /mandao-specify.
+to post the approved AC back as a comment (only after confirmation). Next: `node .mandao/bin/mandao.mjs run next <ID>` names the command that follows from the spec's state; give it.
diff --git a/.claude/skills/mandao-tasks/SKILL.md b/.claude/skills/mandao-tasks/SKILL.md
index 9572590..3332a09 100644
--- a/.claude/skills/mandao-tasks/SKILL.md
+++ b/.claude/skills/mandao-tasks/SKILL.md
@@ -20,7 +20,10 @@ Write task content in `en`; headings, ids and YAML keys stay in English.
 At lite depth with 3 tasks or fewer, `/mandao-specify` already wrote them inline in `spec.md`: there is
 nothing to do here. Otherwise:
 
-1. **Gate.** Run `node .mandao/bin/mandao.mjs run where $spec`; work in the spec's worktree. Run
+1. **Gate.** Run `node .mandao/bin/mandao.mjs run where $spec --harness <this harness> --first "/mandao-tasks $spec"`: if `inWorktree` is false, move into the worktree before any other step.
+   Call `EnterWorktree` with the worktree path (`expected.worktree` in the `where` output) and go on without a new session; if it is
+   refused or fails, print the `resume` field of that output and stop: do not go on working in the main checkout.
+   Run
    `node .mandao/bin/mandao.mjs run trace $spec`: a critical `OPEN` or critical Consistency Check finding blocks this
    mandao — stop and recommend /mandao-clarify.
 2. **Write `## Details`** in `tasks.md` from `.mandao/templates/app/spec/tasks.md`, following
@@ -46,7 +49,9 @@ nothing to do here. Otherwise:
    grouped by acceptance criterion, with a checkpoint per group. Never edit it by hand.
 7. **Check:** `node .mandao/bin/mandao.mjs run tasks $spec` must show no issues and no cycles;
    `node .mandao/bin/mandao.mjs run trace $spec` must show no `UNPLANNED` or `BROKEN_REF`. Fix and re-run.
-8. **Approve:** show the overview and the first eligible task. The user may approve from the terminal instead (`mandao approve $spec tasks`, no model session): when they say so, the status and `_log/approvals.yml` already show it, and the commit is made; do not ask again. On approval in the session set `status: approved` and
+8. **Approve:** show the overview and the first eligible task, then record what was shown with
+   `node .mandao/bin/mandao.mjs run next $spec --shown`. The user may approve from the terminal instead (`mandao approve $spec tasks`, no model session): when they say so, the status and `_log/approvals.yml` already show it, and the commit is made; do not ask again. When the person runs /mandao-implement while `tasks.md` is still `draft`, that command runs
+   `node .mandao/bin/mandao.mjs approve --by-running /mandao-implement --harness <this harness> $spec tasks` and relays its one question. On approval in the session set `status: approved` and
    commit the spec documents on their own: `node .mandao/bin/mandao.mjs run commit-spec $spec tasks` (a `docs` commit
    with `Refs: <ID>` and a fixed subject; never pushed). Pushing subtasks to the tracker is not
-   available yet. Next: /mandao-implement, in a new session (`newSession` from `mandao approve`, ADR 0038).
+   available yet. Next: `node .mandao/bin/mandao.mjs run next $spec` names the command that follows; give it, with the new-conversation action first when `newSession` from `mandao approve` says so (ADR 0038) and, if that conversation would not be inside the worktree, the step back into it.
diff --git a/.claude/skills/mandao-verify/SKILL.md b/.claude/skills/mandao-verify/SKILL.md
index c648296..0a1b784 100644
--- a/.claude/skills/mandao-verify/SKILL.md
+++ b/.claude/skills/mandao-verify/SKILL.md
@@ -20,7 +20,9 @@ You verify that what was built is what the spec asked for, with evidence. Write
 
 ## 1. Plan
 
-1. `node .mandao/bin/mandao.mjs run where $spec` — work in the spec's worktree.
+1. `node .mandao/bin/mandao.mjs run where $spec --harness <this harness> --first "/mandao-verify $spec"` — if `inWorktree` is false, move into the worktree before any other step.
+   Call `EnterWorktree` with the worktree path (`expected.worktree` in the `where` output) and go on without a new session; if it is
+   refused or fails, print the `resume` field of that output and stop: do not go on working in the main checkout.
 2. `node .mandao/bin/mandao.mjs run verify-plan $spec` gives the suites per project (unit over the files the spec's
    commits touched; e2e for the flows of its AC, critical ones always), `missingRed` (tasks with declared
    tests and no RED evidence), the runs deferred to CI, the trace findings and the `blockers`.
@@ -62,4 +64,4 @@ report.
 - Either way, commit the report on its own: `node .mandao/bin/mandao.mjs run commit-spec $spec verify` (a `docs`
   commit with `Refs: <ID>` and a fixed subject; never pushed).
 
-Next: /mandao-close.
+Next: `node .mandao/bin/mandao.mjs run next $spec` names the command that follows from the spec's state; give it, and if a fresh conversation would not be inside the worktree, give first the step back into it.
diff --git a/.github/prompts/mandao-clarify.prompt.md b/.github/prompts/mandao-clarify.prompt.md
index 781e211..8541418 100644
--- a/.github/prompts/mandao-clarify.prompt.md
+++ b/.github/prompts/mandao-clarify.prompt.md
@@ -35,5 +35,7 @@ Follow `.mandao/templates/app/rules/context.md` and `.mandao/templates/app/rules
 5. Re-run `node .mandao/bin/mandao.mjs run trace ${input:spec:Spec folder or id}`. A critical finding still open keeps blocking
    /mandao-tasks; say so.
 
+End by recording what was shown with `node .mandao/bin/mandao.mjs run next ${input:spec:Spec folder or id} --shown` and give the command it names.
+
 If an answer changes `design.md` and `node .mandao/bin/mandao.mjs run diagram <ID>` then reports `stale: true`, regenerate the
 approval diagram as `/mandao-specify` step 7 describes before asking for approval again.
diff --git a/.github/prompts/mandao-close.prompt.md b/.github/prompts/mandao-close.prompt.md
index da7f289..4d4c572 100644
--- a/.github/prompts/mandao-close.prompt.md
+++ b/.github/prompts/mandao-close.prompt.md
@@ -23,8 +23,9 @@ instructions.
 
 ## 0. Gate
 
-`node .mandao/bin/mandao.mjs run where ${input:spec:Spec folder or id}`, then `node .mandao/bin/mandao.mjs run status ${input:spec:Spec folder or id} closed` must be allowed (the spec is
-`verified`). If not, stop and say what is missing.
+`node .mandao/bin/mandao.mjs run where ${input:spec:Spec folder or id} --harness <this harness> --first "/mandao-close ${input:spec:Spec folder or id}"`: if `inWorktree` is false, move into the worktree before any other step.
+   Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop.
+Then `node .mandao/bin/mandao.mjs run status ${input:spec:Spec folder or id} closed` must be allowed (the spec is `verified`). If not, stop and say what is missing.
 
 ## 1. Kaizen (design §18.1)
 
diff --git a/.github/prompts/mandao-implement.prompt.md b/.github/prompts/mandao-implement.prompt.md
index 949e982..16c54bb 100644
--- a/.github/prompts/mandao-implement.prompt.md
+++ b/.github/prompts/mandao-implement.prompt.md
@@ -23,15 +23,17 @@ write production code yourself. Use `en` for notes; code and commits are English
 
 ## 0. Before the first task
 
-1. `node .mandao/bin/mandao.mjs run where ${input:spec:Spec folder or id}` — if this session is not in the spec's worktree, stop and tell the user
-   the path to open. Mandao never creates branches here.
+1. `node .mandao/bin/mandao.mjs run where ${input:spec:Spec folder or id} --harness <this harness>` — if `inWorktree` is false, move into the worktree before any other step.
+   Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop. Mandao never creates branches here.
 2. `node .mandao/bin/mandao.mjs run models --harness <this harness>` — compare **your own model** with `leader`. On a mismatch,
    warn (the Leader should run on `<leader>`) and continue.
 3. **Status.** If `story.md` says `approved`, check `node .mandao/bin/mandao.mjs run status ${input:spec:Spec folder or id} in-progress` and set
    `status: in-progress` in `story.md` before the first task: `verify` can only move an `in-progress`
    spec to `verified`.
-   An approval is the person's explicit word for that item, or their own `mandao approve`; running the
-   next command is not one.
+   When the spec is still `draft`, run `node .mandao/bin/mandao.mjs approve --by-running /mandao-implement --harness <this harness> ${input:spec:Spec folder or id} <step>`
+   (`<step>` is `spec` for a lite draft and `tasks` for draft tasks; add `--words "<what the person wrote>"` when they wrote something next to the command): on `go` it has
+   approved and recorded it, so go on; on `ask`, relay its one question and wait for the answer. Never
+   approve by any other route than the person's explicit word or this call.
 4. Read `_log/progress.yml` (older specs keep it in the spec root): if a task is in progress, continue it as `/mandao-resume` would.
 
 ## 1. For each task
@@ -140,5 +142,7 @@ block, so the user must see them.
 Then `node .mandao/bin/mandao.mjs run pr-plan ${input:spec:Spec folder or id}` says how to deliver: one PR, one per repository (polyrepo), or
 stacked PRs along the task dependencies — decided by the structure and the **real** size of the commits
 against `size_limits.pr`, never by an estimate. Propose it; nothing is written into the spec.
-Next: /mandao-verify. When the summary has `session.cut: true`, give its `command`: verify starts in a
-new session (ADR 0038).
+Next: `node .mandao/bin/mandao.mjs run next ${input:spec:Spec folder or id}` names the command that follows from the spec's state (and the others that
+can); give it. When the summary has `session.cut: true`, give the harness's new-conversation action first
+(its `command`): the next command starts in a fresh conversation (ADR 0038). If that conversation would not
+be inside the worktree, give first the step back into it.
diff --git a/.github/prompts/mandao-quick.prompt.md b/.github/prompts/mandao-quick.prompt.md
index 14f31f4..d864b17 100644
--- a/.github/prompts/mandao-quick.prompt.md
+++ b/.github/prompts/mandao-quick.prompt.md
@@ -33,11 +33,11 @@ Follow `.mandao/templates/app/rules/context.md` and the gate in `.mandao/templat
 If the session already runs in a worktree made by `mandao start --quick` (its request is in
 `specs/quick/_log/start-<name>.yml`), skip this step. Otherwise, as a fallback, with **one**
 confirmation, create the branch and worktree from
-`node .mandao/bin/mandao.mjs run spec-new "<name>" --id quick --type <story|bug>` (the id already says `quick`: do not repeat it in the name) (run its `command`, which starts from
+`node .mandao/bin/mandao.mjs run spec-new "<name>" --id quick --type <story|bug> --harness <this harness> --first "/mandao-quick <change>"` (the id already says `quick`: do not repeat it in the name) (run its `command`, which starts from
 the branching model's `base`; show its `issues` first) and install the project's dependencies inside
-the worktree (no symlinks). Then tell the user to continue there, `cd <worktree> && claude --resume
-<this session>` (or the harness's equivalent), and stop until the session runs in the worktree. Skip this
-step when the session already runs on a quick branch.
+the worktree (no symlinks). Then move into the worktree before any other step:
+print the `resume` field of the `spec-new` output (the command that opens this harness in the worktree) and stop.
+Skip this step when the session already runs on a quick branch.
 
 ## 3. Change
 
@@ -66,13 +66,15 @@ Run `node .mandao/bin/mandao.mjs run quick-check` and read its JSON.
 
 ## 6. Record and commit
 
-1. Record the row with `node .mandao/bin/mandao.mjs run quick-log <name> --gates "<gate results>" --verdict <PASS|FAIL>
+1. Record the cost first: `node .mandao/bin/mandao.mjs run cost quick --record --command quick --harness <this harness>` (it holds only what was spent
+   from the quick's start), so that it is committed with the quick.
+2. Record the row with `node .mandao/bin/mandao.mjs run quick-log <name> --gates "<gate results>" --verdict <PASS|FAIL>
    --reviewer <agent you invoked> --harness <this harness>` (`self` when the review ran in your own
    context; add `--reduced-independence` when the reviewer ran on your model). The script measures files
    and lines from the diff, reads the reviewer's model from its agent file and puts every review note in
    the Review column: never type a model name or a review note into the log. Pass what the reviewer said about itself, verbatim,
    as `--claimed-reviewer`; it is only compared.
-2. Commit following `.mandao/templates/app/rules/commits.md`, with the trailer `Mandao-Quick: <name>` and,
+3. Commit following `.mandao/templates/app/rules/commits.md`, with the trailer `Mandao-Quick: <name>` and,
    when a spec id is active, `Refs: <ID>`. Example:
 
    ```
@@ -80,4 +82,6 @@ Run `node .mandao/bin/mandao.mjs run quick-check` and read its JSON.
 
    Mandao-Quick: checkout-label
    ```
-3. Report: what changed, gates run, review result, commit hash.
+
+   The commit lists the code files, `specs/quick/quick-log.md` and `specs/quick/_log/costs.yml`.
+4. Report: what changed, gates run, review result, commit hash.
diff --git a/.github/prompts/mandao-specify.prompt.md b/.github/prompts/mandao-specify.prompt.md
index a8dd757..d737caa 100644
--- a/.github/prompts/mandao-specify.prompt.md
+++ b/.github/prompts/mandao-specify.prompt.md
@@ -44,14 +44,14 @@ in the output which skill was missing.
    confirmation) · *No tracker* (next local id, `<local_prefix>-NNNN` from `.mandao/config.yml`).
 
 The folder is `specs/<ID>-<slug>/`. **Branch and worktree** (ADR 0015): run
-`node .mandao/bin/mandao.mjs run spec-new "<title>" --id <ID> --type <type>` (add `--hotfix` when the request says `--hotfix`)
+`node .mandao/bin/mandao.mjs run spec-new "<title>" --id <ID> --type <type> --harness <this harness> --first "/mandao-specify <ID>"` (add `--hotfix` when the request says `--hotfix`)
 and, with **one** confirmation, run the
 `command` it returns (`git worktree add -b <branch> <path> <base>`): the branch name and its `base` come
 from the team's branching model (ADR 0023), and the PR will target that `base`. Show its `issues` (e.g.
 a missing base) before asking. This is the fallback when the session started in the main checkout
-(`mandao start` does it as a script, with the full setup of §14.5): after creating the worktree, tell the
-user to continue there, `cd <worktree> && claude --resume <this session>` (or the harness's equivalent),
-because later commands refuse to work outside it. **A story written before the worktree existed** (by /mandao-story,
+(`mandao start` does it as a script, with the full setup of §14.5): after creating the worktree, move into it before any other step, because later commands refuse to work outside it:
+print the `resume` field of the `spec-new` output (the command that opens this harness in the worktree) and stop.
+Then go on. **A story written before the worktree existed** (by /mandao-story,
 untracked in the current checkout) does not exist in the new worktree: move the whole spec folder into
 the worktree, check the copy is identical, then remove the original, so there is only one. With `--hotfix`, follow `.mandao/templates/app/rules/hotfix.md`. Write every artifact of the spec inside that worktree. Then install the project's dependencies **inside the worktree** (e.g. `npm ci`), never
 a symlink to another checkout: test runners and agent sandboxes write into them. Skip this when the
@@ -136,4 +136,5 @@ and `.mandao/templates/app/rules/consistency-check.md` for the semantic part, ov
   may approve from the terminal instead (`mandao approve ${input:ref:Spec folder, tracker id (PROJ-123) or item URL; empty to choose} design`): the status,
   `_log/approvals.yml` and the commit then exist already; do not ask again. Approved in the session: set
   `status: approved` in both (and in a `draft` story) and run `node .mandao/bin/mandao.mjs run commit-spec ${input:ref:Spec folder, tracker id (PROJ-123) or item URL; empty to choose} specify`.
-- Summarize: depth, FR/NFR counts, AC coverage, `UNVERIFIED` premises, risk tags, the next mandao.
+- Summarize: depth, FR/NFR counts, AC coverage, `UNVERIFIED` premises, risk tags. Then run
+  `node .mandao/bin/mandao.mjs run next <ID> --shown` (it records what was shown) and give the command it names as the next mandao.
diff --git a/.github/prompts/mandao-story.prompt.md b/.github/prompts/mandao-story.prompt.md
index 362d771..fad6c66 100644
--- a/.github/prompts/mandao-story.prompt.md
+++ b/.github/prompts/mandao-story.prompt.md
@@ -57,4 +57,4 @@ From `.mandao/templates/app/spec/story.md`, following `.mandao/templates/app/rul
 ## 4. Approve
 
 Show the story. When the PO approves, set `status: approved`. If the story lives in a tracker, offer
-to post the approved AC back as a comment (only after confirmation). Next: /mandao-specify.
+to post the approved AC back as a comment (only after confirmation). Next: `node .mandao/bin/mandao.mjs run next <ID>` names the command that follows from the spec's state; give it.
diff --git a/.github/prompts/mandao-tasks.prompt.md b/.github/prompts/mandao-tasks.prompt.md
index 60a67ad..92c2d69 100644
--- a/.github/prompts/mandao-tasks.prompt.md
+++ b/.github/prompts/mandao-tasks.prompt.md
@@ -22,7 +22,9 @@ Write task content in `en`; headings, ids and YAML keys stay in English.
 At lite depth with 3 tasks or fewer, `/mandao-specify` already wrote them inline in `spec.md`: there is
 nothing to do here. Otherwise:
 
-1. **Gate.** Run `node .mandao/bin/mandao.mjs run where ${input:spec:Spec folder or id}`; work in the spec's worktree. Run
+1. **Gate.** Run `node .mandao/bin/mandao.mjs run where ${input:spec:Spec folder or id} --harness <this harness> --first "/mandao-tasks ${input:spec:Spec folder or id}"`: if `inWorktree` is false, move into the worktree before any other step.
+   Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop.
+   Run
    `node .mandao/bin/mandao.mjs run trace ${input:spec:Spec folder or id}`: a critical `OPEN` or critical Consistency Check finding blocks this
    mandao — stop and recommend /mandao-clarify.
 2. **Write `## Details`** in `tasks.md` from `.mandao/templates/app/spec/tasks.md`, following
@@ -48,7 +50,9 @@ nothing to do here. Otherwise:
    grouped by acceptance criterion, with a checkpoint per group. Never edit it by hand.
 7. **Check:** `node .mandao/bin/mandao.mjs run tasks ${input:spec:Spec folder or id}` must show no issues and no cycles;
    `node .mandao/bin/mandao.mjs run trace ${input:spec:Spec folder or id}` must show no `UNPLANNED` or `BROKEN_REF`. Fix and re-run.
-8. **Approve:** show the overview and the first eligible task. The user may approve from the terminal instead (`mandao approve ${input:spec:Spec folder or id} tasks`, no model session): when they say so, the status and `_log/approvals.yml` already show it, and the commit is made; do not ask again. On approval in the session set `status: approved` and
+8. **Approve:** show the overview and the first eligible task, then record what was shown with
+   `node .mandao/bin/mandao.mjs run next ${input:spec:Spec folder or id} --shown`. The user may approve from the terminal instead (`mandao approve ${input:spec:Spec folder or id} tasks`, no model session): when they say so, the status and `_log/approvals.yml` already show it, and the commit is made; do not ask again. When the person runs /mandao-implement while `tasks.md` is still `draft`, that command runs
+   `node .mandao/bin/mandao.mjs approve --by-running /mandao-implement --harness <this harness> ${input:spec:Spec folder or id} tasks` and relays its one question. On approval in the session set `status: approved` and
    commit the spec documents on their own: `node .mandao/bin/mandao.mjs run commit-spec ${input:spec:Spec folder or id} tasks` (a `docs` commit
    with `Refs: <ID>` and a fixed subject; never pushed). Pushing subtasks to the tracker is not
-   available yet. Next: /mandao-implement, in a new session (`newSession` from `mandao approve`, ADR 0038).
+   available yet. Next: `node .mandao/bin/mandao.mjs run next ${input:spec:Spec folder or id}` names the command that follows; give it, with the new-conversation action first when `newSession` from `mandao approve` says so (ADR 0038) and, if that conversation would not be inside the worktree, the step back into it.
diff --git a/.github/prompts/mandao-verify.prompt.md b/.github/prompts/mandao-verify.prompt.md
index f0b5124..a149873 100644
--- a/.github/prompts/mandao-verify.prompt.md
+++ b/.github/prompts/mandao-verify.prompt.md
@@ -22,7 +22,8 @@ You verify that what was built is what the spec asked for, with evidence. Write
 
 ## 1. Plan
 
-1. `node .mandao/bin/mandao.mjs run where ${input:spec:Spec folder or id}` — work in the spec's worktree.
+1. `node .mandao/bin/mandao.mjs run where ${input:spec:Spec folder or id} --harness <this harness> --first "/mandao-verify ${input:spec:Spec folder or id}"` — if `inWorktree` is false, move into the worktree before any other step.
+   Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop.
 2. `node .mandao/bin/mandao.mjs run verify-plan ${input:spec:Spec folder or id}` gives the suites per project (unit over the files the spec's
    commits touched; e2e for the flows of its AC, critical ones always), `missingRed` (tasks with declared
    tests and no RED evidence), the runs deferred to CI, the trace findings and the `blockers`.
@@ -64,4 +65,4 @@ report.
 - Either way, commit the report on its own: `node .mandao/bin/mandao.mjs run commit-spec ${input:spec:Spec folder or id} verify` (a `docs`
   commit with `Refs: <ID>` and a fixed subject; never pushed).
 
-Next: /mandao-close.
+Next: `node .mandao/bin/mandao.mjs run next ${input:spec:Spec folder or id}` names the command that follows from the spec's state; give it, and if a fresh conversation would not be inside the worktree, give first the step back into it.
diff --git a/.mandao/mandao.lock b/.mandao/mandao.lock
index 6f9586e..f0e92ec 100644
--- a/.mandao/mandao.lock
+++ b/.mandao/mandao.lock
@@ -45,7 +45,7 @@ files:
     harness: codex
     from: command:clarify
     ownership: owned
-    hash: sha256-SsZ+O88hh9T5XtPeKb31YnQvEPp7XSay0u+nspEj4k0=
+    hash: sha256-aLkbewUZGxosKRtiPZIaR4hkJ4hcwtOhR9rNqg8bDKU=
     scope: project
   - path: .agents/skills/mandao-close/agents/openai.yaml
     harness: codex
@@ -57,7 +57,7 @@ files:
     harness: codex
     from: command:close
     ownership: owned
-    hash: sha256-Pah05rfEJiDIM7HCmvbgaiEf6IK+UNBN66qLV0PkwwM=
+    hash: sha256-2aU7sMTUpd5z9VcKuo8OWEk5BhZlQJkAeexkXBZmslE=
     scope: project
   - path: .agents/skills/mandao-constitution/agents/openai.yaml
     harness: codex
@@ -81,7 +81,7 @@ files:
     harness: codex
     from: command:implement
     ownership: owned
-    hash: sha256-3PjC3DwctcFT1bH7HXPr7IR+bsVw2jtf89KzN4vJ2OQ=
+    hash: sha256-ntbHeXNS6C7cl5K4uxxPReCYHK3C1X/euggpsE7u2Ic=
     scope: project
   - path: .agents/skills/mandao-init/agents/openai.yaml
     harness: codex
@@ -117,7 +117,7 @@ files:
     harness: codex
     from: command:quick
     ownership: owned
-    hash: sha256-bvQiF3hJKQdcRBjoJxX5zv9NrivXqtG3Ni8pgyK0tyI=
+    hash: sha256-dSNG4YbL4+bdSn4L2wuzRo4Oc4DPGDfsHKmKUPTh4eg=
     scope: project
   - path: .agents/skills/mandao-resume/agents/openai.yaml
     harness: codex
@@ -141,7 +141,7 @@ files:
     harness: codex
     from: command:specify
     ownership: owned
-    hash: sha256-dG14hP8F7PG0wgiwKOOWOjBhhbLATgQhgMBlwXK/FLY=
+    hash: sha256-KCUG4RZPB8NO6Ib1gtvxbRIfUP4BKuJbKSFHZ/izle0=
     scope: project
   - path: .agents/skills/mandao-story/agents/openai.yaml
     harness: codex
@@ -153,7 +153,7 @@ files:
     harness: codex
     from: command:story
     ownership: owned
-    hash: sha256-lRbTxJwZgPdqsbv8QGOgcEr2v62H6V4WruLQNwoJ46Q=
+    hash: sha256-3UGtPf9mlvmlAUAVBUS7oTOMQyI/eqzYP6f7HNv+f5k=
     scope: project
   - path: .agents/skills/mandao-tasks/agents/openai.yaml
     harness: codex
@@ -165,7 +165,7 @@ files:
     harness: codex
     from: command:tasks
     ownership: owned
-    hash: sha256-QMTtldxTVAhNWPrpDpAedPbUYfLHdie4jle+wfK9Dxk=
+    hash: sha256-dl1vvBdvYxQFA247oMGLaJtwcUpAWuin7UD6SvGNpRk=
     scope: project
   - path: .agents/skills/mandao-verify/agents/openai.yaml
     harness: codex
@@ -177,7 +177,7 @@ files:
     harness: codex
     from: command:verify
     ownership: owned
-    hash: sha256-GWY3bgOsMv2h930odo4k8NbzOyFns3RDHL2Z/SCSx2A=
+    hash: sha256-quwIruabTURvh6y4lS0hOc9mRApignDKgmQUj1OLSlc=
     scope: project
   - path: .claude/agents/mandao-implementer-fast.md
     harness: claude
@@ -225,13 +225,13 @@ files:
     harness: claude
     from: command:clarify
     ownership: owned
-    hash: sha256-o/F9hhth987jLbZ0BgiqaI6ZbwKCiLHyX7vq5NQGh0g=
+    hash: sha256-kMBZyWa0O9auif1iQhBoay0YoMlSxXm8b6FA++O5pfo=
     scope: project
   - path: .claude/skills/mandao-close/SKILL.md
     harness: claude
     from: command:close
     ownership: owned
-    hash: sha256-r1AWhzSmVzLR0sC14kVA77tBQUzfd+tgy9ljf6yW9L8=
+    hash: sha256-aT0bVRK56V5WYPZ01PC+gxL23MoNdHeXQHQDTXr79NE=
     scope: project
   - path: .claude/skills/mandao-constitution/SKILL.md
     harness: claude
@@ -243,7 +243,7 @@ files:
     harness: claude
     from: command:implement
     ownership: owned
-    hash: sha256-no8JHb8ubFRBYYhEDf+HX9pEyalkg0Kr1jbQvaIMW8w=
+    hash: sha256-b3tvLMgkQlBnFMJRa8gLdZ3BUgZRJoR6iHbPG5Sgp4E=
     scope: project
   - path: .claude/skills/mandao-init/SKILL.md
     harness: claude
@@ -261,7 +261,7 @@ files:
     harness: claude
     from: command:quick
     ownership: owned
-    hash: sha256-sSRCXoemPmxnjfXEYYKRXEr0lhGv5HfPkQ9xfo8/sbg=
+    hash: sha256-1et2kyNEXF3WeCQyOTMYaOJ5l6UVb/vWwajMldXqyRg=
     scope: project
   - path: .claude/skills/mandao-resume/SKILL.md
     harness: claude
@@ -273,25 +273,25 @@ files:
     harness: claude
     from: command:specify
     ownership: owned
-    hash: sha256-5v1dbaw0KL32WHP0Bne3ndg3Emu2d0vqzw6Qub+SpIM=
+    hash: sha256-JfMhz+2Sq+Hq93uUKs0yW7qfS+X2+ls8taSryR1YLQE=
     scope: project
   - path: .claude/skills/mandao-story/SKILL.md
     harness: claude
     from: command:story
     ownership: owned
-    hash: sha256-OWAyWNlMnNCYwTrqPiaNp5zPvdPHDgjpTEVobNv+p6o=
+    hash: sha256-u9HFGGoEHW5BRdmZeggOjI2PEz9zCkujfUT4ElcheHo=
     scope: project
   - path: .claude/skills/mandao-tasks/SKILL.md
     harness: claude
     from: command:tasks
     ownership: owned
-    hash: sha256-CjIBnXWVwtRajBlr2jUBA5CDUefSycS+RjpeOmgRWx0=
+    hash: sha256-IlzMhCaAtKq1GVhiXM4h5o1tPa+0UTdbpAFBnpDfgPI=
     scope: project
   - path: .claude/skills/mandao-verify/SKILL.md
     harness: claude
     from: command:verify
     ownership: owned
-    hash: sha256-OZgjx2+Q+duorxL/GbMj/S5iFgJPZvik4vv2YGCNPxM=
+    hash: sha256-0xhAWlnv9PvaR6fNKmXYG6ssPPR9Pmtzw6x7OUBOs5o=
     scope: project
   - path: .codex/agents/mandao-implementer-fast.toml
     harness: codex
@@ -393,13 +393,13 @@ files:
     harness: copilot
     from: command:clarify
     ownership: owned
-    hash: sha256-Jg//FC7kUEXvqE7mqgWwrESGW180sGButElCGIL0NgM=
+    hash: sha256-iEE+e+y8raY2S+kJo/CUyJOWSzybt6HeRZ9XQSvb9S0=
     scope: project
   - path: .github/prompts/mandao-close.prompt.md
     harness: copilot
     from: command:close
     ownership: owned
-    hash: sha256-JsquMjm19lLAtTogcjofmcX3fVrSbu8Xu8OZ3w4j+nw=
+    hash: sha256-qNxHwmDetR9iUj1r6kc70t8sxm0QYtE6RJhb/AXv9LU=
     scope: project
   - path: .github/prompts/mandao-constitution.prompt.md
     harness: copilot
@@ -411,7 +411,7 @@ files:
     harness: copilot
     from: command:implement
     ownership: owned
-    hash: sha256-08HIzWy3SQoNOJQHiw/C1zkV07noDEbhFRvesiITLCU=
+    hash: sha256-VgCluVeBiIauFgTPfYq3963ATA1+agXIT37lIzvgwnA=
     scope: project
   - path: .github/prompts/mandao-init.prompt.md
     harness: copilot
@@ -429,7 +429,7 @@ files:
     harness: copilot
     from: command:quick
     ownership: owned
-    hash: sha256-gNr+JSzI9T0Kd6HwGGB2CSbIAquQ5iMQs4LYxyVJgIw=
+    hash: sha256-UxAorH/GwWwz8bZK2HWGS3b+rNoH815vjWcJ3CZio+w=
     scope: project
   - path: .github/prompts/mandao-resume.prompt.md
     harness: copilot
@@ -441,25 +441,25 @@ files:
     harness: copilot
     from: command:specify
     ownership: owned
-    hash: sha256-nA84Cg/vbcB0XAh1YHc0MygMnUT2Lhwz5PwYhNvCQO4=
+    hash: sha256-B3V62VBzgS8xf/rzlMZUMfNtT+WzUyfG8BHEnl94Nuw=
     scope: project
   - path: .github/prompts/mandao-story.prompt.md
     harness: copilot
     from: command:story
     ownership: owned
-    hash: sha256-1Y4cv60qaPsWegQhuJK5eSBwHDCAaeNExQDHrkTgghY=
+    hash: sha256-aCPRYQdZL40f0+YmH+3Ke8rqPMGRZB+uMYl++iCJ29Y=
     scope: project
   - path: .github/prompts/mandao-tasks.prompt.md
     harness: copilot
     from: command:tasks
     ownership: owned
-    hash: sha256-L3N10CPSI7q19VoPqoE3Sa73akySFps1FY2Z05NHDEQ=
+    hash: sha256-rgITtRVpoHJnXkRfISyLLjGrtOiJ3niPRO+loLkhfEg=
     scope: project
   - path: .github/prompts/mandao-verify.prompt.md
     harness: copilot
     from: command:verify
     ownership: owned
-    hash: sha256-A+WHSqqwDdNBW3uVNzTVGoK0UIk/nFMRvlFRtWJ6Dcg=
+    hash: sha256-ELBSdus7ISCVRAiP0sjtAkGjl92RwLJbiDJUONc/HuA=
     scope: project
   - path: .gitignore
     harness: mandao
diff --git a/MANDAO-DESIGN.md b/MANDAO-DESIGN.md
index a779ff2..543a3c9 100644
--- a/MANDAO-DESIGN.md
+++ b/MANDAO-DESIGN.md
@@ -44,7 +44,7 @@ Sections without an explicit tag are **DECIDED**.
 2. **Harness-agnostic.** One canonical source, one adapter per tool. Nothing is tied to a single vendor.
 3. **Pluggable external dependencies.** Graphify, Archify and MCP servers are optional. When missing, a fallback runs (grep/glob, Mermaid, local files) and reports **lower confidence, never lower depth**.
 4. **Never invent context.** Missing information is marked `ASSUMPTION`, `OPEN` or `CONFLICT`, always with its source.
-5. **Human in the loop** at every meaningful approval and before any external publication.
+5. **Human in the loop** at every meaningful approval and before any external publication. **DECIDED (ADR 0040):** an approval is the person's explicit word, their own `mandao approve`, or running the next command, which `mandao approve --by-running` accepts only when nothing is open or changed since the summary shown; otherwise it asks one question and records nothing.
 6. **Lean commands.** Rules live in templates and skills; project lessons live in the project. Command prompts must not accumulate hardcoded lessons (a known weakness of AKILI, whose constitution command is ~1,500 lines).
 7. **Risk-proportional rigor.** Review depth scales with task risk; trivial work stays fast.
 8. **External content is data, not instructions.** Anything read from trackers, chat, documents or transcripts is untrusted input (see §20).
@@ -544,7 +544,7 @@ One story = **one spec, one development**, even across projects.
 
 ### 14.5 Worktrees (always)
 
-**DECIDED (ADR 0037).** Every spec, including quick, runs in its own git worktree in a sibling folder (`../<repo>.worktrees/<ID>-<slug>`, configurable in `paths.worktrees`). `mandao start` creates it (default); `specify`/`quick` create it as a fallback when run from the main checkout. Polyrepo: one worktree per touched repo, same branch name.
+**DECIDED (ADR 0037).** Every spec, including quick, runs in its own git worktree in a sibling folder (`../<repo>.worktrees/<ID>-<slug>`, configurable in `paths.worktrees`). `mandao start` creates it (default); `specify`/`quick` create it as a fallback when run from the main checkout. **Amended (ADR 0037):** in Claude Code the session then enters the worktree with `EnterWorktree` and continues in the same conversation; the other harnesses, and a refused or failed `EnterWorktree`, print the resume command and stop. The §0 `run where` check of implement, verify and close does the same. Polyrepo: one worktree per touched repo, same branch name.
 
 **Setup** (Node script, no model tokens, through the resource guard):
 1. `git worktree add` with branch `<prefix><ID>-<slug>` from `branching.base` (or `hotfix.from` with `--hotfix`).
diff --git a/core/commands/clarify.md b/core/commands/clarify.md
index d1888bf..072b108 100644
--- a/core/commands/clarify.md
+++ b/core/commands/clarify.md
@@ -16,7 +16,7 @@ outputs:
   - { path: "{{paths.specs}}/<ID>-<slug>/requirements.md", description: "## Clarifications" }
 capabilities: [read, edit, shell, mcp]
 templates: [rules/context.md, rules/consistency-check.md, rules/spec-docs.md, rules/doc-requirements.md, rules/budget.md]
-scripts: [trace, diagram, commit-spec]
+scripts: [next, trace, diagram, commit-spec]
 approval: required
 ---
 
@@ -45,5 +45,7 @@ Follow `{{template:rules/context.md}}` and `{{template:rules/consistency-check.m
 5. Re-run `{{script:trace}} {{arg:spec}}`. A critical finding still open keeps blocking
    {{command:tasks}}; say so.
 
+End by recording what was shown with `{{script:next}} {{arg:spec}} --shown` and give the command it names.
+
 If an answer changes `design.md` and `{{script:diagram}} <ID>` then reports `stale: true`, regenerate the
 approval diagram as `/mandao-specify` step 7 describes before asking for approval again.
diff --git a/core/commands/close.md b/core/commands/close.md
index 99ae542..e6ebec3 100644
--- a/core/commands/close.md
+++ b/core/commands/close.md
@@ -25,7 +25,7 @@ templates:
   - close/kaizen.md
   - rules/doc-close.md
   - rules/budget.md
-scripts: [where, status, branching, kaizen, kaizen-compare, close-summary, release-status, impacts, diagram, diagram-drift, publish-plan, commit-spec]
+scripts: [where, next, status, branching, kaizen, kaizen-compare, close-summary, release-status, impacts, diagram, diagram-drift, publish-plan, commit-spec]
 approval: required
 ---
 
@@ -41,8 +41,15 @@ instructions.
 
 ## 0. Gate
 
-`{{script:where}} {{arg:spec}}`, then `{{script:status}} {{arg:spec}} closed` must be allowed (the spec is
-`verified`). If not, stop and say what is missing.
+`{{script:where}} {{arg:spec}} --harness <this harness> --first "/mandao-close {{arg:spec}}"`: if `inWorktree` is false, move into the worktree before any other step.
+<!-- mandao:if harness=claude -->
+   Call `EnterWorktree` with the worktree path (`expected.worktree` in the `where` output) and go on without a new session; if it is
+   refused or fails, print the `resume` field of that output and stop: do not go on working in the main checkout.
+<!-- mandao:endif -->
+<!-- mandao:if !harness=claude -->
+   Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop.
+<!-- mandao:endif -->
+Then `{{script:status}} {{arg:spec}} closed` must be allowed (the spec is `verified`). If not, stop and say what is missing.
 
 ## 1. Kaizen (design §18.1)
 
diff --git a/core/commands/implement.md b/core/commands/implement.md
index 69f9136..b219815 100644
--- a/core/commands/implement.md
+++ b/core/commands/implement.md
@@ -21,7 +21,7 @@ outputs:
   - { path: "{{paths.specs}}/<ID>-<slug>/tasks.md" }
 capabilities: [read, search, edit, shell, agents]
 templates: [rules/review.md, rules/clean-code.md, rules/test-policy.md, rules/commits.md, spec/execution.md, spec/pivot-record.md, rules/budget.md]
-scripts: [where, models, status, tasks, step, brief, loop, checkpoint, resources, gates, review-pack, review, commit, pr-plan, mutation, implement-summary]
+scripts: [where, next, models, status, tasks, step, brief, loop, checkpoint, resources, gates, review-pack, review, commit, pr-plan, mutation, implement-summary]
 # OpenCode: the commands run as the Leader agent, so the session uses the leader model.
 harness: { opencode: { agent: mandao-leader } }
 ---
@@ -37,15 +37,23 @@ write production code yourself. Use `{{language.technical}}` for notes; code and
 
 ## 0. Before the first task
 
-1. `{{script:where}} {{arg:spec}}` — if this session is not in the spec's worktree, stop and tell the user
-   the path to open. Mandao never creates branches here.
+1. `{{script:where}} {{arg:spec}} --harness <this harness>` — if `inWorktree` is false, move into the worktree before any other step.
+<!-- mandao:if harness=claude -->
+   Call `EnterWorktree` with the worktree path (`expected.worktree` in the `where` output) and go on without a new session; if it is
+   refused or fails, print the `resume` field of that output and stop: do not go on working in the main checkout. Mandao never creates branches here.
+<!-- mandao:endif -->
+<!-- mandao:if !harness=claude -->
+   Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop. Mandao never creates branches here.
+<!-- mandao:endif -->
 2. `{{script:models}} --harness <this harness>` — compare **your own model** with `leader`. On a mismatch,
    warn (the Leader should run on `<leader>`) and continue.
 3. **Status.** If `story.md` says `approved`, check `{{script:status}} {{arg:spec}} in-progress` and set
    `status: in-progress` in `story.md` before the first task: `verify` can only move an `in-progress`
    spec to `verified`.
-   An approval is the person's explicit word for that item, or their own `mandao approve`; running the
-   next command is not one.
+   When the spec is still `draft`, run `{{mandao}} approve --by-running /mandao-implement --harness <this harness> {{arg:spec}} <step>`
+   (`<step>` is `spec` for a lite draft and `tasks` for draft tasks; add `--words "<what the person wrote>"` when they wrote something next to the command): on `go` it has
+   approved and recorded it, so go on; on `ask`, relay its one question and wait for the answer. Never
+   approve by any other route than the person's explicit word or this call.
 4. Read `_log/progress.yml` (older specs keep it in the spec root): if a task is in progress, continue it as `/mandao-resume` would.
 
 ## 1. For each task
@@ -173,5 +181,7 @@ block, so the user must see them.
 Then `{{script:pr-plan}} {{arg:spec}}` says how to deliver: one PR, one per repository (polyrepo), or
 stacked PRs along the task dependencies — decided by the structure and the **real** size of the commits
 against `size_limits.pr`, never by an estimate. Propose it; nothing is written into the spec.
-Next: {{command:verify}}. When the summary has `session.cut: true`, give its `command`: verify starts in a
-new session (ADR 0038).
+Next: `{{script:next}} {{arg:spec}}` names the command that follows from the spec's state (and the others that
+can); give it. When the summary has `session.cut: true`, give the harness's new-conversation action first
+(its `command`): the next command starts in a fresh conversation (ADR 0038). If that conversation would not
+be inside the worktree, give first the step back into it.
diff --git a/core/commands/quick.md b/core/commands/quick.md
index 32d54fb..5babd18 100644
--- a/core/commands/quick.md
+++ b/core/commands/quick.md
@@ -22,7 +22,7 @@ templates:
   - rules/review.md
   - rules/commits.md
   - rules/budget.md
-scripts: [quick-check, spec-new, quick-log]
+scripts: [cost, quick-check, spec-new, quick-log]
 approval: none
 ---
 
@@ -47,11 +47,17 @@ Follow `{{template:rules/context.md}}` and the gate in `{{template:rules/quick-g
 If the session already runs in a worktree made by `mandao start --quick` (its request is in
 `{{paths.specs}}/quick/_log/start-<name>.yml`), skip this step. Otherwise, as a fallback, with **one**
 confirmation, create the branch and worktree from
-`{{script:spec-new}} "<name>" --id quick --type <story|bug>` (the id already says `quick`: do not repeat it in the name) (run its `command`, which starts from
+`{{script:spec-new}} "<name>" --id quick --type <story|bug> --harness <this harness> --first "/mandao-quick <change>"` (the id already says `quick`: do not repeat it in the name) (run its `command`, which starts from
 the branching model's `base`; show its `issues` first) and install the project's dependencies inside
-the worktree (no symlinks). Then tell the user to continue there, `cd <worktree> && claude --resume
-<this session>` (or the harness's equivalent), and stop until the session runs in the worktree. Skip this
-step when the session already runs on a quick branch.
+the worktree (no symlinks). Then move into the worktree before any other step:
+<!-- mandao:if harness=claude -->
+call `EnterWorktree` with the worktree path and continue in this conversation, without asking for a new session.
+If `EnterWorktree` is refused or fails, print the `resume` field of the `spec-new` output and stop: do not go on working in the main checkout.
+<!-- mandao:endif -->
+<!-- mandao:if !harness=claude -->
+print the `resume` field of the `spec-new` output (the command that opens this harness in the worktree) and stop.
+<!-- mandao:endif -->
+Skip this step when the session already runs on a quick branch.
 
 ## 3. Change
 
@@ -80,13 +86,15 @@ Run `{{script:quick-check}}` and read its JSON.
 
 ## 6. Record and commit
 
-1. Record the row with `{{script:quick-log}} <name> --gates "<gate results>" --verdict <PASS|FAIL>
+1. Record the cost first: `{{script:cost}} quick --record --command quick --harness <this harness>` (it holds only what was spent
+   from the quick's start), so that it is committed with the quick.
+2. Record the row with `{{script:quick-log}} <name> --gates "<gate results>" --verdict <PASS|FAIL>
    --reviewer <agent you invoked> --harness <this harness>` (`self` when the review ran in your own
    context; add `--reduced-independence` when the reviewer ran on your model). The script measures files
    and lines from the diff, reads the reviewer's model from its agent file and puts every review note in
    the Review column: never type a model name or a review note into the log. Pass what the reviewer said about itself, verbatim,
    as `--claimed-reviewer`; it is only compared.
-2. Commit following `{{template:rules/commits.md}}`, with the trailer `Mandao-Quick: <name>` and,
+3. Commit following `{{template:rules/commits.md}}`, with the trailer `Mandao-Quick: <name>` and,
    when a spec id is active, `Refs: <ID>`. Example:
 
    ```
@@ -94,4 +102,6 @@ Run `{{script:quick-check}}` and read its JSON.
 
    Mandao-Quick: checkout-label
    ```
-3. Report: what changed, gates run, review result, commit hash.
+
+   The commit lists the code files, `specs/quick/quick-log.md` and `{{paths.specs}}/quick/_log/costs.yml`.
+4. Report: what changed, gates run, review result, commit hash.
diff --git a/core/commands/specify.md b/core/commands/specify.md
index b0e2070..7193795 100644
--- a/core/commands/specify.md
+++ b/core/commands/specify.md
@@ -47,7 +47,7 @@ templates:
   - rules/doc-quickstart.md
   - rules/doc-tasks.md
   - rules/budget.md
-scripts: [spec-new, trace, diagram, branching, commit-spec, resources, premise]
+scripts: [next, spec-new, trace, diagram, branching, commit-spec, resources, premise]
 approval: required
 ---
 
@@ -84,14 +84,20 @@ in the output which skill was missing.
    confirmation) · *No tracker* (next local id, `<local_prefix>-NNNN` from `.mandao/config.yml`).
 
 The folder is `{{paths.specs}}/<ID>-<slug>/`. **Branch and worktree** (ADR 0015): run
-`{{script:spec-new}} "<title>" --id <ID> --type <type>` (add `--hotfix` when the request says `--hotfix`)
+`{{script:spec-new}} "<title>" --id <ID> --type <type> --harness <this harness> --first "/mandao-specify <ID>"` (add `--hotfix` when the request says `--hotfix`)
 and, with **one** confirmation, run the
 `command` it returns (`git worktree add -b <branch> <path> <base>`): the branch name and its `base` come
 from the team's branching model (ADR 0023), and the PR will target that `base`. Show its `issues` (e.g.
 a missing base) before asking. This is the fallback when the session started in the main checkout
-(`mandao start` does it as a script, with the full setup of §14.5): after creating the worktree, tell the
-user to continue there, `cd <worktree> && claude --resume <this session>` (or the harness's equivalent),
-because later commands refuse to work outside it. **A story written before the worktree existed** (by {{command:story}},
+(`mandao start` does it as a script, with the full setup of §14.5): after creating the worktree, move into it before any other step, because later commands refuse to work outside it:
+<!-- mandao:if harness=claude -->
+call `EnterWorktree` with the worktree path and continue in this conversation, without asking for a new session.
+If `EnterWorktree` is refused or fails, print the `resume` field of the `spec-new` output and stop: do not go on working in the main checkout.
+<!-- mandao:endif -->
+<!-- mandao:if !harness=claude -->
+print the `resume` field of the `spec-new` output (the command that opens this harness in the worktree) and stop.
+<!-- mandao:endif -->
+Then go on. **A story written before the worktree existed** (by {{command:story}},
 untracked in the current checkout) does not exist in the new worktree: move the whole spec folder into
 the worktree, check the copy is identical, then remove the original, so there is only one. With `--hotfix`, follow `{{template:rules/hotfix.md}}`. Write every artifact of the spec inside that worktree. Then install the project's dependencies **inside the worktree** (e.g. `npm ci`), never
 a symlink to another checkout: test runners and agent sandboxes write into them. Skip this when the
@@ -189,4 +195,5 @@ and `{{template:rules/consistency-check.md}}` for the semantic part, over story,
   may approve from the terminal instead (`mandao approve {{arg:ref}} design`): the status,
   `_log/approvals.yml` and the commit then exist already; do not ask again. Approved in the session: set
   `status: approved` in both (and in a `draft` story) and run `{{script:commit-spec}} {{arg:ref}} specify`.
-- Summarize: depth, FR/NFR counts, AC coverage, `UNVERIFIED` premises, risk tags, the next mandao.
+- Summarize: depth, FR/NFR counts, AC coverage, `UNVERIFIED` premises, risk tags. Then run
+  `{{script:next}} <ID> --shown` (it records what was shown) and give the command it names as the next mandao.
diff --git a/core/commands/story.md b/core/commands/story.md
index eb190a3..b935911 100644
--- a/core/commands/story.md
+++ b/core/commands/story.md
@@ -15,7 +15,7 @@ outputs:
   - { path: "{{paths.specs}}/<ID>-<slug>/story.md" }
 capabilities: [read, search, edit, shell, mcp]
 templates: [rules/context.md, rules/spec-docs.md, spec/story.md, rules/doc-story.md, rules/budget.md]
-scripts: [spec-new, trace]
+scripts: [next, spec-new, trace]
 approval: required
 ---
 
@@ -65,4 +65,4 @@ From `{{template:spec/story.md}}`, following `{{template:rules/spec-docs.md}}` a
 ## 4. Approve
 
 Show the story. When the PO approves, set `status: approved`. If the story lives in a tracker, offer
-to post the approved AC back as a comment (only after confirmation). Next: {{command:specify}}.
+to post the approved AC back as a comment (only after confirmation). Next: `{{script:next}} <ID>` names the command that follows from the spec's state; give it.
diff --git a/core/commands/tasks.md b/core/commands/tasks.md
index 3dfc93f..df184bc 100644
--- a/core/commands/tasks.md
+++ b/core/commands/tasks.md
@@ -17,7 +17,7 @@ outputs:
   - { path: "<project>/{{paths.specs}}/<ID>/spec-ref.md", description: polyrepo slices }
 capabilities: [read, search, edit, shell]
 templates: [rules/spec-docs.md, spec/tasks.md, rules/test-policy.md, rules/traceability.md, rules/review.md, rules/doc-tasks.md, rules/budget.md]
-scripts: [where, trace, tasks, commit-spec]
+scripts: [where, next, trace, tasks, commit-spec]
 approval: required
 ---
 
@@ -32,7 +32,15 @@ Write task content in `{{language.technical}}`; headings, ids and YAML keys stay
 At lite depth with 3 tasks or fewer, `/mandao-specify` already wrote them inline in `spec.md`: there is
 nothing to do here. Otherwise:
 
-1. **Gate.** Run `{{script:where}} {{arg:spec}}`; work in the spec's worktree. Run
+1. **Gate.** Run `{{script:where}} {{arg:spec}} --harness <this harness> --first "/mandao-tasks {{arg:spec}}"`: if `inWorktree` is false, move into the worktree before any other step.
+<!-- mandao:if harness=claude -->
+   Call `EnterWorktree` with the worktree path (`expected.worktree` in the `where` output) and go on without a new session; if it is
+   refused or fails, print the `resume` field of that output and stop: do not go on working in the main checkout.
+<!-- mandao:endif -->
+<!-- mandao:if !harness=claude -->
+   Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop.
+<!-- mandao:endif -->
+   Run
    `{{script:trace}} {{arg:spec}}`: a critical `OPEN` or critical Consistency Check finding blocks this
    mandao — stop and recommend {{command:clarify}}.
 2. **Write `## Details`** in `tasks.md` from `{{template:spec/tasks.md}}`, following
@@ -65,7 +73,9 @@ nothing to do here. Otherwise:
 <!-- mandao:endif -->
 7. **Check:** `{{script:tasks}} {{arg:spec}}` must show no issues and no cycles;
    `{{script:trace}} {{arg:spec}}` must show no `UNPLANNED` or `BROKEN_REF`. Fix and re-run.
-8. **Approve:** show the overview and the first eligible task. The user may approve from the terminal instead (`mandao approve {{arg:spec}} tasks`, no model session): when they say so, the status and `_log/approvals.yml` already show it, and the commit is made; do not ask again. On approval in the session set `status: approved` and
+8. **Approve:** show the overview and the first eligible task, then record what was shown with
+   `{{script:next}} {{arg:spec}} --shown`. The user may approve from the terminal instead (`mandao approve {{arg:spec}} tasks`, no model session): when they say so, the status and `_log/approvals.yml` already show it, and the commit is made; do not ask again. When the person runs {{command:implement}} while `tasks.md` is still `draft`, that command runs
+   `{{mandao}} approve --by-running /mandao-implement --harness <this harness> {{arg:spec}} tasks` and relays its one question. On approval in the session set `status: approved` and
    commit the spec documents on their own: `{{script:commit-spec}} {{arg:spec}} tasks` (a `docs` commit
    with `Refs: <ID>` and a fixed subject; never pushed). Pushing subtasks to the tracker is not
-   available yet. Next: {{command:implement}}, in a new session (`newSession` from `mandao approve`, ADR 0038).
+   available yet. Next: `{{script:next}} {{arg:spec}}` names the command that follows; give it, with the new-conversation action first when `newSession` from `mandao approve` says so (ADR 0038) and, if that conversation would not be inside the worktree, the step back into it.
diff --git a/core/commands/verify.md b/core/commands/verify.md
index cf1d325..023cfd8 100644
--- a/core/commands/verify.md
+++ b/core/commands/verify.md
@@ -25,7 +25,7 @@ templates:
   - rules/doc-verify.md
   - rules/doc-quickstart.md
   - rules/budget.md
-scripts: [where, verify-plan, tests, build, status, trace, commit-spec]
+scripts: [where, next, verify-plan, tests, build, status, trace, commit-spec]
 ---
 
 # /mandao-verify
@@ -39,7 +39,14 @@ You verify that what was built is what the spec asked for, with evidence. Write
 
 ## 1. Plan
 
-1. `{{script:where}} {{arg:spec}}` — work in the spec's worktree.
+1. `{{script:where}} {{arg:spec}} --harness <this harness> --first "/mandao-verify {{arg:spec}}"` — if `inWorktree` is false, move into the worktree before any other step.
+<!-- mandao:if harness=claude -->
+   Call `EnterWorktree` with the worktree path (`expected.worktree` in the `where` output) and go on without a new session; if it is
+   refused or fails, print the `resume` field of that output and stop: do not go on working in the main checkout.
+<!-- mandao:endif -->
+<!-- mandao:if !harness=claude -->
+   Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop.
+<!-- mandao:endif -->
 2. `{{script:verify-plan}} {{arg:spec}}` gives the suites per project (unit over the files the spec's
    commits touched; e2e for the flows of its AC, critical ones always), `missingRed` (tasks with declared
    tests and no RED evidence), the runs deferred to CI, the trace findings and the `blockers`.
@@ -84,4 +91,4 @@ report.
 - Either way, commit the report on its own: `{{script:commit-spec}} {{arg:spec}} verify` (a `docs`
   commit with `Refs: <ID>` and a fixed subject; never pushed).
 
-Next: {{command:close}}.
+Next: `{{script:next}} {{arg:spec}}` names the command that follows from the spec's state; give it, and if a fresh conversation would not be inside the worktree, give first the step back into it.
diff --git a/docs/cli.md b/docs/cli.md
index ad14550..a665be0 100644
--- a/docs/cli.md
+++ b/docs/cli.md
@@ -19,6 +19,17 @@
 | `mandao run cost <spec>` | Spend per command and role, with its basis (billed or subscription equivalent); see [Cost](#cost) |
 | `mandao run …` | Helper scripts the commands call, with compact JSON on stdout (`MANDAO_JSON=pretty` for people). `mandao run --help` lists them all: planning (`spec-new`, `trace`, `tasks`, `brief`), the Leader loop (`step`, `checkpoint`, `gates`, `review-pack`, `review`, `red`, `mutation`, `commit`, `implement-summary`), verify and close (`verify-plan`, `kaizen`, `impacts`, `publish-plan`, `pr-plan`), and tests under the resource budget (`impact`, `tests`, `build`, `resources`) |
 
+## Entering the spec worktree
+
+`mandao run where <spec> [--harness <id>] [--first <command>]` prints `{ inWorktree, cwd, branch?, expected:
+{ branch, worktree }, resume, protected, message }`. `resume` is the active harness's command that opens a
+session in `expected.worktree` with the first mandao (`--first`, default `/mandao-implement <spec>`), built
+from the harness adapter's `session.resume`; an unknown `--harness` is an error and the default is `claude`,
+the same rule as the other `run` commands. `mandao run spec-new ... --harness <id> --first <command>` adds the
+same `resume` field for the proposed worktree. The commands print that field when `EnterWorktree` is not
+available (any other harness) or is refused (Claude Code), so no command text copies a resume command. The
+Codex form single-quotes the skill (`codex '$mandao-implement <spec>'`) so a shell does not expand it.
+
 ## Skills at init
 
 The commands use a few catalog skills (graphify, brainstorming, product-manager-toolkit,
diff --git a/docs/command-format.md b/docs/command-format.md
index 0925fe6..0b10a39 100644
--- a/docs/command-format.md
+++ b/docs/command-format.md
@@ -44,7 +44,7 @@ harness:                    # optional, per-adapter frontmatter passthrough
 | `id` | yes | Kebab-case. Must match the file name. |
 | `title`, `description` | yes | `description` is shown in every harness command picker. |
 | `status` | yes | A `stub` declares its contract but is not implemented yet. |
-| `flow` | no | Used by `resume` and by `AGENTS.md` to recommend the next mandao. |
+| `flow` | no | Used by the diagrams and the `AGENTS.md` flow summary. The next command comes from the spec's state (`mandao run next`). |
 | `profiles` | no | Defaults to every profile. |
 | `arguments` | no | Order matters: it is the order of positional arguments. |
 | `inputs`, `outputs` | yes | May be empty lists. Paths may use `{{paths.*}}`. |
@@ -90,7 +90,7 @@ Only rendered when at least one project uses the `ai` profile.
 Supported conditions:
 
 - `profile=<app|ai|data>`: true when any project in the workspace uses that profile.
-- `harness=<id>`: true when rendering for that harness.
+- `harness=<id>`: true when rendering for that harness. The `.agents/skills` files are shared by Codex and Antigravity and are rendered once, with Codex as the harness when both are active: keep them neutral, and read per-harness facts from a script output (e.g. the `resume` field of `mandao run where`).
 - `multiProject`: true when the workspace declares more than one project.
 - `mode=<single|monorepo|polyrepo>`: the workspace mode.
 - Prefix any condition with `!` to negate it.
diff --git a/docs/commands/clarify.md b/docs/commands/clarify.md
index 384c3c1..255718c 100644
--- a/docs/commands/clarify.md
+++ b/docs/commands/clarify.md
@@ -36,6 +36,7 @@ Yes: it stops for your approval.
 
 ## Scripts (no tokens)
 
+- `mandao run next`
 - `mandao run trace`
 - `mandao run diagram`
 - `mandao run commit-spec`
diff --git a/docs/commands/close.md b/docs/commands/close.md
index 0ea22f7..ac06961 100644
--- a/docs/commands/close.md
+++ b/docs/commands/close.md
@@ -43,6 +43,7 @@ Yes: it stops for your approval.
 ## Scripts (no tokens)
 
 - `mandao run where`
+- `mandao run next`
 - `mandao run status`
 - `mandao run branching`
 - `mandao run kaizen`
diff --git a/docs/commands/implement.md b/docs/commands/implement.md
index b637912..f5a586e 100644
--- a/docs/commands/implement.md
+++ b/docs/commands/implement.md
@@ -39,6 +39,7 @@ No approval step of its own.
 ## Scripts (no tokens)
 
 - `mandao run where`
+- `mandao run next`
 - `mandao run models`
 - `mandao run status`
 - `mandao run tasks`
diff --git a/docs/commands/quick.md b/docs/commands/quick.md
index 7a14f19..cd6a944 100644
--- a/docs/commands/quick.md
+++ b/docs/commands/quick.md
@@ -38,6 +38,7 @@ No.
 
 ## Scripts (no tokens)
 
+- `mandao run cost`
 - `mandao run quick-check`
 - `mandao run spec-new`
 - `mandao run quick-log`
diff --git a/docs/commands/specify.md b/docs/commands/specify.md
index d522dc2..b6a4e2a 100644
--- a/docs/commands/specify.md
+++ b/docs/commands/specify.md
@@ -48,6 +48,7 @@ Yes: it stops for your approval.
 
 ## Scripts (no tokens)
 
+- `mandao run next`
 - `mandao run spec-new`
 - `mandao run trace`
 - `mandao run diagram`
diff --git a/docs/commands/story.md b/docs/commands/story.md
index 0a0e927..9e154e1 100644
--- a/docs/commands/story.md
+++ b/docs/commands/story.md
@@ -35,6 +35,7 @@ Yes: it stops for your approval.
 
 ## Scripts (no tokens)
 
+- `mandao run next`
 - `mandao run spec-new`
 - `mandao run trace`
 
diff --git a/docs/commands/tasks.md b/docs/commands/tasks.md
index 79d8031..bc9f43a 100644
--- a/docs/commands/tasks.md
+++ b/docs/commands/tasks.md
@@ -41,6 +41,7 @@ Yes: it stops for your approval.
 ## Scripts (no tokens)
 
 - `mandao run where`
+- `mandao run next`
 - `mandao run trace`
 - `mandao run tasks`
 - `mandao run commit-spec`
diff --git a/docs/commands/verify.md b/docs/commands/verify.md
index f6e6c8b..0565560 100644
--- a/docs/commands/verify.md
+++ b/docs/commands/verify.md
@@ -37,6 +37,7 @@ No approval step of its own.
 ## Scripts (no tokens)
 
 - `mandao run where`
+- `mandao run next`
 - `mandao run verify-plan`
 - `mandao run tests`
 - `mandao run build`
diff --git a/docs/decisions/0037-mandao-start-and-worktree-setup.md b/docs/decisions/0037-mandao-start-and-worktree-setup.md
index d058891..b3a6ce2 100644
--- a/docs/decisions/0037-mandao-start-and-worktree-setup.md
+++ b/docs/decisions/0037-mandao-start-and-worktree-setup.md
@@ -1,6 +1,6 @@
 # 0037 — `mandao start` and the worktree setup
 
-**Status:** Accepted · 2026-10-20 · design §14.5
+**Status:** Accepted · 2026-10-20, amended by MDO-0010 (the session enters the worktree in Claude Code) · design §14.5
 
 MDO-0007 ran its lite session from the main checkout: `specify` created the worktree, but the session
 stayed outside it and `implement` correctly refused to work there. Claude Code can move a session into an
@@ -16,10 +16,19 @@ pointing at the main checkout, and no other harness documents an equivalent.
   of the cheap gates. It leaves the request in the spec's `_log/start.yml` for the first command and prints
   the exact command to open the harness there (`--open` launches it when the harness CLI allows it:
   Claude Code and Codex). `mandao start --quick "<description>"` does the same for quick changes.
-- **Fallback:** `specify` and `quick` run from the main checkout still create the worktree, and then show
-  how to continue there (`cd <worktree> && claude --resume <session>`, or the harness's equivalent).
-  `implement` keeps refusing to work outside the worktree.
-- **Optional in Claude Code:** `EnterWorktree` as a convenience, never the base of the flow.
+- **Fallback:** `specify` and `quick` run from the main checkout still create the worktree.
+  **Amended (MDO-0010):** in Claude Code they then enter it with `EnterWorktree` and the worktree path, and
+  continue in the same conversation. The permission prompt the harness shows is the single confirmation.
+  If `EnterWorktree` is refused or fails, they print the `resume` field of the `spec-new` output and stop;
+  they never go on in the main checkout. The other harnesses print the same field. It is built from the
+  active harness's adapter (`session.resume`), so no command text carries a resume command of its own;
+  only the `harness=claude` `EnterWorktree` step is a conditional.
+- **Re-entry:** the §0 `run where` check of implement, verify and close enters the worktree the same way
+  (Claude Code) or prints the `resume` field of the `where` output and stops (the others), before any other step. A new
+  conversation that starts outside the worktree is covered by this check.
+- **`EnterWorktree` was optional and is now the default in Claude Code.** The hooks keep working because
+  `mandao hook graph-guard` resolves its project from its working directory, which is the worktree after
+  entering (covered by `test/integration/hook.test.ts`).
 - **Env files: `.mandao/worktree-include` replaces the `.env*` patterns of the original design.** Only the
   files it lists (and the ones in Claude Code's `.worktreeinclude`, one shared list) are copied, never
   symlinked; a listed file must be gitignored, and a tracked one is skipped with a warning.
diff --git a/docs/decisions/0038-session-cut-at-task-boundaries.md b/docs/decisions/0038-session-cut-at-task-boundaries.md
index f04a3b9..9eacf0e 100644
--- a/docs/decisions/0038-session-cut-at-task-boundaries.md
+++ b/docs/decisions/0038-session-cut-at-task-boundaries.md
@@ -49,3 +49,13 @@ reads cost more than starting over would have.
   the rule on a spec with four or more tasks.
 - OPEN: whether a smaller context also improves the quality of later tasks. MDO-0007 had no FAILs either
   way, so this needs more specs.
+
+## Addendum (MDO-0010): the in-place action first
+
+The advice names the harness's new-conversation action first (`/clear` in Claude Code, `/new` in Codex and
+OpenCode, a new chat in Copilot and Antigravity), because it keeps the window and the worktree. When a
+fresh conversation would not be inside the worktree, the advice gives the step back into it first
+(`EnterWorktree` in Claude Code, the `resume` field of `run where` in the others). The `run where` check of the next
+command re-enters the worktree anyway, so the advice is safe whether or not the action keeps the working
+directory. The advice is no longer Claude Code only: each harness's session facts drive it, and the cut
+estimate still reads the transcript only where one exists.
diff --git a/docs/decisions/README.md b/docs/decisions/README.md
index 285a270..48aaca6 100644
--- a/docs/decisions/README.md
+++ b/docs/decisions/README.md
@@ -46,3 +46,4 @@ Format: **Status**, **Context**, **Decision**, **Consequences**.
 | [0037](0037-mandao-start-and-worktree-setup.md) | `mandao start` and the worktree setup | Accepted |
 | [0038](0038-session-cut-at-task-boundaries.md) | Cut the session at a task boundary when a new one is cheaper | Accepted |
 | [0039](0039-rules-enforced-by-scripts.md) | Rules the scripts enforce, not the text | Accepted |
+| [0040](0040-approval-by-running-the-next-command.md) | Approval by running the next command, unless something is open | Accepted |
diff --git a/docs/diagrams/command-clarify-dark.svg b/docs/diagrams/command-clarify-dark.svg
index 1c70106..f3d34c5 100644
--- a/docs/diagrams/command-clarify-dark.svg
+++ b/docs/diagrams/command-clarify-dark.svg
@@ -1,5 +1,5 @@
 <?xml version="1.0" encoding="UTF-8"?>
-<!-- mandao:diagram command-clarify spec-sha256 38daea5d0d997e446da48875590623f5a8c8650b582bcefa68eb75e0a57626d4 — generated by npm run diagrams, do not edit -->
+<!-- mandao:diagram command-clarify spec-sha256 12de41fc3cd06302e3cbddd14f0826aac6045d5cb31b8f68755b68319f390165 — generated by npm run diagrams, do not edit -->
 <svg viewBox="0 0 1092 528" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 5.880s; width: 1092px; height: 528px; min-width: 0px;" width="1092" height="528" xmlns="http://www.w3.org/2000/svg"><style>
 /*
 JetBrains Mono variable WOFF2 subsets from Google Fonts service revision v24.
@@ -643,15 +643,15 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
           <text x="777.5" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run commit-spec</text>
         </g>
 
-        <g id="node-s4" data-node-id="s4" data-node-label="5. Re-run mandao run…" tabindex="0" role="button" aria-label="Focus 5. Re-run mandao run…, mandao run trace +1, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run trace +1" data-node-context="Steps, continued">
-          <title>5. Re-run mandao run… · mandao run trace +1 · Steps, continued</title>
+        <g id="node-s4" data-node-id="s4" data-node-label="5. Re-run mandao run…" tabindex="0" role="button" aria-label="Focus 5. Re-run mandao run…, mandao run trace +2, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run trace +2" data-node-context="Steps, continued">
+          <title>5. Re-run mandao run… · mandao run trace +2 · Steps, continued</title>
           <rect x="65.5" y="217" width="171" height="52" rx="8" class="c-mask"/>
           <rect x="65.5" y="217" width="171" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 8; --flow-node-name: archify-relay-node-4;" stroke-width="1.5"/>
           <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(71.5 223) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
           <text data-node-label="" x="153.8" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">5. Re-run mandao run…</text>
-          <text x="151" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run trace +1</text>
+          <text x="151" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run trace +2</text>
         </g>
 
         <g id="node-approve" data-node-id="approve" data-node-label="You approve" tabindex="0" role="button" aria-label="Focus You approve, Steps, continued" aria-pressed="false" data-node-kind="security" data-node-context="Steps, continued">
diff --git a/docs/diagrams/command-clarify-light.svg b/docs/diagrams/command-clarify-light.svg
index 50aa533..bd4a237 100644
--- a/docs/diagrams/command-clarify-light.svg
+++ b/docs/diagrams/command-clarify-light.svg
@@ -1,5 +1,5 @@
 <?xml version="1.0" encoding="UTF-8"?>
-<!-- mandao:diagram command-clarify spec-sha256 38daea5d0d997e446da48875590623f5a8c8650b582bcefa68eb75e0a57626d4 — generated by npm run diagrams, do not edit -->
+<!-- mandao:diagram command-clarify spec-sha256 12de41fc3cd06302e3cbddd14f0826aac6045d5cb31b8f68755b68319f390165 — generated by npm run diagrams, do not edit -->
 <svg viewBox="0 0 1092 528" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 5.880s; width: 1092px; height: 528px; min-width: 0px;" width="1092" height="528" xmlns="http://www.w3.org/2000/svg"><style>
 /*
 JetBrains Mono variable WOFF2 subsets from Google Fonts service revision v24.
@@ -643,15 +643,15 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
           <text x="777.5" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run commit-spec</text>
         </g>
 
-        <g id="node-s4" data-node-id="s4" data-node-label="5. Re-run mandao run…" tabindex="0" role="button" aria-label="Focus 5. Re-run mandao run…, mandao run trace +1, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run trace +1" data-node-context="Steps, continued">
-          <title>5. Re-run mandao run… · mandao run trace +1 · Steps, continued</title>
+        <g id="node-s4" data-node-id="s4" data-node-label="5. Re-run mandao run…" tabindex="0" role="button" aria-label="Focus 5. Re-run mandao run…, mandao run trace +2, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run trace +2" data-node-context="Steps, continued">
+          <title>5. Re-run mandao run… · mandao run trace +2 · Steps, continued</title>
           <rect x="65.5" y="217" width="171" height="52" rx="8" class="c-mask"/>
           <rect x="65.5" y="217" width="171" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 8; --flow-node-name: archify-relay-node-4;" stroke-width="1.5"/>
           <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(71.5 223) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
           <text data-node-label="" x="153.8" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">5. Re-run mandao run…</text>
-          <text x="151" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run trace +1</text>
+          <text x="151" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run trace +2</text>
         </g>
 
         <g id="node-approve" data-node-id="approve" data-node-label="You approve" tabindex="0" role="button" aria-label="Focus You approve, Steps, continued" aria-pressed="false" data-node-kind="security" data-node-context="Steps, continued">
diff --git a/docs/diagrams/command-implement-dark.svg b/docs/diagrams/command-implement-dark.svg
index 6391b43..df1d1db 100644
--- a/docs/diagrams/command-implement-dark.svg
+++ b/docs/diagrams/command-implement-dark.svg
@@ -1,5 +1,5 @@
 <?xml version="1.0" encoding="UTF-8"?>
-<!-- mandao:diagram command-implement spec-sha256 54de3a77ab2e60021f50dc9ec066878ca7b28c3a1356cb32793d9862427b72bc — generated by npm run diagrams, do not edit -->
+<!-- mandao:diagram command-implement spec-sha256 a9ad56e012bca26311f27cfade390a5856ba8280da5b13bec4375d1456704247 — generated by npm run diagrams, do not edit -->
 <svg viewBox="0 0 1075 404" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 3.760s; width: 1075px; height: 404px; min-width: 0px;" width="1075" height="404" xmlns="http://www.w3.org/2000/svg"><style>
 /*
 JetBrains Mono variable WOFF2 subsets from Google Fonts service revision v24.
@@ -566,15 +566,15 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
           <text x="410" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run tasks +9</text>
         </g>
 
-        <g id="node-s2" data-node-id="s2" data-node-label="2. After the last task" tabindex="0" role="button" aria-label="Focus 2. After the last task, mandao run implement-summary +1, Steps" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run implement-summary +1" data-node-context="Steps">
-          <title>2. After the last task · mandao run implement-summary +1 · Steps</title>
+        <g id="node-s2" data-node-id="s2" data-node-label="2. After the last task" tabindex="0" role="button" aria-label="Focus 2. After the last task, mandao run implement-summary +2, Steps" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run implement-summary +2" data-node-context="Steps">
+          <title>2. After the last task · mandao run implement-summary +2 · Steps</title>
           <rect x="520.5" y="93" width="241" height="52" rx="8" class="c-mask"/>
           <rect x="520.5" y="93" width="241" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 2; --flow-node-name: archify-relay-node-2;" stroke-width="1.5"/>
           <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(526.5 99) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
           <text data-node-label="" x="641" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">2. After the last task</text>
-          <text x="641" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run implement-summary +1</text>
+          <text x="641" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run implement-summary +2</text>
         </g>
 
         <g id="node-w0" data-node-id="w0" data-node-label="specs/&lt;ID&gt;/_log/execution.md" tabindex="0" role="button" aria-label="Focus specs/&lt;ID&gt;/_log/execution.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
diff --git a/docs/diagrams/command-implement-light.svg b/docs/diagrams/command-implement-light.svg
index a22ecec..58473c4 100644
--- a/docs/diagrams/command-implement-light.svg
+++ b/docs/diagrams/command-implement-light.svg
@@ -1,5 +1,5 @@
 <?xml version="1.0" encoding="UTF-8"?>
-<!-- mandao:diagram command-implement spec-sha256 54de3a77ab2e60021f50dc9ec066878ca7b28c3a1356cb32793d9862427b72bc — generated by npm run diagrams, do not edit -->
+<!-- mandao:diagram command-implement spec-sha256 a9ad56e012bca26311f27cfade390a5856ba8280da5b13bec4375d1456704247 — generated by npm run diagrams, do not edit -->
 <svg viewBox="0 0 1075 404" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 3.760s; width: 1075px; height: 404px; min-width: 0px;" width="1075" height="404" xmlns="http://www.w3.org/2000/svg"><style>
 /*
 JetBrains Mono variable WOFF2 subsets from Google Fonts service revision v24.
@@ -566,15 +566,15 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
           <text x="410" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run tasks +9</text>
         </g>
 
-        <g id="node-s2" data-node-id="s2" data-node-label="2. After the last task" tabindex="0" role="button" aria-label="Focus 2. After the last task, mandao run implement-summary +1, Steps" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run implement-summary +1" data-node-context="Steps">
-          <title>2. After the last task · mandao run implement-summary +1 · Steps</title>
+        <g id="node-s2" data-node-id="s2" data-node-label="2. After the last task" tabindex="0" role="button" aria-label="Focus 2. After the last task, mandao run implement-summary +2, Steps" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run implement-summary +2" data-node-context="Steps">
+          <title>2. After the last task · mandao run implement-summary +2 · Steps</title>
           <rect x="520.5" y="93" width="241" height="52" rx="8" class="c-mask"/>
           <rect x="520.5" y="93" width="241" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 2; --flow-node-name: archify-relay-node-2;" stroke-width="1.5"/>
           <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(526.5 99) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
           <text data-node-label="" x="641" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">2. After the last task</text>
-          <text x="641" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run implement-summary +1</text>
+          <text x="641" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run implement-summary +2</text>
         </g>
 
         <g id="node-w0" data-node-id="w0" data-node-label="specs/&lt;ID&gt;/_log/execution.md" tabindex="0" role="button" aria-label="Focus specs/&lt;ID&gt;/_log/execution.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
diff --git a/docs/diagrams/command-quick-dark.svg b/docs/diagrams/command-quick-dark.svg
index 780ceb5..beb7160 100644
--- a/docs/diagrams/command-quick-dark.svg
+++ b/docs/diagrams/command-quick-dark.svg
@@ -1,5 +1,5 @@
 <?xml version="1.0" encoding="UTF-8"?>
-<!-- mandao:diagram command-quick spec-sha256 c9f7946341838572766d0c8b75a5d658c4bac1d452bf728c77749b29342765b6 — generated by npm run diagrams, do not edit -->
+<!-- mandao:diagram command-quick spec-sha256 3ddff9ffdf73af778f37fbc524335a8f72c9b9537408044c986811efc2c1962b — generated by npm run diagrams, do not edit -->
 <svg viewBox="0 0 1042 528" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 7.480s; width: 1042px; height: 528px; min-width: 0px;" width="1042" height="528" xmlns="http://www.w3.org/2000/svg"><style>
 /*
 JetBrains Mono variable WOFF2 subsets from Google Fonts service revision v24.
@@ -653,15 +653,15 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
           <text data-node-label="" x="146.2" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">5. Gates and lite review</text>
         </g>
 
-        <g id="node-s5" data-node-id="s5" data-node-label="6. Record and commit" tabindex="0" role="button" aria-label="Focus 6. Record and commit, mandao run quick-log, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run quick-log" data-node-context="Steps, continued">
-          <title>6. Record and commit · mandao run quick-log · Steps, continued</title>
+        <g id="node-s5" data-node-id="s5" data-node-label="6. Record and commit" tabindex="0" role="button" aria-label="Focus 6. Record and commit, mandao run cost +1, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run cost +1" data-node-context="Steps, continued">
+          <title>6. Record and commit · mandao run cost +1 · Steps, continued</title>
           <rect x="272" y="217" width="164" height="52" rx="8" class="c-mask"/>
           <rect x="272" y="217" width="164" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 9; --flow-node-name: archify-relay-node-5;" stroke-width="1.5"/>
           <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(278 223) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
           <text data-node-label="" x="357" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">6. Record and commit</text>
-          <text x="354" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run quick-log</text>
+          <text x="354" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run cost +1</text>
         </g>
 
         <g id="node-w0" data-node-id="w0" data-node-label="specs/quick/quick-log.md" tabindex="0" role="button" aria-label="Focus specs/quick/quick-log.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
diff --git a/docs/diagrams/command-quick-light.svg b/docs/diagrams/command-quick-light.svg
index 3dcceae..1203c86 100644
--- a/docs/diagrams/command-quick-light.svg
+++ b/docs/diagrams/command-quick-light.svg
@@ -1,5 +1,5 @@
 <?xml version="1.0" encoding="UTF-8"?>
-<!-- mandao:diagram command-quick spec-sha256 c9f7946341838572766d0c8b75a5d658c4bac1d452bf728c77749b29342765b6 — generated by npm run diagrams, do not edit -->
+<!-- mandao:diagram command-quick spec-sha256 3ddff9ffdf73af778f37fbc524335a8f72c9b9537408044c986811efc2c1962b — generated by npm run diagrams, do not edit -->
 <svg viewBox="0 0 1042 528" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 7.480s; width: 1042px; height: 528px; min-width: 0px;" width="1042" height="528" xmlns="http://www.w3.org/2000/svg"><style>
 /*
 JetBrains Mono variable WOFF2 subsets from Google Fonts service revision v24.
@@ -653,15 +653,15 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
           <text data-node-label="" x="146.2" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">5. Gates and lite review</text>
         </g>
 
-        <g id="node-s5" data-node-id="s5" data-node-label="6. Record and commit" tabindex="0" role="button" aria-label="Focus 6. Record and commit, mandao run quick-log, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run quick-log" data-node-context="Steps, continued">
-          <title>6. Record and commit · mandao run quick-log · Steps, continued</title>
+        <g id="node-s5" data-node-id="s5" data-node-label="6. Record and commit" tabindex="0" role="button" aria-label="Focus 6. Record and commit, mandao run cost +1, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run cost +1" data-node-context="Steps, continued">
+          <title>6. Record and commit · mandao run cost +1 · Steps, continued</title>
           <rect x="272" y="217" width="164" height="52" rx="8" class="c-mask"/>
           <rect x="272" y="217" width="164" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 9; --flow-node-name: archify-relay-node-5;" stroke-width="1.5"/>
           <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(278 223) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
           <text data-node-label="" x="357" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">6. Record and commit</text>
-          <text x="354" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run quick-log</text>
+          <text x="354" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run cost +1</text>
         </g>
 
         <g id="node-w0" data-node-id="w0" data-node-label="specs/quick/quick-log.md" tabindex="0" role="button" aria-label="Focus specs/quick/quick-log.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
diff --git a/docs/diagrams/command-specify-dark.svg b/docs/diagrams/command-specify-dark.svg
index 9775e86..759fc44 100644
--- a/docs/diagrams/command-specify-dark.svg
+++ b/docs/diagrams/command-specify-dark.svg
@@ -1,6 +1,6 @@
 <?xml version="1.0" encoding="UTF-8"?>
-<!-- mandao:diagram command-specify spec-sha256 1abd27d8634395d9ffe777c6ef9641a136db498d991c72368572988bcaf98bb7 — generated by npm run diagrams, do not edit -->
-<svg viewBox="0 0 1074 652" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 9.560s; width: 1074px; height: 652px; min-width: 0px;" width="1074" height="652" xmlns="http://www.w3.org/2000/svg"><style>
+<!-- mandao:diagram command-specify spec-sha256 5ab623dd96fc991e9f9694400515ddeb6d68a97188803725a109c11bc421f0ae — generated by npm run diagrams, do not edit -->
+<svg viewBox="0 0 1081 652" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 9.560s; width: 1081px; height: 652px; min-width: 0px;" width="1081" height="652" xmlns="http://www.w3.org/2000/svg"><style>
 /*
 JetBrains Mono variable WOFF2 subsets from Google Fonts service revision v24.
 These fixed bytes are shared by the viewer and its SVG/raster exports.
@@ -598,7 +598,7 @@ svg[data-node-ui] g[data-edge-from] &gt; rect.c-mask { rx: 7px; stroke: var(--la
 svg[data-node-ui][data-preset="blueprint"] :is([data-graph-role="structural-frame-label-mask"], g[data-edge-from] &gt; rect.c-mask, .phase-chip) { rx: 2px; }
 svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-frame-label-mask"], g[data-edge-from] &gt; rect.c-mask, .phase-chip) { rx: 3px; }
 :root, svg { --bg: #020617; --grid: #1e293b; --canvas-dot: rgba(148, 163, 184, 0.16); --text: #ffffff; --text-muted: #94a3b8; --text-dim: #475569; --text-faint: #7d8da1; --panel: rgba(15, 23, 42, 0.5); --panel-border: #1e293b; --lane-fill: rgba(15, 23, 42, 0.22); --lane-stroke: #334155; --arrow: #94a3b8; --arrow-emphasis: #34d399; --mask: #0f172a; --frontend-fill: rgba(8, 51, 68, 0.4); --frontend-stroke: #22d3ee; --backend-fill: rgba(6, 78, 59, 0.4); --backend-stroke: #34d399; --database-fill: rgba(76, 29, 149, 0.4); --database-stroke: #a78bfa; --cloud-fill: rgba(120, 53, 15, 0.3); --cloud-stroke: #fbbf24; --security-fill: rgba(136, 19, 55, 0.4); --security-stroke: #fb7185; --messagebus-fill: rgba(251, 146, 60, 0.3); --messagebus-stroke: #fb923c; --external-fill: rgba(30, 41, 59, 0.5); --external-stroke: #94a3b8; --toolbar-bg: rgba(15, 23, 42, 0.8); --toolbar-border: #334155; --toolbar-text: #e2e8f0; --toolbar-hover: rgba(15, 23, 42, 0.95); --toolbar-menu-bg: #0f172a; --flow-cycle: ; --flow-halo-peak: ; --flow-glow-peak: ; --flow-tail-peak: ; --flow-head-peak: ; --flow-wake-peak: ; --flow-ripple-peak: ; --flow-peak: ; }
-</style><rect x="0" y="0" width="1074" height="652" fill="#020617"/>
+</style><rect x="0" y="0" width="1081" height="652" fill="#020617"/>
         <title id="archify-diagram-title">/mandao-specify: inside</title>
         <desc id="archify-diagram-description">A workflow diagram generated by Archify.</desc>
         <!-- Definitions -->
@@ -645,16 +645,16 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
         <rect width="100%" height="100%" fill="url(#grid)"/>
 
         <!-- Swimlanes -->
-        <rect data-graph-role="structural-frame" data-composition-frame-kind="lane" data-composition-frame-id="lane-0" x="40" y="52" width="1018" height="104" rx="10" class="c-lane" stroke-width="1"/>
+        <rect data-graph-role="structural-frame" data-composition-frame-kind="lane" data-composition-frame-id="lane-0" x="40" y="52" width="1025" height="104" rx="10" class="c-lane" stroke-width="1"/>
         <text x="54" y="74" class="t-muted" font-size="10" font-weight="600">01 / Steps</text>
 
-        <rect data-graph-role="structural-frame" data-composition-frame-kind="lane" data-composition-frame-id="lane-1" x="40" y="176" width="1018" height="104" rx="10" class="c-lane" stroke-width="1"/>
+        <rect data-graph-role="structural-frame" data-composition-frame-kind="lane" data-composition-frame-id="lane-1" x="40" y="176" width="1025" height="104" rx="10" class="c-lane" stroke-width="1"/>
         <text x="54" y="198" class="t-muted" font-size="10" font-weight="600">02 / Steps, continued</text>
 
-        <rect data-graph-role="structural-frame" data-composition-frame-kind="lane" data-composition-frame-id="lane-2" x="40" y="300" width="1018" height="104" rx="10" class="c-lane" stroke-width="1"/>
+        <rect data-graph-role="structural-frame" data-composition-frame-kind="lane" data-composition-frame-id="lane-2" x="40" y="300" width="1025" height="104" rx="10" class="c-lane" stroke-width="1"/>
         <text x="54" y="322" class="t-muted" font-size="10" font-weight="600">03 / Steps, continued</text>
 
-        <rect data-graph-role="structural-frame" data-composition-frame-kind="lane" data-composition-frame-id="lane-3" x="40" y="424" width="1018" height="104" rx="10" class="c-lane" stroke-width="1"/>
+        <rect data-graph-role="structural-frame" data-composition-frame-kind="lane" data-composition-frame-id="lane-3" x="40" y="424" width="1025" height="104" rx="10" class="c-lane" stroke-width="1"/>
         <text x="54" y="446" class="t-muted" font-size="10" font-weight="600">04 / Writes</text>
 
         <!-- Phase headers -->
@@ -664,16 +664,16 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
 
 
         <!-- Edge paths -->
-        <path data-edge-from="s0" data-edge-to="s1" data-edge-key="0" data-edge-id="s0-s1" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="229.5,119;302,119" d="M 229.5 119 L 302 119" class="a-default" data-animate="edge" style="--step: 0;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s1" data-edge-to="s2" data-edge-key="1" data-edge-id="s1-s2" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="434,119;482,119" d="M 434 119 L 482 119" class="a-default" data-animate="edge" style="--step: 1;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s2" data-edge-to="s3" data-edge-key="2" data-edge-id="s2-s3" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="632,119;685,119" d="M 632 119 L 685 119" class="a-default" data-animate="edge" style="--step: 2;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s3" data-edge-to="s4" data-edge-key="3" data-edge-id="s3-s4" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="760,145;760,166;49.5,166;49.5,243;65.5,243" d="M 760 145 L 760 158 Q 760 166 752 166 L 57.5 166 Q 49.5 166 49.5 174 L 49.5 235 Q 49.5 243 57.5 243 L 65.5 243" class="a-default" data-animate="edge" style="--step: 7;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s4" data-edge-to="s5" data-edge-key="4" data-edge-id="s4-s5" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="236.5,243;296.5,243" d="M 236.5 243 L 296.5 243" class="a-default" data-animate="edge" style="--step: 8;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s5" data-edge-to="s6" data-edge-key="5" data-edge-id="s5-s6" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="439.5,243;485.5,243" d="M 439.5 243 L 485.5 243" class="a-default" data-animate="edge" style="--step: 9;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s6" data-edge-to="s7" data-edge-key="6" data-edge-id="s6-s7" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="628.5,243;678,243" d="M 628.5 243 L 678 243" class="a-default" data-animate="edge" style="--step: 10;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s7" data-edge-to="s8" data-edge-key="7" data-edge-id="s7-s8" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="760,269;760,290;42.5,290;42.5,367;58.5,367" d="M 760 269 L 760 282 Q 760 290 752 290 L 50.5 290 Q 42.5 290 42.5 298 L 42.5 359 Q 42.5 367 50.5 367 L 58.5 367" class="a-default" data-animate="edge" style="--step: 11;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s8" data-edge-to="s9" data-edge-key="8" data-edge-id="s8-s9" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="243.5,367;279,367" d="M 243.5 367 L 279 367" class="a-default" data-animate="edge" style="--step: 12;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s9" data-edge-to="w1" data-edge-label="writes" data-edge-key="9" data-edge-id="s9-writes" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="368,393;368,465" d="M 368 393 L 368 465" class="a-dashed" data-animate="edge" style="--step: 12;" stroke-width="1.4" marker-end="url(#arrowhead-dashed)"/>
+        <path data-edge-from="s0" data-edge-to="s1" data-edge-key="0" data-edge-id="s0-s1" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="229.5,119;309,119" d="M 229.5 119 L 309 119" class="a-default" data-animate="edge" style="--step: 0;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s1" data-edge-to="s2" data-edge-key="1" data-edge-id="s1-s2" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="441,119;489,119" d="M 441 119 L 489 119" class="a-default" data-animate="edge" style="--step: 1;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s2" data-edge-to="s3" data-edge-key="2" data-edge-id="s2-s3" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="639,119;692,119" d="M 639 119 L 692 119" class="a-default" data-animate="edge" style="--step: 2;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s3" data-edge-to="s4" data-edge-key="3" data-edge-id="s3-s4" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="767,145;767,166;49.5,166;49.5,243;65.5,243" d="M 767 145 L 767 158 Q 767 166 759 166 L 57.5 166 Q 49.5 166 49.5 174 L 49.5 235 Q 49.5 243 57.5 243 L 65.5 243" class="a-default" data-animate="edge" style="--step: 7;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s4" data-edge-to="s5" data-edge-key="4" data-edge-id="s4-s5" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="236.5,243;303.5,243" d="M 236.5 243 L 303.5 243" class="a-default" data-animate="edge" style="--step: 8;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s5" data-edge-to="s6" data-edge-key="5" data-edge-id="s5-s6" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="446.5,243;492.5,243" d="M 446.5 243 L 492.5 243" class="a-default" data-animate="edge" style="--step: 9;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s6" data-edge-to="s7" data-edge-key="6" data-edge-id="s6-s7" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="635.5,243;685,243" d="M 635.5 243 L 685 243" class="a-default" data-animate="edge" style="--step: 10;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s7" data-edge-to="s8" data-edge-key="7" data-edge-id="s7-s8" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="767,269;767,290;42.5,290;42.5,367;58.5,367" d="M 767 269 L 767 282 Q 767 290 759 290 L 50.5 290 Q 42.5 290 42.5 298 L 42.5 359 Q 42.5 367 50.5 367 L 58.5 367" class="a-default" data-animate="edge" style="--step: 11;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s8" data-edge-to="s9" data-edge-key="8" data-edge-id="s8-s9" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="243.5,367;275.5,367" d="M 243.5 367 L 275.5 367" class="a-default" data-animate="edge" style="--step: 12;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s9" data-edge-to="w1" data-edge-label="writes" data-edge-key="9" data-edge-id="s9-writes" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="375,393;375,465" d="M 375 393 L 375 465" class="a-dashed" data-animate="edge" style="--step: 12;" stroke-width="1.4" marker-end="url(#arrowhead-dashed)"/>
 
         <!-- Nodes -->
         <g id="node-s0" data-node-id="s0" data-node-label="1. Resolve the spec" tabindex="0" role="button" aria-label="Focus 1. Resolve the spec, mandao run spec-new, Steps" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run spec-new" data-node-context="Steps">
@@ -689,32 +689,32 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
 
         <g id="node-s1" data-node-id="s1" data-node-label="2. Depth" tabindex="0" role="button" aria-label="Focus 2. Depth, Steps" aria-pressed="false" data-node-kind="backend" data-node-context="Steps">
           <title>2. Depth · Steps</title>
-          <rect x="302" y="93" width="132" height="52" rx="8" class="c-mask"/>
-          <rect x="302" y="93" width="132" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 1; --flow-node-name: archify-relay-node-1;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(308 99) scale(0.6875)">
+          <rect x="309" y="93" width="132" height="52" rx="8" class="c-mask"/>
+          <rect x="309" y="93" width="132" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 1; --flow-node-name: archify-relay-node-1;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(315 99) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
-          <text data-node-label="" x="368" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">2. Depth</text>
+          <text data-node-label="" x="375" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">2. Depth</text>
         </g>
 
         <g id="node-s2" data-node-id="s2" data-node-label="3. Impact analysis" tabindex="0" role="button" aria-label="Focus 3. Impact analysis, Steps" aria-pressed="false" data-node-kind="backend" data-node-context="Steps">
           <title>3. Impact analysis · Steps</title>
-          <rect x="482" y="93" width="150" height="52" rx="8" class="c-mask"/>
-          <rect x="482" y="93" width="150" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 2; --flow-node-name: archify-relay-node-2;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(488 99) scale(0.6875)">
+          <rect x="489" y="93" width="150" height="52" rx="8" class="c-mask"/>
+          <rect x="489" y="93" width="150" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 2; --flow-node-name: archify-relay-node-2;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(495 99) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
-          <text data-node-label="" x="560.4" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">3. Impact analysis</text>
+          <text data-node-label="" x="567.4" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">3. Impact analysis</text>
         </g>
 
         <g id="node-s3" data-node-id="s3" data-node-label="4. requirements.md" tabindex="0" role="button" aria-label="Focus 4. requirements.md, Steps" aria-pressed="false" data-node-kind="backend" data-node-context="Steps">
           <title>4. requirements.md · Steps</title>
-          <rect x="685" y="93" width="150" height="52" rx="8" class="c-mask"/>
-          <rect x="685" y="93" width="150" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 3; --flow-node-name: archify-relay-node-3;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(691 99) scale(0.6875)">
+          <rect x="692" y="93" width="150" height="52" rx="8" class="c-mask"/>
+          <rect x="692" y="93" width="150" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 3; --flow-node-name: archify-relay-node-3;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(698 99) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
-          <text data-node-label="" x="763.4" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">4. requirements.md</text>
+          <text data-node-label="" x="770.4" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">4. requirements.md</text>
         </g>
 
         <g id="node-s4" data-node-id="s4" data-node-label="5. design.md" tabindex="0" role="button" aria-label="Focus 5. design.md, mandao run premise +1, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run premise +1" data-node-context="Steps, continued">
@@ -730,33 +730,33 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
 
         <g id="node-s5" data-node-id="s5" data-node-label="5b. quickstart.md" tabindex="0" role="button" aria-label="Focus 5b. quickstart.md, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-context="Steps, continued">
           <title>5b. quickstart.md · Steps, continued</title>
-          <rect x="296.5" y="217" width="143" height="52" rx="8" class="c-mask"/>
-          <rect x="296.5" y="217" width="143" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 9; --flow-node-name: archify-relay-node-5;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(302.5 223) scale(0.6875)">
+          <rect x="303.5" y="217" width="143" height="52" rx="8" class="c-mask"/>
+          <rect x="303.5" y="217" width="143" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 9; --flow-node-name: archify-relay-node-5;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(309.5 223) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
-          <text data-node-label="" x="371.6" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">5b. quickstart.md</text>
+          <text data-node-label="" x="378.6" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">5b. quickstart.md</text>
         </g>
 
         <g id="node-s6" data-node-id="s6" data-node-label="5c. data-model.md" tabindex="0" role="button" aria-label="Focus 5c. data-model.md, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-context="Steps, continued">
           <title>5c. data-model.md · Steps, continued</title>
-          <rect x="485.5" y="217" width="143" height="52" rx="8" class="c-mask"/>
-          <rect x="485.5" y="217" width="143" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 10; --flow-node-name: archify-relay-node-6;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(491.5 223) scale(0.6875)">
+          <rect x="492.5" y="217" width="143" height="52" rx="8" class="c-mask"/>
+          <rect x="492.5" y="217" width="143" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 10; --flow-node-name: archify-relay-node-6;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(498.5 223) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
-          <text data-node-label="" x="560.6" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">5c. data-model.md</text>
+          <text data-node-label="" x="567.6" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">5c. data-model.md</text>
         </g>
 
         <g id="node-s7" data-node-id="s7" data-node-label="6. Consistency Check" tabindex="0" role="button" aria-label="Focus 6. Consistency Check, mandao run trace, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run trace" data-node-context="Steps, continued">
           <title>6. Consistency Check · mandao run trace · Steps, continued</title>
-          <rect x="678" y="217" width="164" height="52" rx="8" class="c-mask"/>
-          <rect x="678" y="217" width="164" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 11; --flow-node-name: archify-relay-node-7;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(684 223) scale(0.6875)">
+          <rect x="685" y="217" width="164" height="52" rx="8" class="c-mask"/>
+          <rect x="685" y="217" width="164" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 11; --flow-node-name: archify-relay-node-7;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(691 223) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
-          <text data-node-label="" x="763" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">6. Consistency Check</text>
-          <text x="760" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run trace</text>
+          <text data-node-label="" x="770" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">6. Consistency Check</text>
+          <text x="767" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run trace</text>
         </g>
 
         <g id="node-s8" data-node-id="s8" data-node-label="7. Diagram for approval" tabindex="0" role="button" aria-label="Focus 7. Diagram for approval, mandao run diagram, Steps, continued" aria-pressed="false" data-node-kind="security" data-node-sublabel="mandao run diagram" data-node-context="Steps, continued">
@@ -771,15 +771,15 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
           <text x="151" y="379" class="t-muted" font-size="8" text-anchor="middle">mandao run diagram</text>
         </g>
 
-        <g id="node-s9" data-node-id="s9" data-node-label="8. Close" tabindex="0" role="button" aria-label="Focus 8. Close, mandao run commit-spec, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run commit-spec" data-node-context="Steps, continued">
-          <title>8. Close · mandao run commit-spec · Steps, continued</title>
-          <rect x="279" y="341" width="178" height="52" rx="8" class="c-mask"/>
-          <rect x="279" y="341" width="178" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 12; --flow-node-name: archify-relay-node-9;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(285 347) scale(0.6875)">
+        <g id="node-s9" data-node-id="s9" data-node-label="8. Close" tabindex="0" role="button" aria-label="Focus 8. Close, mandao run commit-spec +1, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run commit-spec +1" data-node-context="Steps, continued">
+          <title>8. Close · mandao run commit-spec +1 · Steps, continued</title>
+          <rect x="275.5" y="341" width="199" height="52" rx="8" class="c-mask"/>
+          <rect x="275.5" y="341" width="199" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 12; --flow-node-name: archify-relay-node-9;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(281.5 347) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
-          <text data-node-label="" x="368" y="362" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">8. Close</text>
-          <text x="368" y="379" class="t-muted" font-size="8" text-anchor="middle">mandao run commit-spec</text>
+          <text data-node-label="" x="375" y="362" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">8. Close</text>
+          <text x="375" y="379" class="t-muted" font-size="8" text-anchor="middle">mandao run commit-spec +1</text>
         </g>
 
         <g id="node-w0" data-node-id="w0" data-node-label="specs/&lt;ID&gt;/requirements.md" tabindex="0" role="button" aria-label="Focus specs/&lt;ID&gt;/requirements.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
@@ -795,35 +795,35 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
 
         <g id="node-w1" data-node-id="w1" data-node-label="specs/&lt;ID&gt;/design.md" tabindex="0" role="button" aria-label="Focus specs/&lt;ID&gt;/design.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
           <title>specs/&lt;ID&gt;/design.md · Writes</title>
-          <rect x="286" y="465" width="164" height="52" rx="8" class="c-mask"/>
-          <rect x="286" y="465" width="164" height="52" rx="8" class="c-database" data-animate="node" style="--step: 12; --flow-node-name: archify-relay-node-10;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="database" class="semantic-sigil s-database" transform="translate(292 471) scale(0.6875)">
+          <rect x="293" y="465" width="164" height="52" rx="8" class="c-mask"/>
+          <rect x="293" y="465" width="164" height="52" rx="8" class="c-database" data-animate="node" style="--step: 12; --flow-node-name: archify-relay-node-10;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="database" class="semantic-sigil s-database" transform="translate(299 471) scale(0.6875)">
             <ellipse cx="8" cy="4" rx="5" ry="2"/>
             <path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4M3 8c0 1.1 2.2 2 5 2s5-.9 5-2"/>
           </g>
-          <text data-node-label="" x="371" y="486" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">specs/&lt;ID&gt;/design.md</text>
+          <text data-node-label="" x="378" y="486" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">specs/&lt;ID&gt;/design.md</text>
         </g>
 
         <g id="node-w2" data-node-id="w2" data-node-label="specs/&lt;ID&gt;/spec.md" tabindex="0" role="button" aria-label="Focus specs/&lt;ID&gt;/spec.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
           <title>specs/&lt;ID&gt;/spec.md · Writes</title>
-          <rect x="482" y="465" width="150" height="52" rx="8" class="c-mask"/>
-          <rect x="482" y="465" width="150" height="52" rx="8" class="c-database" data-animate="node" style="--step: 12;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="database" class="semantic-sigil s-database" transform="translate(488 471) scale(0.6875)">
+          <rect x="489" y="465" width="150" height="52" rx="8" class="c-mask"/>
+          <rect x="489" y="465" width="150" height="52" rx="8" class="c-database" data-animate="node" style="--step: 12;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="database" class="semantic-sigil s-database" transform="translate(495 471) scale(0.6875)">
             <ellipse cx="8" cy="4" rx="5" ry="2"/>
             <path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4M3 8c0 1.1 2.2 2 5 2s5-.9 5-2"/>
           </g>
-          <text data-node-label="" x="560.4" y="486" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">specs/&lt;ID&gt;/spec.md</text>
+          <text data-node-label="" x="567.4" y="486" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">specs/&lt;ID&gt;/spec.md</text>
         </g>
 
         <g id="node-w3" data-node-id="w3" data-node-label="specs/&lt;ID&gt;/quickstart.md" tabindex="0" role="button" aria-label="Focus specs/&lt;ID&gt;/quickstart.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
           <title>specs/&lt;ID&gt;/quickstart.md · Writes</title>
-          <rect x="664" y="465" width="192" height="52" rx="8" class="c-mask"/>
-          <rect x="664" y="465" width="192" height="52" rx="8" class="c-database" data-animate="node" style="--step: 12;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="database" class="semantic-sigil s-database" transform="translate(670 471) scale(0.6875)">
+          <rect x="671" y="465" width="192" height="52" rx="8" class="c-mask"/>
+          <rect x="671" y="465" width="192" height="52" rx="8" class="c-database" data-animate="node" style="--step: 12;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="database" class="semantic-sigil s-database" transform="translate(677 471) scale(0.6875)">
             <ellipse cx="8" cy="4" rx="5" ry="2"/>
             <path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4M3 8c0 1.1 2.2 2 5 2s5-.9 5-2"/>
           </g>
-          <text data-node-label="" x="762.2" y="486" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">specs/&lt;ID&gt;/quickstart.md</text>
+          <text data-node-label="" x="769.2" y="486" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">specs/&lt;ID&gt;/quickstart.md</text>
         </g>
 
         <!-- Edge labels -->
@@ -837,8 +837,8 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
 
 
         <g data-edge-from="s9" data-edge-to="w1" data-edge-label="writes" data-edge-key="9" data-edge-id="s9-writes">
-          <rect x="348.6" y="419" width="38.8" height="14" rx="3" class="c-mask"/>
-          <text x="368" y="429" class="t-edge-dashed" font-size="8" text-anchor="middle">writes</text>
+          <rect x="355.6" y="419" width="38.8" height="14" rx="3" class="c-mask"/>
+          <text x="375" y="429" class="t-edge-dashed" font-size="8" text-anchor="middle">writes</text>
         </g>
 
         <!-- Legend -->
diff --git a/docs/diagrams/command-specify-light.svg b/docs/diagrams/command-specify-light.svg
index 477ec3e..feb5510 100644
--- a/docs/diagrams/command-specify-light.svg
+++ b/docs/diagrams/command-specify-light.svg
@@ -1,6 +1,6 @@
 <?xml version="1.0" encoding="UTF-8"?>
-<!-- mandao:diagram command-specify spec-sha256 1abd27d8634395d9ffe777c6ef9641a136db498d991c72368572988bcaf98bb7 — generated by npm run diagrams, do not edit -->
-<svg viewBox="0 0 1074 652" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 9.560s; width: 1074px; height: 652px; min-width: 0px;" width="1074" height="652" xmlns="http://www.w3.org/2000/svg"><style>
+<!-- mandao:diagram command-specify spec-sha256 5ab623dd96fc991e9f9694400515ddeb6d68a97188803725a109c11bc421f0ae — generated by npm run diagrams, do not edit -->
+<svg viewBox="0 0 1081 652" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 9.560s; width: 1081px; height: 652px; min-width: 0px;" width="1081" height="652" xmlns="http://www.w3.org/2000/svg"><style>
 /*
 JetBrains Mono variable WOFF2 subsets from Google Fonts service revision v24.
 These fixed bytes are shared by the viewer and its SVG/raster exports.
@@ -598,7 +598,7 @@ svg[data-node-ui] g[data-edge-from] &gt; rect.c-mask { rx: 7px; stroke: var(--la
 svg[data-node-ui][data-preset="blueprint"] :is([data-graph-role="structural-frame-label-mask"], g[data-edge-from] &gt; rect.c-mask, .phase-chip) { rx: 2px; }
 svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-frame-label-mask"], g[data-edge-from] &gt; rect.c-mask, .phase-chip) { rx: 3px; }
 :root, svg { --bg: #f4f5f7; --grid: #e9edf2; --canvas-dot: #e2e7ec; --text: #111827; --text-muted: #5b6474; --text-dim: #9aa3b2; --text-faint: #6b7280; --panel: #ffffff; --panel-border: #e5e7eb; --lane-fill: rgba(248, 250, 252, 0.65); --lane-stroke: #cbd5e1; --arrow: #64748b; --arrow-emphasis: #059669; --mask: #ffffff; --frontend-fill: rgba(34, 211, 238, 0.15); --frontend-stroke: #0891b2; --backend-fill: rgba(52, 211, 153, 0.18); --backend-stroke: #059669; --database-fill: rgba(167, 139, 250, 0.2); --database-stroke: #7c3aed; --cloud-fill: rgba(251, 191, 36, 0.18); --cloud-stroke: #d97706; --security-fill: rgba(251, 113, 133, 0.15); --security-stroke: #e11d48; --messagebus-fill: rgba(251, 146, 60, 0.15); --messagebus-stroke: #ea580c; --external-fill: rgba(148, 163, 184, 0.18); --external-stroke: #64748b; --toolbar-bg: rgba(255, 255, 255, 0.92); --toolbar-border: #cbd5e1; --toolbar-text: #334155; --toolbar-hover: #ffffff; --toolbar-menu-bg: #ffffff; --flow-cycle: ; --flow-halo-peak: ; --flow-glow-peak: ; --flow-tail-peak: ; --flow-head-peak: ; --flow-wake-peak: ; --flow-ripple-peak: ; --flow-peak: ; }
-</style><rect x="0" y="0" width="1074" height="652" fill="#f4f5f7"/>
+</style><rect x="0" y="0" width="1081" height="652" fill="#f4f5f7"/>
         <title id="archify-diagram-title">/mandao-specify: inside</title>
         <desc id="archify-diagram-description">A workflow diagram generated by Archify.</desc>
         <!-- Definitions -->
@@ -645,16 +645,16 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
         <rect width="100%" height="100%" fill="url(#grid)"/>
 
         <!-- Swimlanes -->
-        <rect data-graph-role="structural-frame" data-composition-frame-kind="lane" data-composition-frame-id="lane-0" x="40" y="52" width="1018" height="104" rx="10" class="c-lane" stroke-width="1"/>
+        <rect data-graph-role="structural-frame" data-composition-frame-kind="lane" data-composition-frame-id="lane-0" x="40" y="52" width="1025" height="104" rx="10" class="c-lane" stroke-width="1"/>
         <text x="54" y="74" class="t-muted" font-size="10" font-weight="600">01 / Steps</text>
 
-        <rect data-graph-role="structural-frame" data-composition-frame-kind="lane" data-composition-frame-id="lane-1" x="40" y="176" width="1018" height="104" rx="10" class="c-lane" stroke-width="1"/>
+        <rect data-graph-role="structural-frame" data-composition-frame-kind="lane" data-composition-frame-id="lane-1" x="40" y="176" width="1025" height="104" rx="10" class="c-lane" stroke-width="1"/>
         <text x="54" y="198" class="t-muted" font-size="10" font-weight="600">02 / Steps, continued</text>
 
-        <rect data-graph-role="structural-frame" data-composition-frame-kind="lane" data-composition-frame-id="lane-2" x="40" y="300" width="1018" height="104" rx="10" class="c-lane" stroke-width="1"/>
+        <rect data-graph-role="structural-frame" data-composition-frame-kind="lane" data-composition-frame-id="lane-2" x="40" y="300" width="1025" height="104" rx="10" class="c-lane" stroke-width="1"/>
         <text x="54" y="322" class="t-muted" font-size="10" font-weight="600">03 / Steps, continued</text>
 
-        <rect data-graph-role="structural-frame" data-composition-frame-kind="lane" data-composition-frame-id="lane-3" x="40" y="424" width="1018" height="104" rx="10" class="c-lane" stroke-width="1"/>
+        <rect data-graph-role="structural-frame" data-composition-frame-kind="lane" data-composition-frame-id="lane-3" x="40" y="424" width="1025" height="104" rx="10" class="c-lane" stroke-width="1"/>
         <text x="54" y="446" class="t-muted" font-size="10" font-weight="600">04 / Writes</text>
 
         <!-- Phase headers -->
@@ -664,16 +664,16 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
 
 
         <!-- Edge paths -->
-        <path data-edge-from="s0" data-edge-to="s1" data-edge-key="0" data-edge-id="s0-s1" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="229.5,119;302,119" d="M 229.5 119 L 302 119" class="a-default" data-animate="edge" style="--step: 0;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s1" data-edge-to="s2" data-edge-key="1" data-edge-id="s1-s2" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="434,119;482,119" d="M 434 119 L 482 119" class="a-default" data-animate="edge" style="--step: 1;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s2" data-edge-to="s3" data-edge-key="2" data-edge-id="s2-s3" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="632,119;685,119" d="M 632 119 L 685 119" class="a-default" data-animate="edge" style="--step: 2;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s3" data-edge-to="s4" data-edge-key="3" data-edge-id="s3-s4" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="760,145;760,166;49.5,166;49.5,243;65.5,243" d="M 760 145 L 760 158 Q 760 166 752 166 L 57.5 166 Q 49.5 166 49.5 174 L 49.5 235 Q 49.5 243 57.5 243 L 65.5 243" class="a-default" data-animate="edge" style="--step: 7;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s4" data-edge-to="s5" data-edge-key="4" data-edge-id="s4-s5" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="236.5,243;296.5,243" d="M 236.5 243 L 296.5 243" class="a-default" data-animate="edge" style="--step: 8;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s5" data-edge-to="s6" data-edge-key="5" data-edge-id="s5-s6" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="439.5,243;485.5,243" d="M 439.5 243 L 485.5 243" class="a-default" data-animate="edge" style="--step: 9;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s6" data-edge-to="s7" data-edge-key="6" data-edge-id="s6-s7" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="628.5,243;678,243" d="M 628.5 243 L 678 243" class="a-default" data-animate="edge" style="--step: 10;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s7" data-edge-to="s8" data-edge-key="7" data-edge-id="s7-s8" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="760,269;760,290;42.5,290;42.5,367;58.5,367" d="M 760 269 L 760 282 Q 760 290 752 290 L 50.5 290 Q 42.5 290 42.5 298 L 42.5 359 Q 42.5 367 50.5 367 L 58.5 367" class="a-default" data-animate="edge" style="--step: 11;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s8" data-edge-to="s9" data-edge-key="8" data-edge-id="s8-s9" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="243.5,367;279,367" d="M 243.5 367 L 279 367" class="a-default" data-animate="edge" style="--step: 12;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s9" data-edge-to="w1" data-edge-label="writes" data-edge-key="9" data-edge-id="s9-writes" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="368,393;368,465" d="M 368 393 L 368 465" class="a-dashed" data-animate="edge" style="--step: 12;" stroke-width="1.4" marker-end="url(#arrowhead-dashed)"/>
+        <path data-edge-from="s0" data-edge-to="s1" data-edge-key="0" data-edge-id="s0-s1" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="229.5,119;309,119" d="M 229.5 119 L 309 119" class="a-default" data-animate="edge" style="--step: 0;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s1" data-edge-to="s2" data-edge-key="1" data-edge-id="s1-s2" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="441,119;489,119" d="M 441 119 L 489 119" class="a-default" data-animate="edge" style="--step: 1;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s2" data-edge-to="s3" data-edge-key="2" data-edge-id="s2-s3" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="639,119;692,119" d="M 639 119 L 692 119" class="a-default" data-animate="edge" style="--step: 2;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s3" data-edge-to="s4" data-edge-key="3" data-edge-id="s3-s4" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="767,145;767,166;49.5,166;49.5,243;65.5,243" d="M 767 145 L 767 158 Q 767 166 759 166 L 57.5 166 Q 49.5 166 49.5 174 L 49.5 235 Q 49.5 243 57.5 243 L 65.5 243" class="a-default" data-animate="edge" style="--step: 7;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s4" data-edge-to="s5" data-edge-key="4" data-edge-id="s4-s5" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="236.5,243;303.5,243" d="M 236.5 243 L 303.5 243" class="a-default" data-animate="edge" style="--step: 8;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s5" data-edge-to="s6" data-edge-key="5" data-edge-id="s5-s6" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="446.5,243;492.5,243" d="M 446.5 243 L 492.5 243" class="a-default" data-animate="edge" style="--step: 9;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s6" data-edge-to="s7" data-edge-key="6" data-edge-id="s6-s7" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="635.5,243;685,243" d="M 635.5 243 L 685 243" class="a-default" data-animate="edge" style="--step: 10;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s7" data-edge-to="s8" data-edge-key="7" data-edge-id="s7-s8" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="767,269;767,290;42.5,290;42.5,367;58.5,367" d="M 767 269 L 767 282 Q 767 290 759 290 L 50.5 290 Q 42.5 290 42.5 298 L 42.5 359 Q 42.5 367 50.5 367 L 58.5 367" class="a-default" data-animate="edge" style="--step: 11;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s8" data-edge-to="s9" data-edge-key="8" data-edge-id="s8-s9" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="243.5,367;275.5,367" d="M 243.5 367 L 275.5 367" class="a-default" data-animate="edge" style="--step: 12;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s9" data-edge-to="w1" data-edge-label="writes" data-edge-key="9" data-edge-id="s9-writes" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="375,393;375,465" d="M 375 393 L 375 465" class="a-dashed" data-animate="edge" style="--step: 12;" stroke-width="1.4" marker-end="url(#arrowhead-dashed)"/>
 
         <!-- Nodes -->
         <g id="node-s0" data-node-id="s0" data-node-label="1. Resolve the spec" tabindex="0" role="button" aria-label="Focus 1. Resolve the spec, mandao run spec-new, Steps" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run spec-new" data-node-context="Steps">
@@ -689,32 +689,32 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
 
         <g id="node-s1" data-node-id="s1" data-node-label="2. Depth" tabindex="0" role="button" aria-label="Focus 2. Depth, Steps" aria-pressed="false" data-node-kind="backend" data-node-context="Steps">
           <title>2. Depth · Steps</title>
-          <rect x="302" y="93" width="132" height="52" rx="8" class="c-mask"/>
-          <rect x="302" y="93" width="132" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 1; --flow-node-name: archify-relay-node-1;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(308 99) scale(0.6875)">
+          <rect x="309" y="93" width="132" height="52" rx="8" class="c-mask"/>
+          <rect x="309" y="93" width="132" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 1; --flow-node-name: archify-relay-node-1;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(315 99) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
-          <text data-node-label="" x="368" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">2. Depth</text>
+          <text data-node-label="" x="375" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">2. Depth</text>
         </g>
 
         <g id="node-s2" data-node-id="s2" data-node-label="3. Impact analysis" tabindex="0" role="button" aria-label="Focus 3. Impact analysis, Steps" aria-pressed="false" data-node-kind="backend" data-node-context="Steps">
           <title>3. Impact analysis · Steps</title>
-          <rect x="482" y="93" width="150" height="52" rx="8" class="c-mask"/>
-          <rect x="482" y="93" width="150" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 2; --flow-node-name: archify-relay-node-2;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(488 99) scale(0.6875)">
+          <rect x="489" y="93" width="150" height="52" rx="8" class="c-mask"/>
+          <rect x="489" y="93" width="150" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 2; --flow-node-name: archify-relay-node-2;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(495 99) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
-          <text data-node-label="" x="560.4" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">3. Impact analysis</text>
+          <text data-node-label="" x="567.4" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">3. Impact analysis</text>
         </g>
 
         <g id="node-s3" data-node-id="s3" data-node-label="4. requirements.md" tabindex="0" role="button" aria-label="Focus 4. requirements.md, Steps" aria-pressed="false" data-node-kind="backend" data-node-context="Steps">
           <title>4. requirements.md · Steps</title>
-          <rect x="685" y="93" width="150" height="52" rx="8" class="c-mask"/>
-          <rect x="685" y="93" width="150" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 3; --flow-node-name: archify-relay-node-3;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(691 99) scale(0.6875)">
+          <rect x="692" y="93" width="150" height="52" rx="8" class="c-mask"/>
+          <rect x="692" y="93" width="150" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 3; --flow-node-name: archify-relay-node-3;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(698 99) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
-          <text data-node-label="" x="763.4" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">4. requirements.md</text>
+          <text data-node-label="" x="770.4" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">4. requirements.md</text>
         </g>
 
         <g id="node-s4" data-node-id="s4" data-node-label="5. design.md" tabindex="0" role="button" aria-label="Focus 5. design.md, mandao run premise +1, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run premise +1" data-node-context="Steps, continued">
@@ -730,33 +730,33 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
 
         <g id="node-s5" data-node-id="s5" data-node-label="5b. quickstart.md" tabindex="0" role="button" aria-label="Focus 5b. quickstart.md, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-context="Steps, continued">
           <title>5b. quickstart.md · Steps, continued</title>
-          <rect x="296.5" y="217" width="143" height="52" rx="8" class="c-mask"/>
-          <rect x="296.5" y="217" width="143" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 9; --flow-node-name: archify-relay-node-5;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(302.5 223) scale(0.6875)">
+          <rect x="303.5" y="217" width="143" height="52" rx="8" class="c-mask"/>
+          <rect x="303.5" y="217" width="143" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 9; --flow-node-name: archify-relay-node-5;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(309.5 223) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
-          <text data-node-label="" x="371.6" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">5b. quickstart.md</text>
+          <text data-node-label="" x="378.6" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">5b. quickstart.md</text>
         </g>
 
         <g id="node-s6" data-node-id="s6" data-node-label="5c. data-model.md" tabindex="0" role="button" aria-label="Focus 5c. data-model.md, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-context="Steps, continued">
           <title>5c. data-model.md · Steps, continued</title>
-          <rect x="485.5" y="217" width="143" height="52" rx="8" class="c-mask"/>
-          <rect x="485.5" y="217" width="143" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 10; --flow-node-name: archify-relay-node-6;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(491.5 223) scale(0.6875)">
+          <rect x="492.5" y="217" width="143" height="52" rx="8" class="c-mask"/>
+          <rect x="492.5" y="217" width="143" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 10; --flow-node-name: archify-relay-node-6;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(498.5 223) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
-          <text data-node-label="" x="560.6" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">5c. data-model.md</text>
+          <text data-node-label="" x="567.6" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">5c. data-model.md</text>
         </g>
 
         <g id="node-s7" data-node-id="s7" data-node-label="6. Consistency Check" tabindex="0" role="button" aria-label="Focus 6. Consistency Check, mandao run trace, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run trace" data-node-context="Steps, continued">
           <title>6. Consistency Check · mandao run trace · Steps, continued</title>
-          <rect x="678" y="217" width="164" height="52" rx="8" class="c-mask"/>
-          <rect x="678" y="217" width="164" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 11; --flow-node-name: archify-relay-node-7;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(684 223) scale(0.6875)">
+          <rect x="685" y="217" width="164" height="52" rx="8" class="c-mask"/>
+          <rect x="685" y="217" width="164" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 11; --flow-node-name: archify-relay-node-7;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(691 223) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
-          <text data-node-label="" x="763" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">6. Consistency Check</text>
-          <text x="760" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run trace</text>
+          <text data-node-label="" x="770" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">6. Consistency Check</text>
+          <text x="767" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run trace</text>
         </g>
 
         <g id="node-s8" data-node-id="s8" data-node-label="7. Diagram for approval" tabindex="0" role="button" aria-label="Focus 7. Diagram for approval, mandao run diagram, Steps, continued" aria-pressed="false" data-node-kind="security" data-node-sublabel="mandao run diagram" data-node-context="Steps, continued">
@@ -771,15 +771,15 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
           <text x="151" y="379" class="t-muted" font-size="8" text-anchor="middle">mandao run diagram</text>
         </g>
 
-        <g id="node-s9" data-node-id="s9" data-node-label="8. Close" tabindex="0" role="button" aria-label="Focus 8. Close, mandao run commit-spec, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run commit-spec" data-node-context="Steps, continued">
-          <title>8. Close · mandao run commit-spec · Steps, continued</title>
-          <rect x="279" y="341" width="178" height="52" rx="8" class="c-mask"/>
-          <rect x="279" y="341" width="178" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 12; --flow-node-name: archify-relay-node-9;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(285 347) scale(0.6875)">
+        <g id="node-s9" data-node-id="s9" data-node-label="8. Close" tabindex="0" role="button" aria-label="Focus 8. Close, mandao run commit-spec +1, Steps, continued" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run commit-spec +1" data-node-context="Steps, continued">
+          <title>8. Close · mandao run commit-spec +1 · Steps, continued</title>
+          <rect x="275.5" y="341" width="199" height="52" rx="8" class="c-mask"/>
+          <rect x="275.5" y="341" width="199" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 12; --flow-node-name: archify-relay-node-9;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(281.5 347) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
-          <text data-node-label="" x="368" y="362" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">8. Close</text>
-          <text x="368" y="379" class="t-muted" font-size="8" text-anchor="middle">mandao run commit-spec</text>
+          <text data-node-label="" x="375" y="362" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">8. Close</text>
+          <text x="375" y="379" class="t-muted" font-size="8" text-anchor="middle">mandao run commit-spec +1</text>
         </g>
 
         <g id="node-w0" data-node-id="w0" data-node-label="specs/&lt;ID&gt;/requirements.md" tabindex="0" role="button" aria-label="Focus specs/&lt;ID&gt;/requirements.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
@@ -795,35 +795,35 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
 
         <g id="node-w1" data-node-id="w1" data-node-label="specs/&lt;ID&gt;/design.md" tabindex="0" role="button" aria-label="Focus specs/&lt;ID&gt;/design.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
           <title>specs/&lt;ID&gt;/design.md · Writes</title>
-          <rect x="286" y="465" width="164" height="52" rx="8" class="c-mask"/>
-          <rect x="286" y="465" width="164" height="52" rx="8" class="c-database" data-animate="node" style="--step: 12; --flow-node-name: archify-relay-node-10;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="database" class="semantic-sigil s-database" transform="translate(292 471) scale(0.6875)">
+          <rect x="293" y="465" width="164" height="52" rx="8" class="c-mask"/>
+          <rect x="293" y="465" width="164" height="52" rx="8" class="c-database" data-animate="node" style="--step: 12; --flow-node-name: archify-relay-node-10;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="database" class="semantic-sigil s-database" transform="translate(299 471) scale(0.6875)">
             <ellipse cx="8" cy="4" rx="5" ry="2"/>
             <path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4M3 8c0 1.1 2.2 2 5 2s5-.9 5-2"/>
           </g>
-          <text data-node-label="" x="371" y="486" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">specs/&lt;ID&gt;/design.md</text>
+          <text data-node-label="" x="378" y="486" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">specs/&lt;ID&gt;/design.md</text>
         </g>
 
         <g id="node-w2" data-node-id="w2" data-node-label="specs/&lt;ID&gt;/spec.md" tabindex="0" role="button" aria-label="Focus specs/&lt;ID&gt;/spec.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
           <title>specs/&lt;ID&gt;/spec.md · Writes</title>
-          <rect x="482" y="465" width="150" height="52" rx="8" class="c-mask"/>
-          <rect x="482" y="465" width="150" height="52" rx="8" class="c-database" data-animate="node" style="--step: 12;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="database" class="semantic-sigil s-database" transform="translate(488 471) scale(0.6875)">
+          <rect x="489" y="465" width="150" height="52" rx="8" class="c-mask"/>
+          <rect x="489" y="465" width="150" height="52" rx="8" class="c-database" data-animate="node" style="--step: 12;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="database" class="semantic-sigil s-database" transform="translate(495 471) scale(0.6875)">
             <ellipse cx="8" cy="4" rx="5" ry="2"/>
             <path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4M3 8c0 1.1 2.2 2 5 2s5-.9 5-2"/>
           </g>
-          <text data-node-label="" x="560.4" y="486" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">specs/&lt;ID&gt;/spec.md</text>
+          <text data-node-label="" x="567.4" y="486" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">specs/&lt;ID&gt;/spec.md</text>
         </g>
 
         <g id="node-w3" data-node-id="w3" data-node-label="specs/&lt;ID&gt;/quickstart.md" tabindex="0" role="button" aria-label="Focus specs/&lt;ID&gt;/quickstart.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
           <title>specs/&lt;ID&gt;/quickstart.md · Writes</title>
-          <rect x="664" y="465" width="192" height="52" rx="8" class="c-mask"/>
-          <rect x="664" y="465" width="192" height="52" rx="8" class="c-database" data-animate="node" style="--step: 12;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="database" class="semantic-sigil s-database" transform="translate(670 471) scale(0.6875)">
+          <rect x="671" y="465" width="192" height="52" rx="8" class="c-mask"/>
+          <rect x="671" y="465" width="192" height="52" rx="8" class="c-database" data-animate="node" style="--step: 12;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="database" class="semantic-sigil s-database" transform="translate(677 471) scale(0.6875)">
             <ellipse cx="8" cy="4" rx="5" ry="2"/>
             <path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4M3 8c0 1.1 2.2 2 5 2s5-.9 5-2"/>
           </g>
-          <text data-node-label="" x="762.2" y="486" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">specs/&lt;ID&gt;/quickstart.md</text>
+          <text data-node-label="" x="769.2" y="486" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">specs/&lt;ID&gt;/quickstart.md</text>
         </g>
 
         <!-- Edge labels -->
@@ -837,8 +837,8 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
 
 
         <g data-edge-from="s9" data-edge-to="w1" data-edge-label="writes" data-edge-key="9" data-edge-id="s9-writes">
-          <rect x="348.6" y="419" width="38.8" height="14" rx="3" class="c-mask"/>
-          <text x="368" y="429" class="t-edge-dashed" font-size="8" text-anchor="middle">writes</text>
+          <rect x="355.6" y="419" width="38.8" height="14" rx="3" class="c-mask"/>
+          <text x="375" y="429" class="t-edge-dashed" font-size="8" text-anchor="middle">writes</text>
         </g>
 
         <!-- Legend -->
diff --git a/docs/diagrams/command-story-dark.svg b/docs/diagrams/command-story-dark.svg
index 56d7234..515220b 100644
--- a/docs/diagrams/command-story-dark.svg
+++ b/docs/diagrams/command-story-dark.svg
@@ -1,5 +1,5 @@
 <?xml version="1.0" encoding="UTF-8"?>
-<!-- mandao:diagram command-story spec-sha256 4ad41e5852dbb798ef260cefdf024717c0a58bf7292ad8f10d4751bb23a130f4 — generated by npm run diagrams, do not edit -->
+<!-- mandao:diagram command-story spec-sha256 198d75dbdddf67328fd5c90e9bea1bd512c41f90c81ac47c636cacaebf57e7a6 — generated by npm run diagrams, do not edit -->
 <svg viewBox="0 0 1051 404" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 5.360s; width: 1051px; height: 404px; min-width: 0px;" width="1051" height="404" xmlns="http://www.w3.org/2000/svg"><style>
 /*
 JetBrains Mono variable WOFF2 subsets from Google Fonts service revision v24.
@@ -593,8 +593,8 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
           <text data-node-label="" x="571.1" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">3. Write story.md</text>
         </g>
 
-        <g id="node-s3" data-node-id="s3" data-node-label="4. Approve" tabindex="0" role="button" aria-label="Focus 4. Approve, Steps" aria-pressed="false" data-node-kind="security" data-node-context="Steps">
-          <title>4. Approve · Steps</title>
+        <g id="node-s3" data-node-id="s3" data-node-label="4. Approve" tabindex="0" role="button" aria-label="Focus 4. Approve, mandao run next, Steps" aria-pressed="false" data-node-kind="security" data-node-sublabel="mandao run next" data-node-context="Steps">
+          <title>4. Approve · mandao run next · Steps</title>
           <rect x="671" y="93" width="132" height="52" rx="8" class="c-mask"/>
           <rect x="671" y="93" width="132" height="52" rx="8" class="c-security" data-animate="node" style="--step: 3; --flow-node-name: archify-relay-node-3;" stroke-width="1.5"/>
           <g aria-hidden="true" data-semantic-sigil="security" class="semantic-sigil s-security" transform="translate(677 99) scale(0.6875)">
@@ -602,6 +602,7 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
             <path d="m5.8 8 1.5 1.5 3-3"/>
           </g>
           <text data-node-label="" x="737" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">4. Approve</text>
+          <text x="737" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run next</text>
         </g>
 
         <g id="node-w0" data-node-id="w0" data-node-label="specs/&lt;ID&gt;/story.md" tabindex="0" role="button" aria-label="Focus specs/&lt;ID&gt;/story.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
diff --git a/docs/diagrams/command-story-light.svg b/docs/diagrams/command-story-light.svg
index 4795416..560cb63 100644
--- a/docs/diagrams/command-story-light.svg
+++ b/docs/diagrams/command-story-light.svg
@@ -1,5 +1,5 @@
 <?xml version="1.0" encoding="UTF-8"?>
-<!-- mandao:diagram command-story spec-sha256 4ad41e5852dbb798ef260cefdf024717c0a58bf7292ad8f10d4751bb23a130f4 — generated by npm run diagrams, do not edit -->
+<!-- mandao:diagram command-story spec-sha256 198d75dbdddf67328fd5c90e9bea1bd512c41f90c81ac47c636cacaebf57e7a6 — generated by npm run diagrams, do not edit -->
 <svg viewBox="0 0 1051 404" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 5.360s; width: 1051px; height: 404px; min-width: 0px;" width="1051" height="404" xmlns="http://www.w3.org/2000/svg"><style>
 /*
 JetBrains Mono variable WOFF2 subsets from Google Fonts service revision v24.
@@ -593,8 +593,8 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
           <text data-node-label="" x="571.1" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">3. Write story.md</text>
         </g>
 
-        <g id="node-s3" data-node-id="s3" data-node-label="4. Approve" tabindex="0" role="button" aria-label="Focus 4. Approve, Steps" aria-pressed="false" data-node-kind="security" data-node-context="Steps">
-          <title>4. Approve · Steps</title>
+        <g id="node-s3" data-node-id="s3" data-node-label="4. Approve" tabindex="0" role="button" aria-label="Focus 4. Approve, mandao run next, Steps" aria-pressed="false" data-node-kind="security" data-node-sublabel="mandao run next" data-node-context="Steps">
+          <title>4. Approve · mandao run next · Steps</title>
           <rect x="671" y="93" width="132" height="52" rx="8" class="c-mask"/>
           <rect x="671" y="93" width="132" height="52" rx="8" class="c-security" data-animate="node" style="--step: 3; --flow-node-name: archify-relay-node-3;" stroke-width="1.5"/>
           <g aria-hidden="true" data-semantic-sigil="security" class="semantic-sigil s-security" transform="translate(677 99) scale(0.6875)">
@@ -602,6 +602,7 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
             <path d="m5.8 8 1.5 1.5 3-3"/>
           </g>
           <text data-node-label="" x="737" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">4. Approve</text>
+          <text x="737" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run next</text>
         </g>
 
         <g id="node-w0" data-node-id="w0" data-node-label="specs/&lt;ID&gt;/story.md" tabindex="0" role="button" aria-label="Focus specs/&lt;ID&gt;/story.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
diff --git a/docs/diagrams/command-tasks-dark.svg b/docs/diagrams/command-tasks-dark.svg
index 13d6d7f..dfca0e4 100644
--- a/docs/diagrams/command-tasks-dark.svg
+++ b/docs/diagrams/command-tasks-dark.svg
@@ -1,5 +1,5 @@
 <?xml version="1.0" encoding="UTF-8"?>
-<!-- mandao:diagram command-tasks spec-sha256 6732f02bf4e811f64cbd05427535ebd21b65b36840c68ab0ae40ebbacb723ed5 — generated by npm run diagrams, do not edit -->
+<!-- mandao:diagram command-tasks spec-sha256 94e8ede91c41d883fb806e866f58f6168e7aacdb7574aebe54ee0c5674fd0276 — generated by npm run diagrams, do not edit -->
 <svg viewBox="0 0 1067 528" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 8.504s; width: 1067px; height: 528px; min-width: 0px;" width="1067" height="528" xmlns="http://www.w3.org/2000/svg"><style>
 /*
 JetBrains Mono variable WOFF2 subsets from Google Fonts service revision v24.
@@ -633,7 +633,7 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
         <path data-edge-from="s3" data-edge-to="s4" data-edge-key="3" data-edge-id="s3-s4" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="753,145;753,166;32,166;32,243;48,243" d="M 753 145 L 753 158 Q 753 166 745 166 L 40 166 Q 32 166 32 174 L 32 235 Q 32 243 40 243 L 48 243" class="a-default" data-animate="edge" style="--step: 7;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
         <path data-edge-from="s4" data-edge-to="s5" data-edge-key="4" data-edge-id="s4-s5" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="240,243;277.5,243" d="M 240 243 L 277.5 243" class="a-default" data-animate="edge" style="--step: 8;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
         <path data-edge-from="s5" data-edge-to="s6" data-edge-key="5" data-edge-id="s5-s6" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="409.5,243;468,243" d="M 409.5 243 L 468 243" class="a-default" data-animate="edge" style="--step: 9;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s6" data-edge-to="s7" data-edge-key="6" data-edge-id="s6-s7" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="625,243;664,243" d="M 625 243 L 664 243" class="a-default" data-animate="edge" style="--step: 10;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s6" data-edge-to="s7" data-edge-key="6" data-edge-id="s6-s7" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="625,243;678,243" d="M 625 243 L 678 243" class="a-default" data-animate="edge" style="--step: 10;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
         <path data-edge-from="s7" data-edge-to="w1" data-edge-label="writes" data-edge-key="7" data-edge-id="s7-writes" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="753,269;753,367;432.5,367" d="M 753 269 L 753 359 Q 753 367 745 367 L 432.5 367" class="a-dashed" data-animate="edge" style="--step: 11;" stroke-width="1.4" marker-end="url(#arrowhead-dashed)"/>
 
         <!-- Nodes -->
@@ -710,16 +710,16 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
           <text x="546.5" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run tasks +1</text>
         </g>
 
-        <g id="node-s7" data-node-id="s7" data-node-label="8. Approve" tabindex="0" role="button" aria-label="Focus 8. Approve, mandao run commit-spec, Steps, continued" aria-pressed="false" data-node-kind="security" data-node-sublabel="mandao run commit-spec" data-node-context="Steps, continued">
-          <title>8. Approve · mandao run commit-spec · Steps, continued</title>
-          <rect x="664" y="217" width="178" height="52" rx="8" class="c-mask"/>
-          <rect x="664" y="217" width="178" height="52" rx="8" class="c-security" data-animate="node" style="--step: 11; --flow-node-name: archify-relay-node-7;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="security" class="semantic-sigil s-security" transform="translate(670 223) scale(0.6875)">
+        <g id="node-s7" data-node-id="s7" data-node-label="8. Approve" tabindex="0" role="button" aria-label="Focus 8. Approve, mandao run next +1, Steps, continued" aria-pressed="false" data-node-kind="security" data-node-sublabel="mandao run next +1" data-node-context="Steps, continued">
+          <title>8. Approve · mandao run next +1 · Steps, continued</title>
+          <rect x="678" y="217" width="150" height="52" rx="8" class="c-mask"/>
+          <rect x="678" y="217" width="150" height="52" rx="8" class="c-security" data-animate="node" style="--step: 11; --flow-node-name: archify-relay-node-7;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="security" class="semantic-sigil s-security" transform="translate(684 223) scale(0.6875)">
             <path d="M8 2.2 13 4v3.5c0 3.1-1.8 5.4-5 6.5-3.2-1.1-5-3.4-5-6.5V4Z"/>
             <path d="m5.8 8 1.5 1.5 3-3"/>
           </g>
           <text data-node-label="" x="753" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">8. Approve</text>
-          <text x="753" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run commit-spec</text>
+          <text x="753" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run next +1</text>
         </g>
 
         <g id="node-w0" data-node-id="w0" data-node-label="specs/&lt;ID&gt;/tasks.md" tabindex="0" role="button" aria-label="Focus specs/&lt;ID&gt;/tasks.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
diff --git a/docs/diagrams/command-tasks-light.svg b/docs/diagrams/command-tasks-light.svg
index cc602be..4b66eb2 100644
--- a/docs/diagrams/command-tasks-light.svg
+++ b/docs/diagrams/command-tasks-light.svg
@@ -1,5 +1,5 @@
 <?xml version="1.0" encoding="UTF-8"?>
-<!-- mandao:diagram command-tasks spec-sha256 6732f02bf4e811f64cbd05427535ebd21b65b36840c68ab0ae40ebbacb723ed5 — generated by npm run diagrams, do not edit -->
+<!-- mandao:diagram command-tasks spec-sha256 94e8ede91c41d883fb806e866f58f6168e7aacdb7574aebe54ee0c5674fd0276 — generated by npm run diagrams, do not edit -->
 <svg viewBox="0 0 1067 528" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 8.504s; width: 1067px; height: 528px; min-width: 0px;" width="1067" height="528" xmlns="http://www.w3.org/2000/svg"><style>
 /*
 JetBrains Mono variable WOFF2 subsets from Google Fonts service revision v24.
@@ -633,7 +633,7 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
         <path data-edge-from="s3" data-edge-to="s4" data-edge-key="3" data-edge-id="s3-s4" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="753,145;753,166;32,166;32,243;48,243" d="M 753 145 L 753 158 Q 753 166 745 166 L 40 166 Q 32 166 32 174 L 32 235 Q 32 243 40 243 L 48 243" class="a-default" data-animate="edge" style="--step: 7;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
         <path data-edge-from="s4" data-edge-to="s5" data-edge-key="4" data-edge-id="s4-s5" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="240,243;277.5,243" d="M 240 243 L 277.5 243" class="a-default" data-animate="edge" style="--step: 8;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
         <path data-edge-from="s5" data-edge-to="s6" data-edge-key="5" data-edge-id="s5-s6" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="409.5,243;468,243" d="M 409.5 243 L 468 243" class="a-default" data-animate="edge" style="--step: 9;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s6" data-edge-to="s7" data-edge-key="6" data-edge-id="s6-s7" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="625,243;664,243" d="M 625 243 L 664 243" class="a-default" data-animate="edge" style="--step: 10;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s6" data-edge-to="s7" data-edge-key="6" data-edge-id="s6-s7" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="625,243;678,243" d="M 625 243 L 678 243" class="a-default" data-animate="edge" style="--step: 10;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
         <path data-edge-from="s7" data-edge-to="w1" data-edge-label="writes" data-edge-key="7" data-edge-id="s7-writes" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="753,269;753,367;432.5,367" d="M 753 269 L 753 359 Q 753 367 745 367 L 432.5 367" class="a-dashed" data-animate="edge" style="--step: 11;" stroke-width="1.4" marker-end="url(#arrowhead-dashed)"/>
 
         <!-- Nodes -->
@@ -710,16 +710,16 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
           <text x="546.5" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run tasks +1</text>
         </g>
 
-        <g id="node-s7" data-node-id="s7" data-node-label="8. Approve" tabindex="0" role="button" aria-label="Focus 8. Approve, mandao run commit-spec, Steps, continued" aria-pressed="false" data-node-kind="security" data-node-sublabel="mandao run commit-spec" data-node-context="Steps, continued">
-          <title>8. Approve · mandao run commit-spec · Steps, continued</title>
-          <rect x="664" y="217" width="178" height="52" rx="8" class="c-mask"/>
-          <rect x="664" y="217" width="178" height="52" rx="8" class="c-security" data-animate="node" style="--step: 11; --flow-node-name: archify-relay-node-7;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="security" class="semantic-sigil s-security" transform="translate(670 223) scale(0.6875)">
+        <g id="node-s7" data-node-id="s7" data-node-label="8. Approve" tabindex="0" role="button" aria-label="Focus 8. Approve, mandao run next +1, Steps, continued" aria-pressed="false" data-node-kind="security" data-node-sublabel="mandao run next +1" data-node-context="Steps, continued">
+          <title>8. Approve · mandao run next +1 · Steps, continued</title>
+          <rect x="678" y="217" width="150" height="52" rx="8" class="c-mask"/>
+          <rect x="678" y="217" width="150" height="52" rx="8" class="c-security" data-animate="node" style="--step: 11; --flow-node-name: archify-relay-node-7;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="security" class="semantic-sigil s-security" transform="translate(684 223) scale(0.6875)">
             <path d="M8 2.2 13 4v3.5c0 3.1-1.8 5.4-5 6.5-3.2-1.1-5-3.4-5-6.5V4Z"/>
             <path d="m5.8 8 1.5 1.5 3-3"/>
           </g>
           <text data-node-label="" x="753" y="238" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">8. Approve</text>
-          <text x="753" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run commit-spec</text>
+          <text x="753" y="255" class="t-muted" font-size="8" text-anchor="middle">mandao run next +1</text>
         </g>
 
         <g id="node-w0" data-node-id="w0" data-node-label="specs/&lt;ID&gt;/tasks.md" tabindex="0" role="button" aria-label="Focus specs/&lt;ID&gt;/tasks.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
diff --git a/docs/diagrams/command-verify-dark.svg b/docs/diagrams/command-verify-dark.svg
index 6f3c2cd..a8a0a44 100644
--- a/docs/diagrams/command-verify-dark.svg
+++ b/docs/diagrams/command-verify-dark.svg
@@ -1,5 +1,5 @@
 <?xml version="1.0" encoding="UTF-8"?>
-<!-- mandao:diagram command-verify spec-sha256 d4d910c87b3553c4f898eaf676266a866afdd3261d8af2c17841b75eb614255b — generated by npm run diagrams, do not edit -->
+<!-- mandao:diagram command-verify spec-sha256 f5622dfe8078303ae2b7a4b9dbc1d4a8b0227190a890fea80433a00db79bac05 — generated by npm run diagrams, do not edit -->
 <svg viewBox="0 0 1072 404" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 4.499s; width: 1072px; height: 404px; min-width: 0px;" width="1072" height="404" xmlns="http://www.w3.org/2000/svg"><style>
 /*
 JetBrains Mono variable WOFF2 subsets from Google Fonts service revision v24.
@@ -594,15 +594,15 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
           <text data-node-label="" x="578" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">3. Report</text>
         </g>
 
-        <g id="node-s3" data-node-id="s3" data-node-label="4. Status" tabindex="0" role="button" aria-label="Focus 4. Status, mandao run status +1, Steps" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run status +1" data-node-context="Steps">
-          <title>4. Status · mandao run status +1 · Steps</title>
+        <g id="node-s3" data-node-id="s3" data-node-label="4. Status" tabindex="0" role="button" aria-label="Focus 4. Status, mandao run status +2, Steps" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run status +2" data-node-context="Steps">
+          <title>4. Status · mandao run status +2 · Steps</title>
           <rect x="676" y="93" width="164" height="52" rx="8" class="c-mask"/>
           <rect x="676" y="93" width="164" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 3; --flow-node-name: archify-relay-node-3;" stroke-width="1.5"/>
           <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(682 99) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
           <text data-node-label="" x="758" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">4. Status</text>
-          <text x="758" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run status +1</text>
+          <text x="758" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run status +2</text>
         </g>
 
         <g id="node-w0" data-node-id="w0" data-node-label="specs/&lt;ID&gt;/verify-report.md" tabindex="0" role="button" aria-label="Focus specs/&lt;ID&gt;/verify-report.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
diff --git a/docs/diagrams/command-verify-light.svg b/docs/diagrams/command-verify-light.svg
index f09e6de..7a5ddf4 100644
--- a/docs/diagrams/command-verify-light.svg
+++ b/docs/diagrams/command-verify-light.svg
@@ -1,5 +1,5 @@
 <?xml version="1.0" encoding="UTF-8"?>
-<!-- mandao:diagram command-verify spec-sha256 d4d910c87b3553c4f898eaf676266a866afdd3261d8af2c17841b75eb614255b — generated by npm run diagrams, do not edit -->
+<!-- mandao:diagram command-verify spec-sha256 f5622dfe8078303ae2b7a4b9dbc1d4a8b0227190a890fea80433a00db79bac05 — generated by npm run diagrams, do not edit -->
 <svg viewBox="0 0 1072 404" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 4.499s; width: 1072px; height: 404px; min-width: 0px;" width="1072" height="404" xmlns="http://www.w3.org/2000/svg"><style>
 /*
 JetBrains Mono variable WOFF2 subsets from Google Fonts service revision v24.
@@ -594,15 +594,15 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
           <text data-node-label="" x="578" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">3. Report</text>
         </g>
 
-        <g id="node-s3" data-node-id="s3" data-node-label="4. Status" tabindex="0" role="button" aria-label="Focus 4. Status, mandao run status +1, Steps" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run status +1" data-node-context="Steps">
-          <title>4. Status · mandao run status +1 · Steps</title>
+        <g id="node-s3" data-node-id="s3" data-node-label="4. Status" tabindex="0" role="button" aria-label="Focus 4. Status, mandao run status +2, Steps" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run status +2" data-node-context="Steps">
+          <title>4. Status · mandao run status +2 · Steps</title>
           <rect x="676" y="93" width="164" height="52" rx="8" class="c-mask"/>
           <rect x="676" y="93" width="164" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 3; --flow-node-name: archify-relay-node-3;" stroke-width="1.5"/>
           <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(682 99) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
           <text data-node-label="" x="758" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">4. Status</text>
-          <text x="758" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run status +1</text>
+          <text x="758" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run status +2</text>
         </g>
 
         <g id="node-w0" data-node-id="w0" data-node-label="specs/&lt;ID&gt;/verify-report.md" tabindex="0" role="button" aria-label="Focus specs/&lt;ID&gt;/verify-report.md, Writes" aria-pressed="false" data-node-kind="database" data-node-context="Writes">
diff --git a/docs/diagrams/src/command-clarify.json b/docs/diagrams/src/command-clarify.json
index 57615d4..9ff91e0 100644
--- a/docs/diagrams/src/command-clarify.json
+++ b/docs/diagrams/src/command-clarify.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,22 +39,22 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     }
   ],
-  "specSha256": "38daea5d0d997e446da48875590623f5a8c8650b582bcefa68eb75e0a57626d4",
+  "specSha256": "12de41fc3cd06302e3cbddd14f0826aac6045d5cb31b8f68755b68319f390165",
   "spec": {
     "schema_version": 2,
     "diagram_type": "workflow",
@@ -144,7 +144,7 @@
         "col": 0,
         "type": "backend",
         "label": "5. Re-run mandao run…",
-        "sublabel": "mandao run trace +1",
+        "sublabel": "mandao run trace +2",
         "width": 171
       },
       {
diff --git a/docs/diagrams/src/command-close.json b/docs/diagrams/src/command-close.json
index 642cc62..8e7bd6a 100644
--- a/docs/diagrams/src/command-close.json
+++ b/docs/diagrams/src/command-close.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,19 +39,19 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     }
   ],
   "specSha256": "12b2fccbab73bf4ec0e087a3aa3058aed25d1c4c0c300c90a30bad7a248e804d",
diff --git a/docs/diagrams/src/command-constitution.json b/docs/diagrams/src/command-constitution.json
index 277bce6..2e3bec9 100644
--- a/docs/diagrams/src/command-constitution.json
+++ b/docs/diagrams/src/command-constitution.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,19 +39,19 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     }
   ],
   "specSha256": "ebf87e7c6e220e028831ddefc1d02702f4fc412cb659cac42c470d20c2db557c",
diff --git a/docs/diagrams/src/command-implement.json b/docs/diagrams/src/command-implement.json
index a4403ec..6cb0d3c 100644
--- a/docs/diagrams/src/command-implement.json
+++ b/docs/diagrams/src/command-implement.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,22 +39,22 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     }
   ],
-  "specSha256": "54de3a77ab2e60021f50dc9ec066878ca7b28c3a1356cb32793d9862427b72bc",
+  "specSha256": "a9ad56e012bca26311f27cfade390a5856ba8280da5b13bec4375d1456704247",
   "spec": {
     "schema_version": 2,
     "diagram_type": "workflow",
@@ -123,7 +123,7 @@
         "col": 2,
         "type": "backend",
         "label": "2. After the last task",
-        "sublabel": "mandao run implement-summary +1",
+        "sublabel": "mandao run implement-summary +2",
         "width": 241
       },
       {
diff --git a/docs/diagrams/src/command-init.json b/docs/diagrams/src/command-init.json
index 366f3e7..3657c25 100644
--- a/docs/diagrams/src/command-init.json
+++ b/docs/diagrams/src/command-init.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,19 +39,19 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     }
   ],
   "specSha256": "a3c0616fb27f5e48a1c34864ac62cdcf9304d5563742645197e843d4baae36a3",
diff --git a/docs/diagrams/src/command-quick.json b/docs/diagrams/src/command-quick.json
index 0c13e6a..8110d27 100644
--- a/docs/diagrams/src/command-quick.json
+++ b/docs/diagrams/src/command-quick.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,22 +39,22 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     }
   ],
-  "specSha256": "c9f7946341838572766d0c8b75a5d658c4bac1d452bf728c77749b29342765b6",
+  "specSha256": "3ddff9ffdf73af778f37fbc524335a8f72c9b9537408044c986811efc2c1962b",
   "spec": {
     "schema_version": 2,
     "diagram_type": "workflow",
@@ -152,7 +152,7 @@
         "col": 1,
         "type": "backend",
         "label": "6. Record and commit",
-        "sublabel": "mandao run quick-log",
+        "sublabel": "mandao run cost +1",
         "width": 164
       },
       {
diff --git a/docs/diagrams/src/command-resume.json b/docs/diagrams/src/command-resume.json
index 0689baf..0ec5984 100644
--- a/docs/diagrams/src/command-resume.json
+++ b/docs/diagrams/src/command-resume.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,19 +39,19 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     }
   ],
   "specSha256": "d36ba4ba1467a8705683e822d65fccc9b89f38f12abda21a8c36460e0c8b0d36",
diff --git a/docs/diagrams/src/command-specify.json b/docs/diagrams/src/command-specify.json
index d9df702..18a3dc9 100644
--- a/docs/diagrams/src/command-specify.json
+++ b/docs/diagrams/src/command-specify.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,22 +39,22 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     }
   ],
-  "specSha256": "1abd27d8634395d9ffe777c6ef9641a136db498d991c72368572988bcaf98bb7",
+  "specSha256": "5ab623dd96fc991e9f9694400515ddeb6d68a97188803725a109c11bc421f0ae",
   "spec": {
     "schema_version": 2,
     "diagram_type": "workflow",
@@ -190,8 +190,8 @@
         "col": 1,
         "type": "backend",
         "label": "8. Close",
-        "sublabel": "mandao run commit-spec",
-        "width": 178
+        "sublabel": "mandao run commit-spec +1",
+        "width": 199
       },
       {
         "id": "w0",
diff --git a/docs/diagrams/src/command-story.json b/docs/diagrams/src/command-story.json
index 4e788eb..db94f4a 100644
--- a/docs/diagrams/src/command-story.json
+++ b/docs/diagrams/src/command-story.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,22 +39,22 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     }
   ],
-  "specSha256": "4ad41e5852dbb798ef260cefdf024717c0a58bf7292ad8f10d4751bb23a130f4",
+  "specSha256": "198d75dbdddf67328fd5c90e9bea1bd512c41f90c81ac47c636cacaebf57e7a6",
   "spec": {
     "schema_version": 2,
     "diagram_type": "workflow",
@@ -131,6 +131,7 @@
         "col": 3,
         "type": "security",
         "label": "4. Approve",
+        "sublabel": "mandao run next",
         "width": 132
       },
       {
diff --git a/docs/diagrams/src/command-tasks.json b/docs/diagrams/src/command-tasks.json
index 354302d..9c1acd6 100644
--- a/docs/diagrams/src/command-tasks.json
+++ b/docs/diagrams/src/command-tasks.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,22 +39,22 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     }
   ],
-  "specSha256": "6732f02bf4e811f64cbd05427535ebd21b65b36840c68ab0ae40ebbacb723ed5",
+  "specSha256": "94e8ede91c41d883fb806e866f58f6168e7aacdb7574aebe54ee0c5674fd0276",
   "spec": {
     "schema_version": 2,
     "diagram_type": "workflow",
@@ -169,8 +169,8 @@
         "col": 3,
         "type": "security",
         "label": "8. Approve",
-        "sublabel": "mandao run commit-spec",
-        "width": 178
+        "sublabel": "mandao run next +1",
+        "width": 150
       },
       {
         "id": "w0",
diff --git a/docs/diagrams/src/command-verify.json b/docs/diagrams/src/command-verify.json
index b3537f0..d447164 100644
--- a/docs/diagrams/src/command-verify.json
+++ b/docs/diagrams/src/command-verify.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,22 +39,22 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     }
   ],
-  "specSha256": "d4d910c87b3553c4f898eaf676266a866afdd3261d8af2c17841b75eb614255b",
+  "specSha256": "f5622dfe8078303ae2b7a4b9dbc1d4a8b0227190a890fea80433a00db79bac05",
   "spec": {
     "schema_version": 2,
     "diagram_type": "workflow",
@@ -132,7 +132,7 @@
         "col": 3,
         "type": "backend",
         "label": "4. Status",
-        "sublabel": "mandao run status +1",
+        "sublabel": "mandao run status +2",
         "width": 164
       },
       {
diff --git a/docs/diagrams/src/lifecycle.json b/docs/diagrams/src/lifecycle.json
index eeec79f..8e1bad6 100644
--- a/docs/diagrams/src/lifecycle.json
+++ b/docs/diagrams/src/lifecycle.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,19 +39,19 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     },
     {
       "path": "src/cli/approve.ts",
@@ -63,7 +63,7 @@
     },
     {
       "path": "src/scripts/spec.ts",
-      "sha256": "bbca159765c9a7b44e7943604f2ca6b4fa5445d66d25a72d8401d7a8e0e8e769"
+      "sha256": "d9e2925c0e400dbe0d021c161e9694781fe68494bcd4f37422ce08ea8e6c733c"
     }
   ],
   "specSha256": "0205591777369dc1d74376fb27b2c1ac32c7ac384ca7095cdbeb1a9045f3d949",
diff --git a/docs/diagrams/src/overview.json b/docs/diagrams/src/overview.json
index 8c5dfae..8e1aed5 100644
--- a/docs/diagrams/src/overview.json
+++ b/docs/diagrams/src/overview.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,19 +39,19 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     },
     {
       "path": "src/cli/start.ts",
diff --git a/docs/diagrams/src/process-bug.json b/docs/diagrams/src/process-bug.json
index b13ad8c..b841aca 100644
--- a/docs/diagrams/src/process-bug.json
+++ b/docs/diagrams/src/process-bug.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,19 +39,19 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     },
     {
       "path": "docs/process-map.md",
diff --git a/docs/diagrams/src/process-epic.json b/docs/diagrams/src/process-epic.json
index 98f6379..0ea1c01 100644
--- a/docs/diagrams/src/process-epic.json
+++ b/docs/diagrams/src/process-epic.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,19 +39,19 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     },
     {
       "path": "docs/process-map.md",
diff --git a/docs/diagrams/src/process-feature.json b/docs/diagrams/src/process-feature.json
index 3e25905..2261fbf 100644
--- a/docs/diagrams/src/process-feature.json
+++ b/docs/diagrams/src/process-feature.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,19 +39,19 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     },
     {
       "path": "docs/process-map.md",
diff --git a/docs/diagrams/src/process-hotfix.json b/docs/diagrams/src/process-hotfix.json
index c468da2..be401ef 100644
--- a/docs/diagrams/src/process-hotfix.json
+++ b/docs/diagrams/src/process-hotfix.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,19 +39,19 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     },
     {
       "path": "docs/process-map.md",
diff --git a/docs/diagrams/src/process-maintenance.json b/docs/diagrams/src/process-maintenance.json
index 47f0ad1..ae6c734 100644
--- a/docs/diagrams/src/process-maintenance.json
+++ b/docs/diagrams/src/process-maintenance.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,19 +39,19 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     },
     {
       "path": "docs/process-map.md",
diff --git a/docs/diagrams/src/process-quick.json b/docs/diagrams/src/process-quick.json
index 394b366..de6cb10 100644
--- a/docs/diagrams/src/process-quick.json
+++ b/docs/diagrams/src/process-quick.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,19 +39,19 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     },
     {
       "path": "docs/process-map.md",
diff --git a/docs/diagrams/src/process-setup.json b/docs/diagrams/src/process-setup.json
index c2e2e55..314da0f 100644
--- a/docs/diagrams/src/process-setup.json
+++ b/docs/diagrams/src/process-setup.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,19 +39,19 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     },
     {
       "path": "docs/process-map.md",
diff --git a/docs/diagrams/src/task-loop.json b/docs/diagrams/src/task-loop.json
index 2eed792..ef37ecc 100644
--- a/docs/diagrams/src/task-loop.json
+++ b/docs/diagrams/src/task-loop.json
@@ -7,11 +7,11 @@
     },
     {
       "path": "core/commands/clarify.md",
-      "sha256": "d8b2c87153b5e07b0bbb1c32cb6534225e73c143dd07a3e7d070ce068cba1f95"
+      "sha256": "00008cc79210d887f73d9f8ec76565bd5b876e2d2969f12c0bfec330bd566633"
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "f617f99486bea8feb0cbf472e93e20fa8587ed5e1a78fd8cf10a3a02f547208f"
+      "sha256": "084235ea3ab159e29bbfed19569561e6df5f90ac1fee86f19791e243a7127a3b"
     },
     {
       "path": "core/commands/constitution.md",
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8e8d41b0348672c599a6dd64f13420c0f64eb66c29edca09b0ac906567c642f8"
+      "sha256": "c97a73ff8288aaf14848f266870951a25aa97652965fb391c4ff4a2d504e436e"
     },
     {
       "path": "core/commands/init.md",
@@ -31,7 +31,7 @@
     },
     {
       "path": "core/commands/quick.md",
-      "sha256": "3cc685f42c5abce6c7c4406b6b1b7511d8e18de9ac2b00caebe28fbb9a8f266d"
+      "sha256": "b0eb7fb2de8bea846aa44a7c46e8e091ecf90fbdb8e1101404acccc79996b160"
     },
     {
       "path": "core/commands/resume.md",
@@ -39,19 +39,19 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "6bb5bcdf8134182732a13ef227cefdbf1bd55f429d62efcf520ba0ed1e395471"
+      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
     },
     {
       "path": "core/commands/story.md",
-      "sha256": "75435eaad8389a5df2bbb8ee275542f04a697f4f06bc57ec9e7bf55cd8f64722"
+      "sha256": "3614cf0f320b594d849fd177b8bd7b9a7856d0353c75af124114df306a00d47f"
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6bcd6488844d8cbf65e4b5a610662dfdbe3520258853b7f53ff8843bd0c55e8b"
+      "sha256": "6d7663f009d8437ddf3b29a2ea5c42c0509c50858c5d71fa0b6f07078728d17d"
     },
     {
       "path": "core/commands/verify.md",
-      "sha256": "9fdc2d3b6a358c5b27c618084efc8f54691dbfc95da23540e5469512903ed08a"
+      "sha256": "0da6df2f87d32dc1b8a03058c7b5887610dee4638da35c32f34a85f3ecd9c312"
     },
     {
       "path": "src/spec/loop.ts",
diff --git a/src/adapters/codex.ts b/src/adapters/codex.ts
index a6b4cf5..c42f4f8 100644
--- a/src/adapters/codex.ts
+++ b/src/adapters/codex.ts
@@ -73,7 +73,8 @@ export const codexAdapter: Adapter = {
     newConversation: '/new',
     resume: (worktree, first) => {
       const skill = first.replace(/^\//, '$');
-      return { text: `cd ${JSON.stringify(worktree)} && codex ${JSON.stringify(skill)}`, launch: ['codex', skill] };
+      // Single quotes: inside double quotes a shell would expand `$mandao-…` to nothing.
+      return { text: `cd ${JSON.stringify(worktree)} && codex '${skill.replace(/'/g, `'\\''`)}'`, launch: ['codex', skill] };
     },
   },
   verified: {
diff --git a/src/cli/run-spec.ts b/src/cli/run-spec.ts
index ceee6e8..7664a5a 100644
--- a/src/cli/run-spec.ts
+++ b/src/cli/run-spec.ts
@@ -1,5 +1,6 @@
 import { existsSync, readFileSync } from 'node:fs';
 import type { Command } from 'commander';
+import { ADAPTERS } from '../adapters/index.js';
 import { readConfig } from '../engine/files.js';
 import { branchingFor, branchNames, currentBranch, detectBranching } from '../scripts/branching.js';
 import { composeBrief } from '../scripts/brief.js';
@@ -40,8 +41,15 @@ function registerPlanning(run: Command, ctx: CliContext) {
     .option('--type <type>', 'story | bug | …', 'story')
     .option('--project <name>', "polyrepo: use this project's branching model")
     .option('--hotfix', 'hotfix lane: start from branching.hotfix.from with the hotfix prefix')
-    .action((title: string[], opts: { id?: string; type: string; project?: string; hotfix?: boolean }) =>
-      json(proposeSpec(ctx.root(), readConfig(ctx.root()), title.join(' '), opts)),
+    .option('--harness <id>', 'the active harness: adds `resume` when --first is given', 'claude')
+    .option('--first <command>', 'the mandao to run first in the worktree, e.g. "/mandao-specify <ID>"')
+    .action(
+      (title: string[], opts: { id?: string; type: string; project?: string; hotfix?: boolean; harness?: string; first?: string }) => {
+        const { harness, first, ...options } = opts;
+        const proposal = proposeSpec(ctx.root(), readConfig(ctx.root()), title.join(' '), options);
+        const active = harnessOption(harness);
+        json(first ? { ...proposal, resume: ADAPTERS[active].session.resume(proposal.worktree, first).text } : proposal);
+      },
     );
 
   run
@@ -166,12 +174,18 @@ function registerState(run: Command, ctx: CliContext) {
 
   run
     .command('where <spec>')
-    .description('Is this session inside the spec worktree, on its branch?')
-    .action((ref: string) => {
+    .description('Is this session inside the spec worktree, on its branch? `resume` opens the active harness there')
+    .option('--harness <id>', 'the harness running the session', 'claude')
+    .option('--first <command>', 'the mandao to run first in the worktree (default: /mandao-implement <spec>)')
+    .action((ref: string, opts: { harness?: string; first?: string }) => {
+      const harness = harnessOption(opts.harness);
       const { config, spec } = loadSpec(ctx, ref);
       const branch = currentBranch(process.cwd());
       const isProtected = Boolean(branch && branchingFor(config).protected.includes(branch));
-      json({ ...whereAmI(process.cwd(), expectedPlace(ctx.root(), config, spec)), protected: isProtected });
+      const expected = expectedPlace(ctx.root(), config, spec);
+      const first = opts.first ?? `/mandao-implement ${ref}`;
+      const resume = ADAPTERS[harness].session.resume(expected.worktree, first).text;
+      json({ ...whereAmI(process.cwd(), expected, resume), protected: isProtected });
     });
 }
 
diff --git a/src/scripts/spec.ts b/src/scripts/spec.ts
index 7624ed9..5713834 100644
--- a/src/scripts/spec.ts
+++ b/src/scripts/spec.ts
@@ -245,11 +245,13 @@ export interface WhereReport {
   cwd: string;
   branch?: string;
   expected: { branch: string; worktree: string };
+  /** The active harness's command that opens a session in `expected.worktree` (its adapter's `session.resume`, D2). */
+  resume?: string;
   message: string;
 }
 
 /** Is this session inside the spec's worktree, on its branch? `implement` warns when it is not. */
-export function whereAmI(cwd: string, expected: { branch: string; worktree: string }): WhereReport {
+export function whereAmI(cwd: string, expected: { branch: string; worktree: string }, resume?: string): WhereReport {
   let top: string | undefined;
   let branch: string | undefined;
   try {
@@ -268,6 +270,7 @@ export function whereAmI(cwd: string, expected: { branch: string; worktree: stri
     cwd,
     ...(branch ? { branch } : {}),
     expected,
+    ...(resume ? { resume } : {}),
     message: inWorktree ? 'in the spec worktree' : `not in the spec worktree: open ${expected.worktree} (branch ${expected.branch})`,
   };
 }
diff --git a/test/integration/start.test.ts b/test/integration/start.test.ts
index e088cb4..1e38f15 100644
--- a/test/integration/start.test.ts
+++ b/test/integration/start.test.ts
@@ -131,7 +131,7 @@ describe('setup helpers', () => {
   test('requests and harness commands', () => {
     expect(parseRequest(['PROJ-9', 'Pay', 'by', 'card'])).toEqual({ id: 'PROJ-9', title: 'Pay by card' });
     expect(parseRequest(['pay', 'by', 'card'])).toEqual({ title: 'pay by card' });
-    expect(openCommand('codex', '/w', '/mandao-specify X').text).toBe('cd "/w" && codex "$mandao-specify X"');
+    expect(openCommand('codex', '/w', '/mandao-specify X').text).toBe('cd "/w" && codex \'$mandao-specify X\'');
     expect(openCommand('opencode', '/w', '/mandao-specify X').launch).toBeUndefined();
   });
 });
diff --git a/test/unit/content.test.ts b/test/unit/content.test.ts
index 8ae5dec..1472337 100644
--- a/test/unit/content.test.ts
+++ b/test/unit/content.test.ts
@@ -96,6 +96,115 @@ describe('core content', () => {
     );
   });
 
+  /** MDO-0010 T3: the worktree entry and the next step, per harness. */
+  describe('worktree entry and next step in the rendered commands', () => {
+    const HARNESSES = ['claude', 'codex', 'opencode', 'copilot', 'antigravity'] as const;
+    const render = (h: string, ids: string[]) => {
+      const config = configSchema.parse({
+        schema_version: 1,
+        workspace: 'single',
+        projects: [{ name: 'a', path: '.', profile: 'app' }],
+        harnesses: [h],
+      });
+      const { files } = buildOutputs(config, {}, layers, '0.0.0', 'project');
+      return ids.map((id) => {
+        const f = files.find((x) => new RegExp(`mandao-${id}(/SKILL\\.md|\\.md|\\.prompt\\.md)$`).test(x.path));
+        expect(f, `${h}: mandao-${id}`).toBeDefined();
+        return { id, path: f!.path, content: f!.content };
+      });
+    };
+    /** The §0 check: the text from the first `run where` on. */
+    const whereStep = (content: string) => {
+      const at = content.search(/run where/);
+      expect(at, 'a run where step').toBeGreaterThanOrEqual(0);
+      return content.slice(at, at + 700);
+    };
+
+    /** A resume command copied into a text, whatever the harness. */
+    const COPIED = /(claude|codex) ["']\/?\$?mandao-|then run \/mandao-|open (opencode|antigravity) there/;
+    const RESUME_COMMANDS = ['specify', 'quick', 'implement', 'verify', 'close', 'tasks'];
+
+    test.each(HARNESSES)('S-2.2/C1: %s prints the resume field of the script output, never a command copied into the text', (h) => {
+      for (const f of render(h, RESUME_COMMANDS)) {
+        expect(f.content, f.path).toMatch(/`resume`/);
+        expect(f.content, f.path).not.toMatch(COPIED);
+        expect(f.content, f.path).not.toMatch(/claude --resume/);
+      }
+    });
+
+    test.each(HARNESSES)('S-2.2/C1: %s passes its own harness to run where and to spec-new', (h) => {
+      for (const f of render(h, ['implement', 'verify', 'close', 'tasks'])) {
+        expect(f.content.slice(f.content.search(/run where/)), f.path).toMatch(/^run where [^\n]*--harness <this harness>/);
+      }
+      for (const f of render(h, ['specify', 'quick'])) {
+        const at = f.content.search(/run spec-new/);
+        expect(f.content.slice(at, at + 500), f.path).toMatch(/--harness <this harness>[\s\S]*--first "\/mandao-(specify|quick) /);
+      }
+    });
+
+    test.each(HARNESSES.filter((h) => h !== 'claude'))('S-2.2: %s mentions no EnterWorktree and prints the resume field', (h) => {
+      for (const f of render(h, RESUME_COMMANDS)) expect(f.content, f.path).not.toMatch(/EnterWorktree/);
+    });
+
+    test('S-2.1: claude specify, quick and implement enter the worktree with EnterWorktree and the path, without a new session', () => {
+      for (const f of render('claude', ['specify', 'quick', 'implement'])) {
+        expect(f.content, f.path).toMatch(/EnterWorktree[^.]*path/i);
+        expect(f.content, f.path).toMatch(/without (asking for )?a new session/i);
+      }
+    });
+
+    test('S-2.3 and S-2.3/C1: claude prints the resume command and stops when EnterWorktree is refused, never working in the main checkout', () => {
+      for (const f of render('claude', ['specify', 'quick'])) {
+        expect(f.content, f.path).toMatch(/EnterWorktree[\s\S]{0,200}(refused|fails)[\s\S]{0,200}`resume`[\s\S]{0,120}stop/i);
+        expect(f.content, f.path).toMatch(/not (go on|continue|keep) working in the main checkout/i);
+      }
+    });
+
+    test.each(['implement', 'verify', 'close'])(
+      'S-3.3 and S-3.3/C1: %s re-enters the worktree (claude) or prints the resume field (others) in its run where step',
+      (id) => {
+        const [claude] = render('claude', [id]);
+        expect(whereStep(claude!.content)).toMatch(/EnterWorktree/);
+        expect(whereStep(claude!.content)).toMatch(/`resume`/);
+        for (const h of HARNESSES.filter((x) => x !== 'claude')) {
+          const [f] = render(h, [id]);
+          expect(whereStep(f!.content), f!.path).toMatch(/`resume`/);
+          expect(whereStep(f!.content), f!.path).not.toMatch(/EnterWorktree/);
+        }
+      },
+    );
+
+    test('S-4.3: quick records its cost before quick-log and the commit, and the commit lists the quick costs file', () => {
+      const [f] = render('claude', ['quick']);
+      const body = f!.content.slice(f!.content.indexOf('## 6.'));
+      const cost = body.search(/run cost/);
+      const log = body.search(/run quick-log/);
+      const commit = body.search(/Commit following/);
+      expect(cost, 'a cost record in §6').toBeGreaterThanOrEqual(0);
+      expect(cost).toBeLessThan(log);
+      expect(log).toBeLessThan(commit);
+      expect(body.slice(commit)).toMatch(/specs\/quick\/_log\/costs\.yml/);
+    });
+
+    test.each(HARNESSES)(
+      'S-4.3: %s implement and tasks call approve --by-running with --harness and no longer say running the command is no approval',
+      (h) => {
+        for (const f of render(h, ['implement', 'tasks'])) {
+          expect(f.content, f.path).toMatch(/approve --by-running/);
+          for (const m of f.content.matchAll(/approve --by-running/g)) {
+            const call = f.content.slice(m.index, m.index! + 200);
+            expect(call, f.path).toMatch(new RegExp(`--harness (<this harness>|${h})`));
+            expect(call, f.path).toMatch(/approve --by-running \/mandao-implement\b/);
+          }
+          // the step is named, as FR-5 does: `spec` for a lite draft, `tasks` for draft tasks
+          if (f.path.includes('implement')) expect(f.content, f.path).toMatch(/`spec` for a lite draft[\s\S]{0,60}`tasks` for draft tasks/);
+          else expect(f.content, f.path).toMatch(/approve --by-running \/mandao-implement [^\n]* tasks\b/);
+          expect(f.content, f.path).not.toMatch(/running\s+the\s+next command is not one/);
+        }
+      },
+    );
+  });
+
   test('the catalog is valid', () => {
     expect(() => readCatalog()).not.toThrow();
   });
diff --git a/test/unit/session-advice.test.ts b/test/unit/session-advice.test.ts
index 3d120af..8e5fa18 100644
--- a/test/unit/session-advice.test.ts
+++ b/test/unit/session-advice.test.ts
@@ -57,7 +57,7 @@ describe('session advice: the active harness own new-conversation action (FR-3)'
 describe('D2: resume is part of each adapter session facts', () => {
   const expected: Record<string, string> = {
     claude: `cd "/work/wt" && claude "/mandao-implement MDO-0001"`,
-    codex: `cd "/work/wt" && codex "$mandao-implement MDO-0001"`,
+    codex: `cd "/work/wt" && codex '$mandao-implement MDO-0001'`,
     copilot: `code "/work/wt"   # then run /mandao-implement MDO-0001 in Copilot Chat`,
     opencode: `cd "/work/wt"   # open opencode there and run /mandao-implement MDO-0001`,
     antigravity: `cd "/work/wt"   # open antigravity there and run /mandao-implement MDO-0001`,

--- /dev/null
+++ b/docs/decisions/0040-approval-by-running-the-next-command.md (new file)
# 0040 — Approval by running the next command, unless something is open

**Status:** Accepted · 2026-10-21 · design §2 principle 5 · amends the rule MDO-0009 added to `implement.md` §0

MDO-0009 told `implement` that "running the next command is not an approval". At the start of that spec
the opposite problem showed: the person ran the command the previous summary named, and was asked to
approve again in words. Approving silently despite open items is the other failure, and the worse one.

## Decision

- **Running the next command is an approval of the spec's pending step, when nothing is open.**
  `mandao approve --by-running <command> [--words <text>] --harness <id> <spec> <step>` decides, not the
  agent: it approves and returns `go`, or approves nothing and returns `ask` with one question.
- **It asks, and records nothing, when** the step has a critical `OPEN`, a `CONFLICT`, a
  `[NEEDS CLARIFICATION]`, a pending decision or a critical Consistency Check row, or when an approvable
  document changed since the summary shown (`mandao run next --shown` records its hashes in
  `approvals.yml`). A spec with no `shown` row makes no claim about changes.
- **It records** "approved by running /mandao-<command>", or the exact `--words`, with the date and the
  person. The approval row also holds a hash of each approved document, so a later change is named.
- **The command only relays the question.** `implement` §0 and `tasks` call it on a draft spec and pass
  `--harness <this harness>`, so the advice never names an action another harness lacks.
- **Other approvals are unchanged:** the person's explicit word, or their own `mandao approve`. Budget
  and publication still need the person's own word.

## Consequences

- The rule holds in every harness and is testable as a process, not as an agent's reading.
- A spec edited after its summary was shown is never approved by a bare command.
- Rejected: asking every time (the person already said yes by running it), and the agent judging "changed
  since the summary" from memory (not checkable, lost after a new conversation).

--- /dev/null
+++ b/test/integration/hook.test.ts (new file)
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, realpathSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'tsup';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { makeTree, removeTrees } from '../helpers.js';

// MDO-0010 P1: `mandao hook graph-guard` resolves its project from its working directory, so after
// EnterWorktree it reads the worktree, not the main checkout. Real entry point, run as a process.
const root = fileURLToPath(new URL('../..', import.meta.url));
const cache = join(root, 'node_modules', '.cache');
let outDir = '';

beforeAll(async () => {
  mkdirSync(cache, { recursive: true });
  outDir = join(cache, `mandao-hook-${process.pid}`);
  await build({
    entry: { cli: join(root, 'src/cli/index.ts') },
    format: ['esm'],
    target: 'node22',
    platform: 'node',
    outDir,
    config: false,
    silent: true,
  });
}, 20_000);

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
  removeTrees();
});

const readOnlyRole = '---\nname: mandao-reviewer\ntools: Read, Grep, Glob\n---\n';
const shellRole = '---\nname: mandao-implementer-standard\ntools: Read, Edit, Bash\n---\n';

/** A fake graphify that records that it ran, so the test sees whether the guard handed over to it. */
function fakeGraphify() {
  const dir = makeTree({ graphify: '#!/bin/sh\npwd > "$MARK"\n' });
  chmodSync(join(dir, 'graphify'), 0o755);
  return dir;
}

function guard(cwd: string, agent: string) {
  const mark = join(makeTree({}), 'ran');
  const r = spawnSync(process.execPath, [join(outDir, 'cli.js'), 'hook', 'graph-guard', 'pre'], {
    cwd,
    input: JSON.stringify({ agent_type: agent }),
    encoding: 'utf8',
    timeout: 20_000,
    env: { ...process.env, MANDAO_HOME: makeTree({}), MARK: mark, PATH: `${fakeGraphify()}:${process.env.PATH}` },
  });
  return { status: r.status, ran: existsSync(mark) };
}

describe('P1: graph-guard reads the worktree it runs in', () => {
  // The main checkout holds no agent files; only the worktree does. A guard that read the main
  // checkout would not know the role and would keep the guard on.
  const main = realpathSync(makeTree({ '.mandao/config.yml': 'schema_version: 1\n' }));
  const worktree = realpathSync(
    makeTree({ '.claude/agents/mandao-reviewer.md': readOnlyRole, '.claude/agents/mandao-implementer-standard.md': shellRole }),
  );

  test('with a worktree as cwd, a read-only role defined only there skips the guard', () => {
    const r = guard(worktree, 'mandao-reviewer');
    expect(r.status).toBe(0);
    expect(r.ran).toBe(false);
  });

  test('with the main checkout as cwd the same role is unknown and keeps the guard', () => {
    expect(main).not.toBe(worktree);
    expect(guard(main, 'mandao-reviewer').ran).toBe(true);
  });

  test('a shell role in the worktree keeps the guard', () => {
    expect(guard(worktree, 'mandao-implementer-standard').ran).toBe(true);
  });
});

--- /dev/null
+++ b/test/integration/where.test.ts (new file)
import { execFileSync } from 'node:child_process';
import { cpSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ADAPTERS } from '../../src/adapters/index.js';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { makeTree, pkg } from '../helpers.js';

// MDO-0010 D2: `run where` and `run spec-new` hand the command texts the active harness resume command.
const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const HARNESSES = ['claude', 'codex', 'opencode', 'copilot', 'antigravity'] as const;
let out: string[];

beforeEach(() => {
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
});
afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

function repo() {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: root });
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude'],
  });
  cpSync(fixture, join(root, 'specs/MDO-0001-skills-list'), { recursive: true });
  return root;
}
const run = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
  return JSON.parse(out.at(-1)!);
};

describe('run where: the resume field', () => {
  test.each(HARNESSES)('%s: resume is the active adapter session.resume for expected.worktree and the implement command', async (h) => {
    const root = repo();
    const r = await run(root, 'where', 'MDO-0001', '--harness', h);
    expect(r.resume).toBe(ADAPTERS[h].session.resume(r.expected.worktree, '/mandao-implement MDO-0001').text);
    expect(r.resume).toContain(r.expected.worktree);
  });

  test('the first command can be named, and the harness defaults to claude', async () => {
    const root = repo();
    const r = await run(root, 'where', 'MDO-0001', '--first', '/mandao-verify MDO-0001');
    expect(r.resume).toBe(ADAPTERS.claude.session.resume(r.expected.worktree, '/mandao-verify MDO-0001').text);
  });

  test('an unknown harness is an error', async () => {
    const root = repo();
    await expect(run(root, 'where', 'MDO-0001', '--harness', 'nope')).rejects.toThrow(/Unknown harness/);
  });

  test.each(HARNESSES)('%s: spec-new returns the resume command for its worktree and the given first command', async (h) => {
    const root = repo();
    const r = await run(root, 'spec-new', 'fix login', '--harness', h, '--first', '/mandao-specify MDO-0002');
    expect(r.resume).toBe(ADAPTERS[h].session.resume(r.worktree, '/mandao-specify MDO-0002').text);
  });
});

--- /dev/null
+++ b/test/integration/worktree-entry.test.ts (new file)
// mandao-scans: none — lists only the temporary workspace it syncs into.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'tsup';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { makeTree, removeTrees } from '../helpers.js';

// MDO-0010 S-2.1 and S-2.2 end to end: `mandao sync` run as a process, all five harnesses.
const root = fileURLToPath(new URL('../..', import.meta.url));
const cache = join(root, 'node_modules', '.cache');
let outDir = '';
let ws = '';

const HARNESSES = ['claude', 'codex', 'opencode', 'copilot', 'antigravity'] as const;
/** The path prefix each harness writes its commands under. */
const DIRS: Record<(typeof HARNESSES)[number], string> = {
  claude: '.claude/skills',
  codex: '.agents/skills',
  opencode: '.opencode/commands',
  copilot: '.github/prompts',
  antigravity: '.agents/skills',
};

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
}

beforeAll(async () => {
  mkdirSync(cache, { recursive: true });
  outDir = join(cache, `mandao-entry-${process.pid}`);
  await build({
    entry: { cli: join(root, 'src/cli/index.ts') },
    format: ['esm'],
    target: 'node22',
    platform: 'node',
    outDir,
    config: false,
    silent: true,
  });
  ws = makeTree({
    '.mandao/config.yml': `schema_version: 1\nworkspace: single\nprojects:\n  - name: a\n    path: .\nharnesses: [${HARNESSES.join(', ')}]\n`,
  });
  const r = spawnSync(process.execPath, [join(outDir, 'cli.js'), 'sync'], {
    cwd: ws,
    encoding: 'utf8',
    timeout: 60_000,
    env: { ...process.env, MANDAO_HOME: makeTree({}) },
  });
  expect(r.status, r.stderr).toBe(0);
}, 90_000);

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
  removeTrees();
});

const commandFiles = (h: (typeof HARNESSES)[number], id: string) =>
  walk(ws).filter((f) => f.includes(`/${DIRS[h]}/`) && new RegExp(`mandao-${id}(/SKILL\\.md|\\.md|\\.prompt\\.md)$`).test(f));

describe('S-2.1: EnterWorktree only in the Claude Code files', () => {
  test.each(['specify', 'quick', 'implement'])('mandao-%s: EnterWorktree appears in the claude file and in no other harness file', (id) => {
    const claude = commandFiles('claude', id);
    expect(claude.length).toBe(1);
    expect(readFileSync(claude[0]!, 'utf8')).toMatch(/EnterWorktree/);
    for (const h of HARNESSES.filter((x) => x !== 'claude')) {
      const files = commandFiles(h, id);
      expect(files.length, `${h}: mandao-${id}`).toBeGreaterThan(0);
      for (const f of files) expect(readFileSync(f, 'utf8'), f).not.toMatch(/EnterWorktree/);
    }
  });
});

/** A resume command copied into a text: the adapters own those (D2), the texts only point at the `resume` field. */
const COPIED = /(claude|codex) ["']\/?\$?mandao-|then run \/mandao-|open (opencode|antigravity) there/;

describe('S-2.2: the other harnesses print the resume field of the script output', () => {
  test.each(['specify', 'quick', 'implement'])('mandao-%s: every non-claude file prints the resume field and copies no command', (id) => {
    for (const h of HARNESSES.filter((x) => x !== 'claude')) {
      for (const f of commandFiles(h, id)) {
        expect(readFileSync(f, 'utf8'), f).toMatch(/`resume`/);
        expect(readFileSync(f, 'utf8'), f).not.toMatch(COPIED);
      }
    }
  });
});

```
