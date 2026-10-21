# Review pack — T6, attempt 2

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T6-2.md`.

## Brief

```json
{
  "spec": "MDO-0011-one-fixed-layout-for-every-spec-folder",
  "task": {
    "project": "mandao",
    "kind": "fix",
    "tier": "standard",
    "files": [
      "src/cli/run-ledger.ts",
      "src/scripts/commits.ts",
      "src/spec/close-summary.ts",
      "src/cli/run-close.ts",
      "core/commands/close.md",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/close-commit.test.ts"
    ],
    "exemplar": "src/cli/run-ledger.ts",
    "ac": [
      "AC-5",
      "AC-5/C1"
    ],
    "scenarios": [
      "S-5.1",
      "S-5.2",
      "S-5.2/C1"
    ],
    "test_levels": {
      "S-5.1": "e2e",
      "S-5.2": "e2e",
      "S-5.2/C1": "e2e"
    },
    "evidence": "tdd",
    "risk_tags": [],
    "depends_on": [
      "T5"
    ],
    "parallel_safe": false,
    "verify": "npx vitest run test/integration/close-commit.test.ts test/integration/mdo-0005-defects.test.ts",
    "tests": {
      "unit": [],
      "e2e": [
        "S-5.1",
        "S-5.2",
        "S-5.2/C1"
      ]
    },
    "dod": [],
    "characterization": false,
    "id": "T6",
    "title": "Close commits what it applied and what was regenerated from it",
    "done": false,
    "line": 188
  },
  "acceptance": [
    {
      "ref": "AC-5",
      "text": "**GIVEN** a close that applied approved edits outside the spec folder, for example to the constitution or to command content, and regenerated files from them · **WHEN** close commits · **THEN** one commit holds the spec folder, the changelog line, the approved edits and the regenerated files · **BUT it must NOT** commit a file the close did not write or that the person did not approve"
    },
    {
      "ref": "AC-5/C1",
      "text": "**BUT it must NOT** commit a file the close did not write or that the person did not approve"
    }
  ],
  "scenarios": [
    {
      "ref": "S-5.1",
      "text": "**Given** a close that applied an approved edit to `core/commands/tasks.md`, ran `mandao sync` and the diagrams · **When** `commit-spec <ID> close` runs · **Then** the one commit holds the spec, the changelog line, `core/commands/tasks.md`, the regenerated command files, the lock and the diagram sources"
    },
    {
      "ref": "S-5.2",
      "text": "**Given** an uncommitted change to `src/cli/start.ts` that close did not record · **When** the same call runs · **Then** the file is not committed, and the result names it as left out"
    },
    {
      "ref": "S-5.2/C1",
      "text": "**Then** the file is not committed, and the result names it as left out"
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
    "task": "T6",
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
      "test/integration/lite-spec.test.ts",
      "test/integration/log-v2.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/review.test.ts",
      "test/integration/scripts.test.ts",
      "test/integration/shadow.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/start.test.ts",
      "test/integration/state-log.test.ts",
      "test/integration/tdd.test.ts",
      "test/integration/where.test.ts",
      "test/log-v2-helpers.ts",
      "test/unit/commits-times.test.ts",
      "test/unit/diagram.test.ts",
      "test/unit/kaizen-sessions.test.ts",
      "test/unit/kaizen.test.ts",
      "test/unit/layout.test.ts",
      "test/unit/log-cache.test.ts",
      "test/unit/next.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/release.test.ts",
      "test/unit/session-advice.test.ts",
      "test/unit/session-turns.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ],
    "files": [
      "src/cli/run-ledger.ts",
      "src/scripts/commits.ts",
      "src/spec/close-summary.ts",
      "src/cli/run-close.ts",
      "core/commands/close.md",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/close-commit.test.ts",
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
      "test/integration/lite-spec.test.ts",
      "test/integration/log-v2.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/review.test.ts",
      "test/integration/scripts.test.ts",
      "test/integration/shadow.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/start.test.ts",
      "test/integration/state-log.test.ts",
      "test/integration/tdd.test.ts",
      "test/integration/where.test.ts",
      "test/log-v2-helpers.ts",
      "test/unit/commits-times.test.ts",
      "test/unit/diagram.test.ts",
      "test/unit/kaizen-sessions.test.ts",
      "test/unit/kaizen.test.ts",
      "test/unit/layout.test.ts",
      "test/unit/log-cache.test.ts",
      "test/unit/next.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/release.test.ts",
      "test/unit/session-advice.test.ts",
      "test/unit/session-turns.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related src/cli/run-ledger.ts src/scripts/commits.ts src/spec/close-summary.ts src/cli/run-close.ts core/commands/close.md test/integration/mdo-0005-defects.test.ts test/integration/close-commit.test.ts test/integration/approve.test.ts test/integration/branching.test.ts test/integration/characterization.test.ts test/integration/cli.test.ts test/integration/close.test.ts test/integration/costs.test.ts test/integration/doctor-cli.test.ts test/integration/enforced-rules.test.ts test/integration/engine.test.ts test/integration/layout.test.ts test/integration/leader-scripts.test.ts test/integration/ledger.test.ts test/integration/lite-spec.test.ts test/integration/log-v2.test.ts test/integration/mdo-0004-defects.test.ts test/integration/mdo-0006-defects.test.ts test/integration/premise.test.ts test/integration/review.test.ts test/integration/scripts.test.ts test/integration/shadow.test.ts test/integration/spec-log.test.ts test/integration/start.test.ts test/integration/state-log.test.ts test/integration/tdd.test.ts test/integration/where.test.ts test/log-v2-helpers.ts test/unit/commits-times.test.ts test/unit/diagram.test.ts test/unit/kaizen-sessions.test.ts test/unit/kaizen.test.ts test/unit/layout.test.ts test/unit/log-cache.test.ts test/unit/next.test.ts test/unit/pr-plan.test.ts test/unit/release.test.ts test/unit/session-advice.test.ts test/unit/session-turns.test.ts test/unit/spec.test.ts test/unit/task-index.test.ts test/unit/verify.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": [
      "src/cli/approve.ts",
      "src/cli/checkpoint-guards.ts",
      "src/cli/run-diagram.ts",
      "src/cli/run-leader.ts",
      "src/cli/run-mutation.ts",
      "src/cli/run-premise.ts",
      "src/cli/run-red.ts",
      "src/cli/run-review.ts",
      "src/cli/run-spec.ts",
      "src/cli/run-verify.ts",
      "src/cli/session-advice.ts",
      "src/cli/spec-context.ts",
      "src/scripts/publish.ts",
      "src/scripts/review.ts",
      "src/spec/index.ts",
      "test/integration/branching.test.ts",
      "test/integration/close.test.ts",
      "test/integration/ledger.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/unit/commits-times.test.ts",
      "test/unit/release.test.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/integration/close-commit.test.ts",
      "test/integration/mdo-0005-defects.test.ts"
    ],
    "changed": [
      "test/integration/close-commit.test.ts"
    ]
  }
}
```

## Gates — T6, attempt 2

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
diff --git a/.agents/skills/mandao-close/SKILL.md b/.agents/skills/mandao-close/SKILL.md
index 995eb55..e56b723 100644
--- a/.agents/skills/mandao-close/SKILL.md
+++ b/.agents/skills/mandao-close/SKILL.md
@@ -43,7 +43,9 @@ Then `node .mandao/bin/mandao.mjs run status <spec> closed` must be allowed (the
 `node .mandao/bin/mandao.mjs run impacts <spec>` lists what design.md proposed. Show each change as a diff against
 `docs/constitution/` (and product context), apply only what the user approves, and add an entry to
 `docs/constitution/CHANGELOG.md`. Close is the only mandao that writes the constitution after its
-creation.
+creation. Version 2 spec: record each approved edit outside the spec folder (constitution, command content,
+code) with `node .mandao/bin/mandao.mjs run close-summary <spec> --applied <path>` (repeatable), so the close commit stages it
+and, after `mandao sync` and the diagrams, the files regenerated from it.
 
 ## 3. Sync
 
@@ -120,7 +122,7 @@ unapplied and is reported.
 `## Outcome` and `## Delivery`, keeps your prose sections as they are, and upserts the spec's one line in
 `docs/CHANGELOG.md`; never edit the record by hand), set `status: closed` in story.md, then commit everything
 close wrote on its own: `node .mandao/bin/mandao.mjs run commit-spec <spec> close` (the spec folder, `docs/CHANGELOG.md`, `docs/kaizen/lessons.md`
-or, for version 1, `docs/releases/<ID>/` and `docs/kaizen/<ID>.md`, the constitution and changed module guides; a `docs` commit with `Refs: <ID>`,
+or, for version 1, `docs/releases/<ID>/` and `docs/kaizen/<ID>.md`, the constitution, changed module guides, the `--applied` paths and the files regenerated from them (lock, command renders, diagram sources); the result's `leftOut` names every other uncommitted file, which stays uncommitted; a `docs` commit with `Refs: <ID>`,
 never pushed). Report: Kaizen headline, impacts applied, drift, where it was published, the commit.
 
 **Worktree** (`worktrees.cleanup` in `.mandao/config.yml`): after the spec's branch is merged, `ask`
diff --git a/.claude/skills/mandao-close/SKILL.md b/.claude/skills/mandao-close/SKILL.md
index ec0a49d..970f5b4 100644
--- a/.claude/skills/mandao-close/SKILL.md
+++ b/.claude/skills/mandao-close/SKILL.md
@@ -49,7 +49,9 @@ Then `node .mandao/bin/mandao.mjs run status $spec closed` must be allowed (the
 `node .mandao/bin/mandao.mjs run impacts $spec` lists what design.md proposed. Show each change as a diff against
 `docs/constitution/` (and product context), apply only what the user approves, and add an entry to
 `docs/constitution/CHANGELOG.md`. Close is the only mandao that writes the constitution after its
-creation.
+creation. Version 2 spec: record each approved edit outside the spec folder (constitution, command content,
+code) with `node .mandao/bin/mandao.mjs run close-summary $spec --applied <path>` (repeatable), so the close commit stages it
+and, after `mandao sync` and the diagrams, the files regenerated from it.
 
 ## 3. Sync
 
@@ -126,7 +128,7 @@ unapplied and is reported.
 `## Outcome` and `## Delivery`, keeps your prose sections as they are, and upserts the spec's one line in
 `docs/CHANGELOG.md`; never edit the record by hand), set `status: closed` in story.md, then commit everything
 close wrote on its own: `node .mandao/bin/mandao.mjs run commit-spec $spec close` (the spec folder, `docs/CHANGELOG.md`, `docs/kaizen/lessons.md`
-or, for version 1, `docs/releases/<ID>/` and `docs/kaizen/<ID>.md`, the constitution and changed module guides; a `docs` commit with `Refs: <ID>`,
+or, for version 1, `docs/releases/<ID>/` and `docs/kaizen/<ID>.md`, the constitution, changed module guides, the `--applied` paths and the files regenerated from them (lock, command renders, diagram sources); the result's `leftOut` names every other uncommitted file, which stays uncommitted; a `docs` commit with `Refs: <ID>`,
 never pushed). Report: Kaizen headline, impacts applied, drift, where it was published, the commit.
 
 **Worktree** (`worktrees.cleanup` in `.mandao/config.yml`): after the spec's branch is merged, `ask`
diff --git a/.github/prompts/mandao-close.prompt.md b/.github/prompts/mandao-close.prompt.md
index df6fd19..b825483 100644
--- a/.github/prompts/mandao-close.prompt.md
+++ b/.github/prompts/mandao-close.prompt.md
@@ -50,7 +50,9 @@ Then `node .mandao/bin/mandao.mjs run status ${input:spec:Spec folder or id} clo
 `node .mandao/bin/mandao.mjs run impacts ${input:spec:Spec folder or id}` lists what design.md proposed. Show each change as a diff against
 `docs/constitution/` (and product context), apply only what the user approves, and add an entry to
 `docs/constitution/CHANGELOG.md`. Close is the only mandao that writes the constitution after its
-creation.
+creation. Version 2 spec: record each approved edit outside the spec folder (constitution, command content,
+code) with `node .mandao/bin/mandao.mjs run close-summary ${input:spec:Spec folder or id} --applied <path>` (repeatable), so the close commit stages it
+and, after `mandao sync` and the diagrams, the files regenerated from it.
 
 ## 3. Sync
 
@@ -127,7 +129,7 @@ unapplied and is reported.
 `## Outcome` and `## Delivery`, keeps your prose sections as they are, and upserts the spec's one line in
 `docs/CHANGELOG.md`; never edit the record by hand), set `status: closed` in story.md, then commit everything
 close wrote on its own: `node .mandao/bin/mandao.mjs run commit-spec ${input:spec:Spec folder or id} close` (the spec folder, `docs/CHANGELOG.md`, `docs/kaizen/lessons.md`
-or, for version 1, `docs/releases/<ID>/` and `docs/kaizen/<ID>.md`, the constitution and changed module guides; a `docs` commit with `Refs: <ID>`,
+or, for version 1, `docs/releases/<ID>/` and `docs/kaizen/<ID>.md`, the constitution, changed module guides, the `--applied` paths and the files regenerated from them (lock, command renders, diagram sources); the result's `leftOut` names every other uncommitted file, which stays uncommitted; a `docs` commit with `Refs: <ID>`,
 never pushed). Report: Kaizen headline, impacts applied, drift, where it was published, the commit.
 
 **Worktree** (`worktrees.cleanup` in `.mandao/config.yml`): after the spec's branch is merged, `ask`
