import { existsSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';

export type Runner = 'vitest' | 'jest' | 'nx' | 'pytest' | 'go';

/** Native related-test selection per runner. `{files}` and `{workers}` are filled in later. */
export const RUNNER_COMMANDS: Record<Runner, { related: string; module: string }> = {
  vitest: { related: 'npx vitest related {files} --run --maxWorkers={workers}', module: 'npx vitest run {files} --maxWorkers={workers}' },
  jest: { related: 'npx jest --findRelatedTests {files} --maxWorkers={workers}', module: 'npx jest {files} --maxWorkers={workers}' },
  nx: { related: 'npx nx affected -t test --parallel={workers}', module: 'npx nx affected -t test --parallel={workers}' },
  pytest: { related: 'pytest {files}', module: 'pytest {files}' },
  go: { related: 'go test -p {workers} {files}', module: 'go test -p {workers} {files}' },
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
}): ImpactSelection {
  const { changed, projectPath, configured, runner, graph } = input;
  const rel = (f: string) => (projectPath === '.' ? f : posix.relative(projectPath, f));
  const inProject = changed.filter((f) => projectPath === '.' || f.startsWith(`${projectPath}/`));
  const graphTests = graph ? reverseDependents(graph, inProject).filter(isTestFile) : [];
  const directTests = inProject.filter(isTestFile);
  const tests = [...new Set([...directTests, ...graphTests])].map(rel);
  const notes = graph ? [] : ['no code graph: reverse dependents not used'];
  if (configured)
    return {
      source: 'configured',
      graphTests,
      files: tests.length ? tests : inProject.map(rel),
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
  // Uncertain impact: the touched modules (their folders), never the whole suite.
  const modules = [...new Set(inProject.map((f) => posix.dirname(rel(f))))].map((d) => (runner === 'go' ? `./${d}/...` : d));
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
