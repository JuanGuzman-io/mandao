# Review pack — T1, attempt 2

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T1-2.md`.

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
    "attempt": 2,
    "failsAtTier": 1,
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

## Gates — T1, attempt 2

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
index 7664a5a..14de807 100644
--- a/src/cli/run-spec.ts
+++ b/src/cli/run-spec.ts
@@ -9,11 +9,12 @@ import { activeSpecDir, recordFullRun } from '../scripts/forced.js';
 import { fillCommand } from '../scripts/impact.js';
 import { type BudgetKind, decideBudget, effectiveResources, probeMachine } from '../scripts/resources.js';
 import { runTests } from '../scripts/run-tests.js';
-import { checkTransition, expectedPlace, proposeSpec, whereAmI } from '../scripts/spec.js';
+import { checkTransition, expectedPlace, proposeSpec, readLayout, whereAmI } from '../scripts/spec.js';
 import { docPath, LITE_DOC } from '../scripts/spec-log.js';
 import {
   blockingMarkers,
   commitMessage,
+  layoutProblems,
   loopState,
   planTasks,
   TASK_KINDS,
@@ -158,6 +159,15 @@ function registerTaskScripts(run: Command, ctx: CliContext) {
     });
 }
 
+/** Close refuses a folder that does not match its layout; an unreadable version is a problem too. */
+function closeLayoutProblems(dir: string): string[] {
+  try {
+    return layoutProblems(readLayout(dir));
+  } catch (e) {
+    return [`layout: ${(e as Error).message}`];
+  }
+}
+
 /** Spec status changes and the worktree check. */
 function registerState(run: Command, ctx: CliContext) {
   run
@@ -168,10 +178,21 @@ function registerState(run: Command, ctx: CliContext) {
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
+      const found = readLayout(spec.dir);
+      json({ ...found });
+      if (!found.ok) process.exitCode = 1;
+    });
+
   run
     .command('where <spec>')
     .description('Is this session inside the spec worktree, on its branch? `resume` opens the active harness there')
diff --git a/src/scripts/spec.ts b/src/scripts/spec.ts
index 5713834..207a9d5 100644
--- a/src/scripts/spec.ts
+++ b/src/scripts/spec.ts
@@ -6,6 +6,9 @@ import type { Config } from '../schemas/index.js';
 import { type SpecStatus, specStatus } from '../schemas/index.js';
 import {
   type ExecutionRow,
+  frontmatterOf,
+  type LayoutFindings,
+  layoutFindings,
   type Progress,
   parseExecution,
   parseRequirements,
@@ -33,6 +36,19 @@ export interface SpecFolder {
   issues: string[];
 }
 
+/** Reads a spec folder's story frontmatter, depth-bearing documents and entries, and checks them against the layout. */
+export function readLayout(dir: string): LayoutFindings {
+  const story = readIf(join(dir, 'story.md'));
+  if (story === undefined) throw new Error('story.md is missing: the layout version is its schema_version');
+  const docs: Record<string, { depth?: unknown }> = {};
+  for (const f of ['spec.md', 'requirements.md', 'design.md']) {
+    const text = readIf(join(dir, f));
+    if (text !== undefined) docs[f] = frontmatterOf(text).data;
+  }
+  const entries = readdirSync(dir, { withFileTypes: true }).map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
+  return layoutFindings({ story: frontmatterOf(story).data, docs, entries });
+}
+
 const specsDir = (root: string, config: Config) => join(root, config.paths.specs);
 
 /** Finds a spec by folder path, full folder name or id prefix (`MDO-0001`). */
diff --git a/src/spec/AGENTS.md b/src/spec/AGENTS.md
index a62c5a4..a3f7a97 100644
--- a/src/spec/AGENTS.md
+++ b/src/spec/AGENTS.md
@@ -13,3 +13,4 @@ The CLI and scripts gather inputs; writer helpers own persistence.
 - Unit-test decisions and integration-test recording through temporary workspaces made by `makeTree`.
 - `next.ts`: `nextStep` is pure and only recommends; it never offers implement before approval or past an open item (`NEEDS CLARIFICATION`, `CONFLICT` inline or as a Consistency Check row, a critical Consistency Check row, a pending decision; resolved rows are ignored). Lite is `spec.md` existing (`SpecFolder.lite`). Hashes ignore `status:` and `tasks.md`; a missing hash means no claim. Change-after-approval compares approval rows only; `shown` rows (`run next --shown`) are compared only by `approve --by-running`.
 - `next.ts` reads only real markers: `withoutCode` (`markdown.ts`) drops inline code spans and fenced blocks first, so a marker shown as an example is not an open item. A Consistency Check row is resolved when its Status starts with `resolved` (`core/templates/shared/rules/consistency-check.md`; a test pins both). A `verify-report.md` with `verdict: blocked` recommends implement, not verify. A closed spec skips the open-item check and recommends its delivery from git (`unpushed` → push, `pushed` → PR and merge, `merged` → `none`, no options); it never offers story or clarify. `nextFor` (`src/cli/approve.ts`) reads those facts from the spec's own branch (not HEAD); only `origin/<base>` counts as merged, and without git or the branch there is no delivery fact; naming the delivery performs nothing (MDO-0012).
+- `layout.ts`: `layoutManifest(version, depth)` is the one manifest behind `run layout`, the close gate (`run status <ID> closed`) and `docs/spec-anatomy.md`; the version is the story's `schema_version` (`LAYOUT_VERSIONS`, 1 or 2, anything else throws), never a `layout:` key or the files present. `layoutFindings` is pure over `{ story, docs, entries }`; `readLayout` in `src/scripts/spec.ts` reads the folder (D1). An AC with `status: removed` is skipped by `trace` and `acStatus` (ADR 0041).
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
index 199e019..4787e37 100644
--- a/src/spec/story.ts
+++ b/src/spec/story.ts
@@ -1,11 +1,13 @@
 import { z } from 'zod';
-import { formatIssues, schemaVersion, specStatus } from '../schemas/index.js';
+import { formatIssues, specStatus } from '../schemas/index.js';
+import { LAYOUT_VERSIONS } from './layout.js';
 import { type Clause, frontmatterOf, readClauses, sections, splitHeading } from './markdown.js';
 
 export const SPEC_TYPES = ['epic', 'story', 'bug', 'enhancement', 'task', 'performance'] as const;
 
 export const storyFrontmatterSchema = z.object({
-  schema_version: schemaVersion,
+  /** The layout version of the spec folder (ADR 0041): 1 for older specs, 2 for new ones. */
+  schema_version: z.union(LAYOUT_VERSIONS.map((v) => z.literal(v)) as unknown as [z.ZodLiteral<1>, z.ZodLiteral<2>]),
   tracker: z.enum(['jira', 'linear', 'clickup', 'monday', 'none']).default('none'),
   type: z.enum(SPEC_TYPES).default('story'),
   id: z.string().regex(/^[A-Z][A-Z0-9_]*-\d+$/, 'must look like PROJ-123 or MDO-0001'),
@@ -23,6 +25,8 @@ export interface AcceptanceCriterion {
   id: string;
   title: string;
   critical: boolean;
+  /** `status: removed` (rules/traceability.md): the AC keeps its number, and trace and release-status skip it. */
+  removed: boolean;
   clauses: Clause[];
   line: number;
 }
@@ -50,6 +54,7 @@ export function parseStory(markdown: string, file = 'story.md'): { story?: Story
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
  stage and the allowed conditionals. `layoutFindings({ story, docs, entries })` is pure (`readLayout` in `src/scripts/spec.ts` reads the folder) and returns `{ version, depth, stage, missing,
  unexpected, ok }`. `docs/spec-anatomy.md` is built from the same manifest.
- **Depth** is the `depth:` frontmatter of `spec.md`, `requirements.md` or `design.md`; lite when it is missing
  and `spec.md` exists, else standard.
- **`mandao run layout <spec>`** prints the findings and exits 1 when `ok` is false. `mandao run status <spec>
  closed` refuses a folder that does not match, naming the findings.
- **Version 1 is accepted in its own format:** its manifest also allows the root log files (`execution.md`,
  `progress.yml`, …), and asks for nothing after the documents and tasks.
- **An AC with `status: removed`** keeps its number and is skipped by `trace` and `release-status`.

## Consequences

- `close-summary.md` is required from T5 on; until then the close gate checks the folder at the `verified` status, which does not require it.
- `approved` counts as the draft stage: it is set before specify runs.
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
/** The depths a spec can have, and the stages its story status moves it through (design D1). */
export const DEPTHS = ['lite', 'standard', 'full'] as const;
export type Depth = (typeof DEPTHS)[number];
export const STAGES = ['draft', 'specified', 'planned', 'verified', 'closed'] as const;
export type Stage = (typeof STAGES)[number];
/** The layout versions a story's `schema_version` may name: the one place the set is written. */
export const LAYOUT_VERSIONS = [1, 2] as const;
export type LayoutVersion = (typeof LAYOUT_VERSIONS)[number];

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
      // Version 1 lite specs kept their documents either in spec.md or in the requirements + design pair.
      specified: version === 1 && depth === 'lite' ? [] : docs(depth),
      planned: tasks,
      // A version 1 spec closed without these two files; it is accepted in its own format.
      verified: version === 2 ? ['verify-report.md'] : [],
      closed: version === 2 ? ['close-summary.md'] : [],
    },
    optional: [
      ...(version === 1
        ? ['spec.md', 'requirements.md', 'design.md', 'tasks.md', 'verify-report.md', 'close-summary.md', ...V1_LEGACY]
        : []),
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

/** `approved` is set when the PO approves the story, before specify runs, so it is still the draft stage. */
const STAGE_OF_STATUS: Record<string, Stage> = {
  draft: 'draft',
  approved: 'draft',
  abandoned: 'draft',
  'in-progress': 'planned',
  blocked: 'planned',
  verified: 'verified',
  closed: 'closed',
};

/** What `layoutFindings` needs, all read by the caller (IO stays out of the domain). */
export interface LayoutInput {
  /** The story.md frontmatter. */
  story: { schema_version?: unknown; status?: unknown };
  /** One key per present `spec.md`, `requirements.md` or `design.md`, with that document's frontmatter. */
  docs: Record<string, { depth?: unknown } | undefined>;
  /** The folder's entry names; directories end in `/`. */
  entries: string[];
}

/** `depth:` of `spec.md`, `requirements.md` or `design.md`; lite when none has one and `spec.md` exists, else standard (D1). */
function depthOf(docs: LayoutInput['docs']): Depth {
  for (const f of ['spec.md', 'requirements.md', 'design.md']) {
    const depth = docs[f]?.depth;
    if (DEPTHS.includes(depth as Depth)) return depth as Depth;
  }
  return 'spec.md' in docs ? 'lite' : 'standard';
}

/** Compares a folder's contents with its manifest. The version is the story's `schema_version`, nothing else. */
export function layoutFindings({ story, docs, entries }: LayoutInput): LayoutFindings {
  const version = LAYOUT_VERSIONS.find((v) => v === story.schema_version);
  if (!version) throw new Error(`story.md: schema_version must be ${LAYOUT_VERSIONS.join(' or ')}, got ${String(story.schema_version)}`);
  const depth = depthOf(docs);
  const stage = STAGE_OF_STATUS[String(story.status ?? 'draft')] ?? 'draft';
  const manifest = layoutManifest(version, depth);
  const required = STAGES.slice(0, STAGES.indexOf(stage) + 1).flatMap((s) => manifest.required[s]);
  if (version === 1 && depth === 'lite' && stage !== 'draft' && !entries.includes('spec.md') && !entries.includes('requirements.md'))
    required.push('spec.md');
  const allowed = new Set([...STAGES.flatMap((s) => manifest.required[s]), ...manifest.optional]);
  const present = entries.filter((e) => e !== '.DS_Store');
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
+++ b/src/spec/trace.ts.orig (new file)
import type { Requirements } from './requirements.js';
import type { Story } from './story.js';
import type { Task } from './tasks.js';

export type TraceFindingType =
  | 'GAP'
  | 'ORPHAN'
  | 'BROKEN_REF'
  | 'UNPLANNED'
  | 'UNTESTED'
  | 'E2E_MISSING'
  | 'UNCOMMITTED'
  /** A High premise with neither a recorded run nor the UNVERIFIED marker (ADR 0033). */
  | 'PREMISE_UNPROVEN';

export interface TraceFinding {
  type: TraceFindingType;
  /** The item the finding is about: `AC-1/C1`, `FR-3`, `S-2.1`, `T4`. */
  ref: string;
  message: string;
}

export interface TraceRow {
  /** `AC-1` (main) or `AC-1/C1` (edge clause). */
  ref: string;
  critical: boolean;
  requirements: string[];
  scenarios: string[];
  tasks: string[];
  tests: string[];
}

/** Commit state of the spec, resolved from git trailers by the caller (ADR 0021). */
export interface CommitState {
  /** Tasks whose last execution row is PASS or DEFERRED_TO_CI. */
  passed: string[];
  /** Tasks with a commit carrying `Refs: <spec id>` and `Mandao-Task: <task>`. */
  committed: Set<string>;
  /** Tasks queued in progress.yml `pending_commits`. */
  pending: string[];
}

/** A passed task without a commit carrying its trailers. */
export function commitFindings(state: CommitState): TraceFinding[] {
  return state.passed
    .filter((t) => !state.committed.has(t))
    .map((t) => ({
      type: 'UNCOMMITTED' as const,
      ref: t,
      message: state.pending.includes(t)
        ? `${t} passed review and its commit is pending: run \`mandao run commit <spec>\``
        : `${t} passed review but no commit carries its Mandao-Task trailer`,
    }));
}

