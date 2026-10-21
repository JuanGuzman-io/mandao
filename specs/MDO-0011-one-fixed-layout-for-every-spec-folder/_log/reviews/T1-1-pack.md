# Review pack — T1, attempt 1

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T1-1.md`.

## Brief

```json
{
  "spec": "MDO-0011-one-fixed-layout-for-every-spec-folder",
  "task": {
    "project": "mandao",
    "kind": "feat",
    "tier": "standard",
    "files": [
      "src/spec/layout.ts",
      "src/spec/index.ts",
      "src/spec/story.ts",
      "src/spec/trace.ts",
      "src/spec/release.ts",
      "src/schemas/story.ts",
      "src/scripts/spec.ts",
      "src/cli/run-spec.ts",
      "docs/spec-anatomy.md",
      "README.md",
      "docs/cli.md",
      "docs/decisions/0041-spec-folder-layout-v2.md",
      "docs/decisions/README.md",
      "test/unit/layout.test.ts",
      "test/integration/layout.test.ts"
    ],
    "exemplar": "src/spec/next.ts",
    "ac": [
      "AC-2",
      "AC-2/C1"
    ],
    "scenarios": [
      "S-2.1",
      "S-2.2",
      "S-2.3",
      "S-2.3/C1",
      "S-8.1"
    ],
    "test_levels": {
      "S-2.1": "e2e",
      "S-2.2": "e2e",
      "S-2.3": "e2e",
      "S-2.3/C1": "unit",
      "S-8.1": "unit"
    },
    "evidence": "tdd",
    "risk_tags": [
      "public-api"
    ],
    "depends_on": [],
    "parallel_safe": false,
    "verify": "npx vitest run test/unit/layout.test.ts test/integration/layout.test.ts",
    "tests": {
      "unit": [
        "S-2.3/C1",
        "S-8.1"
      ],
      "e2e": [
        "S-2.1",
        "S-2.2",
        "S-2.3"
      ]
    },
    "dod": [],
    "characterization": false,
    "id": "T1",
    "title": "Mandao checks every spec folder against one layout per depth",
    "done": false,
    "line": 58
  },
  "acceptance": [
    {
      "ref": "AC-2",
      "text": "**GIVEN** a spec folder and the published layout for its depth · **WHEN** the layout check runs, or close starts · **THEN** the check names every missing and every unexpected file, and close refuses a folder that does not match · **AND IT MUST** accept an older spec in its own format, recognised by its `schema_version`"
    },
    {
      "ref": "AC-2/C1",
      "text": "**AND IT MUST** accept an older spec in its own format, recognised by its `schema_version`"
    }
  ],
  "scenarios": [
    {
      "ref": "S-2.1",
      "text": "**Given** a verified standard version 2 spec without `design.md` and with a stray `notes.md` · **When** `mandao run layout` runs · **Then** `missing` names `design.md`, `unexpected` names `notes.md`, and `ok` is false"
    },
    {
      "ref": "S-2.2",
      "text": "**Given** the same spec · **When** `mandao run status <ID> closed` runs · **Then** it is not allowed, and the problem names the layout findings"
    },
    {
      "ref": "S-2.3",
      "text": "**Given** MDO-0001, a version 1 spec with execution.md and progress.yml at its root · **When** `mandao run layout` runs · **Then** `ok` is true against the version 1 manifest, which lists the files version 1 allowed"
    },
    {
      "ref": "S-2.3/C1",
      "text": "**Then** `ok` is true against the version 1 manifest, which lists the files version 1 allowed"
    },
    {
      "ref": "S-8.1",
      "text": "**Given** the manifest in code · **When** the content test renders the page's table · **Then** it lists the same files per depth"
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
    "task": "T1",
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
      "test/unit/session-turns.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ],
    "files": [
      "src/spec/layout.ts",
      "src/spec/index.ts",
      "src/spec/story.ts",
      "src/spec/trace.ts",
      "src/spec/release.ts",
      "src/schemas/story.ts",
      "src/scripts/spec.ts",
      "src/cli/run-spec.ts",
      "docs/spec-anatomy.md",
      "README.md",
      "docs/cli.md",
      "docs/decisions/0041-spec-folder-layout-v2.md",
      "docs/decisions/README.md",
      "test/unit/layout.test.ts",
      "test/integration/layout.test.ts",
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
      "test/unit/session-turns.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related src/spec/layout.ts src/spec/index.ts src/spec/story.ts src/spec/trace.ts src/spec/release.ts src/schemas/story.ts src/scripts/spec.ts src/cli/run-spec.ts docs/spec-anatomy.md README.md docs/cli.md docs/decisions/0041-spec-folder-layout-v2.md docs/decisions/README.md test/unit/layout.test.ts test/integration/layout.test.ts test/integration/approve.test.ts test/integration/branching.test.ts test/integration/characterization.test.ts test/integration/cli.test.ts test/integration/close.test.ts test/integration/costs.test.ts test/integration/doctor-cli.test.ts test/integration/enforced-rules.test.ts test/integration/engine.test.ts test/integration/leader-scripts.test.ts test/integration/ledger.test.ts test/integration/lite-spec.test.ts test/integration/mdo-0004-defects.test.ts test/integration/mdo-0005-defects.test.ts test/integration/mdo-0006-defects.test.ts test/integration/premise.test.ts test/integration/review.test.ts test/integration/scripts.test.ts test/integration/shadow.test.ts test/integration/spec-log.test.ts test/integration/start.test.ts test/integration/tdd.test.ts test/integration/where.test.ts test/unit/commits-times.test.ts test/unit/diagram.test.ts test/unit/doctor-cache.test.ts test/unit/doctor-report.test.ts test/unit/kaizen-sessions.test.ts test/unit/kaizen.test.ts test/unit/next.test.ts test/unit/pr-plan.test.ts test/unit/release.test.ts test/unit/render.test.ts test/unit/session-advice.test.ts test/unit/session-turns.test.ts test/unit/spec.test.ts test/unit/task-index.test.ts test/unit/verify.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": [
      "src/cli/approve.ts",
      "src/cli/checkpoint-guards.ts",
      "src/cli/run-close.ts",
      "src/cli/run-cost.ts",
      "src/cli/run-diagram.ts",
      "src/cli/run-leader.ts",
      "src/cli/run-ledger.ts",
      "src/cli/run-mutation.ts",
      "src/cli/run-premise.ts",
      "src/cli/run-red.ts",
      "src/cli/run-review.ts",
      "src/cli/run-verify.ts",
      "src/cli/run.ts",
      "src/cli/session-advice.ts",
      "src/cli/spec-context.ts",
      "src/cli/start.ts",
      "src/cli/worktree.ts",
      "src/engine/doctor-models.ts",
      "src/engine/doctor-specs.ts",
      "src/scripts/brief.ts",
      "src/scripts/checkpoint.ts",
      "src/scripts/commits.ts",
      "src/scripts/forced.ts",
      "src/scripts/publish.ts",
      "src/scripts/red.ts",
      "src/scripts/review.ts",
      "src/scripts/session-turns.ts",
      "src/scripts/spend.ts",
      "src/spec/commit.ts",
      "src/spec/next.ts",
      "src/spec/premises.ts",
      "src/spec/task-index.ts",
      "src/spec/verify.ts",
      "test/integration/approve.test.ts",
      "test/integration/branching.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/close.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/enforced-rules.test.ts",
      "test/integration/ledger.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/scripts.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/diagram.test.ts",
      "test/unit/kaizen.test.ts",
      "test/unit/next.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/release.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/unit/layout.test.ts",
      "test/integration/layout.test.ts"
    ],
    "changed": [
      "test/unit/layout.test.ts"
    ]
  }
}
```

## Gates — T1, attempt 1

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
diff --git a/README.md b/README.md
index 99933b4..f3cce66 100644
--- a/README.md
+++ b/README.md
@@ -27,7 +27,7 @@
 
 AI agents write code fast. They also guess, skip tests, and say "done" when it isn't. Mandao gives every piece of work a clear errand — a spec — and doesn't sign off until there's a receipt.
 
-- **Specs your PO can read.** Stories with acceptance criteria, traced to requirements, tasks, tests and commits.
+- **Specs your PO can read.** Stories with acceptance criteria, traced to requirements, tasks, tests and commits. Every spec folder follows one fixed layout per depth: see [spec anatomy](docs/spec-anatomy.md).
 - **A reviewer that isn't the author.** Every task is reviewed by a separate agent in a clean context — a different model or a different harness when one is available, and the record says when it isn't.
 - **Tests before code (TDD).** Write a failing test from the spec, make it pass, then refactor. Mandao requires recorded red evidence before implementation where TDD applies: the test demonstrates the missing behavior before the code addresses it, keeping implementation tied to the spec. [TDD in the task flow](#test-driven-development-tdd).
 - **One flow, any harness.** Claude Code, Codex, OpenCode, Copilot. Out of tokens mid-spec? Switch tools and run `/mandao-resume`.
diff --git a/docs/cli.md b/docs/cli.md
index a665be0..d03091f 100644
--- a/docs/cli.md
+++ b/docs/cli.md
@@ -17,6 +17,7 @@
 | `mandao worktree list \| clean` | Spec worktrees; `clean` removes only merged ones that hold no work, never forced |
 | `mandao approve <spec> <step>` | Approve a step from the terminal, without a model session: `story`, `design`, `spec`, `tasks`, `close` (`--items`), `budget` (`--to <usd\|none>`) |
 | `mandao run cost <spec>` | Spend per command and role, with its basis (billed or subscription equivalent); see [Cost](#cost) |
+| `mandao run layout <spec>` | Compare the spec folder with the layout of its version and depth ([spec anatomy](spec-anatomy.md)): prints `{ version, depth, stage, missing, unexpected, ok }` and exits 1 when `ok` is false. `run status <spec> closed` refuses a folder that does not match, naming these findings |
 | `mandao run …` | Helper scripts the commands call, with compact JSON on stdout (`MANDAO_JSON=pretty` for people). `mandao run --help` lists them all: planning (`spec-new`, `trace`, `tasks`, `brief`), the Leader loop (`step`, `checkpoint`, `gates`, `review-pack`, `review`, `red`, `mutation`, `commit`, `implement-summary`), verify and close (`verify-plan`, `kaizen`, `impacts`, `publish-plan`, `pr-plan`), and tests under the resource budget (`impact`, `tests`, `build`, `resources`) |
 
 ## Entering the spec worktree
diff --git a/docs/decisions/README.md b/docs/decisions/README.md
index 48aaca6..1148506 100644
--- a/docs/decisions/README.md
+++ b/docs/decisions/README.md
@@ -47,3 +47,4 @@ Format: **Status**, **Context**, **Decision**, **Consequences**.
 | [0038](0038-session-cut-at-task-boundaries.md) | Cut the session at a task boundary when a new one is cheaper | Accepted |
 | [0039](0039-rules-enforced-by-scripts.md) | Rules the scripts enforce, not the text | Accepted |
 | [0040](0040-approval-by-running-the-next-command.md) | Approval by running the next command, unless something is open | Accepted |
+| [0041](0041-spec-folder-layout-v2.md) | Spec folder layout version 2 | Accepted |
diff --git a/src/cli/run-spec.ts b/src/cli/run-spec.ts
index 7664a5a..d0200d8 100644
--- a/src/cli/run-spec.ts
+++ b/src/cli/run-spec.ts
@@ -14,6 +14,8 @@ import { docPath, LITE_DOC } from '../scripts/spec-log.js';
 import {
   blockingMarkers,
   commitMessage,
+  layoutFindings,
+  layoutProblems,
   loopState,
   planTasks,
   TASK_KINDS,
@@ -158,6 +160,15 @@ function registerTaskScripts(run: Command, ctx: CliContext) {
     });
 }
 
+/** Close refuses a folder that does not match its layout; an unreadable version is a problem too. */
+function closeLayoutProblems(dir: string): string[] {
+  try {
+    return layoutProblems(layoutFindings(dir));
+  } catch (e) {
+    return [`layout: ${(e as Error).message}`];
+  }
+}
+
 /** Spec status changes and the worktree check. */
 function registerState(run: Command, ctx: CliContext) {
   run
@@ -168,10 +179,21 @@ function registerState(run: Command, ctx: CliContext) {
       const { spec } = loadSpec(ctx, ref);
       const from = spec.story?.meta.status ?? 'draft';
       const problems = checkTransition(from, to, spec.progress, Boolean(opts.ciConfirmed));
+      if (to === 'closed') problems.push(...closeLayoutProblems(spec.dir));
       json({ from, to, allowed: problems.length === 0, problems });
       if (problems.length) process.exitCode = 1;
     });
 
+  run
+    .command('layout <spec>')
+    .description('Compare the spec folder with the layout of its version and depth (missing, unexpected)')
+    .action((ref: string) => {
+      const { spec } = loadSpec(ctx, ref);
+      const found = layoutFindings(spec.dir);
+      json({ ...found });
+      if (!found.ok) process.exitCode = 1;
+    });
+
   run
     .command('where <spec>')
     .description('Is this session inside the spec worktree, on its branch? `resume` opens the active harness there')
diff --git a/src/spec/AGENTS.md b/src/spec/AGENTS.md
index a62c5a4..ab5a29f 100644
--- a/src/spec/AGENTS.md
+++ b/src/spec/AGENTS.md
@@ -13,3 +13,4 @@ The CLI and scripts gather inputs; writer helpers own persistence.
 - Unit-test decisions and integration-test recording through temporary workspaces made by `makeTree`.
 - `next.ts`: `nextStep` is pure and only recommends; it never offers implement before approval or past an open item (`NEEDS CLARIFICATION`, `CONFLICT` inline or as a Consistency Check row, a critical Consistency Check row, a pending decision; resolved rows are ignored). Lite is `spec.md` existing (`SpecFolder.lite`). Hashes ignore `status:` and `tasks.md`; a missing hash means no claim. Change-after-approval compares approval rows only; `shown` rows (`run next --shown`) are compared only by `approve --by-running`.
 - `next.ts` reads only real markers: `withoutCode` (`markdown.ts`) drops inline code spans and fenced blocks first, so a marker shown as an example is not an open item. A Consistency Check row is resolved when its Status starts with `resolved` (`core/templates/shared/rules/consistency-check.md`; a test pins both). A `verify-report.md` with `verdict: blocked` recommends implement, not verify. A closed spec skips the open-item check and recommends its delivery from git (`unpushed` → push, `pushed` → PR and merge, `merged` → `none`, no options); it never offers story or clarify. `nextFor` (`src/cli/approve.ts`) reads those facts from the spec's own branch (not HEAD); only `origin/<base>` counts as merged, and without git or the branch there is no delivery fact; naming the delivery performs nothing (MDO-0012).
+- `layout.ts`: `layoutManifest(version, depth)` is the one manifest behind `run layout`, the close gate (`run status <ID> closed`) and `docs/spec-anatomy.md`; the version is the story's `schema_version` (1 or 2, anything else throws), never a `layout:` key or the files present. `layoutFindings` reads the folder (the one file in this module that does IO, by design D1). An AC with `status: removed` is skipped by `trace` and `acStatus` (ADR 0041).
diff --git a/src/spec/index.ts b/src/spec/index.ts
index 720edd7..dbe1194 100644
--- a/src/spec/index.ts
+++ b/src/spec/index.ts
@@ -8,6 +8,7 @@ export * from './execution.js';
 export * from './kaizen.js';
 export * from './kaizen-costs.js';
 export * from './kaizen-sessions.js';
+export * from './layout.js';
 export * from './loop.js';
 export * from './markdown.js';
 export * from './next.js';
diff --git a/src/spec/release.ts b/src/spec/release.ts
index f65cfb9..bd6c4fc 100644
--- a/src/spec/release.ts
+++ b/src/spec/release.ts
@@ -42,21 +42,23 @@ export function acStatus(
   committed: Set<string>,
   verify: Map<string, string>,
 ): AcRelease[] {
-  return story.acs.map((ac) => {
-    const covering = tasks.filter((t) => t.ac.some((a) => a === ac.id || a.startsWith(`${ac.id}/`)));
-    const done = covering.filter((t) => finished(t, rows, committed));
-    const verified = verify.get(ac.id);
-    const base = { ref: ac.id, critical: ac.critical };
-    if (!covering.length) return { ...base, status: 'pending' as const, why: 'no task covers it' };
-    if (!done.length) return { ...base, status: 'pending' as const, why: `${covering.map((t) => t.id).join(', ')} not finished` };
-    if (done.length < covering.length) {
-      const open = covering.filter((t) => !done.includes(t)).map((t) => t.id);
-      return { ...base, status: 'partial' as const, why: `${open.join(', ')} not finished` };
-    }
-    if (verified !== 'PASS')
-      return { ...base, status: 'partial' as const, why: verified ? `verify: ${verified}` : 'not in verify-report.md' };
-    return { ...base, status: 'met' as const, why: `${done.map((t) => t.id).join(', ')} committed; verify PASS` };
-  });
+  return story.acs
+    .filter((ac) => !ac.removed)
+    .map((ac) => {
+      const covering = tasks.filter((t) => t.ac.some((a) => a === ac.id || a.startsWith(`${ac.id}/`)));
+      const done = covering.filter((t) => finished(t, rows, committed));
+      const verified = verify.get(ac.id);
+      const base = { ref: ac.id, critical: ac.critical };
+      if (!covering.length) return { ...base, status: 'pending' as const, why: 'no task covers it' };
+      if (!done.length) return { ...base, status: 'pending' as const, why: `${covering.map((t) => t.id).join(', ')} not finished` };
+      if (done.length < covering.length) {
+        const open = covering.filter((t) => !done.includes(t)).map((t) => t.id);
+        return { ...base, status: 'partial' as const, why: `${open.join(', ')} not finished` };
+      }
+      if (verified !== 'PASS')
+        return { ...base, status: 'partial' as const, why: verified ? `verify: ${verified}` : 'not in verify-report.md' };
+      return { ...base, status: 'met' as const, why: `${done.map((t) => t.id).join(', ')} committed; verify PASS` };
+    });
 }
 
 /** Items proposed under a design.md section (`## Constitution Impact`, `## Product Impact`), comments removed. */
diff --git a/src/spec/story.ts b/src/spec/story.ts
index 199e019..6cbd7c2 100644
--- a/src/spec/story.ts
+++ b/src/spec/story.ts
@@ -1,11 +1,12 @@
 import { z } from 'zod';
-import { formatIssues, schemaVersion, specStatus } from '../schemas/index.js';
+import { formatIssues, specStatus } from '../schemas/index.js';
 import { type Clause, frontmatterOf, readClauses, sections, splitHeading } from './markdown.js';
 
 export const SPEC_TYPES = ['epic', 'story', 'bug', 'enhancement', 'task', 'performance'] as const;
 
 export const storyFrontmatterSchema = z.object({
-  schema_version: schemaVersion,
+  /** The layout version of the spec folder (ADR 0041): 1 for older specs, 2 for new ones. */
+  schema_version: z.union([z.literal(1), z.literal(2)]),
   tracker: z.enum(['jira', 'linear', 'clickup', 'monday', 'none']).default('none'),
   type: z.enum(SPEC_TYPES).default('story'),
   id: z.string().regex(/^[A-Z][A-Z0-9_]*-\d+$/, 'must look like PROJ-123 or MDO-0001'),
@@ -23,6 +24,8 @@ export interface AcceptanceCriterion {
   id: string;
   title: string;
   critical: boolean;
+  /** `status: removed` (rules/traceability.md): the AC keeps its number, and trace and release-status skip it. */
+  removed: boolean;
   clauses: Clause[];
   line: number;
 }
@@ -50,6 +53,7 @@ export function parseStory(markdown: string, file = 'story.md'): { story?: Story
       id: h.id,
       title: h.title,
       critical: /^\s*critical:\s*true\s*$/im.test(s.body),
+      removed: /^\s*status:\s*removed\s*$/im.test(s.body),
       clauses: readClauses(s.body, `${file}:${s.line} ${h.id}`, issues),
       line: s.line,
     });
diff --git a/src/spec/trace.ts b/src/spec/trace.ts
index d44ed73..1dc7cda 100644
--- a/src/spec/trace.ts
+++ b/src/spec/trace.ts
@@ -60,10 +60,12 @@ export interface Trace {
 
 /** Every AC and edge clause of the story, as `AC-1` and `AC-1/C1`. */
 function storyRefs(story: Story): { ref: string; critical: boolean }[] {
-  return story.acs.flatMap((ac) => [
-    { ref: ac.id, critical: ac.critical },
-    ...ac.clauses.filter((c) => c.id).map((c) => ({ ref: `${ac.id}/${c.id}`, critical: ac.critical })),
-  ]);
+  return story.acs
+    .filter((ac) => !ac.removed)
+    .flatMap((ac) => [
+      { ref: ac.id, critical: ac.critical },
+      ...ac.clauses.filter((c) => c.id).map((c) => ({ ref: `${ac.id}/${c.id}`, critical: ac.critical })),
+    ]);
 }
 
 /** Every scenario and edge clause, as `S-1.1` and `S-1.1/C1`. */

--- /dev/null
+++ b/docs/decisions/0041-spec-folder-layout-v2.md (new file)
# 0041 — Spec folder layout version 2

**Status:** Accepted · 2026-10-21 · MDO-0011 · design D1

Spec folders grew different shapes by depth and by date: inline tasks up to a count, root versus `_log/`
logs, optional files nobody listed. Nothing read a spec's version, and "lite" meant only that `spec.md` exists.

## Decision

- **The layout version is the story's `schema_version`:** 1 for older specs, 2 for new ones; any other value
  is an error. There is no separate `layout:` key, and the version is never inferred from the files present
  (a broken version 2 folder would pass as version 1).
- **One manifest, `layoutManifest(version, depth)` in `src/spec/layout.ts`,** lists the required files per
  stage and the allowed conditionals. `layoutFindings(folder)` returns `{ version, depth, stage, missing,
  unexpected, ok }`. `docs/spec-anatomy.md` is built from the same manifest.
- **Depth** is the `depth:` frontmatter of `spec.md`, `requirements.md` or `design.md`; lite when it is missing
  and `spec.md` exists, else standard.
- **`mandao run layout <spec>`** prints the findings and exits 1 when `ok` is false. `mandao run status <spec>
  closed` refuses a folder that does not match, naming the findings.
- **Version 1 is accepted in its own format:** its manifest also allows the root log files (`execution.md`,
  `progress.yml`, …), and asks for nothing after the documents and tasks.
- **An AC with `status: removed`** keeps its number and is skipped by `trace` and `release-status`.

## Consequences

- Later tasks of MDO-0011 move the version 2 log to six files and `tasks.md` to every depth; this ADR fixes the
  check they are measured against.
- Migrating MDO-0008 to MDO-0010 is a separate spec.

--- /dev/null
+++ b/docs/spec-anatomy.md (new file)
# Spec anatomy

What a spec folder holds at layout version 2, per depth. The tables below come from the manifest in
`src/spec/layout.ts` (`anatomyTables`), the same one `mandao run layout <ID>` and the close gate use; a test
compares them. The layout version is the story's `schema_version`: 2 for new specs, 1 for older ones, which
stay readable in their own format. The depth is the `depth:` frontmatter of the spec documents, or lite when
it is missing and `spec.md` exists. Decision: [ADR 0041](decisions/0041-spec-folder-layout-v2.md).

A file is required from the stage its table row names; the stage comes from the story status (draft, approved,
in-progress or blocked, verified, closed). Any other file in the folder is reported as unexpected.
`diagrams/` and `_log/` are allowed at every depth.

### lite

| File | What it is for | When |
|---|---|---|
| `story.md` | The request and its acceptance criteria | from the draft stage |
| `spec.md` | Requirements, design and decisions of a lite spec in one document | from the specified stage |
| `tasks.md` | The task plan and its details | from the planned stage |
| `verify-report.md` | The result of verify | from the verified stage |
| `close-summary.md` | The record of the close | from the closed stage |

### standard

| File | What it is for | When |
|---|---|---|
| `story.md` | The request and its acceptance criteria | from the draft stage |
| `requirements.md` | Functional requirements and scenarios | from the specified stage |
| `design.md` | Decisions, changes by module and risks | from the specified stage |
| `tasks.md` | The task plan and its details | from the planned stage |
| `verify-report.md` | The result of verify | from the verified stage |
| `close-summary.md` | The record of the close | from the closed stage |

### full

| File | What it is for | When |
|---|---|---|
| `story.md` | The request and its acceptance criteria | from the draft stage |
| `requirements.md` | Functional requirements and scenarios | from the specified stage |
| `design.md` | Decisions, changes by module and risks | from the specified stage |
| `tasks.md` | The task plan and its details | from the planned stage |
| `verify-report.md` | The result of verify | from the verified stage |
| `close-summary.md` | The record of the close | from the closed stage |

### Conditional files

| File | What it is for | When |
|---|---|---|
| `quickstart.md` | How a PO checks the behavior by hand | only when the spec has behavior a user or PO can see |
| `data-model.md` | The data the spec changes | only when the spec changes data |
| `contract/` | The contract between projects | only when the spec spans several projects |

### The six log files (`_log/`)

| File | What it is for | When |
|---|---|---|
| `state.yml` | Start request, baseline, progress, approvals and session-cut estimates | always, in `_log/` |
| `execution.md` | One row per execution event | always, in `_log/` |
| `reviews.md` | Verdict and findings per task and attempt | always, in `_log/` |
| `gates.md` | Gate status per attempt, with output only for failing gates | always, in `_log/` |
| `premises.md` | Per premise: claim, command, exit code and excerpt | always, in `_log/` |
| `costs.yml` | Spend per role | always, in `_log/` |

--- /dev/null
+++ b/src/spec/layout.ts (new file)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { frontmatterOf } from './markdown.js';

/** The depths a spec can have, and the stages its story status moves it through (design D1). */
export const DEPTHS = ['lite', 'standard', 'full'] as const;
export type Depth = (typeof DEPTHS)[number];
export const STAGES = ['draft', 'specified', 'planned', 'verified', 'closed'] as const;
export type Stage = (typeof STAGES)[number];
export type LayoutVersion = 1 | 2;

export interface LayoutManifest {
  version: LayoutVersion;
  depth: Depth;
  /** Files (directories end in `/`) that must exist once the spec reaches each stage. */
  required: Record<Stage, string[]>;
  /** Files that may exist, never required: conditionals, derived folders and, for version 1, the legacy root log. */
  optional: string[];
  /** Version 2 only: the six committed files of `_log/`. */
  log: string[];
}

/** The six committed log files of a version 2 spec (FR-3). */
export const LOG_FILES_V2 = ['state.yml', 'execution.md', 'reviews.md', 'gates.md', 'premises.md', 'costs.yml'];

/** Conditional files, with when each one appears (rendered in `docs/spec-anatomy.md`). */
export const CONDITIONALS: { file: string; when: string }[] = [
  { file: 'quickstart.md', when: 'the spec has behavior a user or PO can see' },
  { file: 'data-model.md', when: 'the spec changes data' },
  { file: 'contract/', when: 'the spec spans several projects' },
];

/** What each file is for, rendered in `docs/spec-anatomy.md`. */
export const FILE_PURPOSE: Record<string, string> = {
  'story.md': 'The request and its acceptance criteria',
  'spec.md': 'Requirements, design and decisions of a lite spec in one document',
  'requirements.md': 'Functional requirements and scenarios',
  'design.md': 'Decisions, changes by module and risks',
  'tasks.md': 'The task plan and its details',
  'verify-report.md': 'The result of verify',
  'close-summary.md': 'The record of the close',
  'quickstart.md': 'How a PO checks the behavior by hand',
  'data-model.md': 'The data the spec changes',
  'contract/': 'The contract between projects',
  'state.yml': 'Start request, baseline, progress, approvals and session-cut estimates',
  'execution.md': 'One row per execution event',
  'reviews.md': 'Verdict and findings per task and attempt',
  'gates.md': 'Gate status per attempt, with output only for failing gates',
  'premises.md': 'Per premise: claim, command, exit code and excerpt',
  'costs.yml': 'Spend per role',
};

const V1_LEGACY = [
  'execution.md',
  'progress.yml',
  'approvals.yml',
  'costs.yml',
  'full-runs.md',
  'session-cuts.md',
  'discrepancies.md',
  'reviews/',
  'mutations/',
  'gates/',
  'premises/',
  'release-notes.md',
];

const docs = (depth: Depth) => (depth === 'lite' ? ['spec.md'] : ['requirements.md', 'design.md']);

/** The one manifest behind the folder check, the close gate and `docs/spec-anatomy.md` (design D1). */
export function layoutManifest(version: LayoutVersion, depth: Depth): LayoutManifest {
  const tasks = version === 2 || depth !== 'lite' ? ['tasks.md'] : [];
  return {
    version,
    depth,
    required: {
      draft: ['story.md'],
      specified: docs(depth),
      planned: tasks,
      // A version 1 spec closed without these two files; it is accepted in its own format.
      verified: version === 2 ? ['verify-report.md'] : [],
      closed: version === 2 ? ['close-summary.md'] : [],
    },
    optional: [
      ...(version === 1 ? ['spec.md', 'tasks.md', 'verify-report.md', 'close-summary.md', ...V1_LEGACY] : []),
      ...CONDITIONALS.map((c) => c.file),
      'diagrams/',
      '_log/',
    ],
    log: version === 2 ? LOG_FILES_V2 : [],
  };
}

export interface LayoutFindings {
  version: LayoutVersion;
  depth: Depth;
  stage: Stage;
  missing: string[];
  unexpected: string[];
  ok: boolean;
}

const STAGE_OF_STATUS: Record<string, Stage> = {
  draft: 'draft',
  abandoned: 'draft',
  approved: 'specified',
  'in-progress': 'planned',
  blocked: 'planned',
  verified: 'verified',
  closed: 'closed',
};

const readIf = (file: string) => (existsSync(file) ? readFileSync(file, 'utf8') : undefined);

/**
 * `depth:` of `spec.md` (lite when it has none), else of `requirements.md` or `design.md`. A `depth: lite` on
 * those two is ignored: a lite spec keeps its documents in `spec.md`, so the pair means standard (MDO-0001
 * carries `depth: lite` on a requirements.md).
 */
function depthOf(dir: string): Depth {
  const lite = readIf(join(dir, 'spec.md'));
  if (lite !== undefined) {
    const depth = frontmatterOf(lite).data.depth;
    return DEPTHS.includes(depth as Depth) ? (depth as Depth) : 'lite';
  }
  for (const f of ['requirements.md', 'design.md']) {
    const text = readIf(join(dir, f));
    const depth = text ? frontmatterOf(text).data.depth : undefined;
    if (depth === 'standard' || depth === 'full') return depth;
  }
  return 'standard';
}

/** Compares a spec folder with its manifest. The version is the story's `schema_version`, nothing else. */
export function layoutFindings(dir: string): LayoutFindings {
  const story = readIf(join(dir, 'story.md'));
  if (story === undefined) throw new Error('story.md is missing: the layout version is its schema_version');
  const data = frontmatterOf(story).data;
  const version = data.schema_version;
  if (version !== 1 && version !== 2) throw new Error(`story.md: schema_version must be 1 or 2, got ${String(version)}`);
  const depth = depthOf(dir);
  const stage = STAGE_OF_STATUS[String(data.status ?? 'draft')] ?? 'draft';
  const manifest = layoutManifest(version, depth);
  const required = STAGES.slice(0, STAGES.indexOf(stage) + 1).flatMap((s) => manifest.required[s]);
  const allowed = new Set([...STAGES.flatMap((s) => manifest.required[s]), ...manifest.optional]);
  const present = readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.name !== '.DS_Store')
    .map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
  const missing = required.filter((f) => !present.includes(f)).sort();
  const unexpected = present.filter((f) => !allowed.has(f)).sort();
  return { version, depth, stage, missing, unexpected, ok: !missing.length && !unexpected.length };
}

/** The problems a close refusal names, one line each; empty when the folder matches. */
export function layoutProblems(found: LayoutFindings): string[] {
  return [
    ...(found.missing.length ? [`layout: missing ${found.missing.join(', ')}`] : []),
    ...(found.unexpected.length ? [`layout: unexpected ${found.unexpected.join(', ')}`] : []),
  ];
}

/** The tables of `docs/spec-anatomy.md`, from the manifest (S-8.1). */
export function anatomyTables(): string {
  const row = (f: string, note: string) => `| \`${f}\` | ${FILE_PURPOSE[f] ?? ''} | ${note} |`;
  const header = '| File | What it is for | When |\n|---|---|---|';
  const parts: string[] = [];
  for (const depth of DEPTHS) {
    const m = layoutManifest(2, depth);
    const rows = STAGES.flatMap((s) => m.required[s].map((f) => row(f, `from the ${s} stage`)));
    parts.push(`### ${depth}\n\n${header}\n${rows.join('\n')}`);
  }
  const cond = CONDITIONALS.map((c) => row(c.file, `only when ${c.when}`));
  const log = LOG_FILES_V2.map((f) => row(f, 'always, in `_log/`'));
  parts.push(`### Conditional files\n\n${header}\n${cond.join('\n')}`);
  parts.push(`### The six log files (\`_log/\`)\n\n${header}\n${log.join('\n')}`);
  return parts.join('\n\n');
}

--- /dev/null
+++ b/test/integration/layout.test.ts (new file)
// mandao-scans: specs/ — copies the MDO-0001 spec folder into a temporary tree.
import { cpSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { makeTree, pkg } from '../helpers.js';

/**
 * ASSUMPTION (the spec fixes behavior, not the signature): `mandao run layout <spec>` prints
 * `{ ok, missing, unexpected }` as JSON for that spec, with file names relative to the spec folder.
 */
const repoRoot = join(import.meta.dirname, '../..');
let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
});
afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

function project() {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude'],
  });
  syncProject(root);
  return root;
}
const run = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
  return JSON.parse(out.at(-1)!);
};

