# Review pack — T2, attempt 2

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T2-2.md`.

## Brief

```json
{
  "spec": "MDO-0011-one-fixed-layout-for-every-spec-folder",
  "task": {
    "project": "mandao",
    "kind": "feat",
    "tier": "standard",
    "files": [
      "src/scripts/spec-log.ts",
      "src/spec/task-index.ts",
      "src/cli/run-spec.ts",
      "src/cli/approve.ts",
      "src/scripts/checkpoint.ts",
      "core/templates/shared/rules/doc-lite.md",
      "core/templates/shared/spec/spec.md",
      "core/templates/shared/spec/story.md",
      "core/commands/specify.md",
      "core/commands/tasks.md",
      "core/commands/implement.md",
      "core/commands/clarify.md",
      "src/spec/layout.ts",
      "src/spec/AGENTS.md",
      "test/integration/lite-spec.test.ts",
      "test/unit/content.test.ts",
      "test/unit/layout.test.ts"
    ],
    "exemplar": "src/spec/task-index.ts",
    "ac": [
      "AC-1",
      "AC-1/C1",
      "AC-1/C2"
    ],
    "scenarios": [
      "S-1.1",
      "S-1.2",
      "S-1.2/C2",
      "S-1.3",
      "S-1.3/C1"
    ],
    "test_levels": {
      "S-1.1": "e2e",
      "S-1.2": "unit",
      "S-1.2/C2": "unit",
      "S-1.3": "unit",
      "S-1.3/C1": "unit"
    },
    "evidence": "tdd",
    "risk_tags": [],
    "depends_on": [
      "T1"
    ],
    "parallel_safe": false,
    "verify": "npx vitest run test/integration/lite-spec.test.ts test/unit/content.test.ts test/unit/layout.test.ts",
    "tests": {
      "unit": [
        "S-1.2",
        "S-1.2/C2",
        "S-1.3",
        "S-1.3/C1"
      ],
      "e2e": [
        "S-1.1"
      ]
    },
    "dod": [],
    "characterization": false,
    "id": "T2",
    "title": "Every spec keeps its tasks in one place, whatever their number",
    "done": true,
    "line": 84
  },
  "acceptance": [
    {
      "ref": "AC-1",
      "text": "**GIVEN** a new spec at lite, standard or full depth · **WHEN** specify and tasks have written it · **THEN** it holds exactly the files of its depth, with `tasks.md` even for a single task · **AND IT MUST** add `quickstart.md` only for behavior a user or PO can see, and `data-model.md` only for data changes · **BUT it must NOT** place tasks or any other file according to how many tasks, requirements or scenarios there are"
    },
    {
      "ref": "AC-1/C1",
      "text": "**AND IT MUST** add `quickstart.md` only for behavior a user or PO can see, and `data-model.md` only for data changes"
    },
    {
      "ref": "AC-1/C2",
      "text": "**BUT it must NOT** place tasks or any other file according to how many tasks, requirements or scenarios there are"
    }
  ],
  "scenarios": [
    {
      "ref": "S-1.1",
      "text": "**Given** a lite version 2 spec with one task · **When** the tasks step writes it · **Then** the task is in `tasks.md`, and `spec.md` has no `## Tasks`"
    },
    {
      "ref": "S-1.2",
      "text": "**Given** a lite version 2 spec whose tasks grow from 3 to 4 · **When** the layout is checked · **Then** the file set is the same as with 3 · **BUT it must NOT** report \"more than 3 go to tasks.md\", nor read tasks from `spec.md`"
    },
    {
      "ref": "S-1.2/C2",
      "text": "**BUT it must NOT** report \"more than 3 go to tasks.md\", nor read tasks from `spec.md`"
    },
    {
      "ref": "S-1.3",
      "text": "**Given** a spec with visible behavior, and another one with a data change · **When** specify writes them · **Then** the first gets `quickstart.md`, the second `data-model.md`, and neither file appears otherwise"
    },
    {
      "ref": "S-1.3/C1",
      "text": "**Then** the first gets `quickstart.md`, the second `data-model.md`, and neither file appears otherwise"
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
    "task": "T2",
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
      "test/integration/approve.test.ts",
      "test/integration/branching.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/cli.test.ts",
      "test/integration/close.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/doctor-cli.test.ts",
      "test/integration/enforced-rules.test.ts",
      "test/integration/engine.test.ts",
      "test/integration/layout.test.ts",
      "test/integration/leader-scripts.test.ts",
      "test/integration/ledger.test.ts",
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
      "test/integration/where.test.ts",
      "test/unit/commits-times.test.ts",
      "test/unit/diagram.test.ts",
      "test/unit/doctor-cache.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/kaizen-sessions.test.ts",
      "test/unit/kaizen.test.ts",
      "test/unit/next.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/release.test.ts",
      "test/unit/render.test.ts",
      "test/unit/session-advice.test.ts",
      "test/unit/session-cut.test.ts",
      "test/unit/session-turns.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ],
    "files": [
      "src/scripts/spec-log.ts",
      "src/spec/task-index.ts",
      "src/cli/run-spec.ts",
      "src/cli/approve.ts",
      "src/scripts/checkpoint.ts",
      "core/templates/shared/rules/doc-lite.md",
      "core/templates/shared/spec/spec.md",
      "core/templates/shared/spec/story.md",
      "core/commands/specify.md",
      "core/commands/tasks.md",
      "core/commands/implement.md",
      "core/commands/clarify.md",
      "src/spec/layout.ts",
      "src/spec/AGENTS.md",
      "test/integration/lite-spec.test.ts",
      "test/unit/content.test.ts",
      "test/unit/layout.test.ts",
      "test/integration/approve.test.ts",
      "test/integration/branching.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/cli.test.ts",
      "test/integration/close.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/doctor-cli.test.ts",
      "test/integration/enforced-rules.test.ts",
      "test/integration/engine.test.ts",
      "test/integration/layout.test.ts",
      "test/integration/leader-scripts.test.ts",
      "test/integration/ledger.test.ts",
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
      "test/integration/where.test.ts",
      "test/unit/commits-times.test.ts",
      "test/unit/diagram.test.ts",
      "test/unit/doctor-cache.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/kaizen-sessions.test.ts",
      "test/unit/kaizen.test.ts",
      "test/unit/next.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/release.test.ts",
      "test/unit/render.test.ts",
      "test/unit/session-advice.test.ts",
      "test/unit/session-cut.test.ts",
      "test/unit/session-turns.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related src/scripts/spec-log.ts src/spec/task-index.ts src/cli/run-spec.ts src/cli/approve.ts src/scripts/checkpoint.ts core/templates/shared/rules/doc-lite.md core/templates/shared/spec/spec.md core/templates/shared/spec/story.md core/commands/specify.md core/commands/tasks.md core/commands/implement.md core/commands/clarify.md src/spec/layout.ts src/spec/AGENTS.md test/integration/lite-spec.test.ts test/unit/content.test.ts test/unit/layout.test.ts test/integration/approve.test.ts test/integration/branching.test.ts test/integration/characterization.test.ts test/integration/cli.test.ts test/integration/close.test.ts test/integration/costs.test.ts test/integration/doctor-cli.test.ts test/integration/enforced-rules.test.ts test/integration/engine.test.ts test/integration/layout.test.ts test/integration/leader-scripts.test.ts test/integration/ledger.test.ts test/integration/mdo-0004-defects.test.ts test/integration/mdo-0005-defects.test.ts test/integration/mdo-0006-defects.test.ts test/integration/premise.test.ts test/integration/review.test.ts test/integration/scripts.test.ts test/integration/shadow.test.ts test/integration/spec-log.test.ts test/integration/start.test.ts test/integration/tdd.test.ts test/integration/where.test.ts test/unit/commits-times.test.ts test/unit/diagram.test.ts test/unit/doctor-cache.test.ts test/unit/doctor-report.test.ts test/unit/kaizen-sessions.test.ts test/unit/kaizen.test.ts test/unit/next.test.ts test/unit/pr-plan.test.ts test/unit/release.test.ts test/unit/render.test.ts test/unit/session-advice.test.ts test/unit/session-cut.test.ts test/unit/session-turns.test.ts test/unit/spec.test.ts test/unit/task-index.test.ts test/unit/verify.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": [
      "src/cli/checkpoint-guards.ts",
      "src/cli/program.ts",
      "src/cli/run-close.ts",
      "src/cli/run-cost.ts",
      "src/cli/run-diagram.ts",
      "src/cli/run-leader.ts",
      "src/cli/run-ledger.ts",
      "src/cli/run-mutation.ts",
      "src/cli/run-premise.ts",
      "src/cli/run-red.ts",
      "src/cli/run-review.ts",
      "src/cli/run.ts",
      "src/cli/start.ts",
      "src/engine/doctor-specs.ts",
      "src/scripts/commits.ts",
      "src/scripts/forced.ts",
      "src/scripts/session-cut.ts",
      "src/scripts/session-turns.ts",
      "src/scripts/spec.ts",
      "src/scripts/spend.ts",
      "src/spec/index.ts",
      "src/spec/story.ts",
      "test/integration/approve.test.ts",
      "test/integration/enforced-rules.test.ts",
      "test/integration/leader-scripts.test.ts",
      "test/integration/ledger.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/scripts.test.ts",
      "test/integration/spec-log.test.ts",
      "test/unit/task-index.test.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/integration/lite-spec.test.ts",
      "test/unit/content.test.ts",
      "test/unit/layout.test.ts"
    ],
    "changed": []
  }
}
```

## Gates — T2, attempt 2

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
diff --git a/.agents/skills/mandao-tasks/SKILL.md b/.agents/skills/mandao-tasks/SKILL.md
index 7cd39c6..5ff3733 100644
--- a/.agents/skills/mandao-tasks/SKILL.md
+++ b/.agents/skills/mandao-tasks/SKILL.md
@@ -15,6 +15,10 @@ Write task content in `en`; headings, ids and YAML keys stay in English.
 The tasks go in `tasks.md` at every depth (lite, standard and full), whatever their number, even a
 single one; `spec.md` never holds them. At lite depth `/mandao-specify` runs this step in its own session.
 
+Version 1 specs (`schema_version: 1` in `story.md`) are read as they are: lite keeps its tasks inside
+`spec.md`. No new spec uses that format, and this command never writes tasks inside `spec.md`. On an
+open version 1 spec it warns and does not convert it; the migration goes through the backlog spec.
+
 1. **Gate.** Run `node .mandao/bin/mandao.mjs run where <spec> --harness <this harness> --first "/mandao-tasks <spec>"`: if `inWorktree` is false, move into the worktree before any other step.
    Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop.
    Run
diff --git a/.claude/skills/mandao-tasks/SKILL.md b/.claude/skills/mandao-tasks/SKILL.md
index 2fea070..b95f52b 100644
--- a/.claude/skills/mandao-tasks/SKILL.md
+++ b/.claude/skills/mandao-tasks/SKILL.md
@@ -20,6 +20,10 @@ Write task content in `en`; headings, ids and YAML keys stay in English.
 The tasks go in `tasks.md` at every depth (lite, standard and full), whatever their number, even a
 single one; `spec.md` never holds them. At lite depth `/mandao-specify` runs this step in its own session.
 
+Version 1 specs (`schema_version: 1` in `story.md`) are read as they are: lite keeps its tasks inside
+`spec.md`. No new spec uses that format, and this command never writes tasks inside `spec.md`. On an
+open version 1 spec it warns and does not convert it; the migration goes through the backlog spec.
+
 1. **Gate.** Run `node .mandao/bin/mandao.mjs run where $spec --harness <this harness> --first "/mandao-tasks $spec"`: if `inWorktree` is false, move into the worktree before any other step.
    Call `EnterWorktree` with the worktree path (`expected.worktree` in the `where` output) and go on without a new session; if it is
    refused or fails, print the `resume` field of that output and stop: do not go on working in the main checkout.
diff --git a/.github/prompts/mandao-tasks.prompt.md b/.github/prompts/mandao-tasks.prompt.md
index 203bd4f..0888135 100644
--- a/.github/prompts/mandao-tasks.prompt.md
+++ b/.github/prompts/mandao-tasks.prompt.md
@@ -22,6 +22,10 @@ Write task content in `en`; headings, ids and YAML keys stay in English.
 The tasks go in `tasks.md` at every depth (lite, standard and full), whatever their number, even a
 single one; `spec.md` never holds them. At lite depth `/mandao-specify` runs this step in its own session.
 
+Version 1 specs (`schema_version: 1` in `story.md`) are read as they are: lite keeps its tasks inside
+`spec.md`. No new spec uses that format, and this command never writes tasks inside `spec.md`. On an
+open version 1 spec it warns and does not convert it; the migration goes through the backlog spec.
+
 1. **Gate.** Run `node .mandao/bin/mandao.mjs run where ${input:spec:Spec folder or id} --harness <this harness> --first "/mandao-tasks ${input:spec:Spec folder or id}"`: if `inWorktree` is false, move into the worktree before any other step.
    Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop.
    Run
diff --git a/.mandao/mandao.lock b/.mandao/mandao.lock
index e3dfaa3..edf71cf 100644
--- a/.mandao/mandao.lock
+++ b/.mandao/mandao.lock
@@ -165,7 +165,7 @@ files:
     harness: codex
     from: command:tasks
     ownership: owned
-    hash: sha256-11/+OrVTX5dM0e72pruGoJC91AhW5k4CEBbqdhrzNDo=
+    hash: sha256-38H0Lxi7AcZpIS/5ABe4W/Qle38IVPMDMSQ9cO+eh+0=
     scope: project
   - path: .agents/skills/mandao-verify/agents/openai.yaml
     harness: codex
@@ -285,7 +285,7 @@ files:
     harness: claude
     from: command:tasks
     ownership: owned
-    hash: sha256-CDFKsRd+aMVgfrAMbBmWVUEiKeSeP534iJ6O9/zgMEU=
+    hash: sha256-NkRyzsYkAFx+Z/jKcpLawutatD4aJoA+ilQTw9Zcajg=
     scope: project
   - path: .claude/skills/mandao-verify/SKILL.md
     harness: claude
@@ -453,7 +453,7 @@ files:
     harness: copilot
     from: command:tasks
     ownership: owned
-    hash: sha256-SKJVwYcmzFgLSZxEqlYNfw6+dDfhSYXwI1XOqMvZPl4=
+    hash: sha256-8L8qo6hgt7IxcBJfa2zLysJe412SUt65Ss+dAvvae5E=
     scope: project
   - path: .github/prompts/mandao-verify.prompt.md
     harness: copilot
diff --git a/core/commands/tasks.md b/core/commands/tasks.md
index 6f0c3c9..c5ba32b 100644
--- a/core/commands/tasks.md
+++ b/core/commands/tasks.md
@@ -32,6 +32,10 @@ Write task content in `{{language.technical}}`; headings, ids and YAML keys stay
 The tasks go in `tasks.md` at every depth (lite, standard and full), whatever their number, even a
 single one; `spec.md` never holds them. At lite depth `/mandao-specify` runs this step in its own session.
 
+Version 1 specs (`schema_version: 1` in `story.md`) are read as they are: lite keeps its tasks inside
+`spec.md`. No new spec uses that format, and this command never writes tasks inside `spec.md`. On an
+open version 1 spec it warns and does not convert it; the migration goes through the backlog spec.
+
 1. **Gate.** Run `{{script:where}} {{arg:spec}} --harness <this harness> --first "/mandao-tasks {{arg:spec}}"`: if `inWorktree` is false, move into the worktree before any other step.
 <!-- mandao:if harness=claude -->
    Call `EnterWorktree` with the worktree path (`expected.worktree` in the `where` output) and go on without a new session; if it is
diff --git a/docs/diagrams/src/command-clarify.json b/docs/diagrams/src/command-clarify.json
index ac54c11..af1438c 100644
--- a/docs/diagrams/src/command-clarify.json
+++ b/docs/diagrams/src/command-clarify.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-close.json b/docs/diagrams/src/command-close.json
index 99fa0a7..49ac141 100644
--- a/docs/diagrams/src/command-close.json
+++ b/docs/diagrams/src/command-close.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-constitution.json b/docs/diagrams/src/command-constitution.json
index 83db654..ca42537 100644
--- a/docs/diagrams/src/command-constitution.json
+++ b/docs/diagrams/src/command-constitution.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-implement.json b/docs/diagrams/src/command-implement.json
index 6c1a2ec..4ff3070 100644
--- a/docs/diagrams/src/command-implement.json
+++ b/docs/diagrams/src/command-implement.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-init.json b/docs/diagrams/src/command-init.json
index 5f3549a..b4f6138 100644
--- a/docs/diagrams/src/command-init.json
+++ b/docs/diagrams/src/command-init.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-quick.json b/docs/diagrams/src/command-quick.json
index 26e1a7e..159e185 100644
--- a/docs/diagrams/src/command-quick.json
+++ b/docs/diagrams/src/command-quick.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-resume.json b/docs/diagrams/src/command-resume.json
index 84c4205..d535b4b 100644
--- a/docs/diagrams/src/command-resume.json
+++ b/docs/diagrams/src/command-resume.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-specify.json b/docs/diagrams/src/command-specify.json
index 7a3ad37..387b364 100644
--- a/docs/diagrams/src/command-specify.json
+++ b/docs/diagrams/src/command-specify.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-story.json b/docs/diagrams/src/command-story.json
index 9b951e1..d5d4d3d 100644
--- a/docs/diagrams/src/command-story.json
+++ b/docs/diagrams/src/command-story.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-tasks.json b/docs/diagrams/src/command-tasks.json
index c255294..9e759fe 100644
--- a/docs/diagrams/src/command-tasks.json
+++ b/docs/diagrams/src/command-tasks.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-verify.json b/docs/diagrams/src/command-verify.json
index 26e3615..57e458f 100644
--- a/docs/diagrams/src/command-verify.json
+++ b/docs/diagrams/src/command-verify.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/lifecycle.json b/docs/diagrams/src/lifecycle.json
index 864f0b3..1055bfa 100644
--- a/docs/diagrams/src/lifecycle.json
+++ b/docs/diagrams/src/lifecycle.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/overview.json b/docs/diagrams/src/overview.json
index 0e003c1..be2d5be 100644
--- a/docs/diagrams/src/overview.json
+++ b/docs/diagrams/src/overview.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/process-bug.json b/docs/diagrams/src/process-bug.json
index 816e63d..a7ee91a 100644
--- a/docs/diagrams/src/process-bug.json
+++ b/docs/diagrams/src/process-bug.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/process-epic.json b/docs/diagrams/src/process-epic.json
index db3c2df..0e14f7c 100644
--- a/docs/diagrams/src/process-epic.json
+++ b/docs/diagrams/src/process-epic.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/process-feature.json b/docs/diagrams/src/process-feature.json
index 728fb99..22afda1 100644
--- a/docs/diagrams/src/process-feature.json
+++ b/docs/diagrams/src/process-feature.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/process-hotfix.json b/docs/diagrams/src/process-hotfix.json
index 1403dd8..ce7be44 100644
--- a/docs/diagrams/src/process-hotfix.json
+++ b/docs/diagrams/src/process-hotfix.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/process-maintenance.json b/docs/diagrams/src/process-maintenance.json
index a4ee99d..d4066b2 100644
--- a/docs/diagrams/src/process-maintenance.json
+++ b/docs/diagrams/src/process-maintenance.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/process-quick.json b/docs/diagrams/src/process-quick.json
index dc92154..86f23b8 100644
--- a/docs/diagrams/src/process-quick.json
+++ b/docs/diagrams/src/process-quick.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/process-setup.json b/docs/diagrams/src/process-setup.json
index 42be1a9..306ace8 100644
--- a/docs/diagrams/src/process-setup.json
+++ b/docs/diagrams/src/process-setup.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/task-loop.json b/docs/diagrams/src/task-loop.json
index 23a8fe7..2fd7c44 100644
--- a/docs/diagrams/src/task-loop.json
+++ b/docs/diagrams/src/task-loop.json
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
+      "sha256": "90f67ad2e229529e5453163e09e3a61e4a389f9057382554a1e58d9112d9a85f"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/test/integration/lite-spec.test.ts b/test/integration/lite-spec.test.ts
index 6c84981..04fcd78 100644
--- a/test/integration/lite-spec.test.ts
+++ b/test/integration/lite-spec.test.ts
@@ -193,7 +193,7 @@ describe('lite version 2: tasks.md always (AC-1)', () => {
     expect(readSpec(dir).tasks).toEqual([]);
   });
 
-  test('S-1.1: the checkpoint ticks the task in tasks.md and leaves spec.md alone', async () => {
+  test('S-1.1: the checkpoint ticks the task in tasks.md and leaves spec.md alone (regression pin)', async () => {
     const root = repoV2(taskList(1));
     const dir = join(root, SPEC);
     const specBefore = readFileSync(join(dir, 'spec.md'), 'utf8');
@@ -202,7 +202,7 @@ describe('lite version 2: tasks.md always (AC-1)', () => {
     expect(readFileSync(join(dir, 'spec.md'), 'utf8')).toBe(specBefore);
   });
 
-  test('S-1.1: approve tasks on the same fixture approves tasks.md with no inline issue', async () => {
+  test('S-1.1: approve tasks on the same fixture approves tasks.md with no inline issue (regression pin)', async () => {
     const root = repoV2(taskList(4));
     git(root, 'add', '.');
     git(root, 'commit', '-qm', 'base');
@@ -211,6 +211,18 @@ describe('lite version 2: tasks.md always (AC-1)', () => {
     expect(JSON.stringify(r)).not.toMatch(/inline|more than 3/);
     expect(r).toMatchObject({ approved: true });
   });
+
+  test('S-1.2/C2: approve tasks with no tasks.md refuses, and never approves tasks written inline in spec.md', async () => {
+    const inline = [1, 2, 3, 4].map((n) => task(`T${n}`, `Step ${n}`, 'AC-1', 'S-1.1')).join('');
+    const root = repoV2('', inline);
+    const dir = join(root, SPEC);
+    rmSync(join(dir, 'tasks.md'));
+    const specBefore = readFileSync(join(dir, 'spec.md'), 'utf8');
+    const r = await approveTasks(root);
+    expect(r).toMatchObject({ approved: false });
+    expect(JSON.stringify(r)).toContain('no tasks to approve');
+    expect(readFileSync(join(dir, 'spec.md'), 'utf8')).toBe(specBefore);
+  });
 });
 
 const approveTasks = async (root: string) => {
diff --git a/test/unit/content.test.ts b/test/unit/content.test.ts
index 1b1d2e4..627fec7 100644
--- a/test/unit/content.test.ts
+++ b/test/unit/content.test.ts
@@ -251,6 +251,14 @@ describe('core content', () => {
       expect(specify).not.toMatch(/lite[^\n]*writes? (the )?tasks|tasks inline/i);
     });
 
+    test('S-1.2: the tasks command warns on an open version 1 spec, does not convert it, and never writes tasks in spec.md', () => {
+      const tasks = rendered('tasks');
+      expect(tasks).toMatch(/version 1[^\n]*(read|as they are)/i);
+      expect(tasks).toMatch(/never writes? (the )?tasks (inside|in) `spec\.md`/i);
+      expect(tasks).toMatch(/version 1[\s\S]{0,300}warns?[\s\S]{0,120}(does not|never) convert/i);
+      expect(tasks).toMatch(/migration[^\n]*backlog/i);
+    });
+
     test('AC-1: a story rendered from the template starts at layout version 2', () => {
       const tpl = readFileSync(join(process.cwd(), 'core/templates/shared/spec/story.md'), 'utf8');
       expect(frontmatterOf(tpl).data.schema_version).toBe(2);

```