export interface Trace {
  rows: TraceRow[];
  findings: TraceFinding[];
}

/** Every AC and edge clause of the story, as `AC-1` and `AC-1/C1`. */
function storyRefs(story: Story): { ref: string; critical: boolean }[] {
  return story.acs
    .flatMap((ac) => [
      { ref: ac.id, critical: ac.critical },
      ...ac.clauses.filter((c) => c.id).map((c) => ({ ref: `${ac.id}/${c.id}`, critical: ac.critical })),
    ]);
}

/** Every scenario and edge clause, as `S-1.1` and `S-1.1/C1`. */
function scenarioRefs(reqs: Requirements): string[] {
  return reqs.requirements.flatMap((r) =>
    r.scenarios.flatMap((s) => [s.id, ...s.clauses.filter((c) => c.id).map((c) => `${s.id}/${c.id}`)]),
  );
}

/** Requirements that serve nothing or cite unknown AC, and tasks that cite unknown references or no tests. */
function referenceFindings(reqs: Requirements, tasks: Task[], known: Set<string>, knownScenarios: Set<string>): TraceFinding[] {
  const out: TraceFinding[] = [];
  for (const r of reqs.requirements) {
    for (const s of r.serves.filter((x) => !known.has(x)))
      out.push({ type: 'BROKEN_REF', ref: r.id, message: `${r.id} serves ${s}, which the story does not define` });
    if (!r.serves.some((s) => known.has(s)))
      out.push({ type: 'ORPHAN', ref: r.id, message: `${r.id} serves no acceptance criterion: unrequested scope` });
  }
  for (const t of tasks) {
    for (const a of t.ac.filter((x) => !known.has(x)))
      out.push({ type: 'BROKEN_REF', ref: t.id, message: `${t.id} cites ${a}, which the story does not define` });
    for (const s of t.scenarios.filter((x) => !knownScenarios.has(x)))
      out.push({ type: 'BROKEN_REF', ref: t.id, message: `${t.id} cites ${s}, which requirements do not define` });
    if (!t.tests.unit.length && !t.tests.e2e.length) out.push({ type: 'UNTESTED', ref: t.id, message: `${t.id} declares no tests` });
  }
  return out;
}

