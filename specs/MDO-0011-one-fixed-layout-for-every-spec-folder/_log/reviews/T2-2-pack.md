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
      "test/integration/lite-spec.test.ts",
      "test/unit/content.test.ts"
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
    "done": false,
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
      "test/unit/layout.test.ts",
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
      "test/integration/lite-spec.test.ts",
      "test/unit/content.test.ts",
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
      "test/unit/layout.test.ts",
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
    "commandForBudget": "npx vitest related src/scripts/spec-log.ts src/spec/task-index.ts src/cli/run-spec.ts src/cli/approve.ts src/scripts/checkpoint.ts core/templates/shared/rules/doc-lite.md core/templates/shared/spec/spec.md core/templates/shared/spec/story.md core/commands/specify.md core/commands/tasks.md core/commands/implement.md core/commands/clarify.md test/integration/lite-spec.test.ts test/unit/content.test.ts test/integration/approve.test.ts test/integration/branching.test.ts test/integration/characterization.test.ts test/integration/cli.test.ts test/integration/close.test.ts test/integration/costs.test.ts test/integration/doctor-cli.test.ts test/integration/enforced-rules.test.ts test/integration/engine.test.ts test/integration/layout.test.ts test/integration/leader-scripts.test.ts test/integration/ledger.test.ts test/integration/mdo-0004-defects.test.ts test/integration/mdo-0005-defects.test.ts test/integration/mdo-0006-defects.test.ts test/integration/premise.test.ts test/integration/review.test.ts test/integration/scripts.test.ts test/integration/shadow.test.ts test/integration/spec-log.test.ts test/integration/start.test.ts test/integration/tdd.test.ts test/integration/where.test.ts test/unit/commits-times.test.ts test/unit/diagram.test.ts test/unit/doctor-cache.test.ts test/unit/doctor-report.test.ts test/unit/kaizen-sessions.test.ts test/unit/kaizen.test.ts test/unit/layout.test.ts test/unit/next.test.ts test/unit/pr-plan.test.ts test/unit/release.test.ts test/unit/render.test.ts test/unit/session-advice.test.ts test/unit/session-cut.test.ts test/unit/session-turns.test.ts test/unit/spec.test.ts test/unit/task-index.test.ts test/unit/verify.test.ts --run --maxWorkers=1"
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
    "changed": [
      "test/unit/content.test.ts"
    ]
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
diff --git a/.agents/skills/mandao-specify/SKILL.md b/.agents/skills/mandao-specify/SKILL.md
index 7d74c0e..bc5ec97 100644
--- a/.agents/skills/mandao-specify/SKILL.md
+++ b/.agents/skills/mandao-specify/SKILL.md
@@ -1,6 +1,6 @@
 ---
 name: mandao-specify
-description: Turn a story into requirements and design at lite, standard or full depth, with traceability and a Consistency Check; at lite, story, spec and tasks in one session.
+description: Turn a story into requirements and design at lite, standard or full depth, with traceability and a Consistency Check; at lite, story and spec in one session.
 ---
 <!-- Generated by mandao 0.1.0 from command:specify. Do not edit: changes belong in .mandao/overrides/. -->
 
@@ -107,7 +107,7 @@ refactors or internal infrastructure.
 
 ## 5c. data-model.md (only when data changes)
 
-When the spec adds or changes entities, fields, relationships or states, write `data-model.md` from
+When the spec adds or changes entities, fields, relationships or states (never by how many tasks, requirements or scenarios there are), write `data-model.md` from
 `.mandao/templates/app/spec/data-model.md` following `.mandao/templates/app/rules/doc-data-model.md`.
 
 ## 6. Consistency Check
diff --git a/.agents/skills/mandao-tasks/SKILL.md b/.agents/skills/mandao-tasks/SKILL.md
index d45c50a..7cd39c6 100644
--- a/.agents/skills/mandao-tasks/SKILL.md
+++ b/.agents/skills/mandao-tasks/SKILL.md
@@ -12,8 +12,8 @@ Spec: <spec>
 
 Write task content in `en`; headings, ids and YAML keys stay in English.
 
-At lite depth with 3 tasks or fewer, `/mandao-specify` already wrote them inline in `spec.md`: there is
-nothing to do here. Otherwise:
+The tasks go in `tasks.md` at every depth (lite, standard and full), whatever their number, even a
+single one; `spec.md` never holds them. At lite depth `/mandao-specify` runs this step in its own session.
 
 1. **Gate.** Run `node .mandao/bin/mandao.mjs run where <spec> --harness <this harness> --first "/mandao-tasks <spec>"`: if `inWorktree` is false, move into the worktree before any other step.
    Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop.
diff --git a/.claude/skills/mandao-specify/SKILL.md b/.claude/skills/mandao-specify/SKILL.md
index bc817c8..bdd40b6 100644
--- a/.claude/skills/mandao-specify/SKILL.md
+++ b/.claude/skills/mandao-specify/SKILL.md
@@ -1,6 +1,6 @@
 ---
 name: mandao-specify
-description: Turn a story into requirements and design at lite, standard or full depth, with traceability and a Consistency Check; at lite, story, spec and tasks in one session.
+description: Turn a story into requirements and design at lite, standard or full depth, with traceability and a Consistency Check; at lite, story and spec in one session.
 argument-hint: "[ref] [depth] [hotfix]"
 arguments:
   - ref
@@ -115,7 +115,7 @@ refactors or internal infrastructure.
 
 ## 5c. data-model.md (only when data changes)
 
-When the spec adds or changes entities, fields, relationships or states, write `data-model.md` from
+When the spec adds or changes entities, fields, relationships or states (never by how many tasks, requirements or scenarios there are), write `data-model.md` from
 `.mandao/templates/app/spec/data-model.md` following `.mandao/templates/app/rules/doc-data-model.md`.
 
 ## 6. Consistency Check
diff --git a/.claude/skills/mandao-tasks/SKILL.md b/.claude/skills/mandao-tasks/SKILL.md
index 9513164..2fea070 100644
--- a/.claude/skills/mandao-tasks/SKILL.md
+++ b/.claude/skills/mandao-tasks/SKILL.md
@@ -17,8 +17,8 @@ Spec: $spec
 
 Write task content in `en`; headings, ids and YAML keys stay in English.
 
-At lite depth with 3 tasks or fewer, `/mandao-specify` already wrote them inline in `spec.md`: there is
-nothing to do here. Otherwise:
+The tasks go in `tasks.md` at every depth (lite, standard and full), whatever their number, even a
+single one; `spec.md` never holds them. At lite depth `/mandao-specify` runs this step in its own session.
 
 1. **Gate.** Run `node .mandao/bin/mandao.mjs run where $spec --harness <this harness> --first "/mandao-tasks $spec"`: if `inWorktree` is false, move into the worktree before any other step.
    Call `EnterWorktree` with the worktree path (`expected.worktree` in the `where` output) and go on without a new session; if it is
