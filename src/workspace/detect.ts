import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, posix } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { LOCAL_REPO, type Profile, type WorkspaceMode } from '../schemas/index.js';

export interface DetectedProject {
  name: string;
  path: string;
  /** Undefined when nothing in the project points to a profile; `init` then applies the workspace default. */
  profile?: Profile;
  /** What decided `profile`, shown by `init` (e.g. `openai in pyproject.toml`). */
  evidence?: string;
  /** Polyrepo: the child repository's origin URL, or `local` when it has no remote. */
  repo?: string;
}

export interface DetectedWorkspace {
  mode: WorkspaceMode;
  /** True when the workspace root itself is a git repository. */
  rootIsRepo: boolean;
  /** Which signal decided the mode, for display in `init` and `doctor`. */
  reason: string;
  projects: DetectedProject[];
}

export const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  'target',
  'vendor',
  '.venv',
  'venv',
  '__pycache__',
  'coverage',
]);

const MANIFESTS = [
  'package.json',
  'pyproject.toml',
  'requirements.txt',
  'go.mod',
  'Cargo.toml',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'pubspec.yaml',
  'composer.json',
  'Gemfile',
];

const AI_MARKERS = [
  'openai',
  '@anthropic-ai/sdk',
  'anthropic',
  'langchain',
  '@langchain/core',
  'langgraph',
  'llama-index',
  'llamaindex',
  'ai',
  '@ai-sdk/',
  'transformers',
  'sentence-transformers',
  'chromadb',
  'pinecone',
  'qdrant-client',
  'litellm',
  'dspy',
];
const DATA_MARKERS = ['dbt-core', 'apache-airflow', 'dagster', 'prefect', 'pyspark', 'great-expectations', 'polars'];

export const isRepo = (dir: string) => existsSync(join(dir, '.git'));

/** Reads `remote "origin"` from `.git/config` without spawning git. */
export function originUrl(dir: string): string {
  try {
    const cfg = readFileSync(join(dir, '.git', 'config'), 'utf8');
    const section = cfg.split(/^\[/m).find((s) => s.startsWith('remote "origin"]'));
    return section?.match(/^\s*url\s*=\s*(.+)$/m)?.[1]?.trim() ?? LOCAL_REPO;
  } catch {
    return LOCAL_REPO;
  }
}

const isDir = (p: string) => {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
};

const childDirs = (dir: string) =>
  readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !IGNORED_DIRS.has(d.name) && !d.name.startsWith('.'))
    .map((d) => d.name)
    .sort();

const hasManifest = (dir: string) => MANIFESTS.some((m) => existsSync(join(dir, m)));