/**
 * Structural traceability (rules/traceability.md): coverage closes per clause, and a clause is only
 * covered when something cites it exactly — a gap is never discharged by citing another reference.
 * Semantic findings (CONTRADICTION, RULE, PREMISE, CONTRACT) stay with the agent.
 */
export function trace(story: Story, reqs: Requirements, tasks: Task[] = [], commits?: CommitState): Trace {
  const findings: TraceFinding[] = commits ? commitFindings(commits) : [];
  const refs = storyRefs(story);
  const known = new Set(refs.map((r) => r.ref));
  const scenarios = scenarioRefs(reqs);
  const knownScenarios = new Set(scenarios);

  findings.push(...referenceFindings(reqs, tasks, known, knownScenarios));

  const rows = refs.map(({ ref, critical }): TraceRow => {
    const requirements = reqs.requirements.filter((r) => r.serves.includes(ref)).map((r) => r.id);
    const scenarioIds = reqs.requirements.filter((r) => requirements.includes(r.id)).flatMap((r) => r.scenarios.map((s) => s.id));
    const covering = tasks.filter((t) => t.ac.includes(ref));
    const row = {
      ref,
      critical,
      requirements,
      scenarios: scenarioIds,
      tasks: covering.map((t) => t.id),
      tests: covering.flatMap((t) => [...t.tests.unit, ...t.tests.e2e]),
    };
    if (!requirements.length) findings.push({ type: 'GAP', ref, message: `${ref} has no requirement citing it exactly` });
    if (critical && !ref.includes('/') && tasks.length && !covering.some((t) => t.tests.e2e.length)) {
      findings.push({ type: 'E2E_MISSING', ref, message: `${ref} is critical but no task declares an e2e test for it` });
    }
    return row;
  });

  if (tasks.length) {
    const planned = new Set(tasks.flatMap((t) => t.scenarios));
    for (const s of scenarios.filter((x) => !planned.has(x)))
      findings.push({ type: 'UNPLANNED', ref: s, message: `${s} is not cited by any task` });
  }
  return { rows, findings };
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
  // S-2.1 is a standard spec: the sample's documents say lite, so rewrite their depth.
  const standard = (f: string) => readFileSync(join(fixture, f), 'utf8').replace(/^depth: .*$/m, 'depth: standard');
  writeFileSync(join(dir, 'requirements.md'), standard('requirements.md'));
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

  test('S-2.3 and D1: MDO-0001 reports depth lite (its documents say depth: lite), not standard', async () => {
    const root = project();
    cpSync(join(repoRoot, 'specs/MDO-0001-list-pinned-skills'), join(root, 'specs/MDO-0001-list-pinned-skills'), {
      recursive: true,
    });
    const r = await run(root, 'layout', 'MDO-0001');
    expect(r).toMatchObject({ version: 1, depth: 'lite', ok: true });
  });
});

