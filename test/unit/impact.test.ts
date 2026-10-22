import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  detectRunner,
  fillCommand,
  findScanners,
  isTestFile,
  readGraph,
  reverseDependents,
  selectImpact,
  unmarkedScanners,
} from '../../src/scripts/impact.js';
import { decideBudget, effectiveResources } from '../../src/scripts/resources.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

const graph = {
  dependents: new Map([
    ['src/a.ts', new Set(['src/b.ts'])],
    ['src/b.ts', new Set(['test/b.test.ts', 'src/c.ts'])],
  ]),
};

describe('impact', () => {
  test('reverse dependents follow the graph transitively', () => {
    expect(reverseDependents(graph, ['src/a.ts'])).toEqual(['src/b.ts', 'src/c.ts', 'test/b.test.ts']);
    expect(reverseDependents(graph, ['src/a.ts'], 1)).toEqual(['src/b.ts']);
  });

  test('a configured command wins over detection', () => {
    expect(
      selectImpact({ changed: ['src/a.ts'], projectPath: '.', configured: 'make t FILES={files}', runner: 'vitest', graph }),
    ).toMatchObject({
      source: 'configured',
      files: ['test/b.test.ts'],
      command: 'make t FILES={files}',
    });
  });

  test('vitest uses native related selection plus graph tests', () => {
    expect(selectImpact({ changed: ['src/a.ts'], projectPath: '.', runner: 'vitest', graph })).toMatchObject({
      source: 'runner',
      files: ['src/a.ts', 'test/b.test.ts'],
      confidence: 'high',
    });
  });

  test('uncertain impact runs the touched modules, never the whole suite', () => {
    const s = selectImpact({ changed: ['pkg/svc/handler.go'], projectPath: '.', runner: 'go' });
    expect(s).toMatchObject({ source: 'module', files: ['./pkg/svc/...'], confidence: 'low' });
    expect(fillCommand(s.command!, s.files, 3)).toBe('go test -p 3 ./pkg/svc/...');
  });

  test('only files inside the project count, relative to it', () => {
    expect(selectImpact({ changed: ['apps/web/src/x.ts', 'apps/api/y.ts'], projectPath: 'apps/web', runner: 'jest' }).files).toEqual([
      'src/x.ts',
    ]);
  });

  test('runner detection and test file patterns', () => {
    expect(detectRunner(makeTree({ 'package.json': JSON.stringify({ devDependencies: { vitest: '5' } }) }))).toBe('vitest');
    expect(detectRunner(makeTree({ 'package.json': pkg('x'), 'nx.json': '{}' }))).toBe('nx');
    expect(detectRunner(makeTree({ 'go.mod': 'module x' }))).toBe('go');
    expect(detectRunner(makeTree({ 'pyproject.toml': '' }))).toBe('pytest');
    expect(['a.test.ts', 'tests/x.py', 'test_x.py', 'x_test.go', 'src/a.ts'].map(isTestFile)).toEqual([true, true, true, true, false]);
  });

  test('MDO-0007: a test that scans the tree by path runs when a file it scans changes, with no import linking them', () => {
    const repo = join(import.meta.dirname, '../..');
    const scanners = findScanners(repo, '.');
    expect(scanners).toContainEqual({ test: 'test/unit/architecture.test.ts', paths: ['src/', 'test/'] });
    // T1 of MDO-0007 changed only guards.test.ts; the gates ran it alone and skipped the architecture guard.
    const changed = ['test/unit/guards.test.ts'];
    expect(selectImpact({ changed, projectPath: '.', runner: 'vitest', graph }).files).not.toContain('test/unit/architecture.test.ts');
    expect(selectImpact({ changed, projectPath: '.', runner: 'vitest', graph, scanners }).files).toContain(
      'test/unit/architecture.test.ts',
    );
    expect(selectImpact({ changed: ['docs/x.md'], projectPath: '.', runner: 'vitest', graph, scanners }).files).not.toContain(
      'test/unit/architecture.test.ts',
    );
  });

  test('the scan marker keeps only path-like words, and only tracked test files count', () => {
    const root = makeTree({
      'test/a.test.ts': '// mandao-scans: src/ lib/x — reads them by path\n',
      'test/b.test.ts': '// mandao-scans: nothing here\n',
      'test/c.test.ts': '// mandao-scans: src/\n',
    });
    initTestRepo(root, '-q');
    execFileSync('git', ['add', 'test/a.test.ts', 'test/b.test.ts'], { cwd: root });
    expect(findScanners(root, '.')).toEqual([{ test: 'test/a.test.ts', paths: ['src/', 'lib/x'] }]);
    expect(findScanners(join(root, 'not-a-repo'), '.')).toEqual([]);
  });

  test('a changed test that lists folders without a mandao-scans marker is flagged', () => {
    const root = makeTree({
      'test/a.test.ts': "const files = readdirSync(join(root, 'src'));\n",
      'test/b.test.ts': '// mandao-scans: src/\nreaddirSync(src);\n',
      'test/c.test.ts': '// mandao-scans: none\nreaddirSync(tmp);\n',
      'tests/test_d.py': 'import os\nfor f in os.listdir("pkg"):\n  pass\n',
      'test/e.test.ts': "readFileSync('x.json');\n",
      'src/f.ts': 'readdirSync(src);\n',
    });
    const changed = [
      'test/a.test.ts',
      'test/b.test.ts',
      'test/c.test.ts',
      'tests/test_d.py',
      'test/e.test.ts',
      'src/f.ts',
      'test/gone.test.ts',
    ];
    expect(unmarkedScanners(root, changed)).toEqual([
      { file: 'test/a.test.ts', line: 1 },
      { file: 'tests/test_d.py', line: 2 },
    ]);
  });

  test('every test in Mandao that lists folders says what it scans', () => {
    const repo = join(import.meta.dirname, '../..');
    const tests = execFileSync('git', ['ls-files', 'test'], { cwd: repo, encoding: 'utf8' }).split('\n').filter(Boolean);
    expect(unmarkedScanners(repo, tests)).toEqual([]);
  });

  test('graphify edges become file dependencies', () => {
    const root = makeTree({});
    writeFileSync(
      join(root, 'graph.json'),
      JSON.stringify({
        nodes: [
          { id: 'a', source_file: 'src/a.ts' },
          { id: 'b', source_file: 'src/b.ts' },
        ],
        links: [
          { source: 'b', target: 'a', relation: 'imports' },
          { source: 'a', target: 'b', relation: 'contains' },
        ],
      }),
    );
    expect([...(readGraph(join(root, 'graph.json'))?.dependents.get('src/a.ts') ?? [])]).toEqual(['src/b.ts']);
  });
});

