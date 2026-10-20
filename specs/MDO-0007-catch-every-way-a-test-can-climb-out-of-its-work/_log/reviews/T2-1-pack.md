# Review pack — T2, attempt 1

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T2-1.md`.

## Brief

```json
{
  "spec": "MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work",
  "task": {
    "project": "mandao",
    "kind": "test",
    "tier": "standard",
    "files": [
      "test/unit/architecture.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/guards.ts",
      "test/unit/guards.test.ts"
    ],
    "exemplar": "test/unit/architecture.test.ts",
    "ac": [
      "AC-2/C1",
      "AC-3",
      "AC-3/C1"
    ],
    "scenarios": [
      "S-4.1",
      "S-5.1",
      "S-5.1/C1"
    ],
    "test_levels": {
      "S-4.1": "unit",
      "S-5.1": "unit",
      "S-5.1/C1": "unit"
    },
    "evidence": "tdd",
    "risk_tags": [],
    "depends_on": [
      "T1"
    ],
    "parallel_safe": false,
    "verify": "npx vitest run test/unit/architecture.test.ts test/unit/guards.test.ts test/integration/mdo-0005-defects.test.ts test/unit/helpers.test.ts",
    "tests": {
      "unit": [
        "S-4.1",
        "S-5.1",
        "S-5.1/C1"
      ],
      "e2e": []
    },
    "dod": [],
    "characterization": false,
    "id": "T2",
    "title": "The guard runs over every test with one named exception, and the suite stays green",
    "done": false,
    "line": 244
  },
  "acceptance": [
    {
      "ref": "AC-2/C1",
      "text": "**BUT it must NOT** exempt a whole file: a deliberate exception names the single call it allows and why"
    },
    {
      "ref": "AC-3",
      "text": "**GIVEN** the tests on `main` today · **WHEN** the new guard is in place · **THEN** `npm test` passes · **BUT it must NOT** weaken, skip or remove any existing assertion"
    },
    {
      "ref": "AC-3/C1",
      "text": "**BUT it must NOT** weaken, skip or remove any existing assertion"
    }
  ],
  "scenarios": [
    {
      "ref": "S-4.1",
      "text": "**Given** an exception for `dirname(makeTree({}))` in a file that also has `join(ws, '..')` · **When** the guard runs · **Then** it reports the `join` call and not the excepted one"
    },
    {
      "ref": "S-5.1",
      "text": "**Given** the tests on `main`, where the guard finds `join(root, f, '..')` in `test/integration/mdo-0005-defects.test.ts` and `dirname(makeTree({}))` in `test/unit/helpers.test.ts` ([P3](#p3)) · **When** the first is rewritten as `dirname(join(root, f))` and the second is the one exception · **Then** the guard reports nothing and `npm test` passes · **BUT it must NOT** change, skip or remove any existing assertion"
    },
    {
      "ref": "S-5.1/C1",
      "text": "**BUT it must NOT** change, skip or remove any existing assertion"
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
  "lenses": [],
  "loop": {
    "task": "T2",
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
    "graphTests": [],
    "files": [
      "test/unit/architecture.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/guards.ts",
      "test/unit/guards.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related test/unit/architecture.test.ts test/integration/mdo-0005-defects.test.ts test/guards.ts test/unit/guards.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": []
  },
  "redTests": {
    "files": [
      "test/unit/architecture.test.ts",
      "test/unit/guards.test.ts"
    ],
    "changed": [
      "test/unit/architecture.test.ts",
      "test/unit/guards.test.ts"
    ]
  }
}
```

## Gates — T2, attempt 1

Every configured gate passed.

| Gate | Status | Exit |
|---|---|---|
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
diff --git a/test/guards.ts b/test/guards.ts
index d21f46c..262f4ac 100644
--- a/test/guards.ts
+++ b/test/guards.ts
@@ -75,6 +75,18 @@ function isClimb(checker: ts.TypeChecker, call: ts.CallExpression): boolean {
   return fn === 'dirname' && isTreeArgument(checker, call.arguments[0]);
 }
 
+/** A justified exception: this exact call, in this file, may climb out of the work folder. */
+export interface Allowed {
+  file: string;
+  call: string;
+  why: string;
+}
+
+/** Drops only the findings whose file and exact call text match an entry; everything else stays reported. */
+export function withoutAllowed(file: string, found: Climb[], allowed: Allowed[]): Climb[] {
+  return found.filter((c) => !allowed.some((a) => a.file === file && a.call === c.text));
+}
+
 /** Reports every `node:path` call in `source` that climbs out of the test's work folder. Pure: reads only `source`. */
 export function findClimbs(file: string, source: string): Climb[] {
   const { sf, checker } = createChecker(file, source);
diff --git a/test/integration/mdo-0005-defects.test.ts b/test/integration/mdo-0005-defects.test.ts
index fcd01ca..137c731 100644
--- a/test/integration/mdo-0005-defects.test.ts
+++ b/test/integration/mdo-0005-defects.test.ts
@@ -1,6 +1,6 @@
 import { execFileSync } from 'node:child_process';
 import { cpSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
-import { join } from 'node:path';
+import { dirname, join } from 'node:path';
 import type { Command } from 'commander';
 import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
 import { buildProgram } from '../../src/cli/program.js';
@@ -263,7 +263,7 @@ describe('#4 and #6: commit-spec has fixed subjects, and close commits its docum
       'src/AGENTS.md': 'guide\n',
       'src/unrelated.ts': 'export {};\n',
     })) {
-      mkdirSync(join(root, f, '..'), { recursive: true });
+      mkdirSync(dirname(join(root, f)), { recursive: true });
       writeFileSync(join(root, f), c);
     }
     writeFileSync(join(root, SPEC, 'close-summary.md'), 'closed\n');
diff --git a/test/unit/architecture.test.ts b/test/unit/architecture.test.ts
index 2229565..b62155c 100644
--- a/test/unit/architecture.test.ts
+++ b/test/unit/architecture.test.ts
@@ -1,6 +1,7 @@
 import { readdirSync, readFileSync } from 'node:fs';
 import { join, relative } from 'node:path';
 import { expect, test } from 'vitest';
+import { findClimbs, withoutAllowed } from '../guards.js';
 
 const files = (dir: string): string[] =>
   readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));
@@ -29,12 +30,23 @@ test('only test/helpers.ts creates temporary folders', () => {
   expect(offenders).toEqual([]);
 });
 
-/** MDO-0006 D4: a file must not write next to a workspace through join(<folder>, '..', …), it leaks outside makeTree. */
-test('no test climbs out of a folder with join(<folder>, "..")', () => {
+/**
+ * MDO-0007 D4/D5: no test calls a node:path function that climbs out of its work folder (join/resolve with a
+ * '..' segment, dirname of a makeTree folder). A finding is excused only by an exact { file, call } entry.
+ */
+test('no test climbs out of its work folder', () => {
   const root = join(import.meta.dirname, '../..');
+  const ALLOWED = [
+    {
+      file: 'test/unit/helpers.test.ts',
+      call: 'dirname(makeTree({}))',
+      // MDO-0006 S-2.1 needs a look-alike folder next to a workspace and removes it in its own finally.
+      why: 'look-alike folder next to a workspace, removed in the same test',
+    },
+  ];
   const offenders = files(join(root, 'test'))
+    .filter((f) => f.endsWith('.ts'))
     .map((f) => relative(root, f))
-    .filter((f) => f !== 'test/unit/architecture.test.ts')
-    .filter((f) => /\bjoin\((?!import\.meta\.dirname\b)[^,()]+,\s*['"`]\.\.['"`]/.test(readFileSync(join(root, f), 'utf8')));
+    .flatMap((f) => withoutAllowed(f, findClimbs(f, readFileSync(join(root, f), 'utf8')), ALLOWED).map((c) => `${f}:${c.line} ${c.text}`));
   expect(offenders).toEqual([]);
 });
diff --git a/test/unit/guards.test.ts b/test/unit/guards.test.ts
index 43cb63e..1dc4fa5 100644
--- a/test/unit/guards.test.ts
+++ b/test/unit/guards.test.ts
@@ -1,8 +1,6 @@
 import { describe, expect, it } from 'vitest';
-import { findClimbs } from '../guards.js';
+import { findClimbs, withoutAllowed } from '../guards.js';
 
-/** Interpolated so the legacy regex guard in architecture.test.ts does not flag these snippets. */
-const UP = '..';
 const run = (...rows: string[]) => findClimbs('snippet.test.ts', rows.join('\n'));
 
 describe('findClimbs: join and resolve with a parent segment', () => {
@@ -36,15 +34,21 @@ describe('findClimbs: join and resolve with a parent segment', () => {
   });
 
   it('S-1.3: reports a default-import call', () => {
-    const call = `path.join(ws, '${UP}')`;
-    const found = run("import path from 'node:path';", `const a = ${call};`);
-    expect(found).toEqual([{ line: 2, text: call }]);
+    const found = run("import path from 'node:path';", "const a = path.join(ws, '..');");
+    expect(found).toEqual([{ line: 2, text: "path.join(ws, '..')" }]);
   });
 
   it('S-1.4: reports .. before a following segment', () => {
-    const call = `join(ws, '${UP}', 'x')`;
-    const found = run("import { join } from 'node:path';", `const p = ${call};`);
-    expect(found).toEqual([{ line: 2, text: call }]);
+    const found = run("import { join } from 'node:path';", "const p = join(ws, '..', 'x');");
+    expect(found).toEqual([{ line: 2, text: "join(ws, '..', 'x')" }]);
+  });
+});
+
+describe('withoutAllowed: exceptions', () => {
+  it('S-4.1: drops only the allowed call and keeps the other finding', () => {
+    const found = run("import { dirname, join } from 'node:path';", 'const a = dirname(makeTree({}));', "const b = join(ws, '..');");
+    const allowed = [{ file: 'snippet.test.ts', call: 'dirname(makeTree({}))', why: 'look-alike folder' }];
+    expect(withoutAllowed('snippet.test.ts', found, allowed)).toEqual([{ line: 3, text: "join(ws, '..')" }]);
   });
 });
 

```
