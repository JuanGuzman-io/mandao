import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import semver from 'semver';
import { MAX_PROJECT_SKILLS, type Catalog, type CatalogSkill, type Config, type Profile } from '../schemas/index.js';
import { dependencyNames } from '../workspace/detect.js';

export interface ProjectFingerprint {
  project: string;
  path: string;
  profile: Profile;
  /** Declared dependencies with their version ranges when known. */
  dependencies: Record<string, string>;
  files: string[];
}

export interface SkillMatch {
  skill: string;
  technology: string;
  role: CatalogSkill['role'];
  vetted: boolean;
  projects: string[];
  evidence: string;
}

export interface SkillProposal {
  matches: SkillMatch[];
  /** Matches dropped because a primary for that technology was already picked or the cap was reached. */
  dropped: { skill: string; reason: string }[];
}

const FINGERPRINT_FILES = ['tsconfig.json', 'next.config.js', 'next.config.mjs', 'angular.json', 'nest-cli.json', 'pubspec.yaml', 'Dockerfile', 'dbt_project.yml', 'serverless.yml', 'template.yaml', 'cdk.json', 'manage.py', 'pom.xml', 'go.mod'];

export function fingerprintProject(root: string, project: Config['projects'][number]): ProjectFingerprint {
  const dir = join(root, project.path);
  const dependencies: Record<string, string> = {};
  const pkgFile = join(dir, 'package.json');
  if (existsSync(pkgFile)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgFile, 'utf8')) as Record<string, Record<string, string> | undefined>;
      for (const k of ['dependencies', 'devDependencies', 'peerDependencies']) Object.assign(dependencies, pkg[k] ?? {});
    } catch {
      // An unreadable package.json is reported by the agent, not here.
    }
  }
  for (const name of dependencyNames(dir)) if (!(name in dependencies)) dependencies[name] = '*';
  return {
    project: project.name,
    path: project.path,
    profile: project.profile,
    dependencies,
    files: FINGERPRINT_FILES.filter((f) => existsSync(join(dir, f))),
  };
}

function satisfies(declared: string, wanted: string | undefined): boolean {
  if (!wanted || declared === '*' || declared === 'latest') return true;
  const min = semver.minVersion(declared);
  // Workspace protocols, git URLs and tags cannot be checked; do not exclude on them.
  return min ? semver.satisfies(min, wanted) : true;
}

/**
 * Crosses fingerprints with the catalog: one primary per technology, bootstrap skills excluded from
 * the cap, at most `cap` proposals. The user approves the list; nothing is installed here.
 */
export function proposeSkills(fingerprints: ProjectFingerprint[], catalog: Catalog, cap = MAX_PROJECT_SKILLS): SkillProposal {
  const found = new Map<string, SkillMatch>();
  for (const fp of fingerprints) {
    for (const skill of catalog.skills) {
      if (skill.bootstrap || !skill.profiles.includes(fp.profile)) continue;
      const pkg = skill.match.packages.find((name) => name in fp.dependencies && satisfies(fp.dependencies[name]!, skill.match.versions));
      const file = skill.match.files.find((f) => fp.files.includes(f));
      if (!pkg && !file) continue;
      const evidence = pkg ? `${pkg}@${fp.dependencies[pkg]}` : file!;
      const existing = found.get(skill.id);
      if (existing) existing.projects.push(fp.project);
      else found.set(skill.id, { skill: skill.id, technology: skill.technology, role: skill.role, vetted: skill.vetted, projects: [fp.project], evidence });
    }
  }

  // Vetted primaries first, then secondaries; stable order by id.
  const ordered = [...found.values()].sort((a, b) => Number(b.role === 'primary') - Number(a.role === 'primary') || Number(b.vetted) - Number(a.vetted) || a.skill.localeCompare(b.skill));
  const matches: SkillMatch[] = [];
  const dropped: SkillProposal['dropped'] = [];
  const primaryFor = new Map<string, string>();
  for (const m of ordered) {
    if (m.role === 'primary' && primaryFor.has(m.technology)) {
      dropped.push({ skill: m.skill, reason: `"${primaryFor.get(m.technology)}" is already the primary skill for ${m.technology}` });
    } else if (matches.length >= cap) {
      dropped.push({ skill: m.skill, reason: `cap of ${cap} skills reached` });
    } else {
      matches.push(m);
      if (m.role === 'primary') primaryFor.set(m.technology, m.skill);
    }
  }
  return { matches, dropped };
}
