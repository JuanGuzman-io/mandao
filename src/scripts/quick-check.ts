import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { QUICK_FORBIDDEN_TAGS, type Config, type RiskTag } from '../schemas/index.js';

export interface FileStat {
  path: string;
  added: number;
  deleted: number;
}

export interface ManifestChange {
  path: string;
  before: string | undefined;
  after: string | undefined;
}

export interface QuickLimits {
  maxFiles: number;
  maxLoc: number;
}

export const DEFAULT_LIMITS: QuickLimits = { maxFiles: 3, maxLoc: 100 };

export interface QuickReport {
  files: FileStat[];
  totals: { files: number; added: number; deleted: number; loc: number };
  projects: string[];
  newDependencies: string[];
  migrations: string[];
  publicContracts: string[];
  aiChanges: string[];
  riskTags: RiskTag[];
  withinLimits: boolean;
  /** Why the change is not quick. Empty when `withinLimits` is true. */
  reasons: string[];
}

const MIGRATION_RE = /(^|\/)(migrations?|alembic\/versions|db\/migrate|flyway)\/|\.sql$/i;
const CONTRACT_RE = /(^|\/)(openapi|swagger)[^/]*\.(ya?ml|json)$|\.proto$|\.graphqls?$|(^|\/)contracts?\//i;
const AI_RE = /(^|\/)(prompts?|retriev\w*|rag|embeddings?|guardrails?|evals?)\/|\.prompt(\.md)?$|\.(j2|jinja2?)$/i;

const TAG_PATTERNS: [RiskTag, RegExp][] = [
  ['auth', /(^|[\/_.-])(auth|authn|authz|authenticat\w*|authoriz\w*|login|logout|sessions?|oauth|oidc|sso|jwt|tokens?|permissions?|rbac|acl|guards?)([\/_.-]|$)/i],
  ['payments', /(^|[\/_.-])(payments?|billing|invoices?|checkout|stripe|paypal|subscriptions?)([\/_.-]|$)/i],
  ['pii', /(^|[\/_.-])(pii|gdpr|personal[-_]?data|consent|privacy)([\/_.-]|$)/i],
  ['migration', MIGRATION_RE],
  ['public-api', CONTRACT_RE],
  ['infra', /(^|\/)(terraform|infra|k8s|helm|\.github\/workflows)\/|Dockerfile$|docker-compose[^/]*\.ya?ml$|\.tf$/i],
  ['ai-prompt', AI_RE],
];

const DEP_MANIFESTS = /(^|\/)(package\.json|pyproject\.toml|requirements[^/]*\.txt|go\.mod|Cargo\.toml|pom\.xml|build\.gradle(\.kts)?|pubspec\.yaml|composer\.json|Gemfile)$/;

/** Dependency names declared in one manifest's content. */
export function manifestDeps(path: string, content: string | undefined): Set<string> {
  if (!content) return new Set();
  if (path.endsWith('package.json')) {
    try {
      const pkg = JSON.parse(content) as Record<string, Record<string, string> | undefined>;
      return new Set(['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'].flatMap((k) => Object.keys(pkg[k] ?? {})));
    } catch {
      return new Set();
    }
  }
  if (path.endsWith('go.mod')) return new Set([...content.matchAll(/^\s*(?:require\s+)?([\w.-]+\.[\w./-]+)\s+v/gm)].map((m) => m[1]!));
  // Line-based manifests: one requirement per line or quoted strings.
  const names = new Set<string>();
  for (const m of content.matchAll(/^\s*([A-Za-z0-9_.-]+)\s*(?:[<>=~!^]|$)/gm)) names.add(m[1]!.toLowerCase());
  for (const m of content.matchAll(/"([A-Za-z0-9_.@/-]+?)(?:\[[^\]]*\])?\s*(?:[<>=~!;][^"]*)?"/g)) names.add(m[1]!.toLowerCase());
  return names;
}

