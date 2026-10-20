import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import semver from 'semver';
import { MAX_PROJECT_SKILLS, type Catalog, type Config, type Profile } from '../schemas/index.js';
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

export interface SkillProposal {
  matches: SkillMatch[];
  /** Candidates left out, with the reason, so the agent can ask the user. */
  dropped: { skill: string; technology: string; reason: string }[];
}

const FINGERPRINT_FILES = ['tsconfig.json', 'next.config.js', 'next.config.mjs', 'next.config.ts', 'angular.json', 'nest-cli.json', 'pubspec.yaml', 'Dockerfile', 'dbt_project.yml', 'serverless.yml', 'template.yaml', 'cdk.json', 'manage.py', 'pom.xml', 'go.mod', 'Cargo.toml'];

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

export function fingerprintProject(root: string, project: Config['projects'][number], catalog: Catalog): ProjectFingerprint {
  const dir = join(root, project.path);
  const dependencies = readDependencies(dir);
  const files = FINGERPRINT_FILES.filter((f) => existsSync(join(dir, f)));
  return { project: project.name, path: project.path, profile: project.profile, dependencies, files, facets: detectFacets(catalog, dependencies, files) };
}

const holds = (when: Record<string, string> | undefined, facets: Record<string, string>) =>
  !when || Object.entries(when).every(([k, v]) => facets[k] === v);

/**
 * Crosses fingerprints with the catalog: one skill per technology (the primary, or the alternative
 * whose `when` matches the project's facets), bootstrap skills excluded, at most `cap` proposals.
 * Nothing is installed here: the user approves the list.
 */
export function proposeSkills(fingerprints: ProjectFingerprint[], catalog: Catalog, cap = MAX_PROJECT_SKILLS): SkillProposal {
  const found = new Map<string, SkillMatch>();
  const dropped: SkillProposal['dropped'] = [];
  const bootstrap = new Set(catalog.bootstrap);

  for (const fp of fingerprints) {
    for (const [technology, tech] of Object.entries(catalog.technologies)) {
      const evidence = matches(tech.match, fp.dependencies, fp.files);
      if (!evidence) continue;
      const alt = tech.alt.find((a) => holds(a.when, fp.facets));
      const skill = alt?.skill ?? (holds(tech.when, fp.facets) ? tech.primary : undefined);
      if (!skill) {
        const facets = Object.keys(tech.when ?? {}).join(', ');
        dropped.push({ skill: tech.primary, technology, reason: `${fp.project}: could not detect ${facets}; ask which convention the project follows` });
        continue;
      }
      if (bootstrap.has(skill)) continue;
      const meta = catalog.skills[skill]!;
      if (!meta.profiles.includes(fp.profile)) continue;
      const existing = found.get(skill);
      if (existing) {
        if (!existing.projects.includes(fp.project)) existing.projects.push(fp.project);
      } else {
        found.set(skill, { skill, technology, vetted: meta.vetted, projects: [fp.project], evidence });
      }
    }
  }

  // Vetted first, then by id, so the cap keeps the safest choices.
  const ordered = [...found.values()].sort((a, b) => Number(b.vetted) - Number(a.vetted) || a.skill.localeCompare(b.skill));
  for (const m of ordered.slice(cap)) dropped.push({ skill: m.skill, technology: m.technology, reason: `cap of ${cap} skills reached` });
  return { matches: ordered.slice(0, cap), dropped };
}