diff --git a/.github/prompts/mandao-specify.prompt.md b/.github/prompts/mandao-specify.prompt.md
index d737caa..2a2cc1b 100644
--- a/.github/prompts/mandao-specify.prompt.md
+++ b/.github/prompts/mandao-specify.prompt.md
@@ -1,6 +1,6 @@
 ---
 name: mandao-specify
-description: Turn a story into requirements and design at lite, standard or full depth, with traceability and a Consistency Check; at lite, story, spec and tasks in one session.
+description: Turn a story into requirements and design at lite, standard or full depth, with traceability and a Consistency Check; at lite, story and spec in one session.
 argument-hint: "[ref] [depth] [hotfix]"
 agent: agent
 tools:
@@ -114,7 +114,7 @@ refactors or internal infrastructure.
 
 ## 5c. data-model.md (only when data changes)
 
-When the spec adds or changes entities, fields, relationships or states, write `data-model.md` from
+When the spec adds or changes entities, fields, relationships or states (never by how many tasks, requirements or scenarios there are), write `data-model.md` from
 `.mandao/templates/app/spec/data-model.md` following `.mandao/templates/app/rules/doc-data-model.md`.
 
 ## 6. Consistency Check
diff --git a/.github/prompts/mandao-tasks.prompt.md b/.github/prompts/mandao-tasks.prompt.md
index eaa4f85..203bd4f 100644
--- a/.github/prompts/mandao-tasks.prompt.md
+++ b/.github/prompts/mandao-tasks.prompt.md
@@ -19,8 +19,8 @@ Spec: ${input:spec:Spec folder or id}
 
 Write task content in `en`; headings, ids and YAML keys stay in English.
 
-At lite depth with 3 tasks or fewer, `/mandao-specify` already wrote them inline in `spec.md`: there is
-nothing to do here. Otherwise:
+The tasks go in `tasks.md` at every depth (lite, standard and full), whatever their number, even a
+single one; `spec.md` never holds them. At lite depth `/mandao-specify` runs this step in its own session.
 
 1. **Gate.** Run `node .mandao/bin/mandao.mjs run where ${input:spec:Spec folder or id} --harness <this harness> --first "/mandao-tasks ${input:spec:Spec folder or id}"`: if `inWorktree` is false, move into the worktree before any other step.
    Print the `resume` field of the `where` output (the command that opens this harness in the worktree) and stop.
diff --git a/.mandao/guide.md b/.mandao/guide.md
index ada4d13..d58a206 100644
--- a/.mandao/guide.md
+++ b/.mandao/guide.md
@@ -26,7 +26,7 @@ Flow: `constitution` → `story` → `specify` → `[clarify]` → `tasks` → `
 - `/mandao-init` — Set up Mandao in the current workspace by running the Mandao CLI, then suggest the constitution.
 - `/mandao-quick` — Make a trivial, low-risk change without a spec, behind a double-checked gate that escalates when the change is not actually trivial.
 - `/mandao-resume` — Without an id: dashboard of active specs. With an id: continue that spec from its last checkpoint, in any harness.
-- `/mandao-specify` — Turn a story into requirements and design at lite, standard or full depth, with traceability and a Consistency Check; at lite, story, spec and tasks in one session.
+- `/mandao-specify` — Turn a story into requirements and design at lite, standard or full depth, with traceability and a Consistency Check; at lite, story and spec in one session.
 - `/mandao-story` — Create or enrich a user story with enough business context: sufficiency rubric, sources, AC-n with critical flags.
 - `/mandao-tasks` — Break an approved spec into Tn tasks: an overview by acceptance criterion with checkpoints, and per task what, done when, test levels and dependencies.
 - `/mandao-verify` — Run testers per suite on the impacted tests, trace every AC to its tests and check conformance with the spec; the full critical smoke runs in CI or with --full.
diff --git a/.mandao/mandao.lock b/.mandao/mandao.lock
index 0f1e0a7..e3dfaa3 100644
--- a/.mandao/mandao.lock
+++ b/.mandao/mandao.lock
@@ -141,7 +141,7 @@ files:
     harness: codex
     from: command:specify
     ownership: owned
-    hash: sha256-KCUG4RZPB8NO6Ib1gtvxbRIfUP4BKuJbKSFHZ/izle0=
+    hash: sha256-/ge7LousgjPGwQZC8fm0HQq7ArUDXf3gEoodMwWYeTY=
     scope: project
   - path: .agents/skills/mandao-story/agents/openai.yaml
     harness: codex
@@ -165,7 +165,7 @@ files:
     harness: codex
     from: command:tasks
     ownership: owned
-    hash: sha256-PxlQmabR2MDhV8OOvR6e18WhuTDSFFPeA0JBEXd4yL4=
+    hash: sha256-11/+OrVTX5dM0e72pruGoJC91AhW5k4CEBbqdhrzNDo=
     scope: project
   - path: .agents/skills/mandao-verify/agents/openai.yaml
     harness: codex
@@ -273,7 +273,7 @@ files:
     harness: claude
     from: command:specify
     ownership: owned
-    hash: sha256-JfMhz+2Sq+Hq93uUKs0yW7qfS+X2+ls8taSryR1YLQE=
+    hash: sha256-Dqo7eEZTo/lXHCB2rjb5mpew5QrMC7GHsN+lAf5Cmdg=
     scope: project
   - path: .claude/skills/mandao-story/SKILL.md
     harness: claude
@@ -285,7 +285,7 @@ files:
     harness: claude
     from: command:tasks
     ownership: owned
-    hash: sha256-YAlOUBH2Q3qQ9tq6WHop3/Ued0Av1v1CCVO7Zz+xqig=
+    hash: sha256-CDFKsRd+aMVgfrAMbBmWVUEiKeSeP534iJ6O9/zgMEU=
     scope: project
   - path: .claude/skills/mandao-verify/SKILL.md
     harness: claude
@@ -441,7 +441,7 @@ files:
     harness: copilot
     from: command:specify
     ownership: owned
-    hash: sha256-B3V62VBzgS8xf/rzlMZUMfNtT+WzUyfG8BHEnl94Nuw=
+    hash: sha256-2CDCZRZ5tbyEOoAQQpdVgrwreOn2BcmeRnmmIfh6p1M=
     scope: project
   - path: .github/prompts/mandao-story.prompt.md
     harness: copilot
@@ -453,7 +453,7 @@ files:
     harness: copilot
     from: command:tasks
     ownership: owned
-    hash: sha256-kHdgczzkIghxNjHDqndXjBMyVv0Z19A86SpzHL+C2Es=
+    hash: sha256-SKJVwYcmzFgLSZxEqlYNfw6+dDfhSYXwI1XOqMvZPl4=
     scope: project
   - path: .github/prompts/mandao-verify.prompt.md
     harness: copilot
@@ -489,7 +489,7 @@ files:
     harness: agents-md
     from: guide:mandao
     ownership: owned
-    hash: sha256-u144zTr9+dvlYSfv0jzYwsgd3/vwErSmCe649HdRZok=
+    hash: sha256-ntaaMICmC22L/iBk1/EkhsYtoN3I9Y8/auaTPxGiJ88=
     scope: project
   - path: .mandao/templates/app/close/kaizen.md
     harness: mandao
@@ -633,7 +633,7 @@ files:
     harness: mandao
     from: template:shared/rules/doc-lite.md
     ownership: owned
-    hash: sha256-t9F862+ZTf01DUz/Jej2zTycPGBS/OCsT6YfVfa4Z9E=
+    hash: sha256-SprQwPUTgvRzN9v3hfRrd8tvzvCmwefHnt9X2rHNZAs=
     scope: project
   - path: .mandao/templates/app/rules/doc-quickstart.md
     harness: mandao
@@ -759,13 +759,13 @@ files:
     harness: mandao
     from: template:shared/spec/spec.md
     ownership: owned
-    hash: sha256-8IE7c7bxyiMDQ+UFgoCzJby+fjTPA+Ds+LKyap8RZ44=
+    hash: sha256-+u/ayBuCqowVtSu49m5LkKdkdKyz6zCCxisQ78Cg1N8=
     scope: project
   - path: .mandao/templates/app/spec/story.md
     harness: mandao
     from: template:shared/spec/story.md
     ownership: owned
-    hash: sha256-DH2wcnRck3gT+FISG/AXB07Wm34FSya3EgOqN4ZZrfc=
+    hash: sha256-M5JKJP0l3hpVljka/6PtctPmq2FqJk9Y4/P+8zjrH0w=
     scope: project
   - path: .mandao/templates/app/spec/tasks.md
     harness: mandao
diff --git a/.mandao/templates/app/rules/doc-lite.md b/.mandao/templates/app/rules/doc-lite.md
index 7bf363b..ede1180 100644
--- a/.mandao/templates/app/rules/doc-lite.md
+++ b/.mandao/templates/app/rules/doc-lite.md
@@ -7,21 +7,19 @@ rule: doc-lite
 
 Applies the principles in `spec-docs.md`.
 
-At lite depth one session writes `story.md` and `spec.md`, which replaces `requirements.md`,
-`design.md` and, with 3 tasks or fewer, `tasks.md`. Same ids and the same rules as the documents it
-replaces: FRs and scenarios, the AC → FR matrix, decisions, changes with exemplars, the Consistency
-Check, clarifications, and a Premise Ledger with **High premises only**. Tasks go inline under
-`## Tasks` in the Details format, without an Overview; a fourth task means a separate `tasks.md`.
-Parsers, the Consistency Check and traceability read the same sections from `spec.md`.
+At lite depth one session writes `story.md` and `spec.md`, which replaces `requirements.md`
+and `design.md`; the tasks are in `tasks.md`, as at every depth. Same ids and the same rules as the
+documents it replaces: FRs and scenarios, the AC → FR matrix, decisions, changes with exemplars, the Consistency
+Check, clarifications, and a Premise Ledger with **High premises only**. Parsers, the Consistency
+Check and traceability read the same sections from `spec.md`.
 
 ## One session
 
 The cost of a session is mostly writing and reading its context, so lite pays it once:
 1. Write `story.md` if there is none (from `spec/story.md`), then `spec.md` from
    `spec/spec.md` instead of `requirements.md` and `design.md`: the same requirements and
