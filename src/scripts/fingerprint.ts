import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import semver from 'semver';
import { type Catalog, type Config, installable, MAX_PROJECT_SKILLS, type Profile } from '../schemas/index.js';
import { dependencyNames } from '../workspace/detect.js';

type Matcher = Catalog['technologies'][string]['match'];

export interface ProjectFingerprint {
  project: string;
  path: string;
  profile: Profile;
  /** Declared dependencies with their version ranges, `*` when unknown. */
  dependencies: Record<string, string>;
  files: string[];
  /** Style-defining libraries detected through the catalog facets, e.g. `{ state: 'bloc' }`. */
  facets: Record<string, string>;
}

export interface SkillMatch {
  skill: string;
  technology: string;
  vetted: boolean;
  projects: string[];
  evidence: string;
}

/** A detected technology no catalog skill covers: the constitution proposes the project skill (ADR 0012). */
export interface ProjectSkillNeed {
  technology: string;
  projects: string[];
  evidence: string;
  reason: string;
}

export interface SkillProposal {
  matches: SkillMatch[];
  /** Candidates left out, with the reason, so the agent can ask the user. */
  dropped: { skill: string; technology: string; reason: string }[];
  projectSkills: ProjectSkillNeed[];
}

const FINGERPRINT_FILES = [
  'tsconfig.json',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'angular.json',
  'nest-cli.json',
  'pubspec.yaml',
  'Dockerfile',
  'dbt_project.yml',
  'serverless.yml',
  'template.yaml',
  'cdk.json',
  'manage.py',
  'pom.xml',
  'go.mod',
  'Cargo.toml',
  'pyproject.toml',
  'requirements.txt',
  'components.json',
  '.github/workflows',
];

const REPO_FILES = ['.github/workflows'];

function satisfies(declared: string, wanted: string | undefined): boolean {
  if (!wanted || declared === '*' || declared === 'latest') return true;
  const min = semver.minVersion(declared);
  // Workspace protocols, git URLs and tags cannot be checked; do not exclude on them.
  return min ? semver.satisfies(min, wanted) : true;
}

/** Returns the evidence for a match (`pkg@range` or a file name), or undefined. */
function matches(m: Matcher, deps: Record<string, string>, files: string[]): string | undefined {
  const pkg = m.packages.find((name) => name in deps && satisfies(deps[name]!, m.versions));
  if (pkg) return `${pkg}@${deps[pkg]}`;
  return m.files.find((f) => files.includes(f));
}

export function readDependencies(dir: string): Record<string, string> {
  const deps: Record<string, string> = {};
  const pkgFile = join(dir, 'package.json');
  if (existsSync(pkgFile)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgFile, 'utf8')) as Record<string, Record<string, string> | undefined>;
      for (const k of ['dependencies', 'devDependencies', 'peerDependencies']) Object.assign(deps, pkg[k] ?? {});
    } catch {
      // An unreadable package.json is the agent's to report.
    }
  }
  for (const name of dependencyNames(dir)) if (!(name in deps)) deps[name] = '*';
  return deps;
}

/** Pure: computes facets from dependencies and files. */
export function detectFacets(catalog: Catalog, deps: Record<string, string>, files: string[]): Record<string, string> {
  const facets: Record<string, string> = {};
  for (const [facet, values] of Object.entries(catalog.facets)) {
    const hit = Object.entries(values).find(([, m]) => matches(m, deps, files));
    if (hit) facets[facet] = hit[0];
  }
  return facets;
}

/** `monorepo`: repository-level files at the workspace root count for every project; a polyrepo child has its own. */
export function fingerprintProject(
  root: string,
  project: Config['projects'][number],
  catalog: Catalog,
  monorepo = false,
): ProjectFingerprint {
  const dir = join(root, project.path);
  const dependencies = readDependencies(dir);
  // Repository-level files (CI workflows) live at the workspace root in a monorepo, not in each project.
  const atRoot = (f: string) => monorepo && REPO_FILES.includes(f) && existsSync(join(root, f));
  const files = FINGERPRINT_FILES.filter((f) => existsSync(join(dir, f)) || atRoot(f));
  return {
    project: project.name,
    path: project.path,
    profile: project.profile,
    dependencies,
    files,
    facets: detectFacets(catalog, dependencies, files),
  };
}