--- /dev/null
+++ b/test/unit/layout.test.ts (new file)
// mandao-scans: docs/ specs/ test/fixtures/ — reads docs/spec-anatomy.md, README.md, the MDO-0001 spec folder and the sample spec by path.
import { cpSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { readLayout } from '../../src/scripts/spec.js';
import { acStatus, parseRequirements, parseStory, parseTasks, trace } from '../../src/spec/index.js';
import { anatomyTables, layoutFindings, layoutManifest } from '../../src/spec/layout.js';
import { makeTree } from '../helpers.js';

/**
 * ASSUMPTION (the spec fixes behavior, not the signature, design D1):
 * - `layoutManifest(version, depth)` is pure and returns plain data naming files (strings, at any nesting).
 * - `layoutFindings(input)` is pure (architecture: IO belongs in scripts). Its input is data only:
 *   `{ story: { schema_version, status }, docs: { 'spec.md' | 'requirements.md' | 'design.md': <frontmatter data> }, entries }`
 *   where `story` is the story.md frontmatter, `docs` has one key per present depth-bearing document with that
 *   document's frontmatter, and `entries` are the folder's entry names (directories end in `/`).
 *   It answers `{ ok, version, depth, missing, unexpected }`, file names relative to the folder, and throws on a
 *   `schema_version` other than 1 or 2.
 * - `readLayout(folder)` in `src/scripts/spec.ts` reads the folder and calls `layoutFindings` (same answer).
 */
const root = join(import.meta.dirname, '../..');
const MDO1 = join(root, 'specs/MDO-0001-list-pinned-skills');
const DEPTHS = ['lite', 'standard', 'full'] as const;

/** Every string inside a manifest, however it is nested. */
const names = (v: unknown): string[] => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(names) : []);

