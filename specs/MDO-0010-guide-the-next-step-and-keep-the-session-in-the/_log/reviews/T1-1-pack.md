# Review pack — T1, attempt 1

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T1-1.md`.

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
      "src/spec/approvals.ts",
      "src/spec/markdown.ts",
      "src/spec/index.ts",
      "src/cli/run-spec.ts",
      "src/cli/approve.ts",
      "docs/cli.md",
      "test/unit/next.test.ts",
      "test/integration/approve.test.ts"
    ],
    "exemplar": "src/spec/loop.ts",
    "ac": [
      "AC-1",
      "AC-1/C1",
      "AC-1/C2",
      "AC-5",
      "AC-5/C1",
      "AC-5/C2",
      "AC-5/C3"
    ],
    "scenarios": [
      "S-1.1",
      "S-1.2",
      "S-1.3",
      "S-1.3/C1",
      "S-1.4",
      "S-1.4/C1",
      "S-1.5",
      "S-1.6",
      "S-1.6/C1",
      "S-5.1",
      "S-5.2",
      "S-5.2/C1",
      "S-5.3",
      "S-5.3/C2",
      "S-5.4",
      "S-5.4/C3",
      "S-5.5"
    ],
    "test_levels": {
      "S-1.1": "unit",
      "S-1.2": "unit",
      "S-1.3": "unit",
      "S-1.3/C1": "e2e",
      "S-1.4": "e2e",
      "S-1.4/C1": "unit",
      "S-1.5": "unit",
      "S-1.6": "e2e",
      "S-1.6/C1": "e2e",
      "S-5.1": "e2e",
      "S-5.2": "e2e",
      "S-5.2/C1": "e2e",
      "S-5.3": "e2e",
      "S-5.3/C2": "e2e",
      "S-5.4": "e2e",
      "S-5.4/C3": "e2e",
      "S-5.5": "e2e"
    },
    "evidence": "tdd",
    "risk_tags": [
      "public-api"
    ],
    "depends_on": [],
    "parallel_safe": false,
    "verify": "npx vitest run test/unit/next.test.ts test/integration/approve.test.ts",
    "tests": {
      "unit": [
        "S-1.1",
        "S-1.2",
        "S-1.3",
        "S-1.4/C1",
        "S-1.5"
      ],
      "e2e": [
        "S-1.3/C1",
        "S-1.4",
        "S-1.6",
        "S-1.6/C1",
        "S-5.1",
        "S-5.2",
        "S-5.2/C1",
        "S-5.3",
        "S-5.3/C2",
        "S-5.4",
        "S-5.4/C3",
        "S-5.5"
      ]
    },
    "dod": [],
    "characterization": false,
    "id": "T1",
    "title": "Mandao names the next command from the spec's state",
    "done": false,
    "line": 43
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
      "ref": "AC-1/C2",
      "text": "**BUT it must NOT** run the next command itself, or record an approval or a status change: it only recommends, and the person runs the command"
    },
    {
      "ref": "AC-5",
      "text": "**GIVEN** a spec in `draft`, and the person runs the command that follows its approval (for example `/mandao-implement` on a lite spec, or `/mandao-tasks` on a standard design) · **WHEN** the command starts · **THEN** it records the approval as given by running the command (\"aprobado al correr /mandao-<command>\"), sets the documents to `approved`, and goes on without asking · **AND IT MUST** ask one question first, and record nothing until it is answered, when something is open: a pending decision, a `CONFLICT`, a `[NEEDS CLARIFICATION]` or a critical Consistency Check finding · **AND IT MUST** ask one question first when the spec changed after the last summary shown to the person · **BUT it must NOT** record an approval while a critical `OPEN` remains, whatever is answered"
    },
    {
      "ref": "AC-5/C1",
      "text": "**AND IT MUST** ask one question first, and record nothing until it is answered, when something is open: a pending decision, a `CONFLICT`, a `[NEEDS CLARIFICATION]` or a critical Consistency Check finding"
    },
    {
      "ref": "AC-5/C2",
      "text": "**AND IT MUST** ask one question first when the spec changed after the last summary shown to the person"
    },
    {
      "ref": "AC-5/C3",
      "text": "**BUT it must NOT** record an approval while a critical `OPEN` remains, whatever is answered"
    }
  ],
  "scenarios": [
    {
      "ref": "S-1.1",
      "text": "**Given** an approved standard spec whose `requirements.md` still holds `[NEEDS CLARIFICATION]` · **When** `mandao run next` runs · **Then** it recommends `/mandao-clarify`, gives the item as the reason, and does not offer `/mandao-tasks` or `/mandao-implement`"
    },
    {
      "ref": "S-1.2",
      "text": "**Given** an approved lite spec, and separately an approved standard spec with no open item · **When** `mandao run next` runs · **Then** the lite spec recommends `/mandao-implement` and the standard spec recommends `/mandao-tasks`"
    },
    {
      "ref": "S-1.3",
      "text": "**Given** a spec with a critical `OPEN`, or a draft spec · **When** `mandao run next` or `mandao approve` reports · **Then** neither recommends `/mandao-implement` · **BUT it must NOT** list implement among the options"
    },
    {
      "ref": "S-1.3/C1",
      "text": "**BUT it must NOT** list implement among the options"
    },
    {
      "ref": "S-1.4",
      "text": "**Given** a spec whose `spec.md` changed after `mandao approve <ID> spec` recorded its hash · **When** `mandao run next` runs · **Then** it recommends approving the spec again, and names the document that changed · **AND IT MUST** make no claim when the approval has no recorded hash (approvals made before this spec)"
    },
    {
      "ref": "S-1.4/C1",
      "text": "**AND IT MUST** make no claim when the approval has no recorded hash (approvals made before this spec)"
    },
    {
      "ref": "S-1.5",
      "text": "**Given** a spec with tasks left, then one with pending commits, then an `in-progress` spec with every task done, then a `verified` spec · **When** `mandao run next` runs · **Then** it recommends, in order:"
    },
    {
      "ref": "S-1.6",
      "text": "**Given** any state · **When** `mandao run next` or `mandao approve` reports · **Then** the result is data only: no command runs, and `run next` records no approval · **BUT it must NOT** record an approval or a status change: only `approve` does, and FR-5 says when"
    },
    {
      "ref": "S-1.6/C1",
      "text": "**BUT it must NOT** record an approval or a status change: only `approve` does, and FR-5 says when"
    },
    {
      "ref": "S-5.1",
      "text": "**Given** a lite draft spec with no open item, and its summary recorded as shown · **When** `mandao approve <ID> spec --by-running /mandao-implement` runs · **Then** story, spec and tasks become `approved`, `approvals.yml` records \"approved by running /mandao-implement\" with the date and the person, and the result says `go`"
    },
    {
      "ref": "S-5.2",
      "text": "**Given** the same spec, with a `CONFLICT` row, a `[NEEDS CLARIFICATION]` or a pending decision · **When** the same call runs · **Then** the result is `ask` with the item, the documents stay `draft`, and `approvals.yml` is unchanged"
    },
    {
      "ref": "S-5.2/C1",
      "text": "**Then** the result is `ask` with the item, the documents stay `draft`, and `approvals.yml` is unchanged"
    },
    {
      "ref": "S-5.3",
      "text": "**Given** a draft spec whose `spec.md` changed after `mandao run next <ID> --shown` · **When** the same call runs · **Then** the result is `ask`, naming `spec.md`, and nothing is recorded"
    },
    {
      "ref": "S-5.3/C2",
      "text": "**Then** the result is `ask`, naming `spec.md`, and nothing is recorded"
    },
    {
      "ref": "S-5.4",
      "text": "**Given** a draft spec with a critical `OPEN` · **When** the call runs, with or without `--words` · **Then** it refuses, as `approve` does today, whatever the answer"
    },
    {
      "ref": "S-5.4/C3",
      "text": "**Then** it refuses, as `approve` does today, whatever the answer"
    },
    {
      "ref": "S-5.5",
      "text": "**Given** the person wrote \"apruebo\" next to the command · **When** `mandao approve <ID> spec --by-running /mandao-implement --words \"apruebo\"` runs · **Then** `approvals.yml` records the words \"apruebo\" exactly, with the command, the date and the person"
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
      "test/unit/diagram.test.ts",
      "test/unit/doctor-cache.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/kaizen-sessions.test.ts",
      "test/unit/kaizen.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/release.test.ts",
      "test/unit/render.test.ts",
      "test/unit/session-turns.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ],
    "files": [
      "src/spec/next.ts",
      "src/spec/approvals.ts",
      "src/spec/markdown.ts",
      "src/spec/index.ts",
      "src/cli/run-spec.ts",
      "src/cli/approve.ts",
      "docs/cli.md",
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
      "test/unit/commits-times.test.ts",
      "test/unit/diagram.test.ts",
      "test/unit/doctor-cache.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/kaizen-sessions.test.ts",
      "test/unit/kaizen.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/release.test.ts",
      "test/unit/render.test.ts",
      "test/unit/session-turns.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related src/spec/next.ts src/spec/approvals.ts src/spec/markdown.ts src/spec/index.ts src/cli/run-spec.ts src/cli/approve.ts docs/cli.md test/unit/next.test.ts test/integration/approve.test.ts test/integration/branching.test.ts test/integration/characterization.test.ts test/integration/cli.test.ts test/integration/close.test.ts test/integration/costs.test.ts test/integration/doctor-cli.test.ts test/integration/enforced-rules.test.ts test/integration/engine.test.ts test/integration/leader-scripts.test.ts test/integration/ledger.test.ts test/integration/lite-spec.test.ts test/integration/mdo-0004-defects.test.ts test/integration/mdo-0005-defects.test.ts test/integration/mdo-0006-defects.test.ts test/integration/premise.test.ts test/integration/review.test.ts test/integration/scripts.test.ts test/integration/shadow.test.ts test/integration/spec-log.test.ts test/integration/start.test.ts test/integration/tdd.test.ts test/unit/commits-times.test.ts test/unit/diagram.test.ts test/unit/doctor-cache.test.ts test/unit/doctor-report.test.ts test/unit/kaizen-sessions.test.ts test/unit/kaizen.test.ts test/unit/pr-plan.test.ts test/unit/release.test.ts test/unit/render.test.ts test/unit/session-turns.test.ts test/unit/spec.test.ts test/unit/task-index.test.ts test/unit/verify.test.ts --run --maxWorkers=1"
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
      "src/cli/run-verify.ts",
      "src/cli/run.ts",
      "src/cli/spec-context.ts",
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
      "src/scripts/spec.ts",
      "src/scripts/spend.ts",
      "src/spec/requirements.ts",
      "src/spec/story.ts",
      "test/integration/characterization.test.ts",
      "test/integration/close.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/enforced-rules.test.ts",
      "test/integration/ledger.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/scripts.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/diagram.test.ts",
      "test/unit/kaizen.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/release.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/unit/next.test.ts",
      "test/integration/approve.test.ts"
    ],
    "changed": [
      "test/integration/approve.test.ts"
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
diff --git a/docs/cli.md b/docs/cli.md
index b276f85..9781218 100644
--- a/docs/cli.md
+++ b/docs/cli.md
@@ -58,6 +58,18 @@ tokens.
 - After approving the spec or the tasks, `approve` prints the command (`newSession`) that starts
   `/mandao-implement` in a new session from the worktree (ADR 0038).
 - `budget --to <usd|none>` sets or removes this spec's spend cap (ADR 0036).
+- `approve` ends with `next`: `{ recommended: { command, reason }, options }`, the commands that can follow
+  the spec's state. It only recommends; the person runs the command.
+- `--by-running <command> [--words <text>]` approves because the person ran the command that follows. It
+  prints `result: go` and approves (the row records "approved by running <command>", the words verbatim,
+  the date and the person), or `result: ask` with the open item or the changed document and approves
+  nothing. A critical OPEN is refused as always. `ask` fires on a `CONFLICT`, a `[NEEDS CLARIFICATION]`, a
+  pending decision (`- **Decision:** pending`), or a document changed after `run next --shown`.
+- Each approval row records `sha256` for the documents it approved (`tasks.md` excluded).
+
+`mandao run next <spec>` prints the same `{ recommended, options }` from the spec's state (open items,
+depth, drafts, a document changed after its approval, pending commits, tasks, verify, close). It writes
+nothing; `--shown` records a `shown` row in `approvals.yml` with the hash of each approvable document.
 
 ## Cost
 
