# Review pack — T1, attempt 1

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T1-1.md`.

## Brief

```json
{
  "spec": "MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work",
  "task": {
    "project": "mandao",
    "kind": "test",
    "tier": "standard",
    "files": [
      "test/guards.ts",
      "test/unit/guards.test.ts"
    ],
    "exemplar": "test/helpers.ts",
    "ac": [
      "AC-1",
      "AC-1/C1",
      "AC-2"
    ],
    "scenarios": [
      "S-1.1",
      "S-1.2",
      "S-1.3",
      "S-1.4",
      "S-2.1",
      "S-2.2",
      "S-3.1",
      "S-3.2",
      "S-3.3"
    ],
    "test_levels": {
      "S-1.1": "unit",
      "S-1.2": "unit",
      "S-1.3": "unit",
      "S-1.4": "unit",
      "S-2.1": "unit",
      "S-2.2": "unit",
      "S-3.1": "unit",
      "S-3.2": "unit",
      "S-3.3": "unit"
    },
    "evidence": "tdd",
    "risk_tags": [],
    "depends_on": [],
    "parallel_safe": false,
    "verify": "npx vitest run test/unit/guards.test.ts",
    "tests": {
      "unit": [
        "S-1.1",
        "S-1.2",
        "S-1.3",
        "S-1.4",
        "S-2.1",
        "S-2.2",
        "S-3.1",
        "S-3.2",
        "S-3.3"
      ],
      "e2e": []
    },
    "dod": [],
    "characterization": false,
    "id": "T1",
    "title": "A detector that reports every climbing path and leaves inside paths alone",
    "done": false,
    "line": 219
  },
  "acceptance": [
    {
      "ref": "AC-1",
      "text": "**GIVEN** a test file under `test/` · **WHEN** it builds a path with `join` or `resolve` that has a `..` segment in any argument, or takes `dirname` of a `makeTree` workspace · **THEN** `npm test` fails and names the file and line of that call · **AND IT MUST** keep catching the shape the guard catches today, `join(<folder>, '..')`"
    },
    {
      "ref": "AC-1/C1",
      "text": "**AND IT MUST** keep catching the shape the guard catches today, `join(<folder>, '..')`"
    },
    {
      "ref": "AC-2",
      "text": "**GIVEN** test code that builds paths that stay inside the repository or the workspace · **WHEN** the guard runs · **THEN** it does not flag paths from `import.meta.dirname`, functions that are not from `node:path` (such as the resolver's own `resolve`), or `dirname` of a path inside a workspace · **BUT it must NOT** exempt a whole file: a deliberate exception names the single call it allows and why"
    }
  ],
  "scenarios": [
    {
      "ref": "S-1.1",
      "text": "**Given** a test file with `join(ws, 'a', '..', '..')` · **When** the guard runs · **Then** it reports that file and the call's line"
    },
    {
      "ref": "S-1.2",
      "text": "**Given** a test file with `join(ws, '../x')` or ``join(ws, `a/../..`)`` · **When** the guard runs · **Then** it reports each call with its line"
    },
    {
      "ref": "S-1.3",
      "text": "**Given** a test file with `resolve(ws, '..')`, `j(ws, '..')` after `import { join as j }`, or `path.resolve(ws, '..')` after `import * as path from 'node:path'` · **When** the guard runs · **Then** it reports each call with its line"
    },
    {
      "ref": "S-1.4",
      "text": "**Given** a test file with `join(ws, '..', 'x')` · **When** the guard runs · **Then** it reports the call with its line"
    },
    {
      "ref": "S-2.1",
      "text": "**Given** a test file with `dirname(makeTree({}))` · **When** the guard runs · **Then** it reports the call with its line"
    },
    {
      "ref": "S-2.2",
      "text": "**Given** a test file with `const ws = makeTree({})` and later `writeFileSync(join(dirname(ws), 'x'), '')` · **When** the guard runs · **Then** it reports the `dirname(ws)` call with its line"
    },
    {
      "ref": "S-3.1",
      "text": "**Given** `join(import.meta.dirname, '../fixtures/content')` and `resolve(import.meta.dirname, '..')` · **When** the guard runs · **Then** it reports nothing"
    },
    {
      "ref": "S-3.2",
      "text": "**Given** `resolve([layer])` imported from `src/resolver` · **When** the guard runs · **Then** it reports nothing"
    },
    {
      "ref": "S-3.3",
      "text": "**Given** `dirname(join(ws, 'a/b.txt'))`, and `dirname(root)` where this `root` comes from `join(makeTree({}), 'repo')` while another function of the same file declares a `root` from `makeTree` · **When** the guard runs · **Then** it reports nothing"
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
    "task": "T1",
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
      "test/guards.ts",
      "test/unit/guards.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related test/guards.ts test/unit/guards.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": []
  },
  "redTests": {
    "files": [
      "test/unit/guards.test.ts"
    ],
    "changed": [
      "test/unit/guards.test.ts"
    ]
  }
}
```

## Gates — T1, attempt 1

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
--- /dev/null
+++ b/test/guards.ts (new file)
import ts from 'typescript';

/** A call that can leave the test's own work folder. `line` is 1-based; `text` is the call's source text. */
export interface Climb {
  line: number;
  text: string;
}

const PATH_MODULES = new Set(['node:path', 'path']);

/** Builds a one-file program so the checker resolves identifiers by scope without touching the disk. */
function createChecker(file: string, source: string): { sf: ts.SourceFile; checker: ts.TypeChecker } {
  const options: ts.CompilerOptions = { noResolve: true, noLib: true, types: [], allowJs: true };
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const host = ts.createCompilerHost(options);
  host.getSourceFile = (name) => (name === file ? sf : undefined);
  host.fileExists = (name) => name === file;
  host.readFile = (name) => (name === file ? source : undefined);
  const program = ts.createProgram([file], options, host);
  return { sf, checker: program.getTypeChecker() };
}

function declarationOf(checker: ts.TypeChecker, node: ts.Node): ts.Declaration | undefined {
  return checker.getSymbolAtLocation(node)?.declarations?.[0];
}

function isPathImport(decl: ts.Node | undefined): boolean {
  let node = decl;
  while (node && !ts.isImportDeclaration(node)) node = node.parent;
  return !!node && ts.isStringLiteral(node.moduleSpecifier) && PATH_MODULES.has(node.moduleSpecifier.text);
}

/** The `node:path` function a call invokes (`join`, `dirname`, ...), or undefined when it is not from `node:path`. */
function pathFunction(checker: ts.TypeChecker, call: ts.CallExpression): string | undefined {
  const callee = call.expression;
  if (ts.isIdentifier(callee)) {
    const decl = declarationOf(checker, callee);
    if (!decl || !ts.isImportSpecifier(decl) || !isPathImport(decl)) return undefined;
    return decl.propertyName?.text ?? callee.text;
  }
  if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression)) {
    const decl = declarationOf(checker, callee.expression);
    const viaNamespace = decl && (ts.isNamespaceImport(decl) || ts.isImportClause(decl));
    return viaNamespace && isPathImport(decl) ? callee.name.text : undefined;
  }
  return undefined;
}

function hasParentSegment(arg: ts.Expression): boolean {
  if (!ts.isStringLiteralLike(arg)) return false;
  return arg.text.split(/[/\\]/).includes('..');
}

function isMetaDirname(arg: ts.Expression | undefined): boolean {
  return !!arg && arg.getText() === 'import.meta.dirname';
}

function isMakeTreeCall(node: ts.Node | undefined): boolean {
  return !!node && ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'makeTree';
}

function isTreeArgument(checker: ts.TypeChecker, arg: ts.Expression | undefined): boolean {
  if (!arg) return false;
  if (isMakeTreeCall(arg)) return true;
  if (!ts.isIdentifier(arg)) return false;
  const decl = declarationOf(checker, arg);
  return !!decl && ts.isVariableDeclaration(decl) && isMakeTreeCall(decl.initializer);
}

function isClimb(checker: ts.TypeChecker, call: ts.CallExpression): boolean {
  const fn = pathFunction(checker, call);
  if (fn === 'join' || fn === 'resolve') {
    return !isMetaDirname(call.arguments[0]) && call.arguments.some(hasParentSegment);
  }
  return fn === 'dirname' && isTreeArgument(checker, call.arguments[0]);
}

/** Reports every `node:path` call in `source` that climbs out of the test's work folder. Pure: reads only `source`. */
export function findClimbs(file: string, source: string): Climb[] {
  const { sf, checker } = createChecker(file, source);
  const found: Climb[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && isClimb(checker, node)) {
      found.push({ line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, text: node.getText(sf) });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

--- /dev/null
+++ b/test/unit/guards.test.ts (new file)
import { describe, expect, it } from 'vitest';
import { findClimbs } from '../guards.js';

/** Interpolated so the legacy regex guard in architecture.test.ts does not flag these snippets. */
const UP = '..';
const run = (...rows: string[]) => findClimbs('snippet.test.ts', rows.join('\n'));

describe('findClimbs: join and resolve with a parent segment', () => {
  it('S-1.1: reports join with a .. segment among several arguments', () => {
    const found = run("import { join } from 'node:path';", '', "const p = join(ws, 'a', '..', '..');");
    expect(found).toEqual([{ line: 3, text: "join(ws, 'a', '..', '..')" }]);
  });

  it('S-1.2: reports .. inside a longer literal and inside a template literal', () => {
    const found = run("import { join } from 'node:path';", "const a = join(ws, '../x');", 'const b = join(ws, `a/../..`);');
    expect(found).toEqual([
      { line: 2, text: "join(ws, '../x')" },
      { line: 3, text: 'join(ws, `a/../..`)' },
    ]);
  });

  it('S-1.3: reports resolve, an aliased join and a namespace call', () => {
    const found = run(
      "import { resolve } from 'node:path';",
      "import { join as j } from 'node:path';",
      "import * as path from 'node:path';",
      "const a = resolve(ws, '..');",
      "const b = j(ws, '..');",
      "const c = path.resolve(ws, '..');",
    );
    expect(found).toEqual([
      { line: 4, text: "resolve(ws, '..')" },
      { line: 5, text: "j(ws, '..')" },
      { line: 6, text: "path.resolve(ws, '..')" },
    ]);
  });

  it('S-1.3: reports a default-import call', () => {
    const call = `path.join(ws, '${UP}')`;
    const found = run("import path from 'node:path';", `const a = ${call};`);
    expect(found).toEqual([{ line: 2, text: call }]);
  });

  it('S-1.4: reports .. before a following segment', () => {
    const call = `join(ws, '${UP}', 'x')`;
    const found = run("import { join } from 'node:path';", `const p = ${call};`);
    expect(found).toEqual([{ line: 2, text: call }]);
  });
});

describe('findClimbs: dirname of a temp tree', () => {
  it('S-2.1: reports dirname of a makeTree call', () => {
    const found = run("import { dirname } from 'node:path';", 'const p = dirname(makeTree({}));');
    expect(found).toEqual([{ line: 2, text: 'dirname(makeTree({}))' }]);
  });

  it('S-2.2: reports dirname of a variable initialised with makeTree', () => {
    const found = run(
      "import { dirname, join } from 'node:path';",
      'const ws = makeTree({});',
      "writeFileSync(join(dirname(ws), 'x'), '');",
    );
    expect(found).toEqual([{ line: 3, text: 'dirname(ws)' }]);
  });
});

describe('findClimbs: paths that stay inside', () => {
  it('S-3.1: ignores a path anchored at import.meta.dirname', () => {
    const found = run(
      "import { join, resolve } from 'node:path';",
      "const a = join(import.meta.dirname, '../fixtures/content');",
      "const b = resolve(import.meta.dirname, '..');",
    );
    expect(found).toEqual([]);
  });

  it('S-3.2: ignores a resolve that is not from node:path', () => {
    const found = run("import { resolve } from '../../src/resolver/index.js';", 'resolve([layer]);');
    expect(found).toEqual([]);
  });

  it('S-3.3: ignores dirname of a file path inside the tree', () => {
    const found = run("import { dirname, join } from 'node:path';", "const d = dirname(join(ws, 'a/b.txt'));");
    expect(found).toEqual([]);
  });

  it('S-3.3: resolves a same-named variable in its own scope', () => {
    const found = run(
      "import { dirname, join } from 'node:path';",
      'function a() {',
      '  const root = makeTree({});',
      '  return root;',
      '}',
      'function b() {',
      "  const root = join(makeTree({}), 'repo');",
      '  return dirname(root);',
      '}',
    );
    expect(found).toEqual([]);
  });
});

```
