# Review pack — T4, attempt 1

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T4-1.md`.

## Brief

```json
{
  "spec": "MDO-0010-guide-the-next-step-and-keep-the-session-in-the",
  "task": {
    "project": "mandao",
    "kind": "fix",
    "tier": "standard",
    "files": [
      "src/spec/costs.ts",
      "src/cli/run-cost.ts",
      "src/scripts/session-turns.ts",
      "test/integration/costs.test.ts"
    ],
    "exemplar": "src/spec/costs.ts",
    "ac": [
      "AC-4",
      "AC-4/C1"
    ],
    "scenarios": [
      "S-4.1",
      "S-4.1/C1",
      "S-4.2"
    ],
    "test_levels": {
      "S-4.1": "e2e",
      "S-4.1/C1": "e2e",
      "S-4.2": "e2e"
    },
    "evidence": "tdd",
    "risk_tags": [],
    "depends_on": [],
    "parallel_safe": true,
    "verify": "npx vitest run test/integration/costs.test.ts test/unit/session-turns.test.ts",
    "tests": {
      "unit": [],
      "e2e": [
        "S-4.1",
        "S-4.1/C1",
        "S-4.2"
      ]
    },
    "dod": [],
    "characterization": false,
    "id": "T4",
    "title": "A quick's cost excludes what other specs already recorded",
    "done": false,
    "line": 135
  },
  "acceptance": [
    {
      "ref": "AC-4",
      "text": "**GIVEN** a session that did other work before a quick change, for example a spec's implement · **WHEN** the quick records its cost · **THEN** the record holds only what was spent from the quick's start, and it is committed with the quick · **BUT it must NOT** count work already recorded for another spec or command in the same session"
    },
    {
      "ref": "AC-4/C1",
      "text": "**BUT it must NOT** count work already recorded for another spec or command in the same session"
    }
  ],
  "scenarios": [
    {
      "ref": "S-4.1",
      "text": "**Given** a session whose earlier record for MDO-0009 holds `cumulative.main-session: 9.0`, and a transcript now at 9.5 · **When** the quick records its cost · **Then** the quick's record is 0.5, not 9.5 · **BUT it must NOT** count what another spec's record already holds"
    },
    {
      "ref": "S-4.1/C1",
      "text": "**BUT it must NOT** count what another spec's record already holds"
    },
    {
      "ref": "S-4.2",
      "text": "**Given** a session with no earlier record anywhere · **When** the quick records its cost · **Then** the record is the whole session, which is the quick's own cost"
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
    "task": "T4",
    "tier": "standard",
    "attempt": 1,
    "failsAtTier": 0,
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
      "test/unit/next.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/release.test.ts",
      "test/unit/render.test.ts",
      "test/unit/session-turns.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ],
    "files": [
      "src/spec/costs.ts",
      "src/cli/run-cost.ts",
      "src/scripts/session-turns.ts",
      "test/integration/costs.test.ts",
      "test/integration/approve.test.ts",
      "test/integration/branching.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/cli.test.ts",
      "test/integration/close.test.ts",
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
      "test/unit/next.test.ts",
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
    "commandForBudget": "npx vitest related src/spec/costs.ts src/cli/run-cost.ts src/scripts/session-turns.ts test/integration/costs.test.ts test/integration/approve.test.ts test/integration/branching.test.ts test/integration/characterization.test.ts test/integration/cli.test.ts test/integration/close.test.ts test/integration/doctor-cli.test.ts test/integration/enforced-rules.test.ts test/integration/engine.test.ts test/integration/leader-scripts.test.ts test/integration/ledger.test.ts test/integration/lite-spec.test.ts test/integration/mdo-0004-defects.test.ts test/integration/mdo-0005-defects.test.ts test/integration/mdo-0006-defects.test.ts test/integration/premise.test.ts test/integration/review.test.ts test/integration/scripts.test.ts test/integration/shadow.test.ts test/integration/spec-log.test.ts test/integration/start.test.ts test/integration/tdd.test.ts test/integration/where.test.ts test/unit/commits-times.test.ts test/unit/diagram.test.ts test/unit/kaizen-sessions.test.ts test/unit/kaizen.test.ts test/unit/next.test.ts test/unit/pr-plan.test.ts test/unit/release.test.ts test/unit/render.test.ts test/unit/session-turns.test.ts test/unit/spec.test.ts test/unit/task-index.test.ts test/unit/verify.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": [
      "src/cli/run-close.ts",
      "src/cli/run.ts",
      "src/scripts/spend.ts",
      "src/spec/index.ts",
      "src/spec/kaizen-costs.ts",
      "src/spec/kaizen-sessions.ts",
      "test/unit/kaizen-sessions.test.ts",
      "test/unit/session-turns.test.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/integration/costs.test.ts",
      "test/unit/session-turns.test.ts"
    ],
    "changed": []
  }
}
```

## Gates — T4, attempt 1

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
diff --git a/src/cli/run-cost.ts b/src/cli/run-cost.ts
index cb7a87f..84a3167 100644
--- a/src/cli/run-cost.ts
+++ b/src/cli/run-cost.ts
@@ -1,4 +1,4 @@
-import { existsSync, readFileSync } from 'node:fs';
+import { existsSync, readdirSync, readFileSync } from 'node:fs';
 import { join } from 'node:path';
 import type { Command } from 'commander';
 import { readConfig } from '../engine/files.js';
@@ -65,6 +65,17 @@ function costsDir(ctx: CliContext, ref: string): string {
   return ref === 'quick' ? join(ctx.root(), config.paths.specs, 'quick') : findSpec(ctx.root(), config, ref);
 }
 
+/** Every costs.yml under the specs folder (quick included): a session's baseline is whatever any of them recorded. */
+function allEntries(ctx: CliContext): CostEntry[] {
+  const specs = join(ctx.root(), readConfig(ctx.root()).paths.specs);
+  if (!existsSync(specs)) return [];
+  return readdirSync(specs)
+    .map((d) => logPath(join(specs, d), 'costs.yml'))
+    .filter((f) => existsSync(f))
+    .flatMap((f) => parseCosts(readFileSync(f, 'utf8')))
+    .sort((a, b) => a.at.localeCompare(b.at));
+}
+
 const MODEL_KEY = 'model:';
 const MAIN = 'main-session';
 
@@ -122,7 +133,7 @@ export function registerCost(run: Command, ctx: CliContext) {
       const config = readConfig(ctx.root());
       const file = logPath(costsDir(ctx, ref), 'costs.yml');
       const entries = parseCosts(existsSync(file) ? readFileSync(file, 'utf8') : undefined);
-      const recorded = o.record ? newEntry(entries, o) : undefined;
+      const recorded = o.record ? newEntry(allEntries(ctx), o) : undefined;
       if (recorded) writeText(file, renderCosts([...entries, recorded]));
       const all = recorded ? [...entries, recorded] : entries;
       json({
diff --git a/test/integration/costs.test.ts b/test/integration/costs.test.ts
index a242ea6..7e5d513 100644
--- a/test/integration/costs.test.ts
+++ b/test/integration/costs.test.ts
@@ -134,6 +134,42 @@ describe('mandao run cost', () => {
     expect(readFileSync(join(root, 'specs/quick/_log/costs.yml'), 'utf8')).toContain('source: manual');
     expect(await cost('quick')).toMatchObject({ basis: 'unknown' });
   });
+
+  /** A session whose only transcript line is one Sonnet response: 50_000 output tokens cost 0.5 USD. */
+  const sonnetSession = (id: string, usd: number) => {
+    const dir = join(home, 'projects', '-tmp-proj');
+    mkdirSync(dir, { recursive: true });
+    writeFileSync(join(dir, `${id}.jsonl`), line('m1', 'claude-sonnet-5-5', { output_tokens: usd * 100_000 }));
+  };
+  const earlier = (cumulative: number) =>
+    `costs:\n  - at: 2026-01-05T10:00:00.000Z\n    command: implement\n    harness: claude\n    session: s9\n    usd: ${cumulative}\n` +
+    `    roles:\n      leader: ${cumulative}\n    models: {}\n    cumulative:\n      main-session: ${cumulative}\n    source: claude-code\n`;
+
+  test('S-4.1: a quick records only what was spent after another spec recorded in the same session', async () => {
+    mkdirSync(join(root, 'specs/MDO-0009-y/_log'), { recursive: true });
+    writeFileSync(join(root, 'specs/MDO-0009-y/story.md'), '---\nschema_version: 1\nid: MDO-0009\n---\n# Y\n');
+    writeFileSync(join(root, 'specs/MDO-0009-y/_log/costs.yml'), earlier(9));
+    sonnetSession('s9', 9.5);
+    const quick = await cost('quick', '--record', '--command', 'quick', '--session', 's9');
+    expect(quick.recorded).toMatchObject({ usd: 0.5, roles: { quick: 0.5 } });
+    expect(quick.total).toBe(0.5);
+  });
+
+  test('S-4.1/C1: the quick does not count what the other spec record already holds', async () => {
+    mkdirSync(join(root, 'specs/MDO-0009-y/_log'), { recursive: true });
+    writeFileSync(join(root, 'specs/MDO-0009-y/story.md'), '---\nschema_version: 1\nid: MDO-0009\n---\n# Y\n');
+    writeFileSync(join(root, 'specs/MDO-0009-y/_log/costs.yml'), earlier(9));
+    sonnetSession('s9', 9.5);
+    const quick = await cost('quick', '--record', '--command', 'quick', '--session', 's9');
+    expect(quick.recorded.usd).not.toBe(9.5);
+    expect(readFileSync(join(root, 'specs/quick/_log/costs.yml'), 'utf8')).not.toContain('usd: 9.5');
+  });
+
+  test('S-4.2: with no earlier record anywhere the quick records the whole session', async () => {
+    sonnetSession('s9', 9.5);
+    const quick = await cost('quick', '--record', '--command', 'quick', '--session', 's9');
+    expect(quick.recorded).toMatchObject({ usd: 9.5, roles: { quick: 9.5 } });
+  });
 });
 
 describe('Kaizen on cost', () => {

```