describe('decideBudget', () => {
  const probe = (over = {}) => ({ cores: 8, freeMemoryMb: 8000, load1: 0.5, ...over });

  test('half the cores by default', () => {
    expect(decideBudget(probe(), {}, 'unit')).toMatchObject({ decision: 'run', workers: 4, priority: 'low' });
  });

  test('busy machines get fewer workers', () => {
    expect(decideBudget(probe({ load1: 6.2 }), {}, 'unit')).toMatchObject({ decision: 'reduce', workers: 1 });
  });

  test('low memory reduces to one worker, very low defers to CI', () => {
    expect(decideBudget(probe({ freeMemoryMb: 1500 }), {}, 'unit')).toMatchObject({ decision: 'reduce', workers: 1 });
    expect(decideBudget(probe({ freeMemoryMb: 800 }), {}, 'unit')).toMatchObject({ decision: 'defer', workers: 0 });
  });

  test('each operation has its own memory floor; a project overrides one operation only (ADR 0024)', () => {
    const at = (mb: number, kind: 'build' | 'unit' | 'e2e', r = {}) => decideBudget(probe({ freeMemoryMb: mb }), r, kind).decision;
    expect([at(1500, 'build'), at(1500, 'unit'), at(1500, 'e2e')]).toEqual(['run', 'reduce', 'defer']);
    expect(at(1500, 'unit', { min_free_memory_mb: 1000 })).toBe('run');
    const ws = { operations: { build: { min_free_memory_mb: 4000 }, e2e: { min_free_memory_mb: 1000 } } };
    const project = { operations: { build: { min_free_memory_mb: 512 } } };
    const merged = effectiveResources(ws, project);
    expect(merged.operations).toEqual({ build: { min_free_memory_mb: 512 }, tests: {}, e2e: { min_free_memory_mb: 1000 } });
    expect([at(1500, 'build', merged), at(1500, 'e2e', merged)]).toEqual(['run', 'run']);
  });

  test('e2e uses e2e_workers; explicit max_workers is honoured', () => {
    expect(decideBudget(probe(), { e2e_workers: 2 }, 'e2e').workers).toBe(2);
    expect(decideBudget(probe(), { max_workers: 3 }, 'unit').workers).toBe(3);
  });
});
