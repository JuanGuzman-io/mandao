# Review pack — T3, attempt 1

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T3-1.md`.

## Brief

```json
{
  "spec": "MDO-0011-one-fixed-layout-for-every-spec-folder",
  "task": {
    "project": "mandao",
    "kind": "feat",
    "tier": "strong",
    "files": [
      "src/spec/state.ts",
      "src/spec/progress.ts",
      "src/spec/approvals.ts",
      "src/spec/costs.ts",
      "src/spec/timeline.ts",
      "src/scripts/spec-log.ts",
      "src/scripts/spec.ts",
      "src/scripts/checkpoint.ts",
      "src/scripts/session-cut.ts",
      "src/scripts/session-turns.ts",
      "src/cli/start.ts",
      "src/cli/approve.ts",
      "src/cli/run-ledger.ts",
      "src/cli/run-red.ts",
      "src/cli/run-spec.ts",
      "src/cli/run-leader.ts",
      "src/cli/run-cost.ts",
      "test/unit/state.test.ts",
      "test/integration/state-log.test.ts"
    ],
    "exemplar": "src/spec/approvals.ts",
    "ac": [
      "AC-3",
      "AC-3/C2",
      "AC-3/C3"
    ],
    "scenarios": [
      "S-3.5",
      "S-3.5/C1"
    ],
    "test_levels": {
      "S-3.5": "e2e",
      "S-3.5/C1": "e2e"
    },
    "evidence": "tdd",
    "risk_tags": [
      "public-api"
    ],
    "depends_on": [
      "T1"
    ],
    "parallel_safe": false,
    "verify": "npx vitest run test/unit/state.test.ts test/integration/state-log.test.ts test/integration/approve.test.ts test/integration/costs.test.ts test/unit/next.test.ts",
    "tests": {
      "unit": [],
      "e2e": [
        "S-3.5",
        "S-3.5/C1"
      ]
    },
    "dod": [],
    "characterization": false,
    "id": "T3",
    "title": "One state file holds the start, progress, approvals and cut estimates",
    "done": false,
    "line": 110
  },
  "acceptance": [
    {
      "ref": "AC-3",
      "text": "**GIVEN** a spec whose tasks went through several attempts, gates, reviews and premises · **WHEN** its log is committed · **THEN** it holds only the six fixed files, and their number does not grow with attempts · **AND IT MUST** keep the full gate output, Reviewer packs, probes and integrity data in the spec's local cache, outside git · **AND IT MUST** keep resume, trace, verify, Kaizen and the integrity check working on it · **BUT it must NOT** lose a verdict, a failing gate's relevant output, an approval or a premise result from the committed log"
    },
    {
      "ref": "AC-3/C2",
      "text": "**AND IT MUST** keep resume, trace, verify, Kaizen and the integrity check working on it"
    },
    {
      "ref": "AC-3/C3",
      "text": "**BUT it must NOT** lose a verdict, a failing gate's relevant output, an approval or a premise result from the committed log"
    }
  ],
  "scenarios": [
    {
      "ref": "S-3.5",
      "text": "**Given** a spec with approvals in `state.yml` and events in `execution.md` · **When** `mandao run status <ID>`, without a target status, or `implement-summary` runs · **Then** the timeline shows the approvals in date order among the execution rows · **BUT it must NOT** write an approval row into `execution.md`"
    },
    {
      "ref": "S-3.5/C1",
      "text": "**BUT it must NOT** write an approval row into `execution.md`"
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
  "lenses": [
    "security"
  ],
  "loop": {
    "task": "T3",
    "tier": "strong",
    "attempt": 1,
    "failsAtTier": 0,
    "tdd": {
      "required": true,
      "testsBy": "tester",
      "red": true,
      "evidence": "red"
    },
    "implementer": {
      "model": "claude-opus-5-5"
    },
    "reviewer": {
      "role": "reviewer",
      "model": "claude-opus-5-5"
    },
    "notes": [
      "reduced independence"
    ],
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
      "src/spec/state.ts",
      "src/spec/progress.ts",
      "src/spec/approvals.ts",
      "src/spec/costs.ts",
      "src/spec/timeline.ts",
      "src/scripts/spec-log.ts",
      "src/scripts/spec.ts",
      "src/scripts/checkpoint.ts",
      "src/scripts/session-cut.ts",
      "src/scripts/session-turns.ts",
      "src/cli/start.ts",
      "src/cli/approve.ts",
      "src/cli/run-ledger.ts",
      "src/cli/run-red.ts",
      "src/cli/run-spec.ts",
      "src/cli/run-leader.ts",
      "src/cli/run-cost.ts",
      "test/unit/state.test.ts",
      "test/integration/state-log.test.ts",
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
    "commandForBudget": "npx vitest related src/spec/state.ts src/spec/progress.ts src/spec/approvals.ts src/spec/costs.ts src/spec/timeline.ts src/scripts/spec-log.ts src/scripts/spec.ts src/scripts/checkpoint.ts src/scripts/session-cut.ts src/scripts/session-turns.ts src/cli/start.ts src/cli/approve.ts src/cli/run-ledger.ts src/cli/run-red.ts src/cli/run-spec.ts src/cli/run-leader.ts src/cli/run-cost.ts test/unit/state.test.ts test/integration/state-log.test.ts test/integration/approve.test.ts test/integration/branching.test.ts test/integration/characterization.test.ts test/integration/cli.test.ts test/integration/close.test.ts test/integration/costs.test.ts test/integration/doctor-cli.test.ts test/integration/enforced-rules.test.ts test/integration/engine.test.ts test/integration/layout.test.ts test/integration/leader-scripts.test.ts test/integration/ledger.test.ts test/integration/lite-spec.test.ts test/integration/mdo-0004-defects.test.ts test/integration/mdo-0005-defects.test.ts test/integration/mdo-0006-defects.test.ts test/integration/premise.test.ts test/integration/review.test.ts test/integration/scripts.test.ts test/integration/shadow.test.ts test/integration/spec-log.test.ts test/integration/start.test.ts test/integration/tdd.test.ts test/integration/where.test.ts test/unit/commits-times.test.ts test/unit/diagram.test.ts test/unit/doctor-cache.test.ts test/unit/doctor-report.test.ts test/unit/kaizen-sessions.test.ts test/unit/kaizen.test.ts test/unit/layout.test.ts test/unit/next.test.ts test/unit/pr-plan.test.ts test/unit/release.test.ts test/unit/render.test.ts test/unit/session-advice.test.ts test/unit/session-cut.test.ts test/unit/session-turns.test.ts test/unit/spec.test.ts test/unit/task-index.test.ts test/unit/verify.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": [
      "src/cli/checkpoint-guards.ts",
      "src/cli/program.ts",
      "src/cli/run-close.ts",
      "src/cli/run-diagram.ts",
      "src/cli/run-mutation.ts",
      "src/cli/run-premise.ts",
      "src/cli/run-review.ts",
      "src/cli/run-verify.ts",
      "src/cli/run.ts",
      "src/cli/session-advice.ts",
      "src/cli/spec-context.ts",
      "src/cli/worktree.ts",
      "src/engine/doctor-specs.ts",
      "src/scripts/brief.ts",
      "src/scripts/commits.ts",
      "src/scripts/forced.ts",
      "src/scripts/red.ts",
      "src/scripts/spend.ts",
      "src/spec/index.ts",
      "src/spec/kaizen-costs.ts",
      "src/spec/kaizen-sessions.ts",
      "src/spec/next.ts",
      "src/spec/verify.ts",
      "test/integration/approve.test.ts",
      "test/integration/branching.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/enforced-rules.test.ts",
      "test/integration/leader-scripts.test.ts",
      "test/integration/ledger.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/scripts.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/start.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/kaizen-sessions.test.ts",
      "test/unit/layout.test.ts",
      "test/unit/next.test.ts",
      "test/unit/session-advice.test.ts",
      "test/unit/session-cut.test.ts",
      "test/unit/session-turns.test.ts",
      "test/unit/spec.test.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/unit/state.test.ts",
      "test/integration/state-log.test.ts"
    ],
    "changed": [
      "test/integration/state-log.test.ts"
    ]
  }
}
```

## Gates — T3, attempt 1

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
index bc5ec97..bea5abd 100644
--- a/.agents/skills/mandao-specify/SKILL.md
+++ b/.agents/skills/mandao-specify/SKILL.md
@@ -27,7 +27,7 @@ in the output which skill was missing.
 ## 1. Resolve the spec
 
 1. **From `mandao start`** (the default): the session runs in the spec's worktree and
-   `specs/<ID>-<slug>/_log/start.yml` holds the request (id, title, type, lane). Use it; the
+   the `start` section of `specs/<ID>-<slug>/_log/state.yml` holds the request (id, title, type, lane). Use it; the
    branch and worktree already exist and are set up, so skip the worktree step below.
 2. **From a story**: if `<ref>` names a folder in `specs/` with `story.md`, inherit its
    frontmatter (tracker, type, id, projects). Ask nothing.
diff --git a/.claude/skills/mandao-specify/SKILL.md b/.claude/skills/mandao-specify/SKILL.md
index bdd40b6..458ab16 100644
--- a/.claude/skills/mandao-specify/SKILL.md
+++ b/.claude/skills/mandao-specify/SKILL.md
@@ -34,7 +34,7 @@ in the output which skill was missing.
 ## 1. Resolve the spec
 
 1. **From `mandao start`** (the default): the session runs in the spec's worktree and
-   `specs/<ID>-<slug>/_log/start.yml` holds the request (id, title, type, lane). Use it; the
+   the `start` section of `specs/<ID>-<slug>/_log/state.yml` holds the request (id, title, type, lane). Use it; the
    branch and worktree already exist and are set up, so skip the worktree step below.
 2. **From a story**: if `$ref` names a folder in `specs/` with `story.md`, inherit its
    frontmatter (tracker, type, id, projects). Ask nothing.
diff --git a/.github/prompts/mandao-specify.prompt.md b/.github/prompts/mandao-specify.prompt.md
index 2a2cc1b..720bd9c 100644
--- a/.github/prompts/mandao-specify.prompt.md
+++ b/.github/prompts/mandao-specify.prompt.md
@@ -34,7 +34,7 @@ in the output which skill was missing.
 ## 1. Resolve the spec
 
 1. **From `mandao start`** (the default): the session runs in the spec's worktree and
-   `specs/<ID>-<slug>/_log/start.yml` holds the request (id, title, type, lane). Use it; the
+   the `start` section of `specs/<ID>-<slug>/_log/state.yml` holds the request (id, title, type, lane). Use it; the
    branch and worktree already exist and are set up, so skip the worktree step below.
 2. **From a story**: if `${input:ref:Spec folder, tracker id (PROJ-123) or item URL; empty to choose}` names a folder in `specs/` with `story.md`, inherit its
    frontmatter (tracker, type, id, projects). Ask nothing.
diff --git a/.mandao/mandao.lock b/.mandao/mandao.lock
index edf71cf..1b79935 100644
--- a/.mandao/mandao.lock
+++ b/.mandao/mandao.lock
@@ -141,7 +141,7 @@ files:
     harness: codex
     from: command:specify
     ownership: owned
-    hash: sha256-/ge7LousgjPGwQZC8fm0HQq7ArUDXf3gEoodMwWYeTY=
+    hash: sha256-Kgao9CfUfieyCcKOV37V6+V2SFKabPz39t80HX7tSA8=
     scope: project
   - path: .agents/skills/mandao-story/agents/openai.yaml
     harness: codex
@@ -273,7 +273,7 @@ files:
     harness: claude
     from: command:specify
     ownership: owned
-    hash: sha256-Dqo7eEZTo/lXHCB2rjb5mpew5QrMC7GHsN+lAf5Cmdg=
+    hash: sha256-hQiF6ZZKBQ5zJEwiANg/+PA8/FBHKsE7eEmVqz/0Esk=
     scope: project
   - path: .claude/skills/mandao-story/SKILL.md
     harness: claude
@@ -441,7 +441,7 @@ files:
     harness: copilot
     from: command:specify
     ownership: owned
-    hash: sha256-2CDCZRZ5tbyEOoAQQpdVgrwreOn2BcmeRnmmIfh6p1M=
+    hash: sha256-XUz1VXmIlgRdKLViL2/TFltZ5qzpCoBLHuMdg5Da++Q=
     scope: project
   - path: .github/prompts/mandao-story.prompt.md
     harness: copilot
diff --git a/core/commands/specify.md b/core/commands/specify.md
index 3af51e2..37774ae 100644
--- a/core/commands/specify.md
+++ b/core/commands/specify.md
@@ -74,7 +74,7 @@ in the output which skill was missing.
 ## 1. Resolve the spec
 
 1. **From `mandao start`** (the default): the session runs in the spec's worktree and
-   `{{paths.specs}}/<ID>-<slug>/_log/start.yml` holds the request (id, title, type, lane). Use it; the
+   the `start` section of `{{paths.specs}}/<ID>-<slug>/_log/state.yml` holds the request (id, title, type, lane). Use it; the
    branch and worktree already exist and are set up, so skip the worktree step below.
 2. **From a story**: if `{{arg:ref}}` names a folder in `{{paths.specs}}/` with `story.md`, inherit its
    frontmatter (tracker, type, id, projects). Ask nothing.
diff --git a/docs/cli.md b/docs/cli.md
index d03091f..b6dee07 100644
--- a/docs/cli.md
+++ b/docs/cli.md
@@ -18,6 +18,7 @@
 | `mandao approve <spec> <step>` | Approve a step from the terminal, without a model session: `story`, `design`, `spec`, `tasks`, `close` (`--items`), `budget` (`--to <usd\|none>`) |
 | `mandao run cost <spec>` | Spend per command and role, with its basis (billed or subscription equivalent); see [Cost](#cost) |
 | `mandao run layout <spec>` | Compare the spec folder with the layout of its version and depth ([spec anatomy](spec-anatomy.md)): prints `{ version, depth, stage, missing, unexpected, ok }` and exits 1 when `ok` is false. `run status <spec> closed` refuses a folder that does not match, naming these findings |
+| `mandao run status <spec>` | Without a target status: the spec's status and its `timeline`, the approvals merged by date among the execution rows. Read only: an approval never becomes an `execution.md` row. `run implement-summary` prints the same `timeline` |
 | `mandao run …` | Helper scripts the commands call, with compact JSON on stdout (`MANDAO_JSON=pretty` for people). `mandao run --help` lists them all: planning (`spec-new`, `trace`, `tasks`, `brief`), the Leader loop (`step`, `checkpoint`, `gates`, `review-pack`, `review`, `red`, `mutation`, `commit`, `implement-summary`), verify and close (`verify-plan`, `kaizen`, `impacts`, `publish-plan`, `pr-plan`), and tests under the resource budget (`impact`, `tests`, `build`, `resources`) |
 
 ## Entering the spec worktree
diff --git a/docs/diagrams/src/command-clarify.json b/docs/diagrams/src/command-clarify.json
index af1438c..6e43647 100644
--- a/docs/diagrams/src/command-clarify.json
+++ b/docs/diagrams/src/command-clarify.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/command-close.json b/docs/diagrams/src/command-close.json
index 49ac141..a01699f 100644
--- a/docs/diagrams/src/command-close.json
+++ b/docs/diagrams/src/command-close.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/command-constitution.json b/docs/diagrams/src/command-constitution.json
index ca42537..89d4c2b 100644
--- a/docs/diagrams/src/command-constitution.json
+++ b/docs/diagrams/src/command-constitution.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/command-implement.json b/docs/diagrams/src/command-implement.json
index 4ff3070..7754efc 100644
--- a/docs/diagrams/src/command-implement.json
+++ b/docs/diagrams/src/command-implement.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/command-init.json b/docs/diagrams/src/command-init.json
index b4f6138..87f1b45 100644
--- a/docs/diagrams/src/command-init.json
+++ b/docs/diagrams/src/command-init.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/command-quick.json b/docs/diagrams/src/command-quick.json
index 159e185..319e390 100644
--- a/docs/diagrams/src/command-quick.json
+++ b/docs/diagrams/src/command-quick.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/command-resume.json b/docs/diagrams/src/command-resume.json
index d535b4b..b9a72c9 100644
--- a/docs/diagrams/src/command-resume.json
+++ b/docs/diagrams/src/command-resume.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/command-specify.json b/docs/diagrams/src/command-specify.json
index 387b364..eaeaec7 100644
--- a/docs/diagrams/src/command-specify.json
+++ b/docs/diagrams/src/command-specify.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/command-story.json b/docs/diagrams/src/command-story.json
index d5d4d3d..8d19085 100644
--- a/docs/diagrams/src/command-story.json
+++ b/docs/diagrams/src/command-story.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/command-tasks.json b/docs/diagrams/src/command-tasks.json
index 9e759fe..3b45fd3 100644
--- a/docs/diagrams/src/command-tasks.json
+++ b/docs/diagrams/src/command-tasks.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/command-verify.json b/docs/diagrams/src/command-verify.json
index 57e458f..475f811 100644
--- a/docs/diagrams/src/command-verify.json
+++ b/docs/diagrams/src/command-verify.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/lifecycle.json b/docs/diagrams/src/lifecycle.json
index 1055bfa..9b56e09 100644
--- a/docs/diagrams/src/lifecycle.json
+++ b/docs/diagrams/src/lifecycle.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
@@ -55,7 +55,7 @@
     },
     {
       "path": "src/cli/approve.ts",
-      "sha256": "e3d63892ed4fd75061edfc01443fc90f19e365c80f0fb4d92e938034a32ea90e"
+      "sha256": "c9bd78e247b92b8db1bcddb76b7e227cf86857e22194ee8efa744f796d05a56b"
     },
     {
       "path": "src/schemas/common.ts",
@@ -63,7 +63,7 @@
     },
     {
       "path": "src/scripts/spec.ts",
-      "sha256": "bd767b7458de40f8d58fbd478cec25a93afd5cf911e213592c37fd72a692e083"
+      "sha256": "c11e8d2bdc53958a7e32675ff748b34dc9a5ceb22bc8375b327fc0f0120a3396"
     }
   ],
   "specSha256": "0205591777369dc1d74376fb27b2c1ac32c7ac384ca7095cdbeb1a9045f3d949",
diff --git a/docs/diagrams/src/overview.json b/docs/diagrams/src/overview.json
index be2d5be..7af9115 100644
--- a/docs/diagrams/src/overview.json
+++ b/docs/diagrams/src/overview.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
@@ -55,7 +55,7 @@
     },
     {
       "path": "src/cli/start.ts",
-      "sha256": "a6564bf466d35966eec048d5281de23ffab3a168690fb35d86823ca2cafe6877"
+      "sha256": "41b207f36645f485afc96f7b94d79a484f6379ee70685610685ad2b393dbb1c4"
     },
     {
       "path": "src/spec/next.ts",
diff --git a/docs/diagrams/src/process-bug.json b/docs/diagrams/src/process-bug.json
index a7ee91a..18d3025 100644
--- a/docs/diagrams/src/process-bug.json
+++ b/docs/diagrams/src/process-bug.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/process-epic.json b/docs/diagrams/src/process-epic.json
index 0e14f7c..73781d5 100644
--- a/docs/diagrams/src/process-epic.json
+++ b/docs/diagrams/src/process-epic.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/process-feature.json b/docs/diagrams/src/process-feature.json
index 22afda1..579e4af 100644
--- a/docs/diagrams/src/process-feature.json
+++ b/docs/diagrams/src/process-feature.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/process-hotfix.json b/docs/diagrams/src/process-hotfix.json
index ce7be44..03f4c7f 100644
--- a/docs/diagrams/src/process-hotfix.json
+++ b/docs/diagrams/src/process-hotfix.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/process-maintenance.json b/docs/diagrams/src/process-maintenance.json
index d4066b2..5b729cb 100644
--- a/docs/diagrams/src/process-maintenance.json
+++ b/docs/diagrams/src/process-maintenance.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/process-quick.json b/docs/diagrams/src/process-quick.json
index 86f23b8..9023485 100644
--- a/docs/diagrams/src/process-quick.json
+++ b/docs/diagrams/src/process-quick.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/process-setup.json b/docs/diagrams/src/process-setup.json
index 306ace8..af94223 100644
--- a/docs/diagrams/src/process-setup.json
+++ b/docs/diagrams/src/process-setup.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/docs/diagrams/src/task-loop.json b/docs/diagrams/src/task-loop.json
index 2fd7c44..482f589 100644
--- a/docs/diagrams/src/task-loop.json
+++ b/docs/diagrams/src/task-loop.json
@@ -39,7 +39,7 @@
     },
     {
       "path": "core/commands/specify.md",
-      "sha256": "326bc259f8985b4545fef103e77fcb5f822569af5aa1ad57f8a673071f0713c8"
+      "sha256": "c110bb915d420834b215d56977c12a861f5a482a5edc26c24d14b176aaffd235"
     },
     {
       "path": "core/commands/story.md",
diff --git a/src/cli/approve.ts b/src/cli/approve.ts
index 97eacd5..31b78c3 100644
--- a/src/cli/approve.ts
+++ b/src/cli/approve.ts
@@ -6,7 +6,7 @@ import { readConfig } from '../engine/files.js';
 import { branchingFor } from '../scripts/branching.js';
 import { commitSpecDocs, commitState, repoRoot } from '../scripts/commits.js';
 import { expectedPlace, findSpec, readSpec, type SpecFolder } from '../scripts/spec.js';
-import { docPath, LITE_DOC, logPath } from '../scripts/spec-log.js';
+import { appendApprovalLog, docPath, LITE_DOC, readApprovalLog } from '../scripts/spec-log.js';
 import {
   APPROVAL_STEPS,
   type Approval,
@@ -17,9 +17,7 @@ import {
   type NextFacts,
   nextStep,
   openItems,
-  parseApprovals,
   planTasks,
-  renderApprovals,
   taskLayoutIssues,
   withStatus,
 } from '../spec/index.js';
@@ -115,15 +113,12 @@ export function currentHashes(dir: string, only?: string[]): Record<string, stri
   return Object.fromEntries(files.map((f) => [f, docHash(readFileSync(join(dir, f), 'utf8'))]));
 }
 
-const readApprovals = (spec: SpecFolder) => {
-  const log = logPath(spec.dir, 'approvals.yml');
-  return parseApprovals(existsSync(log) ? readFileSync(log, 'utf8') : undefined);
-};
+const readApprovals = (spec: SpecFolder) => readApprovalLog(spec.dir);
 
-/** Appends a row to `_log/approvals.yml`, never rewriting the earlier ones, and returns it. */
+/** Appends a row to the approvals (state.yml in version 2, approvals.yml in version 1), never rewriting the earlier ones, and returns it. */
 function appendApproval(spec: SpecFolder, row: Omit<Approval, 'by' | 'at'>, by?: string): Approval {
   const record = { ...row, by: approver(spec.dir, by), at: new Date().toISOString() };
-  writeText(logPath(spec.dir, 'approvals.yml'), renderApprovals([...readApprovals(spec), record]));
+  appendApprovalLog(spec.dir, record);
   return record;
 }
 
@@ -168,7 +163,7 @@ export function nextFor(spec: SpecFolder, config: ReturnType<typeof readConfig>)
   });
 }
 
-/** Appends the approval to `_log/approvals.yml` and returns it. */
+/** Appends the approval to the spec's approvals and returns it. */
 function recordApproval(spec: SpecFolder, step: ApprovalStep, o: ApproveOptions, docs: string[]) {
   const note = o.byRunning ? `approved by running ${o.byRunning}` : o.note;
   const hashes = currentHashes(spec.dir, docs);
diff --git a/src/cli/run-cost.ts b/src/cli/run-cost.ts
index 84a3167..a8480db 100644
--- a/src/cli/run-cost.ts
+++ b/src/cli/run-cost.ts
@@ -5,8 +5,8 @@ import { readConfig } from '../engine/files.js';
 import { readRecommendations } from '../models/load.js';
 import { claudeCostBasis, claudeSessionCost, findClaudeTranscript } from '../scripts/session-cost.js';
 import { findSpec } from '../scripts/spec.js';
-import { logPath } from '../scripts/spec-log.js';
-import { type CostEntry, parseApprovals, parseCosts, renderCosts, sessionDelta, specBudget, summarizeCosts } from '../spec/index.js';
+import { logPath, readApprovalLog, specKeepsState } from '../scripts/spec-log.js';
+import { type CostEntry, parseCosts, renderCosts, sessionDelta, sessionModelTotals, specBudget, summarizeCosts } from '../spec/index.js';
 import { writeText } from '../writer/files.js';
 import type { CliContext } from './context.js';
 import { json } from './json.js';
@@ -36,9 +36,9 @@ function specBasis(entries: CostEntry[]): string {
 }
 
 /** `--record`: the session's spend since its last record (Claude Code) or the amount given by hand. */
-function newEntry(entries: CostEntry[], o: CostOptions): CostEntry {
+function newEntry(entries: CostEntry[], o: CostOptions, rolesOnly: boolean): CostEntry {
   if (!o.command) throw new Error('--record needs --command <mandao>');
-  if (!o.usd) return claudeEntry(entries, { ...o, command: o.command });
+  if (!o.usd) return claudeEntry(entries, { ...o, command: o.command }, rolesOnly);
   return {
     at: new Date().toISOString(),
     command: o.command,
@@ -51,11 +51,6 @@ function newEntry(entries: CostEntry[], o: CostOptions): CostEntry {
   };
 }
 
-const approvalsOf = (dir: string) => {
-  const file = logPath(dir, 'approvals.yml');
-  return parseApprovals(existsSync(file) ? readFileSync(file, 'utf8') : undefined);
-};
-
 /** The main session's role: the Leader in implement, the command itself elsewhere. */
 const mainRole = (command: string) => (command === 'implement' ? 'leader' : command);
 
@@ -79,8 +74,23 @@ function allEntries(ctx: CliContext): CostEntry[] {
 const MODEL_KEY = 'model:';
 const MAIN = 'main-session';
 
-/** What a Claude Code session spent since its previous record, from its transcript and the official prices. */
-function claudeEntry(entries: CostEntry[], o: CostOptions & { command: string }): CostEntry {
+/** Per-model spend since the session's earlier records, derived from their `models` (no `model:` lines in `cumulative`). */
+function modelDelta(entries: CostEntry[], session: string, now: Record<string, number>): Record<string, number> {
+  const before = sessionModelTotals(entries, session);
+  const out: Record<string, number> = {};
+  for (const [key, usd] of Object.entries(now)) {
+    const d = usd - (before[key.slice(MODEL_KEY.length)] ?? 0);
+    if (d > 0.000001) out[key] = d;
+  }
+  return out;
+}
+
+/**
+ * What a Claude Code session spent since its previous record, from its transcript and the official prices.
+ * `rolesOnly` (version 2, C-2): `cumulative` keeps one running total per role, and the per-model baseline is
+ * derived from the session's earlier `models`; version 1 keeps the `model:` lines in `cumulative`.
+ */
+function claudeEntry(entries: CostEntry[], o: CostOptions & { command: string }, rolesOnly: boolean): CostEntry {
   const session = o.session ?? process.env.CLAUDE_CODE_SESSION_ID;
   if (!session) throw new Error('no session: run inside Claude Code or pass --session <id>');
   const transcript = findClaudeTranscript(session);
@@ -89,8 +99,11 @@ function claudeEntry(entries: CostEntry[], o: CostOptions & { command: string })
   // The main session accumulates under one key whatever command runs in it, so a second command in the
   // same session counts only its own part; the delta takes this command's role.
   const cost = claudeSessionCost(transcript, MAIN, prices);
-  const now = { ...cost.roles, ...Object.fromEntries(Object.entries(cost.models).map(([m, usd]) => [`${MODEL_KEY}${m}`, usd])) };
-  const delta = sessionDelta(entries, session, now);
+  const models = Object.fromEntries(Object.entries(cost.models).map(([m, usd]) => [`${MODEL_KEY}${m}`, usd]));
+  const now = { ...cost.roles, ...models };
+  const delta = rolesOnly
+    ? { ...sessionDelta(entries, session, cost.roles), ...modelDelta(entries, session, models) }
+    : sessionDelta(entries, session, now);
   const pick = (model: boolean) =>
     Object.fromEntries(
       Object.entries(delta)
@@ -107,7 +120,7 @@ function claudeEntry(entries: CostEntry[], o: CostOptions & { command: string })
     usd: Math.round(Object.values(roles).reduce((a, b) => a + b, 0) * 1e4) / 1e4,
     roles,
     models: pick(true),
-    cumulative: now,
+    cumulative: rolesOnly ? cost.roles : now,
     source: 'claude-code',
     basis: claudeCostBasis(),
   };
@@ -133,14 +146,14 @@ export function registerCost(run: Command, ctx: CliContext) {
       const config = readConfig(ctx.root());
       const file = logPath(costsDir(ctx, ref), 'costs.yml');
       const entries = parseCosts(existsSync(file) ? readFileSync(file, 'utf8') : undefined);
-      const recorded = o.record ? newEntry(allEntries(ctx), o) : undefined;
+      const recorded = o.record ? newEntry(allEntries(ctx), o, specKeepsState(costsDir(ctx, ref))) : undefined;
       if (recorded) writeText(file, renderCosts([...entries, recorded]));
       const all = recorded ? [...entries, recorded] : entries;
       json({
         ...(recorded ? { recorded: { command: recorded.command, usd: recorded.usd, roles: recorded.roles } } : {}),
         ...summarizeCosts(
           all,
-          ref === 'quick' ? config.budget.per_spec : specBudget(approvalsOf(costsDir(ctx, ref)), config.budget.per_spec),
+          ref === 'quick' ? config.budget.per_spec : specBudget(readApprovalLog(costsDir(ctx, ref)), config.budget.per_spec),
         ),
         basis: specBasis(all),
       });
diff --git a/src/cli/run-leader.ts b/src/cli/run-leader.ts
index 69f9373..90d4d1d 100644
--- a/src/cli/run-leader.ts
+++ b/src/cli/run-leader.ts
@@ -9,9 +9,18 @@ import { decideBudget, effectiveResources, probeMachine } from '../scripts/resou
 import { taskDiff } from '../scripts/review.js';
 import { runTests } from '../scripts/run-tests.js';
 import type { SpecFolder } from '../scripts/spec.js';
-import { logPath } from '../scripts/spec-log.js';
+import { logPath, readApprovalLog } from '../scripts/spec-log.js';
 import { specSpend } from '../scripts/spend.js';
-import { type ExecutionRow, type LoopState, loopState, NOTE_FLAGS, securityMentions, type Task, taskAttempt } from '../spec/index.js';
+import {
+  type ExecutionRow,
+  type LoopState,
+  loopState,
+  NOTE_FLAGS,
+  securityMentions,
+  type Task,
+  taskAttempt,
+  timeline,
+} from '../spec/index.js';
 import { writeText } from '../writer/files.js';
 import { budgetFor } from './budget.js';
 import type { CliContext } from './context.js';
@@ -277,7 +286,8 @@ function registerImplementSummary(run: Command, ctx: CliContext) {
       const { config, spec } = loadSpec(ctx, ref);
       const state = commitState(spec, config.commits.trailers);
       const cut = verifyCut(spec, harnessOption(o.harness));
-      json({ ...implementSummary(spec, state.committed, state.pending), ...(cut ? { session: cut } : {}) });
+      const history = timeline(spec.execution, readApprovalLog(spec.dir));
+      json({ ...implementSummary(spec, state.committed, state.pending), timeline: history, ...(cut ? { session: cut } : {}) });
     });
 }
 
diff --git a/src/cli/run-spec.ts b/src/cli/run-spec.ts
index 14de807..e40b68f 100644
--- a/src/cli/run-spec.ts
+++ b/src/cli/run-spec.ts
@@ -10,7 +10,7 @@ import { fillCommand } from '../scripts/impact.js';
 import { type BudgetKind, decideBudget, effectiveResources, probeMachine } from '../scripts/resources.js';
 import { runTests } from '../scripts/run-tests.js';
 import { checkTransition, expectedPlace, proposeSpec, readLayout, whereAmI } from '../scripts/spec.js';
-import { docPath, LITE_DOC } from '../scripts/spec-log.js';
+import { docPath, LITE_DOC, readApprovalLog } from '../scripts/spec-log.js';
 import {
   blockingMarkers,
   commitMessage,
@@ -20,6 +20,7 @@ import {
   TASK_KINDS,
   taskIndex,
   taskLayoutIssues,
+  timeline,
   trace,
   withIndex,
 } from '../spec/index.js';
@@ -107,7 +108,7 @@ function registerNext(run: Command, ctx: CliContext) {
   run
     .command('next <spec>')
     .description("The command that follows from the spec's state, and the others that can; --shown records the summary shown")
-    .option('--shown', 'record the hashes of the documents just shown to the person (approvals.yml)')
+    .option('--shown', 'record the hashes of the documents just shown to the person (the approvals log)')
     .action((ref: string, o: { shown?: boolean }) => {
       const { config, spec } = loadSpec(ctx, ref);
       if (o.shown) recordShown(spec);
@@ -171,12 +172,16 @@ function closeLayoutProblems(dir: string): string[] {
 /** Spec status changes and the worktree check. */
 function registerState(run: Command, ctx: CliContext) {
   run
-    .command('status <spec> <to>')
-    .description('Check a spec status change (verified needs CI confirmation of deferred runs)')
+    .command('status <spec> [to]')
+    .description(
+      'Check a spec status change (verified needs CI confirmation of deferred runs); without <to>, the status and the timeline (approvals among the execution rows, by date)',
+    )
     .option('--ci-confirmed', 'CI passed every DEFERRED_TO_CI run')
-    .action((ref: string, to: string, opts: { ciConfirmed?: boolean }) => {
+    .action((ref: string, to: string | undefined, opts: { ciConfirmed?: boolean }) => {
       const { spec } = loadSpec(ctx, ref);
       const from = spec.story?.meta.status ?? 'draft';
+      // Read only: the approvals stay in their log and are merged here, never written into execution.md (C-1).
+      if (to === undefined) return json({ status: from, timeline: timeline(spec.execution, readApprovalLog(spec.dir)) });
       const problems = checkTransition(from, to, spec.progress, Boolean(opts.ciConfirmed));
       if (to === 'closed') problems.push(...closeLayoutProblems(spec.dir));
       json({ from, to, allowed: problems.length === 0, problems });
diff --git a/src/cli/start.ts b/src/cli/start.ts
index a821f94..eb89de1 100644
--- a/src/cli/start.ts
+++ b/src/cli/start.ts
@@ -9,8 +9,9 @@ import type { Config, HarnessId } from '../schemas/index.js';
 import { excerpt } from '../scripts/gates.js';
 import { runTests, type TestRun } from '../scripts/run-tests.js';
 import { proposeSpec, type SpecProposal } from '../scripts/spec.js';
-import { LOG_DIR } from '../scripts/spec-log.js';
+import { keepsStateFile, LOG_DIR, updateState } from '../scripts/spec-log.js';
 import { dependencyInstalls, includePlan } from '../scripts/worktree-setup.js';
+import { LAYOUT_VERSIONS } from '../spec/layout.js';
 import { onPath } from '../util/which.js';
 import { copyInto, writeText } from '../writer/files.js';
 import { budgetFor } from './budget.js';
@@ -120,25 +121,36 @@ async function baselineRuns(root: string, config: Config, worktree: string): Pro
 }
 
 /** Cheap gates on the clean worktree, recorded so later failures that were already there are not blamed on the spec. */
-async function baseline(root: string, config: Config, worktree: string, file: string): Promise<Step> {
+async function baseline(root: string, config: Config, worktree: string, log: SpecLog): Promise<Step> {
   const runs = await baselineRuns(root, config, worktree);
   if (!runs.length) return { step: 'baseline', status: 'skipped', detail: 'no lint, typecheck or build gate configured' };
   const red = runs.filter((r) => r.run.status === 'FAIL' || r.run.status === 'TIMEOUT');
-  writeText(
-    file,
-    [
-      '# Baseline',
-      '',
-      `${red.length ? "Red before any change: these failures are not the spec's." : 'Green before any change.'} The test baseline is the base branch's last CI result.`,
-      '',
-      '| Project | Gate | Result |',
-      '|---|---|---|',
-      ...runs.map((r) => `| ${r.project} | ${r.gate} | ${r.run.status} |`),
-      '',
-      ...red.map((r) => `### ${r.project} — ${r.gate}\n\n\`\`\`\n${excerpt(r.run.output, 30)}\n\`\`\``),
-      '',
-    ].join('\n'),
-  );
+  const verdict = `${red.length ? "Red before any change: these failures are not the spec's." : 'Green before any change.'} The test baseline is the base branch's last CI result.`;
+  const file = log.state ? join(log.dir, 'state.yml') : join(log.dir, `baseline${log.suffix}.md`);
+  if (log.state) {
+    const value = {
+      text: verdict,
+      at: new Date().toISOString(),
+      gates: runs.map((r) => ({ project: r.project, gate: r.gate, result: r.run.status })),
+      failures: red.map((r) => ({ project: r.project, gate: r.gate, output: excerpt(r.run.output, 30) })),
+    };
+    updateState(log.specDir, (s) => ({ ...s, baseline: value }));
+  } else
+    writeText(
+      file,
+      [
+        '# Baseline',
+        '',
+        verdict,
+        '',
+        '| Project | Gate | Result |',
+        '|---|---|---|',
+        ...runs.map((r) => `| ${r.project} | ${r.gate} | ${r.run.status} |`),
+        '',
+        ...red.map((r) => `### ${r.project} — ${r.gate}\n\n\`\`\`\n${excerpt(r.run.output, 30)}\n\`\`\``),
+        '',
+      ].join('\n'),
+    );
   return {
     step: 'baseline',
     status: red.length ? 'warning' : 'done',
@@ -165,9 +177,21 @@ function copyEnvFiles(root: string, worktree: string): Step[] {
   ];
 }
 