-   design sections, a Premise Ledger with **High premises only**, and the tasks inline under `## Tasks`
-   (Details format of `spec/tasks.md`) when there are 3 or fewer. With more, write the
-   tasks in `tasks.md` as `/mandao-tasks` does, in this same session.
+   design sections and a Premise Ledger with **High premises only**. Then write `tasks.md` as
+   `/mandao-tasks` does, in this same session, whatever the number of tasks.
 2. Skip `/mandao-clarify` unless something is open: a `[NEEDS CLARIFICATION]`, an `OPEN` or a
    Consistency Check finding.
 3. Ask for **one** approval of story, spec and tasks together. The user may give it from the terminal
diff --git a/.mandao/templates/app/spec/spec.md b/.mandao/templates/app/spec/spec.md
index 430011a..b7beea8 100644
--- a/.mandao/templates/app/spec/spec.md
+++ b/.mandao/templates/app/spec/spec.md
@@ -60,28 +60,4 @@ No findings.
 
 ## Premise Ledger
 
-## Tasks
-
-### [ ] T1 — <result, in plain words>
-
-- **What:** <what it does and why>.
-- **Done when:**
-  - S-1.1 holds: <behavior>.
-
-```yaml
-project: <project>
-kind: feat
-tier: standard
-files: [path/to/file.ts]
-exemplar: path/to/similar.ts
-ac: [AC-1]
-scenarios: [S-1.1]
-test_levels: { S-1.1: unit }
-evidence: tdd
-risk_tags: []
-depends_on: []
-parallel_safe: false
-verify: <command>
-```
-
 ## Evidence
diff --git a/.mandao/templates/app/spec/story.md b/.mandao/templates/app/spec/story.md
index 6f27668..c7b7917 100644
--- a/.mandao/templates/app/spec/story.md
+++ b/.mandao/templates/app/spec/story.md
@@ -1,5 +1,5 @@
 ---
-schema_version: 1
+schema_version: 2
 tracker: none            # jira | linear | clickup | monday | none
 type: story              # epic | story | bug | enhancement | task | performance
 id: MDO-0000             # tracker id, or a local id when there is no tracker
diff --git a/core/commands/implement.md b/core/commands/implement.md
index b219815..a9ca8fc 100644
--- a/core/commands/implement.md
+++ b/core/commands/implement.md
@@ -12,7 +12,7 @@ arguments:
   - name: task
     description: "Optional task id (default: the next eligible task)"
 inputs:
-  - { path: "{{paths.specs}}/<ID>-<slug>/tasks.md", required: true, description: "spec.md § Tasks at lite depth with 3 tasks or fewer" }
+  - { path: "{{paths.specs}}/<ID>-<slug>/tasks.md", required: true, description: "every depth, including lite" }
   - { path: "{{paths.specs}}/<ID>-<slug>/_log/progress.yml" }
 outputs:
   - { path: "(code)", description: one local commit per task after PASS }
