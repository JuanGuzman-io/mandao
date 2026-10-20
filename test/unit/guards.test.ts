import { describe, expect, it } from 'vitest';
import { findClimbs, withoutAllowed } from '../guards.js';

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
    const found = run("import path from 'node:path';", "const a = path.join(ws, '..');");
    expect(found).toEqual([{ line: 2, text: "path.join(ws, '..')" }]);
  });

  it('S-1.4: reports .. before a following segment', () => {
    const found = run("import { join } from 'node:path';", "const p = join(ws, '..', 'x');");
    expect(found).toEqual([{ line: 2, text: "join(ws, '..', 'x')" }]);
  });
});

describe('withoutAllowed: exceptions', () => {
  it('S-4.1: drops only the allowed call and keeps the other finding', () => {
    const found = run("import { dirname, join } from 'node:path';", 'const a = dirname(makeTree({}));', "const b = join(ws, '..');");
    const allowed = [{ file: 'snippet.test.ts', call: 'dirname(makeTree({}))', why: 'look-alike folder' }];
    expect(withoutAllowed('snippet.test.ts', found, allowed)).toEqual([{ line: 3, text: "join(ws, '..')" }]);
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
