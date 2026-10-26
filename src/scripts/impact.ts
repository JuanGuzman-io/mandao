import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';

export type Runner = 'vitest' | 'jest' | 'nx' | 'pytest' | 'go' | 'node';

/** Native related-test selection per runner. `{files}` and `{workers}` are filled in later. */
export const RUNNER_COMMANDS: Record<Runner, { related: string; module: string }> = {
  vitest: { related: 'npx vitest related {files} --run --maxWorkers={workers}', module: 'npx vitest run {files} --maxWorkers={workers}' },
  jest: { related: 'npx jest --findRelatedTests {files} --maxWorkers={workers}', module: 'npx jest {files} --maxWorkers={workers}' },
  nx: { related: 'npx nx affected -t test --parallel={workers}', module: 'npx nx affected -t test --parallel={workers}' },
  pytest: { related: 'pytest {files}', module: 'pytest {files}' },
  go: { related: 'go test -p {workers} {files}', module: 'go test -p {workers} {files}' },
  // Node's built-in runner takes test files, not folders (Node 22 fails on a directory argument).
  node: { related: 'node --test --test-concurrency={workers} {files}', module: 'node --test --test-concurrency={workers} {files}' },
};

/** Detects the project's test runner from its manifests. */
export function detectRunner(projectDir: string): Runner | undefined {
  const pkgFile = join(projectDir, 'package.json');
  if (existsSync(pkgFile)) {
    const pkg = JSON.parse(readFileSync(pkgFile, 'utf8')) as Record<string, Record<string, string> | undefined>;
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (existsSync(join(projectDir, 'nx.json'))) return 'nx';
    if ('vitest' in deps) return 'vitest';
    if ('jest' in deps) return 'jest';
    const scripts = pkg.scripts as Record<string, string> | undefined;
    if (/(?:^|[\s;&|])node\s+(?:--[\w-]+(?:=\S+)?\s+)*--test(?=\s|$)/.test(scripts?.test ?? '')) return 'node';
  }
  if (existsSync(join(projectDir, 'go.mod'))) return 'go';
  if (['pytest.ini', 'pyproject.toml', 'setup.cfg', 'conftest.py'].some((f) => existsSync(join(projectDir, f)))) return 'pytest';
  return undefined;
}

export const isTestFile = (path: string) =>
  /(^|\/)(__tests__|tests?)\//.test(path) ||
  /\.(test|spec)\.[cm]?[jt]sx?$/.test(path) ||
  /(^|\/)test_[^/]+\.py$/.test(path) ||
  /_test\.(go|py)$/.test(path);

export interface Scanner {
  test: string;
  /** Path prefixes the test reads, relative to the repository root (`test/`, `src/`). */
  paths: string[];
}

const SCANS = /mandao-scans:\s*([^\n*]+)/;

/**
 * Tests that declare `mandao-scans: <paths>` in a comment: architecture guards and the like, which read
 * files by path, so the code graph never links them to what they check (MDO-0007).
 */
export function findScanners(repo: string, projectPath: string): Scanner[] {
  let files: string[];
  try {
    files = execFileSync('git', ['ls-files', '--', projectPath === '.' ? '.' : projectPath], { cwd: repo, encoding: 'utf8' })
      .split('\n')
      .filter((f) => f && isTestFile(f));
  } catch {
    return [];
  }
  return files.flatMap((test) => {
    const m = SCANS.exec(readFileSync(join(repo, test), 'utf8'));
    const paths = m
      ? m[1]!
          .trim()
          .split(/\s+/)
          .filter((t) => t.includes('/') && /^[\w./-]+$/.test(t))
      : [];
    return paths.length ? [{ test, paths }] : [];
  });
}