function readJson(file: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

export function toProjectName(raw: string): string {
  const name = raw
    .replace(/^@[^/]+\//, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return name || 'app';
}

/** Dependency names declared in the manifests of `dir`, lower-cased. Best effort. */
function packageDependencies(dir: string): string[] {
  const pkg = readJson(join(dir, 'package.json'));
  if (!pkg) return [];
  return ['dependencies', 'devDependencies', 'peerDependencies'].flatMap((key) => {
    const deps = pkg[key];
    return deps && typeof deps === 'object' ? Object.keys(deps) : [];
  });
}

function pyprojectDependencies(dir: string): string[] {
  const file = join(dir, 'pyproject.toml');
  if (!existsSync(file)) return [];
  const text = readFileSync(file, 'utf8');
  return [
    // PEP 621 / Poetry: quoted requirement strings such as "fastapi>=0.1" or "pkg[extra]".
    ...[...text.matchAll(/"([A-Za-z0-9_.-]+)(?:\[[^\]]*\])?\s*(?:[<>=~!;][^"]*)?"/g)].map((m) => m[1]!),
    // Poetry tables: `name = "^1.0"`.
    ...[...text.matchAll(/^([A-Za-z0-9_.-]+)\s*=\s*["{]/gm)].map((m) => m[1]!),
  ];
}

function requirementsDependencies(dir: string): string[] {
  const file = join(dir, 'requirements.txt');
  if (!existsSync(file)) return [];
  return [...readFileSync(file, 'utf8').matchAll(/^\s*([A-Za-z0-9_.-]+)/gm)].map((m) => m[1]!);
}

/** Declared dependency names with the manifest that declares each one (`package.json`, `pyproject.toml`, `requirements.txt`). */
function dependencySources(dir: string): [name: string, file: string][] {
  const sources: [string, string[]][] = [
    ['package.json', packageDependencies(dir)],
    ['pyproject.toml', pyprojectDependencies(dir)],
    ['requirements.txt', requirementsDependencies(dir)],
  ];
  return sources.flatMap(([file, names]) => names.map((n): [string, string] => [n.toLowerCase(), file]));
}

export function dependencyNames(dir: string): string[] {
  return dependencySources(dir).map(([n]) => n);
}

/** The profile the project points to and why (`openai in pyproject.toml`), or undefined when nothing does. */
export function profileEvidence(dir: string): { profile: Profile; evidence: string } | undefined {
  if (existsSync(join(dir, 'dbt_project.yml'))) return { profile: 'data', evidence: 'dbt_project.yml' };
  const deps = dependencySources(dir);
  const hit = (markers: string[]) => deps.find(([d]) => markers.some((m) => (m.endsWith('/') ? d.startsWith(m) : d === m)));
  const ai = hit(AI_MARKERS);
  if (ai) return { profile: 'ai', evidence: `${ai[0]} in ${ai[1]}` };
  const data = hit(DATA_MARKERS);
  if (data) return { profile: 'data', evidence: `${data[0]} in ${data[1]}` };
  const manifest = MANIFESTS.find((m) => existsSync(join(dir, m)));
  return manifest ? { profile: 'app', evidence: manifest } : undefined;
}

function rootName(root: string): string {
  const pkg = readJson(join(root, 'package.json'));
  return toProjectName(typeof pkg?.name === 'string' ? pkg.name : basename(root));
}

/** Expands workspace globs. Supports literal paths and a trailing `/*` or `/**`, which covers real-world configs. */
export function expandWorkspaceGlobs(root: string, patterns: string[]): string[] {
  const out = new Set<string>();
  for (const raw of patterns) {
    if (raw.startsWith('!')) continue;
    const pattern = raw.replace(/^\.\//, '').replace(/\/$/, '');
    const star = pattern.match(/^(.*?)\/\*\*?$/);
    if (star) {
      const base = star[1] ?? '';
      if (!isDir(join(root, base))) continue;
      for (const child of childDirs(join(root, base))) {
        const rel = posix.join(base, child);
        if (hasManifest(join(root, rel))) out.add(rel);
      }
    } else if (!pattern.includes('*') && isDir(join(root, pattern))) {
      out.add(pattern);
    }
  }
  return [...out].sort();
}

function declaredWorkspaces(root: string): { patterns: string[]; source: string } | undefined {
  const pnpm = join(root, 'pnpm-workspace.yaml');
  if (existsSync(pnpm)) {
    const doc = parseYaml(readFileSync(pnpm, 'utf8')) as { packages?: string[] } | null;
    if (doc?.packages?.length) return { patterns: doc.packages, source: 'pnpm-workspace.yaml' };
  }
  const pkg = readJson(join(root, 'package.json'));
  const ws = pkg?.workspaces;
  const patterns = Array.isArray(ws) ? ws : (ws as { packages?: string[] } | undefined)?.packages;
  if (patterns?.length) return { patterns: patterns as string[], source: 'package.json workspaces' };
  const lerna = readJson(join(root, 'lerna.json'));
  if (Array.isArray(lerna?.packages)) return { patterns: lerna.packages as string[], source: 'lerna.json' };
  return undefined;
}

/** Subdirectories (depth ≤ 2) that carry their own manifest. */
function manifestDirs(root: string): string[] {
  const found: string[] = [];
  for (const a of childDirs(root)) {
    if (hasManifest(join(root, a))) {
      found.push(a);
      continue;
    }
    for (const b of childDirs(join(root, a))) {
      if (hasManifest(join(root, a, b))) found.push(posix.join(a, b));
    }
  }
  return found;
}

function toProjects(root: string, paths: string[], repos = false): DetectedProject[] {
  const used = new Set<string>();
  return paths.map((path) => {
    let name = toProjectName(basename(path));
    // Disambiguate `apps/web` and `packages/web`.
    if (used.has(name)) name = toProjectName(path);
    used.add(name);
    const guess = profileEvidence(join(root, path));
    return { name, path, ...(guess ?? {}), ...(repos ? { repo: originUrl(join(root, path)) } : {}) };
  });
}

/** Reads the filesystem (never writes) and proposes a workspace layout for `init`. */
export function detectWorkspace(root: string): DetectedWorkspace {
  const rootIsRepo = isRepo(root);

  if (!rootIsRepo) {
    const repos = childDirs(root).filter((d) => isRepo(join(root, d)));
    if (repos.length >= 2) {
      return { mode: 'polyrepo', rootIsRepo, reason: `${repos.length} child git repositories`, projects: toProjects(root, repos, true) };
    }
  }

  const declared = declaredWorkspaces(root);
  if (declared) {
    const paths = expandWorkspaceGlobs(root, declared.patterns);
    if (paths.length > 0) return { mode: 'monorepo', rootIsRepo, reason: declared.source, projects: toProjects(root, paths) };
  }

  const manifests = manifestDirs(root);
  if (manifests.length >= 2) {
    return {
      mode: 'monorepo',
      rootIsRepo,
      reason: `${manifests.length} subdirectories with manifests`,
      projects: toProjects(root, manifests),
    };
  }

  const rootProfile = profileEvidence(root);
  return {
    mode: 'single',
    rootIsRepo,
    reason: rootIsRepo ? 'single git repository' : 'not a git repository',
    projects: [{ name: rootName(root), path: '.', ...(rootProfile ?? {}) }],
  };
}