function projectOf(path: string, config: Pick<Config, 'projects'>): string | undefined {
  // Longest matching project path wins, so nested projects resolve correctly.
  return config.projects
    .filter((p) => p.path === '.' || path === p.path || path.startsWith(`${p.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]?.name;
}

/** Pure decision: is this diff still a quick change? */
export function analyzeDiff(
  files: FileStat[],
  manifests: ManifestChange[],
  config: Pick<Config, 'projects'>,
  limits: QuickLimits = DEFAULT_LIMITS,
): QuickReport {
  const totals = files.reduce((t, f) => ({ files: t.files + 1, added: t.added + f.added, deleted: t.deleted + f.deleted, loc: t.loc + f.added + f.deleted }), { files: 0, added: 0, deleted: 0, loc: 0 });
  const projects = [...new Set(files.map((f) => projectOf(f.path, config) ?? '(outside projects)'))].sort();

  const newDependencies = manifests.flatMap((m) => {
    const before = manifestDeps(m.path, m.before);
    return [...manifestDeps(m.path, m.after)].filter((d) => !before.has(d)).map((d) => `${m.path}: ${d}`);
  });
  const migrations = files.filter((f) => MIGRATION_RE.test(f.path)).map((f) => f.path);
  const publicContracts = files.filter((f) => CONTRACT_RE.test(f.path)).map((f) => f.path);
  const aiChanges = files.filter((f) => AI_RE.test(f.path)).map((f) => f.path);
  const riskTags = TAG_PATTERNS.filter(([, re]) => files.some((f) => re.test(f.path))).map(([tag]) => tag);

  const aiProjects = new Set(config.projects.filter((p) => p.profile === 'ai').map((p) => p.name));
  const reasons: string[] = [];
  if (projects.length > 1) reasons.push(`touches ${projects.length} projects (${projects.join(', ')})`);
  if (totals.files > limits.maxFiles) reasons.push(`${totals.files} files changed (limit ${limits.maxFiles})`);
  if (totals.loc > limits.maxLoc) reasons.push(`${totals.loc} lines changed (limit ~${limits.maxLoc})`);
  if (newDependencies.length) reasons.push(`new dependencies: ${newDependencies.join(', ')}`);
  if (migrations.length) reasons.push(`migrations: ${migrations.join(', ')}`);
  if (publicContracts.length) reasons.push(`public contracts: ${publicContracts.join(', ')}`);
  const forbidden = riskTags.filter((t) => QUICK_FORBIDDEN_TAGS.includes(t));
  if (forbidden.length) reasons.push(`risk tags never allowed in quick: ${forbidden.join(', ')}`);
  const aiTouched = aiChanges.filter((p) => aiProjects.has(projectOf(p, config) ?? ''));
  if (aiTouched.length) reasons.push(`prompt/model/retrieval changes in an ai project: ${aiTouched.join(', ')}`);

  return { files, totals, projects, newDependencies, migrations, publicContracts, aiChanges, riskTags, withinLimits: reasons.length === 0, reasons };
}

const git = (cwd: string, args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });

const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

/** A repository without commits has no HEAD yet; diff against the empty tree instead. */
function resolveBase(repo: string, base: string): string {
  try {
    git(repo, ['rev-parse', '--verify', '--quiet', `${base}^{commit}`]);
    return base;
  } catch {
    if (base === 'HEAD') return EMPTY_TREE;
    throw new Error(`Unknown git ref "${base}" in ${repo}`);
  }
}

/** Collects the working-tree diff against `base` (tracked changes plus untracked files) for one git repo. */
export function collectDiff(repo: string, requestedBase: string, prefix = ''): { files: FileStat[]; manifests: ManifestChange[] } {
  const base = resolveBase(repo, requestedBase);
  const files: FileStat[] = [];
  for (const line of git(repo, ['diff', '--numstat', base]).split('\n').filter(Boolean)) {
    const [a, d, path] = line.split('\t');
    files.push({ path: posix.join(prefix, path!), added: a === '-' ? 0 : Number(a), deleted: d === '-' ? 0 : Number(d) });
  }
  for (const path of git(repo, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)) {
    const content = readFileSync(join(repo, path), 'utf8');
    files.push({ path: posix.join(prefix, path), added: content.split('\n').length, deleted: 0 });
  }
  const manifests = files
    .filter((f) => DEP_MANIFESTS.test(f.path))
    .map((f) => {
      const rel = prefix ? f.path.slice(prefix.length + 1) : f.path;
      let before: string | undefined;
      try {
        before = git(repo, ['show', `${base}:${rel}`]);
      } catch {
        before = undefined;
      }
      const abs = join(repo, rel);
      return { path: f.path, before, after: existsSync(abs) ? readFileSync(abs, 'utf8') : undefined };
    });
  return { files, manifests };
}