diff --git a/.mandao/mandao.lock b/.mandao/mandao.lock
index b290b0a..1d22eb4 100644
--- a/.mandao/mandao.lock
+++ b/.mandao/mandao.lock
@@ -57,7 +57,7 @@ files:
     harness: codex
     from: command:close
     ownership: owned
-    hash: sha256-tH7WWvmYFW1z08xOcRwsCxxq8j0zhQ0AvUQGzAPtQxk=
+    hash: sha256-8caORFxS0cF7O6xceUL3ndaW/EKDeIzoO+Re75Xaa7o=
     scope: project
   - path: .agents/skills/mandao-constitution/agents/openai.yaml
     harness: codex
@@ -231,7 +231,7 @@ files:
     harness: claude
     from: command:close
     ownership: owned
-    hash: sha256-sZ1FqWIhQoAxrk5OP7eEDndkuxBWJUNyFfLyacAflhw=
+    hash: sha256-QUDy5Fh/odYdEKJ+PHyvhRrmGdlnyUhcVeT/+hkN0Sk=
     scope: project
   - path: .claude/skills/mandao-constitution/SKILL.md
     harness: claude
@@ -399,7 +399,7 @@ files:
     harness: copilot
     from: command:close
     ownership: owned
-    hash: sha256-Vmqn9ons5ynDCtOHgiNHHqNDHAln8K5KBnKocnf5dUo=
+    hash: sha256-bbTULhF0COpLxIRNCyrieK3gZS34x0pmWoRjdm7OgnA=
     scope: project
   - path: .github/prompts/mandao-constitution.prompt.md
     harness: copilot