/** A verified standard version 2 spec without design.md and with a stray notes.md. */
function brokenV2() {
  const root = project();
  const dir = join(root, 'specs/MDO-0099-broken-layout');
  mkdirSync(dir, { recursive: true });
  const fixture = join(repoRoot, 'test/fixtures/spec/MDO-0001-skills-list');
  const story = readFileSync(join(fixture, 'story.md'), 'utf8')
    .replace(/^schema_version: 1$/m, 'schema_version: 2')
    .replace(/^id: .*$/m, 'id: MDO-0099')
    .replace(/^status: .*$/m, 'status: verified');
  writeFileSync(join(dir, 'story.md'), story);
  cpSync(join(fixture, 'requirements.md'), join(dir, 'requirements.md'));
  cpSync(join(fixture, 'tasks.md'), join(dir, 'tasks.md'));
  writeFileSync(join(dir, 'notes.md'), 'stray');
  return root;
}

describe('mandao run layout and the close gate (AC-2)', () => {
  test('S-2.1: names the missing design.md and the stray notes.md, ok false', async () => {
    const r = await run(brokenV2(), 'layout', 'MDO-0099');
    expect(r.ok).toBe(false);
    expect(r.missing).toContain('design.md');
    expect(r.unexpected).toContain('notes.md');
  });

  test('S-2.2: status closed is not allowed and the problem names the layout findings', async () => {
    const r = await run(brokenV2(), 'status', 'MDO-0099', 'closed');
    expect(r.allowed).toBe(false);
    const problems = r.problems.join('\n');
    expect(problems).toContain('design.md');
    expect(problems).toContain('notes.md');
  });

  test('S-2.3: MDO-0001, version 1 with execution.md and progress.yml at its root, is ok', async () => {
    const root = project();
    cpSync(join(repoRoot, 'specs/MDO-0001-list-pinned-skills'), join(root, 'specs/MDO-0001-list-pinned-skills'), {
      recursive: true,
    });
    const r = await run(root, 'layout', 'MDO-0001');
    expect(r).toMatchObject({ ok: true, missing: [], unexpected: [] });
  });
});

