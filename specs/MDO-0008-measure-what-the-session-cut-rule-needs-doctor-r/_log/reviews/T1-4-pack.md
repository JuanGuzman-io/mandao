# Review pack — T1, attempt 4

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T1-4.md`.

## Brief

```json
{
  "spec": "MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r",
  "task": {
    "project": "mandao",
    "kind": "feat",
    "tier": "standard",
    "files": [
      "src/engine/doctor-cache.ts",
      "src/engine/doctor.ts",
      "test/unit/doctor-cache.test.ts"
    ],
    "exemplar": "src/engine/doctor-harness.ts",
    "ac": [
      "AC-1",
      "AC-1/C1",
      "AC-1/C2"
    ],
    "scenarios": [
      "S-1.1",
      "S-1.2",
      "S-1.2/C1",
      "S-1.3",
      "S-1.3/C2",
      "S-1.4",
      "S-1.5",
      "S-1.6",
      "S-1.7"
    ],
    "test_levels": {
      "S-1.1": "unit",
      "S-1.2": "unit",
      "S-1.2/C1": "unit",
      "S-1.3": "unit",
      "S-1.3/C2": "unit",
      "S-1.4": "unit",
      "S-1.5": "unit",
      "S-1.6": "unit",
      "S-1.7": "unit"
    },
    "evidence": "tdd",
    "risk_tags": [
      "input"
    ],
    "depends_on": [],
    "parallel_safe": true,
    "verify": "npx vitest run test/unit/doctor-cache.test.ts test/unit/doctor-report.test.ts",
    "tests": {
      "unit": [
        "S-1.1",
        "S-1.2",
        "S-1.2/C1",
        "S-1.3",
        "S-1.3/C2",
        "S-1.4",
        "S-1.5",
        "S-1.6",
        "S-1.7"
      ],
      "e2e": []
    },
    "dod": [],
    "characterization": false,
    "id": "T1",
    "title": "doctor reports the Claude Code prompt-cache TTL and its source",
    "done": true,
    "line": 41
  },
  "acceptance": [
    {
      "ref": "AC-1",
      "text": "**GIVEN** a workspace whose harnesses include Claude Code · **WHEN** the maintainer runs `mandao doctor` · **THEN** an info finding gives the cache duration for the main conversation and for subagents, where each comes from (environment, project or user settings, or the default when unset), and the ADR 0036 recommendation · **BUT it must NOT** write or change any Claude Code settings file · **AND IT MUST** say \"not 5m or 1h\" for a value Claude Code ignores, instead of reporting it as in effect"
    },
    {
      "ref": "AC-1/C1",
      "text": "**BUT it must NOT** write or change any Claude Code settings file"
    },
    {
      "ref": "AC-1/C2",
      "text": "**AND IT MUST** say \"not 5m or 1h\" for a value Claude Code ignores, instead of reporting it as in effect"
    }
  ],
  "scenarios": [
    {
      "ref": "S-1.1",
      "text": "**Given** none of the variables or keys of [D1](#d1) set in the environment or in the user, project or project-local settings · **When** `mandao doctor` runs · **Then** an `info` finding says both are unset and gives the default (main 1h on a Claude subscription within plan usage, 5m with usage credits, an API key or a cloud provider; subagents 5m), with the fix \"ADR 0036 recommends promptCacheTtl: 5m; Mandao never writes Claude Code settings\""
    },
    {
      "ref": "S-1.2",
      "text": "**Given** `promptCacheTtl: \"1h\"` in the user settings and `\"5m\"` in `.claude/settings.local.json`, and `subagentPromptCacheTtl` set nowhere but `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL=1h` in the environment · **When** `mandao doctor` runs · **Then** the `info` finding reports main `5m` from `.claude/settings.local.json` and subagents `1h` from the environment, following the order of [D1](#d1) · **BUT it must NOT** create, change or touch the modification time of any settings file"
    },
    {
      "ref": "S-1.2/C1",
      "text": "**BUT it must NOT** create, change or touch the modification time of any settings file"
    },
    {
      "ref": "S-1.3",
      "text": "**Given** `promptCacheTtl: \"10m\"` in the project settings and no other TTL source · **When** `mandao doctor` runs · **Then** a `warn` finding names the file and the value, and the main TTL is the default · **AND IT MUST** say the value is \"not 5m or 1h\" and ignored by Claude Code, never report `10m` as the TTL in effect"
    },
    {
      "ref": "S-1.3/C2",
      "text": "**AND IT MUST** say the value is \"not 5m or 1h\" and ignored by Claude Code, never report `10m` as the TTL in effect"
    },
    {
      "ref": "S-1.4",
      "text": "**Given** a workspace whose harnesses do not include `claude` · **When** `mandao doctor` runs · **Then** there is no cache-TTL finding"
    },
    {
      "ref": "S-1.5",
      "text": "**Given** `FORCE_PROMPT_CACHING_5M=1` and `promptCacheTtl: \"1h\"` in the user settings · **When** `mandao doctor` runs · **Then** both TTLs are `5m` from `FORCE_PROMPT_CACHING_5M`; and with only `ENABLE_PROMPT_CACHING_1H=1` and `subagentPromptCacheTtl: \"5m\"` set, main is `1h` from `ENABLE_PROMPT_CACHING_1H` and subagents `5m` from the settings key"
    },
    {
      "ref": "S-1.6",
      "text": "**Given** an agent file in `.claude/agents/` whose frontmatter sets `experimental.cacheTtl: 1h`, and no subagent variable or key · **When** `mandao doctor` runs · **Then** the finding names that agent as overriding the subagent TTL with `1h` (Claude Code 2.1.248+)"
    },
    {
      "ref": "S-1.7",
      "text": "**Given** `claude --version` reports 2.1.200 · **When** `mandao doctor` runs · **Then** the finding says this version ignores the TTL variables and keys (they need 2.1.242+) and reports the default; with no version available it says the version was not checked"
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
    "task": "T1",
    "tier": "strong",
    "attempt": 4,
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
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/shadow.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/start.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/doctor-codex.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/doctor-sdd.test.ts",
      "test/unit/model-profiles.test.ts",
      "test/unit/models.test.ts",
      "test/unit/providers.test.ts",
      "test/unit/skills-list.test.ts",
      "test/unit/tools.test.ts"
    ],
    "files": [
      "src/engine/doctor-cache.ts",
      "src/engine/doctor.ts",
      "test/unit/doctor-cache.test.ts",
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
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/shadow.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/start.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/doctor-codex.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/doctor-sdd.test.ts",
      "test/unit/model-profiles.test.ts",
      "test/unit/models.test.ts",
      "test/unit/providers.test.ts",
      "test/unit/skills-list.test.ts",
      "test/unit/tools.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related src/engine/doctor-cache.ts src/engine/doctor.ts test/unit/doctor-cache.test.ts test/integration/approve.test.ts test/integration/branching.test.ts test/integration/characterization.test.ts test/integration/cli.test.ts test/integration/close.test.ts test/integration/costs.test.ts test/integration/doctor-cli.test.ts test/integration/enforced-rules.test.ts test/integration/engine.test.ts test/integration/leader-scripts.test.ts test/integration/lite-spec.test.ts test/integration/mdo-0004-defects.test.ts test/integration/mdo-0005-defects.test.ts test/integration/mdo-0006-defects.test.ts test/integration/premise.test.ts test/integration/shadow.test.ts test/integration/spec-log.test.ts test/integration/start.test.ts test/integration/tdd.test.ts test/unit/doctor-codex.test.ts test/unit/doctor-report.test.ts test/unit/doctor-sdd.test.ts test/unit/model-profiles.test.ts test/unit/models.test.ts test/unit/providers.test.ts test/unit/skills-list.test.ts test/unit/tools.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": [
      "src/cli/output.ts",
      "src/cli/setup.ts",
      "src/engine/doctor-codex.ts",
      "src/engine/doctor-harness.ts",
      "src/engine/doctor-models.ts",
      "src/engine/doctor-opencode.ts",
      "src/engine/doctor-sdd.ts",
      "src/engine/doctor-specs.ts",
      "src/engine/tools.ts",
      "test/integration/doctor-cli.test.ts",
      "test/integration/engine.test.ts",
      "test/integration/shadow.test.ts",
      "test/unit/doctor-report.test.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/unit/doctor-cache.test.ts"
    ],
    "changed": [
      "test/unit/doctor-cache.test.ts"
    ]
  }
}
```

## Gates — T1, attempt 4

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
diff --git a/src/engine/doctor-cache.ts b/src/engine/doctor-cache.ts
index 6da75a2..e094c1a 100644
--- a/src/engine/doctor-cache.ts
+++ b/src/engine/doctor-cache.ts
@@ -1,8 +1,8 @@
 import { existsSync, readdirSync, readFileSync } from 'node:fs';
 import { join } from 'node:path';
-import matter from 'gray-matter';
 import semver from 'semver';
 import type { Finding } from './doctor.js';
+import { parseFrontmatter } from './frontmatter.js';
 import type { Probe } from './tools.js';
 
 const MIN_SETTINGS = '2.1.242';
@@ -96,7 +96,10 @@ function agentOverrides(root: string): Agent[] {
   const out: Agent[] = [];
   for (const file of files) {
     try {
-      const data = matter(readFileSync(join(dir, file), 'utf8')).data as { name?: unknown; experimental?: { cacheTtl?: unknown } };
+      const data = parseFrontmatter(readFileSync(join(dir, file), 'utf8')).data as {
+        name?: unknown;
+        experimental?: { cacheTtl?: unknown };
+      };
       const ttl = data.experimental?.cacheTtl;
       if (ttl !== undefined && ttl !== null)
         out.push({
@@ -105,7 +108,7 @@ function agentOverrides(root: string): Agent[] {
           ttl: String(ttl),
         });
     } catch {
-      // an unreadable agent file is not a TTL source
+      // an unreadable agent file, or one refused for a non-YAML fence, is not a TTL source
     }
   }
   return out.sort((a, b) => a.name.localeCompare(b.name));
diff --git a/test/unit/doctor-cache.test.ts b/test/unit/doctor-cache.test.ts
index 627b573..b1c086a 100644
--- a/test/unit/doctor-cache.test.ts
+++ b/test/unit/doctor-cache.test.ts
@@ -145,6 +145,41 @@ describe('doctor reports the prompt-cache TTL (AC-1)', () => {
     expect(info(run())?.message ?? '').not.toMatch(/overrides the subagent TTL/);
   });
 
+  // Security (input): a cloned repo must not run code when doctor reads its agent files.
+  // gray-matter evaluates `---js` front matter; the agent files must go through parseFrontmatter, which refuses it.
+  test('S-1.6 and security: a ---js agent front matter is never executed and is not an override', () => {
+    const flag = '__mdo8_agent_js_ran';
+    const marker = join(root, 'js-ran.marker');
+    const g = globalThis as Record<string, unknown>;
+    delete g[flag];
+    const js = [
+      '---js',
+      '(function () {',
+      `  globalThis.${flag} = true;`,
+      `  require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'ran');`,
+      "  return { name: 'evil', experimental: { cacheTtl: '1h' } };",
+      '})()',
+      '---',
+      'Body',
+      '',
+    ].join('\n');
+    put(join(root, '.claude/agents/evil.md'), js);
+    try {
+      let fs: Finding[] = [];
+      expect(() => {
+        fs = run();
+      }).not.toThrow();
+      expect(g[flag]).toBeUndefined();
+      expect(() => statSync(marker)).toThrow();
+      const msg = info(fs)?.message ?? '';
+      expect(msg).not.toContain('evil');
+      expect(msg).not.toMatch(/overrides the subagent TTL/);
+      expect(msg).toMatch(/subagents?[^.;]*5m/i);
+    } finally {
+      delete g[flag];
+    }
+  });
+
   test('S-1.7: an old Claude Code ignores the TTL settings, so the default is reported', () => {
     local({ promptCacheTtl: '1h' });
     const f = info(run({}, () => '2.1.200 (Claude Code)'));

```