diff --git a/core/commands/specify.md b/core/commands/specify.md
index 7193795..3af51e2 100644
--- a/core/commands/specify.md
+++ b/core/commands/specify.md
@@ -2,7 +2,7 @@
 schema_version: 1
 id: specify
 title: Specify
-description: "Turn a story into requirements and design at lite, standard or full depth, with traceability and a Consistency Check; at lite, story, spec and tasks in one session."
+description: "Turn a story into requirements and design at lite, standard or full depth, with traceability and a Consistency Check; at lite, story and spec in one session."
 status: stable
 flow: { after: [story], next: [clarify, tasks, implement] }
 arguments:
@@ -20,8 +20,8 @@ inputs:
 outputs:
   - { path: "{{paths.specs}}/<ID>-<slug>/requirements.md", description: standard and full }
   - { path: "{{paths.specs}}/<ID>-<slug>/design.md", description: standard and full }
-  - { path: "{{paths.specs}}/<ID>-<slug>/spec.md", description: "lite: requirements, design and up to 3 tasks" }
-  - { path: "{{paths.specs}}/<ID>-<slug>/quickstart.md", description: only when the spec has behavior a user or PO can see }
+  - { path: "{{paths.specs}}/<ID>-<slug>/spec.md", description: "lite: requirements and design" }
+  - { path: "{{paths.specs}}/<ID>-<slug>/quickstart.md", description: "only when the spec has behavior a user or PO can see" }
   - { path: "{{paths.specs}}/<ID>-<slug>/contract/", description: only when the spec touches more than one project }
 capabilities: [read, search, edit, shell, mcp]
 templates:
@@ -173,7 +173,7 @@ refactors or internal infrastructure.
 
 ## 5c. data-model.md (only when data changes)
 
-When the spec adds or changes entities, fields, relationships or states, write `data-model.md` from
+When the spec adds or changes entities, fields, relationships or states (never by how many tasks, requirements or scenarios there are), write `data-model.md` from
 `{{template:spec/data-model.md}}` following `{{template:rules/doc-data-model.md}}`.
 
 ## 6. Consistency Check
diff --git a/core/commands/tasks.md b/core/commands/tasks.md
index 2fd01eb..6f0c3c9 100644
--- a/core/commands/tasks.md
+++ b/core/commands/tasks.md
@@ -29,8 +29,8 @@ Spec: {{arg:spec}}
 
 Write task content in `{{language.technical}}`; headings, ids and YAML keys stay in English.
 
-At lite depth with 3 tasks or fewer, `/mandao-specify` already wrote them inline in `spec.md`: there is
-nothing to do here. Otherwise:
+The tasks go in `tasks.md` at every depth (lite, standard and full), whatever their number, even a
+single one; `spec.md` never holds them. At lite depth `/mandao-specify` runs this step in its own session.
 
 1. **Gate.** Run `{{script:where}} {{arg:spec}} --harness <this harness> --first "/mandao-tasks {{arg:spec}}"`: if `inWorktree` is false, move into the worktree before any other step.
 <!-- mandao:if harness=claude -->
diff --git a/core/templates/shared/rules/doc-lite.md b/core/templates/shared/rules/doc-lite.md
index 7bf363b..ede1180 100644
--- a/core/templates/shared/rules/doc-lite.md
+++ b/core/templates/shared/rules/doc-lite.md
@@ -7,21 +7,19 @@ rule: doc-lite
 
 Applies the principles in `spec-docs.md`.
 
-At lite depth one session writes `story.md` and `spec.md`, which replaces `requirements.md`,
-`design.md` and, with 3 tasks or fewer, `tasks.md`. Same ids and the same rules as the documents it
-replaces: FRs and scenarios, the AC → FR matrix, decisions, changes with exemplars, the Consistency
-Check, clarifications, and a Premise Ledger with **High premises only**. Tasks go inline under
-`## Tasks` in the Details format, without an Overview; a fourth task means a separate `tasks.md`.
-Parsers, the Consistency Check and traceability read the same sections from `spec.md`.
+At lite depth one session writes `story.md` and `spec.md`, which replaces `requirements.md`
+and `design.md`; the tasks are in `tasks.md`, as at every depth. Same ids and the same rules as the
+documents it replaces: FRs and scenarios, the AC → FR matrix, decisions, changes with exemplars, the Consistency
+Check, clarifications, and a Premise Ledger with **High premises only**. Parsers, the Consistency
+Check and traceability read the same sections from `spec.md`.
 
 ## One session
 
 The cost of a session is mostly writing and reading its context, so lite pays it once:
 1. Write `story.md` if there is none (from `spec/story.md`), then `spec.md` from
    `spec/spec.md` instead of `requirements.md` and `design.md`: the same requirements and
-   design sections, a Premise Ledger with **High premises only**, and the tasks inline under `## Tasks`
-   (Details format of `spec/tasks.md`) when there are 3 or fewer. With more, write the
-   tasks in `tasks.md` as `/mandao-tasks` does, in this same session.
+   design sections and a Premise Ledger with **High premises only**. Then write `tasks.md` as
+   `/mandao-tasks` does, in this same session, whatever the number of tasks.
 2. Skip `/mandao-clarify` unless something is open: a `[NEEDS CLARIFICATION]`, an `OPEN` or a
    Consistency Check finding.
 3. Ask for **one** approval of story, spec and tasks together. The user may give it from the terminal
diff --git a/core/templates/shared/spec/spec.md b/core/templates/shared/spec/spec.md
index 430011a..b7beea8 100644
--- a/core/templates/shared/spec/spec.md
+++ b/core/templates/shared/spec/spec.md
@@ -60,28 +60,4 @@ No findings.
 
 ## Premise Ledger
 
-## Tasks
-
-### [ ] T1 — <result, in plain words>
-
-- **What:** <what it does and why>.
-- **Done when:**
-  - S-1.1 holds: <behavior>.
-
-```yaml
-project: <project>
-kind: feat
-tier: standard
-files: [path/to/file.ts]
-exemplar: path/to/similar.ts
-ac: [AC-1]
-scenarios: [S-1.1]
-test_levels: { S-1.1: unit }
-evidence: tdd
-risk_tags: []
-depends_on: []
-parallel_safe: false
-verify: <command>
-```
-
 ## Evidence
diff --git a/core/templates/shared/spec/story.md b/core/templates/shared/spec/story.md
index 6f27668..c7b7917 100644
--- a/core/templates/shared/spec/story.md
+++ b/core/templates/shared/spec/story.md
@@ -1,5 +1,5 @@
 ---
-schema_version: 1
+schema_version: 2
 tracker: none            # jira | linear | clickup | monday | none
 type: story              # epic | story | bug | enhancement | task | performance
 id: MDO-0000             # tracker id, or a local id when there is no tracker