describe('layout manifest and pure findings (AC-2/C1, S-2.3/C1)', () => {
  test('S-2.3/C1: version 1 manifest lists the files version 1 allowed, including root execution.md and progress.yml', () => {
    const v1 = names(layoutManifest(1, 'standard'));
    expect(v1).toContain('execution.md');
    expect(v1).toContain('progress.yml');
  });

  test('S-2.3/C1: version 1 lite with requirements.md + design.md (depth: lite) is lite and ok (D1)', () => {
    const found = layoutFindings({
      story: { schema_version: 1, status: 'closed' },
      docs: { 'requirements.md': { depth: 'lite' }, 'design.md': { depth: 'lite' } },
      entries: ['story.md', 'requirements.md', 'design.md', 'tasks.md', 'execution.md', 'progress.yml', 'release-notes.md'],
    });
    expect(found).toMatchObject({ version: 1, depth: 'lite', ok: true, missing: [], unexpected: [] });
  });

  test('D1: with no depth: in any document, lite is the fallback only when spec.md exists', () => {
    const found = layoutFindings({
      story: { schema_version: 2, status: 'draft' },
      docs: { 'spec.md': {} },
      entries: ['story.md', 'spec.md'],
    });
    expect(found).toMatchObject({ version: 2, depth: 'lite' });
  });

  test('S-2.3/C1: the version is the story schema_version, never inferred from the files present', () => {
    const entries = ['story.md', 'requirements.md', 'design.md', 'tasks.md', 'execution.md', 'progress.yml'];
    const docs = { 'requirements.md': { depth: 'standard' }, 'design.md': { depth: 'standard' } };
    expect(layoutFindings({ story: { schema_version: 1, status: 'in-progress' }, docs, entries }).ok).toBe(true);
    // The same files do not pass once the story says version 2.
    expect(layoutFindings({ story: { schema_version: 2, status: 'in-progress' }, docs, entries }).ok).toBe(false);
  });

  test('S-2.3/C1: a schema_version other than 1 or 2 is an error', () => {
    for (const schema_version of [3, 0, '1', undefined]) {
      expect(() => layoutFindings({ story: { schema_version, status: 'draft' }, docs: {}, entries: ['story.md'] })).toThrow(
        /schema_version/,
      );
    }
  });

  test('S-2.1: a version 2 standard input names the missing design.md and the stray notes.md', () => {
    const found = layoutFindings({
      story: { schema_version: 2, status: 'verified' },
      docs: { 'requirements.md': { depth: 'standard' } },
      entries: ['story.md', 'requirements.md', 'tasks.md', 'notes.md'],
    });
    expect(found.ok).toBe(false);
    expect(found.missing).toContain('design.md');
    expect(found.unexpected).toContain('notes.md');
  });
});