diff --git a/core/commands/close.md b/core/commands/close.md
index 84b92cd..240d237 100644
--- a/core/commands/close.md
+++ b/core/commands/close.md
@@ -77,7 +77,9 @@ Then `{{script:status}} {{arg:spec}} closed` must be allowed (the spec is `verif
 `{{script:impacts}} {{arg:spec}}` lists what design.md proposed. Show each change as a diff against
 `{{paths.constitution}}/` (and product context), apply only what the user approves, and add an entry to
 `{{paths.constitution}}/CHANGELOG.md`. Close is the only mandao that writes the constitution after its
-creation.
+creation. Version 2 spec: record each approved edit outside the spec folder (constitution, command content,
+code) with `{{script:close-summary}} {{arg:spec}} --applied <path>` (repeatable), so the close commit stages it
+and, after `mandao sync` and the diagrams, the files regenerated from it.
 
 ## 3. Sync
 
@@ -154,7 +156,7 @@ unapplied and is reported.
 `## Outcome` and `## Delivery`, keeps your prose sections as they are, and upserts the spec's one line in
 `docs/CHANGELOG.md`; never edit the record by hand), set `status: closed` in story.md, then commit everything
 close wrote on its own: `{{script:commit-spec}} {{arg:spec}} close` (the spec folder, `docs/CHANGELOG.md`, `docs/kaizen/lessons.md`
-or, for version 1, `{{paths.releases}}/<ID>/` and `docs/kaizen/<ID>.md`, the constitution and changed module guides; a `docs` commit with `Refs: <ID>`,
+or, for version 1, `{{paths.releases}}/<ID>/` and `docs/kaizen/<ID>.md`, the constitution, changed module guides, the `--applied` paths and the files regenerated from them (lock, command renders, diagram sources); the result's `leftOut` names every other uncommitted file, which stays uncommitted; a `docs` commit with `Refs: <ID>`,
 never pushed). Report: Kaizen headline, impacts applied, drift, where it was published, the commit.
 
 **Worktree** (`worktrees.cleanup` in `.mandao/config.yml`): after the spec's branch is merged, `ask`
diff --git a/docs/diagrams/command-close-dark.svg b/docs/diagrams/command-close-dark.svg
index ac938df..3d0b8e1 100644
--- a/docs/diagrams/command-close-dark.svg
+++ b/docs/diagrams/command-close-dark.svg
@@ -1,5 +1,5 @@
 <?xml version="1.0" encoding="UTF-8"?>
