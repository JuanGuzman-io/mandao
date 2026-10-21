# Review pack — T4, attempt 2

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T4-2.md`.

## Brief

```json
{
  "spec": "MDO-0011-one-fixed-layout-for-every-spec-folder",
  "task": {
    "project": "mandao",
    "kind": "feat",
    "tier": "strong",
    "files": [
      "src/scripts/spec-log.ts",
      "src/scripts/gates.ts",
      "src/scripts/forced.ts",
      "src/cli/run-leader.ts",
      "src/cli/run-review.ts",
      "src/cli/checkpoint-guards.ts",
      "src/cli/run-premise.ts",
      "src/cli/run-mutation.ts",
      "src/writer/log-integrity.ts",
      "src/engine/graph.ts",
      "src/schemas/config.ts",
      "src/cli/run-verify.ts",
      "test/integration/log-v2.test.ts"
    ],
    "exemplar": "src/scripts/spec-log.ts",
    "ac": [
      "AC-3",
      "AC-3/C1",
      "AC-3/C2",
      "AC-3/C3"
    ],
    "scenarios": [
      "S-3.1",
      "S-3.2",
      "S-3.2/C1",
      "S-3.3",
      "S-3.3/C2",
      "S-3.4",
      "S-3.4/C3"
    ],
    "test_levels": {
      "S-3.1": "e2e",
      "S-3.2": "e2e",
      "S-3.2/C1": "e2e",
      "S-3.3": "e2e",
      "S-3.3/C2": "e2e",
      "S-3.4": "e2e",
      "S-3.4/C3": "unit"
    },
    "evidence": "tdd",
    "risk_tags": [
      "public-api"
    ],
    "depends_on": [
      "T3"
    ],
    "parallel_safe": false,
    "verify": "npx vitest run test/integration/log-v2.test.ts test/integration/spec-log.test.ts test/integration/ledger.test.ts test/integration/enforced-rules.test.ts test/integration/tdd.test.ts",
    "tests": {
      "unit": [
        "S-3.4/C3"
      ],
      "e2e": [
        "S-3.1",
        "S-3.2",
        "S-3.2/C1",
        "S-3.3",
        "S-3.3/C2",
        "S-3.4"
      ]
    },
    "dod": [],
    "characterization": false,
    "id": "T4",
    "title": "The committed log is six files; the bulk stays in a local cache",
    "done": false,
    "line": 136
  },
  "acceptance": [
    {
      "ref": "AC-3",
      "text": "**GIVEN** a spec whose tasks went through several attempts, gates, reviews and premises · **WHEN** its log is committed · **THEN** it holds only the six fixed files, and their number does not grow with attempts · **AND IT MUST** keep the full gate output, Reviewer packs, probes and integrity data in the spec's local cache, outside git · **AND IT MUST** keep resume, trace, verify, Kaizen and the integrity check working on it · **BUT it must NOT** lose a verdict, a failing gate's relevant output, an approval or a premise result from the committed log"
    },
    {
      "ref": "AC-3/C1",
      "text": "**AND IT MUST** keep the full gate output, Reviewer packs, probes and integrity data in the spec's local cache, outside git"
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
      "ref": "S-3.1",
      "text": "**Given** a version 2 spec whose 3 tasks ran 2 attempts each, with gates, reviews, a mutation and 2 premises · **When** the task commits are made · **Then** `git ls-files <spec>/_log` lists exactly the six files"
    },
    {
      "ref": "S-3.2",
      "text": "**Given** the same spec · **When** a Reviewer pack and full gate output are written · **Then** they are under `.mandao/cache/<ID>/`, and `git status` does not show them"
    },
    {
      "ref": "S-3.2/C1",
      "text": "**Then** they are under `.mandao/cache/<ID>/`, and `git status` does not show them"
    },
    {
      "ref": "S-3.3",
      "text": "**Given** the same spec · **When** resume, trace, verify-plan, implement-summary, kaizen, kaizen-compare, next and the integrity check run · **Then** each gives the answer it gives on the same history in version 1"
    },
    {
      "ref": "S-3.3/C2",
      "text": "**Then** each gives the answer it gives on the same history in version 1"
    },
    {
      "ref": "S-3.4",
      "text": "**Given** a FAIL review, a failing gate, an approval with `--words`, and a premise run · **When** they are committed · **Then** `reviews.md` holds the verdict and findings, `gates.md` the failing gate's output for the task's files, `state.yml` the approval with words and hashes, and `premises.md` the exit code and the excerpt"
    },
    {
      "ref": "S-3.4/C3",
      "text": "**Then** `reviews.md` holds the verdict and findings, `gates.md` the failing gate's output for the task's files, `state.yml` the approval with words and hashes, and `premises.md` the exit code and the excerpt"
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
    "task": "T4",
    "tier": "strong",
    "attempt": 2,
    "failsAtTier": 1,
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
      "test/integration/init-skills.test.ts",
      "test/integration/layout.test.ts",
      "test/integration/leader-scripts.test.ts",
      "test/integration/ledger.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/review.test.ts",
      "test/integration/run-queue.test.ts",
      "test/integration/scripts.test.ts",
      "test/integration/shadow.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/start.test.ts",
      "test/integration/state-log.test.ts",
      "test/integration/tdd.test.ts",
      "test/integration/where.test.ts",
      "test/unit/command-skills.test.ts",
      "test/unit/commitlint.test.ts",
      "test/unit/commits-times.test.ts",
      "test/unit/content.test.ts",
      "test/unit/diagram.test.ts",
      "test/unit/doctor-cache.test.ts",
      "test/unit/doctor-codex.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/doctor-sdd.test.ts",
      "test/unit/doctor-skills.test.ts",
      "test/unit/frontmatter.test.ts",
      "test/unit/git-copy.test.ts",
      "test/unit/impact.test.ts",
      "test/unit/kaizen-sessions.test.ts",
      "test/unit/kaizen.test.ts",
      "test/unit/launcher.test.ts",
      "test/unit/layout.test.ts",
      "test/unit/log-cache.test.ts",
      "test/unit/model-profiles.test.ts",
      "test/unit/models.test.ts",
      "test/unit/next.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/providers.test.ts",
      "test/unit/release.test.ts",
      "test/unit/render.test.ts",
      "test/unit/resolver.test.ts",
      "test/unit/schemas.test.ts",
      "test/unit/scripts.test.ts",
      "test/unit/session-advice.test.ts",
      "test/unit/session-cut.test.ts",
      "test/unit/session-turns.test.ts",
      "test/unit/skills-list.test.ts",
      "test/unit/skills.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/tools.test.ts",
      "test/unit/verify.test.ts",
      "test/unit/workspace.test.ts",
      "test/unit/writer.test.ts"
    ],
    "files": [
      "src/scripts/spec-log.ts",
      "src/scripts/gates.ts",
      "src/scripts/forced.ts",
      "src/cli/run-leader.ts",
      "src/cli/run-review.ts",
      "src/cli/checkpoint-guards.ts",
      "src/cli/run-premise.ts",
      "src/cli/run-mutation.ts",
      "src/writer/log-integrity.ts",
      "src/engine/graph.ts",
      "src/schemas/config.ts",
      "src/cli/run-verify.ts",
      "test/integration/log-v2.test.ts",
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
      "test/integration/init-skills.test.ts",
      "test/integration/layout.test.ts",
      "test/integration/leader-scripts.test.ts",
      "test/integration/ledger.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/review.test.ts",
      "test/integration/run-queue.test.ts",
      "test/integration/scripts.test.ts",
      "test/integration/shadow.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/start.test.ts",
      "test/integration/state-log.test.ts",
      "test/integration/tdd.test.ts",
      "test/integration/where.test.ts",
      "test/unit/command-skills.test.ts",
      "test/unit/commitlint.test.ts",
      "test/unit/commits-times.test.ts",
      "test/unit/content.test.ts",
      "test/unit/diagram.test.ts",
      "test/unit/doctor-cache.test.ts",
      "test/unit/doctor-codex.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/doctor-sdd.test.ts",
      "test/unit/doctor-skills.test.ts",
      "test/unit/frontmatter.test.ts",
      "test/unit/git-copy.test.ts",
      "test/unit/impact.test.ts",
      "test/unit/kaizen-sessions.test.ts",
      "test/unit/kaizen.test.ts",
      "test/unit/launcher.test.ts",
      "test/unit/layout.test.ts",
      "test/unit/log-cache.test.ts",
      "test/unit/model-profiles.test.ts",
      "test/unit/models.test.ts",
      "test/unit/next.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/providers.test.ts",
      "test/unit/release.test.ts",
      "test/unit/render.test.ts",
      "test/unit/resolver.test.ts",
      "test/unit/schemas.test.ts",
      "test/unit/scripts.test.ts",
      "test/unit/session-advice.test.ts",
      "test/unit/session-cut.test.ts",
      "test/unit/session-turns.test.ts",
      "test/unit/skills-list.test.ts",
      "test/unit/skills.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/tools.test.ts",
      "test/unit/verify.test.ts",
      "test/unit/workspace.test.ts",
      "test/unit/writer.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related src/scripts/spec-log.ts src/scripts/gates.ts src/scripts/forced.ts src/cli/run-leader.ts src/cli/run-review.ts src/cli/checkpoint-guards.ts src/cli/run-premise.ts src/cli/run-mutation.ts src/writer/log-integrity.ts src/engine/graph.ts src/schemas/config.ts src/cli/run-verify.ts test/integration/log-v2.test.ts test/adapters/adapters.test.ts test/integration/approve.test.ts test/integration/branching.test.ts test/integration/characterization.test.ts test/integration/cli.test.ts test/integration/close.test.ts test/integration/costs.test.ts test/integration/doctor-cli.test.ts test/integration/enforced-rules.test.ts test/integration/engine.test.ts test/integration/init-skills.test.ts test/integration/layout.test.ts test/integration/leader-scripts.test.ts test/integration/ledger.test.ts test/integration/lite-spec.test.ts test/integration/mdo-0004-defects.test.ts test/integration/mdo-0005-defects.test.ts test/integration/mdo-0006-defects.test.ts test/integration/premise.test.ts test/integration/review.test.ts test/integration/run-queue.test.ts test/integration/scripts.test.ts test/integration/shadow.test.ts test/integration/spec-log.test.ts test/integration/start.test.ts test/integration/state-log.test.ts test/integration/tdd.test.ts test/integration/where.test.ts test/unit/command-skills.test.ts test/unit/commitlint.test.ts test/unit/commits-times.test.ts test/unit/content.test.ts test/unit/diagram.test.ts test/unit/doctor-cache.test.ts test/unit/doctor-codex.test.ts test/unit/doctor-report.test.ts test/unit/doctor-sdd.test.ts test/unit/doctor-skills.test.ts test/unit/frontmatter.test.ts test/unit/git-copy.test.ts test/unit/impact.test.ts test/unit/kaizen-sessions.test.ts test/unit/kaizen.test.ts test/unit/launcher.test.ts test/unit/layout.test.ts test/unit/log-cache.test.ts test/unit/model-profiles.test.ts test/unit/models.test.ts test/unit/next.test.ts test/unit/pr-plan.test.ts test/unit/providers.test.ts test/unit/release.test.ts test/unit/render.test.ts test/unit/resolver.test.ts test/unit/schemas.test.ts test/unit/scripts.test.ts test/unit/session-advice.test.ts test/unit/session-cut.test.ts test/unit/session-turns.test.ts test/unit/skills-list.test.ts test/unit/skills.test.ts test/unit/spec.test.ts test/unit/task-index.test.ts test/unit/tools.test.ts test/unit/verify.test.ts test/unit/workspace.test.ts test/unit/writer.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": [
      "src/adapters/types.ts",
      "src/cli/approve.ts",
      "src/cli/budget.ts",
      "src/cli/init-files.ts",
      "src/cli/init.ts",
      "src/cli/run-close.ts",
      "src/cli/run-cost.ts",
      "src/cli/run-diagram.ts",
      "src/cli/run-ledger.ts",
      "src/cli/run-spec.ts",
      "src/cli/run.ts",
      "src/cli/session-advice.ts",
      "src/cli/start.ts",
      "src/commits/commitlint.ts",
      "src/engine/doctor-harness.ts",
      "src/engine/doctor-models.ts",
      "src/engine/doctor-specs.ts",
      "src/engine/doctor.ts",
      "src/engine/files.ts",
      "src/engine/launcher.ts",
      "src/engine/modules.ts",
      "src/engine/shadow.ts",
      "src/engine/sync.ts",
      "src/models/load.ts",
      "src/render/render.ts",
      "src/schemas/index.ts",
      "src/scripts/branching.ts",
      "src/scripts/brief.ts",
      "src/scripts/checkpoint.ts",
      "src/scripts/close.ts",
      "src/scripts/commits.ts",
      "src/scripts/fingerprint.ts",
      "src/scripts/quick-check.ts",
      "src/scripts/resources.ts",
      "src/scripts/session-cut.ts",
      "src/scripts/session-turns.ts",
      "src/scripts/spec.ts",
      "src/scripts/spend.ts",
      "src/spec/commit.ts",
      "src/spec/tasks.ts",
      "src/workspace/detect.ts",
      "src/writer/files.ts",
      "test/adapters/adapters.test.ts",
      "test/integration/approve.test.ts",
      "test/integration/branching.test.ts",
      "test/integration/close.test.ts",
      "test/integration/enforced-rules.test.ts",
      "test/integration/leader-scripts.test.ts",
      "test/integration/ledger.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/scripts.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/commitlint.test.ts",
      "test/unit/commits-times.test.ts",
      "test/unit/content.test.ts",
      "test/unit/log-cache.test.ts",
      "test/unit/schemas.test.ts",
      "test/unit/spec.test.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/integration/log-v2.test.ts",
      "test/unit/log-cache.test.ts"
    ],
    "changed": [
      "test/integration/log-v2.test.ts"
    ]
  }
}
```

## Gates — T4, attempt 2

Every configured gate passed.

| Gate | Status | Exit |
|---|---|---|
| scan-markers | PASS | — |
| format | PASS | 0 |
| lint | PASS | 0 |
| typecheck | PASS | 0 |
| test | NOT_INSTALLED | 0 |
| build | PASS | 0 |
| secrets | NOT_INSTALLED | 127 |
| audit | SKIPPED | — |
| sast | NOT_INSTALLED | 127 |
| metrics | PASS | 0 |


## Diff

```diff
diff --git a/docs/backlog.md b/docs/backlog.md
index 6306b01..c66e863 100644
--- a/docs/backlog.md
+++ b/docs/backlog.md
@@ -145,6 +145,9 @@ Rules the commands state as prose become checks a script enforces.
 - **`mandao approve` can revoke an approval.** The revocation is recorded with its reason; nothing is
   deleted.
 - **Decide where `.integrity.json` lives:** in git on every task, only at close, or outside git.
+- **Red first only for the tests the task added or changed.** The red-first guard (`testsWithoutRed`)
+  asks for red only for tests added or changed in the task's diff against the base, not for every test
+  in the declared files. A declared file the diff does not touch asks for nothing (MDO-0011 T4 pivot).
 
 ## Security gates from the user's CI
 
diff --git a/src/cli/checkpoint-guards.ts b/src/cli/checkpoint-guards.ts
index 44b4a56..c48049e 100644
--- a/src/cli/checkpoint-guards.ts
+++ b/src/cli/checkpoint-guards.ts
@@ -5,7 +5,7 @@ import { repoRoot } from '../scripts/commits.js';
 import { testsWithoutRed } from '../scripts/red.js';
 import { parseVerdict } from '../scripts/review.js';
 import type { SpecFolder } from '../scripts/spec.js';
-import { logPath } from '../scripts/spec-log.js';
+import { cachePath, logPath, specLogInCache, writeLogSection } from '../scripts/spec-log.js';
 import { commitMessage, NOTE_FLAGS, securityBlockers, taskAttempt, UNTAGGED_NOTE, untaggedSecurityMentions } from '../spec/index.js';
 import { writeText } from '../writer/files.js';
 import { acceptLogs, logDiscrepancies } from '../writer/log-integrity.js';
@@ -34,7 +34,8 @@ function readReview(source: string): string {
 }
 
 /**
- * A Reviewer's verdict is recorded with its whole answer (`--review`), kept in `_log/reviews/`. The script
+ * A Reviewer's verdict is recorded with its whole answer (`--review`), kept in `_log/reviews/` (version 2:
+ * one `## Tn — attempt k` section of `_log/reviews.md`). The script
  * checks it: the answer's VERDICT must match, and a PASS with a high or critical security finding is
  * refused (MDO-0008). Returns a note for the row when untagged prose looks like a severe security issue.
  */
@@ -52,8 +53,9 @@ export function checkReview(
   if (blockers.length) {
     throw new Error(`a PASS cannot carry an open high-severity security finding: record FAIL and rework. ${blockers.join(' | ')}`);
   }
-  const file = join(logPath(spec.dir, 'reviews'), `${o.task}-${taskAttempt(spec.execution, o.task)}-review.md`);
-  writeText(file, text);
+  const attempt = taskAttempt(spec.execution, o.task);
+  if (specLogInCache(spec.dir)) writeLogSection(spec.dir, 'reviews.md', `${o.task} — attempt ${attempt}`, text);
+  else writeText(join(logPath(spec.dir, 'reviews'), `${o.task}-${attempt}-review.md`), text);
   const untagged = untaggedSecurityMentions(text);
   return untagged.length ? `${UNTAGGED_NOTE}: ${untagged.join(' | ')}` : undefined;
 }
@@ -66,7 +68,8 @@ export function checkReview(
 export function recordLogEdits(spec: SpecFolder, at: string, context: string): string | undefined {
   const edited = logDiscrepancies(spec.dir);
   if (!edited.length) return undefined;
-  const file = logPath(spec.dir, 'discrepancies.md');
+  // Version 2: the row's note is the committed record; the list itself stays in the local cache.
+  const file = specLogInCache(spec.dir) ? cachePath(spec.dir, 'discrepancies.md') : logPath(spec.dir, 'discrepancies.md');
   const before = existsSync(file) ? readFileSync(file, 'utf8') : '# Discrepancies (logs edited outside the scripts)\n\n';
   writeText(file, `${before}- ${at} · ${context} · ${edited.join(', ')}\n`);
   acceptLogs(spec.dir, edited);
diff --git a/src/cli/run-close.ts b/src/cli/run-close.ts
index dc14cca..0175636 100644
--- a/src/cli/run-close.ts
+++ b/src/cli/run-close.ts
@@ -11,7 +11,7 @@ import { publishPlan } from '../scripts/publish.js';
 import { sizeLimits } from '../scripts/quick-check.js';
 import { measureSessions } from '../scripts/session-turns.js';
 import { findSpec, readSpec, type SpecFolder } from '../scripts/spec.js';
-import { docPath, hasExecutionLog, logPath } from '../scripts/spec-log.js';
+import { docPath, dropLogCache, hasExecutionLog, logPath } from '../scripts/spec-log.js';
 import { specSpend } from '../scripts/spend.js';
 import {
   acStatus,
@@ -195,6 +195,8 @@ function registerSummary(run: Command, ctx: CliContext) {
       const spec = readSpec(findSpec(ctx.root(), config, ref));
       const summary = updatedSummary(config, spec, o);
       writeText(join(spec.dir, 'close-summary.md'), renderCloseSummary(summary, closeLinks(ctx.root(), config, spec)));
+      // A version 2 spec's local cache goes at close, unless `logs.level: full` keeps it (MDO-0011 D3).
+      if (o.closed) dropLogCache(spec.dir, config.logs.level);
       json(summary);
     });
 }
diff --git a/src/cli/run-leader.ts b/src/cli/run-leader.ts
index 90d4d1d..f604ac7 100644
--- a/src/cli/run-leader.ts
+++ b/src/cli/run-leader.ts
@@ -3,13 +3,13 @@ import { join, relative } from 'node:path';
 import type { Command } from 'commander';
 import { composeBrief } from '../scripts/brief.js';
 import { changedFiles, commitState, repoRoot } from '../scripts/commits.js';
-import { GATE_ORDER, type GateResult, gateResult, gatesLog, gatesPassed } from '../scripts/gates.js';
+import { GATE_ORDER, type GateResult, gateResult, gatesLog, gatesPassed, gatesSection } from '../scripts/gates.js';
 import { fillCommand, isTestFile, unmarkedScanners } from '../scripts/impact.js';
 import { decideBudget, effectiveResources, probeMachine } from '../scripts/resources.js';
 import { taskDiff } from '../scripts/review.js';
 import { runTests } from '../scripts/run-tests.js';
 import type { SpecFolder } from '../scripts/spec.js';
-import { logPath, readApprovalLog } from '../scripts/spec-log.js';
+import { cachePath, logPath, logSections, readApprovalLog, specLogInCache, writeLogSection } from '../scripts/spec-log.js';
 import { specSpend } from '../scripts/spend.js';
 import {
   type ExecutionRow,
@@ -31,7 +31,7 @@ import { harnessOption, impactFor, loadSpec, loopContext, modelsFor } from './sp
 
 /**
  * Leader scripts (cost-conscious design): the mechanical part of a Leader step runs here and returns only
- * what the Leader decides on. Full outputs stay in `_log/` for the Reviewer and verify.
+ * what the Leader decides on. Full outputs stay in `_log/` (version 2: `.mandao/cache/<ID>/`) for the Reviewer and verify.
  */
 
 const DEP_MANIFEST =
@@ -100,15 +100,50 @@ async function runGates(ctx: CliContext, spec: SpecFolder, task: Task, attempt:
     results.push(gateResult(gate, run));
     if (run.output) outputs[gate] = run.output;
   }
-  const file = join(logPath(spec.dir, 'gates'), `${task.id}-${attempt}.md`);
-  writeText(file, gatesLog(task.id, attempt, results, outputs, notConfigured));
-  return { results, notConfigured, log: relative(ctx.root(), file).split('\\').join('/') };
+  const full = gatesLog(task.id, attempt, results, outputs, notConfigured);
+  const rel = (f: string) => relative(ctx.root(), f).split('\\').join('/');
+  if (!specLogInCache(spec.dir)) {
+    const file = join(logPath(spec.dir, 'gates'), `${task.id}-${attempt}.md`);
+    writeText(file, full);
+    return { results, notConfigured, log: rel(file) };
+  }
+  // Version 2: the whole output in the local cache, the table and the task's failing lines in gates.md.
+  const cached = gatesCacheFile(spec, task.id, attempt);
+  writeText(cached, full);
+  const logged = logSections(spec.dir, 'gates.md');
+  const earlier = Array.from({ length: attempt - 1 }, (_, i) => attempt - 1 - i).flatMap((k) => {
+    const section = logged.get(attemptTitle(task.id, k));
+    return section === undefined ? [] : [{ attempt: k, section }];
+  });
+  const section = gatesSection(results, outputs, notConfigured, task.files ?? [], earlier);
+  const file = writeLogSection(spec.dir, 'gates.md', attemptTitle(task.id, attempt), section);
+  return { results, notConfigured, log: rel(file), output: rel(cached) };
+}
+
+const attemptTitle = (task: string, attempt: number) => `${task} — attempt ${attempt}`;
+const gatesCacheFile = (spec: SpecFolder, task: string, attempt: number) => cachePath(spec.dir, 'gates', `${task}-${attempt}.md`);
+
+/** The gate results the Reviewer reads (verdict line and status table), and where the full output is. */
+function recordedGates(spec: SpecFolder, id: string, attempt: number): { table?: string; full: string } {
+  if (!specLogInCache(spec.dir)) {
+    const file = join(logPath(spec.dir, 'gates'), `${id}-${attempt}.md`);
+    const table = existsSync(file) ? readFileSync(file, 'utf8').split('\n## Output')[0]! : undefined;
+    return { ...(table ? { table } : {}), full: relative(spec.dir, file).split('\\').join('/') };
+  }
+  const section = logSections(spec.dir, 'gates.md').get(attemptTitle(id, attempt));
+  const full = relative(repoRoot(spec.dir), gatesCacheFile(spec, id, attempt))
+    .split('\\')
+    .join('/');
+  if (section === undefined) return { full };
+  return { table: `# Gates — ${id}, attempt ${attempt}\n\n${section.split('\n### ')[0]!.trimEnd()}\n`, full };
 }
 
 function registerGates(run: Command, ctx: CliContext) {
   run
     .command('gates <spec> <task>')
-    .description("Run the task's level 0 gates and impacted tests; pass/fail and the failure excerpt, full output in _log/gates/")
+    .description(
+      "Run the task's level 0 gates and impacted tests; pass/fail and the failure excerpt, full output in _log/gates/ (version 2: .mandao/cache/<ID>/)",
+    )
     .option('--force', 'run even when the budget defers (recorded; ADR 0024)')
     .action(async (ref: string, id: string, o: { force?: boolean }) => {
       const { spec } = loadSpec(ctx, ref);
@@ -167,17 +202,17 @@ function leaderStep(ctx: CliContext, ref: string, id: string, o: CheckpointOptio
 function registerReviewPack(run: Command, ctx: CliContext) {
   run
     .command('review-pack <spec> <task>')
-    .description('Write what the Reviewer reads (brief, gate results, diff) to one file in _log/reviews/; prints its path')
+    .description(
+      'Write what the Reviewer reads (brief, gate results, diff) to one file in _log/reviews/ (version 2: .mandao/cache/<ID>/); prints its path',
+    )
     .option('--harness <id>', 'harness running the Leader', 'claude')
     .action((ref: string, id: string, o: { harness?: string }) => {
       const { config, spec } = loadSpec(ctx, ref);
       const task = taskOf(spec, id);
       const harness = harnessOption(o.harness);
       const attempt = currentAttempt(spec, id);
-      const gatesFile = join(logPath(spec.dir, 'gates'), `${id}-${attempt}.md`);
-      const gates = existsSync(gatesFile)
-        ? readFileSync(gatesFile, 'utf8').split('\n## Output')[0]!
-        : 'No gate results recorded for this attempt: run `mandao run gates` first.';
+      const recorded = recordedGates(spec, id, attempt);
+      const gates = recorded.table ?? 'No gate results recorded for this attempt: run `mandao run gates` first.';
       const brief = composeBrief(
         ctx.root(),
         config,
@@ -192,7 +227,7 @@ function registerReviewPack(run: Command, ctx: CliContext) {
         `# Review pack — ${id}, attempt ${attempt}`,
         '',
         'Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in',
-        `\`${relative(spec.dir, gatesFile).split('\\').join('/')}\`.`,
+        `\`${recorded.full}\`.`,
         '',
         '## Brief',
         '',
@@ -209,12 +244,14 @@ function registerReviewPack(run: Command, ctx: CliContext) {
         '```',
         '',
       ].join('\n');
-      const file = join(logPath(spec.dir, 'reviews'), `${id}-${attempt}-pack.md`);
+      // Nothing reads a pack back (design P1): version 2 keeps it in the local cache, outside git.
+      const name = `${id}-${attempt}-pack.md`;
+      const file = specLogInCache(spec.dir) ? cachePath(spec.dir, 'reviews', name) : join(logPath(spec.dir, 'reviews'), name);
       writeText(file, pack);
       json({
         pack: relative(ctx.root(), file).split('\\').join('/'),
         bytes: Buffer.byteLength(pack),
-        gatesRecorded: existsSync(gatesFile),
+        gatesRecorded: recorded.table !== undefined,
       });
     });
 }
diff --git a/src/cli/run-ledger.ts b/src/cli/run-ledger.ts
index a4408e9..f38e5ce 100644
--- a/src/cli/run-ledger.ts
+++ b/src/cli/run-ledger.ts
@@ -188,7 +188,7 @@ export function withCheckpointOptions(cmd: Command): Command {
     .option('--reason <text>', 'why the Reviewer failed the task: its first blocking finding (required with FAIL)')
     .option(
       '--review <file|->',
-      "with a Reviewer's PASS or FAIL: its whole answer (a file, or - for stdin), checked and kept in _log/reviews/",
+      "with a Reviewer's PASS or FAIL: its whole answer (a file, or - for stdin), checked and kept in _log/reviews/ (version 2: a section of _log/reviews.md)",
     )
     .option('--done <id>', 'mark a task done in tasks.md')
     .option('--clear', 'no task in progress')
diff --git a/src/cli/run-mutation.ts b/src/cli/run-mutation.ts
index 0811227..6eb3286 100644
--- a/src/cli/run-mutation.ts
+++ b/src/cli/run-mutation.ts
@@ -8,7 +8,7 @@ import { identityCell } from '../scripts/identity.js';
 import { applyPatch, checkPatch, mutationIssues, patchFiles, treeState } from '../scripts/mutation.js';
 import { runTests, type TestRun } from '../scripts/run-tests.js';
 import { findSpec, readSpec } from '../scripts/spec.js';
-import { logPath } from '../scripts/spec-log.js';
+import { cachePath, logPath, specLogInCache } from '../scripts/spec-log.js';
 import { taskAttempt } from '../spec/index.js';
 import { writeText } from '../writer/files.js';
 import { budgetFor } from './budget.js';
@@ -46,10 +46,26 @@ function evidence(task: string, n: number, tests: string[], patch: string, run:
   ].join('\n');
 }
 
+/**
+ * Writes a mutation's evidence: `mutations/` in a version 1 log, the local cache in version 2 (the MUTANT
+ * row is the committed record). `where` is how the row names it.
+ */
+function keepEvidence(specDir: string, repo: string, name: string, content: string): { file: string; where: string } {
+  if (!specLogInCache(specDir)) {
+    const file = join(logPath(specDir, 'mutations'), name);
+    writeText(file, content);
+    return { file, where: relative(specDir, file) };
+  }
+  const file = cachePath(specDir, 'mutations', name);
+  writeText(file, content);
+  return { file, where: relative(repo, file).split('\\').join('/') };
+}
+
 /**
  * `mandao run mutation`: characterization evidence (ADR 0022). Applies a mutation to the code the tests
  * pin down, runs them, always reverts it and checks the tree is back as it was. Only a failing run with a
- * clean revert is recorded: a `MUTANT` row plus the diff and the failing output in `mutations/`.
+ * clean revert is recorded: a `MUTANT` row plus the diff and the failing output in `mutations/` (version 2:
+ * in the spec's local cache).
  */
 export function registerMutation(run: Command, ctx: CliContext) {
   run
@@ -100,8 +116,7 @@ export function registerMutation(run: Command, ctx: CliContext) {
         return;
       }
       const n = spec.execution.filter((r) => r.task === id && r.verdict === 'MUTANT').length + 1;
-      const file = join(logPath(spec.dir, 'mutations'), `${id}-${n}.md`);
-      writeText(file, evidence(id, n, tests, patch, result, after));
+      const { file, where } = keepEvidence(spec.dir, repo, `${id}-${n}.md`, evidence(id, n, tests, patch, result, after));
       const writer = routedWriter(root, config, spec, task, o.harness, o.self);
       appendExecutionRow(spec.dir, spec.name, {
         date: new Date().toISOString().slice(0, 10),
@@ -112,7 +127,7 @@ export function registerMutation(run: Command, ctx: CliContext) {
         implementer: identityCell(writer),
         reviewer: '—',
         verdict: 'MUTANT',
-        notes: `mutation ${n} on ${files.join(', ')}: \`${result.command}\` failed (exit ${result.exitCode}); reverted clean; evidence ${relative(spec.dir, file)}`,
+        notes: `mutation ${n} on ${files.join(', ')}: \`${result.command}\` failed (exit ${result.exitCode}); reverted clean; evidence ${where}`,
       });
       json({ recorded: true, task: id, mutation: n, files, evidence: relative(root, file), run: { ...result, outputTail: undefined } });
     });
diff --git a/src/cli/run-premise.ts b/src/cli/run-premise.ts
index 63bff3a..07498ef 100644
--- a/src/cli/run-premise.ts
+++ b/src/cli/run-premise.ts
@@ -6,7 +6,7 @@ import type { Command } from 'commander';
 import { repoRoot } from '../scripts/commits.js';
 import { excerpt } from '../scripts/gates.js';
 import { runTests } from '../scripts/run-tests.js';
-import { docPath, logPath } from '../scripts/spec-log.js';
+import { cachePath, docPath, logPath, logSections, specLogInCache, writeLogSection } from '../scripts/spec-log.js';
 import { parsePremises, premiseFindings } from '../spec/index.js';
 import { ensureDir, removeScratchDir, writeText } from '../writer/files.js';
 import { budgetFor } from './budget.js';
@@ -14,20 +14,39 @@ import type { CliContext } from './context.js';
 import { json } from './json.js';
 import { loadSpec } from './spec-context.js';
 
-/** Premises with a run recorded by `mandao run premise` (`_log/premises/<Pn>.md`). */
+/** Premises with a run recorded by `mandao run premise`: `_log/premises/<Pn>.md`, or (version 2) a `## Pn — …` section of `_log/premises.md`. */
 export function recordedPremises(specDir: string): Set<string> {
+  if (specLogInCache(specDir)) return new Set([...logSections(specDir, 'premises.md').keys()].flatMap((t) => /^P\d+/.exec(t)?.[0] ?? []));
   const dir = logPath(specDir, 'premises');
   return new Set(existsSync(dir) ? readdirSync(dir).flatMap((f) => (/^(P\d+)\.md$/.exec(f)?.[1] ? [f.slice(0, -3)] : [])) : []);
 }
 
+/** Lines of a premise run's output kept in a version 2 `premises.md` (version 1 kept 40 in its own file). */
+const PREMISE_LINES = 20;
+
+/** Records a premise run where the spec keeps them; returns the file written. */
+function recordRun(specDir: string, id: string, claim: string | undefined, command: string, at: string, exit: unknown, output?: string) {
+  const facts = [`- Command: \`${command}\` (from the worktree root)`, `- Ran at: ${new Date().toISOString()} on ${at}`, `- Exit: ${exit}`];
+  if (specLogInCache(specDir)) {
+    const body = [...(claim ? [`- Claim: ${claim}`] : []), ...facts, '', '```', excerpt(output, PREMISE_LINES), '```'].join('\n');
+    return writeLogSection(specDir, 'premises.md', `${id} — run`, body);
+  }
+  const file = join(logPath(specDir, 'premises'), `${id}.md`);
+  writeText(file, [`# ${id} — run`, '', ...facts, '', '```', excerpt(output, 40), '```', ''].join('\n'));
+  return file;
+}
+
+/** Where a premise's probes and scratch folders live: the spec's log (version 1) or its local cache (version 2). */
+const premiseWorkDir = (specDir: string) => (specLogInCache(specDir) ? cachePath(specDir, 'premises') : logPath(specDir, 'premises'));
+
 /** PREMISE_UNPROVEN findings for a spec: its design (or lite spec.md) against the recorded runs. */
 export function specPremiseFindings(specDir: string) {
   const design = docPath(specDir, 'design');
   return premiseFindings(existsSync(design) ? readFileSync(design, 'utf8') : undefined, recordedPremises(specDir));
 }
 
-/** Where a spec's probe scripts live: inside its log, committed with the premise records. */
-export const probesDir = (specDir: string) => join(logPath(specDir, 'premises'), 'probes');
+/** Where a spec's probe scripts live: inside its log, committed with the premise records (version 2: the local cache). */
+export const probesDir = (specDir: string) => join(premiseWorkDir(specDir), 'probes');
 
 /**
  * The paths a command names that leave the worktree: absolute or `~` paths outside it, and relative
@@ -82,9 +101,10 @@ export function registerPremise(run: Command, ctx: CliContext) {
         );
       const project = config.projects[0]!;
       const budget = budgetFor(ctx.root(), config, project, 'unit', `${id} premise`, o.force, spec.dir);
-      // Temporary files the probe makes go inside the spec's log, and are removed after the run.
-      const scratch = join(logPath(spec.dir, 'premises'), 'tmp', id);
-      const home = join(logPath(spec.dir, 'premises'), 'tmp', `${id}-home`);
+      // Temporary files the probe makes go inside the spec's log (version 2: its local cache), removed after the run.
+      const work = premiseWorkDir(spec.dir);
+      const scratch = join(work, 'tmp', id);
+      const home = join(work, 'tmp', `${id}-home`);
       ensureDir(scratch);
       ensureDir(home);
       let result: Awaited<ReturnType<typeof runTests>>;
@@ -95,30 +115,15 @@ export function registerPremise(run: Command, ctx: CliContext) {
           env: { TMPDIR: scratch, TMP: scratch, TEMP: scratch, HOME: home, USERPROFILE: home },
         });
       } finally {
-        removeScratchDir(join(logPath(spec.dir, 'premises'), 'tmp'), spec.dir);
+        removeScratchDir(join(work, 'tmp'), work);
       }
       if (result.status !== 'PASS' && result.status !== 'FAIL') {
         json({ premise: id, recorded: false, status: result.status, reason: result.reason });
         process.exitCode = 1;
         return;
       }
-      const file = join(logPath(spec.dir, 'premises'), `${id}.md`);
-      const cut = excerpt(result.output, 40);
-      writeText(
-        file,
-        [
-          `# ${id} — run`,
-          '',
-          `- Command: \`${command}\` (from the worktree root)`,
-          `- Ran at: ${new Date().toISOString()} on ${sha(cwd)}`,
-          `- Exit: ${result.exitCode}`,
-          '',
-          '```',
-          cut,
-          '```',
-          '',
-        ].join('\n'),
-      );
+      const claim = parsePremises(readFileSync(design, 'utf8')).find((p) => p.id === id)?.claim;
+      const file = recordRun(spec.dir, id, claim, command, sha(cwd), result.exitCode, result.output);
       json({
         premise: id,
         recorded: true,
diff --git a/src/cli/run-review.ts b/src/cli/run-review.ts
index 5cdd4a0..cc567af 100644
--- a/src/cli/run-review.ts
+++ b/src/cli/run-review.ts
@@ -8,7 +8,7 @@ import { repoRoot } from '../scripts/commits.js';
 import { type Identity, identityCell } from '../scripts/identity.js';
 import { isReviewProcess, REVIEW_PROCESSES, reviewerInstructions, reviewPrompt, runReview, taskDiff } from '../scripts/review.js';
 import type { SpecFolder } from '../scripts/spec.js';
-import { logPath } from '../scripts/spec-log.js';
+import { logPath, specLogInCache, writeLogSection } from '../scripts/spec-log.js';
 import { type ExecutionRow, NOTE_FLAGS, securityBlockers, taskAttempt } from '../spec/index.js';
 import { writeText } from '../writer/files.js';
 import type { CliContext } from './context.js';
@@ -46,6 +46,15 @@ function reviewRow(
   };
 }
 
+/** The review's whole answer: `_log/reviews/Tn-k-<via>.md`, or (version 2) its section of `_log/reviews.md`. */
+function keepReview(spec: SpecFolder, task: string, via: string, output: string): string {
+  const attempt = taskAttempt(spec.execution, task);
+  if (specLogInCache(spec.dir)) return writeLogSection(spec.dir, 'reviews.md', `${task} — attempt ${attempt} (via ${via})`, output);
+  const file = join(logPath(spec.dir, 'reviews'), `${task}-${attempt}-${via}.md`);
+  writeText(file, output);
+  return file;
+}
+
 interface ReviewOptions {
   via: string;
   gates: string;
@@ -65,8 +74,7 @@ function processReview(ctx: CliContext, loadSpec: SpecLoader, ref: string, task:
     readFileSync(opts.gates, 'utf8'),
   );
   const r = runReview(opts.via, ctx.root(), reviewer, prompt);
-  const file = join(logPath(spec.dir, 'reviews'), `${task}-${taskAttempt(spec.execution, task)}-${opts.via}.md`);
-  writeText(file, r.output);
+  const file = keepReview(spec, task, opts.via, r.output);
   const rel = relative(ctx.root(), file);
   // A PASS with an open high-severity security finding is recorded as a FAIL (MDO-0008).
   const blockers = r.verdict === 'PASS' ? securityBlockers(r.output) : [];
diff --git a/src/engine/graph.ts b/src/engine/graph.ts
index b1420de..b1449b6 100644
--- a/src/engine/graph.ts
+++ b/src/engine/graph.ts
@@ -49,6 +49,8 @@ export function gitIgnoreBlock(childRepos: string[], version: string): Generated
       '.mandao/run.lock',
       // The CLI's own log (forced runs, ADR 0024) belongs to this machine.
       '.mandao/cli.log',
+      // Each spec's local bulk: Reviewer packs, full gate output, probes, mutations, integrity (MDO-0011 D3).
+      '.mandao/cache/',
       // Machine-specific agent settings (ADR 0015).
       '.claude/settings.local.json',
       ...childRepos.map((p) => `/${p}/`),
diff --git a/src/schemas/config.ts b/src/schemas/config.ts
index 31d1feb..a1e416d 100644
--- a/src/schemas/config.ts
+++ b/src/schemas/config.ts
@@ -169,6 +169,11 @@ export const configSchema = z
     budget: z.object({ per_spec: z.number().positive().optional() }).prefault({}),
     /** Session cuts (ADR 0038): inside implement the Leader stops to suggest one only above this saving (USD). */
     session: z.object({ cut_min_savings: z.number().nonnegative().optional() }).prefault({}),
+    /**
+     * A version 2 spec's local cache, `.mandao/cache/<ID>/` (MDO-0011 D3): `summary` deletes it at close, `full`
+     * keeps it on this machine. Neither commits it.
+     */
+    logs: z.object({ level: z.enum(['summary', 'full']).default('summary') }).prefault({}),
     /** The team's branching model (ADR 0023): preset plus overrides. */
     branching: branchingInput.default({ model: 'feature-branch' }),
     harnesses: z.array(harnessId).min(1),
diff --git a/src/schemas/index.ts b/src/schemas/index.ts
index dcaf712..42af2f0 100644
--- a/src/schemas/index.ts
+++ b/src/schemas/index.ts
@@ -7,3 +7,4 @@ export * from './format.js';
 export * from './lock.js';
 export * from './models.js';
 export * from './sources.js';
+export * from './spec.js';
diff --git a/src/scripts/forced.ts b/src/scripts/forced.ts
index df762d1..bb16c4f 100644
--- a/src/scripts/forced.ts
+++ b/src/scripts/forced.ts
@@ -3,7 +3,7 @@ import { join } from 'node:path';
 import type { Config } from '../schemas/index.js';
 import { writeText } from '../writer/files.js';
 import type { Budget, BudgetKind } from './resources.js';
-import { logPath, readProgress } from './spec-log.js';
+import { logPath, readProgress, specLogInCache } from './spec-log.js';
 
 /** The CLI's own log: one JSON line per event worth keeping. Machine-specific, git-ignored. */
 export const CLI_LOG = '.mandao/cli.log';
@@ -61,26 +61,41 @@ export function recordForced(root: string, run: ForcedRun, specDir?: string): vo
   writeText(file, appendToSection(text, line));
 }
 
-/** Adds a line at the end of the `## Forced runs` section, creating it at the end of the file. */
-function appendToSection(text: string, line: string): string {
-  const start = text.indexOf(SECTION);
-  if (start < 0)
-    return `${text.trimEnd()}\n\n${SECTION}\n<!-- Runs a resource budget deferred and someone forced (ADR 0024). -->\n\n${line}\n`;
-  const next = text.indexOf('\n## ', start + SECTION.length);
+/** A section of `execution.md` outside the verdict table: its heading and the comment under it. */
+interface Section {
+  heading: string;
+  intro: string;
+}
+
+const FORCED: Section = { heading: SECTION, intro: '<!-- Runs a resource budget deferred and someone forced (ADR 0024). -->' };
+const FULL_RUNS: Section = { heading: '## Full runs', intro: '<!-- Full-suite runs outside CI, with their reason (MDO-0007). -->' };
+
+/** Adds a line at the end of a section of `execution.md` (`## Forced runs` by default), creating it at the end of the file. */
+function appendToSection(text: string, line: string, section: Section = FORCED): string {
+  const start = text.indexOf(section.heading);
+  if (start < 0) return `${text.trimEnd()}\n\n${section.heading}\n${section.intro}\n\n${line}\n`;
+  const next = text.indexOf('\n## ', start + section.heading.length);
   const end = next < 0 ? text.length : next;
   return `${text.slice(0, end).trimEnd()}\n${line}\n${next < 0 ? '' : `\n${text.slice(next + 1)}`}`;
 }
 
 /**
  * A full-suite run outside CI (`mandao run tests --full --reason …`): always in the CLI log, and in the
- * active spec's `_log/full-runs.md` with its reason, so Kaizen and the Reviewer see it (MDO-0007).
+ * active spec's `_log/full-runs.md` with its reason, so Kaizen and the Reviewer see it (MDO-0007). A
+ * version 2 spec keeps them in the `## Full runs` section of `execution.md`, beside the forced runs.
  */
 export function recordFullRun(root: string, run: { at: string; project: string; reason: string; status: string }, specDir?: string): void {
   const log = join(root, CLI_LOG);
   const before = existsSync(log) ? readFileSync(log, 'utf8') : '';
   writeText(log, `${before}${JSON.stringify({ event: 'full-run', ...run })}\n`);
   if (!specDir) return;
+  const line = `- ${run.at} · ${run.project} · ${run.status} · ${run.reason}`;
+  if (specLogInCache(specDir)) {
+    const execution = logPath(specDir, 'execution.md');
+    writeText(execution, appendToSection(existsSync(execution) ? readFileSync(execution, 'utf8') : '', line, FULL_RUNS));
+    return;
+  }
   const file = logPath(specDir, 'full-runs.md');
   const text = existsSync(file) ? readFileSync(file, 'utf8') : '# Full-suite runs outside CI\n\n';
-  writeText(file, `${text}- ${run.at} · ${run.project} · ${run.status} · ${run.reason}\n`);
+  writeText(file, `${text}${line}\n`);
 }
diff --git a/src/scripts/gates.ts b/src/scripts/gates.ts
index 4b4dba8..021e081 100644
--- a/src/scripts/gates.ts
+++ b/src/scripts/gates.ts
@@ -10,7 +10,7 @@ export interface GateResult {
   gate: string;
   status: GateStatus;
   exitCode?: number;
-  /** Only on a failure: the last lines that say why. The whole output stays in `_log/`. */
+  /** Only on a failure: the last lines that say why. The whole output stays in `_log/` (version 2: the local cache). */
   excerpt?: string;
   reason?: string;
 }
@@ -40,29 +40,91 @@ export function gateResult(gate: string, run: TestRun): GateResult {
 /** A failed gate blocks the review; a tool that is not installed or a deferred run is reported, not failed. */
 export const gatesPassed = (results: GateResult[]) => results.every((r) => r.status !== 'FAIL' && r.status !== 'TIMEOUT');
 
-/** The `_log/gates/<Tn>-<attempt>.md` file: what the Reviewer and verify read instead of re-running. */
-export function gatesLog(
-  task: string,
-  attempt: number,
+/** Lines of a failing gate's output kept in a version 2 `gates.md`; the whole output stays in the local cache. */
+export const GATE_LOG_LINES = 40;
+
+/**
+ * The lines of a failing gate's output that name one of the task's files, at most `GATE_LOG_LINES`. When
+ * no line names them, the last lines instead, so a failure is never recorded without its reason.
+ */
+export function taskLines(output: string, files: string[]): { lines: string[]; total: number; named: boolean } {
+  const all = output
+    .split('\n')
+    .map((l) => l.trimEnd())
+    .filter(Boolean);
+  const wanted = files.map((f) => f.split('\\').join('/')).filter(Boolean);
+  const named = all.filter((l) => wanted.some((f) => l.split('\\').join('/').includes(f)));
+  if (named.length) return { lines: named.slice(0, GATE_LOG_LINES), total: named.length, named: true };
+  return { lines: all.slice(-GATE_LOG_LINES), total: all.length, named: false };
+}
+
+/** An earlier attempt's section of `gates.md`, to point at instead of repeating the same lines. */
+export interface EarlierGates {
+  attempt: number;
+  section: string;
+}
+
+/** The lines an earlier section kept for a gate, when it kept them itself (not as a pointer). */
+function keptLines(section: string, gate: string): string | undefined {
+  const head = section.split('\n').findIndex((l) => l.startsWith(`### ${gate} — `));
+  if (head < 0 || section.split('\n')[head + 2] !== '```') return undefined;
+  const rest = section.split('\n').slice(head + 3);
+  return rest.slice(0, rest.indexOf('```')).join('\n');
+}
+
+function failureBlock(r: GateResult, output: string, files: string[], earlier: EarlierGates[]): string {
+  const cut = taskLines(output, files);
+  const same = earlier.find((e) => keptLines(e.section, r.gate) === cut.lines.join('\n'));
+  // The log must not grow with attempts: the same failing lines again point at the attempt that kept them.
+  if (same) return [`### ${r.gate} — ${r.status}: the same ${cut.lines.length} lines as attempt ${same.attempt}`, ''].join('\n');
+  const what = cut.named
+    ? `${cut.lines.length} of ${cut.total} lines naming the task's files`
+    : `no line names the task's files: the last ${cut.lines.length} of ${cut.total} lines`;
+  return [`### ${r.gate} — ${r.status} (${what})`, '', '```', ...cut.lines, '```', ''].join('\n');
+}
+
+/**
+ * One attempt's section of a version 2 `_log/gates.md`: the status table and, for failing gates only, the
+ * lines of their output about the task's files (or a pointer to the earlier attempt that kept the same
+ * lines). A gate that is not installed is named once, in the table.
+ */
+export function gatesSection(
   results: GateResult[],
   outputs: Record<string, string>,
   notConfigured: string[],
+  files: string[],
+  earlier: EarlierGates[] = [],
 ): string {
-  const rows = results.map((r) => `| ${r.gate} | ${r.status} | ${r.exitCode ?? '—'} |`);
-  const blocks = results
-    .filter((r) => outputs[r.gate])
-    .map((r) => [`### ${r.gate} — ${r.status}`, '', '```', outputs[r.gate]!.trimEnd(), '```', ''].join('\n'));
+  const failed = results.filter((r) => r.status === 'FAIL' || r.status === 'TIMEOUT');
+  const blocks = failed.map((r) => failureBlock(r, outputs[r.gate] ?? r.excerpt ?? '', files, earlier));
+  return [...statusTable(results, notConfigured), ...blocks].join('\n');
+}
+
+/** The verdict line and the status table, the same in both layouts: what the review pack reads. */
+function statusTable(results: GateResult[], notConfigured: string[]): string[] {
   return [
-    `# Gates — ${task}, attempt ${attempt}`,
-    '',
     `${gatesPassed(results) ? 'Every configured gate passed' : 'A gate failed'}${notConfigured.length ? `; not configured: ${notConfigured.join(', ')}` : ''}.`,
     '',
     '| Gate | Status | Exit |',
     '|---|---|---|',
-    ...rows,
-    '',
-    '## Output',
+    ...results.map((r) => `| ${r.gate} | ${r.status} | ${r.exitCode ?? '—'} |`),
     '',
-    ...blocks,
-  ].join('\n');
+  ];
+}
+
+/**
+ * `_log/gates/<Tn>-<attempt>.md` in a version 1 spec, the full output in the local cache of a version 2
+ * spec: what the Reviewer and verify read instead of re-running.
+ */
+export function gatesLog(
+  task: string,
+  attempt: number,
+  results: GateResult[],
+  outputs: Record<string, string>,
+  notConfigured: string[],
+): string {
+  const blocks = results
+    .filter((r) => outputs[r.gate])
+    .map((r) => [`### ${r.gate} — ${r.status}`, '', '```', outputs[r.gate]!.trimEnd(), '```', ''].join('\n'));
+  return [`# Gates — ${task}, attempt ${attempt}`, '', ...statusTable(results, notConfigured), '## Output', '', ...blocks].join('\n');
 }
diff --git a/src/scripts/spec-log.ts b/src/scripts/spec-log.ts
index 85e1a2d..d456f9e 100644
--- a/src/scripts/spec-log.ts
+++ b/src/scripts/spec-log.ts
@@ -1,12 +1,15 @@
 import { existsSync, readFileSync } from 'node:fs';
 import { join } from 'node:path';
 import { parse as parseYaml } from 'yaml';
+import { keepsLogCache } from '../schemas/index.js';
 import { type Approval, parseApprovals, renderApprovals } from '../spec/approvals.js';
+import { renderCosts } from '../spec/costs.js';
 import { LAYOUT_VERSIONS, layoutManifest, tasksHaveOwnFile } from '../spec/layout.js';
 import { frontmatterOf } from '../spec/markdown.js';
 import { type Progress, progressSchema } from '../spec/progress.js';
 import { parseState, renderState, type State } from '../spec/state.js';
-import { writeText } from '../writer/files.js';
+import { createIfMissing, removeScratchDir, writeText } from '../writer/files.js';
+import { cacheRoot, specCacheDir } from '../writer/log-integrity.js';
 
 /**
  * Machine files of a spec live in `_log/` (the readability pass): people read the documents in the spec
@@ -96,6 +99,7 @@ export const readState = (specDir: string): State => parseState(readIf(join(spec
 
 /** Rewrites `_log/state.yml` with one change applied, keeping every other section as it was. */
 export function updateState(specDir: string, change: (state: State) => State): void {
+  ensureLogFiles(specDir);
   writeText(join(specDir, LOG_DIR, STATE_FILE), renderState(change(readState(specDir))));
 }
 
@@ -125,3 +129,73 @@ export function readProgress(specDir: string): { progress?: Progress; invalid?:
   const r = progressSchema.safeParse(data);
   return r.success ? { progress: r.data } : { invalid: true };
 }
+
+/** True when the spec keeps a six-file `_log/` (layout version 2): reviews, gates and premises are one file each. */
+export const specLogInCache = (specDir: string) => keepsLogCache(storyVersion(specDir));
+
+/** A path in the spec's local cache, `.mandao/cache/<ID>/…`: never committed, deleted at close unless `logs.level: full`. */
+export const cachePath = (specDir: string, ...parts: string[]) => join(specCacheDir(specDir), ...parts);
+
+/**
+ * At close: deletes the spec's local cache, unless `logs.level: full` keeps it. A version 1 spec has none.
+ * Throws when the story id is not a story id; the removal never reaches outside `.mandao/cache/`.
+ */
+export function dropLogCache(specDir: string, level: 'summary' | 'full'): boolean {
+  if (level === 'full' || !specLogInCache(specDir)) return false;
+  const dir = specCacheDir(specDir);
+  if (!existsSync(dir)) return false;
+  removeScratchDir(dir, cacheRoot(specDir));
+  return true;
+}
+
+/** The version 2 log files made of one section per task attempt or per premise. */
+export type SectionLog = 'reviews.md' | 'gates.md' | 'premises.md';
+
+/** A section heading of a merged log: `## Tn — attempt k…` or `## Pn — …`. Other headings inside a section's body do not end it. */
+const SECTION_HEAD = /^## (?:T\d+ — attempt \d+|P\d+ — )/;
+
+const FILE_TITLE: Record<SectionLog, string> = {
+  'reviews.md': '# Reviews',
+  'gates.md': '# Gates',
+  'premises.md': '# Premises',
+};
+
+/** The sections of a merged log by title (the heading without `## `), in file order. */
+export function logSections(specDir: string, file: SectionLog): Map<string, string> {
+  const sections = new Map<string, string>();
+  let title: string | undefined;
+  let body: string[] = [];
+  const flush = () => {
+    if (title !== undefined) sections.set(title, body.join('\n').trim());
+  };
+  for (const line of (readIf(join(specDir, LOG_DIR, file)) ?? '').split('\n')) {
+    if (SECTION_HEAD.test(line)) {
+      flush();
+      title = line.slice(3).trim();
+      body = [];
+    } else if (title !== undefined) body.push(line);
+  }
+  flush();
+  return sections;
+}
+
+/**
+ * The six files of a version 2 log are always there (FR-3): the first write to the log creates the ones
+ * whose events may never happen (no review, no gate, no premise, no cost recorded) with their empty form.
+ * `state.yml` and `execution.md` keep being created by their own writers.
+ */
+function ensureLogFiles(specDir: string): void {
+  if (!specLogInCache(specDir)) return;
+  for (const [file, title] of Object.entries(FILE_TITLE)) createIfMissing(join(specDir, LOG_DIR, file), `${title}\n`);
+  createIfMissing(join(specDir, LOG_DIR, 'costs.yml'), renderCosts([]));
+}
+
+/** Writes one section of a merged log, replacing the section with the same title and keeping every other one. */
+export function writeLogSection(specDir: string, file: SectionLog, title: string, body: string): string {
+  ensureLogFiles(specDir);
+  const sections = logSections(specDir, file);
+  sections.set(title, body.trim());
+  const path = join(specDir, LOG_DIR, file);
+  writeText(path, `${FILE_TITLE[file]}\n\n${[...sections].map(([t, b]) => `## ${t}\n\n${b}\n`).join('\n')}`);
+  return path;
+}
diff --git a/src/spec/AGENTS.md b/src/spec/AGENTS.md
index e043159..fbe0d7e 100644
--- a/src/spec/AGENTS.md
+++ b/src/spec/AGENTS.md
@@ -17,3 +17,4 @@ The CLI and scripts gather inputs; writer helpers own persistence.
 - `state.ts`: `_log/state.yml` of a version 2 spec, one zod schema (`stateSchema`) with the sections `start`, `baseline`, `progress`, `approvals` and `cut_estimates` (D3, C-1, C-3). `parseState` reads an absent or empty file as empty and throws on a row that breaks its schema (never drops it; readers such as Kaizen's cut estimates and `specSpend` let that error through); `renderState` writes the sections in that order and leaves out absent ones. The IO is in `src/scripts/spec-log.ts`: `specKeepsState(dir)` (from the story's `schema_version` through the layout manifest), `logPath` mapping `progress.yml`, `approvals.yml` and `session-cuts.md` to `state.yml` for version 2, and the section helpers `readState`, `updateState`, `readApprovalLog`, `appendApprovalLog`, `readProgress`. Every writer (start, baseline, checkpoint, red, commit queue, approve, `run next --shown`, cut estimates) goes through them; a version 1 spec, or a folder without a story (quick), keeps writing its own files exactly as before. `mandao start` writes `start` and `baseline` to `state.yml` for a new spec (`CURRENT_LAYOUT_VERSION`); a quick change keeps `start-<slug>.yml` and `baseline-<slug>.md`. `progressSchema.schema_version` is the progress record's own format version, always 1, separate from the spec layout version.
 - `timeline.ts`: `timeline(execution, approvals)` merges the approvals into the execution rows by date (stable: execution rows first on the same instant; `shown` rows are left out). `run status <ID>` without a target and `run implement-summary` print it as `timeline`; nothing is written, and an approval never becomes an `execution.md` row (C-1).
 - `costs.ts`: in a version 2 spec a new `costs.yml` entry keeps `cumulative` per role only (C-2); the per-model baseline is derived from the session's earlier `models` (`sessionModelTotals`). A version 1 spec, and the quick folder, keep the `model:` lines in `cumulative`. On both versions the per-model part of a new entry is measured against the `model:` lines of the session's last `cumulative` when it has them (version 1: the same numbers as before), else against `sessionModelTotals`, so a version 2 record followed by a version 1 or quick record in the same session is not counted twice.
+- Six-file log (version 2, D3): `_log/` holds only `state.yml`, `execution.md`, `reviews.md`, `gates.md`, `premises.md` and `costs.yml`. `specLogInCache(dir)` (in `src/scripts/spec-log.ts`) picks the layout with `keepsLogCache` from `src/schemas/spec.ts`, the predicate the writer's integrity routing uses too (a quoted or unknown `schema_version` is version 1 for both); `LAYOUT_VERSIONS` and `STORY_ID` are written once there; `writeLogSection`/`logSections` read and write the merged files as `## Tn — attempt k` (reviews, `(via <harness>)` for a process review; gates) and `## Pn — run` (premises) sections, and the first state or section write creates the empty `reviews.md`, `gates.md`, `premises.md` and `costs.yml` so the six are always there. `gates.md` keeps the status table and, for FAIL/TIMEOUT gates only, at most 40 lines naming the task's files (the tail when none does; a repeat of an earlier attempt's same lines is a pointer to it); `premises.md` keeps claim, command, sha, exit and 20 lines. Everything else goes to `.mandao/cache/<ID>/` (`cachePath`, git-ignored by the managed `.gitignore` block): packs, full gate output, probes and their scratch, mutations, discrepancies and `integrity.json`. Full runs are a `## Full runs` section of `execution.md`. `run close-summary --closed` deletes the cache (`dropLogCache`) unless `logs.level: full`; a story id that is not a story id (`..`, a path) makes it throw rather than delete anything. A version 1 spec keeps every per-attempt file exactly as before; `test/integration/log-v2.test.ts` runs one history on both versions and compares every reader.
diff --git a/src/spec/layout.ts b/src/spec/layout.ts
index 6c49d0b..4b5f314 100644
--- a/src/spec/layout.ts
+++ b/src/spec/layout.ts
@@ -1,11 +1,12 @@
+import { LAYOUT_VERSIONS, type LayoutVersion } from '../schemas/spec.js';
+
 /** The depths a spec can have, and the stages its story status moves it through (design D1). */
 export const DEPTHS = ['lite', 'standard', 'full'] as const;
 export type Depth = (typeof DEPTHS)[number];
 export const STAGES = ['draft', 'specified', 'planned', 'verified', 'closed'] as const;
 export type Stage = (typeof STAGES)[number];
-/** The layout versions a story's `schema_version` may name: the one place the set is written. */
-export const LAYOUT_VERSIONS = [1, 2] as const;
-export type LayoutVersion = (typeof LAYOUT_VERSIONS)[number];
+/** The layout versions are written once, in `src/schemas/spec.ts`, where the writer can read them too. */
+export { LAYOUT_VERSIONS, type LayoutVersion };
 /** The version a new spec starts at: the last one, and the `schema_version` of the story template (pinned by a test). */
 export const CURRENT_LAYOUT_VERSION: LayoutVersion = LAYOUT_VERSIONS[LAYOUT_VERSIONS.length - 1]!;
 
diff --git a/src/spec/story.ts b/src/spec/story.ts
index a1c8813..d2c0c4b 100644
--- a/src/spec/story.ts
+++ b/src/spec/story.ts
@@ -1,5 +1,5 @@
 import { z } from 'zod';
-import { formatIssues, specStatus } from '../schemas/index.js';
+import { formatIssues, STORY_ID, specStatus } from '../schemas/index.js';
 import { LAYOUT_VERSIONS } from './layout.js';
 import { type Clause, frontmatterOf, readClauses, sections, splitHeading } from './markdown.js';
 
@@ -10,7 +10,7 @@ export const storyFrontmatterSchema = z.object({
   schema_version: z.literal(LAYOUT_VERSIONS),
   tracker: z.enum(['jira', 'linear', 'clickup', 'monday', 'none']).default('none'),
   type: z.enum(SPEC_TYPES).default('story'),
-  id: z.string().regex(/^[A-Z][A-Z0-9_]*-\d+$/, 'must look like PROJ-123 or MDO-0001'),
+  id: z.string().regex(STORY_ID, 'must look like PROJ-123 or MDO-0001'),
   url: z.string().nullish(),
   parent: z.string().nullish(),
   projects: z.array(z.string()).default([]),
diff --git a/src/writer/AGENTS.md b/src/writer/AGENTS.md
index 0f5367b..21cb729 100644
--- a/src/writer/AGENTS.md
+++ b/src/writer/AGENTS.md
@@ -11,3 +11,11 @@ Gotcha: engine and CLI orchestration writes user-intent files through this modul
 Skill copies (`src/skills/git-copy.ts`) use `makeScratchDir` + `removeScratchDir(dir, tmpdir())` for the
 temporary clone and `copyNewFile`, which never overwrites and refuses symlinks.
 `log-integrity.ts` tracks script-owned spec evidence; preserve discrepancy detection when changing it.
+For a version 2 spec the hashes live in `.mandao/cache/<ID>/integrity.json` (`specCacheDir`: the nearest
+folder with `.mandao/config.yml`, then the story's `id`), so `_log/` keeps its six files; version 1 keeps
+`_log/.integrity.json`. Writes into the cache are not logs and are not hashed. The version is read from
+the front matter here (the writer depends on schemas only) and judged by `keepsLogCache` in
+`src/schemas/spec.ts`, the same predicate as the spec domain's `specLogInCache`: a quoted or unknown
+version is version 1 for both. Security: `specCacheDir` throws unless the ID (story `id`, else the story
+id the folder name starts with) matches `STORY_ID`, so no cache write lands outside `.mandao/cache/`, and
+a cache removal passes `cacheRoot(specDir)` as `within` to `removeScratchDir`.
diff --git a/src/writer/log-integrity.ts b/src/writer/log-integrity.ts
index 0e2df3a..672d80d 100644
--- a/src/writer/log-integrity.ts
+++ b/src/writer/log-integrity.ts
@@ -1,5 +1,6 @@
-import { existsSync, readFileSync, writeFileSync } from 'node:fs';
+import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
 import { basename, dirname, join, relative } from 'node:path';
+import { keepsLogCache, STORY_ID } from '../schemas/index.js';
 import { sha256 } from '../util/hash.js';
 
 /**
@@ -21,8 +22,56 @@ function specDirOf(abs: string): string | undefined {
   return ROOT_LOGS.has(basename(abs)) && existsSync(join(dir, 'story.md')) ? dir : undefined;
 }
 
-const integrityFile = (specDir: string) =>
-  existsSync(join(specDir, '_log')) ? join(specDir, '_log', INTEGRITY) : join(specDir, INTEGRITY);
+/**
+ * A scalar of the story's front matter, read without the spec domain (the writer depends on schemas only):
+ * a quoted value is a string and an unquoted integer a number, as YAML reads them. Any other value is
+ * returned as written, and the caller's check (a layout version, a story id) refuses it.
+ */
+function storyField(specDir: string, field: string): string | number | undefined {
+  const story = join(specDir, 'story.md');
+  if (!existsSync(story)) return undefined;
+  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(story, 'utf8'))?.[1] ?? '';
+  const m = new RegExp(`^${field}:[ \\t]*(?:'([^']*)'|"([^"]*)"|([^\\s#]\\S*))`, 'm').exec(front);
+  if (!m) return undefined;
+  if (m[3] === undefined) return m[1] ?? m[2];
+  return /^\d+$/.test(m[3]) ? Number(m[3]) : m[3];
+}
+
+/**
+ * True when the spec's layout (its story's `schema_version`) keeps only six files in `_log/` and the rest,
+ * integrity hashes included, in the spec's local cache (MDO-0011 design D3). It is the predicate the spec
+ * domain's `specLogInCache` uses, so a quoted or unknown version never splits one spec between two layouts.
+ */
+export const usesLogCache = (specDir: string) => keepsLogCache(storyField(specDir, 'schema_version'));
+
+/** The workspace root of a spec: the nearest folder above it with `.mandao/config.yml`, else the folder above `specs/`. */
+function workspaceOf(specDir: string): string {
+  for (let dir = dirname(specDir); dir !== dirname(dir); dir = dirname(dir)) if (existsSync(join(dir, '.mandao', 'config.yml'))) return dir;
+  return dirname(dirname(specDir));
+}
+
+/** `.mandao/cache/`: where every spec's local cache lives, and the only folder a cache removal may reach into. */
+export const cacheRoot = (specDir: string) => join(workspaceOf(specDir), '.mandao', 'cache');
+
+/**
+ * `.mandao/cache/<ID>/`: the spec's local bulk, ignored by git (packs, full gate output, probes, mutations,
+ * hashes). The ID is the story's `id`, else the story id the folder name starts with. Anything that is not a
+ * story id (`..`, a path, lower case) throws, so no cache write or removal can land outside `.mandao/cache/`.
+ */
+export function specCacheDir(specDir: string): string {
+  const fromStory = storyField(specDir, 'id');
+  const id = fromStory === undefined ? /^[A-Z][A-Z0-9_]*-\d+(?=-|$)/.exec(basename(specDir))?.[0] : String(fromStory);
+  if (id === undefined || !STORY_ID.test(id)) {
+    const shown = JSON.stringify(id ?? basename(specDir));
+    throw new Error(`${specDir}: ${shown} is not a story id like PROJ-123, so it cannot name the spec's cache folder`);
+  }
+  return join(cacheRoot(specDir), id);
+}
+
+const integrityFile = (specDir: string) => {
+  if (usesLogCache(specDir)) return join(specCacheDir(specDir), 'integrity.json');
+  return existsSync(join(specDir, '_log')) ? join(specDir, '_log', INTEGRITY) : join(specDir, INTEGRITY);
+};
 
 const readHashes = (file: string): Record<string, string> => {
   try {
@@ -37,6 +86,7 @@ function saveHashes(specDir: string, update: (h: Record<string, string>) => void
   const hashes = readHashes(file);
   update(hashes);
   const sorted = Object.fromEntries(Object.entries(hashes).sort(([a], [b]) => a.localeCompare(b)));
+  mkdirSync(dirname(file), { recursive: true });
   writeFileSync(file, `${JSON.stringify(sorted, null, 2)}\n`);
 }
 
diff --git a/test/integration/engine.test.ts b/test/integration/engine.test.ts
index d07aca9..55afd08 100644
--- a/test/integration/engine.test.ts
+++ b/test/integration/engine.test.ts
@@ -288,7 +288,7 @@ describe('generated support files', () => {
     expect(graphignore).toContain('dist/');
     expect(graphignore).not.toContain('AGENTS.md');
     expect(readFileSync(join(root, '.gitignore'), 'utf8')).toMatch(
-      /^node_modules\/\n\n# mandao:begin\n.*\ngraphify-out\/\n\.mandao\/run\.lock\n\.mandao\/cli\.log\n\.claude\/settings\.local\.json\n# mandao:end\n$/s,
+      /^node_modules\/\n\n# mandao:begin\n.*\ngraphify-out\/\n\.mandao\/run\.lock\n\.mandao\/cli\.log\n\.mandao\/cache\/\n\.claude\/settings\.local\.json\n# mandao:end\n$/s,
     );
     expect(readFileSync(join(root, 'src/billing/CLAUDE.md'), 'utf8')).toBe('<!-- mandao:begin -->\n@AGENTS.md\n<!-- mandao:end -->\n');
 

--- /dev/null
+++ b/src/schemas/spec.ts (new file)
/**
 * Spec facts both the spec domain and the writer need (the writer depends on schemas only): the story id
 * pattern, the layout versions, and which of them keep the spec's bulk in `.mandao/cache/<ID>/`.
 */

/** A story id: `PROJ-123`, `MDO-0001`. It names the spec's cache folder, so nothing else ever passes. */
export const STORY_ID = /^[A-Z][A-Z0-9_]*-\d+$/;

/** The layout versions a story's `schema_version` may name: the one place the set is written. */
export const LAYOUT_VERSIONS = [1, 2] as const;
export type LayoutVersion = (typeof LAYOUT_VERSIONS)[number];

/** The first layout version with a six-file `_log/` and a local cache (MDO-0011 design D3). */
const FIRST_CACHE_VERSION = 2;

/**
 * True when a story's `schema_version` (as parsed: a quoted `'2'` is a string) is a known layout version
 * that keeps a six-file `_log/` and its bulk in the local cache. An unknown or malformed version is false,
 * so every caller routes such a spec the same, version 1, way.
 */
export function keepsLogCache(schemaVersion: unknown): boolean {
  const version = LAYOUT_VERSIONS.find((v) => v === schemaVersion);
  return version !== undefined && version >= FIRST_CACHE_VERSION;
}

--- /dev/null
+++ b/test/integration/log-v2-wide.test.ts (new file)
// mandao-scans: none — copies the MDO-0001 fixture into temporary trees.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { writeYaml } from '../../src/engine/files.js';
import { makeTree } from '../helpers.js';
import {
  CACHE,
  filesUnder,
  git,
  lastOut,
  NOISY_GATE,
  REVIEW_FAIL,
  REVIEW_PASS,
  repo,
  run,
  SIX,
  SPEC,
  useLogEnv,
} from '../log-v2-helpers.js';

useLogEnv();

// ---- Rework 2: the Done-when history at full size, the version 2 full-run path, a story id that is a path ----

const CODE = 'export const answer = 42;\n';
const IMPACTED = `node -e "process.exit(require('fs').readFileSync('src/code.js','utf8').includes('MUTATED')?1:0)" {files}`;
const T3 = `
### [ ] T3 — Pin the alias

\`\`\`yaml
project: mandao
tier: standard
kind: test
characterization: true
files: [test/a.test.ts]
exemplar: src/cli/skills.ts
ac: [AC-2]
scenarios: [S-2.1]
tests: { unit: [pins the alias] }
verify: npx vitest run test/a.test.ts
depends_on: []
\`\`\`
`;
const bigFile = (tag: string, n = 5000) => `${Array.from({ length: n }, (_, i) => `export const ${tag}_${i} = ${i};`).join('\n')}\n`;
const lineCount = (f: string) => readFileSync(f, 'utf8').split('\n').length;

/** A version 2 repo with three tasks (T3 is characterization), a failing 10,000-line gate and a gate whose tool is not installed. */
function wideRepo() {
  const root = repo(2);
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [
      {
        name: 'mandao',
        path: '.',
        gates: { typecheck: NOISY_GATE, secrets: 'mandao-no-such-tool-xyz --scan' },
        tests: { impacted: IMPACTED },
      },
    ],
    harnesses: ['claude'],
  });
  const tasks = join(root, SPEC, 'tasks.md');
  writeFileSync(tasks, `${readFileSync(tasks, 'utf8').replace('### [x] T1', '### [ ] T1').trimEnd()}\n${T3}`);
  mkdirSync(join(root, 'test'), { recursive: true });
  writeFileSync(join(root, 'src/code.js'), CODE);
  writeFileSync(join(root, 'test/a.test.ts'), 'export {};\n');
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'three tasks');
  return root;
}

/** The mutation patch: src/code.js with MUTATED in it, as a unified diff. */
function mutationPatch(root: string) {
  writeFileSync(join(root, 'src/code.js'), 'export const answer = "MUTATED";\n');
  const diff = execFileSync('git', ['diff', '--', 'src/code.js'], { cwd: root, encoding: 'utf8' });
  git(root, 'checkout', '--', 'src/code.js');
  const file = join(makeTree({}), 'm.patch');
  writeFileSync(file, diff);
  return file;
}

/** One attempt at task `t`: a 5,000-line change, gates, a pack, a mutation for T3's first, then FAIL (first) or PASS. */
async function wideAttempt(root: string, t: string, attempt: number) {
  const T = ['--task', t, '--harness', 'claude'];
  const file = t === 'T3' ? 'test/a.test.ts' : 'src/cli/skills.ts';
  await run(root, 'checkpoint', 'MDO-0001', ...T, '--verdict', 'STARTED', '--tier', 'standard');
  writeFileSync(join(root, file), bigFile(`${t}a${attempt}`));
  await run(root, 'gates', 'MDO-0001', t);
  await run(root, 'review-pack', 'MDO-0001', t);
  if (t === 'T3' && attempt === 1) {
    await run(root, 'mutation', 'MDO-0001', 'T3', 'test/a.test.ts', '--patch', mutationPatch(root));
    expect(lastOut()).toMatchObject({ recorded: true });
  }
  const review = join(root, `review-${t}-${attempt}.txt`);
  writeFileSync(review, attempt === 1 ? REVIEW_FAIL : REVIEW_PASS);
  const verdict =
    attempt === 1 ? ['--verdict', 'FAIL', '--reason', 'B1: alias missing'] : ['--verdict', 'PASS', '--pending-commit', `finish ${t}`];
  await run(root, 'checkpoint', 'MDO-0001', ...T, ...verdict, '--reviewer', 'self', '--implementer', 'self', '--review', review);
}

/** 3 tasks x 2 attempts: a 10,000-line failing gate, a 5,000-line change (so a 5,000-line pack) per attempt, FAIL then PASS, a mutation, 2 premises. */
async function wideHistory(root: string) {
  const long = `"for(let i=1;i<=100;i++)console.log('line '+i)"`;
  for (const p of ['P1', 'P2']) await run(root, 'premise', 'MDO-0001', p, '--', 'node', '-e', long);
  for (const t of ['T1', 'T2', 'T3']) {
    for (const attempt of [1, 2]) await wideAttempt(root, t, attempt);
    await run(root, 'commit', 'MDO-0001');
  }
}

describe('S-3.1 at the Done-when size: 3 tasks x 2 attempts, a mutation, 2 premises, 10,000-line gate, 5,000-line pack', () => {
  test('S-3.1: every task commit touches only the six files in _log/, and the committed _log is at most 1000 lines', async () => {
    const root = wideRepo();
    await wideHistory(root);
    git(root, 'add', '-A');
    git(root, 'commit', '-qm', 'log');
    const tracked = git(root, 'ls-files', `${SPEC}/_log`).split('\n').filter(Boolean);
    expect(tracked.map((f) => f.split('/').at(-1)).sort()).toEqual(SIX);
    const touched = git(root, 'log', '--name-only', '--format=', '--', `${SPEC}/_log`).split('\n').filter(Boolean);
    expect(touched.length).toBeGreaterThan(0);
    expect(touched.every((f) => SIX.includes(f.split('/').at(-1)!) && f.split('/').length === SPEC.split('/').length + 2)).toBe(true);
    expect(tracked.reduce((n, f) => n + lineCount(join(root, f)), 0)).toBeLessThanOrEqual(1000);
  });

  test('S-3.2: a pack per attempt, the full 10,000-line gate output and the mutation are in the cache, none in _log/', async () => {
    const root = wideRepo();
    await wideHistory(root);
    const cached = filesUnder(join(root, CACHE));
    expect(cached.filter((f) => /pack/.test(f)).length).toBeGreaterThanOrEqual(6);
    expect(cached.some((f) => lineCount(f) >= 10000)).toBe(true);
    expect(cached.some((f) => /mutations\/T3-1\.md$/.test(f))).toBe(true);
    expect(filesUnder(join(root, SPEC, '_log')).some((f) => /pack|mutations/.test(f))).toBe(false);
    expect(git(root, 'status', '--porcelain', '--untracked-files=all')).not.toContain('.mandao/cache');
  });

  test('S-3.1: the mutation is a MUTANT row in execution.md and its evidence path points into the cache', async () => {
    const root = wideRepo();
    await wideHistory(root);
    const execution = readFileSync(join(root, SPEC, '_log/execution.md'), 'utf8');
    expect(execution).toMatch(/MUTANT/);
    expect(execution).toContain('.mandao/cache/MDO-0001/mutations/T3-1.md');
  });

  test('S-3.4: premises.md keeps the exit code and at most 20 lines of a long probe output', async () => {
    const root = wideRepo();
    await wideHistory(root);
    const premises = readFileSync(join(root, SPEC, '_log/premises.md'), 'utf8');
    expect(premises).toMatch(/Exit: 0/);
    const isLine = (l: string) => /^line \d+$/.test(l);
    expect(premises.split('\n').filter(isLine).length).toBeGreaterThan(0);
    for (const section of premises.split(/^## /m).filter((s) => /^P\d+ — /.test(s)))
      expect(section.split('\n').filter(isLine).length).toBeLessThanOrEqual(20);
  });

  test('S-3.4: a not-installed gate is named once per attempt in gates.md, with no output block', async () => {
    const root = wideRepo();
    await wideHistory(root);
    const gates = readFileSync(join(root, SPEC, '_log/gates.md'), 'utf8');
    const sections = gates.split(/^## /m).filter((s) => /^T\d+ — attempt \d+/.test(s));
    expect(sections.length).toBe(6);
    for (const s of sections) {
      expect(s.match(/NOT_INSTALLED/g)?.length).toBe(1);
      expect(s.match(/\bsecrets\b/g)?.length).toBe(1);
    }
    expect(gates).not.toContain('mandao-no-such-tool-xyz');
    // T3's files (test/a.test.ts) are named by no gate line: its sections keep the last lines instead, so only T1 and T2 are filtered.
    for (const s of sections.filter((s) => !s.startsWith('T3'))) expect(s).not.toContain('src/other/noise.ts(');
    for (const s of sections) expect(s.split('\n').filter((l) => l.startsWith('src/cli/skills.ts(')).length).toBeLessThanOrEqual(40);
  });
});

--- /dev/null
+++ b/test/integration/log-v2.test.ts (new file)
// mandao-scans: none — copies the MDO-0001 fixture into temporary trees.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { recordedPremises } from '../../src/cli/run-premise.js';
import { writeYaml } from '../../src/engine/files.js';
import { recordFullRun } from '../../src/scripts/forced.js';
import { logDiscrepancies } from '../../src/writer/log-integrity.js';
import { makeTree } from '../helpers.js';
import { CACHE, filesUnder, git, history, OTHER_LAST, repo, run, SIX, SPEC, useLogEnv } from '../log-v2-helpers.js';

useLogEnv();

describe('S-3.1: a version 2 log is six committed files', () => {
  test('S-3.1: after attempts, gates, reviews and premises, git ls-files _log lists exactly the six files, in at most 1000 lines', async () => {
    const root = repo(2);
    await history(root);
    git(root, 'add', '-A');
    git(root, 'commit', '-qm', 'log');
    const tracked = git(root, 'ls-files', `${SPEC}/_log`).split('\n').filter(Boolean);
    expect(tracked.map((f) => f.split('/').at(-1)).sort()).toEqual(SIX);
    expect(tracked.every((f) => f.split('/').length === SPEC.split('/').length + 2)).toBe(true);
    const lines = tracked.reduce((n, f) => n + readFileSync(join(root, f), 'utf8').split('\n').length, 0);
    expect(lines).toBeLessThanOrEqual(1000);
  });

  test('S-3.1 (regression pin): a version 1 spec still keeps its per-attempt files in _log/', async () => {
    const root = repo(1);
    await history(root);
    const base = join(root, SPEC, '_log');
    const names = filesUnder(base).map((f) => f.slice(base.length + 1));
    expect(names).toEqual(expect.arrayContaining(['gates/T2-1.md', 'reviews/T2-1-review.md', 'reviews/T2-1-pack.md', 'premises/P1.md']));
    expect(existsSync(join(base, 'reviews.md'))).toBe(false);
  });
});

describe('S-3.2: the bulk stays in .mandao/cache/<ID>/, outside git', () => {
  test('S-3.2: the pack and the full gate output are written under .mandao/cache/MDO-0001/', async () => {
    const root = repo(2);
    await history(root);
    const cached = filesUnder(join(root, CACHE));
    expect(cached.some((f) => /pack/.test(f))).toBe(true);
    expect(cached.some((f) => readFileSync(f, 'utf8').includes(OTHER_LAST))).toBe(true);
    expect(filesUnder(join(root, SPEC, '_log')).some((f) => /pack/.test(f) || readFileSync(f, 'utf8').includes(OTHER_LAST))).toBe(false);
  });

  test('S-3.2/C1: git status does not show the cache, and the managed ignore block lists it', async () => {
    const root = repo(2);
    await history(root);
    expect(git(root, 'status', '--porcelain', '--untracked-files=all')).not.toContain('.mandao/cache');
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toContain('.mandao/cache/');
    expect(git(root, 'ls-files', '.mandao/cache')).toBe('');
  });
});

describe('logs.level: what close does with the cache', () => {
  test('logs.level: the default summary deletes the cache at close, full keeps it, and neither commits it', async () => {
    for (const level of ['summary', 'full'] as const) {
      const root = repo(2);
      if (level === 'full') {
        const config = parseYaml(readFileSync(join(root, '.mandao/config.yml'), 'utf8')) as Record<string, unknown>;
        writeYaml(join(root, '.mandao/config.yml'), { ...config, logs: { level } });
      }
      await history(root);
      expect(filesUnder(join(root, CACHE)).length).toBeGreaterThan(0);
      await run(root, 'close-summary', 'MDO-0001', '--closed');
      expect(existsSync(join(root, CACHE))).toBe(level === 'full');
      expect(git(root, 'status', '--porcelain', '--untracked-files=all')).not.toContain('.mandao/cache');
    }
  });
});

describe('S-3.3: every reader gives the same answer on both versions of one history', () => {
  /** Normalised so the two trees compare: their roots, timestamps and short hashes differ. */
  const norm = (value: unknown, root: string) =>
    JSON.stringify(value)
      .split(root)
      .join('<root>')
      .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g, '<at>')
      .replace(/\b[0-9a-f]{7,64}\b/g, '<sha>');

  async function answers(version: 1 | 2) {
    const root = repo(version);
    await history(root);
    const a = {
      trace: await run(root, 'trace', 'MDO-0001'),
      verifyPlan: await run(root, 'verify-plan', 'MDO-0001'),
      summary: await run(root, 'implement-summary', 'MDO-0001'),
      kaizen: await run(root, 'kaizen', 'MDO-0001'),
      compare: await run(root, 'kaizen-compare'),
      next: (await run(root, 'next', 'MDO-0001')).recommended,
      resume: await run(root, 'step', 'MDO-0001', 'T2', '--harness', 'claude', '--no-brief'),
    };
    return { root, text: norm(a, root), a };
  }

  test('S-3.3: trace, verify-plan, implement-summary, kaizen, kaizen-compare and next', async () => {
    const [v1, v2] = [await answers(1), await answers(2)];
    expect(v2.a.summary.tasks.find((t: { id: string }) => t.id === 'T2')).toMatchObject({ attempts: 2, verdict: 'PASS', committed: true });
    expect(v2.text).toBe(v1.text);
  });

  test('S-3.3/C2: the integrity check sees a hand edit of a log on both versions, and nothing before it', async () => {
    for (const version of [1, 2] as const) {
      const root = repo(version);
      const dir = await history(root);
      expect(logDiscrepancies(dir)).toEqual([]);
      writeFileSync(join(dir, '_log/execution.md'), `${readFileSync(join(dir, '_log/execution.md'), 'utf8')}\nedited by hand\n`);
      expect(logDiscrepancies(dir).join(' ')).toContain('execution.md');
    }
  });
});

describe('S-3.4: what must not be lost stays in the committed log', () => {
  test('S-3.4: reviews.md has the FAIL verdict and findings, gates.md the failing output of the task files, state.yml the approval, premises.md the exit and excerpt', async () => {
    const root = repo(2);
    const dir = await history(root);
    const log = (f: string) => readFileSync(join(dir, '_log', f), 'utf8');
    expect(log('reviews.md')).toContain('VERDICT: FAIL');
    expect(log('reviews.md')).toContain('B1: `skills ls` is not registered as an alias.');
    const gates = log('gates.md');
    expect(gates).toContain('src/cli/skills.ts(');
    expect(gates).not.toContain('src/other/noise.ts(');
    expect(gates.split('\n').filter((l) => l.startsWith('src/cli/skills.ts(')).length).toBeLessThanOrEqual(40);
    const approvals = (parseYaml(log('state.yml')) as { approvals: Record<string, unknown>[] }).approvals;
    expect(approvals.at(-1)).toMatchObject({ step: 'design', words: 'go ahead, looks right', sha256: expect.any(Object) });
    const premises = log('premises.md');
    expect(premises).toMatch(/Exit: 0/);
    expect(premises).toContain('pinned P1');
    expect(premises).toContain('pinned P2');
  });

  test('S-3.4/C3: the readers find a recorded premise in premises.md, so a premise run is not lost', () => {
    const root = makeTree({
      'spec/story.md': '---\nschema_version: 2\nid: MDO-0001\n---\n# X\n',
      'spec/_log/premises.md': '# Premises\n\n## P1 — run\n\n- Command: `node -e "1"`\n- Exit: 0\n\n```\npinned: 2\n```\n',
    });
    expect([...recordedPremises(join(root, 'spec'))]).toEqual(['P1']);
  });
});

describe('MDO-0007 on a version 2 spec: a forced full run is a section of execution.md', () => {
  test('S-3.1: recordFullRun lands in "## Full runs" of execution.md and adds no file to _log/', () => {
    const root = repo(2);
    const names = () => filesUnder(join(root, SPEC, '_log')).map((f) => f.split('/').at(-1)!);
    const before = names();
    recordFullRun(
      root,
      { at: '2026-01-01T00:00:00.000Z', project: 'mandao', reason: 'migrating the runner', status: 'PASS' },
      join(root, SPEC),
    );
    const execution = readFileSync(join(root, SPEC, '_log/execution.md'), 'utf8');
    expect(execution).toContain('## Full runs');
    expect(execution.slice(execution.indexOf('## Full runs'))).toContain('migrating the runner');
    expect(names().filter((f) => !before.includes(f))).toEqual([]);
    expect(existsSync(join(root, SPEC, '_log/full-runs.md'))).toBe(false);
    expect(existsSync(join(root, SPEC, 'full-runs.md'))).toBe(false);
  });

  test('S-3.3: a version 1 spec still gets full-runs.md', () => {
    const root = repo(1);
    recordFullRun(root, { at: '2026-01-01T00:00:00.000Z', project: 'mandao', reason: 'why not', status: 'PASS' }, join(root, SPEC));
    expect(readFileSync(join(root, SPEC, '_log/full-runs.md'), 'utf8')).toContain('why not');
  });
});

describe('security: a story id that is a path never reaches outside .mandao/cache/', () => {
  const survivors = (root: string) =>
    ['.mandao/config.yml', 'package.json', 'src/cli/skills.ts', '.git/HEAD'].map((f) => existsSync(join(root, f)));

  test.each(['..', '../..', '../../x', 'MDO-0001/../..', 'mdo-1'])(
    'close-summary --closed with id %s deletes nothing outside the cache',
    async (id) => {
      const root = repo(2);
      const story = join(root, SPEC, 'story.md');
      writeFileSync(story, readFileSync(story, 'utf8').replace(/^id: .*$/m, `id: '${id}'`));
      await run(root, 'close-summary', 'MDO-0001', '--closed').catch(() => undefined);
      expect(survivors(root)).toEqual([true, true, true, true]);
    },
  );

  test('a story id that is a path writes no log or hash outside .mandao/cache/', async () => {
    const root = repo(2);
    const story = join(root, SPEC, 'story.md');
    writeFileSync(story, readFileSync(story, 'utf8').replace(/^id: .*$/m, "id: '../..'"));
    const before = readdirSync(root).sort();
    await run(root, 'premise', 'MDO-0001', 'P1', '--', 'node', '-e', '"1"').catch(() => undefined);
    expect(readdirSync(root).sort()).toEqual(before);
    expect(existsSync(join(root, 'integrity.json'))).toBe(false);
  });
});

--- /dev/null
+++ b/test/log-v2-helpers.ts (new file)
// mandao-scans: none — copies the MDO-0001 fixture into temporary trees.
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, vi } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { buildProgram } from '../src/cli/program.js';
import { writeYaml } from '../src/engine/files.js';
import { syncProject } from '../src/engine/sync.js';
import { makeTree, pkg } from './helpers.js';

const fixture = join(import.meta.dirname, 'fixtures/spec/MDO-0001-skills-list');
export const SPEC = 'specs/MDO-0001-skills-list';
export const CACHE = '.mandao/cache/MDO-0001';
export const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
let out: string[] = [];
export const ledger = `---
schema_version: 1
spec: MDO-0001-skills-list
status: draft
---

# Design — skills list

## Premise Ledger

<a id="p1"></a>
### P1 — The lock lists every pinned skill (High)

- **If false:** the command misses skills.

<a id="p2"></a>
### P2 — The catalog is not needed (High)

- **If false:** the command misses entries.

## Evidence
`;

/** A gate that fails with 10,000 lines: odd lines name the task's file, even lines another file. */
export const NOISY_GATE = `node -e "for(let i=1;i<=10000;i++)console.log((i%2?'src/cli/skills.ts(':'src/other/noise.ts(')+i+'): error TS'+i);process.exit(1)"`;
export const OTHER_LAST = 'src/other/noise.ts(10000): error TS10000';
export const REVIEW_FAIL = 'VERDICT: FAIL\n\n## Blocking findings\n\n- B1: `skills ls` is not registered as an alias.\n';
export const REVIEW_PASS = 'VERDICT: PASS\n\nThe alias is registered.\n';

/** The fixture as a spec of layout `version`, on its spec branch, committed. */
export function repo(version: 1 | 2) {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop'), 'src/cli/skills.ts': 'export const a = 1;\n' }));
  git(root, 'init', '-q', '-b', 'feat/MDO-0001-skills-list');
  git(root, 'config', 'user.name', 'Ana PO');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.', gates: { typecheck: NOISY_GATE } }],
    harnesses: ['claude'],
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  const dir = join(root, SPEC);
  const story = readFileSync(join(dir, 'story.md'), 'utf8').replace(/^schema_version: 1$/m, `schema_version: ${version}`);
  writeFileSync(join(dir, 'story.md'), story);
  writeFileSync(join(dir, 'design.md'), ledger);
  mkdirSync(join(dir, '_log'));
  for (const f of ['execution.md', 'progress.yml']) renameSync(join(dir, f), join(dir, '_log', f));
  if (version === 2) {
    // A version 2 spec keeps its progress in state.yml, not in progress.yml.
    const progress = parseYaml(readFileSync(join(dir, '_log/progress.yml'), 'utf8'));
    rmSync(join(dir, '_log/progress.yml'));
    writeYaml(join(dir, '_log/state.yml'), { progress });
  }
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}

export const cli = async (root: string, ...args: string[]) => {
  process.exitCode = undefined;
  await buildProgram(() => root).parseAsync(['node', 'mandao', ...args]);
  process.exitCode = undefined;
  return JSON.parse(out.at(-1)!);
};
export const run = (root: string, ...args: string[]) => cli(root, 'run', ...args);

/** Two attempts at T2: a failing gate and a FAIL review, then the same again ending in PASS and a task commit; two premises and an approval with words. */
export async function history(root: string) {
  const dir = join(root, SPEC);
  const T = ['--task', 'T2', '--harness', 'claude'];
  for (const p of ['P1', 'P2']) await run(root, 'premise', 'MDO-0001', p, '--', 'node', '-e', `"console.log('pinned ${p}')"`);
  for (const attempt of [1, 2]) {
    await run(root, 'checkpoint', 'MDO-0001', ...T, '--verdict', 'STARTED', '--tier', 'standard');
    writeFileSync(join(root, 'src/cli/skills.ts'), `export const a = ${attempt + 1};\n`);
    await run(root, 'gates', 'MDO-0001', 'T2');
    await run(root, 'review-pack', 'MDO-0001', 'T2');
    const review = join(root, `review-${attempt}.txt`);
    writeFileSync(review, attempt === 1 ? REVIEW_FAIL : REVIEW_PASS);
    const verdict =
      attempt === 1
        ? ['--verdict', 'FAIL', '--reason', 'B1: alias missing']
        : ['--verdict', 'PASS', '--pending-commit', 'register the skills list command'];
    await run(root, 'checkpoint', 'MDO-0001', ...T, ...verdict, '--reviewer', 'self', '--implementer', 'self', '--review', review);
  }
  await run(root, 'commit', 'MDO-0001');
  await cli(root, 'approve', 'MDO-0001', 'design', '--by-running', '/mandao-implement', '--words', 'go ahead, looks right');
  return dir;
}

export const filesUnder = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? filesUnder(join(dir, f)) : [join(dir, f)]))
    : [];
export const SIX = ['costs.yml', 'execution.md', 'gates.md', 'premises.md', 'reviews.md', 'state.yml'];

/** Registers the per-test environment: a temp MANDAO_HOME, git identity and captured console output. */
export function useLogEnv() {
  beforeEach(() => {
    process.env.MANDAO_HOME = makeTree({});
    for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
    for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
    out = [];
    vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });
}

/** The last JSON line the CLI printed. */
export const lastOut = () => JSON.parse(out.at(-1)!);

--- /dev/null
+++ b/test/unit/log-cache.test.ts (new file)
// mandao-scans: none — builds temporary trees; no secrets, no network.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { dropLogCache, specLogInCache } from '../../src/scripts/spec-log.js';
import { writeText } from '../../src/writer/files.js';
import { specCacheDir, usesLogCache } from '../../src/writer/log-integrity.js';
import { makeTree } from '../helpers.js';

/** A workspace with a version 2 spec whose story id is `id` (or has none), in a folder called `folder`. */
function workspace(id: string | undefined, folder = 'MDO-0001-thing') {
  const root = makeTree({
    '.mandao/config.yml': 'schema_version: 1\n',
    'package.json': '{}\n',
    [`specs/${folder}/story.md`]: `---\nschema_version: 2\n${id === undefined ? '' : `id: '${id}'\n`}---\n# X\n`,
    [`specs/${folder}/_log/execution.md`]: '# Execution\n',
  });
  return { root, spec: join(root, 'specs', folder) };
}
const alive = (root: string) => ['.mandao/config.yml', 'package.json'].map((f) => existsSync(join(root, f)));

describe('specCacheDir: the cache folder is always .mandao/cache/<valid id>', () => {
  test.each([['MDO-0001'], ['PROJ-123'], ['A_B-7']])('a valid id %s gives .mandao/cache/%s', (id) => {
    const { root, spec } = workspace(id);
    expect(specCacheDir(spec)).toBe(join(root, '.mandao', 'cache', id));
  });

  test.each([['..'], ['../..'], ['../../x'], ['MDO-0001/../..'], ['mdo-1'], ['MDO-1/x'], ['.'], ['MDO']])(
    'the story id %s is refused',
    (id) => {
      const { spec } = workspace(id);
      expect(() => specCacheDir(spec)).toThrow();
    },
  );

  test('the folder-name fallback is validated the same way: a name that is not a story id is refused', () => {
    expect(() => specCacheDir(workspace(undefined, 'not-a-story-id').spec)).toThrow();
    expect(() => specCacheDir(workspace(undefined, 'x..y').spec)).toThrow();
  });

  test('the folder-name fallback accepts a folder that starts with a story id', () => {
    const { root, spec } = workspace(undefined, 'MDO-0007-thing');
    expect(specCacheDir(spec)).toBe(join(root, '.mandao', 'cache', 'MDO-0007'));
  });
});

describe('dropLogCache and log writes never touch anything outside .mandao/cache/', () => {
  test.each([['..'], ['../..'], ['../../x']])('dropLogCache with the story id %s refuses, and the config and files survive', (id) => {
    const { root, spec } = workspace(id);
    expect(() => dropLogCache(spec, 'summary')).toThrow();
    expect(alive(root)).toEqual([true, true]);
    expect(existsSync(join(spec, 'story.md'))).toBe(true);
  });

  test('dropLogCache removes only the spec cache folder, not its siblings or .mandao/', () => {
    const { root, spec } = workspace('MDO-0001');
    mkdirSync(join(root, '.mandao/cache/MDO-0001'), { recursive: true });
    mkdirSync(join(root, '.mandao/cache/MDO-0002'), { recursive: true });
    writeFileSync(join(root, '.mandao/cache/MDO-0001/pack.md'), 'x');
    writeFileSync(join(root, '.mandao/cache/MDO-0002/pack.md'), 'y');
    expect(dropLogCache(spec, 'summary')).toBe(true);
    expect(existsSync(join(root, '.mandao/cache/MDO-0001'))).toBe(false);
    expect(existsSync(join(root, '.mandao/cache/MDO-0002/pack.md'))).toBe(true);
    expect(alive(root)).toEqual([true, true]);
  });

  test('a log write for a spec whose id is a path writes no integrity file outside .mandao/cache/', () => {
    const { root, spec } = workspace('../..');
    try {
      writeText(join(spec, '_log/execution.md'), '# Execution\n\nrow\n');
    } catch {
      // refusing is the expected outcome
    }
    expect(existsSync(join(root, 'integrity.json'))).toBe(false);
    expect(existsSync(join(root, '.mandao/integrity.json'))).toBe(false);
  });
});

describe('one version predicate: the log files and the hashes of a spec follow the same layout', () => {
  test.each([
    ['2', true],
    ["'2'", false],
    ['"2"', false],
    ['3', false],
    ['1', false],
  ])('schema_version: %s routes both to the cache: %s', (version, cache) => {
    const root = makeTree({
      '.mandao/config.yml': 'schema_version: 1\n',
      'specs/MDO-0001-thing/story.md': `---\nschema_version: ${version}\nid: MDO-0001\n---\n# X\n`,
    });
    const spec = join(root, 'specs', 'MDO-0001-thing');
    expect([specLogInCache(spec), usesLogCache(spec)]).toEqual([cache, cache]);
  });
});

```