const holds = (when: Record<string, string> | undefined, facets: Record<string, string>) =>
  !when || Object.entries(when).every(([k, v]) => facets[k] === v);

type Tech = Catalog['technologies'][string];

/** The skill a matched technology proposes for one project, or why none (facets undetected). */
function pick(tech: Tech, facets: Record<string, string>): string | undefined {
  const alt = tech.alt.find((a) => holds(a.when, facets));
  return alt?.skill ?? (holds(tech.when, facets) ? tech.primary : undefined);
}

class Proposal {
  readonly found = new Map<string, SkillMatch>();
  readonly needs = new Map<string, ProjectSkillNeed>();
  readonly dropped: SkillProposal['dropped'] = [];

  constructor(private readonly catalog: Catalog) {}

  add(skill: string, technology: string, fp: ProjectFingerprint, evidence: string) {
    const meta = this.catalog.skills[skill]!;
    if (this.catalog.bootstrap.includes(skill) || !meta.profiles.includes(fp.profile)) return;
    if (!installable(meta)) {
      this.dropped.push({ skill, technology, reason: `${fp.project}: no verified source in the catalog; propose a project skill` });
      return;
    }
    const existing = this.found.get(skill);
    if (!existing) this.found.set(skill, { skill, technology, vetted: meta.vetted, projects: [fp.project], evidence });
    else if (!existing.projects.includes(fp.project)) existing.projects.push(fp.project);
  }

  need(technology: string, reason: string, fp: ProjectFingerprint, evidence: string) {
    const existing = this.needs.get(technology);
    if (!existing) this.needs.set(technology, { technology, projects: [fp.project], evidence, reason });
    else if (!existing.projects.includes(fp.project)) existing.projects.push(fp.project);
  }

  technology(technology: string, tech: Tech, fp: ProjectFingerprint) {
    const evidence = matches(tech.match, fp.dependencies, fp.files);
    if (!evidence) return;
    if (tech.project_skill) return this.need(technology, tech.project_skill, fp, evidence);
    const skill = pick(tech, fp.facets);
    if (skill) return this.add(skill, technology, fp, evidence);
    const facets = Object.keys(tech.when ?? {}).join(', ');
    this.dropped.push({
      skill: tech.primary!,
      technology,
      reason: `${fp.project}: could not detect ${facets}; ask which convention the project follows`,
    });
  }
}

/**
 * Crosses fingerprints with the catalog: one skill per technology (the primary, or the alternative
 * whose `when` matches the project's facets) plus the `binding: profile` skills of each project's profile,
 * bootstrap skills excluded, at most `cap` proposals. A technology no skill covers goes to `projectSkills`;
 * an entry without a verified source is dropped, never proposed (phase 20).
 * Nothing is installed here: the user approves the list.
 */
export function proposeSkills(fingerprints: ProjectFingerprint[], catalog: Catalog, cap = MAX_PROJECT_SKILLS): SkillProposal {
  const proposal = new Proposal(catalog);
  for (const fp of fingerprints) {
    for (const [technology, tech] of Object.entries(catalog.technologies)) proposal.technology(technology, tech, fp);
    for (const [id, s] of Object.entries(catalog.skills)) {
      if (s.binding === 'profile' && !s.install_on) proposal.add(id, `profile:${fp.profile}`, fp, `profile ${fp.profile}`);
    }
  }

  // Vetted first, then by id, so the cap keeps the safest choices.
  const ordered = [...proposal.found.values()].sort((a, b) => Number(b.vetted) - Number(a.vetted) || a.skill.localeCompare(b.skill));
  const dropped = [...proposal.dropped];
  for (const m of ordered.slice(cap)) dropped.push({ skill: m.skill, technology: m.technology, reason: `cap of ${cap} skills reached` });
  return { matches: ordered.slice(0, cap), dropped, projectSkills: [...proposal.needs.values()] };
}