-<!-- mandao:diagram command-close spec-sha256 e10d26704e5ef7dba7cdce6f0d2402a525dbbc68d702d2b80d3a4ebc3d81feb7 — generated by npm run diagrams, do not edit -->
+<!-- mandao:diagram command-close spec-sha256 c8c9c507b239a40082b73288246133c739daa1ce253bc87c8284b0d68238c46c — generated by npm run diagrams, do not edit -->
 <svg viewBox="0 0 1190 652" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 9.040s; width: 1190px; height: 652px; min-width: 0px;" width="1190" height="652" xmlns="http://www.w3.org/2000/svg"><style>
 /*
 JetBrains Mono variable WOFF2 subsets from Google Fonts service revision v24.
@@ -665,8 +665,8 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
 
         <!-- Edge paths -->
         <path data-edge-from="s0" data-edge-to="s1" data-edge-key="0" data-edge-id="s0-s1" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="233,119;307,119" d="M 233 119 L 307 119" class="a-default" data-animate="edge" style="--step: 0;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s1" data-edge-to="s2" data-edge-key="1" data-edge-id="s1-s2" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="471,119;552,119" d="M 471 119 L 552 119" class="a-default" data-animate="edge" style="--step: 1;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s2" data-edge-to="s3" data-edge-key="2" data-edge-id="s2-s3" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="716,119;809.5,119" d="M 716 119 L 809.5 119" class="a-default" data-animate="edge" style="--step: 2;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s1" data-edge-to="s2" data-edge-key="1" data-edge-id="s1-s2" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="471,119;548.5,119" d="M 471 119 L 548.5 119" class="a-default" data-animate="edge" style="--step: 1;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s2" data-edge-to="s3" data-edge-key="2" data-edge-id="s2-s3" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="719.5,119;809.5,119" d="M 719.5 119 L 809.5 119" class="a-default" data-animate="edge" style="--step: 2;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
         <path data-edge-from="s3" data-edge-to="s4" data-edge-key="3" data-edge-id="s3-s4" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="875.5,145;875.5,166;42.5,166;42.5,243;58.5,243" d="M 875.5 145 L 875.5 158 Q 875.5 166 867.5 166 L 50.5 166 Q 42.5 166 42.5 174 L 42.5 235 Q 42.5 243 50.5 243 L 58.5 243" class="a-default" data-animate="edge" style="--step: 7;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
         <path data-edge-from="s4" data-edge-to="s5" data-edge-key="4" data-edge-id="s4-s5" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="250.5,243;282.5,243" d="M 250.5 243 L 282.5 243" class="a-default" data-animate="edge" style="--step: 8;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
         <path data-edge-from="s5" data-edge-to="s6" data-edge-key="5" data-edge-id="s5-s6" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="495.5,243;527.5,243" d="M 495.5 243 L 527.5 243" class="a-default" data-animate="edge" style="--step: 9;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
@@ -698,15 +698,15 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
           <text x="389" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run kaizen +1</text>
         </g>
 
-        <g id="node-s2" data-node-id="s2" data-node-label="2. Constitution and…" tabindex="0" role="button" aria-label="Focus 2. Constitution and…, mandao run impacts, Steps" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run impacts" data-node-context="Steps">
-          <title>2. Constitution and… · mandao run impacts · Steps</title>
-          <rect x="552" y="93" width="164" height="52" rx="8" class="c-mask"/>
-          <rect x="552" y="93" width="164" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 2; --flow-node-name: archify-relay-node-2;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(558 99) scale(0.6875)">
+        <g id="node-s2" data-node-id="s2" data-node-label="2. Constitution and…" tabindex="0" role="button" aria-label="Focus 2. Constitution and…, mandao run impacts +1, Steps" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run impacts +1" data-node-context="Steps">
+          <title>2. Constitution and… · mandao run impacts +1 · Steps</title>
+          <rect x="548.5" y="93" width="171" height="52" rx="8" class="c-mask"/>
+          <rect x="548.5" y="93" width="171" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 2; --flow-node-name: archify-relay-node-2;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(554.5 99) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
-          <text data-node-label="" x="637" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">2. Constitution and…</text>
-          <text x="634" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run impacts</text>
+          <text data-node-label="" x="634" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">2. Constitution and…</text>
+          <text x="634" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run impacts +1</text>
         </g>
 
         <g id="node-s3" data-node-id="s3" data-node-label="3. Sync" tabindex="0" role="button" aria-label="Focus 3. Sync, Steps" aria-pressed="false" data-node-kind="backend" data-node-context="Steps">
diff --git a/docs/diagrams/command-close-light.svg b/docs/diagrams/command-close-light.svg
index 8f9fc13..3da6628 100644
--- a/docs/diagrams/command-close-light.svg
+++ b/docs/diagrams/command-close-light.svg
@@ -1,5 +1,5 @@
 <?xml version="1.0" encoding="UTF-8"?>
-<!-- mandao:diagram command-close spec-sha256 e10d26704e5ef7dba7cdce6f0d2402a525dbbc68d702d2b80d3a4ebc3d81feb7 — generated by npm run diagrams, do not edit -->
+<!-- mandao:diagram command-close spec-sha256 c8c9c507b239a40082b73288246133c739daa1ce253bc87c8284b0d68238c46c — generated by npm run diagrams, do not edit -->
 <svg viewBox="0 0 1190 652" data-layout-contract="readable-v2" role="img" lang="en" aria-labelledby="archify-diagram-title archify-diagram-description" data-animation="trace" data-preset="classic" data-quality-profile="showcase" data-node-ui="" style="--flow-cycle: 9.040s; width: 1190px; height: 652px; min-width: 0px;" width="1190" height="652" xmlns="http://www.w3.org/2000/svg"><style>
 /*
 JetBrains Mono variable WOFF2 subsets from Google Fonts service revision v24.
@@ -665,8 +665,8 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
 
         <!-- Edge paths -->
         <path data-edge-from="s0" data-edge-to="s1" data-edge-key="0" data-edge-id="s0-s1" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="233,119;307,119" d="M 233 119 L 307 119" class="a-default" data-animate="edge" style="--step: 0;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s1" data-edge-to="s2" data-edge-key="1" data-edge-id="s1-s2" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="471,119;552,119" d="M 471 119 L 552 119" class="a-default" data-animate="edge" style="--step: 1;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
-        <path data-edge-from="s2" data-edge-to="s3" data-edge-key="2" data-edge-id="s2-s3" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="716,119;809.5,119" d="M 716 119 L 809.5 119" class="a-default" data-animate="edge" style="--step: 2;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s1" data-edge-to="s2" data-edge-key="1" data-edge-id="s1-s2" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="471,119;548.5,119" d="M 471 119 L 548.5 119" class="a-default" data-animate="edge" style="--step: 1;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
+        <path data-edge-from="s2" data-edge-to="s3" data-edge-key="2" data-edge-id="s2-s3" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="719.5,119;809.5,119" d="M 719.5 119 L 809.5 119" class="a-default" data-animate="edge" style="--step: 2;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
         <path data-edge-from="s3" data-edge-to="s4" data-edge-key="3" data-edge-id="s3-s4" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="875.5,145;875.5,166;42.5,166;42.5,243;58.5,243" d="M 875.5 145 L 875.5 158 Q 875.5 166 867.5 166 L 50.5 166 Q 42.5 166 42.5 174 L 42.5 235 Q 42.5 243 50.5 243 L 58.5 243" class="a-default" data-animate="edge" style="--step: 7;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
         <path data-edge-from="s4" data-edge-to="s5" data-edge-key="4" data-edge-id="s4-s5" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="250.5,243;282.5,243" d="M 250.5 243 L 282.5 243" class="a-default" data-animate="edge" style="--step: 8;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
         <path data-edge-from="s5" data-edge-to="s6" data-edge-key="5" data-edge-id="s5-s6" data-composition-routing="workflow-v2-auto" data-edge-role="" data-composition-points="495.5,243;527.5,243" d="M 495.5 243 L 527.5 243" class="a-default" data-animate="edge" style="--step: 9;" stroke-width="1.4" marker-end="url(#arrowhead)"/>
@@ -698,15 +698,15 @@ svg[data-node-ui][data-preset="editorial"] :is([data-graph-role="structural-fram
           <text x="389" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run kaizen +1</text>
         </g>
 
-        <g id="node-s2" data-node-id="s2" data-node-label="2. Constitution and…" tabindex="0" role="button" aria-label="Focus 2. Constitution and…, mandao run impacts, Steps" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run impacts" data-node-context="Steps">
-          <title>2. Constitution and… · mandao run impacts · Steps</title>
-          <rect x="552" y="93" width="164" height="52" rx="8" class="c-mask"/>
-          <rect x="552" y="93" width="164" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 2; --flow-node-name: archify-relay-node-2;" stroke-width="1.5"/>
-          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(558 99) scale(0.6875)">
+        <g id="node-s2" data-node-id="s2" data-node-label="2. Constitution and…" tabindex="0" role="button" aria-label="Focus 2. Constitution and…, mandao run impacts +1, Steps" aria-pressed="false" data-node-kind="backend" data-node-sublabel="mandao run impacts +1" data-node-context="Steps">
+          <title>2. Constitution and… · mandao run impacts +1 · Steps</title>
+          <rect x="548.5" y="93" width="171" height="52" rx="8" class="c-mask"/>
+          <rect x="548.5" y="93" width="171" height="52" rx="8" class="c-backend" data-animate="node" style="--step: 2; --flow-node-name: archify-relay-node-2;" stroke-width="1.5"/>
+          <g aria-hidden="true" data-semantic-sigil="backend" class="semantic-sigil s-backend" transform="translate(554.5 99) scale(0.6875)">
             <path d="M6 3 3 8l3 5M10 3l3 5-3 5"/>
           </g>
-          <text data-node-label="" x="637" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">2. Constitution and…</text>
-          <text x="634" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run impacts</text>
+          <text data-node-label="" x="634" y="114" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">2. Constitution and…</text>
+          <text x="634" y="131" class="t-muted" font-size="8" text-anchor="middle">mandao run impacts +1</text>
         </g>
 
         <g id="node-s3" data-node-id="s3" data-node-label="3. Sync" tabindex="0" role="button" aria-label="Focus 3. Sync, Steps" aria-pressed="false" data-node-kind="backend" data-node-context="Steps">
diff --git a/docs/diagrams/src/command-clarify.json b/docs/diagrams/src/command-clarify.json
index bdf5059..9f30f9a 100644
--- a/docs/diagrams/src/command-clarify.json
+++ b/docs/diagrams/src/command-clarify.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/command-close.json b/docs/diagrams/src/command-close.json
index 26c8c44..75ced3b 100644
--- a/docs/diagrams/src/command-close.json
+++ b/docs/diagrams/src/command-close.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
@@ -54,7 +54,7 @@
       "sha256": "ca1abdb14e4641315cf3bcc3e80b482b74eb879e9dab96978f1279bfda00ab28"
     }
   ],
-  "specSha256": "e10d26704e5ef7dba7cdce6f0d2402a525dbbc68d702d2b80d3a4ebc3d81feb7",
+  "specSha256": "c8c9c507b239a40082b73288246133c739daa1ce253bc87c8284b0d68238c46c",
   "spec": {
     "schema_version": 2,
     "diagram_type": "workflow",
@@ -132,8 +132,8 @@
         "col": 2,
         "type": "backend",
         "label": "2. Constitution and…",
-        "sublabel": "mandao run impacts",
-        "width": 164
+        "sublabel": "mandao run impacts +1",
+        "width": 171
       },
       {
         "id": "s3",
diff --git a/docs/diagrams/src/command-constitution.json b/docs/diagrams/src/command-constitution.json
index e6d7cd1..5d19367 100644
--- a/docs/diagrams/src/command-constitution.json
+++ b/docs/diagrams/src/command-constitution.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/command-implement.json b/docs/diagrams/src/command-implement.json
index 6fad2c8..9e4c9d3 100644
--- a/docs/diagrams/src/command-implement.json
+++ b/docs/diagrams/src/command-implement.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/command-init.json b/docs/diagrams/src/command-init.json
index c820dd2..8af8ca1 100644
--- a/docs/diagrams/src/command-init.json
+++ b/docs/diagrams/src/command-init.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/command-quick.json b/docs/diagrams/src/command-quick.json
index b4882ed..11fc57e 100644
--- a/docs/diagrams/src/command-quick.json
+++ b/docs/diagrams/src/command-quick.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/command-resume.json b/docs/diagrams/src/command-resume.json
index 2d1c703..4fac0cf 100644
--- a/docs/diagrams/src/command-resume.json
+++ b/docs/diagrams/src/command-resume.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/command-specify.json b/docs/diagrams/src/command-specify.json
index 20fa3e0..e6392ed 100644
--- a/docs/diagrams/src/command-specify.json
+++ b/docs/diagrams/src/command-specify.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/command-story.json b/docs/diagrams/src/command-story.json
index 7db1661..85fb8f0 100644
--- a/docs/diagrams/src/command-story.json
+++ b/docs/diagrams/src/command-story.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/command-tasks.json b/docs/diagrams/src/command-tasks.json
index 76879d1..f56d54f 100644
--- a/docs/diagrams/src/command-tasks.json
+++ b/docs/diagrams/src/command-tasks.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/command-verify.json b/docs/diagrams/src/command-verify.json
index ee95784..7135974 100644
--- a/docs/diagrams/src/command-verify.json
+++ b/docs/diagrams/src/command-verify.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/lifecycle.json b/docs/diagrams/src/lifecycle.json
index b43f638..89e1fb6 100644
--- a/docs/diagrams/src/lifecycle.json
+++ b/docs/diagrams/src/lifecycle.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/overview.json b/docs/diagrams/src/overview.json
index f6c7cb2..d162f14 100644
--- a/docs/diagrams/src/overview.json
+++ b/docs/diagrams/src/overview.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/process-bug.json b/docs/diagrams/src/process-bug.json
index d32e49c..9a10b09 100644
--- a/docs/diagrams/src/process-bug.json
+++ b/docs/diagrams/src/process-bug.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/process-epic.json b/docs/diagrams/src/process-epic.json
index 2a90c2b..415e22c 100644
--- a/docs/diagrams/src/process-epic.json
+++ b/docs/diagrams/src/process-epic.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/process-feature.json b/docs/diagrams/src/process-feature.json
index 5169fb0..aeb0afd 100644
--- a/docs/diagrams/src/process-feature.json
+++ b/docs/diagrams/src/process-feature.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/process-hotfix.json b/docs/diagrams/src/process-hotfix.json
index 5700ddb..5f45811 100644
--- a/docs/diagrams/src/process-hotfix.json
+++ b/docs/diagrams/src/process-hotfix.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/process-maintenance.json b/docs/diagrams/src/process-maintenance.json
index 422b496..670afc6 100644
--- a/docs/diagrams/src/process-maintenance.json
+++ b/docs/diagrams/src/process-maintenance.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/process-quick.json b/docs/diagrams/src/process-quick.json
index ad10c10..d503837 100644
--- a/docs/diagrams/src/process-quick.json
+++ b/docs/diagrams/src/process-quick.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/process-setup.json b/docs/diagrams/src/process-setup.json
index 36a4b48..9485eba 100644
--- a/docs/diagrams/src/process-setup.json
+++ b/docs/diagrams/src/process-setup.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/docs/diagrams/src/task-loop.json b/docs/diagrams/src/task-loop.json
index 7bb1342..de2bfb1 100644
--- a/docs/diagrams/src/task-loop.json
+++ b/docs/diagrams/src/task-loop.json
@@ -11,7 +11,7 @@
     },
     {
       "path": "core/commands/close.md",
-      "sha256": "60e1a9d2c6475fcded35599c773b14d4c71243b5acf652a8ff2b89e8ec496a38"
+      "sha256": "d2a55727ee10630b1570f2b0901adf90d86387ab984418d3c0305adcccd7bb95"
     },
     {
       "path": "core/commands/constitution.md",
diff --git a/src/cli/run-close.ts b/src/cli/run-close.ts
index d82a0b4..7a5f632 100644
--- a/src/cli/run-close.ts
+++ b/src/cli/run-close.ts
@@ -1,5 +1,5 @@
 import { existsSync, readdirSync, readFileSync } from 'node:fs';
-import { join, relative, sep } from 'node:path';
+import { join, relative, resolve, sep } from 'node:path';
 import type { Command } from 'commander';
 import { LOCK_FILE, readConfig, readLock, readModels } from '../engine/files.js';
 import { readRecommendations, resolveWorkspaceModels } from '../models/load.js';
@@ -132,6 +132,7 @@ interface SummaryOptions {
   detectRelease?: boolean;
   env?: string;
   source?: 'ci' | 'tracker';
+  applied?: string[];
 }
 
 /** gitflow: the one release branch that contains every commit of the spec (ADR 0023). */
