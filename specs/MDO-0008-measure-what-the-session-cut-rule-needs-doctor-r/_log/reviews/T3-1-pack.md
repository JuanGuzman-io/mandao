# Review pack — T3, attempt 1

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T3-1.md`.

## Brief

```json
{
  "spec": "MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r",
  "task": {
    "project": "mandao",
    "kind": "feat",
    "tier": "standard",
    "files": [
      "src/cli/run-close.ts",
      "core/commands/close.md",
      "core/templates/shared/close/kaizen.md",
      "test/integration/close.test.ts"
    ],
    "exemplar": "src/cli/run-close.ts",
    "ac": [
      "AC-3"
    ],
    "scenarios": [
      "S-3.1"
    ],
    "test_levels": {
      "S-3.1": "unit"
    },
    "evidence": "tdd",
    "risk_tags": [
      "public-api"
    ],
    "depends_on": [
      "T2"
    ],
    "parallel_safe": false,
    "verify": "npx vitest run test/integration/close.test.ts",
    "tests": {
      "unit": [
        "S-3.1"
      ],
      "e2e": []
    },
    "dod": [],
    "characterization": false,
    "id": "T3",
    "title": "Kaizen shows a spec's pauses and turns",
    "done": false,
    "line": 90
  },
  "acceptance": [
    {
      "ref": "AC-3",
      "text": "**GIVEN** a spec with measured sessions · **WHEN** Kaizen runs for it at close · **THEN** the Kaizen output and the spec's Kaizen document show the pauses and the turns per task, verify and close"
    }
  ],
  "scenarios": [
    {
      "ref": "S-3.1",
      "text": "**Given** a spec with measured sessions · **When** `mandao run kaizen <spec>` runs · **Then** its JSON has `sessions` with the pauses, the turns per task, verify, close and after tasks, and the missing sessions; `/mandao-close` writes them under `## Sessions` in `docs/kaizen/<ID>.md`"
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
    "| codebase-conventions | stack | specify, implement, verify | `src/`, `test/`, `core/` | project skill in `.claude/skills/codebase-conventions/`, generated with skill-creator from `docs/constitution/standards.md` and `architecture.md` |"
  ],
  "lenses": [
    "security"
  ],
  "loop": {
    "task": "T3",
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
    "graphTests": [],
    "files": [
      "src/cli/run-close.ts",
      "core/commands/close.md",
      "core/templates/shared/close/kaizen.md",
      "test/integration/close.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related src/cli/run-close.ts core/commands/close.md core/templates/shared/close/kaizen.md test/integration/close.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": [
      "src/cli/run-ledger.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/integration/close.test.ts"
    ],
    "changed": []
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
diff --git a/core/commands/close.md b/core/commands/close.md
index 24173d6..76f79ee 100644
--- a/core/commands/close.md
+++ b/core/commands/close.md
@@ -50,7 +50,10 @@ instructions.
    the story after the close and pass `--tracker-bugs <n>`. Then `{{script:kaizen-compare}}` for the TDD
    comparison: report both groups with their sample size; below the minimum per group write
    "insufficient data" and draw no conclusion.
-2. **Learn:** 0–3 root-cause lessons, each with evidence. **Standardize:** 1–3 one-line edits, each for
+2. **Sessions:** show `sessions` from that JSON under `## Sessions` in the Kaizen document: the pauses, the turns per task, verify, close and after
+   tasks, and the missing sessions. A missing session is never shown as zero; `'not recorded'` and
+   `'not measured'` are shown as that text.
+3. **Learn:** 0–3 root-cause lessons, each with evidence. **Standardize:** 1–3 one-line edits, each for
    approval. Write `docs/kaizen/<ID>.md` from `{{template:close/kaizen.md}}`.
 
 ## 2. Constitution and product impacts (single writer)
diff --git a/core/templates/shared/close/kaizen.md b/core/templates/shared/close/kaizen.md
index dd90cd3..b4d06e1 100644
--- a/core/templates/shared/close/kaizen.md
+++ b/core/templates/shared/close/kaizen.md
@@ -10,6 +10,8 @@ date:
 
 ## Measure
 
+## Sessions
+
 ## TDD comparison
 
 ## Learn
diff --git a/src/cli/run-close.ts b/src/cli/run-close.ts
index e99cf25..cf0865c 100644
--- a/src/cli/run-close.ts
+++ b/src/cli/run-close.ts
@@ -6,9 +6,10 @@ import { readRecommendations, resolveWorkspaceModels } from '../models/load.js';
 import { resolveModels } from '../models/resolve.js';
 import { branchingFor } from '../scripts/branching.js';
 import { commitsSize, fixCommitsAfter, forcedRunCount, releaseBranchesContaining } from '../scripts/close.js';
-import { commitState, repoRoot, taskCommits } from '../scripts/commits.js';
+import { commitState, repoRoot, taskCommits, taskCommitTimes } from '../scripts/commits.js';
 import { publishPlan } from '../scripts/publish.js';
 import { sizeLimits } from '../scripts/quick-check.js';
+import { measureSessions } from '../scripts/session-turns.js';
 import { findSpec, readSpec, type SpecFolder } from '../scripts/spec.js';
 import { docPath, hasExecutionLog, logPath } from '../scripts/spec-log.js';
 import {
@@ -79,6 +80,14 @@ function metricsOf(config: ReturnType<typeof readConfig>, spec: SpecFolder, trac
   return specMetrics(spec.name, spec.tasks, spec.execution, forcedRunCount(readIf(logPath(spec.dir, 'execution.md'))), bugs);
 }
 
+/** The spec's measured sessions: pauses, turns per task, verify, close and after tasks, and the missing sessions. */
+function sessionsOf(config: ReturnType<typeof readConfig>, spec: SpecFolder) {
+  const commitTimes = spec.story
+    ? taskCommitTimes(repoRoot(spec.dir), spec.story.meta.id, config.commits.trailers)
+    : new Map<string, number[]>();
+  return measureSessions({ specDir: spec.dir, commitTimes });
+}
+
 function registerKaizen(run: Command, ctx: CliContext) {
   run
     .command('kaizen <spec>')
@@ -90,6 +99,7 @@ function registerKaizen(run: Command, ctx: CliContext) {
       json({
         ...metricsOf(config, spec, o.trackerBugs === undefined ? undefined : Number(o.trackerBugs)),
         costs: summarizeCosts(specCosts(spec.dir), config.budget.per_spec),
+        sessions: sessionsOf(config, spec),
       });
     });
 
diff --git a/test/integration/close.test.ts b/test/integration/close.test.ts
index 4c124f5..9a43cfc 100644
--- a/test/integration/close.test.ts
+++ b/test/integration/close.test.ts
@@ -1,11 +1,11 @@
 import { execFileSync } from 'node:child_process';
-import { realpathSync, writeFileSync } from 'node:fs';
+import { cpSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
 import { join } from 'node:path';
 import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
 import { configSchema } from '../../src/schemas/index.js';
 import { fixCommitsAfter, releaseBranchesContaining } from '../../src/scripts/close.js';
 import { parseCloseSummary, renderCloseSummary, withEnvironment, withPublication } from '../../src/spec/index.js';
-import { makeTree } from '../helpers.js';
+import { makeTree, pkg } from '../helpers.js';
 
 const trailers = configSchema.parse({ schema_version: 1, workspace: 'single', projects: [{ name: 'p', path: '.' }], harnesses: ['claude'] })
   .commits.trailers;
@@ -126,3 +126,83 @@ describe('mandao run diagram-drift', () => {
     vi.restoreAllMocks();
   });
 });
+
+describe('Kaizen shows the sessions (MDO-0008 S-3.1)', () => {
+  // Synthetic session: T1 committed at minute 2.5, implement recorded at 4.5, verify at 6.5, close at 9.5.
+  const T0 = Date.parse('2026-01-05T10:00:00.000Z');
+  const at = (minutes: number) => new Date(T0 + minutes * 60_000).toISOString();
+  const usage = { input_tokens: 2, cache_read_input_tokens: 1000, cache_creation_input_tokens: 10, output_tokens: 5 };
+  const reply = (id: string, minutes: number) =>
+    JSON.stringify({ type: 'assistant', timestamp: at(minutes), message: { id, model: 'claude-opus-5-5', usage } });
+  const prompt = (minutes: number) =>
+    JSON.stringify({ type: 'user', timestamp: at(minutes), message: { role: 'user', content: 'synthetic prompt' } });
+  const record = (command: string, minutes: number, session: string) =>
+    `  - at: ${at(minutes)}\n    command: ${command}\n    harness: claude\n    session: ${session}\n    usd: 0.5\n    source: claude-code\n`;
+  const transcript = [
+    prompt(0),
+    reply('a1', 0.5),
+    reply('a2', 1.5),
+    reply('a3', 2.0),
+    reply('a4', 3.5),
+    reply('a5', 4.0),
+    prompt(5), // 1 minute after a5
+    reply('b1', 5.5),
+    reply('b2', 6.0),
+    prompt(7), // 1 minute after b2
+    reply('c1', 8.0),
+    reply('c2', 9.0),
+  ].join('\n');
+
+  test('mandao run kaizen has sessions: pauses, turns per task, verify, close, after tasks and the missing sessions', async () => {
+    const { buildProgram } = await import('../../src/cli/program.js');
+    const { writeYaml } = await import('../../src/engine/files.js');
+    vi.stubEnv('CLAUDE_CONFIG_DIR', makeTree({ 'projects/-synthetic-repo/sess-one.jsonl': transcript }));
+    const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
+    git(root, 'init', '-q', '-b', 'main');
+    writeYaml(join(root, '.mandao/config.yml'), {
+      schema_version: 1,
+      workspace: 'single',
+      projects: [{ name: 'p', path: '.' }],
+      harnesses: ['claude'],
+    });
+    const spec = join(root, 'specs/MDO-0001-skills-list');
+    cpSync(join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list'), spec, { recursive: true });
+    mkdirSync(join(spec, '_log'), { recursive: true });
+    writeFileSync(
+      join(spec, '_log/costs.yml'),
+      `costs:\n${record('specify', 0, 'sess-gone')}${record('implement', 4.5, 'sess-one')}${record('verify', 6.5, 'sess-one')}${record('close', 9.5, 'sess-one')}`,
+    );
+    git(root, 'add', '.');
+    commit(root, 'src.ts', '✨ feat(cli): add x\n\nRefs: MDO-0001\nMandao-Task: T1', at(2.5));
+    const out: string[] = [];
+    vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
+    await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', 'kaizen', 'MDO-0001']);
+    vi.restoreAllMocks();
+    expect(JSON.parse(out.at(-1)!).sessions).toMatchObject({
+      missing: ['sess-gone'],
+      pauses: { count: 2, medianMinutes: 1, atMost5: 2, between5And60: 0, over60: 0 },
+      tasks: { T1: 3 },
+      verify: 2,
+      close: 2,
+      afterTasks: 6,
+    });
+  });
+
+  test('after mandao sync the close command carries the step and the Kaizen template has a Sessions section', async () => {
+    const { syncProject } = await import('../../src/engine/sync.js');
+    const { writeYaml } = await import('../../src/engine/files.js');
+    vi.stubEnv('MANDAO_HOME', makeTree({}));
+    const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
+    writeYaml(join(root, '.mandao/config.yml'), {
+      schema_version: 1,
+      workspace: 'single',
+      projects: [{ name: 'shop', path: '.' }],
+      harnesses: ['claude'],
+    });
+    syncProject(root);
+    const closeCommand = readFileSync(join(root, '.claude/skills/mandao-close/SKILL.md'), 'utf8');
+    expect(closeCommand).toContain('## Sessions');
+    expect(closeCommand).toMatch(/sessions/);
+    expect(readFileSync(join(root, '.mandao/templates/app/close/kaizen.md'), 'utf8')).toContain('## Sessions');
+  });
+});

```
