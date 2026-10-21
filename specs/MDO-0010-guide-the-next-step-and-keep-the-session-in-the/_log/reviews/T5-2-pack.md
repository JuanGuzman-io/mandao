# Review pack — T5, attempt 2

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T5-2.md`.

## Brief

```json
{
  "spec": "MDO-0010-guide-the-next-step-and-keep-the-session-in-the",
  "task": {
    "project": "mandao",
    "kind": "feat",
    "tier": "standard",
    "files": [
      "src/spec/next.ts",
      "src/spec/markdown.ts",
      "src/cli/approve.ts",
      "src/spec/AGENTS.md",
      "core/templates/shared/rules/consistency-check.md",
      "test/unit/next.test.ts",
      "test/integration/approve.test.ts"
    ],
    "exemplar": "src/spec/next.ts",
    "ac": [
      "AC-1",
      "AC-1/C1",
      "AC-5",
      "AC-5/C1"
    ],
    "scenarios": [],
    "test_levels": {},
    "evidence": "tdd",
    "risk_tags": [
      "public-api"
    ],
    "depends_on": [
      "T1"
    ],
    "parallel_safe": false,
    "verify": "npx vitest run test/unit/next.test.ts test/integration/approve.test.ts",
    "tests": {
      "unit": [],
      "e2e": []
    },
    "dod": [],
    "characterization": false,
    "id": "T5",
    "title": "The next step reads only real markers and knows failed and closed specs",
    "done": false,
    "line": 159
  },
  "acceptance": [
    {
      "ref": "AC-1",
      "text": "**GIVEN** a command or `mandao approve` has just finished for a spec · **WHEN** it reports its result · **THEN** it lists the commands that can follow, marks the recommended one, and says in one line why, from the spec's state: open decisions or critical `OPEN`s, depth, verify findings, pending commits, and whether the spec changed after its approval. For example, an open decision leads to `/mandao-clarify`, an approved standard spec to `/mandao-tasks`, and an approved lite spec to `/mandao-implement`. · **BUT it must NOT** recommend a command the spec's state does not allow, such as implement while a critical `OPEN` remains · **BUT it must NOT** run the next command itself, or record an approval or a status change: it only recommends, and the person runs the command"
    },
    {
      "ref": "AC-1/C1",
      "text": "**BUT it must NOT** recommend a command the spec's state does not allow, such as implement while a critical `OPEN` remains"
    },
    {
      "ref": "AC-5",
      "text": "**GIVEN** a spec in `draft`, and the person runs the command that follows its approval (for example `/mandao-implement` on a lite spec, or `/mandao-tasks` on a standard design) · **WHEN** the command starts · **THEN** it records the approval as given by running the command (\"aprobado al correr /mandao-<command>\"), sets the documents to `approved`, and goes on without asking · **AND IT MUST** ask one question first, and record nothing until it is answered, when something is open: a pending decision, a `CONFLICT`, a `[NEEDS CLARIFICATION]` or a critical Consistency Check finding · **AND IT MUST** ask one question first when the spec changed after the last summary shown to the person · **BUT it must NOT** record an approval while a critical `OPEN` remains, whatever is answered"
    },
    {
      "ref": "AC-5/C1",
      "text": "**AND IT MUST** ask one question first, and record nothing until it is answered, when something is open: a pending decision, a `CONFLICT`, a `[NEEDS CLARIFICATION]` or a critical Consistency Check finding"
    }
  ],
  "scenarios": [],
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
    "attempt": 2,
    "failsAtTier": 1,
    "tdd": {
      "required": false,
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
      "test/unit/kaizen-sessions.test.ts",
      "test/unit/kaizen.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/release.test.ts",
      "test/unit/session-turns.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ],
    "files": [
      "src/spec/next.ts",
      "src/spec/markdown.ts",
      "src/cli/approve.ts",
      "src/spec/AGENTS.md",
      "core/templates/shared/rules/consistency-check.md",
      "test/unit/next.test.ts",
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
      "test/unit/kaizen-sessions.test.ts",
      "test/unit/kaizen.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/release.test.ts",
      "test/unit/session-turns.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related src/spec/next.ts src/spec/markdown.ts src/cli/approve.ts src/spec/AGENTS.md core/templates/shared/rules/consistency-check.md test/unit/next.test.ts test/integration/approve.test.ts test/integration/branching.test.ts test/integration/characterization.test.ts test/integration/cli.test.ts test/integration/close.test.ts test/integration/costs.test.ts test/integration/doctor-cli.test.ts test/integration/enforced-rules.test.ts test/integration/engine.test.ts test/integration/leader-scripts.test.ts test/integration/ledger.test.ts test/integration/lite-spec.test.ts test/integration/mdo-0004-defects.test.ts test/integration/mdo-0005-defects.test.ts test/integration/mdo-0006-defects.test.ts test/integration/premise.test.ts test/integration/review.test.ts test/integration/scripts.test.ts test/integration/shadow.test.ts test/integration/spec-log.test.ts test/integration/start.test.ts test/integration/tdd.test.ts test/integration/where.test.ts test/unit/commits-times.test.ts test/unit/diagram.test.ts test/unit/kaizen-sessions.test.ts test/unit/kaizen.test.ts test/unit/pr-plan.test.ts test/unit/release.test.ts test/unit/session-turns.test.ts test/unit/spec.test.ts test/unit/task-index.test.ts test/unit/verify.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": [
      "src/cli/program.ts",
      "src/cli/run-spec.ts",
      "src/spec/index.ts",
      "src/spec/requirements.ts",
      "src/spec/story.ts",
      "test/integration/mdo-0004-defects.test.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/unit/next.test.ts",
      "test/integration/approve.test.ts"
    ],
    "changed": []
  }
}
```

## Gates — T5, attempt 2

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
diff --git a/.mandao/mandao.lock b/.mandao/mandao.lock
index f0e92ec..43a031c 100644
--- a/.mandao/mandao.lock
+++ b/.mandao/mandao.lock
@@ -597,7 +597,7 @@ files:
     harness: mandao
     from: template:shared/rules/consistency-check.md
     ownership: owned
-    hash: sha256-twkkBQwfOt6LYf6SLU4qbV1lREF9El9csnWhd8wITZQ=
+    hash: sha256-+sHR7/SnX22JrGAEUGGz8UvajhoR2POr6W+xwDon/VI=
     scope: project
   - path: .mandao/templates/app/rules/context.md
     harness: mandao
diff --git a/.mandao/templates/app/rules/consistency-check.md b/.mandao/templates/app/rules/consistency-check.md
index 9647a0b..9a138b9 100644
--- a/.mandao/templates/app/rules/consistency-check.md
+++ b/.mandao/templates/app/rules/consistency-check.md
@@ -20,6 +20,25 @@ even when it is empty ("No findings" is written, not omitted).
 For each finding: ID, type, the two sides quoted with their location, severity (`critical` or
 `normal`), and the owner (business → PO, technical → dev).
 
+## Row shape
+
+One row per finding, in this table (the header is part of the shape; `mandao run next` reads it):
+
+```
+| ID | Type | Finding | Severity | Owner | Status |
+|---|---|---|---|---|---|
+| CC-1 | PREMISE | The refund limit is unknown. | critical | PO | open |
+```
+
+Status values: `open`, or `resolved <date>: <how>` once the owner answered. A row is resolved only when
+its Status starts with `resolved` (any case); anything else, including `unresolved`, is open.
+
+An unresolved `critical` row, or any unresolved row of type `CONFLICT`, is an open item: it needs one
+question (`/mandao-clarify`) and blocks the next step and `approve`. A resolved row is ignored. An inline
+`CONFLICT(a: …, b: …, decides: …)` is open until its line says `resolved` (a `resolved` word in backticks does not
+count). Markers written in backticks or in a fenced block in the prose are examples, not open items.
+Table rows are read by their cells; a backticked Type still counts.
+
 ## Resolution
 
 - No finding is resolved silently. Each one goes to `/mandao-clarify`.
diff --git a/core/templates/shared/rules/consistency-check.md b/core/templates/shared/rules/consistency-check.md
index 9647a0b..9a138b9 100644
--- a/core/templates/shared/rules/consistency-check.md
+++ b/core/templates/shared/rules/consistency-check.md
@@ -20,6 +20,25 @@ even when it is empty ("No findings" is written, not omitted).
 For each finding: ID, type, the two sides quoted with their location, severity (`critical` or
 `normal`), and the owner (business → PO, technical → dev).
 
+## Row shape
+
+One row per finding, in this table (the header is part of the shape; `mandao run next` reads it):
+
+```
+| ID | Type | Finding | Severity | Owner | Status |
+|---|---|---|---|---|---|
+| CC-1 | PREMISE | The refund limit is unknown. | critical | PO | open |
+```
+
+Status values: `open`, or `resolved <date>: <how>` once the owner answered. A row is resolved only when
+its Status starts with `resolved` (any case); anything else, including `unresolved`, is open.
+
+An unresolved `critical` row, or any unresolved row of type `CONFLICT`, is an open item: it needs one
+question (`/mandao-clarify`) and blocks the next step and `approve`. A resolved row is ignored. An inline
+`CONFLICT(a: …, b: …, decides: …)` is open until its line says `resolved` (a `resolved` word in backticks does not
+count). Markers written in backticks or in a fenced block in the prose are examples, not open items.
+Table rows are read by their cells; a backticked Type still counts.
+
 ## Resolution
 
 - No finding is resolved silently. Each one goes to `/mandao-clarify`.
diff --git a/docs/diagrams/src/lifecycle.json b/docs/diagrams/src/lifecycle.json
index 02d39e8..8812faa 100644
--- a/docs/diagrams/src/lifecycle.json
+++ b/docs/diagrams/src/lifecycle.json
@@ -55,7 +55,7 @@
     },
     {
       "path": "src/cli/approve.ts",
-      "sha256": "5fc400f849d24c13507bfb2f2044e4a1bcd9485893a6e52ceb1ca39023ae0d97"
+      "sha256": "a04840c8f3bcdae1fbb1ac3c2e08d9ac02c2cddc196255094ec176e8a543fd97"
     },
     {
       "path": "src/schemas/common.ts",
diff --git a/docs/diagrams/src/overview.json b/docs/diagrams/src/overview.json
index bb95e31..eb8c895 100644
--- a/docs/diagrams/src/overview.json
+++ b/docs/diagrams/src/overview.json
@@ -59,7 +59,7 @@
     },
     {
       "path": "src/spec/next.ts",
-      "sha256": "d4e59de544a61fddd927e092bf15cefaf8886a0923c6707130034574f48c08ca"
+      "sha256": "204030194f2f92cec7331799046ca3f8ed84c422e6875457e6b2fd1a633fdf6c"
     }
   ],
   "specSha256": "9f4504b95eb79a49fc89d6863c13f8e7c841fee43bb6b8ffefdaf19837aa4014",
diff --git a/src/cli/approve.ts b/src/cli/approve.ts
index 6e2d722..97eacd5 100644
--- a/src/cli/approve.ts
+++ b/src/cli/approve.ts
@@ -5,7 +5,7 @@ import type { Command } from 'commander';
 import { readConfig } from '../engine/files.js';
 import { branchingFor } from '../scripts/branching.js';
 import { commitSpecDocs, commitState, repoRoot } from '../scripts/commits.js';
-import { findSpec, readSpec, type SpecFolder } from '../scripts/spec.js';
+import { expectedPlace, findSpec, readSpec, type SpecFolder } from '../scripts/spec.js';
 import { docPath, LITE_DOC, logPath } from '../scripts/spec-log.js';
 import {
   APPROVAL_STEPS,
@@ -14,6 +14,7 @@ import {
   changedSince,
   docHash,
   frontmatterOf,
+  type NextFacts,
   nextStep,
   openItems,
   parseApprovals,
@@ -131,12 +132,36 @@ export function recordShown(spec: SpecFolder): Approval {
   return appendApproval(spec, { step: 'shown', sha256: currentHashes(spec.dir) });
 }
 
-/** The next step from the spec's state and its facts: pending commits, approvals and the documents' hashes. */
+const gitOk = (cwd: string, args: string[]) => {
+  try {
+    execFileSync('git', args, { cwd, stdio: 'ignore' });
+    return true;
+  } catch {
+    return false;
+  }
+};
+
+/** Where the spec's own branch stands: merged into `origin/<base>` (a local-only merge is not delivered), pushed (its remote branch holds it), or neither. No fact when the branch or git is missing. Read only. */
+function deliveryOf(spec: SpecFolder, config: ReturnType<typeof readConfig>): NextFacts['delivery'] {
+  const repo = repoRoot(spec.dir);
+  const base = branchingFor(config, spec.story?.meta.projects[0]).base;
+  const { branch } = expectedPlace(repo, config, spec);
+  if (!gitOk(repo, ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`])) return undefined;
+  if (gitOk(repo, ['merge-base', '--is-ancestor', branch, `origin/${base}`])) return 'merged';
+  return gitOk(repo, ['merge-base', '--is-ancestor', branch, `origin/${branch}`]) ? 'pushed' : 'unpushed';
+}
+
+/** The next step from the spec's state and its facts: pending commits, approvals, the documents' hashes, the verify verdict and, once closed, the delivery. */
 export function nextFor(spec: SpecFolder, config: ReturnType<typeof readConfig>) {
   const tasks = join(spec.dir, 'tasks.md');
   const tasksStatus = existsSync(tasks) ? frontmatterOf(readFileSync(tasks, 'utf8')).data.status : undefined;
+  const report = join(spec.dir, 'verify-report.md');
+  const verdict = existsSync(report) ? frontmatterOf(readFileSync(report, 'utf8')).data.verdict : undefined;
+  const delivery = spec.story?.meta.status === 'closed' ? deliveryOf(spec, config) : undefined;
   return nextStep(spec, {
     ...(typeof tasksStatus === 'string' ? { tasksStatus } : {}),
+    ...(typeof verdict === 'string' ? { verifyVerdict: verdict } : {}),
+    ...(delivery ? { delivery } : {}),
     pendingCommits: commitState(spec, config.commits.trailers).pending,
     approvals: readApprovals(spec),
     hashes: currentHashes(spec.dir),
diff --git a/src/spec/AGENTS.md b/src/spec/AGENTS.md
index 299b3a3..a62c5a4 100644
--- a/src/spec/AGENTS.md
+++ b/src/spec/AGENTS.md
@@ -12,3 +12,4 @@ The CLI and scripts gather inputs; writer helpers own persistence.
 - Costs distinguish actual usage and estimates; a subscription list-price equivalent is not a bill.
 - Unit-test decisions and integration-test recording through temporary workspaces made by `makeTree`.
 - `next.ts`: `nextStep` is pure and only recommends; it never offers implement before approval or past an open item (`NEEDS CLARIFICATION`, `CONFLICT` inline or as a Consistency Check row, a critical Consistency Check row, a pending decision; resolved rows are ignored). Lite is `spec.md` existing (`SpecFolder.lite`). Hashes ignore `status:` and `tasks.md`; a missing hash means no claim. Change-after-approval compares approval rows only; `shown` rows (`run next --shown`) are compared only by `approve --by-running`.
+- `next.ts` reads only real markers: `withoutCode` (`markdown.ts`) drops inline code spans and fenced blocks first, so a marker shown as an example is not an open item. A Consistency Check row is resolved when its Status starts with `resolved` (`core/templates/shared/rules/consistency-check.md`; a test pins both). A `verify-report.md` with `verdict: blocked` recommends implement, not verify. A closed spec skips the open-item check and recommends its delivery from git (`unpushed` → push, `pushed` → PR and merge, `merged` → `none`, no options); it never offers story or clarify. `nextFor` (`src/cli/approve.ts`) reads those facts from the spec's own branch (not HEAD); only `origin/<base>` counts as merged, and without git or the branch there is no delivery fact; naming the delivery performs nothing (MDO-0012).
diff --git a/src/spec/markdown.ts b/src/spec/markdown.ts
index e3840cd..cef0aae 100644
--- a/src/spec/markdown.ts
+++ b/src/spec/markdown.ts
@@ -128,9 +128,30 @@ export function listField(body: string, key: string): string[] {
     : [];
 }
 
-/** Markers that block the next phase: a critical OPEN or a `[NEEDS CLARIFICATION]`. */
+/** Fenced blocks emptied (their lines kept, so line numbers hold). */
+export function withoutFences(markdown: string): string {
+  let inFence = false;
+  return markdown
+    .split('\n')
+    .map((line) => {
+      if (/^\s*(```|~~~)/.test(line)) {
+        inFence = !inFence;
+        return '';
+      }
+      return inFence ? '' : line;
+    })
+    .join('\n');
+}
+
+/** The prose of a document: fenced blocks and inline code spans removed, because a marker shown as an example is not an open item. */
+export function withoutCode(markdown: string): string {
+  return withoutFences(markdown).replace(/(`+)[^\n]*?\1/g, '');
+}
+
+/** Markers that block the next phase: a critical OPEN or a `[NEEDS CLARIFICATION]`. Only real ones: code is not read. */
 export function blockingMarkers(markdown: string): { criticalOpen: string[]; needsClarification: string[] } {
-  const criticalOpen = [...markdown.matchAll(/OPEN\(critical[^)]*\):?\s*([^\n]*)/g)].map((m) => m[1]!.trim());
-  const needsClarification = [...markdown.matchAll(/\[NEEDS CLARIFICATION\]:?\s*([^\n]*)/g)].map((m) => m[1]!.trim());
+  const prose = withoutCode(markdown);
+  const criticalOpen = [...prose.matchAll(/OPEN\(critical[^)]*\):?\s*([^\n]*)/g)].map((m) => m[1]!.trim());
+  const needsClarification = [...prose.matchAll(/\[NEEDS CLARIFICATION\]:?\s*([^\n]*)/g)].map((m) => m[1]!.trim());
   return { criticalOpen, needsClarification };
 }
diff --git a/src/spec/next.ts b/src/spec/next.ts
index c93d10c..5c4f0a4 100644
--- a/src/spec/next.ts
+++ b/src/spec/next.ts
@@ -1,5 +1,5 @@
 import type { Approval } from './approvals.js';
-import { blockingMarkers } from './markdown.js';
+import { blockingMarkers, withoutCode, withoutFences } from './markdown.js';
 import type { Requirements } from './requirements.js';
 import type { Story } from './story.js';
 import type { Task } from './tasks.js';
@@ -23,6 +23,10 @@ export interface NextFacts {
   tasksStatus?: string;
   /** The current hash of each approvable document, by file name (`docHash`). */
   hashes?: Record<string, string>;
+  /** The `verdict:` of `verify-report.md` when there is one: `blocked` means the verify failed. */
+  verifyVerdict?: string;
+  /** Where a closed spec's branch stands in git: not pushed, pushed and not merged, or merged into its base. */
+  delivery?: 'unpushed' | 'pushed' | 'merged';
 }
 
 export interface NextStep {
@@ -33,7 +37,7 @@ export interface NextStep {
 
 /** A Consistency Check row: `| ID | Type | Finding | Severity | Owner | Status |`. Header and separator rows have no `critical`/`normal` severity. */
 function checkRows(text: string): { type: string; finding: string; severity: string; resolved: boolean }[] {
-  const rows = text
+  const rows = withoutFences(text)
     .split('\n')
     .filter((l) => l.trimStart().startsWith('|'))
     .map((l) =>
@@ -45,7 +49,7 @@ function checkRows(text: string): { type: string; finding: string; severity: str
     );
   return rows
     .filter((c) => c.length >= 6 && /^(critical|normal)$/i.test(c[3]!))
-    .map((c) => ({ type: c[1]!.replace(/`/g, ''), finding: c[2]!, severity: c[3]!.toLowerCase(), resolved: /^\W*resolved/i.test(c[5]!) }));
+    .map((c) => ({ type: c[1]!.replace(/`/g, ''), finding: c[2]!, severity: c[3]!.toLowerCase(), resolved: /^resolved/i.test(c[5]!) }));
 }
 
 /** Items that need one question: unresolved critical or `CONFLICT` Consistency Check rows, and inline `CONFLICT(a: …, b: …, decides: …)`. */
@@ -53,7 +57,7 @@ function conflictsAndFindings(text: string): string[] {
   const rows = checkRows(text)
     .filter((r) => !r.resolved && (r.severity === 'critical' || r.type.toUpperCase() === 'CONFLICT'))
     .map((r) => r.finding);
-  const inline = text
+  const inline = withoutCode(text)
     .split('\n')
     .filter((l) => !l.trimStart().startsWith('|') && !/\bresolved\b/i.test(l))
     .flatMap((l) => [...l.matchAll(/\bCONFLICT\(([^\n]*)/g)].map((m) => `CONFLICT(${m[1]!.trim()}`));
@@ -67,7 +71,7 @@ export function openItems(spec: Pick<NextSpec, 'story' | 'requirements'>): { cri
   const ask = raw.flatMap((t) => [
     ...blockingMarkers(t).needsClarification.map((q) => q || '[NEEDS CLARIFICATION]'),
     ...conflictsAndFindings(t),
-    ...[...t.matchAll(/^[ \t]*(?:[-*][ \t]+)?(\*\*Decision:\*\*[ \t]*pending\b[^\n]*)/gim)].map((m) => m[1]!.trim()),
+    ...[...withoutCode(t).matchAll(/^[ \t]*(?:[-*][ \t]+)?(\*\*Decision:\*\*[ \t]*pending\b[^\n]*)/gim)].map((m) => m[1]!.trim()),
   ]);
   return { criticalOpen, ask };
 }
@@ -111,7 +115,7 @@ function settle(spec: NextSpec, facts: NextFacts, lite: boolean): NextStep | und
 function stage(spec: NextSpec, facts: NextFacts, lite: boolean): NextStep {
   const id = spec.story?.meta.id ?? spec.name;
   const status = spec.story?.meta.status ?? 'draft';
-  if (status === 'closed' || status === 'abandoned') return rec('/mandao-story', `the spec is ${status}`);
+  if (status === 'abandoned') return rec('/mandao-story', `the spec is ${status}`);
   if (status === 'blocked') return rec('/mandao-clarify', 'the spec is blocked');
   if (!spec.requirements) return rec('/mandao-specify', 'the story is approved and has no requirements yet');
   if (facts.pendingCommits?.length) {
@@ -120,10 +124,20 @@ function stage(spec: NextSpec, facts: NextFacts, lite: boolean): NextStep {
   if (status === 'verified') return rec('/mandao-close', 'the spec is verified');
   if (facts.tasksStatus === 'draft') return rec('/mandao-tasks', 'tasks.md is not approved yet', '/mandao-clarify');
   if (!lite && !spec.tasks.length) return rec('/mandao-tasks', 'the spec is approved and has no tasks yet', '/mandao-clarify');
+  if (facts.verifyVerdict === 'blocked')
+    return rec('/mandao-implement', 'the verify failed: rework what it listed', '/mandao-verify', '/mandao-clarify');
   if (spec.tasks.length && spec.tasks.every((t) => t.done)) return rec('/mandao-verify', 'every task is done');
   return rec('/mandao-implement', spec.tasks.length ? 'tasks are left' : 'the spec is approved', '/mandao-clarify');
 }
 
+/** A closed spec has only its delivery left (push, PR, merge), read from git by the caller; naming it performs nothing (MDO-0012 does). */
+function delivery(facts: NextFacts): NextStep {
+  if (facts.delivery === 'merged')
+    return { recommended: { command: 'none', reason: 'the spec is closed and its branch is merged' }, options: [] };
+  if (facts.delivery === 'pushed') return rec('open the PR and merge it', 'the spec is closed and its branch is pushed, not merged');
+  return rec('push the branch', 'the spec is closed and its branch is not pushed');
+}
+
 /**
  * The command that follows from the spec's state, and the others that can follow. Pure: it recommends and
  * never runs, records or changes anything (MDO-0010, AC-1). Never offers implement before the spec is
@@ -131,5 +145,6 @@ function stage(spec: NextSpec, facts: NextFacts, lite: boolean): NextStep {
  */
 export function nextStep(spec: NextSpec, facts: NextFacts): NextStep {
   const lite = spec.lite ?? false;
+  if (spec.story?.meta.status === 'closed') return delivery(facts);
   return settle(spec, facts, lite) ?? stage(spec, facts, lite);
 }
diff --git a/test/integration/approve.test.ts b/test/integration/approve.test.ts
index d85de34..0fb612d 100644
--- a/test/integration/approve.test.ts
+++ b/test/integration/approve.test.ts
@@ -7,7 +7,7 @@ import { buildProgram } from '../../src/cli/program.js';
 import { writeYaml } from '../../src/engine/files.js';
 import { syncProject } from '../../src/engine/sync.js';
 import { logPath } from '../../src/scripts/spec-log.js';
-import { parseApprovals, withStatus } from '../../src/spec/index.js';
+import { parseApprovals, setTaskDone, withStatus } from '../../src/spec/index.js';
 import { makeTree, pkg } from '../helpers.js';
 
 const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
@@ -310,3 +310,70 @@ describe('mandao approve --by-running: more refusals (AC-5)', () => {
     expect(readApprovals(root)).toBe(before);
   });
 });
+
+/** MDO-0010 T5 (D1): `run next` reads a failed verify from the report and a closed spec's delivery from git. */
+describe('mandao run next: a failed verify and a closed spec (T5)', () => {
+  const closedRepo = () => {
+    const root = repo();
+    const file = join(specDir(root), 'story.md');
+    writeFileSync(file, withStatus(readFileSync(file, 'utf8'), 'closed'));
+    append(root, 'requirements.md', '- [NEEDS CLARIFICATION]: left behind?');
+    git(root, 'add', '.');
+    git(root, 'commit', '-qm', 'closed');
+    return root;
+  };
+  const names = async (root: string) => text(await run(root, 'next', 'MDO-0001'));
+
+  test('a verify-report.md with verdict blocked recommends implement, not verify', async () => {
+    const root = repo();
+    for (const f of ['story.md', 'requirements.md', 'tasks.md']) {
+      const file = join(specDir(root), f);
+      writeFileSync(file, withStatus(readFileSync(file, 'utf8'), 'approved'));
+    }
+    const tasks = join(specDir(root), 'tasks.md');
+    writeFileSync(tasks, setTaskDone(readFileSync(tasks, 'utf8'), 'T2', true));
+    expect((await run(root, 'next', 'MDO-0001')).recommended.command).toBe('/mandao-verify');
+    writeFileSync(join(specDir(root), 'verify-report.md'), '---\nverdict: blocked\n---\n# Verify\n');
+    const n = await run(root, 'next', 'MDO-0001');
+    expect(n.recommended.command).toBe('/mandao-implement');
+  });
+
+  test('closed, branch only local: names the push; pushed: names the PR and merge; merged: nothing', async () => {
+    const root = closedRepo();
+    const unpushed = await run(root, 'next', 'MDO-0001');
+    expect(unpushed.recommended.command).toMatch(/push/);
+    expect(await names(root)).not.toMatch(/mandao-story|mandao-clarify/);
+
+    const remote = realpathSync(makeTree({}));
+    git(remote, 'init', '-q', '--bare');
+    git(root, 'remote', 'add', 'origin', remote);
+    git(root, 'push', '-q', '-u', 'origin', 'feat/MDO-0001-skills-list');
+    const pushed = await run(root, 'next', 'MDO-0001');
+    expect(pushed.recommended.command).toMatch(/PR|pull request/i);
+    expect(await names(root)).not.toMatch(/mandao-story|mandao-clarify/);
+
+    git(root, 'branch', 'main');
+    const local = await run(root, 'next', 'MDO-0001');
+    expect(local.recommended.command, 'a merge only into the local base is not delivered').toMatch(/push|PR|pull request/i);
+    expect(local.options).not.toEqual([]);
+
+    git(root, 'push', '-q', 'origin', 'main');
+    const merged = await run(root, 'next', 'MDO-0001');
+    expect(merged.options).toEqual([]);
+    expect(await names(root)).not.toMatch(/mandao-story|mandao-clarify/);
+  });
+
+  test('the delivery is read from the spec branch, not from the checked-out one', async () => {
+    const root = closedRepo();
+    git(root, 'commit', '-q', '--allow-empty', '-m', 'more work');
+    git(root, 'branch', 'main', 'HEAD~1');
+    git(root, 'checkout', '-q', 'main');
+    expect((await run(root, 'next', 'MDO-0001')).recommended.command).toMatch(/push/);
+  });
+
+  test('run next on a closed spec writes nothing', async () => {
+    const root = closedRepo();
+    await run(root, 'next', 'MDO-0001');
+    expect(git(root, 'status', '--porcelain')).toBe('');
+  });
+});
diff --git a/test/unit/next.test.ts b/test/unit/next.test.ts
index ee96905..bf74d51 100644
--- a/test/unit/next.test.ts
+++ b/test/unit/next.test.ts
@@ -1,4 +1,5 @@
-import { readFileSync } from 'node:fs';
+// mandao-scans: core/templates/shared/rules/ specs/ — reads the consistency-check rule and the MDO-0010 spec folder by path.
+import { readdirSync, readFileSync } from 'node:fs';
 import { join } from 'node:path';
 import { describe, expect, test } from 'vitest';
 import { readSpec } from '../../src/scripts/spec.js';
@@ -167,3 +168,106 @@ describe('nextStep: approval hashes and depth (S-1.4, FR-1)', () => {
     expect(all(n)).not.toContain('/mandao-tasks');
   });
 });
+
+/** MDO-0010 T5 (D1, D6): only real markers count, a failed verify reworks, a closed spec is delivered. */
+const ticks = '`';
+const fence = '```';
+describe('nextStep: markers inside code are not open items', () => {
+  const markers = ['[NEEDS CLARIFICATION]: who pays?', 'OPEN(critical, PO): who pays?', 'CONFLICT(a: x, b: y, decides: PO): which?'];
+  for (const marker of markers) {
+    const name = marker.split(/[(:\]]/)[0]!.replace('[', '');
+    test(`${name} in an inline code span or a fenced block is ignored, in prose it still counts`, () => {
+      const inline = nextStep(spec({ depth: 'lite', extra: `The marker ${ticks}${marker}${ticks} is explained here.` }).spec, {});
+      const fenced = nextStep(spec({ depth: 'lite', extra: `${fence}\n${marker}\n${fence}` }).spec, {});
+      expect(inline.recommended.command).toBe('/mandao-implement');
+      expect(fenced.recommended.command).toBe('/mandao-implement');
+      const real = nextStep(spec({ depth: 'lite', extra: `- ${marker}` }).spec, {});
+      expect(real.recommended.command).toBe('/mandao-clarify');
+    });
+  }
+
+  test('a pending decision in a code span or block is ignored too', () => {
+    const extra = `Write ${ticks}**Decision:** pending${ticks} for it.\n\n${fence}\n**Decision:** pending\n${fence}`;
+    expect(nextStep(spec({ depth: 'lite', extra }).spec, {}).recommended.command).toBe('/mandao-implement');
+    expect(nextStep(spec({ depth: 'lite', extra: '**Decision:** pending' }).spec, {}).recommended.command).toBe('/mandao-clarify');
+  });
+
+  test('MDO-0010 itself: a marker named in backticks in prose does not recommend clarify', () => {
+    const specs = join(import.meta.dirname, '../../specs');
+    const folder = readdirSync(specs).find((n) => n.startsWith('MDO-0010-'));
+    expect(folder, 'the MDO-0010 spec folder is under specs/').toBeDefined();
+    expect(nextStep(readSpec(join(specs, folder as string)), {}).recommended.command).not.toBe('/mandao-clarify');
+  });
+});
+
+describe('nextStep: a failed verify and a closed spec', () => {
+  test('a spec whose verify was blocked recommends the rework, even with every task done', () => {
+    const s = spec({ depth: 'standard', tasks: 'done' }).spec;
+    expect(nextStep(s, {}).recommended.command).toBe('/mandao-verify');
+    const n = nextStep(s, { verifyVerdict: 'blocked' });
+    expect(n.recommended.command).toBe('/mandao-implement');
+    expect(n.recommended.reason).toContain('verify');
+  });
+
+  const closed = (extra?: string) => spec({ depth: 'lite', story: 'closed', ...(extra ? { extra } : {}) }).spec;
+  const marker = '- [NEEDS CLARIFICATION]: who pays?\n- OPEN(critical, PO): who?';
+
+  test('a closed spec not pushed recommends the push, never story or clarify, whatever markers remain', () => {
+    const n = nextStep(closed(marker), { delivery: 'unpushed' });
+    expect(n.recommended.command).toMatch(/push/);
+    expect(all(n)).not.toMatch(/mandao-story|mandao-clarify/);
+  });
+
+  test('a closed spec pushed and not merged recommends the PR and merge', () => {
+    const n = nextStep(closed(), { delivery: 'pushed' });
+    expect(n.recommended.command).toMatch(/PR|pull request/i);
+    expect(n.recommended.command).toMatch(/merge/);
+    expect(all(n)).not.toMatch(/mandao-story|mandao-clarify/);
+  });
+
+  test('a closed spec whose branch is merged recommends nothing', () => {
+    const n = nextStep(closed(marker), { delivery: 'merged' });
+    expect(n.options).toEqual([]);
+    expect(n.recommended.command).toBe('none');
+    expect(all(n)).not.toMatch(/mandao-story|mandao-clarify/);
+  });
+
+  test('a closed spec without a delivery fact still never recommends story or clarify', () => {
+    expect(all(nextStep(closed(marker), {}))).not.toMatch(/mandao-story|mandao-clarify/);
+  });
+});
+
+describe('consistency-check.md and the code agree on when a row is resolved', () => {
+  const rule = readFileSync(join(import.meta.dirname, '../../core/templates/shared/rules/consistency-check.md'), 'utf8');
+
+  test('the rule states the row shape and the statuses it names', () => {
+    expect(rule).toContain('| ID | Type | Finding | Severity | Owner | Status |');
+    expect(rule).toMatch(/^Status values: `open`.*`resolved/m);
+  });
+
+  test('a row with each status the rule names is read as it says: open blocks, resolved does not', () => {
+    const line = rule.match(/^Status values:(.*)$/m)![1]!;
+    const names = [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]!);
+    expect(names.length).toBeGreaterThanOrEqual(2);
+    for (const status of names) {
+      const resolved = status.startsWith('resolved');
+      const row = `| CC-1 | PREMISE | The limit is unknown. | critical | PO | ${status} |`;
+      const n = nextStep(withCheck(cc(row)), {});
+      expect(n.recommended.command, status).toBe(resolved ? '/mandao-implement' : '/mandao-clarify');
+    }
+    const open = nextStep(withCheck(cc('| CC-1 | PREMISE | x | critical | PO | unresolved |')), {});
+    expect(open.recommended.command).toBe('/mandao-clarify');
+  });
+
+  test('leading formatting is not a resolution, and the rule says a status must start with resolved', () => {
+    const row = '| CC-1 | PREMISE | x | critical | PO | **resolved** |';
+    expect(nextStep(withCheck(cc(row)), {}).recommended.command).toBe('/mandao-clarify');
+    expect(rule).toMatch(/starts with `resolved`/);
+  });
+
+  test('a backticked Type still counts, and the rule scopes the backtick exemption to prose', () => {
+    const row = '| CC-1 | `CONFLICT` | x | normal | PO | open |';
+    expect(nextStep(withCheck(cc(row)), {}).recommended.command).toBe('/mandao-clarify');
+    expect(rule).toMatch(/Table rows are read by their cells; a backticked Type still counts/);
+  });
+});

```