diff --git a/docs/commands/README.md b/docs/commands/README.md
index 91d5ff6..d920713 100644
--- a/docs/commands/README.md
+++ b/docs/commands/README.md
@@ -10,7 +10,7 @@ How they fit together: the [overview in the README](../../README.md#how-it-works
 | [`/mandao-init`](init.md) | Set up Mandao in the current workspace by running the Mandao CLI, then suggest the constitution. | no | 🟢 stable |
 | [`/mandao-constitution`](constitution.md) | Establish or update the project foundation (technical constitution and product context), the AGENTS.md hierarchy and the project skills. | yes | 🟢 stable |
 | [`/mandao-story`](story.md) | Create or enrich a user story with enough business context: sufficiency rubric, sources, AC-n with critical flags. | yes | 🟢 stable |
-| [`/mandao-specify`](specify.md) | Turn a story into requirements and design at lite, standard or full depth, with traceability and a Consistency Check; at lite, story, spec and tasks in one session. | yes | 🟢 stable |
+| [`/mandao-specify`](specify.md) | Turn a story into requirements and design at lite, standard or full depth, with traceability and a Consistency Check; at lite, story and spec in one session. | yes | 🟢 stable |
 | [`/mandao-clarify`](clarify.md) | Resolve [NEEDS CLARIFICATION] items and Consistency Check findings, routing business questions to the PO and technical ones to the dev. | yes | 🟢 stable |
 | [`/mandao-tasks`](tasks.md) | Break an approved spec into Tn tasks: an overview by acceptance criterion with checkpoints, and per task what, done when, test levels and dependencies. | yes | 🟢 stable |
 | [`/mandao-implement`](implement.md) | Run the Leader → Implementer → Reviewer loop task by task, with checkpoints after every step and a commit after each Reviewer PASS. | no | 🟢 stable |
diff --git a/docs/commands/specify.md b/docs/commands/specify.md
index b6a4e2a..0a8cedc 100644
--- a/docs/commands/specify.md
+++ b/docs/commands/specify.md
@@ -2,7 +2,7 @@
 
 <!-- mandao:generated by npm run diagrams from core/commands/specify.md; do not edit below -->
 
-Turn a story into requirements and design at lite, standard or full depth, with traceability and a Consistency Check; at lite, story, spec and tasks in one session.
+Turn a story into requirements and design at lite, standard or full depth, with traceability and a Consistency Check; at lite, story and spec in one session.
 
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="../diagrams/command-specify-dark.svg">
@@ -25,7 +25,7 @@ Turn a story into requirements and design at lite, standard or full depth, with
 
 - `specs/<ID>-<slug>/requirements.md`: standard and full
 - `specs/<ID>-<slug>/design.md`: standard and full
-- `specs/<ID>-<slug>/spec.md`: lite: requirements, design and up to 3 tasks
+- `specs/<ID>-<slug>/spec.md`: lite: requirements and design
 - `specs/<ID>-<slug>/quickstart.md`: only when the spec has behavior a user or PO can see
 - `specs/<ID>-<slug>/contract/`: only when the spec touches more than one project
 
diff --git a/docs/diagrams/src/command-clarify.json b/docs/diagrams/src/command-clarify.json
index c9c07ac..ac54c11 100644
--- a/docs/diagrams/src/command-clarify.json
+++ b/docs/diagrams/src/command-clarify.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-close.json b/docs/diagrams/src/command-close.json
index 6b36feb..99fa0a7 100644
--- a/docs/diagrams/src/command-close.json
+++ b/docs/diagrams/src/command-close.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-constitution.json b/docs/diagrams/src/command-constitution.json
index 7dc5a86..83db654 100644
--- a/docs/diagrams/src/command-constitution.json
+++ b/docs/diagrams/src/command-constitution.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-implement.json b/docs/diagrams/src/command-implement.json
index a5e540b..6c1a2ec 100644
--- a/docs/diagrams/src/command-implement.json
+++ b/docs/diagrams/src/command-implement.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-init.json b/docs/diagrams/src/command-init.json
index 725f1de..5f3549a 100644
--- a/docs/diagrams/src/command-init.json
+++ b/docs/diagrams/src/command-init.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-quick.json b/docs/diagrams/src/command-quick.json
index 47a1568..26e1a7e 100644
--- a/docs/diagrams/src/command-quick.json
+++ b/docs/diagrams/src/command-quick.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-resume.json b/docs/diagrams/src/command-resume.json
index 65e7033..84c4205 100644
--- a/docs/diagrams/src/command-resume.json
+++ b/docs/diagrams/src/command-resume.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-specify.json b/docs/diagrams/src/command-specify.json
index acb018c..7a3ad37 100644
--- a/docs/diagrams/src/command-specify.json
+++ b/docs/diagrams/src/command-specify.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-story.json b/docs/diagrams/src/command-story.json
index 57b3f63..9b951e1 100644
--- a/docs/diagrams/src/command-story.json
+++ b/docs/diagrams/src/command-story.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-tasks.json b/docs/diagrams/src/command-tasks.json
index 7ecaed3..c255294 100644
--- a/docs/diagrams/src/command-tasks.json
+++ b/docs/diagrams/src/command-tasks.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/command-verify.json b/docs/diagrams/src/command-verify.json
index 86c7425..26e3615 100644
--- a/docs/diagrams/src/command-verify.json
+++ b/docs/diagrams/src/command-verify.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/lifecycle.json b/docs/diagrams/src/lifecycle.json
index 9f82fc2..864f0b3 100644
--- a/docs/diagrams/src/lifecycle.json
+++ b/docs/diagrams/src/lifecycle.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/overview.json b/docs/diagrams/src/overview.json
index 246f7dd..0e003c1 100644
--- a/docs/diagrams/src/overview.json
+++ b/docs/diagrams/src/overview.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/process-bug.json b/docs/diagrams/src/process-bug.json
index 6ed1ab7..816e63d 100644
--- a/docs/diagrams/src/process-bug.json
+++ b/docs/diagrams/src/process-bug.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/process-epic.json b/docs/diagrams/src/process-epic.json
index c7a3d42..db3c2df 100644
--- a/docs/diagrams/src/process-epic.json
+++ b/docs/diagrams/src/process-epic.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/process-feature.json b/docs/diagrams/src/process-feature.json
index 42c32cb..728fb99 100644
--- a/docs/diagrams/src/process-feature.json
+++ b/docs/diagrams/src/process-feature.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/process-hotfix.json b/docs/diagrams/src/process-hotfix.json
index 503974e..1403dd8 100644
--- a/docs/diagrams/src/process-hotfix.json
+++ b/docs/diagrams/src/process-hotfix.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/process-maintenance.json b/docs/diagrams/src/process-maintenance.json
index e01ac82..a4ee99d 100644
--- a/docs/diagrams/src/process-maintenance.json
+++ b/docs/diagrams/src/process-maintenance.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/process-quick.json b/docs/diagrams/src/process-quick.json
index dc2ccd4..dc92154 100644
--- a/docs/diagrams/src/process-quick.json
+++ b/docs/diagrams/src/process-quick.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/process-setup.json b/docs/diagrams/src/process-setup.json
index 5885fbc..42be1a9 100644
--- a/docs/diagrams/src/process-setup.json
+++ b/docs/diagrams/src/process-setup.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/docs/diagrams/src/task-loop.json b/docs/diagrams/src/task-loop.json
index 3238809..23a8fe7 100644
--- a/docs/diagrams/src/task-loop.json
+++ b/docs/diagrams/src/task-loop.json
@@ -19,7 +19,7 @@
     },
     {
       "path": "core/commands/implement.md",
-      "sha256": "8a4d5c66015aa7634429b078ade152fd9b35ff302e478905ec3353d6443d9006"
+      "sha256": "d5edb0f0ffe32ed74ddf17437de734b3d833f2b470d5946baaee07cb46d010d7"
     },
     {
       "path": "core/commands/init.md",
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "2ed8d155a38c99652a53644040d548e5f61b11f6d0618dafc7970cb6877ff956"
+      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
     },
     {
       "path": "core/commands/story.md",
@@ -47,7 +47,7 @@
     },
     {
       "path": "core/commands/tasks.md",
-      "sha256": "c6b2345f5206822347cb8e230813f82a49974c4cfe52ca7923f6f65ab0c5fc12"
+      "sha256": "6fd199dca7962acca1b621070301025edbdff652d81f884506fbd83545d66a3d"
     },
     {
       "path": "core/commands/verify.md",
diff --git a/src/scripts/spec-log.ts b/src/scripts/spec-log.ts
index fa0efa2..8b8c47d 100644
--- a/src/scripts/spec-log.ts
+++ b/src/scripts/spec-log.ts
@@ -1,5 +1,7 @@
-import { existsSync } from 'node:fs';
+import { existsSync, readFileSync } from 'node:fs';
 import { join } from 'node:path';
+import { tasksHaveOwnFile } from '../spec/layout.js';
+import { frontmatterOf } from '../spec/markdown.js';
 
 /**
  * Machine files of a spec live in `_log/` (the readability pass): people read the documents in the spec
@@ -38,15 +40,25 @@ const ROOT_MARKERS = ['execution.md', 'progress.yml'];
 export const hasExecutionLog = (specDir: string) =>
   existsSync(join(specDir, LOG_DIR, 'execution.md')) || existsSync(join(specDir, 'execution.md'));
 
-/** The documents of a spec, by role. A lite spec keeps requirements, design and (up to 3) tasks in `spec.md`. */
+/** The documents of a spec, by role. A lite spec keeps requirements, design and (version 1: up to 3) tasks in `spec.md`. */
 export type SpecDoc = 'requirements' | 'design' | 'tasks';
 
 export const LITE_DOC = 'spec.md';
 
-/** The file holding a role: its own document when present, else `spec.md` when present, else its own name. */
+/** True when the story's layout version keeps the tasks in `tasks.md` (the rule lives in `src/spec/layout.ts`). */
+function tasksAlwaysOwnFile(specDir: string): boolean {
+  const story = join(specDir, 'story.md');
+  return existsSync(story) && tasksHaveOwnFile(frontmatterOf(readFileSync(story, 'utf8')).data.schema_version);
+}
+
+/**
+ * The file holding a role: its own document when present, else `spec.md` when present, else its own name.
+ * In a version 2 spec the tasks never fall back to `spec.md`.
+ */
 export function docPath(specDir: string, doc: SpecDoc): string {
   const own = join(specDir, `${doc}.md`);
   if (existsSync(own)) return own;
+  if (doc === 'tasks' && tasksAlwaysOwnFile(specDir)) return own;
   const lite = join(specDir, LITE_DOC);
   return existsSync(lite) ? lite : own;
 }
diff --git a/src/spec/AGENTS.md b/src/spec/AGENTS.md
index ce55730..ce282aa 100644
--- a/src/spec/AGENTS.md
+++ b/src/spec/AGENTS.md
@@ -13,4 +13,4 @@ The CLI and scripts gather inputs; writer helpers own persistence.
 - Unit-test decisions and integration-test recording through temporary workspaces made by `makeTree`.
 - `next.ts`: `nextStep` is pure and only recommends; it never offers implement before approval or past an open item (`NEEDS CLARIFICATION`, `CONFLICT` inline or as a Consistency Check row, a critical Consistency Check row, a pending decision; resolved rows are ignored). Lite is `spec.md` existing (`SpecFolder.lite`). Hashes ignore `status:` and `tasks.md`; a missing hash means no claim. Change-after-approval compares approval rows only; `shown` rows (`run next --shown`) are compared only by `approve --by-running`.
 - `next.ts` reads only real markers: `withoutCode` (`markdown.ts`) drops inline code spans and fenced blocks first, so a marker shown as an example is not an open item. A Consistency Check row is resolved when its Status starts with `resolved` (`core/templates/shared/rules/consistency-check.md`; a test pins both). A `verify-report.md` with `verdict: blocked` recommends implement, not verify. A closed spec skips the open-item check and recommends its delivery from git (`unpushed` → push, `pushed` → PR and merge, `merged` → `none`, no options); it never offers story or clarify. `nextFor` (`src/cli/approve.ts`) reads those facts from the spec's own branch (not HEAD); only `origin/<base>` counts as merged, and without git or the branch there is no delivery fact; naming the delivery performs nothing (MDO-0012).
-- `layout.ts`: `layoutManifest(version, depth)` is the one manifest behind `run layout`, the close gate (`run status <ID> closed`) and `docs/spec-anatomy.md`; the version is the story's `schema_version` (`LAYOUT_VERSIONS`, 1 or 2, anything else throws), never a `layout:` key or the files present. Alternatives (version 1 lite: `spec.md` or `requirements.md` + `design.md`) are `oneOf` entries in the manifest, not special cases. `layoutFindings` is pure over `{ story, docs, entries }`; `readLayout` in `src/scripts/spec.ts` reads the folder (D1). An AC with `status: removed` is skipped by `trace` and `acStatus` (ADR 0041).
+- `layout.ts`: `layoutManifest(version, depth)` is the one manifest behind `run layout`, the close gate (`run status <ID> closed`) and `docs/spec-anatomy.md`; the version is the story's `schema_version` (`LAYOUT_VERSIONS`, 1 or 2, anything else throws), never a `layout:` key or the files present. `tasksHaveOwnFile(schema_version)` is the one rule for where tasks live (version 2: always `tasks.md`; `docPath` in `src/scripts/spec-log.ts` calls it and never falls back to `spec.md` for them; version 1 keeps the old fallback, and any value outside `LAYOUT_VERSIONS` counts as version 1 there). New stories start at version 2. Alternatives (version 1 lite: `spec.md` or `requirements.md` + `design.md`) are `oneOf` entries in the manifest, not special cases. `layoutFindings` is pure over `{ story, docs, entries }`; `readLayout` in `src/scripts/spec.ts` reads the folder (D1). An AC with `status: removed` is skipped by `trace` and `acStatus` (ADR 0041).
diff --git a/src/spec/layout.ts b/src/spec/layout.ts
index e7b26c4..78676cf 100644
--- a/src/spec/layout.ts
+++ b/src/spec/layout.ts
@@ -65,6 +65,12 @@ const V1_LEGACY = [
   'release-notes.md',
 ];
 
+/** True when a story's `schema_version` names a layout whose tasks always live in `tasks.md`, whatever their number. */
+export function tasksHaveOwnFile(schemaVersion: unknown): boolean {
+  const version = LAYOUT_VERSIONS.find((v) => v === schemaVersion);
+  return version !== undefined && layoutManifest(version, 'lite').required.planned.includes('tasks.md');
+}
+
 const docs = (depth: Depth) => (depth === 'lite' ? ['spec.md'] : ['requirements.md', 'design.md']);
 
 /** The one manifest behind the folder check, the close gate and `docs/spec-anatomy.md` (design D1). */
diff --git a/src/spec/task-index.ts b/src/spec/task-index.ts
index 9418d3d..f0c1788 100644
--- a/src/spec/task-index.ts
+++ b/src/spec/task-index.ts
@@ -92,7 +92,7 @@ function taskIssues(lines: string[], task: Task): string[] {
   return out;
 }
 
-/** A lite `spec.md` carries its tasks inline, up to this many; more go to `tasks.md`. */
+/** Version 1 only: a lite `spec.md` carries its tasks inline, up to this many; more go to `tasks.md`. */
 export const MAX_INLINE_TASKS = 3;
 
 /**
diff --git a/test/integration/lite-spec.test.ts b/test/integration/lite-spec.test.ts
index 3f09f9a..6c84981 100644
--- a/test/integration/lite-spec.test.ts
+++ b/test/integration/lite-spec.test.ts
@@ -5,7 +5,7 @@ import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
 import { buildProgram } from '../../src/cli/program.js';
 import { writeYaml } from '../../src/engine/files.js';
 import { syncProject } from '../../src/engine/sync.js';
-import { readSpec } from '../../src/scripts/spec.js';
+import { readLayout, readSpec } from '../../src/scripts/spec.js';
 import { docPath } from '../../src/scripts/spec-log.js';
 import { makeTree, pkg } from '../helpers.js';
 
@@ -137,3 +137,83 @@ describe('lite: story.md + spec.md', () => {
     expect(issues).toContain('T4: the title names a file; say the result instead');
   });
 });
+
+/** A lite version 2 spec: story.md says version 2, spec.md has no `## Tasks` unless `stale` is given, the tasks live in tasks.md. */
+function repoV2(tasks: string, stale = '') {
+  const root = repo(task('T9', 'Stale inline task', 'AC-1', 'S-1.1'));
+  const dir = join(root, SPEC);
+  const story = readFileSync(join(dir, 'story.md'), 'utf8').replace(/schema_version: 1/, 'schema_version: 2');
+  writeFileSync(join(dir, 'story.md'), story);
+  const spec = readFileSync(join(dir, 'spec.md'), 'utf8').split('## Tasks')[0]!;
+  writeFileSync(join(dir, 'spec.md'), stale ? `${spec}## Tasks\n\n${stale}` : spec);
+  writeFileSync(join(dir, 'tasks.md'), `# Tasks\n\n## Details\n\n${tasks}`);
+  return root;
+}
+
+describe('lite version 2: tasks.md always (AC-1)', () => {
+  const taskList = (n: number) => Array.from({ length: n }, (_, i) => task(`T${i + 1}`, `Step ${i + 1}`, 'AC-1', 'S-1.1')).join('');
+
+  test('S-1.1: one task is in tasks.md, and spec.md has no ## Tasks', async () => {
+    const root = repoV2(taskList(1));
+    const dir = join(root, SPEC);
+    expect(readFileSync(join(dir, 'spec.md'), 'utf8')).not.toContain('## Tasks');
+    expect(docPath(dir, 'tasks')).toBe(join(dir, 'tasks.md'));
+    expect(readSpec(dir).tasks.map((t) => t.id)).toEqual(['T1']);
+    expect((await run(root, 'tasks', 'MDO-0001')).waves).toEqual([['T1']]);
+  });
+
+  test('S-1.2: 3 and 4 tasks give the same file set, and tasks are never read from spec.md', () => {
+    const stale = task('T9', 'Stale inline task', 'AC-1', 'S-1.1');
+    const three = repoV2(taskList(3), stale);
+    const four = repoV2(taskList(4), stale);
+    const a = readLayout(join(three, SPEC));
+    const b = readLayout(join(four, SPEC));
+    expect({ missing: b.missing, unexpected: b.unexpected }).toEqual({ missing: a.missing, unexpected: a.unexpected });
+    expect(readSpec(join(four, SPEC)).tasks.map((t) => t.id)).toEqual(['T1', 'T2', 'T3', 'T4']);
+  });
+
+  test('S-1.2/C2: with 4 tasks the check never says "more than 3 go to tasks.md"', async () => {
+    const root = repoV2(taskList(4));
+    const issues: string[] = (await run(root, 'tasks', 'MDO-0001')).issues;
+    expect(issues.filter((i) => /more than 3|inline/.test(i))).toEqual([]);
+  });
+
+  test('S-1.1: before the tasks step, the tasks path is tasks.md, not spec.md', () => {
+    const root = repoV2('');
+    const dir = join(root, SPEC);
+    rmSync(join(dir, 'tasks.md'));
+    expect(docPath(dir, 'tasks')).toBe(join(dir, 'tasks.md'));
+  });
+
+  test('S-1.2/C2: four tasks written inline in spec.md are not read as the spec tasks', () => {
+    const inline = [1, 2, 3, 4].map((n) => task(`T${n}`, `Step ${n}`, 'AC-1', 'S-1.1')).join('');
+    const root = repoV2('', inline);
+    const dir = join(root, SPEC);
+    rmSync(join(dir, 'tasks.md'));
+    expect(readSpec(dir).tasks).toEqual([]);
+  });
+
+  test('S-1.1: the checkpoint ticks the task in tasks.md and leaves spec.md alone', async () => {
+    const root = repoV2(taskList(1));
+    const dir = join(root, SPEC);
+    const specBefore = readFileSync(join(dir, 'spec.md'), 'utf8');
+    await run(root, 'checkpoint', 'MDO-0001', '--task', 'T1', '--done', 'T1', '--clear');
+    expect(readFileSync(join(dir, 'tasks.md'), 'utf8')).toContain('### [x] T1 — Step 1');
+    expect(readFileSync(join(dir, 'spec.md'), 'utf8')).toBe(specBefore);
+  });
+
+  test('S-1.1: approve tasks on the same fixture approves tasks.md with no inline issue', async () => {
+    const root = repoV2(taskList(4));
+    git(root, 'add', '.');
+    git(root, 'commit', '-qm', 'base');
+    await run(root, 'tasks', 'MDO-0001', '--index', '--write');
+    const r = await approveTasks(root);
+    expect(JSON.stringify(r)).not.toMatch(/inline|more than 3/);
+    expect(r).toMatchObject({ approved: true });
+  });
+});
+
+const approveTasks = async (root: string) => {
+  await buildProgram(() => root).parseAsync(['node', 'mandao', 'approve', 'MDO-0001', 'tasks']);
+  return JSON.parse(out.at(-1)!);
+};
diff --git a/test/unit/content.test.ts b/test/unit/content.test.ts
index 1472337..1b1d2e4 100644
--- a/test/unit/content.test.ts
+++ b/test/unit/content.test.ts
@@ -1,9 +1,12 @@
+import { readFileSync } from 'node:fs';
+import { join } from 'node:path';
 import { describe, expect, test } from 'vitest';
 import { ADAPTERS } from '../../src/adapters/index.js';
 import { readCatalog } from '../../src/engine/catalog.js';
 import { buildOutputs } from '../../src/engine/sync.js';
 import { loadLayers } from '../../src/resolver/layers.js';
 import { configSchema, PROFILES, WORKSPACE_MODES } from '../../src/schemas/index.js';
+import { frontmatterOf } from '../../src/spec/markdown.js';
 
 /** The shipped core must resolve and render for every profile, mode and harness. */
 describe('core content', () => {
@@ -208,4 +211,49 @@ describe('core content', () => {
   test('the catalog is valid', () => {
     expect(() => readCatalog()).not.toThrow();
   });
+
+  /** MDO-0011 T2: tasks.md at every depth; quickstart and data-model by kind of content, never by count. */
+  describe('one layout per depth in the commands (AC-1)', () => {
+    const config = configSchema.parse({
+      schema_version: 1,
+      workspace: 'single',
+      projects: [{ name: 'a', path: '.', profile: 'app' }],
+      harnesses: ['claude'],
+    });
+    const rendered = (id: string) => {
+      const { files } = buildOutputs(config, {}, layers, '0.0.0', 'project');
+      const f = files.find((x) => new RegExp(`mandao-${id}(/SKILL\\.md|\\.md)$`).test(x.path));
+      expect(f, `mandao-${id}`).toBeDefined();
+      return f!.content;
+    };
+    const BY_COUNT = /3 tasks or fewer|3 or fewer|fourth task|up to 3 tasks|more than 3|inline under `## Tasks`/i;
+
+    test('S-1.2: no command or lite rule decides where tasks go by how many there are', () => {
+      for (const id of ['specify', 'tasks', 'implement', 'clarify']) expect(rendered(id), id).not.toMatch(BY_COUNT);
+    });
+
+    test('S-1.2/C2: the spec template has no ## Tasks, and the tasks step writes tasks.md at every depth', () => {
+      const tpl = readFileSync(join(process.cwd(), 'core/templates/shared/spec/spec.md'), 'utf8');
+      expect(tpl).not.toContain('## Tasks');
+      expect(rendered('tasks')).toMatch(/tasks\.md[^.]*(every|any|all) depth|(every|any|all) depth[^.]*tasks\.md/i);
+    });
+
+    test('S-1.3: specify writes quickstart.md only for visible behavior and data-model.md only for data changes', () => {
+      const specify = rendered('specify');
+      expect(specify).toMatch(/quickstart\.md[^\n]*(only|when)[^\n]*(visible|user or PO can see)/i);
+      expect(specify).toMatch(/data-model\.md[^\n]*only when data changes/i);
+    });
+
+    test('S-1.3/C1: neither file is conditioned on the number of tasks, requirements or scenarios', () => {
+      const specify = rendered('specify');
+      for (const line of specify.split('\n').filter((l) => /quickstart\.md|data-model\.md/.test(l)))
+        expect(line).not.toMatch(/\b\d+ (tasks|requirements|scenarios)|number of|fewer|more than/i);
+      expect(specify).not.toMatch(/lite[^\n]*writes? (the )?tasks|tasks inline/i);
+    });
+
+    test('AC-1: a story rendered from the template starts at layout version 2', () => {
+      const tpl = readFileSync(join(process.cwd(), 'core/templates/shared/spec/story.md'), 'utf8');
+      expect(frontmatterOf(tpl).data.schema_version).toBe(2);
+    });
+  });
 });
diff --git a/test/unit/layout.test.ts b/test/unit/layout.test.ts
index 588ef39..6fe30c2 100644
--- a/test/unit/layout.test.ts
+++ b/test/unit/layout.test.ts
@@ -4,7 +4,7 @@ import { join } from 'node:path';
 import { describe, expect, test } from 'vitest';
 import { readLayout } from '../../src/scripts/spec.js';
 import { acStatus, parseRequirements, parseStory, parseTasks, trace } from '../../src/spec/index.js';
-import { anatomyTables, layoutFindings, layoutManifest } from '../../src/spec/layout.js';
+import { anatomyTables, layoutFindings, layoutManifest, tasksHaveOwnFile } from '../../src/spec/layout.js';
 import { makeTree } from '../helpers.js';
 
 /**
@@ -151,3 +151,11 @@ describe('docs/spec-anatomy.md is built from the manifest (S-8.1)', () => {
     expect(readFileSync(join(root, 'README.md'), 'utf8')).toContain('docs/spec-anatomy.md');
   });
 });
+
+describe('tasksHaveOwnFile: the layout version decides where tasks live (MDO-0011 AC-1)', () => {
+  test('version 2 always has tasks.md, version 1 does not; any other value is no known layout', () => {
+    expect(tasksHaveOwnFile(2)).toBe(true);
+    expect(tasksHaveOwnFile(1)).toBe(false);
+    for (const v of [3, 2.5, '2', undefined, null]) expect(tasksHaveOwnFile(v), String(v)).toBe(false);
+  });
+});

```
