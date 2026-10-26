import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Config } from '../schemas/index.js';
import { type SecurityScanning, securityScanningSchema } from '../schemas/security-scanning.js';
import { onPath } from '../util/which.js';
import { parseFrontmatter } from './frontmatter.js';

type Location = 'local' | 'ci' | 'provider';
type RemoteSettings = {
  security_and_analysis?: {
    secret_scanning?: { status?: string } | null;
    secret_scanning_push_protection?: { status?: string } | null;
    code_security?: { status?: string } | null;
    advanced_security?: { status?: string } | null;
  };
};

export interface ScanProjectReport {
  project: string;
  detected: SecurityScanning;
  recorded: SecurityScanning;
  state: Record<'secrets' | 'sast', 'covered' | 'none' | 'unknown'>;
}

export interface SecurityScanOptions {
  /** Injectable read-only GitHub API request; undefined means absent tool, denied or unavailable. */
  githubApi?: (cwd: string, endpoint: string) => string | undefined;
}

const SCANNERS = {
  secrets: [
    ['gitleaks', /\bgitleaks\b/i],
    ['trufflehog', /\btrufflehog\b/i],
    ['detect-secrets', /\bdetect-secrets\b/i],
    ['ggshield', /\bggshield\b/i],
    ['secretlint', /\bsecretlint\b/i],
  ],
  sast: [
    ['semgrep', /\bsemgrep\b/i],
    ['codeql', /\bcodeql\b/i],
    ['sonarcloud', /\bsonarcloud\b/i],
    ['sonarqube', /\bsonarqube\b/i],
    ['sonar-scanner', /\bsonar-scanner\b/i],
    ['snyk-code', /\bsnyk\b[\s\S]{0,80}\b(code|test)\b|\bsnyk-code\b/i],
    ['bandit', /\bbandit\b/i],
  ],
} as const;

/** Detects the named secret and SAST scanners in a text source. */
export function scannersInText(kind: 'secrets' | 'sast', text: string): string[] {
  return SCANNERS[kind].filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
}

/** Reads declared scanner sources from infrastructure frontmatter; declarations remain distinct from discoveries. */
export function declaredSecurityScanning(text: string | undefined): SecurityScanning {
  if (!text) return securityScanningSchema.parse(undefined);
  return securityScanningSchema.parse(parseFrontmatter(text).data.security_scanning);
}

function filesInDirectory(root: string): string[] {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isFile()) out.push(path);
    if (entry.isDirectory()) {
      for (const nested of readdirSync(path, { withFileTypes: true })) if (nested.isFile()) out.push(join(path, nested.name));
    }
  }
  return out;
}

/** Whether the repository has any CI configuration (the same files security scanning reads). */
export const hasCi = (repo: string) => workflows(repo).length > 0;

function workflows(repo: string): string[] {
  const out = [...filesInDirectory(join(repo, '.github', 'workflows')), ...filesInDirectory(join(repo, '.gitlab'))];
  for (const file of [
    '.gitlab-ci.yml',
    'azure-pipelines.yml',
    'Jenkinsfile',
    'bitbucket-pipelines.yml',
    join('.circleci', 'config.yml'),
    join('.buildkite', 'pipeline.yml'),
  ]) {
    const candidate = join(repo, file);
    if (existsSync(candidate)) out.push(candidate);
  }
  return out;
}

