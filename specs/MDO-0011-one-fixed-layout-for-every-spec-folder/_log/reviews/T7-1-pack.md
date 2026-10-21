# Review pack — T7, attempt 1

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T7-1.md`.

## Brief

```json
{
  "spec": "MDO-0011-one-fixed-layout-for-every-spec-folder",
  "task": {
    "project": "mandao",
    "kind": "fix",
    "tier": "fast",
    "files": [
      "src/cli/run-diagram.ts",
      "test/integration/close.test.ts"
    ],
    "exemplar": "src/cli/run-diagram.ts",
    "ac": [
      "AC-6",
      "AC-6/C1"
    ],
    "scenarios": [
      "S-6.1",
      "S-6.2",
      "S-6.2/C1"
    ],
    "test_levels": {
      "S-6.1": "e2e",
      "S-6.2": "e2e",
      "S-6.2/C1": "e2e"
    },
    "evidence": "tdd",
    "risk_tags": [],
    "depends_on": [],
    "parallel_safe": true,
    "verify": "npx vitest run test/integration/close.test.ts",
    "tests": {
      "unit": [],
      "e2e": [
        "S-6.1",
        "S-6.2",
        "S-6.2/C1"
      ]
    },
    "dod": [],
    "characterization": false,
    "id": "T7",
    "title": "Drift says \"not applicable\" for lite specs",
    "done": false,
    "line": 213
  },
  "acceptance": [
    {
      "ref": "AC-6",
      "text": "**GIVEN** a lite spec at close · **WHEN** drift is checked · **THEN** it reports \"not applicable\" and the close goes on · **AND IT MUST** keep checking drift for standard and full specs as today"
    },
    {
      "ref": "AC-6/C1",
      "text": "**AND IT MUST** keep checking drift for standard and full specs as today"
    }
  ],
  "scenarios": [
    {
      "ref": "S-6.1",
      "text": "**Given** a lite spec at close · **When** `diagram-drift` runs · **Then** it exits 0 with `applicable: false` and the reason \"lite specs have no diagram\""
    },
    {
      "ref": "S-6.2",
      "text": "**Given** a standard spec with a stamped graph, and another without one · **When** `diagram-drift` runs · **Then** the first reports its drift as today, and the second fails as today"
    },
    {
      "ref": "S-6.2/C1",
      "text": "**Then** the first reports its drift as today, and the second fails as today"
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
    "task": "T7",
    "tier": "fast",
    "attempt": 1,
    "failsAtTier": 0,
    "tdd": {
      "required": true,
      "testsBy": "implementer",
      "red": true,
      "evidence": "red"
    },
    "implementer": {
      "model": "claude-haiku-5-5"
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
      "src/cli/run-diagram.ts",
      "test/integration/close.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related src/cli/run-diagram.ts test/integration/close.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": [
      "src/cli/run-ledger.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/integration/close.test.ts",
      "test/integration/close-drift.test.ts"
    ],
    "changed": [
      "test/integration/close.test.ts"
    ]
  }
}
```

## Gates — T7, attempt 1

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
diff --git a/src/cli/run-diagram.ts b/src/cli/run-diagram.ts
index 31066ce..259bf01 100644
--- a/src/cli/run-diagram.ts
+++ b/src/cli/run-diagram.ts
@@ -4,7 +4,7 @@ import type { Command } from 'commander';
 import { readConfig } from '../engine/files.js';
 import { repoRoot, taskCommits } from '../scripts/commits.js';
 import { graphFile, isTestFile, readGraph } from '../scripts/impact.js';
-import { findSpec, readSpec } from '../scripts/spec.js';
+import { findSpec, readLayout, readSpec } from '../scripts/spec.js';
 import { docPath } from '../scripts/spec-log.js';
 import type { DiagramGraph } from '../spec/index.js';
 import {
@@ -102,6 +102,11 @@ function registerDrift(run: Command, ctx: CliContext) {
       const config = readConfig(ctx.root());
       const spec = readSpec(findSpec(ctx.root(), config, ref));
       if (!spec.story) throw new Error(`${spec.name} needs story.md`);
+      // A lite spec has no diagram to compare: report it and stamp nothing (ADR 0026, D7).
+      if (readLayout(spec.dir).depth === 'lite') {
+        json({ applicable: false, reason: 'lite specs have no diagram' });
+        return;
+      }
       const stamp = readStamp(readFileSync(docPath(spec.dir, 'design'), 'utf8'));
       if (!stamp?.graph) throw new Error('design.md has no diagram with a structured graph: stamp it with --graph in specify');
       const proposed = diagramGraphSchema.parse(JSON.parse(readFileSync(join(spec.dir, stamp.graph), 'utf8')));
diff --git a/test/integration/close.test.ts b/test/integration/close.test.ts
index de99bdf..3958e14 100644
--- a/test/integration/close.test.ts
+++ b/test/integration/close.test.ts
@@ -82,6 +82,9 @@ describe('mandao run diagram-drift', () => {
     });
     const spec = join(root, 'specs/MDO-0001-skills-list');
     cpSync(join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list'), spec, { recursive: true });
+    // The fixture's requirements.md says lite; this spec is standard, so its depth is standard in both documents.
+    const requirements = join(spec, 'requirements.md');
+    writeFileSync(requirements, readFileSync(requirements, 'utf8').replace('depth: lite', 'depth: standard'));
     mkdirSync(join(spec, 'diagrams'));
     writeFileSync(
       join(spec, 'diagrams/proposed.graph.json'),

--- /dev/null
+++ b/test/integration/close-drift.test.ts (new file)
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { makeTree } from '../helpers.js';
import { lastOut, useLogEnv } from '../log-v2-helpers.js';

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function commit(root: string, file: string, message: string, date: string) {
  writeFileSync(join(root, file), message);
  git(root, 'add', '.');
  execFileSync('git', ['commit', '-qm', message], { cwd: root, env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } });
}

describe('diagram-drift by spec depth (MDO-0011 AC-6)', () => {
  useLogEnv();
  const SPEC = 'specs/MDO-0001-skills-list';
  const CONFIG = 'schema_version: 1\nworkspace: single\nprojects: [{ name: p, path: . }]\nharnesses: [claude]\n';
  const PROPOSED = {
    schema_version: 1,
    nodes: [
      { id: 'src/cli', label: 'CLI' },
      { id: 'src/skills', label: 'Skills' },
    ],
    edges: [],
  };

  /** One committed spec: lite keeps spec.md; standard keeps an unstamped design.md and its proposed graph. */
  function specRepo(depth: 'lite' | 'standard') {
    const root = realpathSync(makeTree({ 'src/cli/run.ts': 'x', 'src/engine/sync.ts': 'y' }));
    git(root, 'init', '-q', '-b', 'main');
    mkdirSync(join(root, '.mandao'));
    writeFileSync(join(root, '.mandao/config.yml'), CONFIG);
    const spec = join(root, SPEC);
    mkdirSync(join(spec, 'diagrams'), { recursive: true });
    cpSync(join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list/story.md'), join(spec, 'story.md'));
    if (depth === 'lite') writeFileSync(join(spec, 'spec.md'), '---\ndepth: lite\n---\n\n# Spec\n');
    else {
      writeFileSync(join(spec, 'diagrams/proposed.graph.json'), JSON.stringify(PROPOSED));
      writeFileSync(join(spec, 'flow.mmd'), 'flowchart LR\n  cli --> skills');
      writeFileSync(join(spec, 'design.md'), '---\ndepth: standard\n---\n\n# Design\n');
    }
    git(root, 'add', '.');
    commit(root, 'src/cli/run.ts', '✨ feat(cli): list\n\nRefs: MDO-0001\nMandao-Task: T1', '2026-10-01T10:00:00Z');
    return root;
  }
  /** Runs one `mandao run` command and returns the exit code it set. */
  async function cli(root: string, ...args: string[]) {
    process.exitCode = undefined;
    await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
    return process.exitCode ?? 0;
  }

  test('S-6.1: a lite spec reports applicable false with the reason, exits 0, and stamps no graph', async () => {
    const root = specRepo('lite');
    expect(await cli(root, 'diagram-drift', 'MDO-0001')).toBe(0);
    expect(lastOut()).toMatchObject({ applicable: false, reason: 'lite specs have no diagram' });
    expect(existsSync(join(root, SPEC, 'diagrams/implemented.graph.json'))).toBe(false);
  });

  test('S-6.2: a standard spec with a stamped graph reports its drift as today', async () => {
    const root = specRepo('standard');
    const stamp = ['diagram', 'MDO-0001', '--stamp', '--tool', 'mermaid', '--type', 'workflow', '--graph', 'diagrams/proposed.graph.json'];
    await cli(root, ...stamp, '--mermaid', join(root, SPEC, 'flow.mmd'));
    expect(await cli(root, 'diagram-drift', 'MDO-0001')).toBe(0);
    expect(lastOut()).toMatchObject({ drift: true, missingNodes: ['src/skills'], addedNodes: ['src/engine'] });
  });

  test('S-6.2/C1: a standard spec without a stamp still fails', async () => {
    const root = specRepo('standard');
    await expect(cli(root, 'diagram-drift', 'MDO-0001')).rejects.toThrow(/no diagram with a structured graph/);
  });
});

```