@@ -153,6 +154,19 @@ function publication(record: string, at: string): CloseSummary['published'][numb
   return { target, kind: kind as 'comment', id, hash, at, ...(url ? { url } : {}) };
 }
 
+/** `--applied <path>`: a file outside the spec folder, inside the repo, that close applied with approval; kept once each. */
+function appliedPaths(spec: SpecFolder, known: string[], given: string[]): string[] {
+  const repo = repoRoot(spec.dir);
+  const added = given.map((p) => {
+    const abs = resolve(repo, p);
+    const inside = (dir: string) => abs === dir || abs.startsWith(`${dir}${sep}`);
+    if (!inside(repo)) throw new Error(`--applied ${p} is outside the repository`);
+    if (inside(spec.dir)) throw new Error(`--applied ${p} is inside the spec folder, which close commits anyway`);
+    return relative(repo, abs).split(sep).join('/');
+  });
+  return [...new Set([...known, ...added])];
+}
+
 function updatedSummary(config: ReturnType<typeof readConfig>, spec: SpecFolder, o: SummaryOptions): CloseSummary {
   let s = summaryOf(spec);
   const now = new Date().toISOString();
@@ -160,6 +174,7 @@ function updatedSummary(config: ReturnType<typeof readConfig>, spec: SpecFolder,
   if (o.release) s = { ...s, release: { branch: o.release, how: 'given' } };
   const release = o.detectRelease ? detectedRelease(config, spec) : undefined;
   if (release) s = { ...s, release };
+  if (o.applied?.length) s = { ...s, applied: appliedPaths(spec, s.applied, o.applied) };
   if (o.published) s = withPublication(s, publication(o.published, now));
   if (o.env) {
     if (!o.source) throw new Error('--env needs --source ci|tracker: an environment is recorded only as CI or the tracker reported it');
@@ -217,6 +232,11 @@ function registerSummary(run: Command, ctx: CliContext) {
     .option('--detect-release', 'gitflow: find the release branch that contains every commit of the spec')
     .option('--env <name>', 'an environment the spec reached')
     .option('--source <source>', 'who reported the environment: ci | tracker')
+    .option(
+      '--applied <path>',
+      'an approved edit outside the spec folder; the close commit stages it (repeatable)',
+      (v, all: string[] = []) => [...all, v],
+    )
     .option('--published <record>', 'after a publication: "<target>|<kind>|<id>|<hash>[|<url>]"')
     .action((ref: string, o: SummaryOptions) => {
       const config = readConfig(ctx.root());
@@ -267,10 +287,15 @@ export function registerClose(run: Command, ctx: CliContext) {
  * Paths that do not count toward a PR's size (ADR 0028, MDO-0004): the spec folders, release docs, Kaizen,
  * diagrams, and every file Mandao generates (from the lock).
  */
-function notCode(root: string, config: ReturnType<typeof readConfig>): (path: string) => boolean {
+function notCode(root: string, config: ReturnType<typeof readConfig>, spec: SpecFolder): (path: string) => boolean {
   const generated = new Set(readLock(join(root, LOCK_FILE))?.files.map((f) => f.path) ?? []);
-  const folders = [config.paths.specs, config.paths.releases, 'docs/kaizen', 'docs/diagrams'].map((d) => `${d.replace(/\/$/, '')}/`);
-  return (path) => generated.has(path) || folders.some((d) => path.startsWith(d));
+  // A version 2 close writes the changelog and lessons, not per-spec release or Kaizen documents (MDO-0011 D5).
+  const v2 = specLogInCache(spec.dir);
+  const folders = [config.paths.specs, ...(v2 ? [] : [config.paths.releases, 'docs/kaizen']), 'docs/diagrams'].map(
+    (d) => `${d.replace(/\/$/, '')}/`,
+  );
+  const files = new Set(v2 ? ['docs/CHANGELOG.md', 'docs/kaizen/lessons.md'] : []);
+  return (path) => generated.has(path) || files.has(path) || folders.some((d) => path.startsWith(d));
 }
 
 function registerPrPlan(run: Command, ctx: CliContext) {
@@ -283,7 +308,7 @@ function registerPrPlan(run: Command, ctx: CliContext) {
       if (!spec.story) throw new Error(`${spec.name} needs story.md`);
       const repo = repoRoot(spec.dir);
       const byTask = taskCommits(repo, spec.story.meta.id, config.commits.trailers);
-      const skip = notCode(ctx.root(), config);
+      const skip = notCode(ctx.root(), config, spec);
       const sizes = new Map(spec.tasks.map((t) => [t.id, commitsSize(repo, byTask.get(t.id) ?? [], skip)]));
       const limits = sizeLimits(config.size_limits).pr;
       json(prPlan({ tasks: spec.tasks, waves: planTasks(spec.tasks).waves, sizes, limits, polyrepo: config.workspace === 'polyrepo' }));
diff --git a/src/cli/run-ledger.ts b/src/cli/run-ledger.ts
index f38e5ce..148eaed 100644
--- a/src/cli/run-ledger.ts
+++ b/src/cli/run-ledger.ts
@@ -1,6 +1,7 @@
+import { existsSync, readFileSync } from 'node:fs';
 import { join, relative } from 'node:path';
 import type { Command } from 'commander';
-import { readConfig } from '../engine/files.js';
+import { LOCK_FILE, readConfig, readLock } from '../engine/files.js';
 import { readRecommendations, resolveWorkspaceModels } from '../models/load.js';
 import type { HarnessId } from '../schemas/index.js';
 import { branchingFor } from '../scripts/branching.js';
@@ -9,7 +10,8 @@ import { changedFiles, commitPending, commitSpecDocs, repoRoot } from '../script
 import { agentIdentity, identityCell, identityNotes } from '../scripts/identity.js';
 import { changedRedTests } from '../scripts/red.js';
 import { findSpec, readSpec, type SpecFolder } from '../scripts/spec.js';
-import { type ExecutionRow, NOTE_FLAGS, type Progress, taskAttempt, VERDICTS } from '../spec/index.js';
+import { specLogInCache } from '../scripts/spec-log.js';
+import { type ExecutionRow, NOTE_FLAGS, type Progress, parseCloseSummary, taskAttempt, VERDICTS } from '../spec/index.js';
 import { checkPendingSubject, checkReview, recordLogEdits, requireRedFirst } from './checkpoint-guards.js';
 import type { CliContext } from './context.js';
 import { json } from './json.js';
@@ -217,11 +219,45 @@ export const SPEC_STEPS = {
   close: (id: string) => `close ${id} with release docs and Kaizen`,
 } as const;
 
-/** What close writes besides the spec folder: release docs, Kaizen, constitution and module guides. */
-function closePaths(ctx: CliContext, config: ReturnType<typeof readConfig>, repo: string, id: string): string[] {
+/** The paths a close recorded as applied; a summary without a readable record has none. */
+function appliedOf(text: string | undefined, spec: string): string[] {
+  try {
+    // An unreadable record (no frontmatter) must not block the commit: it just records nothing applied.
+    return parseCloseSummary(text, spec).applied;
+  } catch {
+    return [];
+  }
+}
+
+/** Changed files `sync` or the diagram build regenerated: the lock's files and the lock, command pages and diagram sources. */
+function regenerated(root: string, repo: string, changed: string[]): string[] {
+  const rel = (p: string) => relative(repo, join(root, p)).replace(/\\/g, '/');
+  const locked = new Set((readLock(join(root, LOCK_FILE))?.files ?? []).map((f) => rel(f.path)));
+  const derived = (f: string) => f.startsWith(`${rel('docs/commands')}/`) || f.startsWith(`${rel('docs/diagrams')}/`);
+  return changed.filter((f) => locked.has(f) || derived(f) || f === rel(LOCK_FILE));
+}
+
+/**
+ * What close writes besides the spec folder. Version 1: release docs, Kaizen, constitution and module guides.
+ * Version 2 (MDO-0011 D6): the changelog and lessons, constitution, guides, the paths close recorded as applied, and what was regenerated.
+ */
+function closePaths(ctx: CliContext, config: ReturnType<typeof readConfig>, repo: string, spec: SpecFolder): string[] {
+  const id = spec.story?.meta.id ?? spec.name;
   const rel = (p: string) => relative(repo, join(ctx.root(), p)).replace(/\\/g, '/');
-  const guides = changedFiles(repo).filter((f) => /(^|\/)(AGENTS|CLAUDE)\.md$/.test(f));
-  return [rel(join(config.paths.releases, id)), rel(join('docs', 'kaizen', `${id}.md`)), rel(config.paths.constitution), ...guides];
+  const changed = changedFiles(repo);
+  const guides = changed.filter((f) => /(^|\/)(AGENTS|CLAUDE)\.md$/.test(f));
+  if (!specLogInCache(spec.dir)) {
+    return [rel(join(config.paths.releases, id)), rel(join('docs', 'kaizen', `${id}.md`)), rel(config.paths.constitution), ...guides];
+  }
+  const summary = join(spec.dir, 'close-summary.md');
+  const applied = appliedOf(existsSync(summary) ? readFileSync(summary, 'utf8') : undefined, spec.name);
+  const fixed = [rel('docs/CHANGELOG.md'), rel('docs/kaizen/lessons.md'), rel(config.paths.constitution)];
+  return [
+    ...fixed,
+    ...guides,
+    ...applied.map((p) => relative(repo, join(repo, p)).replace(/\\/g, '/')),
+    ...regenerated(ctx.root(), repo, changed),
+  ];
 }
 
 /** `mandao run commit-spec`: the spec documents in their own docs commit, at every step that writes them. */
@@ -245,7 +281,7 @@ function registerCommitSpec(run: Command, ctx: CliContext) {
         config,
         trailers: opts.trailer ?? [],
         protectedBranches: branchingFor(config).protected,
-        ...(step === 'close' ? { extraPaths: closePaths(ctx, config, repo, id) } : {}),
+        ...(step === 'close' ? { extraPaths: closePaths(ctx, config, repo, spec) } : {}),
       });
       json({ ...result, header });
       if (!result.committed && result.reason !== 'nothing to commit in the spec folder') process.exitCode = 1;
diff --git a/src/scripts/commits.ts b/src/scripts/commits.ts
index 8e120a5..2bf2e5d 100644
--- a/src/scripts/commits.ts
+++ b/src/scripts/commits.ts
@@ -168,6 +168,8 @@ export interface SpecCommit {
   committed: boolean;
   sha?: string;
   reason?: string;
+  /** Uncommitted files this commit did not take, so a close can name what it left out. */
+  leftOut?: string[];
 }
 
 /**
@@ -199,5 +201,5 @@ export function commitSpecDocs(input: {
   } catch (e) {
     return { committed: false, reason: String((e as { stderr?: string }).stderr || (e as Error).message).trim() };
   }
-  return { committed: true, sha: git(input.repo, ['rev-parse', '--short', 'HEAD']).trim() };
+  return { committed: true, sha: git(input.repo, ['rev-parse', '--short', 'HEAD']).trim(), leftOut: changedFiles(input.repo) };
 }
diff --git a/test/integration/mdo-0005-defects.test.ts b/test/integration/mdo-0005-defects.test.ts
index 98a6bb8..bde824c 100644
--- a/test/integration/mdo-0005-defects.test.ts
+++ b/test/integration/mdo-0005-defects.test.ts
@@ -285,7 +285,40 @@ describe('#3: a FAIL keeps its reason', () => {
 });
 
 describe('#4 and #6: commit-spec has fixed subjects, and close commits its documents', () => {
-  test('close commits release docs, Kaizen, constitution and changed module guides with the spec; nothing else', async () => {
+  test('close of a version 2 spec commits the changelog and lessons, not per-spec release or Kaizen documents', async () => {
+    const root = repo();
+    const story = join(root, SPEC, 'story.md');
+    writeFileSync(story, readFileSync(story, 'utf8').replace(/^schema_version: 1$/m, 'schema_version: 2'));
+    for (const [f, c] of Object.entries({
+      'docs/CHANGELOG.md': '| MDO-0001 | line |\n',
+      'docs/kaizen/lessons.md': '- a lesson\n',
+      'docs/releases/MDO-0001/release-notes.md': 'notes\n',
+      'docs/kaizen/MDO-0001.md': 'kaizen\n',
+      'docs/constitution/CHANGELOG.md': 'entry\n',
+      'src/AGENTS.md': 'guide\n',
+      'src/unrelated.ts': 'export {};\n',
+    })) {
+      mkdirSync(dirname(join(root, f)), { recursive: true });
+      writeFileSync(join(root, f), c);
+    }
+    writeFileSync(join(root, SPEC, 'close-summary.md'), 'closed\n');
+    await run(root, 'commit-spec', 'MDO-0001', 'close');
+    expect(git(root, 'show', '--name-only', '--format=', 'HEAD').split('\n').sort()).toEqual(
+      [
+        'docs/CHANGELOG.md',
+        'docs/constitution/CHANGELOG.md',
+        'docs/kaizen/lessons.md',
+        `${SPEC}/close-summary.md`,
+        `${SPEC}/story.md`,
+        'src/AGENTS.md',
+      ].sort(),
+    );
+    expect(lastJson().leftOut).toEqual(
+      expect.arrayContaining(['docs/kaizen/MDO-0001.md', 'docs/releases/MDO-0001/release-notes.md', 'src/unrelated.ts']),
+    );
+  });
+
+  test('close commits release docs, Kaizen, constitution and changed module guides with the spec; nothing else (version 1)', async () => {
     const root = repo();
     for (const [f, c] of Object.entries({
       'docs/releases/MDO-0001/release-notes.md': 'notes\n',

--- /dev/null
+++ b/test/integration/close-commit.test.ts (new file)
// mandao-scans: none — builds a temporary version 2 repo and closes its spec.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { syncProject } from '../../src/engine/sync.js';
import { git, lastOut, repo, run, SPEC, useLogEnv } from '../log-v2-helpers.js';

useLogEnv();

/** The override that makes `sync` render the changed command here; in the real repo the edit to core/ does it. */
const OVERRIDE = '.mandao/overrides/commands/tasks.patch.yml';
const put = (root: string, file: string, text: string) => {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), text);
};

/** Derived docs a project's diagram build leaves; real `sync` does not lock them, so neither does this fixture. */
const REGENERATED = ['docs/commands/tasks.md', 'docs/diagrams/MDO-0001/tasks.mmd', 'docs/diagrams/src/command-tasks.json'];

/**
 * A version 2 spec whose close applied an approved edit to `core/commands/tasks.md`, ran `mandao sync`
 * (an override changes the rendered command) and rebuilt the derived docs, with `src/cli/start.ts` changed on the side.
 */
async function closedSpec() {
  const root = repo(2);
  put(root, 'src/cli/start.ts', 'export const start = 1;\n');
  put(root, 'core/commands/tasks.md', '---\nid: tasks\n---\nold\n');
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'more base');

  put(root, 'core/commands/tasks.md', '---\nid: tasks\n---\nnew, approved by the person\n');
  put(root, OVERRIDE, 'description: "Break an approved spec into tasks, regenerated."\n');
  syncProject(root);
  for (const f of REGENERATED) put(root, f, `${f} regenerated\n`);

  put(root, 'docs/kaizen/lessons.md', '- MDO-0001: a lesson the person approved\n');
  await run(root, 'close-summary', 'MDO-0001', '--closed', '--applied', 'core/commands/tasks.md', '--applied', OVERRIDE);
  put(root, 'src/cli/start.ts', 'export const start = 2; // not recorded by close\n');
  return root;
}
const committed = (root: string) => git(root, 'show', '--name-only', '--format=', 'HEAD').split('\n').filter(Boolean);

describe('close commits what it applied and what was regenerated from it', () => {
  test('S-5.1: one commit holds the spec, the changelog line, the applied edit, the regenerated files and the lock', async () => {
    const root = await closedSpec();
    expect(readFileSync(join(root, SPEC, 'close-summary.md'), 'utf8')).toContain('core/commands/tasks.md');
    const before = git(root, 'rev-list', '--count', 'HEAD');
    await run(root, 'commit-spec', 'MDO-0001', 'close');
    expect(git(root, 'rev-list', '--count', 'HEAD')).toBe(String(Number(before) + 1));
    const files = committed(root);
    expect(files).toEqual(
      expect.arrayContaining([
        `${SPEC}/close-summary.md`,
        'docs/CHANGELOG.md',
        'docs/kaizen/lessons.md',
        'core/commands/tasks.md',
        '.claude/skills/mandao-tasks/SKILL.md',
        '.mandao/mandao.lock',
        ...REGENERATED,
      ]),
    );
    expect(files).not.toContain('src/cli/start.ts');
  });

  test('S-5.2: an unrecorded change to src/cli/start.ts is not committed', async () => {
    const root = await closedSpec();
    await run(root, 'commit-spec', 'MDO-0001', 'close');
    expect(committed(root)).not.toContain('src/cli/start.ts');
    expect(git(root, 'status', '--porcelain')).toBe('M src/cli/start.ts');
  });

  test('S-5.2/C1: the result names the file it left out', async () => {
    const root = await closedSpec();
    await run(root, 'commit-spec', 'MDO-0001', 'close');
    const result = lastOut();
    expect(result.committed).toBe(true);
    expect(result.leftOut).toEqual(['src/cli/start.ts']);
  });
});

```