describe('readLayout reads the folder and answers the same (scripts wrapper)', () => {
  test('S-2.3/C1: the real MDO-0001 folder, version 1 lite, is ok', () => {
    const dir = makeTree({});
    cpSync(MDO1, dir, { recursive: true });
    expect(readLayout(dir)).toMatchObject({ version: 1, depth: 'lite', ok: true, missing: [], unexpected: [] });
  });

  test('S-2.3/C1: the same files with the story at schema_version 2 do not pass', () => {
    const story = readFileSync(join(MDO1, 'story.md'), 'utf8').replace(/^schema_version: 1$/m, 'schema_version: 2');
    const dir = makeTree({ 'story.md': story });
    for (const f of ['requirements.md', 'design.md', 'tasks.md', 'execution.md', 'progress.yml']) {
      cpSync(join(MDO1, f), join(dir, f));
    }
    expect(readLayout(dir).ok).toBe(false);
  });

  test('a schema_version of 3 is an error', () => {
    const dir = makeTree({ 'story.md': '---\nschema_version: 3\nstatus: draft\n---\n# s\n' });
    expect(() => readLayout(dir)).toThrow(/schema_version/);
  });

  test('a separate layout: key does not change the version', () => {
    const story = '---\nschema_version: 2\nlayout: 1\nid: MDO-0099\nstatus: draft\n---\n# s\n';
    const dir = makeTree({ 'story.md': story, 'execution.md': 'x', 'progress.yml': 'x' });
    expect(readLayout(dir).unexpected).toEqual(expect.arrayContaining(['execution.md', 'progress.yml']));
  });
});