function remoteUrl(repo: string): string | undefined {
  try {
    return execFileSync('git', ['config', '--get', 'remote.origin.url'], {
      cwd: repo,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}

function githubSlug(remote: string | undefined): string | undefined {
  if (!remote) return undefined;
  const match = /^(?:https?:\/\/github\.com\/|git@github\.com:)([^/]+\/[^/]+?)(?:\.git)?\/?$/i.exec(remote.trim());
  return match?.[1];
}

function defaultGithubApi(cwd: string, endpoint: string): string | undefined {
  try {
    return execFileSync('gh', ['api', endpoint], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10_000 });
  } catch {
    return undefined;
  }
}

function addScanners(out: SecurityScanning, location: Location, kind: 'secrets' | 'sast', text: string): void {
  out[kind][location].push(...scannersInText(kind, text));
}

function dedupe(out: SecurityScanning): SecurityScanning {
  for (const kind of ['secrets', 'sast'] as const) {
    for (const location of ['local', 'ci', 'provider'] as const) {
      out[kind][location] = [...new Set(out[kind][location])];
      out[kind].declared[location] = [...new Set(out[kind].declared[location])];
    }
    out[kind].unknown = [...new Set(out[kind].unknown)];
  }
  return out;
}

function remoteSettings(text: string | undefined): RemoteSettings | undefined {
  if (!text) return undefined;
  try {
    return JSON.parse(text) as RemoteSettings;
  } catch {
    return undefined;
  }
}

function addSecretProvider(out: SecurityScanning, features: NonNullable<RemoteSettings['security_and_analysis']>): void {
  out.secrets.checked.provider = true;
  if (features.secret_scanning?.status === 'enabled') out.secrets.provider.push('github-secret-scanning');
  if (features.secret_scanning_push_protection?.status === 'enabled') out.secrets.provider.push('github-push-protection');
  if (!features.secret_scanning || !features.secret_scanning_push_protection)
    out.secrets.unknown.push('GitHub secret-scanning feature status omitted by API');
}

function addSastProvider(repo: string, slug: string, out: SecurityScanning, api: NonNullable<SecurityScanOptions['githubApi']>): void {
  const analyses = api(repo, `repos/${slug}/code-scanning/analyses?per_page=1`);
  if (analyses === undefined) out.sast.unknown.push('GitHub code-scanning analyses unavailable');
  else {
    try {
      const rows = JSON.parse(analyses) as unknown[];
      out.sast.checked.provider = true;
      if (rows.length) out.sast.provider.push('github-code-scanning');
    } catch {
      out.sast.unknown.push('GitHub code-scanning response was unreadable');
    }
  }
}

function addGithubEvidence(repo: string, slug: string, out: SecurityScanning, api: NonNullable<SecurityScanOptions['githubApi']>): void {
  const settings = remoteSettings(api(repo, `repos/${slug}`));
  const features = settings?.security_and_analysis;
  if (!features) {
    const reason = settings ? 'GitHub security settings not visible to this token' : 'GitHub security settings unavailable or unreadable';
    for (const kind of ['secrets', 'sast'] as const) out[kind].unknown.push(reason);
    return;
  }
  addSecretProvider(out, features);
  addSastProvider(repo, slug, out, api);
  // The repository API does not inventory every third-party security app; do not imply they are absent.
  out.secrets.unknown.push('third-party secret-scanning integrations');
  out.sast.unknown.push('third-party SAST integrations');
}

/** Gathers local gate, workflow, provider API and human-declared scan evidence per project. */
export function collectSecurityScanning(root: string, config: Config, options: SecurityScanOptions = {}): ScanProjectReport[] {
  const api = options.githubApi ?? defaultGithubApi;
  return config.projects.map((project) => scanProject(root, project, config, api));
}

function scanLocal(project: Config['projects'][number], detected: SecurityScanning): void {
  for (const kind of ['secrets', 'sast'] as const) {
    detected[kind].checked.local = true;
    const gate = project.gates[kind];
    if (!gate) continue;
    detected[kind].local.push(...scannersInText(kind, gate));
    if (!detected[kind].local.length) detected[kind].local.push(`configured-${kind}-gate`);
  }
  for (const scanner of ['gitleaks', 'trufflehog', 'detect-secrets', 'ggshield', 'secretlint'])
    if (onPath(scanner)) detected.secrets.local.push(scanner);
  for (const scanner of ['semgrep', 'codeql', 'sonar-scanner', 'snyk', 'bandit']) if (onPath(scanner)) detected.sast.local.push(scanner);
}

function scanCi(repo: string, detected: SecurityScanning): void {
  detected.secrets.checked.ci = true;
  detected.sast.checked.ci = true;
  for (const file of workflows(repo)) {
    const text = readFileSync(file, 'utf8');
    addScanners(detected, 'ci', 'secrets', text);
    addScanners(detected, 'ci', 'sast', text);
  }
}

function scanProject(
  root: string,
  project: Config['projects'][number],
  config: Config,
  api: NonNullable<SecurityScanOptions['githubApi']>,
): ScanProjectReport {
  const repo = join(root, project.path);
  const detected = securityScanningSchema.parse(undefined);
  scanLocal(project, detected);
  scanCi(repo, detected);
  const slug = githubSlug(remoteUrl(repo));
  if (slug) addGithubEvidence(repo, slug, detected, api);
  else
    for (const kind of ['secrets', 'sast'] as const)
      detected[kind].unknown.push('provider-managed scanning is not inspectable from repository files');

  const workspaceInfra = join(root, config.paths.constitution, 'infrastructure.md');
  const projectInfra = join(repo, config.paths.constitution, 'infrastructure.md');
  const infraFile = existsSync(projectInfra) ? projectInfra : workspaceInfra;
  const recorded = declaredSecurityScanning(existsSync(infraFile) ? readFileSync(infraFile, 'utf8') : undefined);
  const state = { secrets: coverageState(detected.secrets, recorded.secrets), sast: coverageState(detected.sast, recorded.sast) };
  return { project: project.name, detected: dedupe(detected), recorded, state };
}

/** Combines discovered and declared coverage without mislabeling the origin of either. */
export function coverageState(
  detected: SecurityScanning['secrets'],
  declared: SecurityScanning['secrets'],
): 'covered' | 'none' | 'unknown' {
  const observed = [
    detected.local,
    detected.ci,
    detected.provider,
    declared.declared.local,
    declared.declared.ci,
    declared.declared.provider,
  ].some((x) => x.length > 0);
  if (observed) return 'covered';
  if (detected.unknown.length || !Object.values(detected.checked).every(Boolean)) return 'unknown';
  return 'none';
}
