# Review pack — T5, attempt 1

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T5-1.md`.

## Brief

```json
{
  "spec": "MDO-0011-one-fixed-layout-for-every-spec-folder",
  "task": {
    "project": "mandao",
    "kind": "feat",
    "tier": "standard",
    "files": [
      "src/spec/close-summary.ts",
      "src/cli/run-close.ts",
      "src/scripts/publish.ts",
      "core/templates/shared/close/close-summary.md",
      "core/templates/shared/rules/doc-close.md",
      "core/templates/shared/rules/spec-docs.md",
      "core/commands/close.md",
      "docs/CHANGELOG.md",
      "docs/kaizen/lessons.md",
      "test/integration/close.test.ts",
      "test/unit/release.test.ts",
      "test/integration/spec-log.test.ts",
      "test/unit/content.test.ts"
    ],
    "exemplar": "src/spec/close-summary.ts",
    "ac": [
      "AC-4",
      "AC-4/C1",
      "AC-4/C2"
    ],
    "scenarios": [
      "S-4.1",
      "S-4.1/C2",
      "S-4.2",
      "S-4.2/C1",
      "S-4.3",
      "S-4.3/C2",
      "S-4.4"
    ],
    "test_levels": {
      "S-4.1": "e2e",
      "S-4.1/C2": "e2e",
      "S-4.2": "unit",
      "S-4.2/C1": "unit",
      "S-4.3": "unit",
      "S-4.3/C2": "unit",
      "S-4.4": "e2e"
    },
    "evidence": "tdd",
    "risk_tags": [
      "public-api"
    ],
    "depends_on": [
      "T1"
    ],
    "parallel_safe": false,
    "verify": "npx vitest run test/integration/close.test.ts test/unit/release.test.ts test/integration/spec-log.test.ts test/unit/content.test.ts",
    "tests": {
      "unit": [
        "S-4.2",
        "S-4.2/C1",
        "S-4.3",
        "S-4.3/C2"
      ],
      "e2e": [
        "S-4.1",
        "S-4.1/C2",
        "S-4.4"
      ]
    },
    "dod": [],
    "characterization": false,
    "id": "T5",
    "title": "The whole close is one document inside the spec",
    "done": false,
    "line": 162
  },
  "acceptance": [
    {
      "ref": "AC-4",
      "text": "**GIVEN** a verified spec · **WHEN** it is closed · **THEN** `close-summary.md` holds the outcome per criterion, the notes for the PO, the notes for developers, the Kaizen and a `Delivery` section, and `docs/CHANGELOG.md` gains the spec's line · **AND IT MUST** write the PO notes in the business language and the developer notes in the technical language · **BUT it must NOT** write `docs/releases/<ID>/` or `docs/kaizen/<ID>.md`, nor write empty sections or fields"
    },
    {
      "ref": "AC-4/C1",
      "text": "**AND IT MUST** write the PO notes in the business language and the developer notes in the technical language"
    },
    {
      "ref": "AC-4/C2",
      "text": "**BUT it must NOT** write `docs/releases/<ID>/` or `docs/kaizen/<ID>.md`, nor write empty sections or fields"
    }
  ],
  "scenarios": [
    {
      "ref": "S-4.1",
      "text": "**Given** a verified version 2 spec · **When** it is closed · **Then** `close-summary.md` has the five sections, `docs/CHANGELOG.md` has one line with the ID, title, type and a link to the folder, and neither `docs/releases/<ID>/` nor `docs/kaizen/<ID>.md` exists"
    },
    {
      "ref": "S-4.1/C2",
      "text": "**Then** `close-summary.md` has the five sections, `docs/CHANGELOG.md` has one line with the ID, title, type and a link to the folder, and neither `docs/releases/<ID>/` nor `docs/kaizen/<ID>.md` exists"
    },
    {
      "ref": "S-4.2",
      "text": "**Given** `language.business: es` and `language.technical: en` · **When** close writes the summary · **Then** `For the PO` is in Spanish and `For developers` in English"
    },
    {
      "ref": "S-4.2/C1",
      "text": "**Then** `For the PO` is in Spanish and `For developers` in English"
    },
    {
      "ref": "S-4.3",
      "text": "**Given** a close with no environment and no publication · **When** `run close-summary` writes · **Then** no empty field (`Release: —`) and no empty section appears"
    },
    {
      "ref": "S-4.3/C2",
      "text": "**Then** no empty field (`Release: —`) and no empty section appears"
    },
    {
      "ref": "S-4.4",
      "text": "**Given** a `close-summary.md` whose `For the PO` was written by the agent · **When** `run close-summary --closed` runs again · **Then** that section is unchanged, and `docs/CHANGELOG.md` still has a single line for the spec"
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
    "task": "T5",
    "tier": "standard",
    "attempt": 1,
    "failsAtTier": 0,
    "tdd": {
      "required": true,
      "testsBy": "tester",
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
      "test/integration/costs.test.ts",
      "test/integration/enforced-rules.test.ts",
      "test/integration/engine.test.ts",
      "test/integration/ledger.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/log-v2.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/review.test.ts",
      "test/integration/scripts.test.ts",
      "test/integration/state-log.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/commits-times.test.ts",
      "test/unit/diagram.test.ts",
      "test/unit/kaizen-sessions.test.ts",
      "test/unit/kaizen.test.ts",
      "test/unit/layout.test.ts",
      "test/unit/log-cache.test.ts",
      "test/unit/next.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/session-turns.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ],
    "files": [
      "src/spec/close-summary.ts",
      "src/cli/run-close.ts",
      "src/scripts/publish.ts",
      "core/templates/shared/close/close-summary.md",
      "core/templates/shared/rules/doc-close.md",
      "core/templates/shared/rules/spec-docs.md",
      "core/commands/close.md",
      "docs/CHANGELOG.md",
      "docs/kaizen/lessons.md",
      "test/integration/close.test.ts",
      "test/unit/release.test.ts",
      "test/integration/spec-log.test.ts",
      "test/unit/content.test.ts",
      "test/integration/approve.test.ts",
      "test/integration/branching.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/enforced-rules.test.ts",
      "test/integration/engine.test.ts",
      "test/integration/ledger.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/log-v2.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/review.test.ts",
      "test/integration/scripts.test.ts",
      "test/integration/state-log.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/commits-times.test.ts",
      "test/unit/diagram.test.ts",
      "test/unit/kaizen-sessions.test.ts",
      "test/unit/kaizen.test.ts",
      "test/unit/layout.test.ts",
      "test/unit/log-cache.test.ts",
      "test/unit/next.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/session-turns.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related src/spec/close-summary.ts src/cli/run-close.ts src/scripts/publish.ts core/templates/shared/close/close-summary.md core/templates/shared/rules/doc-close.md core/templates/shared/rules/spec-docs.md core/commands/close.md docs/CHANGELOG.md docs/kaizen/lessons.md test/integration/close.test.ts test/unit/release.test.ts test/integration/spec-log.test.ts test/unit/content.test.ts test/integration/approve.test.ts test/integration/branching.test.ts test/integration/characterization.test.ts test/integration/costs.test.ts test/integration/enforced-rules.test.ts test/integration/engine.test.ts test/integration/ledger.test.ts test/integration/lite-spec.test.ts test/integration/log-v2.test.ts test/integration/mdo-0004-defects.test.ts test/integration/mdo-0005-defects.test.ts test/integration/mdo-0006-defects.test.ts test/integration/premise.test.ts test/integration/review.test.ts test/integration/scripts.test.ts test/integration/state-log.test.ts test/integration/tdd.test.ts test/unit/commits-times.test.ts test/unit/diagram.test.ts test/unit/kaizen-sessions.test.ts test/unit/kaizen.test.ts test/unit/layout.test.ts test/unit/log-cache.test.ts test/unit/next.test.ts test/unit/pr-plan.test.ts test/unit/session-turns.test.ts test/unit/spec.test.ts test/unit/task-index.test.ts test/unit/verify.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": [
      "src/cli/run-ledger.ts",
      "src/spec/index.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/integration/close.test.ts",
      "test/unit/release.test.ts",
      "test/integration/spec-log.test.ts",
      "test/unit/content.test.ts"
    ],
    "changed": [
      "test/integration/close.test.ts",
      "test/unit/content.test.ts"
    ]
  }
}
```

## Gates — T5, attempt 1

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
index 41a61cf..995eb55 100644
--- a/.agents/skills/mandao-close/SKILL.md
+++ b/.agents/skills/mandao-close/SKILL.md
@@ -34,7 +34,9 @@ Then `node .mandao/bin/mandao.mjs run status <spec> closed` must be allowed (the
    followed, with the mean absolute error. Below the minimum (3 specs) write "insufficient data (minimum 3)" and
    propose nothing. Proposals are recommendations only: Mandao never changes the constants.
 3. **Learn:** 0–3 root-cause lessons, each with evidence. **Standardize:** 1–3 one-line edits, each for
-   approval. Write `docs/kaizen/<ID>.md` from `.mandao/templates/app/close/kaizen.md`.
+   approval. Version 1 spec: write `docs/kaizen/<ID>.md` from `.mandao/templates/app/close/kaizen.md`. Version 2
+   spec (`schema_version: 2` in story.md): write the `## Kaizen` section of `close-summary.md` from the same
+   guide, and append one line per approved lesson to `docs/kaizen/lessons.md`; write no `docs/kaizen/<ID>.md`.
 
 ## 2. Constitution and product impacts (single writer)
 
@@ -62,7 +64,22 @@ edge is drift and goes, explained, into the technical notes; a relabelled box is
 
 ## 5. Documents
 
-Following `.mandao/templates/app/rules/spec-docs.md` and `.mandao/templates/app/rules/doc-close.md` (summary first, evidence at the end), in `docs/releases/<ID>/`:
+Following `.mandao/templates/app/rules/spec-docs.md` and `.mandao/templates/app/rules/doc-close.md` (summary first, evidence at the end).
+
+**Version 2 spec:** the whole close is `close-summary.md`, from `.mandao/templates/app/close/close-summary.md`. Run
+`node .mandao/bin/mandao.mjs run close-summary <spec>` first: it writes the record, `## Outcome` (from `node .mandao/bin/mandao.mjs run release-status`)
+and `## Delivery`; never edit those two. Then write the three sections it keeps, each one only when it has
+something to say:
+- `## For the PO` in `en`: business language, no code names, what the user gets now and
+  what is still pending, from the guide `.mandao/templates/app/close/release-notes.md`.
+- `## For developers` in `en`: what was built per module, decisions, contract changes,
+  the drift from step 4, how to test, from the guide `.mandao/templates/app/close/technical.md`.
+- `## Kaizen` in `en`: the headline numbers and the lessons from step 1.
+
+Version 2 writes no `docs/releases/<ID>/` and no `docs/kaizen/<ID>.md`. Never write an empty section or
+a field with `—`: leave it out.
+
+**Version 1 spec**, in `docs/releases/<ID>/`:
 - `technical.md` from `.mandao/templates/app/close/technical.md`, in `en`.
 - `release-notes.md` from `.mandao/templates/app/close/release-notes.md`, in `en`, one row per
   criterion with the status from `node .mandao/bin/mandao.mjs run release-status <spec>` — never upgraded by hand.
@@ -89,8 +106,9 @@ For each tracker target (e.g. `jira:PROJ-123`, from `.mandao/sources.yml`):
    (PNG of the diagrams), updating the previous comment when the action is `update`.
 3. Record it: `node .mandao/bin/mandao.mjs run close-summary <spec> --published "<target>|comment|<id>|<hash>|<url>"`.
 
-Without a tracker MCP: the files in `docs/releases/<ID>/` are the publication; also print the
-release notes as a block the user can paste.
+Version 2: the payload is the `## For the PO` section of `close-summary.md`. Without a tracker MCP, that
+section (or, for version 1, the files in `docs/releases/<ID>/`) is the publication; also print it as a
+block the user can paste.
 
 **Approved from the terminal:** when `_log/approvals.yml` holds a `close` approval (`mandao approve
 <ID> close --items …`), apply exactly those items without asking again; anything not listed stays
@@ -98,10 +116,11 @@ unapplied and is reported.
 
 ## 8. Finish
 
-`node .mandao/bin/mandao.mjs run close-summary <spec> --closed` (it writes the record and the links to the documents
-the close produced; never edit it by hand), set `status: closed` in story.md, then commit everything
-close wrote on its own: `node .mandao/bin/mandao.mjs run commit-spec <spec> close` (the spec folder, `docs/releases/<ID>/`,
-`docs/kaizen/<ID>.md`, the constitution and changed module guides; a `docs` commit with `Refs: <ID>`,
+`node .mandao/bin/mandao.mjs run close-summary <spec> --closed` (it writes the record; for version 2 it also rewrites
+`## Outcome` and `## Delivery`, keeps your prose sections as they are, and upserts the spec's one line in
+`docs/CHANGELOG.md`; never edit the record by hand), set `status: closed` in story.md, then commit everything
+close wrote on its own: `node .mandao/bin/mandao.mjs run commit-spec <spec> close` (the spec folder, `docs/CHANGELOG.md`, `docs/kaizen/lessons.md`
+or, for version 1, `docs/releases/<ID>/` and `docs/kaizen/<ID>.md`, the constitution and changed module guides; a `docs` commit with `Refs: <ID>`,
 never pushed). Report: Kaizen headline, impacts applied, drift, where it was published, the commit.
 
 **Worktree** (`worktrees.cleanup` in `.mandao/config.yml`): after the spec's branch is merged, `ask`
diff --git a/.claude/skills/mandao-close/SKILL.md b/.claude/skills/mandao-close/SKILL.md
index 6114451..ec0a49d 100644
--- a/.claude/skills/mandao-close/SKILL.md
+++ b/.claude/skills/mandao-close/SKILL.md
@@ -40,7 +40,9 @@ Then `node .mandao/bin/mandao.mjs run status $spec closed` must be allowed (the
    followed, with the mean absolute error. Below the minimum (3 specs) write "insufficient data (minimum 3)" and
    propose nothing. Proposals are recommendations only: Mandao never changes the constants.
 3. **Learn:** 0–3 root-cause lessons, each with evidence. **Standardize:** 1–3 one-line edits, each for
-   approval. Write `docs/kaizen/<ID>.md` from `.mandao/templates/app/close/kaizen.md`.
+   approval. Version 1 spec: write `docs/kaizen/<ID>.md` from `.mandao/templates/app/close/kaizen.md`. Version 2
+   spec (`schema_version: 2` in story.md): write the `## Kaizen` section of `close-summary.md` from the same
+   guide, and append one line per approved lesson to `docs/kaizen/lessons.md`; write no `docs/kaizen/<ID>.md`.
 
 ## 2. Constitution and product impacts (single writer)
 
@@ -68,7 +70,22 @@ edge is drift and goes, explained, into the technical notes; a relabelled box is
 
 ## 5. Documents
 
-Following `.mandao/templates/app/rules/spec-docs.md` and `.mandao/templates/app/rules/doc-close.md` (summary first, evidence at the end), in `docs/releases/<ID>/`:
+Following `.mandao/templates/app/rules/spec-docs.md` and `.mandao/templates/app/rules/doc-close.md` (summary first, evidence at the end).
+
+**Version 2 spec:** the whole close is `close-summary.md`, from `.mandao/templates/app/close/close-summary.md`. Run
+`node .mandao/bin/mandao.mjs run close-summary $spec` first: it writes the record, `## Outcome` (from `node .mandao/bin/mandao.mjs run release-status`)
+and `## Delivery`; never edit those two. Then write the three sections it keeps, each one only when it has
+something to say:
+- `## For the PO` in `en`: business language, no code names, what the user gets now and
+  what is still pending, from the guide `.mandao/templates/app/close/release-notes.md`.
+- `## For developers` in `en`: what was built per module, decisions, contract changes,
+  the drift from step 4, how to test, from the guide `.mandao/templates/app/close/technical.md`.
+- `## Kaizen` in `en`: the headline numbers and the lessons from step 1.
+
+Version 2 writes no `docs/releases/<ID>/` and no `docs/kaizen/<ID>.md`. Never write an empty section or
+a field with `—`: leave it out.
+
+**Version 1 spec**, in `docs/releases/<ID>/`:
 - `technical.md` from `.mandao/templates/app/close/technical.md`, in `en`.
 - `release-notes.md` from `.mandao/templates/app/close/release-notes.md`, in `en`, one row per
   criterion with the status from `node .mandao/bin/mandao.mjs run release-status $spec` — never upgraded by hand.
@@ -95,8 +112,9 @@ For each tracker target (e.g. `jira:PROJ-123`, from `.mandao/sources.yml`):
    (PNG of the diagrams), updating the previous comment when the action is `update`.
 3. Record it: `node .mandao/bin/mandao.mjs run close-summary $spec --published "<target>|comment|<id>|<hash>|<url>"`.
 
-Without a tracker MCP: the files in `docs/releases/<ID>/` are the publication; also print the
-release notes as a block the user can paste.
+Version 2: the payload is the `## For the PO` section of `close-summary.md`. Without a tracker MCP, that
+section (or, for version 1, the files in `docs/releases/<ID>/`) is the publication; also print it as a
+block the user can paste.
 
 **Approved from the terminal:** when `_log/approvals.yml` holds a `close` approval (`mandao approve
 <ID> close --items …`), apply exactly those items without asking again; anything not listed stays
@@ -104,10 +122,11 @@ unapplied and is reported.
 
 ## 8. Finish
 
-`node .mandao/bin/mandao.mjs run close-summary $spec --closed` (it writes the record and the links to the documents
-the close produced; never edit it by hand), set `status: closed` in story.md, then commit everything
-close wrote on its own: `node .mandao/bin/mandao.mjs run commit-spec $spec close` (the spec folder, `docs/releases/<ID>/`,
-`docs/kaizen/<ID>.md`, the constitution and changed module guides; a `docs` commit with `Refs: <ID>`,
+`node .mandao/bin/mandao.mjs run close-summary $spec --closed` (it writes the record; for version 2 it also rewrites
+`## Outcome` and `## Delivery`, keeps your prose sections as they are, and upserts the spec's one line in
+`docs/CHANGELOG.md`; never edit the record by hand), set `status: closed` in story.md, then commit everything
+close wrote on its own: `node .mandao/bin/mandao.mjs run commit-spec $spec close` (the spec folder, `docs/CHANGELOG.md`, `docs/kaizen/lessons.md`
+or, for version 1, `docs/releases/<ID>/` and `docs/kaizen/<ID>.md`, the constitution and changed module guides; a `docs` commit with `Refs: <ID>`,
 never pushed). Report: Kaizen headline, impacts applied, drift, where it was published, the commit.
 
 **Worktree** (`worktrees.cleanup` in `.mandao/config.yml`): after the spec's branch is merged, `ask`
diff --git a/.github/prompts/mandao-close.prompt.md b/.github/prompts/mandao-close.prompt.md
index 4d4c572..df6fd19 100644
--- a/.github/prompts/mandao-close.prompt.md
+++ b/.github/prompts/mandao-close.prompt.md
@@ -41,7 +41,9 @@ Then `node .mandao/bin/mandao.mjs run status ${input:spec:Spec folder or id} clo
    followed, with the mean absolute error. Below the minimum (3 specs) write "insufficient data (minimum 3)" and
    propose nothing. Proposals are recommendations only: Mandao never changes the constants.
 3. **Learn:** 0–3 root-cause lessons, each with evidence. **Standardize:** 1–3 one-line edits, each for
-   approval. Write `docs/kaizen/<ID>.md` from `.mandao/templates/app/close/kaizen.md`.
+   approval. Version 1 spec: write `docs/kaizen/<ID>.md` from `.mandao/templates/app/close/kaizen.md`. Version 2
+   spec (`schema_version: 2` in story.md): write the `## Kaizen` section of `close-summary.md` from the same
+   guide, and append one line per approved lesson to `docs/kaizen/lessons.md`; write no `docs/kaizen/<ID>.md`.
 
 ## 2. Constitution and product impacts (single writer)
 
@@ -69,7 +71,22 @@ edge is drift and goes, explained, into the technical notes; a relabelled box is
 
 ## 5. Documents
 
-Following `.mandao/templates/app/rules/spec-docs.md` and `.mandao/templates/app/rules/doc-close.md` (summary first, evidence at the end), in `docs/releases/<ID>/`:
+Following `.mandao/templates/app/rules/spec-docs.md` and `.mandao/templates/app/rules/doc-close.md` (summary first, evidence at the end).
+
+**Version 2 spec:** the whole close is `close-summary.md`, from `.mandao/templates/app/close/close-summary.md`. Run
+`node .mandao/bin/mandao.mjs run close-summary ${input:spec:Spec folder or id}` first: it writes the record, `## Outcome` (from `node .mandao/bin/mandao.mjs run release-status`)
+and `## Delivery`; never edit those two. Then write the three sections it keeps, each one only when it has
+something to say:
+- `## For the PO` in `en`: business language, no code names, what the user gets now and
+  what is still pending, from the guide `.mandao/templates/app/close/release-notes.md`.
+- `## For developers` in `en`: what was built per module, decisions, contract changes,
+  the drift from step 4, how to test, from the guide `.mandao/templates/app/close/technical.md`.
+- `## Kaizen` in `en`: the headline numbers and the lessons from step 1.
+
+Version 2 writes no `docs/releases/<ID>/` and no `docs/kaizen/<ID>.md`. Never write an empty section or
+a field with `—`: leave it out.
+
+**Version 1 spec**, in `docs/releases/<ID>/`:
 - `technical.md` from `.mandao/templates/app/close/technical.md`, in `en`.
 - `release-notes.md` from `.mandao/templates/app/close/release-notes.md`, in `en`, one row per
   criterion with the status from `node .mandao/bin/mandao.mjs run release-status ${input:spec:Spec folder or id}` — never upgraded by hand.
@@ -96,8 +113,9 @@ For each tracker target (e.g. `jira:PROJ-123`, from `.mandao/sources.yml`):
    (PNG of the diagrams), updating the previous comment when the action is `update`.
 3. Record it: `node .mandao/bin/mandao.mjs run close-summary ${input:spec:Spec folder or id} --published "<target>|comment|<id>|<hash>|<url>"`.
 
-Without a tracker MCP: the files in `docs/releases/<ID>/` are the publication; also print the
-release notes as a block the user can paste.
+Version 2: the payload is the `## For the PO` section of `close-summary.md`. Without a tracker MCP, that
+section (or, for version 1, the files in `docs/releases/<ID>/`) is the publication; also print it as a
+block the user can paste.
 
 **Approved from the terminal:** when `_log/approvals.yml` holds a `close` approval (`mandao approve
 <ID> close --items …`), apply exactly those items without asking again; anything not listed stays
@@ -105,10 +123,11 @@ unapplied and is reported.
 
 ## 8. Finish
 
-`node .mandao/bin/mandao.mjs run close-summary ${input:spec:Spec folder or id} --closed` (it writes the record and the links to the documents
-the close produced; never edit it by hand), set `status: closed` in story.md, then commit everything
-close wrote on its own: `node .mandao/bin/mandao.mjs run commit-spec ${input:spec:Spec folder or id} close` (the spec folder, `docs/releases/<ID>/`,
-`docs/kaizen/<ID>.md`, the constitution and changed module guides; a `docs` commit with `Refs: <ID>`,
+`node .mandao/bin/mandao.mjs run close-summary ${input:spec:Spec folder or id} --closed` (it writes the record; for version 2 it also rewrites
+`## Outcome` and `## Delivery`, keeps your prose sections as they are, and upserts the spec's one line in
+`docs/CHANGELOG.md`; never edit the record by hand), set `status: closed` in story.md, then commit everything
+close wrote on its own: `node .mandao/bin/mandao.mjs run commit-spec ${input:spec:Spec folder or id} close` (the spec folder, `docs/CHANGELOG.md`, `docs/kaizen/lessons.md`
+or, for version 1, `docs/releases/<ID>/` and `docs/kaizen/<ID>.md`, the constitution and changed module guides; a `docs` commit with `Refs: <ID>`,
 never pushed). Report: Kaizen headline, impacts applied, drift, where it was published, the commit.
 
 **Worktree** (`worktrees.cleanup` in `.mandao/config.yml`): after the spec's branch is merged, `ask`
diff --git a/.mandao/mandao.lock b/.mandao/mandao.lock
index 2f52356..b290b0a 100644
--- a/.mandao/mandao.lock
+++ b/.mandao/mandao.lock
@@ -57,7 +57,7 @@ files:
     harness: codex
     from: command:close
     ownership: owned
-    hash: sha256-2aU7sMTUpd5z9VcKuo8OWEk5BhZlQJkAeexkXBZmslE=
+    hash: sha256-tH7WWvmYFW1z08xOcRwsCxxq8j0zhQ0AvUQGzAPtQxk=
     scope: project
   - path: .agents/skills/mandao-constitution/agents/openai.yaml
     harness: codex
@@ -231,7 +231,7 @@ files:
     harness: claude
     from: command:close
     ownership: owned
-    hash: sha256-aT0bVRK56V5WYPZ01PC+gxL23MoNdHeXQHQDTXr79NE=
+    hash: sha256-sZ1FqWIhQoAxrk5OP7eEDndkuxBWJUNyFfLyacAflhw=
     scope: project
   - path: .claude/skills/mandao-constitution/SKILL.md
     harness: claude
@@ -399,7 +399,7 @@ files:
     harness: copilot
     from: command:close
     ownership: owned
-    hash: sha256-qNxHwmDetR9iUj1r6kc70t8sxm0QYtE6RJhb/AXv9LU=
+    hash: sha256-Vmqn9ons5ynDCtOHgiNHHqNDHAln8K5KBnKocnf5dUo=
     scope: project
   - path: .github/prompts/mandao-constitution.prompt.md
     harness: copilot
@@ -491,6 +491,12 @@ files:
     ownership: owned
     hash: sha256-ntaaMICmC22L/iBk1/EkhsYtoN3I9Y8/auaTPxGiJ88=
     scope: project
+  - path: .mandao/templates/app/close/close-summary.md
+    harness: mandao
+    from: template:shared/close/close-summary.md
+    ownership: owned
+    hash: sha256-2vn9iYaugdbk6adCV/wpLXGSBGQ9vyOYjIEX9rUJJRw=
+    scope: project
   - path: .mandao/templates/app/close/kaizen.md
     harness: mandao
     from: template:shared/close/kaizen.md
@@ -615,7 +621,7 @@ files:
     harness: mandao
     from: template:shared/rules/doc-close.md
     ownership: owned
-    hash: sha256-GR0arlcRmO5SFmAB20FNQYCU02WybmhIA7THXunbxmM=
+    hash: sha256-pZbeBes8lOyAfB0hOSgqkpg1Ch9PSFwcqmZBwHTQoTM=
     scope: project
   - path: .mandao/templates/app/rules/doc-data-model.md
     harness: mandao
@@ -687,7 +693,7 @@ files:
     harness: mandao
     from: template:shared/rules/spec-docs.md
     ownership: owned
-    hash: sha256-+2Tse15PT4SRQzmFtfoEIuPKLEsFa0XPFS0CExEd8TY=
+    hash: sha256-s9SQShdZD/+6MZVS/2a1bMIM3Y1V4DabgbVw5WtfE5I=
     scope: project
   - path: .mandao/templates/app/rules/spec-types.md
     harness: mandao
diff --git a/.mandao/templates/app/rules/doc-close.md b/.mandao/templates/app/rules/doc-close.md
index 49fe99e..c70b8da 100644
--- a/.mandao/templates/app/rules/doc-close.md
+++ b/.mandao/templates/app/rules/doc-close.md
@@ -18,3 +18,15 @@ Applies the principles in `spec-docs.md`.
 - **Technical notes:** what was built per project and module, with the commits found by their trailers;
   decisions and pivots; contract changes; the built diagram against the approved one, explaining every
   node or edge `mandao run diagram-drift` reports; how to test; links.
+
+## Version 2: one document
+
+A version 2 spec's close is `close-summary.md` (template `close/close-summary.md`), and the sections above
+become its sections:
+- `## For the PO` follows the release-notes rules, in `language.business`.
+- `## For developers` follows the technical-notes rules, in `language.technical`.
+- `## Kaizen` follows the Kaizen rules, in `language.technical`; each approved lesson is also one line in
+  `docs/kaizen/lessons.md`.
+- `## Outcome` and `## Delivery` are written by `mandao run close-summary`, never by hand.
+- A section or field with nothing to say is left out: no empty section, no `—`.
+- Nothing is copied to `docs/releases/<ID>/` or `docs/kaizen/<ID>.md`.
diff --git a/.mandao/templates/app/rules/spec-docs.md b/.mandao/templates/app/rules/spec-docs.md
index 51db8cf..8241132 100644
--- a/.mandao/templates/app/rules/spec-docs.md
+++ b/.mandao/templates/app/rules/spec-docs.md
@@ -37,7 +37,7 @@ templates are skeletons and this file says what goes in each section.
 | `quickstart.md` | How can a PO check it by hand? (only when it has visible behavior) | specify; verify updates |
 | `tasks.md` | What work, in what order? | tasks |
 | `verify-report.md` | Does it do what was asked? | verify |
-| `close-summary.md` | What shipped? (generated record and links) | close |
+| `close-summary.md` | What shipped? (version 2: outcome, notes for the PO and for developers, Kaizen, delivery) | close |
 
 Where each fact lives:
 - **Clarifications** live only in `requirements.md` (`## Clarifications`); story and design link there.
diff --git a/core/commands/close.md b/core/commands/close.md
index e6ebec3..84b92cd 100644
--- a/core/commands/close.md
+++ b/core/commands/close.md
@@ -13,6 +13,8 @@ inputs:
   - { path: "{{paths.specs}}/<ID>-<slug>/" }
 outputs:
   - { path: "{{paths.specs}}/<ID>-<slug>/close-summary.md" }
+  - { path: "docs/CHANGELOG.md" }
+  - { path: "docs/kaizen/lessons.md" }
   - { path: "{{paths.releases}}/<ID>/" }
   - { path: "docs/kaizen/<ID>.md" }
   - { path: "{{paths.constitution}}/CHANGELOG.md" }
@@ -20,6 +22,7 @@ capabilities: [read, search, edit, shell, mcp]
 templates:
   - rules/context.md
   - rules/spec-docs.md
+  - close/close-summary.md
   - close/release-notes.md
   - close/technical.md
   - close/kaizen.md
@@ -65,7 +68,9 @@ Then `{{script:status}} {{arg:spec}} closed` must be allowed (the spec is `verif
    followed, with the mean absolute error. Below the minimum (3 specs) write "insufficient data (minimum 3)" and
    propose nothing. Proposals are recommendations only: Mandao never changes the constants.
 3. **Learn:** 0–3 root-cause lessons, each with evidence. **Standardize:** 1–3 one-line edits, each for
-   approval. Write `docs/kaizen/<ID>.md` from `{{template:close/kaizen.md}}`.
+   approval. Version 1 spec: write `docs/kaizen/<ID>.md` from `{{template:close/kaizen.md}}`. Version 2
+   spec (`schema_version: 2` in story.md): write the `## Kaizen` section of `close-summary.md` from the same
+   guide, and append one line per approved lesson to `docs/kaizen/lessons.md`; write no `docs/kaizen/<ID>.md`.
 
 ## 2. Constitution and product impacts (single writer)
 
@@ -93,7 +98,22 @@ edge is drift and goes, explained, into the technical notes; a relabelled box is
 
 ## 5. Documents
 
-Following `{{template:rules/spec-docs.md}}` and `{{template:rules/doc-close.md}}` (summary first, evidence at the end), in `{{paths.releases}}/<ID>/`:
+Following `{{template:rules/spec-docs.md}}` and `{{template:rules/doc-close.md}}` (summary first, evidence at the end).
+
+**Version 2 spec:** the whole close is `close-summary.md`, from `{{template:close/close-summary.md}}`. Run
+`{{script:close-summary}} {{arg:spec}}` first: it writes the record, `## Outcome` (from `{{script:release-status}}`)
+and `## Delivery`; never edit those two. Then write the three sections it keeps, each one only when it has
+something to say:
+- `## For the PO` in `{{language.business}}`: business language, no code names, what the user gets now and
+  what is still pending, from the guide `{{template:close/release-notes.md}}`.
+- `## For developers` in `{{language.technical}}`: what was built per module, decisions, contract changes,
+  the drift from step 4, how to test, from the guide `{{template:close/technical.md}}`.
+- `## Kaizen` in `{{language.technical}}`: the headline numbers and the lessons from step 1.
+
+Version 2 writes no `{{paths.releases}}/<ID>/` and no `docs/kaizen/<ID>.md`. Never write an empty section or
+a field with `—`: leave it out.
+
+**Version 1 spec**, in `{{paths.releases}}/<ID>/`:
 - `technical.md` from `{{template:close/technical.md}}`, in `{{language.technical}}`.
 - `release-notes.md` from `{{template:close/release-notes.md}}`, in `{{language.business}}`, one row per
   criterion with the status from `{{script:release-status}} {{arg:spec}}` — never upgraded by hand.
@@ -120,8 +140,9 @@ For each tracker target (e.g. `jira:PROJ-123`, from `.mandao/sources.yml`):
    (PNG of the diagrams), updating the previous comment when the action is `update`.
 3. Record it: `{{script:close-summary}} {{arg:spec}} --published "<target>|comment|<id>|<hash>|<url>"`.
 
-Without a tracker MCP: the files in `{{paths.releases}}/<ID>/` are the publication; also print the
-release notes as a block the user can paste.
+Version 2: the payload is the `## For the PO` section of `close-summary.md`. Without a tracker MCP, that
+section (or, for version 1, the files in `{{paths.releases}}/<ID>/`) is the publication; also print it as a
+block the user can paste.
 
 **Approved from the terminal:** when `_log/approvals.yml` holds a `close` approval (`mandao approve
 <ID> close --items …`), apply exactly those items without asking again; anything not listed stays
@@ -129,10 +150,11 @@ unapplied and is reported.
 
 ## 8. Finish
 
-`{{script:close-summary}} {{arg:spec}} --closed` (it writes the record and the links to the documents
-the close produced; never edit it by hand), set `status: closed` in story.md, then commit everything
-close wrote on its own: `{{script:commit-spec}} {{arg:spec}} close` (the spec folder, `{{paths.releases}}/<ID>/`,
-`docs/kaizen/<ID>.md`, the constitution and changed module guides; a `docs` commit with `Refs: <ID>`,
+`{{script:close-summary}} {{arg:spec}} --closed` (it writes the record; for version 2 it also rewrites
+`## Outcome` and `## Delivery`, keeps your prose sections as they are, and upserts the spec's one line in
+`docs/CHANGELOG.md`; never edit the record by hand), set `status: closed` in story.md, then commit everything
+close wrote on its own: `{{script:commit-spec}} {{arg:spec}} close` (the spec folder, `docs/CHANGELOG.md`, `docs/kaizen/lessons.md`
+or, for version 1, `{{paths.releases}}/<ID>/` and `docs/kaizen/<ID>.md`, the constitution and changed module guides; a `docs` commit with `Refs: <ID>`,
 never pushed). Report: Kaizen headline, impacts applied, drift, where it was published, the commit.
 
 **Worktree** (`worktrees.cleanup` in `.mandao/config.yml`): after the spec's branch is merged, `ask`
diff --git a/core/templates/shared/rules/doc-close.md b/core/templates/shared/rules/doc-close.md
index 49fe99e..c70b8da 100644
--- a/core/templates/shared/rules/doc-close.md
+++ b/core/templates/shared/rules/doc-close.md
@@ -18,3 +18,15 @@ Applies the principles in `spec-docs.md`.
 - **Technical notes:** what was built per project and module, with the commits found by their trailers;
   decisions and pivots; contract changes; the built diagram against the approved one, explaining every
   node or edge `mandao run diagram-drift` reports; how to test; links.
+
+## Version 2: one document
+
+A version 2 spec's close is `close-summary.md` (template `close/close-summary.md`), and the sections above
+become its sections:
+- `## For the PO` follows the release-notes rules, in `language.business`.
+- `## For developers` follows the technical-notes rules, in `language.technical`.
+- `## Kaizen` follows the Kaizen rules, in `language.technical`; each approved lesson is also one line in
+  `docs/kaizen/lessons.md`.
+- `## Outcome` and `## Delivery` are written by `mandao run close-summary`, never by hand.
+- A section or field with nothing to say is left out: no empty section, no `—`.
+- Nothing is copied to `docs/releases/<ID>/` or `docs/kaizen/<ID>.md`.
diff --git a/core/templates/shared/rules/spec-docs.md b/core/templates/shared/rules/spec-docs.md
index 51db8cf..8241132 100644
--- a/core/templates/shared/rules/spec-docs.md
+++ b/core/templates/shared/rules/spec-docs.md
@@ -37,7 +37,7 @@ templates are skeletons and this file says what goes in each section.
 | `quickstart.md` | How can a PO check it by hand? (only when it has visible behavior) | specify; verify updates |
 | `tasks.md` | What work, in what order? | tasks |
 | `verify-report.md` | Does it do what was asked? | verify |
-| `close-summary.md` | What shipped? (generated record and links) | close |
+| `close-summary.md` | What shipped? (version 2: outcome, notes for the PO and for developers, Kaizen, delivery) | close |
 
 Where each fact lives:
 - **Clarifications** live only in `requirements.md` (`## Clarifications`); story and design link there.
diff --git a/src/cli/run-close.ts b/src/cli/run-close.ts
index 0175636..d82a0b4 100644
--- a/src/cli/run-close.ts
+++ b/src/cli/run-close.ts
@@ -11,13 +11,14 @@ import { publishPlan } from '../scripts/publish.js';
 import { sizeLimits } from '../scripts/quick-check.js';
 import { measureSessions } from '../scripts/session-turns.js';
 import { findSpec, readSpec, type SpecFolder } from '../scripts/spec.js';
-import { docPath, dropLogCache, hasExecutionLog, logPath } from '../scripts/spec-log.js';
+import { docPath, dropLogCache, hasExecutionLog, logPath, specLogInCache } from '../scripts/spec-log.js';
 import { specSpend } from '../scripts/spend.js';
 import {
   acStatus,
   type BugsAfterMerge,
   type CloseLink,
   type CloseSummary,
+  changelogLine,
   compareTdd,
   costKaizen,
   impactItems,
@@ -26,9 +27,11 @@ import {
   parseCosts,
   planTasks,
   prPlan,
+  renderCloseDocument,
   renderCloseSummary,
   sessionCutKaizen,
   specMetrics,
+  upsertChangelog,
   verifyResults,
   withEnvironment,
   withPublication,
@@ -168,10 +171,16 @@ function updatedSummary(config: ReturnType<typeof readConfig>, spec: SpecFolder,
 /** Links to what the close produced, only for files that exist, relative to the spec folder. */
 function closeLinks(root: string, config: ReturnType<typeof readConfig>, spec: SpecFolder): CloseLink[] {
   const id = spec.story?.meta.id ?? spec.name;
+  // A version 2 close is the summary itself: no per-spec release or Kaizen document to point to (MDO-0011 D5).
+  const perSpec = specLogInCache(spec.dir)
+    ? []
+    : [
+        { label: 'Release notes', file: join(root, config.paths.releases, id, 'release-notes.md') },
+        { label: 'Technical notes', file: join(root, config.paths.releases, id, 'technical.md') },
+        { label: 'Kaizen', file: join(root, 'docs', 'kaizen', `${id}.md`) },
+      ];
   const candidates = [
-    { label: 'Release notes', file: join(root, config.paths.releases, id, 'release-notes.md') },
-    { label: 'Technical notes', file: join(root, config.paths.releases, id, 'technical.md') },
-    { label: 'Kaizen', file: join(root, 'docs', 'kaizen', `${id}.md`) },
+    ...perSpec,
     { label: 'Verify report', file: join(spec.dir, 'verify-report.md') },
     { label: 'Quickstart', file: join(spec.dir, 'quickstart.md') },
   ];
@@ -180,6 +189,25 @@ function closeLinks(root: string, config: ReturnType<typeof readConfig>, spec: S
     .map((c) => ({ label: c.label, href: relative(spec.dir, c.file).split(sep).join('/') }));
 }
 
+/** The Outcome section: each criterion as `release-status` reports it, never upgraded by hand. */
+function outcomeOf(config: ReturnType<typeof readConfig>, spec: SpecFolder): string[] {
+  if (!spec.story) return [];
+  const committed = commitState(spec, config.commits.trailers).committed;
+  const verify = verifyResults(readIf(join(spec.dir, 'verify-report.md')));
+  return acStatus(spec.story, spec.tasks, spec.execution, committed, verify).map((c) => `- ${c.ref}: ${c.status} (${c.why})`);
+}
+
+/** A version 2 close writes the document and, once closed, the spec's one CHANGELOG line (MDO-0011 D5). */
+function writeCloseDocument(root: string, config: ReturnType<typeof readConfig>, spec: SpecFolder, summary: CloseSummary) {
+  const file = join(spec.dir, 'close-summary.md');
+  writeText(file, renderCloseDocument(summary, readIf(file), outcomeOf(config, spec), closeLinks(root, config, spec)));
+  if (!summary.closed_at || !spec.story) return;
+  const log = join(root, 'docs', 'CHANGELOG.md');
+  const href = `${relative(join(root, 'docs'), spec.dir).split(sep).join('/')}/`;
+  const line = changelogLine(spec.story.meta.id, spec.story.title, spec.story.meta.type, summary.closed_at, href);
+  writeText(log, upsertChangelog(readIf(log), spec.story.meta.id, line));
+}
+
 function registerSummary(run: Command, ctx: CliContext) {
   run
     .command('close-summary <spec>')
@@ -194,7 +222,8 @@ function registerSummary(run: Command, ctx: CliContext) {
       const config = readConfig(ctx.root());
       const spec = readSpec(findSpec(ctx.root(), config, ref));
       const summary = updatedSummary(config, spec, o);
-      writeText(join(spec.dir, 'close-summary.md'), renderCloseSummary(summary, closeLinks(ctx.root(), config, spec)));
+      if (specLogInCache(spec.dir)) writeCloseDocument(ctx.root(), config, spec, summary);
+      else writeText(join(spec.dir, 'close-summary.md'), renderCloseSummary(summary, closeLinks(ctx.root(), config, spec)));
       // A version 2 spec's local cache goes at close, unless `logs.level: full` keeps it (MDO-0011 D3).
       if (o.closed) dropLogCache(spec.dir, config.logs.level);
       json(summary);
@@ -270,6 +299,15 @@ function registerPublish(run: Command, ctx: CliContext) {
       const config = readConfig(ctx.root());
       const spec = readSpec(findSpec(ctx.root(), config, ref));
       const id = spec.story?.meta.id ?? spec.name;
-      json(publishPlan(ctx.root(), join(ctx.root(), config.paths.releases, id), spec.dir, o.target, summaryOf(spec)));
+      json(
+        publishPlan(
+          ctx.root(),
+          join(ctx.root(), config.paths.releases, id),
+          spec.dir,
+          o.target,
+          summaryOf(spec),
+          specLogInCache(spec.dir) ? 2 : 1,
+        ),
+      );
     });
 }
diff --git a/src/scripts/publish.ts b/src/scripts/publish.ts
index 0f71361..27dbc4c 100644
--- a/src/scripts/publish.ts
+++ b/src/scripts/publish.ts
@@ -1,7 +1,7 @@
 import { createHash } from 'node:crypto';
 import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
 import { join, relative } from 'node:path';
-import type { CloseSummary } from '../spec/index.js';
+import { type CloseSummary, sectionOf } from '../spec/index.js';
 
 export interface PublishPayload {
   target: string;
@@ -37,12 +37,30 @@ function attachments(root: string, dirs: string[]): PublishPayload['attachments'
     .map((file) => ({ path: relative(root, file), bytes: statSync(file).size, sha256: sha(readFileSync(file)) }));
 }
 
+/** A version 2 spec publishes the `For the PO` section of its `close-summary.md`; a version 1 spec, its release notes. */
+function notesText(root: string, releaseDir: string, specDir: string, version: 1 | 2): string {
+  if (version === 1) {
+    const notes = join(releaseDir, 'release-notes.md');
+    if (!existsSync(notes)) throw new Error(`${relative(root, notes)} does not exist: close writes the release notes first`);
+    return readFileSync(notes, 'utf8');
+  }
+  const file = join(specDir, 'close-summary.md');
+  const text = existsSync(file) ? sectionOf(readFileSync(file, 'utf8'), 'For the PO')?.trim() : undefined;
+  if (!text) throw new Error(`${relative(root, file)} has no "For the PO" section: close writes it first`);
+  return `${text}\n`;
+}
+
 /** What would be published to `target`, and whether it is new, changed or already there. */
-export function publishPlan(root: string, releaseDir: string, specDir: string, target: string, summary: CloseSummary): PublishPlan {
-  const notes = join(releaseDir, 'release-notes.md');
-  if (!existsSync(notes)) throw new Error(`${relative(root, notes)} does not exist: close writes the release notes first`);
-  const text = readFileSync(notes, 'utf8');
-  const files = attachments(root, [releaseDir, join(specDir, 'diagrams')]);
+export function publishPlan(
+  root: string,
+  releaseDir: string,
+  specDir: string,
+  target: string,
+  summary: CloseSummary,
+  version: 1 | 2 = 1,
+): PublishPlan {
+  const text = notesText(root, releaseDir, specDir, version);
+  const files = attachments(root, version === 1 ? [releaseDir, join(specDir, 'diagrams')] : [join(specDir, 'diagrams')]);
   const hash = sha(JSON.stringify({ text, files: files.map((f) => f.sha256) }));
   const payload: PublishPayload = { target, kind: 'comment', text, attachments: files, hash };
   const previous = summary.published.find((p) => p.target === target && p.kind === 'comment');
diff --git a/src/spec/AGENTS.md b/src/spec/AGENTS.md
index 1e1c174..8205bd4 100644
--- a/src/spec/AGENTS.md
+++ b/src/spec/AGENTS.md
@@ -19,3 +19,4 @@ The CLI and scripts gather inputs; writer helpers own persistence.
 - `costs.ts`: in a version 2 spec a new `costs.yml` entry keeps `cumulative` per role only (C-2); the per-model baseline is derived from the session's earlier `models` (`sessionModelTotals`). A version 1 spec, and the quick folder, keep the `model:` lines in `cumulative`. On both versions the per-model part of a new entry is measured against the `model:` lines of the session's last `cumulative` when it has them (version 1: the same numbers as before), else against `sessionModelTotals`, so a version 2 record followed by a version 1 or quick record in the same session is not counted twice.
 - Six-file log (version 2, D3): `_log/` holds only `state.yml`, `execution.md`, `reviews.md`, `gates.md`, `premises.md` and `costs.yml`. `specLogInCache(dir)` (in `src/scripts/spec-log.ts`) picks the layout with `keepsLogCache` from `src/schemas/spec.ts`, the predicate the writer's integrity routing uses too (a quoted or unknown `schema_version` is version 1 for both); `LAYOUT_VERSIONS` and `STORY_ID` are written once there; `writeLogSection`/`logSections` read and write the merged files as `## Tn — attempt k` (reviews, `(via <harness>)` for a process review; gates) and `## Pn — run` (premises) sections, and the first state or section write creates the empty `reviews.md`, `gates.md`, `premises.md` and `costs.yml` so the six are always there. `gates.md` keeps the status table and, for FAIL/TIMEOUT gates only, at most 40 lines naming the task's files (the tail when none does; a repeat of an earlier attempt's same lines is a pointer to it); `premises.md` keeps claim, command, sha, exit and 20 lines. Everything else goes to `.mandao/cache/<ID>/` (`cachePath`, git-ignored by the managed `.gitignore` block): packs, full gate output, probes and their scratch, mutations, discrepancies and `integrity.json`. Full runs are a `## Full runs` section of `execution.md`. `run close-summary --closed` deletes the cache (`dropLogCache`) unless `logs.level: full`; a story id that is not a story id (`..`, a path) makes it throw rather than delete anything. A version 1 spec keeps every per-attempt file exactly as before; `test/integration/log-v2.test.ts` runs one history on both versions and compares every reader.
 - `review-findings.ts`: `securityBlockers` counts the `[security/high|critical]` lines of the answer's `Findings` sections only (an ATX heading whose text is `Findings`, optional colon, any level, up to the next heading of the same or a higher level; a nested `Findings` keeps the outer one open), so a rework PASS that recaps an earlier attempt's finding as fixed is not refused; without such a heading every tagged line counts (fails closed). A heading counts only as Markdown renders it: at most 3 leading spaces, outside fenced code (a fence closes on its own character, at least as long) and outside `<!-- … -->`. `untaggedSecurityMentions` reads every line.
+- `close-summary.ts` (D5): a version 2 `close-summary.md` is the record (frontmatter, now with `applied`) plus `## Outcome`, `## For the PO`, `## For developers`, `## Kaizen`, `## Delivery`. `renderCloseDocument` rewrites only Outcome (from `release-status`) and Delivery (from the record) and keeps the three prose sections the agent wrote (`sectionOf`); a section or field with nothing to say is left out, never written empty or as `—`. `run close-summary --closed` upserts the spec's one `docs/CHANGELOG.md` line (`changelogLine`, `upsertChangelog`) and writes no `docs/releases/<ID>/` or `docs/kaizen/<ID>.md`; approved lessons go to `docs/kaizen/lessons.md`. `publishPlan` posts `## For the PO` for version 2 and `release-notes.md` for version 1. Version 1 keeps `renderCloseSummary` unchanged.
diff --git a/src/spec/close-summary.ts b/src/spec/close-summary.ts
index d575f2a..70d12c5 100644
--- a/src/spec/close-summary.ts
+++ b/src/spec/close-summary.ts
@@ -27,6 +27,8 @@ export const closeSummarySchema = z.object({
       }),
     )
     .default([]),
+  /** Files outside the spec folder that close applied with approval; the close commit stages them (MDO-0011 D6). */
+  applied: z.array(z.string().min(1)).default([]),
 });
 export type CloseSummary = z.infer<typeof closeSummarySchema>;
 
@@ -66,3 +68,64 @@ export function withEnvironment(s: CloseSummary, name: string, source: 'ci' | 't
 export function withPublication(s: CloseSummary, p: CloseSummary['published'][number]): CloseSummary {
   return { ...s, published: [...s.published.filter((x) => !(x.target === p.target && x.kind === p.kind)), p] };
 }
+
+/** The prose sections close writes by hand: `run close-summary` keeps them byte for byte. */
+const PROSE = ['For the PO', 'For developers', 'Kaizen'] as const;
+
+/** The body of a `## <heading>` section: from the line after it to the next `## ` heading; undefined when absent. */
+export function sectionOf(text: string | undefined, heading: string): string | undefined {
+  if (!text) return undefined;
+  const start = text.split(/^---\n[\s\S]*?\n---\n/)[1] ?? text;
+  const found = start
+    .split(/^## /m)
+    .slice(1)
+    .find((s) => s.split('\n')[0]?.trim() === heading);
+  return found?.slice(found.indexOf('\n') + 1);
+}
+
+const joined = (items: string[]) => items.join(', ');
+
+/** Delivery lines, only for what the record holds: no field is written empty (S-4.3). */
+function deliveryLines(s: CloseSummary, links: CloseLink[]): string[] {
+  return [
+    ...(s.closed_at ? [`- Closed: ${s.closed_at}`] : []),
+    ...(s.release ? [`- Release: ${s.release.branch} (${s.release.how})`] : []),
+    ...(s.environments.length ? [`- Environments: ${joined(s.environments.map((e) => `${e.name} (${e.source}, ${e.at})`))}`] : []),
+    ...(s.published.length ? [`- Published: ${joined(s.published.map((p) => `${p.target} ${p.kind} ${p.id}`))}`] : []),
+    ...(s.applied.length ? [`- Applied: ${joined(s.applied.map((a) => `\`${a}\``))}`] : []),
+    ...links.map((l) => `- [${l.label}](${l.href})`),
+  ];
+}
+
+/**
+ * A version 2 `close-summary.md`: the record as frontmatter, then `Outcome` and `Delivery` rewritten from it and from
+ * `release-status`, and the prose sections (`For the PO`, `For developers`, `Kaizen`) kept as `existing` has them.
+ * A section with nothing to say is left out, never written empty.
+ */
+export function renderCloseDocument(s: CloseSummary, existing: string | undefined, outcome: string[], links: CloseLink[] = []): string {
+  const prose = PROSE.map((name): [string, string | undefined] => [name, sectionOf(existing, name)?.trim()]);
+  const parts: [string, string | undefined][] = [
+    ['Outcome', outcome.join('\n')],
+    ...prose,
+    ['Delivery', deliveryLines(s, links).join('\n')],
+  ];
+  const body = parts.filter(([, text]) => text).map(([name, text]) => `## ${name}\n\n${text}\n\n`);
+  return `---\n${stringifyYaml(s, { lineWidth: 0 })}---\n\n# Close — ${s.spec}\n\n${body.join('')}`.replace(/\n+$/, '\n');
+}
+
+const CHANGELOG_HEAD =
+  '# Changelog\n\nOne line per closed spec, newest last.\n\n| Spec | Title | Type | Closed | Folder |\n|---|---|---|---|---|\n';
+
+/** The one CHANGELOG line of a spec: ID, title, type, closed date and a link to its folder. */
+export function changelogLine(id: string, title: string, type: string, closedAt: string, href: string): string {
+  return `| ${id} | ${title.replaceAll('|', '\\|')} | ${type} | ${closedAt.slice(0, 10)} | [spec](${href}) |`;
+}
+
+/** Puts `line` in the CHANGELOG once per ID: a second close replaces it, a new spec appends. */
+export function upsertChangelog(text: string | undefined, id: string, line: string): string {
+  const lines = (text ?? CHANGELOG_HEAD).replace(/\n*$/, '\n').split('\n');
+  const at = lines.findIndex((l) => l.startsWith(`| ${id} |`));
+  if (at >= 0) lines[at] = line;
+  else lines.splice(lines.length - 1, 0, line);
+  return lines.join('\n');
+}
diff --git a/test/integration/close.test.ts b/test/integration/close.test.ts
index 9a43cfc..6d39de9 100644
--- a/test/integration/close.test.ts
+++ b/test/integration/close.test.ts
@@ -1,11 +1,12 @@
 import { execFileSync } from 'node:child_process';
-import { cpSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
+import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
 import { join } from 'node:path';
 import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
 import { configSchema } from '../../src/schemas/index.js';
 import { fixCommitsAfter, releaseBranchesContaining } from '../../src/scripts/close.js';
 import { parseCloseSummary, renderCloseSummary, withEnvironment, withPublication } from '../../src/spec/index.js';
 import { makeTree, pkg } from '../helpers.js';
+import { repo, run, useLogEnv, SPEC as V2_SPEC } from '../log-v2-helpers.js';
 
 const trailers = configSchema.parse({ schema_version: 1, workspace: 'single', projects: [{ name: 'p', path: '.' }], harnesses: ['claude'] })
   .commits.trailers;
@@ -206,3 +207,84 @@ describe('Kaizen shows the sessions (MDO-0008 S-3.1)', () => {
     expect(readFileSync(join(root, '.mandao/templates/app/close/kaizen.md'), 'utf8')).toContain('## Sessions');
   });
 });
+
+describe('a version 2 close is one document inside the spec (MDO-0011 AC-4)', () => {
+  useLogEnv();
+  const PO = 'Ya puedes ver tus habilidades fijadas.\n';
+  const DEV = 'The `skills list` command reads the lock.\n';
+  const seed = (root: string) => {
+    const file = join(root, V2_SPEC, 'close-summary.md');
+    writeFileSync(
+      file,
+      `---\nschema_version: 1\nspec: MDO-0001-skills-list\napplied: []\n---\n\n# Close — MDO-0001-skills-list\n\n## Outcome\n\nstale\n\n## For the PO\n\n${PO}\n## For developers\n\n${DEV}\n## Kaizen\n\nOne lesson.\n\n## Delivery\n\nstale\n`,
+    );
+    return file;
+  };
+  const sections = (text: string): Record<string, string> =>
+    Object.fromEntries(
+      text
+        .split(/^## /m)
+        .slice(1)
+        .map((s) => [s.split('\n')[0], s.split('\n').slice(1).join('\n')]),
+    );
+  const changelogLines = (root: string) =>
+    readFileSync(join(root, 'docs/CHANGELOG.md'), 'utf8')
+      .split('\n')
+      .filter((l) => l.includes('MDO-0001'));
+
+  test('S-4.1: the summary has the five sections, CHANGELOG has one line, and no per-spec release or kaizen document exists', async () => {
+    const root = repo(2);
+    const file = seed(root);
+    await run(root, 'close-summary', 'MDO-0001', '--closed');
+    const text = readFileSync(file, 'utf8');
+    expect([...text.matchAll(/^## (.+)$/gm)].map((m) => m[1])).toEqual(['Outcome', 'For the PO', 'For developers', 'Kaizen', 'Delivery']);
+    expect(sections(text).Outcome).toContain('AC-1');
+    const lines = changelogLines(root);
+    expect(lines).toHaveLength(1);
+    expect(lines[0]).toContain('List the skills pinned in a workspace');
+    expect(lines[0]).toContain('story');
+    expect(lines[0]).toContain('[spec](../specs/MDO-0001-skills-list/)');
+    expect(existsSync(join(root, 'docs/releases/MDO-0001'))).toBe(false);
+    expect(existsSync(join(root, 'docs/kaizen/MDO-0001.md'))).toBe(false);
+  });
+
+  test('S-4.1/C2: the summary points to no docs/releases or docs/kaizen file', async () => {
+    const root = repo(2);
+    const file = seed(root);
+    await run(root, 'close-summary', 'MDO-0001', '--closed');
+    expect(readFileSync(file, 'utf8')).not.toMatch(/docs\/releases|docs\/kaizen\/MDO-0001/);
+    expect(changelogLines(root)).toHaveLength(1);
+  });
+
+  test('S-4.3: with no environment and no publication, no `—` field and no empty section is written', async () => {
+    const root = repo(2);
+    const file = seed(root);
+    await run(root, 'close-summary', 'MDO-0001', '--closed');
+    const text = readFileSync(file, 'utf8');
+    expect(text).not.toMatch(/:\s*—/);
+    expect(text).not.toMatch(/^- Release:|^- Environments:|^- Published:/m);
+    for (const [name, body] of Object.entries(sections(text))) expect(body.trim(), name).not.toBe('');
+  });
+
+  test('S-4.4: a second --closed keeps For the PO byte-identical and CHANGELOG with a single line', async () => {
+    const root = repo(2);
+    const file = seed(root);
+    await run(root, 'close-summary', 'MDO-0001', '--closed');
+    const first = readFileSync(file, 'utf8');
+    await run(root, 'close-summary', 'MDO-0001', '--closed');
+    const second = readFileSync(file, 'utf8');
+    expect(sections(second)['For the PO']).toBe(`\n${PO}\n`);
+    expect(sections(second)['For the PO']).toBe(sections(first)['For the PO']);
+    expect(sections(second)['For developers']).toBe(sections(first)['For developers']);
+    expect(changelogLines(root)).toHaveLength(1);
+  });
+
+  test('AC-4: publish-plan for a version 2 spec posts For the PO from close-summary.md, with no docs/releases', async () => {
+    const root = repo(2);
+    seed(root);
+    const plan = await run(root, 'publish-plan', 'MDO-0001', '--target', 'jira:PROJ-1');
+    expect(plan.payload.text).toContain('Ya puedes ver tus habilidades fijadas.');
+    expect(plan.payload.text).not.toContain('reads the lock');
+    expect(existsSync(join(root, 'docs/releases/MDO-0001'))).toBe(false);
+  });
+});
diff --git a/test/unit/content.test.ts b/test/unit/content.test.ts
index 627fec7..995d9f0 100644
--- a/test/unit/content.test.ts
+++ b/test/unit/content.test.ts
@@ -263,5 +263,62 @@ describe('core content', () => {
       const tpl = readFileSync(join(process.cwd(), 'core/templates/shared/spec/story.md'), 'utf8');
       expect(frontmatterOf(tpl).data.schema_version).toBe(2);
     });
+    /** MDO-0011 T5: the whole close is one document inside the spec (AC-4). */
+    describe('close writes one close-summary.md (AC-4)', () => {
+      const config = (business: string, technical: string) =>
+        configSchema.parse({
+          schema_version: 1,
+          workspace: 'single',
+          projects: [{ name: 'a', path: '.', profile: 'app' }],
+          harnesses: ['claude'],
+          language: { business, technical },
+        });
+      const closeCommand = (business: string, technical: string) => {
+        const { files } = buildOutputs(config(business, technical), {}, layers, '0.0.0', 'project');
+        const f = files.find((x) => /mandao-close(\/SKILL\.md|\.md)$/.test(x.path));
+        expect(f, 'mandao-close').toBeDefined();
+        return f!.content;
+      };
+      const template = () => readFileSync(join(process.cwd(), 'core/templates/shared/close/close-summary.md'), 'utf8');
+
+      test('S-4.2: with business es and technical en, the close command writes For the PO in es and For developers in en', () => {
+        const text = closeCommand('es', 'en');
+        expect(text).toMatch(/For the PO[^\n]*\bes\b/);
+        expect(text).toMatch(/For developers[^\n]*\ben\b/);
+      });
+
+      test('S-4.2/C1: the languages come from the configuration, not fixed in the text', () => {
+        const text = closeCommand('fr', 'de');
+        expect(text).toMatch(/For the PO[^\n]*\bfr\b/);
+        expect(text).toMatch(/For developers[^\n]*\bde\b/);
+        expect(text).not.toMatch(/For the PO[^\n]*\bes\b/);
+      });
+
+      test('S-4.2: the template has the five sections in order and names each prose language by its setting', () => {
+        const tpl = template();
+        const heads = [...tpl.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
+        expect(heads).toEqual(['Outcome', 'For the PO', 'For developers', 'Kaizen', 'Delivery']);
+        expect(tpl).toMatch(/language\.business/);
+        expect(tpl).toMatch(/language\.technical/);
+      });
+
+      test('S-4.3/C2: the template and the command seed no empty field and no `—` placeholder', () => {
+        expect(template()).not.toMatch(/^- [A-Za-z ]+: —\s*$/m);
+        expect(closeCommand('es', 'en')).toMatch(/(no|never|not)[^\n]*(empty|—)/i);
+      });
+
+      test('AC-4: the close command writes the CHANGELOG line and the lessons, not docs/releases or docs/kaizen per spec', () => {
+        const text = closeCommand('es', 'en');
+        expect(text).toContain('docs/CHANGELOG.md');
+        expect(text).toContain('docs/kaizen/lessons.md');
+        expect(text).toMatch(/version 2[^\n]*(no|not|never)[^\n]*docs\/releases/i);
+      });
+
+      test('AC-4: spec-docs.md no longer says close-summary.md is the "generated record and links"', () => {
+        const rule = readFileSync(join(process.cwd(), 'core/templates/shared/rules/spec-docs.md'), 'utf8');
+        expect(rule).not.toContain('generated record and links');
+        expect(rule).toMatch(/close-summary\.md[^\n]*(PO|developers|Kaizen)/);
+      });
+    });
   });
 });

--- /dev/null
+++ b/.mandao/templates/app/close/close-summary.md (new file)
---
schema_version: 1
spec: <ID>-<slug>
applied: []
---

# Close — <ID>-<slug>

<2–3 lines: what shipped and what a reader must know first.>

## Outcome

<Written by `mandao run close-summary` from `release-status`: one line per criterion. Never edit it.>

## For the PO

<In `language.business`: 2–3 lines on what the user gets now, then what is not done yet and what happens next. No code names.>

## For developers

<In `language.technical`: what was built per module, decisions and pivots, contract changes, the drift, how to test.>

## Kaizen

<In `language.technical`: the headline numbers and the 0–3 lessons, each with its evidence.>

## Delivery

<Written by `mandao run close-summary` from the record: closed time, release branch, environments, publications, applied edits. A field with nothing to show is left out. Never edit it.>

--- /dev/null
+++ b/core/templates/shared/close/close-summary.md (new file)
---
schema_version: 1
spec: <ID>-<slug>
applied: []
---

# Close — <ID>-<slug>

<2–3 lines: what shipped and what a reader must know first.>

## Outcome

<Written by `mandao run close-summary` from `release-status`: one line per criterion. Never edit it.>

## For the PO

<In `language.business`: 2–3 lines on what the user gets now, then what is not done yet and what happens next. No code names.>

## For developers

<In `language.technical`: what was built per module, decisions and pivots, contract changes, the drift, how to test.>

## Kaizen

<In `language.technical`: the headline numbers and the 0–3 lessons, each with its evidence.>

## Delivery

<Written by `mandao run close-summary` from the record: closed time, release branch, environments, publications, applied edits. A field with nothing to show is left out. Never edit it.>

--- /dev/null
+++ b/docs/CHANGELOG.md (new file)
# Changelog

One line per closed spec, newest last.

| Spec | Title | Type | Closed | Folder |
|---|---|---|---|---|

--- /dev/null
+++ b/docs/kaizen/lessons.md (new file)
# Kaizen lessons

One line per approved lesson, newest last: `<ID> — <lesson>`.

```