describe('a removed AC is skipped (T1 done-when, traceability.md)', () => {
  const sample = join(root, 'test/fixtures/spec/MDO-0001-skills-list');
  const read = (f: string) => readFileSync(join(sample, f), 'utf8');
  const md = read('story.md').replace('### AC-2', '### AC-3 — Gone\ncritical: false\nstatus: removed\n\nMoved away.\n\n### AC-2');
  const story = parseStory(md).story!;
  const reqs = parseRequirements(read('requirements.md')).requirements;
  const tasks = parseTasks(read('tasks.md')).tasks;

  test('parseStory sets removed for status: removed and only for it', () => {
    expect(story.acs.map((a) => [a.id, a.removed])).toEqual([
      ['AC-1', false],
      ['AC-3', true],
      ['AC-2', false],
    ]);
  });

  test('trace gives no GAP for a removed AC', () => {
    const t = trace(story, reqs, tasks);
    expect(t.findings.filter((f) => f.ref.startsWith('AC-3'))).toEqual([]);
    expect(t.rows.map((r) => r.ref)).not.toContain('AC-3');
  });

  test('acStatus leaves a removed AC out', () => {
    expect(acStatus(story, tasks, [], new Set(), new Map()).map((a) => a.ref)).toEqual(['AC-1', 'AC-2']);
  });
});

describe('docs/spec-anatomy.md is built from the manifest (S-8.1)', () => {
  test('S-8.1: the page contains the tables rendered from the manifest, exactly', () => {
    expect(readFileSync(join(root, 'docs/spec-anatomy.md'), 'utf8')).toContain(anatomyTables());
  });

  test('S-8.1: every file the manifest lists per depth is in the rendered tables', () => {
    const tables = anatomyTables();
    for (const depth of DEPTHS) {
      const files = names(layoutManifest(2, depth).required).filter((n) => /\.[a-z]+$/.test(n));
      expect(files.length, depth).toBeGreaterThan(0);
      for (const f of files) expect(tables, `${depth}: ${f}`).toContain(f);
    }
  });

  test('S-8.1: the README links the page', () => {
    expect(readFileSync(join(root, 'README.md'), 'utf8')).toContain('docs/spec-anatomy.md');
  });
});

```