/** Calls that list or glob folders: a test making them reads the tree by path (JS, Python, Go). */
const LISTS_FOLDERS =
  /\b(?:readdirSync|readdir|opendirSync|opendir|globSync|glob|fastGlob|fg|walk|listdir|scandir|iglob|rglob|ReadDir|WalkDir|Walk)\s*\(/;

/**
 * Changed test files that list or glob folders but carry no `mandao-scans:` marker, so impact selection
 * cannot know what they read (MDO-0007). `mandao-scans: none` says the test lists only its own temp folders.
 */
export function unmarkedScanners(repo: string, files: string[]): { file: string; line: number }[] {
  return files.flatMap((file) => {
    const full = join(repo, file);
    if (!isTestFile(file) || !existsSync(full)) return [];
    const text = readFileSync(full, 'utf8');
    if (SCANS.test(text)) return [];
    const line = text.split('\n').findIndex((l) => LISTS_FOLDERS.test(l));
    return line < 0 ? [] : [{ file, line: line + 1 }];
  });
}

/** File-level dependency edges from graphify's graph.json (imports, calls, re-exports…). */
export interface FileGraph {
  /** file → files that depend on it */
  dependents: Map<string, Set<string>>;
}

const DEP_RELATIONS = new Set(['imports', 'imports_from', 'calls', 're_exports', 'extends', 'indirect_call']);

export function readGraph(file: string): FileGraph | undefined {
  if (!existsSync(file)) return undefined;
  const g = JSON.parse(readFileSync(file, 'utf8')) as {
    nodes: { id: string; source_file?: string }[];
    links?: { source: string; target: string; relation?: string }[];
  };
  const fileOf = new Map(g.nodes.map((n) => [n.id, n.source_file]));
  const dependents = new Map<string, Set<string>>();
  for (const l of g.links ?? []) {
    if (!l.relation || !DEP_RELATIONS.has(l.relation)) continue;
    const from = fileOf.get(l.source);
    const to = fileOf.get(l.target);
    if (!from || !to || from === to) continue;
    if (!dependents.has(to)) dependents.set(to, new Set());
    dependents.get(to)!.add(from);
  }
  return { dependents };
}

/** Files that depend on `files`, transitively up to `depth` hops. */
export function reverseDependents(graph: FileGraph, files: string[], depth = 3): string[] {
  const seen = new Set(files);
  let frontier = files;
  for (let i = 0; i < depth && frontier.length; i++) {
    frontier = frontier.flatMap((f) => [...(graph.dependents.get(f) ?? [])]).filter((f) => !seen.has(f));
    for (const f of frontier) seen.add(f);
  }
  return [...seen].filter((f) => !files.includes(f)).sort();
}

export interface ImpactSelection {
  /** configured: projects[].tests.impacted · runner: native selection · module: the touched modules' folders */
  source: 'configured' | 'runner' | 'module';
  runner?: Runner;
  /** Test files found through the graph, when there is one. */
  graphTests: string[];
  /** What `{files}` is replaced with. */
  files: string[];
  /** Command template with `{workers}` still to fill. */
  command?: string;
  confidence: 'high' | 'medium' | 'low';
  notes: string[];
}

/**
 * Unit tests to run for a change (ADR 0013): the configured command wins; otherwise the runner's native
 * related-test selection plus graph reverse dependents; when impact is uncertain, the touched modules'
 * tests — never the full suite.
 */
export function selectImpact(input: {
  changed: string[];
  projectPath: string;
  configured?: string;
  runner?: Runner;
  graph?: FileGraph;
  /** Tests that read the tree by path, with what they scan (a `mandao-scans:` comment): no import links them. */
  scanners?: Scanner[];
}): ImpactSelection {
  const { changed, projectPath, configured, runner, graph } = input;
  const rel = (f: string) => (projectPath === '.' ? f : posix.relative(projectPath, f));
  const inProject = changed.filter((f) => projectPath === '.' || f.startsWith(`${projectPath}/`));
  const graphTests = graph ? reverseDependents(graph, inProject).filter(isTestFile) : [];
  const directTests = inProject.filter(isTestFile);
  const scanTests = (input.scanners ?? []).filter((s) => inProject.some((f) => s.paths.some((p) => f.startsWith(p)))).map((s) => s.test);
  const tests = runnable([...new Set([...directTests, ...graphTests, ...scanTests])].map(rel), runner);
  const notes = graph ? [] : ['no code graph: reverse dependents not used'];
  if (configured)
    return {
      source: 'configured',
      graphTests,
      files: tests.length ? tests : withoutTests(inProject.map(rel), runner),
      command: configured,
      confidence: 'high',
      notes,
    };
  if (runner && (runner === 'vitest' || runner === 'jest' || runner === 'nx')) {
    return {
      source: 'runner',
      runner,
      graphTests,
      files: [...new Set([...inProject.map(rel), ...tests])],
      command: RUNNER_COMMANDS[runner].related,
      confidence: graph ? 'high' : 'medium',
      notes,
    };
  }
  if (runner && tests.length)
    return { source: 'runner', runner, graphTests, files: tests, command: RUNNER_COMMANDS[runner].related, confidence: 'medium', notes };
  return uncertainImpact(runner, inProject.map(rel), graphTests, notes);
}

/** pytest takes test modules: a fixture or conftest under tests/ given as an argument collects nothing (exit 4). */
const runnable = (tests: string[], runner: Runner | undefined) =>
  runner === 'pytest' ? tests.filter((f) => PYTEST_MODULE.test(f)) : tests;

/** What a configured command runs when no test was selected: the touched files, or their tests folders for pytest. */
const withoutTests = (files: string[], runner: Runner | undefined) => (runner === 'pytest' ? modulesOf(files, runner) : files);

const PYTEST_MODULE = /(^|\/)(test_[^/]*|[^/]*_test)\.py$/;

/** The folders to run for touched files; for pytest a file inside a tests folder runs that whole tests folder. */
function modulesOf(files: string[], runner: Runner | undefined): string[] {
  const folder = (f: string) => (runner === 'pytest' ? (f.match(/^(.*?(?:^|\/)tests?)\//)?.[1] ?? posix.dirname(f)) : posix.dirname(f));
  return [...new Set(files.map(folder))].map((d) => (runner === 'go' ? `./${d}/...` : d));
}

/** Uncertain impact: the touched modules (their folders), never the whole suite; Node's runner takes no folders. */
function uncertainImpact(runner: Runner | undefined, files: string[], graphTests: string[], notes: string[]): ImpactSelection {
  if (runner === 'node')
    return {
      source: 'module',
      graphTests,
      files: [],
      confidence: 'low',
      notes: [...notes, 'impact uncertain and node --test takes files, not folders: configure projects[].tests.impacted'],
    };
  const modules = modulesOf(files, runner);
  return {
    source: 'module',
    ...(runner ? { runner, command: RUNNER_COMMANDS[runner].module } : {}),
    graphTests,
    files: modules,
    confidence: 'low',
    notes: [
      ...notes,
      runner ? 'impact uncertain: running the touched modules' : 'no test runner detected and no projects[].tests.impacted configured',
    ],
  };
}

/** Fills `{files}` and `{workers}` in a command template. */
export function fillCommand(template: string, files: string[], workers: number): string {
  return template
    .replace('{files}', files.map((f) => (/\s/.test(f) ? JSON.stringify(f) : f)).join(' '))
    .replace(/\{workers\}/g, String(workers));
}

export const graphFile = (root: string) => join(root, 'graphify-out', 'graph.json');
export const projectDir = (root: string, path: string) => (path === '.' ? root : join(root, path));