diff --git a/src/cli/approve.ts b/src/cli/approve.ts
index cdcf8c0..b6f5ee8 100644
--- a/src/cli/approve.ts
+++ b/src/cli/approve.ts
@@ -4,13 +4,19 @@ import { join } from 'node:path';
 import type { Command } from 'commander';
 import { readConfig } from '../engine/files.js';
 import { branchingFor } from '../scripts/branching.js';
-import { commitSpecDocs, repoRoot } from '../scripts/commits.js';
+import { commitSpecDocs, commitState, repoRoot } from '../scripts/commits.js';
 import { findSpec, readSpec, type SpecFolder } from '../scripts/spec.js';
 import { docPath, LITE_DOC, logPath } from '../scripts/spec-log.js';
 import {
   APPROVAL_STEPS,
+  type Approval,
   type ApprovalStep,
   blockingMarkers,
+  changedSince,
+  docHash,
+  frontmatterOf,
+  nextStep,
+  openItems,
   parseApprovals,
   planTasks,
   renderApprovals,
@@ -71,15 +77,6 @@ function stepDocuments(spec: SpecFolder, step: ApprovalStep): string[] {
 
 const COMMIT_STEP: Partial<Record<ApprovalStep, keyof typeof SPEC_STEPS>> = { design: 'specify', spec: 'spec', tasks: 'tasks' };
 
-const NEXT: Record<ApprovalStep, string> = {
-  story: '/mandao-specify',
-  design: '/mandao-tasks',
-  spec: '/mandao-implement',
-  tasks: '/mandao-implement',
-  close: '/mandao-close (it applies the approved items)',
-  budget: 'the command that stopped at the budget (`mandao run step` delegates again)',
-};
-
 /** The approved documents get `status: approved`; returns the ones that changed, relative to the spec. */
 function approveDocuments(spec: SpecFolder, step: ApprovalStep): string[] {
   const changed: string[] = [];
@@ -98,6 +95,8 @@ interface ApproveOptions {
   items?: string[];
   by?: string;
   note?: string;
+  byRunning?: string;
+  words?: string;
 }
 
 function budgetTo(to: string | undefined): number | 'none' {
@@ -107,21 +106,74 @@ function budgetTo(to: string | undefined): number | 'none' {
   return n;
 }
 
-/** Appends the approval to `_log/approvals.yml` and returns it. */
-function recordApproval(spec: SpecFolder, step: ApprovalStep, o: ApproveOptions) {
+const APPROVABLE = ['story.md', 'requirements.md', 'design.md', 'spec.md'];
+
+/** The hash of each approvable document the spec has, by file name. tasks.md is left out: its checkboxes change as tasks pass. */
+export function currentHashes(dir: string, only?: string[]): Record<string, string> {
+  const files = APPROVABLE.filter((f) => (!only || only.includes(f)) && existsSync(join(dir, f)));
+  return Object.fromEntries(files.map((f) => [f, docHash(readFileSync(join(dir, f), 'utf8'))]));
+}
+
+const readApprovals = (spec: SpecFolder) => {
   const log = logPath(spec.dir, 'approvals.yml');
-  const record = {
-    step,
-    by: approver(spec.dir, o.by),
-    at: new Date().toISOString(),
-    ...(o.items ? { items: o.items } : {}),
-    ...(o.note ? { note: o.note } : {}),
-    ...(step === 'budget' ? { to: budgetTo(o.to) } : {}),
-  };
-  writeText(log, renderApprovals([...parseApprovals(existsSync(log) ? readFileSync(log, 'utf8') : undefined), record]));
+  return parseApprovals(existsSync(log) ? readFileSync(log, 'utf8') : undefined);
+};
+
+/** Appends a row to `_log/approvals.yml`, never rewriting the earlier ones, and returns it. */
+function appendApproval(spec: SpecFolder, row: Omit<Approval, 'by' | 'at'>, by?: string): Approval {
+  const record = { ...row, by: approver(spec.dir, by), at: new Date().toISOString() };
+  writeText(logPath(spec.dir, 'approvals.yml'), renderApprovals([...readApprovals(spec), record]));
   return record;
 }
 
+/** Records the hashes of the summary just shown to the person, for `approve --by-running` to compare against. */
+export function recordShown(spec: SpecFolder): Approval {
+  return appendApproval(spec, { step: 'shown', sha256: currentHashes(spec.dir) });
+}
+
+/** The next step from the spec's state and its facts: pending commits, approvals and the documents' hashes. */
+export function nextFor(spec: SpecFolder, config: ReturnType<typeof readConfig>) {
+  const tasks = join(spec.dir, 'tasks.md');
+  const tasksStatus = existsSync(tasks) ? frontmatterOf(readFileSync(tasks, 'utf8')).data.status : undefined;
+  return nextStep(spec, {
+    ...(typeof tasksStatus === 'string' ? { tasksStatus } : {}),
+    pendingCommits: commitState(spec, config.commits.trailers).pending,
+    approvals: readApprovals(spec),
+    hashes: currentHashes(spec.dir),
+  });
+}
+
+/** Appends the approval to `_log/approvals.yml` and returns it. */
+function recordApproval(spec: SpecFolder, step: ApprovalStep, o: ApproveOptions, docs: string[]) {
+  const note = o.byRunning ? `approved by running ${o.byRunning}` : o.note;
+  const hashes = currentHashes(spec.dir, docs);
+  return appendApproval(
+    spec,
+    {
+      step,
+      ...(o.items ? { items: o.items } : {}),
+      ...(note ? { note } : {}),
+      ...(o.words ? { words: o.words } : {}),
+      ...(Object.keys(hashes).length ? { sha256: hashes } : {}),
+      ...(step === 'budget' ? { to: budgetTo(o.to) } : {}),
+    },
+    o.by,
+  );
+}
+
+/**
+ * Approving by running the next command asks one question first when something is open, or a document
+ * changed after the last summary shown (a critical OPEN never gets here: `blockers` refuses it). Undefined
+ * means go. A spec with no `shown` row makes no claim about changes.
+ */
+function questionBefore(spec: SpecFolder): string | undefined {
+  const item = openItems(spec).ask[0];
+  if (item) return `open item: ${item}`;
+  const shown = readApprovals(spec).filter((a) => a.step === 'shown');
+  const changed = changedSince(shown.slice(-1), currentHashes(spec.dir));
+  return changed.length ? `${changed.join(', ')} changed after the summary was shown` : undefined;
+}
+
 /** The spec commit the step makes in the commands (specify, tasks), with the same fixed subject. */
 function commitApproval(config: ReturnType<typeof readConfig>, spec: SpecFolder, step: ApprovalStep) {
   const commitStep = COMMIT_STEP[step];
@@ -146,6 +198,8 @@ export function registerApprove(program: Command, ctx: CliContext) {
     .option('--to <usd|none>', 'budget: the total this spec may spend, or none to remove its cap')
     .option('--by <name>', 'who approves (default: git user.name)')
     .option('--note <text>', 'a note kept with the approval')
+    .option('--by-running <command>', 'approve because the person ran this command; asks first when something is open or changed')
+    .option('--words <text>', 'with --by-running: what the person wrote next to the command, recorded verbatim')
     .action((ref: string, step: string, o: ApproveOptions) => {
       if (!(APPROVAL_STEPS as readonly string[]).includes(step)) throw new Error(`step must be one of ${APPROVAL_STEPS.join(', ')}`);
       const s = step as ApprovalStep;
@@ -157,12 +211,27 @@ export function registerApprove(program: Command, ctx: CliContext) {
         process.exitCode = 1;
         return;
       }
+      const question = o.byRunning ? questionBefore(spec) : undefined;
+      if (question) {
+        json({ result: 'ask', approved: false, step: s, reason: question });
+        return;
+      }
+      const docs = documentsFor(spec, s).map((f) => f.slice(spec.dir.length + 1));
       const statusChanged = approveDocuments(spec, s);
-      const record = recordApproval(spec, s, o);
+      const record = recordApproval(spec, s, o, docs);
       const commit = commitApproval(config, spec, s);
       // A natural boundary with a human pause, and the most turns still ahead: implement starts in a new
       // session from the checkpoint instead of re-reading the specify context (ADR 0038).
       const newSession = s === 'spec' || s === 'tasks' ? { newSession: newSessionCommand(config, spec, 'implement') } : {};
-      json({ approved: true, ...record, statusChanged, ...(commit ? { commit } : {}), next: NEXT[s], ...newSession });
+      const next = nextFor(readSpec(spec.dir), config);
+      json({
+        ...(o.byRunning ? { result: 'go' } : {}),
+        approved: true,
+        ...record,
+        statusChanged,
+        ...(commit ? { commit } : {}),
+        next,
+        ...newSession,
+      });
     });
 }
diff --git a/src/cli/run-spec.ts b/src/cli/run-spec.ts
index 393e5cb..ceee6e8 100644
--- a/src/cli/run-spec.ts
+++ b/src/cli/run-spec.ts
@@ -22,6 +22,7 @@ import {
   withIndex,
 } from '../spec/index.js';
 import { writeText } from '../writer/files.js';
+import { nextFor, recordShown } from './approve.js';
 import { budgetFor } from './budget.js';
 import type { CliContext } from './context.js';
 import { json } from './json.js';
@@ -92,6 +93,19 @@ function registerPlanning(run: Command, ctx: CliContext) {
     });
 }
 
+/** `mandao run next`: the command that follows from the spec's state. Data only; `--shown` also records what was shown. */
+function registerNext(run: Command, ctx: CliContext) {
+  run
+    .command('next <spec>')
+    .description("The command that follows from the spec's state, and the others that can; --shown records the summary shown")
+    .option('--shown', 'record the hashes of the documents just shown to the person (approvals.yml)')
+    .action((ref: string, o: { shown?: boolean }) => {
+      const { config, spec } = loadSpec(ctx, ref);
+      if (o.shown) recordShown(spec);
+      json(nextFor(spec, config));
+    });
+}
+
 /** Per-task scripts for the Leader: brief, loop state, commit message. */
 function registerTaskScripts(run: Command, ctx: CliContext) {
   run
@@ -255,4 +269,5 @@ export function registerSpecWriters(run: Command, ctx: CliContext) {
   registerLedger(run, ctx);
   registerTestRuns(run, ctx);
   registerBuild(run, ctx);
+  registerNext(run, ctx);
 }
diff --git a/src/spec/AGENTS.md b/src/spec/AGENTS.md
index 2d8249a..3599eca 100644
--- a/src/spec/AGENTS.md
+++ b/src/spec/AGENTS.md
@@ -11,3 +11,4 @@ The CLI and scripts gather inputs; writer helpers own persistence.
 - Approval records and integrity hashes are provenance, not cryptographic identity guarantees.
 - Costs distinguish actual usage and estimates; a subscription list-price equivalent is not a bill.
 - Unit-test decisions and integration-test recording through temporary workspaces made by `makeTree`.
+- `next.ts`: `nextStep` is pure and only recommends; it never offers implement before approval or past an open item. Hashes ignore `status:` and `tasks.md`; a missing hash means no claim.
diff --git a/src/spec/approvals.ts b/src/spec/approvals.ts
index f7633f8..2e10cbe 100644
--- a/src/spec/approvals.ts
+++ b/src/spec/approvals.ts
@@ -1,22 +1,31 @@
 import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
 import { z } from 'zod';
+import { sha256 } from '../util/hash.js';
 
 /** What a human approves without a model session (cost-conscious design, `mandao approve`). */
 export const APPROVAL_STEPS = ['story', 'design', 'spec', 'tasks', 'close', 'budget'] as const;
 export type ApprovalStep = (typeof APPROVAL_STEPS)[number];
 
 export const approvalSchema = z.object({
-  step: z.enum(APPROVAL_STEPS),
+  /** `shown` is not an approval: it records the hashes of the summary shown to the person (`run next --shown`). */
+  step: z.enum([...APPROVAL_STEPS, 'shown']),
   by: z.string().min(1),
   at: z.string().min(1),
   /** close: the proposals approved (impacts, standardizations); the next close session applies them. */
   items: z.array(z.string()).optional(),
   note: z.string().optional(),
+  /** The words the person wrote next to the command that approved by running it, verbatim. */
+  words: z.string().optional(),
+  /** The hash of each approvable document, by file name, when the row was written. */
+  sha256: z.record(z.string(), z.string()).optional(),
   /** budget: the spend (USD) the person authorizes for this spec, or `none` to remove its cap (ADR 0036). */
   to: z.union([z.number().positive(), z.literal('none')]).optional(),
 });
 export type Approval = z.infer<typeof approvalSchema>;
 
+/** The hash of a document that ignores its `status:` line, so approving it or moving it on is not read as a change. */
+export const docHash = (markdown: string) => sha256(withStatus(markdown, 'approved'));
+
 /** `_log/approvals.yml`: every approval, appended, never rewritten. */
 export function parseApprovals(text: string | undefined): Approval[] {
   if (!text?.trim()) return [];
diff --git a/src/spec/index.ts b/src/spec/index.ts
index 0b9d350..720edd7 100644
--- a/src/spec/index.ts
+++ b/src/spec/index.ts
@@ -10,6 +10,7 @@ export * from './kaizen-costs.js';
 export * from './kaizen-sessions.js';
 export * from './loop.js';
 export * from './markdown.js';
+export * from './next.js';
 export * from './plan.js';
 export * from './pr-plan.js';
 export * from './premises.js';
diff --git a/test/integration/approve.test.ts b/test/integration/approve.test.ts
index a50ab27..b7e00bd 100644
--- a/test/integration/approve.test.ts
+++ b/test/integration/approve.test.ts
@@ -1,5 +1,6 @@
+// mandao-scans: none — lists only the temporary trees it creates.
 import { execFileSync } from 'node:child_process';
-import { cpSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
+import { cpSync, existsSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
 import { join } from 'node:path';
 import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
 import { buildProgram } from '../../src/cli/program.js';
@@ -59,7 +60,13 @@ describe('mandao approve: no model session', () => {
   test('design: statuses approved, who and when recorded, the specify commit made with its fixed subject', async () => {
     const root = repo();
     const r = await approve(root, 'MDO-0001', 'design');
-    expect(r).toMatchObject({ approved: true, step: 'design', by: 'Ana PO', commit: { committed: true }, next: '/mandao-tasks' });
+    expect(r).toMatchObject({
+      approved: true,
+      step: 'design',
+      by: 'Ana PO',
+      commit: { committed: true },
+      next: { recommended: { command: '/mandao-tasks' } },
+    });
     expect(r.newSession).toBeUndefined();
     expect(status(root, 'story.md')).toBe('approved');
     expect(status(root, 'requirements.md')).toBe('approved');
@@ -73,7 +80,7 @@ describe('mandao approve: no model session', () => {
     expect(await approve(root, 'MDO-0001', 'spec')).toMatchObject({
       approved: true,
       commit: { committed: true },
-      next: '/mandao-implement',
+      next: { recommended: { command: '/mandao-implement' } },
       // ADR 0038: implement starts in a new session from the worktree, not in the specify one.
       newSession: `cd ${JSON.stringify(root)} && claude "/mandao-implement MDO-0001"`,
     });
@@ -110,3 +117,163 @@ describe('withStatus', () => {
     );
   });
 });
+
+/**
+ * MDO-0010 T1. ASSUMPTIONS (the spec fixes behavior, not field names):
+ * - `run next` prints `{ recommended: { command, reason }, options: string[] }`; `approve` returns the same as `next`.
+ * - `approve --by-running` prints `result: 'go' | 'ask'`; `ask` carries a `reason` naming the item or document.
+ * - the approvals row keeps the text in `note`-like fields: asserted on the row as a whole, plus `words` and `sha256`.
+ * - a pending decision is a `**Decision:** pending` line.
+ */
+const run = async (root: string, ...args: string[]) => {
+  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
+  return JSON.parse(out.at(-1)!);
+};
+const specDir = (root: string) => join(root, SPEC);
+const approvalsFile = (root: string) => logPath(specDir(root), 'approvals.yml');
+const readApprovals = (root: string) => (existsSync(approvalsFile(root)) ? readFileSync(approvalsFile(root), 'utf8') : undefined);
+const parsed = (root: string) => parseApprovals(readApprovals(root));
+const text = (v: unknown) => JSON.stringify(v);
+
+/** The fixture as a lite spec: story.md and spec.md in draft, committed on the spec branch. */
+function liteRepo() {
+  const root = repo();
+  const req = join(specDir(root), 'requirements.md');
+  writeFileSync(join(specDir(root), 'spec.md'), readFileSync(req, 'utf8'));
+  rmSync(req);
+  rmSync(join(specDir(root), 'tasks.md'));
+  git(root, 'add', '.');
+  git(root, 'commit', '-qm', 'lite');
+  return root;
+}
+const append = (root: string, f: string, add: string) => {
+  const file = join(specDir(root), f);
+  writeFileSync(file, `${readFileSync(file, 'utf8')}\n${add}\n`);
+};
+/** Every file under the spec folder with its content, to prove a command wrote nothing. */
+function snapshot(dir: string, rel = ''): Record<string, string> {
+  const files: Record<string, string> = {};
+  for (const e of readdirSync(join(dir, rel), { withFileTypes: true })) {
+    const r = join(rel, e.name);
+    if (e.isDirectory()) Object.assign(files, snapshot(dir, r));
+    else files[r] = readFileSync(join(dir, r), 'utf8');
+  }
+  return files;
+}
+const approveByRunning = (root: string, ...more: string[]) =>
+  approve(root, 'MDO-0001', 'spec', '--by-running', '/mandao-implement', ...more);
+
+describe('mandao approve and run next report the state next step (AC-1)', () => {
+  test('S-1.3/C1: approve lists no implement among its options for a draft spec', async () => {
+    const root = repo();
+    const r = await approve(root, 'MDO-0001', 'story');
+    expect(r.approved).toBe(true);
+    expect(Array.isArray(r.next.options)).toBe(true);
+    expect(r.next.recommended.command).not.toBe('/mandao-implement');
+    expect(text(r.next)).not.toContain('/mandao-implement');
+  });
+
+  test('S-1.3/C1: run next lists no implement for a spec with a critical OPEN', async () => {
+    const root = repo();
+    append(root, 'requirements.md', '- OPEN(critical, PO): who approves refunds?');
+    const n = await run(root, 'next', 'MDO-0001');
+    expect(text(n)).not.toContain('/mandao-implement');
+    expect(n.recommended.command).toBeTypeOf('string');
+  });
+
+  test('S-1.4: after approve records a hash, a changed spec.md recommends approving again and names spec.md', async () => {
+    const root = liteRepo();
+    await approve(root, 'MDO-0001', 'spec');
+    expect(parsed(root)[0]).toMatchObject({ step: 'spec', sha256: { 'spec.md': expect.stringMatching(/^sha256-/) } });
+    expect((await run(root, 'next', 'MDO-0001')).recommended.command).toBe('/mandao-implement');
+    append(root, 'spec.md', 'A line added after the approval.');
+    const n = await run(root, 'next', 'MDO-0001');
+    expect(n.recommended.command).toContain('mandao approve');
+    expect(n.recommended.reason).toContain('spec.md');
+  });
+
+  test('S-1.6 and S-1.6/C1: plain run next writes nothing: the spec folder is byte-identical, still draft, no approval', async () => {
+    const root = liteRepo();
+    const before = snapshot(specDir(root));
+    const n = await run(root, 'next', 'MDO-0001');
+    expect(n.recommended.command).toBeTypeOf('string');
+    expect(snapshot(specDir(root))).toEqual(before);
+    expect(readApprovals(root)).toBeUndefined();
+    expect(status(root, 'story.md')).toBe('draft');
+    expect(status(root, 'spec.md')).toBe('draft');
+    expect(git(root, 'status', '--porcelain')).toBe('');
+  });
+});
+
+describe('mandao approve --by-running: running the next command is the approval (AC-5)', () => {
+  test('S-5.1: nothing open and the summary shown: approves, records the command, date and person, says go', async () => {
+    const root = liteRepo();
+    await run(root, 'next', 'MDO-0001', '--shown');
+    const r = await approveByRunning(root);
+    expect(r.result).toBe('go');
+    expect(r.approved).toBe(true);
+    expect(status(root, 'story.md')).toBe('approved');
+    expect(status(root, 'spec.md')).toBe('approved');
+    const row = parsed(root)
+      .filter((a) => a.step === 'spec')
+      .at(-1)!;
+    expect(text(row)).toContain('approved by running /mandao-implement');
+    expect(row).toMatchObject({ by: 'Ana PO', at: expect.any(String) });
+  });
+
+  test.each([
+    ['a CONFLICT row', '- CONFLICT(a: the doc, b: the code, decides: tech lead): which one wins?', 'which one wins?'],
+    ['a [NEEDS CLARIFICATION]', '- [NEEDS CLARIFICATION]: who may refund an order?', 'who may refund an order?'],
+    ['a pending decision', '- **Decision:** pending', 'pending'],
+  ])('S-5.2 and S-5.2/C1: %s returns ask with the item, the documents stay draft, approvals.yml is unchanged', async (_n, line, item) => {
+    const root = liteRepo();
+    await run(root, 'next', 'MDO-0001', '--shown');
+    append(root, 'spec.md', line);
+    await run(root, 'next', 'MDO-0001', '--shown');
+    const before = readApprovals(root);
+    const r = await approveByRunning(root);
+    expect(r.result).toBe('ask');
+    expect(r.approved).not.toBe(true);
+    expect(text(r)).toContain(item);
+    expect(status(root, 'story.md')).toBe('draft');
+    expect(status(root, 'spec.md')).toBe('draft');
+    expect(readApprovals(root)).toBe(before);
+  });
+
+  test('S-5.3 and S-5.3/C2: spec.md changed after --shown returns ask naming spec.md and records nothing', async () => {
+    const root = liteRepo();
+    await run(root, 'next', 'MDO-0001', '--shown');
+    append(root, 'spec.md', 'A line added after the summary was shown.');
+    const before = readApprovals(root);
+    const r = await approveByRunning(root);
+    expect(r.result).toBe('ask');
+    expect(text(r)).toContain('spec.md');
+    expect(status(root, 'spec.md')).toBe('draft');
+    expect(status(root, 'story.md')).toBe('draft');
+    expect(readApprovals(root)).toBe(before);
+  });
+
+  test.each([[[]], [['--words', 'apruebo']]])('S-5.4 and S-5.4/C3: a critical OPEN is refused, whatever the answer (%j)', async (words) => {
+    const root = liteRepo();
+    await run(root, 'next', 'MDO-0001', '--shown');
+    append(root, 'spec.md', '- OPEN(critical, PO): who approves refunds?');
+    const before = readApprovals(root);
+    const r = await approveByRunning(root, ...words);
+    expect(r).toMatchObject({ approved: false, problems: ['critical OPEN: who approves refunds?'] });
+    expect(process.exitCode).toBe(1);
+    expect(status(root, 'spec.md')).toBe('draft');
+    expect(readApprovals(root)).toBe(before);
+  });
+
+  test('S-5.5: the words written next to the command are recorded verbatim, with the command, date and person', async () => {
+    const root = liteRepo();
+    await run(root, 'next', 'MDO-0001', '--shown');
+    const r = await approveByRunning(root, '--words', 'apruebo');
+    expect(r.result).toBe('go');
+    const row = parsed(root)
+      .filter((a) => a.step === 'spec')
+      .at(-1)!;
+    expect(row).toMatchObject({ words: 'apruebo', by: 'Ana PO', at: expect.any(String) });
+    expect(text(row)).toContain('/mandao-implement');
+  });
+});

--- /dev/null
+++ b/src/spec/next.ts (new file)
import type { Approval } from './approvals.js';
import { blockingMarkers, frontmatterOf } from './markdown.js';
import type { Requirements } from './requirements.js';
import type { Story } from './story.js';
import type { Task } from './tasks.js';

/** The part of a spec folder the next step reads (`SpecFolder` satisfies it). */
export interface NextSpec {
  name: string;
  story?: Story;
  requirements?: Requirements;
  tasks: Task[];
}

/** What `nextStep` needs beyond the spec folder, all of it read by the caller (IO stays out of the domain). */
export interface NextFacts {
  /** Tasks passed but not yet committed (`progress.yml`). */
  pendingCommits?: string[];
  approvals?: Approval[];
  /** The `status:` of `tasks.md` when the spec has one: approved tasks mean the documents before them were reviewed. */
  tasksStatus?: string;
  /** The current hash of each approvable document, by file name (`docHash`). */
  hashes?: Record<string, string>;
}

export interface NextStep {
  recommended: { command: string; reason: string };
  /** Every command that can follow, the recommended one first. */
  options: string[];
}

/** What is still open in the story and requirements: a critical OPEN blocks approval, the rest needs one question. */
export function openItems(spec: Pick<NextSpec, 'story' | 'requirements'>): { criticalOpen: string[]; ask: string[] } {
  const raw = [spec.story?.raw, spec.requirements?.raw].filter((t): t is string => Boolean(t));
  const criticalOpen = raw.flatMap((t) => blockingMarkers(t).criticalOpen);
  const ask = raw.flatMap((t) => [
    ...blockingMarkers(t).needsClarification.map((q) => q || '[NEEDS CLARIFICATION]'),
    ...[...t.matchAll(/^[ \t]*[-*][ \t]+(CONFLICT\b[^\n]*)/gm)].map((m) => m[1]!.trim()),
    ...[...t.matchAll(/^[ \t]*(?:[-*][ \t]+)?(\*\*Decision:\*\*[ \t]*pending\b[^\n]*)/gim)].map((m) => m[1]!.trim()),
  ]);
  return { criticalOpen, ask };
}

/** The documents that changed since their last recorded hash, by file name. Without a recorded hash, none (no claim). */
export function changedSince(rows: Approval[], hashes: Record<string, string>): string[] {
  const recorded: Record<string, string> = {};
  for (const row of rows) Object.assign(recorded, row.sha256);
  return Object.keys(recorded).filter((file) => hashes[file] !== undefined && hashes[file] !== recorded[file]);
}

const approve = (id: string, step: string) => `mandao approve ${id} ${step}`;

/** Draft documents lead to the approval that moves them on; `undefined` when nothing is draft. */
function draftStep(spec: NextSpec, lite: boolean, tasksStatus: string | undefined): string | undefined {
  if (spec.requirements?.status === 'draft' && tasksStatus !== 'approved') return lite ? 'spec' : 'design';
  if (spec.story?.meta.status === 'draft') return 'story';
  return undefined;
}

const rec = (command: string, reason: string, ...others: string[]): NextStep => ({
  recommended: { command, reason },
  options: [command, ...others],
});

/** What must be settled before the spec moves on: open items, draft documents, a document changed after its approval. */
function settle(spec: NextSpec, facts: NextFacts, lite: boolean): NextStep | undefined {
  const id = spec.story?.meta.id ?? spec.name;
  const open = openItems(spec);
  const item = open.criticalOpen[0] ?? open.ask[0];
  if (item) return rec('/mandao-clarify', `${open.criticalOpen.length ? 'critical OPEN' : 'open item'}: ${item}`);
  const draft = draftStep(spec, lite, facts.tasksStatus);
  if (draft) return rec(approve(id, draft), `the ${draft === 'story' ? 'story' : 'spec'} is still draft`, '/mandao-clarify');
  const changed = changedSince(facts.approvals ?? [], facts.hashes ?? {});
  if (!changed.length) return undefined;
  return rec(approve(id, lite ? 'spec' : 'design'), `${changed.join(', ')} changed after its approval`, '/mandao-clarify');
}

/** Where an approved, settled spec stands: tasks, commits, verify, close. */
function stage(spec: NextSpec, facts: NextFacts, lite: boolean): NextStep {
  const id = spec.story?.meta.id ?? spec.name;
  const status = spec.story?.meta.status ?? 'draft';
  if (status === 'closed' || status === 'abandoned') return rec('/mandao-story', `the spec is ${status}`);
  if (status === 'blocked') return rec('/mandao-clarify', 'the spec is blocked');
  if (!spec.requirements) return rec('/mandao-specify', 'the story is approved and has no requirements yet');
  if (facts.pendingCommits?.length) {
    return rec(`mandao run commit ${id}`, `${facts.pendingCommits.join(', ')} passed and wait for their commit`);
  }
  if (status === 'verified') return rec('/mandao-close', 'the spec is verified');
  if (facts.tasksStatus === 'draft') return rec('/mandao-tasks', 'tasks.md is not approved yet', '/mandao-clarify');
  if (!lite && !spec.tasks.length) return rec('/mandao-tasks', 'the spec is approved and has no tasks yet', '/mandao-clarify');
  if (spec.tasks.length && spec.tasks.every((t) => t.done)) return rec('/mandao-verify', 'every task is done');
  return rec('/mandao-implement', spec.tasks.length ? 'tasks are left' : 'the spec is approved', '/mandao-clarify');
}

/**
 * The command that follows from the spec's state, and the others that can follow. Pure: it recommends and
 * never runs, records or changes anything (MDO-0010, AC-1). Never offers implement before the spec is
 * approved and free of open items.
 */
export function nextStep(spec: NextSpec, facts: NextFacts): NextStep {
  const lite = frontmatterOf(spec.requirements?.raw ?? '').data.depth === 'lite';
  return settle(spec, facts, lite) ?? stage(spec, facts, lite);
}

--- /dev/null
+++ b/test/unit/next.test.ts (new file)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { readSpec } from '../../src/scripts/spec.js';
import { type Approval, nextStep, setTaskDone, withStatus } from '../../src/spec/index.js';
import { sha256 } from '../../src/util/hash.js';
import { makeTree } from '../helpers.js';

/**
 * ASSUMPTION (the spec fixes behavior, not the signature): `nextStep(spec, facts)` is pure. `spec` is what
 * `readSpec` returns; `facts` carries what needs IO: the pending commit tasks, the approvals rows and the
 * current sha256 of each approvable document by file name. It answers
 * `{ recommended: { command, reason }, options: string[] }`, with `options` listing every command offered.
 */
const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const read = (f: string) => readFileSync(join(fixture, f), 'utf8');

interface Shape {
  depth: 'lite' | 'standard';
  story?: string;
  doc?: string;
  /** standard only: whether tasks.md exists yet */
  tasks?: 'none' | 'left' | 'done';
  extra?: string;
}

/** A synthetic spec folder read the way the CLI reads it. */
function spec(s: Shape) {
  const story = withStatus(read('story.md'), s.story ?? 'approved');
  const body = withStatus(read('requirements.md'), s.doc ?? 'approved').replace(/^depth: .*$/m, `depth: ${s.depth}`);
  const doc = s.extra ? body.replace('## Consistency Check', `${s.extra}\n\n## Consistency Check`) : body;
  const files: Record<string, string> = { 'story.md': story };
  files[s.depth === 'lite' ? 'spec.md' : 'requirements.md'] = doc;
  if (s.depth === 'standard' && s.tasks && s.tasks !== 'none') {
    const tasks = withStatus(read('tasks.md'), s.doc ?? 'approved');
    files['tasks.md'] = s.tasks === 'done' ? setTaskDone(tasks, 'T2', true) : tasks;
  }
  const dir = makeTree(files);
  return { spec: readSpec(dir), doc, file: s.depth === 'lite' ? 'spec.md' : 'requirements.md' };
}

const all = (n: ReturnType<typeof nextStep>) => [n.recommended.command, ...n.options].join('\n');

describe('nextStep: the next command comes from the spec state (AC-1)', () => {
  test('S-1.1: an open [NEEDS CLARIFICATION] leads to clarify, gives the item, offers neither tasks nor implement', () => {
    const { spec: s } = spec({ depth: 'standard', extra: '- [NEEDS CLARIFICATION]: who may refund an order?' });
    const n = nextStep(s, {});
    expect(n.recommended.command).toBe('/mandao-clarify');
    expect(n.recommended.reason).toContain('who may refund an order?');
    expect(all(n)).not.toContain('/mandao-tasks');
    expect(all(n)).not.toContain('/mandao-implement');
  });

  test('S-1.2: an approved lite spec leads to implement; an approved standard spec with nothing open leads to tasks', () => {
    expect(nextStep(spec({ depth: 'lite' }).spec, {}).recommended.command).toBe('/mandao-implement');
    expect(nextStep(spec({ depth: 'standard', tasks: 'none' }).spec, {}).recommended.command).toBe('/mandao-tasks');
  });

  test('S-1.3: a critical OPEN, or a draft spec, never recommends nor offers implement', () => {
    const open = spec({ depth: 'lite', extra: '- OPEN(critical, PO): who approves refunds?' }).spec;
    const draft = spec({ depth: 'lite', story: 'draft', doc: 'draft' }).spec;
    const draftStandard = spec({ depth: 'standard', story: 'draft', doc: 'draft', tasks: 'left' }).spec;
    for (const s of [open, draft, draftStandard]) {
      const n = nextStep(s, {});
      expect(n.recommended.command).not.toBe('/mandao-implement');
      expect(all(n)).not.toContain('/mandao-implement');
    }
  });
});

describe('nextStep: a document changed after its approval (S-1.4)', () => {
  const approval = (sha?: Record<string, string>): Approval =>
    ({ step: 'spec', by: 'Ana PO', at: '2026-10-20T10:00:00Z', ...(sha ? { sha256: sha } : {}) }) as Approval;

  test('S-1.4: a spec.md that differs from the recorded hash recommends approving again and names spec.md', () => {
    const { spec: s, doc } = spec({ depth: 'lite' });
    const n = nextStep(s, { approvals: [approval({ 'spec.md': sha256('what was approved') })], hashes: { 'spec.md': sha256(doc) } });
    expect(n.recommended.command).toContain('mandao approve');
    expect(n.recommended.command).toContain('spec');
    expect(n.recommended.reason).toContain('spec.md');
    expect(n.recommended.command).not.toBe('/mandao-implement');
  });

  test('S-1.4/C1: an approval without a recorded hash makes no claim about changes', () => {
    const { spec: s, doc } = spec({ depth: 'lite' });
    const n = nextStep(s, { approvals: [approval()], hashes: { 'spec.md': sha256(doc) } });
    expect(n.recommended.command).toBe('/mandao-implement');
    expect(all(n)).not.toContain('mandao approve');
    expect(n.recommended.reason).not.toMatch(/changed/i);
  });
});

describe('nextStep: later stages (S-1.5)', () => {
  test('S-1.5: tasks left -> implement; pending commits -> run commit; every task done -> verify; verified -> close', () => {
    const left = spec({ depth: 'standard', story: 'in-progress', tasks: 'left' }).spec;
    expect(nextStep(left, {}).recommended.command).toBe('/mandao-implement');

    const done = spec({ depth: 'standard', story: 'in-progress', tasks: 'done' }).spec;
    const pending = nextStep(done, { pendingCommits: ['T2'] });
    expect(pending.recommended.command).toContain('mandao run commit');
    expect(pending.recommended.command).toContain('MDO-0001');

    expect(nextStep(done, {}).recommended.command).toBe('/mandao-verify');

    const verified = spec({ depth: 'standard', story: 'verified', tasks: 'done' }).spec;
    expect(nextStep(verified, {}).recommended.command).toBe('/mandao-close');
  });
});

```