-/** Where the spec's log lives in the worktree, and the name suffix quick changes use. */
-function logOf(config: Config, p: SpecProposal, quick?: boolean) {
-  return { dir: join(p.worktree, quick ? join(config.paths.specs, 'quick') : p.folder, LOG_DIR), suffix: quick ? `-${p.slug}` : '' };
+/** A new spec starts at the latest layout version; quick changes keep their own files in the quick log. */
+const NEW_SPEC_KEEPS_STATE = keepsStateFile(LAYOUT_VERSIONS[LAYOUT_VERSIONS.length - 1]);
+
+interface SpecLog {
+  specDir: string;
+  dir: string;
+  suffix: string;
+  /** The request and the baseline go to sections of `_log/state.yml` instead of their own files. */
+  state: boolean;
+}
+
+/** Where the spec's log lives in the worktree, the name suffix quick changes use, and whether it keeps `state.yml`. */
+function logOf(config: Config, p: SpecProposal, quick?: boolean): SpecLog {
+  const specDir = join(p.worktree, quick ? join(config.paths.specs, 'quick') : p.folder);
+  return { specDir, dir: join(specDir, LOG_DIR), suffix: quick ? `-${p.slug}` : '', state: !quick && NEW_SPEC_KEEPS_STATE };
 }
 
 /** §14.5 setup, in order: worktree, env files, dependencies, project hooks, graph cache, baseline. */
@@ -177,13 +201,19 @@ async function setUp(root: string, config: Config, p: SpecProposal, o: StartOpti
   if (o.install) steps.push(...(await installDependencies(root, config, wt)));
   steps.push(...(await projectSetup(root, config, wt)), graphCache(root, wt));
   const log = logOf(config, p, o.quick);
-  if (o.baseline) steps.push(await baseline(root, config, wt, join(log.dir, `baseline${log.suffix}.md`)));
+  if (o.baseline) steps.push(await baseline(root, config, wt, log));
   return steps;
 }
 
 /** The request waits for the first command in the spec's log: specify and quick read it. */
 function recordRequest(config: Config, p: SpecProposal, title: string, o: StartOptions) {
   const log = logOf(config, p, o.quick);
+  const lane = o.hotfix ? 'hotfix' : 'normal';
+  const created_at = new Date().toISOString();
+  if (log.state) {
+    const start = { id: p.id, title, type: o.type, lane, branch: p.branch, base: p.base, created_at };
+    return updateState(log.specDir, (s) => ({ ...s, start }));
+  }
   writeText(
     join(log.dir, `start${log.suffix}.yml`),
     [
@@ -191,10 +221,10 @@ function recordRequest(config: Config, p: SpecProposal, title: string, o: StartO
       `id: ${p.id}`,
       `title: ${JSON.stringify(title)}`,
       `type: ${o.type}`,
-      `lane: ${o.hotfix ? 'hotfix' : 'normal'}`,
+      `lane: ${lane}`,
       `branch: ${p.branch}`,
       `base: ${p.base}`,
-      `created_at: ${new Date().toISOString()}`,
+      `created_at: ${created_at}`,
       '',
     ].join('\n'),
   );
diff --git a/src/engine/doctor-specs.ts b/src/engine/doctor-specs.ts
index 67a6db1..70f1417 100644
--- a/src/engine/doctor-specs.ts
+++ b/src/engine/doctor-specs.ts
@@ -1,10 +1,8 @@
-import { existsSync, readdirSync, readFileSync } from 'node:fs';
+import { existsSync, readdirSync } from 'node:fs';
 import { join } from 'node:path';
-import { parse as parseYaml } from 'yaml';
 import type { Config } from '../schemas/index.js';
 import { branchAgeDays, branchExists, branchingFor, branchNames, currentBranch } from '../scripts/branching.js';
-import { logPath } from '../scripts/spec-log.js';
-import { progressSchema } from '../spec/index.js';
+import { logPath, readProgress } from '../scripts/spec-log.js';
 import type { Finding } from './doctor.js';
 
 /**
@@ -17,8 +15,7 @@ export function pendingCommitFindings(root: string, config: Config): Finding[] {
   return readdirSync(dir, { withFileTypes: true })
     .filter((d) => d.isDirectory() && existsSync(logPath(join(dir, d.name), 'progress.yml')))
     .flatMap((d): Finding[] => {
-      const parsed = progressSchema.safeParse(parseYaml(readFileSync(logPath(join(dir, d.name), 'progress.yml'), 'utf8')));
-      const pending = parsed.success ? parsed.data.pending_commits.map((p) => p.task) : [];
+      const pending = readProgress(join(dir, d.name)).progress?.pending_commits.map((p) => p.task) ?? [];
       return pending.length
         ? [
             {
diff --git a/src/scripts/checkpoint.ts b/src/scripts/checkpoint.ts
index 64b8996..dc5ed9b 100644
--- a/src/scripts/checkpoint.ts
+++ b/src/scripts/checkpoint.ts
@@ -1,7 +1,7 @@
 import { stringify as stringifyYaml } from 'yaml';
 import { type ExecutionRow, executionRow, type ProgressInput, progressSchema, setTaskDone } from '../spec/index.js';
 import { snapshot, writeFromSnapshot, writeText } from '../writer/files.js';
-import { docPath, logPath } from './spec-log.js';
+import { docPath, logPath, specKeepsState, updateState } from './spec-log.js';
 
 const EXECUTION_TEMPLATE = (spec: string) => `---
 schema_version: 1
@@ -29,13 +29,15 @@ export function appendExecutionRow(dir: string, spec: string, row: ExecutionRow)
   writeFromSnapshot(snap, lines.join('\n'));
 }
 
-/** Writes progress.yml (the checkpoint) after validating it. */
+/** Writes the checkpoint after validating it: the `progress` section of state.yml (version 2), or progress.yml. */
 export function writeProgress(dir: string, progress: ProgressInput): void {
   const valid = progressSchema.parse(progress);
-  writeText(
-    logPath(dir, 'progress.yml'),
-    `# Written by mandao run checkpoint after every Leader step (ADR 0018).\n${stringifyYaml(valid, { lineWidth: 0 })}`,
-  );
+  if (specKeepsState(dir)) updateState(dir, (s) => ({ ...s, progress: valid }));
+  else
+    writeText(
+      logPath(dir, 'progress.yml'),
+      `# Written by mandao run checkpoint after every Leader step (ADR 0018).\n${stringifyYaml(valid, { lineWidth: 0 })}`,
+    );
 }
 
 /** Flips a task's checkbox in tasks.md, leaving everything else as it was. */
diff --git a/src/scripts/forced.ts b/src/scripts/forced.ts
index 915adfe..df762d1 100644
--- a/src/scripts/forced.ts
+++ b/src/scripts/forced.ts
@@ -1,11 +1,9 @@
 import { existsSync, readdirSync, readFileSync } from 'node:fs';
 import { join } from 'node:path';
-import { parse as parseYaml } from 'yaml';
 import type { Config } from '../schemas/index.js';
-import { progressSchema } from '../spec/index.js';
 import { writeText } from '../writer/files.js';
 import type { Budget, BudgetKind } from './resources.js';
-import { logPath } from './spec-log.js';
+import { logPath, readProgress } from './spec-log.js';
 
 /** The CLI's own log: one JSON line per event worth keeping. Machine-specific, git-ignored. */
 export const CLI_LOG = '.mandao/cli.log';
@@ -42,10 +40,9 @@ export function activeSpecDir(root: string, config: Config): string | undefined
   const specs = join(root, config.paths.specs);
   if (!existsSync(specs)) return undefined;
   const active = readdirSync(specs).filter((d) => {
-    const file = logPath(join(specs, d), 'progress.yml');
-    if (!existsSync(file)) return false;
-    const p = progressSchema.safeParse(parseYaml(readFileSync(file, 'utf8')));
-    return p.success && p.data.current !== null;
+    if (!existsSync(logPath(join(specs, d), 'progress.yml'))) return false;
+    const p = readProgress(join(specs, d)).progress;
+    return p !== undefined && p.current !== null;
   });
   return active.length === 1 ? join(specs, active[0]!) : undefined;
 }
diff --git a/src/scripts/session-cut.ts b/src/scripts/session-cut.ts
index f81283a..f812dc0 100644
--- a/src/scripts/session-cut.ts
+++ b/src/scripts/session-cut.ts
@@ -1,7 +1,7 @@
 import { existsSync, readFileSync } from 'node:fs';
 import type { Config, ModelPrice } from '../schemas/index.js';
 import { writeText } from '../writer/files.js';
-import { logPath } from './spec-log.js';
+import { logPath, specKeepsState, updateState } from './spec-log.js';
 
 /**
  * When the Leader should end the session at a task boundary and resume from the checkpoint in a new one
@@ -165,14 +165,31 @@ export function parseCutEstimates(text: string): CutEstimateRow[] {
 const CUTS_HEADER =
   '# Session cut estimates (ADR 0038)\n\n| At | Task | Context | Base | Turns left | Savings (USD) | Decision |\n|---|---|---|---|---|---|---|\n';
 
-/** Every boundary estimate goes to `_log/session-cuts.md`, so Kaizen can recalibrate the constants. */
+/**
+ * Every boundary estimate goes to the `cut_estimates` section of `state.yml` (version 2, C-3) or to
+ * `_log/session-cuts.md` (version 1), so Kaizen can recalibrate the constants.
+ */
 export function recordCutEstimate(
   specDir: string,
   row: { at: string; task: string; session: SessionContext; tasksLeft: number; advice: CutAdvice; decision: string },
 ): void {
+  const turns = TURNS_PER_TASK * row.tasksLeft + TURNS_AFTER_TASKS;
+  const base = row.session.first + RELOAD_TOKENS;
+  if (specKeepsState(specDir)) {
+    const estimate = {
+      at: row.at,
+      task: row.task,
+      context: row.session.last,
+      base,
+      turns_left: turns,
+      savings: Math.round(row.advice.savings * 100) / 100,
+      decision: row.decision,
+    };
+    updateState(specDir, (s) => ({ ...s, cut_estimates: [...s.cut_estimates, estimate] }));
+    return;
+  }
   const file = logPath(specDir, 'session-cuts.md');
   const before = existsSync(file) ? readFileSync(file, 'utf8') : CUTS_HEADER;
-  const turns = TURNS_PER_TASK * row.tasksLeft + TURNS_AFTER_TASKS;
-  const cells = [row.at, row.task, row.session.last, row.session.first + RELOAD_TOKENS, turns, row.advice.savings.toFixed(2), row.decision];
+  const cells = [row.at, row.task, row.session.last, base, turns, row.advice.savings.toFixed(2), row.decision];
   writeText(file, `${before}| ${cells.join(' | ')} |\n`);
 }
diff --git a/src/scripts/session-turns.ts b/src/scripts/session-turns.ts
index 12b901f..0df0551 100644
--- a/src/scripts/session-turns.ts
+++ b/src/scripts/session-turns.ts
@@ -1,8 +1,8 @@
 import { existsSync, readFileSync } from 'node:fs';
 import { type CostEntry, parseCosts } from '../spec/index.js';
 import { findClaudeTranscript } from './session-cost.js';
-import { mainResponse, parseCutEstimates } from './session-cut.js';
-import { logPath } from './spec-log.js';
+import { type CutEstimateRow, mainResponse, parseCutEstimates } from './session-cut.js';
+import { logPath, readState, specKeepsState } from './spec-log.js';
 
 /**
  * What the session-cut constants (ADR 0038) assume, measured on a spec's Claude Code sessions (MDO-0008
@@ -236,18 +236,22 @@ function reloadOf(sessions: Session[]): number | undefined {
   return reloads.length ? Math.round(reloads.reduce((a, b) => a + b, 0) / reloads.length) : undefined;
 }
 
-/** Each logged estimate against the main turns after its time up to the close record, across the sessions. */
-function estimatesOf(specDir: string, sessions: Session[]): CutEstimateActual[] {
-  const file = logPath(specDir, 'session-cuts.md');
-  let text: string;
+/** The logged estimates: `cut_estimates` of `state.yml` (version 2) or `_log/session-cuts.md` (version 1). */
+function cutEstimateRows(specDir: string): CutEstimateRow[] {
   try {
-    text = existsSync(file) ? readFileSync(file, 'utf8') : '';
+    if (specKeepsState(specDir)) return readState(specDir).cut_estimates.map((e) => ({ at: e.at, task: e.task, turnsLeft: e.turns_left }));
+    const file = logPath(specDir, 'session-cuts.md');
+    return parseCutEstimates(existsSync(file) ? readFileSync(file, 'utf8') : '');
   } catch {
-    text = ''; // an unreadable cut log has no estimates to compare, which is not an error of the measure
+    return []; // an unreadable cut log has no estimates to compare, which is not an error of the measure
   }
+}
+
+/** Each logged estimate against the main turns after its time up to the close record, across the sessions. */
+function estimatesOf(specDir: string, sessions: Session[]): CutEstimateActual[] {
   const closes = sessions.flatMap((s) => s.records.filter((r) => r.command === 'close').map((r) => r.at));
   const closeAt = closes.length ? Math.max(...closes) : undefined;
-  return parseCutEstimates(text).map((row) => {
+  return cutEstimateRows(specDir).map((row) => {
     const from = Date.parse(row.at);
     const out: CutEstimateActual = { at: row.at, task: row.task, estimated: row.turnsLeft };
     const unknown = closeAt === undefined || sessions.some((s) => !s.data && s.records.some((r) => r.at > from));
diff --git a/src/scripts/spec-log.ts b/src/scripts/spec-log.ts
index 8b8c47d..85e1a2d 100644
--- a/src/scripts/spec-log.ts
+++ b/src/scripts/spec-log.ts
@@ -1,7 +1,12 @@
 import { existsSync, readFileSync } from 'node:fs';
 import { join } from 'node:path';
-import { tasksHaveOwnFile } from '../spec/layout.js';
+import { parse as parseYaml } from 'yaml';
+import { type Approval, parseApprovals, renderApprovals } from '../spec/approvals.js';
+import { LAYOUT_VERSIONS, layoutManifest, tasksHaveOwnFile } from '../spec/layout.js';
 import { frontmatterOf } from '../spec/markdown.js';
+import { type Progress, progressSchema } from '../spec/progress.js';
+import { parseState, renderState, type State } from '../spec/state.js';
+import { writeText } from '../writer/files.js';
 
 /**
  * Machine files of a spec live in `_log/` (the readability pass): people read the documents in the spec
@@ -23,8 +28,32 @@ export type LogFile =
   | 'session-cuts.md'
   | 'discrepancies.md';
 
-/** Where a machine file of the spec is: `_log/<name>`, or the root when an older spec keeps it there. */
+/** The version 2 home of the logical logs merged into `_log/state.yml` (design D3). */
+export const STATE_FILE = 'state.yml';
+const IN_STATE: ReadonlySet<LogFile> = new Set<LogFile>(['progress.yml', 'approvals.yml', 'session-cuts.md']);
+
+/** True when a layout version (a story's `schema_version`) keeps start, baseline, progress, approvals and cut estimates in `state.yml`. */
+export function keepsStateFile(schemaVersion: unknown): boolean {
+  const version = LAYOUT_VERSIONS.find((v) => v === schemaVersion);
+  return version !== undefined && layoutManifest(version, 'lite').log.includes(STATE_FILE);
+}
+
+/** The story's `schema_version`, or undefined when there is no story (the quick folder, a spec not specified yet). */
+function storyVersion(specDir: string): unknown {
+  const story = join(specDir, 'story.md');
+  return existsSync(story) ? frontmatterOf(readFileSync(story, 'utf8')).data.schema_version : undefined;
+}
+
+/** True when this spec keeps its state in `_log/state.yml`; a version 1 spec, or a folder without a story, keeps its own files. */
+export const specKeepsState = (specDir: string) => keepsStateFile(storyVersion(specDir));
+
+/**
+ * Where a machine file of the spec is: `_log/<name>`, or the root when an older spec keeps it there. In a
+ * version 2 spec, `progress.yml`, `approvals.yml` and `session-cuts.md` are sections of `_log/state.yml`:
+ * read and write them with the section helpers below, never as whole files.
+ */
 export function logPath(specDir: string, name: LogFile): string {
+  if (IN_STATE.has(name) && specKeepsState(specDir)) return join(specDir, LOG_DIR, STATE_FILE);
   const inLog = join(specDir, LOG_DIR, name);
   if (existsSync(inLog)) return inLog;
   const legacy = join(specDir, name);
@@ -46,10 +75,7 @@ export type SpecDoc = 'requirements' | 'design' | 'tasks';
 export const LITE_DOC = 'spec.md';
 
 /** True when the story's layout version keeps the tasks in `tasks.md` (the rule lives in `src/spec/layout.ts`). */
-function tasksAlwaysOwnFile(specDir: string): boolean {
-  const story = join(specDir, 'story.md');
-  return existsSync(story) && tasksHaveOwnFile(frontmatterOf(readFileSync(story, 'utf8')).data.schema_version);
-}
+const tasksAlwaysOwnFile = (specDir: string) => tasksHaveOwnFile(storyVersion(specDir));
 
 /**
  * The file holding a role: its own document when present, else `spec.md` when present, else its own name.
@@ -62,3 +88,40 @@ export function docPath(specDir: string, doc: SpecDoc): string {
   const lite = join(specDir, LITE_DOC);
   return existsSync(lite) ? lite : own;
 }
+
+const readIf = (file: string) => (existsSync(file) ? readFileSync(file, 'utf8') : undefined);
+
+/** `_log/state.yml` of a version 2 spec; empty when it does not exist yet. A section that breaks its schema throws. */
+export const readState = (specDir: string): State => parseState(readIf(join(specDir, LOG_DIR, STATE_FILE)));
+
+/** Rewrites `_log/state.yml` with one change applied, keeping every other section as it was. */
+export function updateState(specDir: string, change: (state: State) => State): void {
+  writeText(join(specDir, LOG_DIR, STATE_FILE), renderState(change(readState(specDir))));
+}
+
+/** Every approval row of the spec: the `approvals` section of `state.yml` (version 2) or `approvals.yml` (version 1). */
+export function readApprovalLog(specDir: string): Approval[] {
+  return specKeepsState(specDir) ? readState(specDir).approvals : parseApprovals(readIf(logPath(specDir, 'approvals.yml')));
+}
+
+/** Appends an approval row, never rewriting the earlier ones. */
+export function appendApprovalLog(specDir: string, row: Approval): void {
+  if (specKeepsState(specDir)) updateState(specDir, (s) => ({ ...s, approvals: [...s.approvals, row] }));
+  else writeText(logPath(specDir, 'approvals.yml'), renderApprovals([...readApprovalLog(specDir), row]));
+}
+
+/**
+ * The spec's checkpoint, from the `progress` section of `state.yml` (version 2) or `progress.yml`
+ * (version 1, read as before). `invalid` when the checkpoint is there but does not match its schema.
+ */
+export function readProgress(specDir: string): { progress?: Progress; invalid?: true } {
+  const text = readIf(logPath(specDir, 'progress.yml'));
+  if (!text) return {};
+  let data: unknown = parseYaml(text);
+  if (specKeepsState(specDir)) {
+    data = (data as { progress?: unknown } | null)?.progress;
+    if (data === undefined) return {};
+  }
+  const r = progressSchema.safeParse(data);
+  return r.success ? { progress: r.data } : { invalid: true };
+}
diff --git a/src/scripts/spec.ts b/src/scripts/spec.ts
index 207a9d5..3bb1bce 100644
--- a/src/scripts/spec.ts
+++ b/src/scripts/spec.ts
@@ -1,7 +1,6 @@
 import { execFileSync } from 'node:child_process';
 import { existsSync, readdirSync, readFileSync } from 'node:fs';
 import { basename, dirname, join, resolve } from 'node:path';
-import { parse as parseYaml } from 'yaml';
 import type { Config } from '../schemas/index.js';
 import { type SpecStatus, specStatus } from '../schemas/index.js';
 import {
@@ -14,13 +13,12 @@ import {
   parseRequirements,
   parseStory,
   parseTasks,
-  progressSchema,
   type Requirements,
   type Story,
   type Task,
 } from '../spec/index.js';
 import { branchExists, branchingFor, specBranch, startPoint } from './branching.js';
-import { docPath, LITE_DOC, logPath } from './spec-log.js';
+import { docPath, LITE_DOC, logPath, readProgress, specKeepsState } from './spec-log.js';
 
 /** Everything Mandao can read from one spec folder, with the problems found while reading it. */
 export interface SpecFolder {
@@ -90,12 +88,9 @@ export function readSpec(dir: string): SpecFolder {
     issues.push(...r.issues);
     out.execution = r.rows;
   }
-  const progress = readIf(logPath(dir, 'progress.yml'));
-  if (progress) {
-    const r = progressSchema.safeParse(parseYaml(progress));
-    if (r.success) out.progress = r.data;
-    else issues.push('progress.yml does not match its schema');
-  }
+  const progress = readProgress(dir);
+  if (progress.progress) out.progress = progress.progress;
+  if (progress.invalid) issues.push(`${specKeepsState(dir) ? 'state.yml progress' : 'progress.yml'} does not match its schema`);
   return out;
 }
 
diff --git a/src/spec/AGENTS.md b/src/spec/AGENTS.md
index ce282aa..976eebe 100644
--- a/src/spec/AGENTS.md
+++ b/src/spec/AGENTS.md
@@ -14,3 +14,6 @@ The CLI and scripts gather inputs; writer helpers own persistence.
 - `next.ts`: `nextStep` is pure and only recommends; it never offers implement before approval or past an open item (`NEEDS CLARIFICATION`, `CONFLICT` inline or as a Consistency Check row, a critical Consistency Check row, a pending decision; resolved rows are ignored). Lite is `spec.md` existing (`SpecFolder.lite`). Hashes ignore `status:` and `tasks.md`; a missing hash means no claim. Change-after-approval compares approval rows only; `shown` rows (`run next --shown`) are compared only by `approve --by-running`.
 - `next.ts` reads only real markers: `withoutCode` (`markdown.ts`) drops inline code spans and fenced blocks first, so a marker shown as an example is not an open item. A Consistency Check row is resolved when its Status starts with `resolved` (`core/templates/shared/rules/consistency-check.md`; a test pins both). A `verify-report.md` with `verdict: blocked` recommends implement, not verify. A closed spec skips the open-item check and recommends its delivery from git (`unpushed` → push, `pushed` → PR and merge, `merged` → `none`, no options); it never offers story or clarify. `nextFor` (`src/cli/approve.ts`) reads those facts from the spec's own branch (not HEAD); only `origin/<base>` counts as merged, and without git or the branch there is no delivery fact; naming the delivery performs nothing (MDO-0012).
 - `layout.ts`: `layoutManifest(version, depth)` is the one manifest behind `run layout`, the close gate (`run status <ID> closed`) and `docs/spec-anatomy.md`; the version is the story's `schema_version` (`LAYOUT_VERSIONS`, 1 or 2, anything else throws), never a `layout:` key or the files present. `tasksHaveOwnFile(schema_version)` is the one rule for where tasks live (version 2: always `tasks.md`; `docPath` in `src/scripts/spec-log.ts` calls it and never falls back to `spec.md` for them; version 1 keeps the old fallback, and any value outside `LAYOUT_VERSIONS` counts as version 1 there). New stories start at version 2. Alternatives (version 1 lite: `spec.md` or `requirements.md` + `design.md`) are `oneOf` entries in the manifest, not special cases. `layoutFindings` is pure over `{ story, docs, entries }`; `readLayout` in `src/scripts/spec.ts` reads the folder (D1). An AC with `status: removed` is skipped by `trace` and `acStatus` (ADR 0041).
+- `state.ts`: `_log/state.yml` of a version 2 spec, one zod schema (`stateSchema`) with the sections `start`, `baseline`, `progress`, `approvals` and `cut_estimates` (D3, C-1, C-3). `parseState` reads an absent or empty file as empty and throws on a row that breaks its schema (never drops it); `renderState` writes the sections in that order and leaves out absent ones. The IO is in `src/scripts/spec-log.ts`: `specKeepsState(dir)` (from the story's `schema_version` through the layout manifest), `logPath` mapping `progress.yml`, `approvals.yml` and `session-cuts.md` to `state.yml` for version 2, and the section helpers `readState`, `updateState`, `readApprovalLog`, `appendApprovalLog`, `readProgress`. Every writer (start, baseline, checkpoint, red, commit queue, approve, `run next --shown`, cut estimates) goes through them; a version 1 spec, or a folder without a story (quick), keeps writing its own files exactly as before. `mandao start` writes `start` and `baseline` to `state.yml` for a new spec (the latest layout version); a quick change keeps `start-<slug>.yml` and `baseline-<slug>.md`. `progressSchema.schema_version` accepts every `LAYOUT_VERSIONS` value.
+- `timeline.ts`: `timeline(execution, approvals)` merges the approvals into the execution rows by date (stable: execution rows first on the same instant; `shown` rows are left out). `run status <ID>` without a target and `run implement-summary` print it as `timeline`; nothing is written, and an approval never becomes an `execution.md` row (C-1).
+- `costs.ts`: in a version 2 spec a new `costs.yml` entry keeps `cumulative` per role only (C-2); the per-model baseline is derived from the session's earlier `models` (`sessionModelTotals`). A version 1 spec, and the quick folder, keep the `model:` lines in `cumulative`.
diff --git a/src/spec/costs.ts b/src/spec/costs.ts
index ee5954f..df1f5e7 100644
--- a/src/spec/costs.ts
+++ b/src/spec/costs.ts
@@ -43,6 +43,17 @@ export function sessionDelta(entries: CostEntry[], session: string, now: Record<
   return out;
 }
 
+/**
+ * Per-model spend the session's earlier records hold, summed from their `models`: the per-model baseline a
+ * version 2 entry derives instead of storing `model:` lines in `cumulative` (C-2).
+ */
+export function sessionModelTotals(entries: CostEntry[], session: string): Record<string, number> {
+  const out: Record<string, number> = {};
+  for (const e of entries.filter((x) => x.session === session))
+    for (const [model, usd] of Object.entries(e.models)) out[model] = (out[model] ?? 0) + usd;
+  return out;
+}
+
 export type BudgetStatus = 'ok' | 'warn' | 'over' | 'no-budget';
 
 export interface CostSummary {
diff --git a/src/spec/index.ts b/src/spec/index.ts
index dbe1194..93a6905 100644
--- a/src/spec/index.ts
+++ b/src/spec/index.ts
@@ -19,8 +19,10 @@ export * from './progress.js';
 export * from './release.js';
 export * from './requirements.js';
 export * from './review-findings.js';
+export * from './state.js';
 export * from './story.js';
 export * from './task-index.js';
 export * from './tasks.js';
+export * from './timeline.js';
 export * from './trace.js';
 export * from './verify.js';
diff --git a/src/spec/progress.ts b/src/spec/progress.ts
index 71e1c25..b5eea59 100644
--- a/src/spec/progress.ts
+++ b/src/spec/progress.ts
@@ -1,12 +1,16 @@
 import { z } from 'zod';
-import { harnessId, schemaVersion } from '../schemas/index.js';
+import { harnessId } from '../schemas/index.js';
+import { LAYOUT_VERSIONS } from './layout.js';
 
 /** `implementing`, `awaiting-review`, or `rework-n` (the n-th rework of the task). */
 export const phase = z.union([z.enum(['implementing', 'awaiting-review']), z.string().regex(/^rework-\d+$/)]);
 
-/** `progress.yml`: the machine-readable checkpoint a Leader writes after every step (ADR 0018). */
+/**
+ * `progress.yml` (version 1) or the `progress` section of `state.yml` (version 2): the machine-readable
+ * checkpoint a Leader writes after every step (ADR 0018).
+ */
 export const progressSchema = z.object({
-  schema_version: schemaVersion,
+  schema_version: z.literal([...LAYOUT_VERSIONS]),
   spec: z.string().min(1),
   updated_at: z.string().min(1),
   current: z
diff --git a/test/integration/start.test.ts b/test/integration/start.test.ts
index 1e38f15..336065f 100644
--- a/test/integration/start.test.ts
+++ b/test/integration/start.test.ts
@@ -6,6 +6,7 @@ import { buildProgram } from '../../src/cli/program.js';
 import { openCommand, parseRequest } from '../../src/cli/start.js';
 import { writeYaml } from '../../src/engine/files.js';
 import { dependencyInstalls } from '../../src/scripts/worktree-setup.js';
+import { parseState } from '../../src/spec/state.js';
 import { makeTree, pkg } from '../helpers.js';
 
 const git = (cwd: string, ...args: string[]) =>
@@ -81,13 +82,14 @@ describe('mandao start (§14.5, ADR 0037)', () => {
     );
     expect(existsSync(join(wt, 'generated.txt'))).toBe(true);
     expect(existsSync(join(wt, 'graphify-out/graph.json'))).toBe(true);
-    // Baseline: the cheap gates on the clean worktree; a red one is reported before any change.
+    // Baseline: the cheap gates on the clean worktree; a red one is reported before any change. A new spec
+    // is version 2: the baseline and the request are sections of `_log/state.yml` (MDO-0011 D3).
     const folder = `specs/${r.id}-add-a-login-rate-limit`;
-    const baseline = readFileSync(join(wt, folder, '_log/baseline.md'), 'utf8');
-    expect(baseline).toContain('| shop | typecheck | FAIL |');
-    expect(baseline).toContain('error TS1: broken on main');
+    const state = parseState(readFileSync(join(wt, folder, '_log/state.yml'), 'utf8'));
+    expect(state.baseline?.gates).toContainEqual({ project: 'shop', gate: 'typecheck', result: 'FAIL' });
+    expect(state.baseline?.failures[0]?.output).toContain('error TS1: broken on main');
     expect(r.steps).toContainEqual(expect.objectContaining({ step: 'baseline', status: 'warning' }));
-    expect(readFileSync(join(wt, folder, '_log/start.yml'), 'utf8')).toContain('title: "Add a login rate limit"');
+    expect(state.start).toMatchObject({ id: r.id, title: 'Add a login rate limit', type: 'story', lane: 'normal', branch: r.branch });
     expect(r.open).toBe(`cd ${JSON.stringify(wt)} && claude "/mandao-specify ${r.id} --depth lite"`);
     expect(git(root, 'status', '--porcelain')).toBe('');
   });

--- /dev/null
+++ b/src/spec/state.ts (new file)
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { z } from 'zod';
import { approvalSchema } from './approvals.js';
import { progressSchema } from './progress.js';

/** `start`: the request `mandao start` recorded for the first command (version 1: `start.yml`). */
export const startSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  type: z.string().optional(),
  lane: z.string().optional(),
  branch: z.string().optional(),
  base: z.string().optional(),
  created_at: z.string().optional(),
});

/** `baseline`: the cheap gates on the clean worktree before any change (version 1: `baseline.md`). */
export const baselineSchema = z.object({
  /** The one-line verdict: green, or red with "these failures are not the spec's". */
  text: z.string(),
  at: z.string().optional(),
  gates: z.array(z.object({ project: z.string(), gate: z.string(), result: z.string() })).default([]),
  /** Only the red gates, each with the excerpt of its output. */
  failures: z.array(z.object({ project: z.string(), gate: z.string(), output: z.string() })).default([]),
});

/** `cut_estimates`: one row per session-cut estimate at a task boundary, for Kaizen (version 1: `session-cuts.md`). */
export const cutEstimateSchema = z.object({
  at: z.string().min(1),
  task: z.string().min(1),
  context: z.number(),
  base: z.number(),
  /** The "Turns left" the rule assumed at that boundary. */
  turns_left: z.number(),
  savings: z.number(),
  decision: z.string(),
});
export type CutEstimate = z.infer<typeof cutEstimateSchema>;

/**
 * `_log/state.yml` of a version 2 spec (design D3): one schema for five logical logs. Every section is
 * optional in the file; approvals are appended, never rewritten, as in `approvals.yml`.
 */
export const stateSchema = z.object({
  start: startSchema.optional(),
  baseline: baselineSchema.optional(),
  progress: progressSchema.optional(),
  approvals: z.array(approvalSchema).default([]),
  cut_estimates: z.array(cutEstimateSchema).default([]),
});
export type State = z.infer<typeof stateSchema>;
export type StateInput = z.input<typeof stateSchema>;
export type StateSection = keyof State;

/** Reads `state.yml`; an absent or empty file is an empty state. A row that does not match its schema throws. */
export function parseState(text: string | undefined): State {
  const data = text?.trim() ? (parseYaml(text) as unknown) : undefined;
  return stateSchema.parse(data ?? {});
}

const ORDER: StateSection[] = ['start', 'baseline', 'progress', 'approvals', 'cut_estimates'];

/** The file, sections in a fixed order; absent sections and empty lists are left out. */
export function renderState(state: StateInput): string {
  const valid = stateSchema.parse(state);
  const present = ORDER.filter((k) => {
    const v = valid[k];
    return v !== undefined && !(Array.isArray(v) && !v.length);
  });
  const body = present.length ? stringifyYaml(Object.fromEntries(present.map((k) => [k, valid[k]])), { lineWidth: 0 }) : '{}\n';
  return `# Written by mandao scripts: start request, baseline, progress, approvals and session-cut estimates.\n${body}`;
}

--- /dev/null
+++ b/src/spec/timeline.ts (new file)
import type { Approval } from './approvals.js';
import type { ExecutionRow } from './execution.js';

export type TimelineEntry =
  | { at: string; kind: 'approval'; step: Approval['step']; by: string; note?: string }
  | { at: string; kind: 'execution'; task: string; attempt: number; verdict: ExecutionRow['verdict']; notes?: string };

/** Unparsable dates go last, in their own order. */
const time = (at: string) => {
  const t = Date.parse(at);
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
};

/**
 * The spec's history as one list (C-1): the approvals merged into the execution rows by date. Nothing is
 * stored twice: the caller reads both logs and nothing is written. `shown` rows are not approvals and stay
 * out. On the same instant, execution rows keep their log order and come before the approvals.
 */
export function timeline(rows: ExecutionRow[], approvals: Approval[]): TimelineEntry[] {
  const executions = rows.map(
    (r): TimelineEntry => ({
      at: r.date,
      kind: 'execution',
      task: r.task,
      attempt: r.attempt,
      verdict: r.verdict,
      ...(r.notes ? { notes: r.notes } : {}),
    }),
  );
  const approved = approvals
    .filter((a) => a.step !== 'shown')
    .map((a): TimelineEntry => ({ at: a.at, kind: 'approval', step: a.step, by: a.by, ...(a.note ? { note: a.note } : {}) }));
  return [...executions, ...approved]
    .map((entry, i) => ({ entry, i, t: time(entry.at) }))
    .sort((a, b) => a.t - b.t || a.i - b.i)
    .map((x) => x.entry);
}

--- /dev/null
+++ b/test/integration/state-log.test.ts (new file)
// mandao-scans: specs/ — copies the MDO-0001 spec folder into temporary trees.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { cutAdvice, recordCutEstimate } from '../../src/scripts/session-cut.js';
import { measureSessions } from '../../src/scripts/session-turns.js';
import { readSpec } from '../../src/scripts/spec.js';
import { withStatus } from '../../src/spec/index.js';
import { makeTree, pkg } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
  for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  // A missing command argument must fail the test, not end the test process.
  vi.spyOn(process, 'exit').mockImplementation(((c?: number) => {
    throw new Error(`process.exit(${c})`);
  }) as never);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

/** The fixture as a spec of layout `version`, documents in draft, log in `_log/`, committed on the spec branch. */
function repo(version: 1 | 2) {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
  git(root, 'init', '-q', '-b', 'feat/MDO-0001-skills-list');
  git(root, 'config', 'user.name', 'Ana PO');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude'],
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  const dir = join(root, SPEC);
  for (const f of ['story.md', 'requirements.md', 'tasks.md']) {
    writeFileSync(join(dir, f), withStatus(readFileSync(join(dir, f), 'utf8'), 'draft'));
  }
  const story = readFileSync(join(dir, 'story.md'), 'utf8').replace(/^schema_version: 1$/m, `schema_version: ${version}`);
  writeFileSync(join(dir, 'story.md'), story);
  mkdirSync(join(dir, '_log'));
  for (const f of ['execution.md', 'progress.yml']) renameSync(join(dir, f), join(dir, '_log', f));
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}
const specFile = (root: string, f: string) => join(root, SPEC, f);
const read = (root: string, f: string) => readFileSync(specFile(root, f), 'utf8');
const state = (root: string) => parseYaml(read(root, '_log/state.yml')) as Record<string, unknown>;
const cli = (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', ...args]);
const lastJson = () => JSON.parse(out.at(-1)!);

describe('S-3.5: approvals live in state.yml and show in the timeline', () => {
  /** Execution rows on 18 and 20 October, approvals on 17, 19 and 21: the dates alternate. */
  function withEvents(root: string) {
    const exec = read(root, '_log/execution.md').replace('| 2026-10-20 | T1 |', '| 2026-10-18 | T1 |');
    writeFileSync(specFile(root, '_log/execution.md'), exec);
    const rows = [
      ['story', '2026-10-17T09:00:00.000Z'],
      ['design', '2026-10-19T09:00:00.000Z'],
      ['tasks', '2026-10-21T09:00:00.000Z'],
    ];
    const yaml = rows.map(([step, at]) => `  - step: ${step}\n    by: Ana PO\n    at: "${at}"\n`).join('');
    writeFileSync(specFile(root, '_log/state.yml'), `approvals:\n${yaml}`);
  }
  /** ASSUMPTION: both commands print a `timeline` array whose entries mention their step or task. */
  const positions = (timeline: unknown[]) => {
    const text = timeline.map((e) => JSON.stringify(e));
    const at = (needle: RegExp) => text.findIndex((t) => needle.test(t));
    return [at(/"story"/), at(/"T1"/), at(/"design"/), at(/"T2"/), at(/"tasks"/)];
  };
  const expectInDateOrder = (timeline: unknown[]) => {
    const p = positions(timeline);
    expect(p.every((i) => i >= 0)).toBe(true);
    expect(p).toEqual([...p].sort((a, b) => a - b));
  };

  test('S-3.5: run status without a target lists approvals by date among the execution rows', async () => {
    const root = repo(2);
    withEvents(root);
    await cli(root, 'run', 'status', 'MDO-0001');
    expectInDateOrder(lastJson().timeline);
  });

  test('S-3.5: implement-summary shows the same timeline', async () => {
    const root = repo(2);
    withEvents(root);
    await cli(root, 'run', 'implement-summary', 'MDO-0001');
    expectInDateOrder(lastJson().timeline);
  });

  test('S-3.5/C1: showing the timeline writes nothing, and approving writes no row into execution.md', async () => {
    const root = repo(2);
    withEvents(root);
    const before = [read(root, '_log/execution.md'), read(root, '_log/state.yml')];
    await cli(root, 'run', 'status', 'MDO-0001');
    expect(lastJson().timeline).toBeDefined();
    expect([read(root, '_log/execution.md'), read(root, '_log/state.yml')]).toEqual(before);

    await cli(root, 'approve', 'MDO-0001', 'design');
    expect(read(root, '_log/execution.md')).toBe(before[0]);
    expect((state(root).approvals as { step: string }[]).map((a) => a.step)).toEqual(['story', 'design', 'tasks', 'design']);
  });
});

describe('T3 writers: a version 2 spec keeps its logs in state.yml, a version 1 spec in its own files', () => {
  test('approve writes the approvals section of state.yml and no approvals.yml', async () => {
    const root = repo(2);
    await cli(root, 'approve', 'MDO-0001', 'design');
    expect(state(root).approvals).toEqual([expect.objectContaining({ step: 'design', by: 'Ana PO', at: expect.any(String) })]);
    expect(existsSync(specFile(root, '_log/approvals.yml'))).toBe(false);
    expect(existsSync(specFile(root, 'approvals.yml'))).toBe(false);
  });

  test('run next --shown records the shown hashes in state.yml and no approvals.yml', async () => {
    const root = repo(2);
    await cli(root, 'run', 'next', 'MDO-0001', '--shown');
    const approvals = state(root).approvals as { step: string; sha256: Record<string, string> }[];
    expect(approvals).toEqual([
      expect.objectContaining({ step: 'shown', sha256: expect.objectContaining({ 'story.md': expect.any(String) }) }),
    ]);
    expect(existsSync(specFile(root, '_log/approvals.yml'))).toBe(false);
  });

  test('checkpoint writes the progress section, keeps the approvals, and readSpec still reads the progress', async () => {
    const root = repo(2);
    await cli(root, 'approve', 'MDO-0001', 'design');
    const checkpoint = ['run', 'checkpoint', 'MDO-0001', '--task', 'T2', '--verdict', 'REPORTED', '--harness', 'claude'];
    await cli(root, ...checkpoint, '--implementer', 'mandao-implementer-standard');
    const s = state(root);
    expect(s.progress).toMatchObject({ spec: 'MDO-0001-skills-list' });
    expect((s.approvals as unknown[]).length).toBe(1);
    // The old file is no longer written: the fixture's progress.yml keeps the content it had.
    expect(read(root, '_log/progress.yml')).not.toContain('mandao-implementer-standard');
    expect(readSpec(join(root, SPEC)).progress?.spec).toBe('MDO-0001-skills-list');
  });

  test('(regression pin) a version 1 spec still writes approvals.yml and no state.yml: older specs are read as they are', async () => {
    const root = repo(1);
    await cli(root, 'approve', 'MDO-0001', 'design');
    expect(existsSync(specFile(root, '_log/approvals.yml'))).toBe(true);
    expect(existsSync(specFile(root, '_log/state.yml'))).toBe(false);
  });

  test('cut estimates go to the cut_estimates section, and Kaizen reads them from there', () => {
    const root = makeTree({
      'spec/story.md': '---\nschema_version: 2\nid: MDO-0001\n---\n# X\n',
      'spec/_log/costs.yml': 'costs: []\n',
    });
    const specDir = join(root, 'spec');
    const now = Date.parse('2026-10-20T21:00:00Z');
    const opus = { input: 4, cache_write_5m: 5, cache_write_1h: 8, cache_read: 0.2, output: 20 };
    const session = { model: 'claude-opus-5-5', first: 33_865, last: 125_542, lastAt: now - 60_000, ttl: '1h' as const };
    recordCutEstimate(specDir, {
      at: '2026-10-20T20:00:00.000Z',
      task: 'T2',
      session,
      tasksLeft: 1,
      advice: cutAdvice(session, 1, opus, now),
      decision: 'go on',
    });
    const written = parseYaml(readFileSync(join(specDir, '_log/state.yml'), 'utf8')) as { cut_estimates: unknown[] };
    expect(written.cut_estimates).toEqual([expect.objectContaining({ task: 'T2' })]);
    expect(existsSync(join(specDir, '_log/session-cuts.md'))).toBe(false);
    const measured = measureSessions({ specDir, commitTimes: new Map(), home: join(root, 'no-home') });
    expect(measured.estimates).toEqual([{ at: '2026-10-20T20:00:00.000Z', task: 'T2', estimated: 43, actual: undefined }]);
  });
});

describe('mandao start in a new (version 2) spec', () => {
  function startRepo() {
    const root = realpathSync(makeTree({ 'package.json': pkg('shop'), 'README.md': 'x\n', '.gitignore': '.worktrees/\n' }));
    git(root, 'init', '-q', '-b', 'main');
    const typecheck = 'node -e "console.log(\'error TS1: broken on main\'); process.exit(2)"';
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'shop', path: '.', gates: { typecheck } }],
      harnesses: ['claude'],
      paths: { worktrees: '.worktrees' },
    });
    git(root, 'add', '.');
    git(root, 'commit', '-qm', 'base');
    return root;
  }

  test('the request and the baseline go to state.yml; start.yml and baseline.md are not written', async () => {
    const root = startRepo();
    await cli(root, 'start', 'Add', 'a', 'login', 'rate', 'limit', '--no-install', '--json');
    const r = lastJson();
    const log = join(r.worktree as string, `specs/${r.id}-add-a-login-rate-limit`, '_log');
    const s = parseYaml(readFileSync(join(log, 'state.yml'), 'utf8')) as Record<string, unknown>;
    expect(JSON.stringify(s.start)).toContain('Add a login rate limit');
    const baseline = JSON.stringify(s.baseline);
    expect(baseline).toContain('typecheck');
    expect(baseline).toContain('FAIL');
    expect(baseline).toContain('error TS1: broken on main');
    expect(existsSync(join(log, 'start.yml'))).toBe(false);
    expect(existsSync(join(log, 'baseline.md'))).toBe(false);
  });
});

describe('costs.yml keeps one cumulative per role (C-2)', () => {
  const sonnetSession = (home: string, id: string, usd: number) => {
    const dir = join(home, 'projects', '-tmp-proj');
    mkdirSync(dir, { recursive: true });
    const usage = { output_tokens: usd * 100_000 };
    writeFileSync(join(dir, `${id}.jsonl`), JSON.stringify({ message: { id: 'm1', model: 'claude-sonnet-5-5', usage } }));
  };
  const earlier = (extra: string) =>
    `costs:\n  - at: 2026-01-05T10:00:00.000Z\n    command: implement\n    harness: claude\n    session: s9\n    usd: 9\n    roles:\n      leader: 9\n    models: {}\n    cumulative:\n      main-session: 9\n${extra}    source: claude-code\n`;

  function costRepo(prior: string, version: 1 | 2) {
    const root = realpathSync(makeTree({}));
    const home = realpathSync(makeTree({}));
    vi.stubEnv('CLAUDE_CONFIG_DIR', home);
    vi.stubEnv('MANDAO_COST_BASIS', 'equivalent');
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'a', path: '.' }],
      harnesses: ['claude'],
    });
    mkdirSync(join(root, 'specs/MDO-0009-y/_log'), { recursive: true });
    writeFileSync(join(root, 'specs/MDO-0009-y/story.md'), `---\nschema_version: ${version}\nid: MDO-0009\n---\n# Y\n`);
    writeFileSync(join(root, 'specs/MDO-0009-y/_log/costs.yml'), prior);
    sonnetSession(home, 's9', 9.5);
    return root;
  }

  test('a new entry has cumulative per role and no per-model lines', async () => {
    const root = costRepo('costs: []\n', 2);
    await cli(root, 'run', 'cost', 'MDO-0009', '--record', '--command', 'implement', '--session', 's9');
    const file = readFileSync(join(root, 'specs/MDO-0009-y/_log/costs.yml'), 'utf8');
    const entries = (parseYaml(file) as { costs: { cumulative: Record<string, number> }[] }).costs;
    const cumulative = entries.at(-1)!.cumulative;
    expect(Object.keys(cumulative)).toContain('main-session');
    expect(Object.keys(cumulative).filter((k) => k.startsWith('model:'))).toEqual([]);
  });

  test('(regression pin) the cross-spec baseline gives 0.5 from a version 1 record with model lines and from a version 2 record without', async () => {
    const cases = [
      ['      "model:claude-sonnet-5-5": 9\n', 1],
      ['', 2],
    ] as const;
    for (const [extra, version] of cases) {
      const root = costRepo(earlier(extra), version);
      mkdirSync(join(root, 'specs/quick'), { recursive: true });
      await cli(root, 'run', 'cost', 'quick', '--record', '--command', 'quick', '--session', 's9');
      expect(lastJson().recorded).toMatchObject({ usd: 0.5, roles: { quick: 0.5 } });
    }
  });
});

--- /dev/null
+++ b/test/unit/state.test.ts (new file)
import { describe, expect, test } from 'vitest';
// Missing until T3: the one zod schema behind `state.yml` (design D3).
import { parseState, renderState } from '../../src/spec/state.js';

/**
 * ASSUMPTION (the spec fixes the sections, not the signatures): `src/spec/state.ts` exports
 * `parseState(text | undefined)` and `renderState(state)`; the sections are `start`, `baseline`,
 * `progress`, `approvals` and `cut_estimates` (design D3, FR-3).
 */
const approval = { step: 'design' as const, by: 'Ana PO', at: '2026-10-20T10:00:00.000Z', sha256: { 'story.md': 'a'.repeat(64) } };
const progress = {
  schema_version: 2 as const,
  spec: 'MDO-0001-x',
  updated_at: '2026-10-20T11:00:00.000Z',
  current: { task: 'T2', phase: 'implementing', harness: 'claude', model: 'claude-sonnet-5-5' },
  open_questions: [],
  next_step: 'review',
  deferred_to_ci: [],
  red_tests: [{ task: 'T2', files: [{ path: 'test/a.test.ts', sha256: 'b'.repeat(64), tests: ['rejects x'] }] }],
  pending_commits: [],
};

describe('state.yml: one schema for five logical logs (AC-3, S-3.5)', () => {
  test('an absent or empty file reads as no approvals and no cut estimates', () => {
    expect(parseState(undefined).approvals).toEqual([]);
    expect(parseState('').cut_estimates).toEqual([]);
  });

  test('approvals and progress written to the file read back unchanged', () => {
    const text = renderState({ approvals: [approval], progress } as never);
    const back = parseState(text);
    expect(back.approvals).toEqual([approval]);
    expect(back.progress).toMatchObject({ spec: 'MDO-0001-x', red_tests: progress.red_tests });
  });

  test('the start request and the baseline survive a round trip beside the other sections', () => {
    const text = renderState({
      start: { title: 'Add a login rate limit' },
      baseline: { text: 'Green before any change.' },
      approvals: [approval],
    } as never);
    const back = parseState(text) as unknown as Record<string, unknown>;
    expect(JSON.stringify(back.start)).toContain('Add a login rate limit');
    expect(JSON.stringify(back.baseline)).toContain('Green before any change.');
    expect(parseState(text).approvals).toHaveLength(1);
  });

  test('a row that is not a valid approval is rejected, not dropped', () => {
    expect(() => parseState('approvals:\n  - step: nonsense\n    by: x\n    at: y\n')).toThrow();
  });
});

```