--- /dev/null
+++ b/test/unit/layout.test.ts (new file)
// mandao-scans: docs/ specs/ — reads docs/spec-anatomy.md, README.md and the MDO-0001 spec folder by path.
import { cpSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { layoutFindings, layoutManifest } from '../../src/spec/layout.js';
import { makeTree } from '../helpers.js';

/**
 * ASSUMPTION (the spec fixes behavior, not the signature, design D1): `layoutManifest(version, depth)` is pure and
 * returns plain data naming files (as strings, at any nesting); `layoutFindings(folder)` is pure over a folder path
 * and answers `{ ok, missing, unexpected }` with file names relative to the folder.
 */
const root = join(import.meta.dirname, '../..');
const DEPTHS = ['lite', 'standard', 'full'] as const;

/** Every string inside a manifest, however it is nested. */
const names = (v: unknown): string[] => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(names) : []);

describe('layout manifest and findings (AC-2/C1, S-2.3/C1)', () => {
  test('S-2.3/C1: version 1 manifest lists the files version 1 allowed, including root execution.md and progress.yml', () => {
    const v1 = names(layoutManifest(1, 'standard'));
    expect(v1).toContain('execution.md');
    expect(v1).toContain('progress.yml');
  });

  test('S-2.3/C1: a version 1 folder with execution.md and progress.yml at its root is ok', () => {
    const dir = makeTree({});
    cpSync(join(root, 'specs/MDO-0001-list-pinned-skills'), dir, { recursive: true });
    expect(layoutFindings(dir)).toMatchObject({ ok: true, missing: [], unexpected: [] });
  });

  test('S-2.3/C1: the version is the story schema_version, never inferred from the files present', () => {
    const story = readFileSync(join(root, 'specs/MDO-0001-list-pinned-skills/story.md'), 'utf8').replace(
      /^schema_version: 1$/m,
      'schema_version: 2',
    );
    const dir = makeTree({ 'story.md': story });
    for (const f of ['requirements.md', 'design.md', 'tasks.md', 'execution.md', 'progress.yml']) {
      cpSync(join(root, 'specs/MDO-0001-list-pinned-skills', f), join(dir, f));
    }
    // The same files that pass as version 1 do not pass once the story says version 2.
    expect(layoutFindings(dir).ok).toBe(false);
  });

  test('S-2.3/C1: a schema_version other than 1 or 2 is an error', () => {
    const dir = makeTree({ 'story.md': '---\nschema_version: 3\nstatus: draft\n---\n# s\n' });
    expect(() => layoutFindings(dir)).toThrow(/schema_version/);
  });

  test('S-2.1: a version 2 standard folder names the missing design.md and the stray notes.md', () => {
    const story = '---\nschema_version: 2\ntype: story\nid: MDO-0099\nstatus: verified\n---\n# s\n';
    const doc = '---\ndepth: standard\nstatus: approved\n---\n# r\n';
    const dir = makeTree({ 'story.md': story, 'requirements.md': doc, 'tasks.md': doc, 'notes.md': 'x' });
    const found = layoutFindings(dir);
    expect(found.ok).toBe(false);
    expect(found.missing).toContain('design.md');
    expect(found.unexpected).toContain('notes.md');
  });

  test('a separate layout: key does not change the version', () => {
    const story = '---\nschema_version: 2\nlayout: 1\nid: MDO-0099\nstatus: draft\n---\n# s\n';
    const dir = makeTree({ 'story.md': story, 'execution.md': 'x', 'progress.yml': 'x' });
    expect(layoutFindings(dir).unexpected).toEqual(expect.arrayContaining(['execution.md', 'progress.yml']));
  });
});

describe('docs/spec-anatomy.md is built from the manifest (S-8.1)', () => {
  test('S-8.1: every file the manifest lists per depth appears in the page table', () => {
    const page = readFileSync(join(root, 'docs/spec-anatomy.md'), 'utf8');
    for (const depth of DEPTHS) {
      const files = names(layoutManifest(2, depth)).filter((n) => /\.[a-z]+$/.test(n));
      expect(files.length, depth).toBeGreaterThan(0);
      for (const f of files) expect(page, `${depth}: ${f}`).toContain(f);
    }
  });

  test('S-8.1: the README links the page', () => {
    expect(readFileSync(join(root, 'README.md'), 'utf8')).toContain('docs/spec-anatomy.md');
  });
});

```
