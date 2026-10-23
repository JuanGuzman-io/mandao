import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readCatalog } from '../engine/catalog.js';
import { LOCK_FILE, readLock } from '../engine/files.js';
import { parseFrontmatter } from '../engine/frontmatter.js';
import { TEMPLATES_DIR } from '../render/render.js';
import type { Catalog, Config } from '../schemas/index.js';
import type { SpecFolder } from '../scripts/spec.js';
import { skillFolders } from '../skills/install.js';
import { mockSkills } from '../skills/on-demand.js';
import { reviewerMockRule, skillLoadName } from '../spec/index.js';

/**
 * The CLI side of the mock (phase 13, review F5): what needs the catalog, the lock, the skills folders or the
 * installed templates is resolved here and passed to `src/scripts/mockups.ts`, which stays free of them.
 */

export const specId = (spec: SpecFolder) => spec.story?.meta.id ?? spec.name;

/** True when every harness skills folder holds `<id>/SKILL.md` (a non-`git` source has no copy to check). */
export function copiedEverywhere(root: string, config: Config, catalog: Catalog, id: string): boolean {
  if (catalog.skills[id]?.source.type !== 'git') return true;
  return skillFolders(config.harnesses).every((f) => existsSync(join(root, f, id, 'SKILL.md')));
}

/** Skills pinned in the lock and copied into every harness folder: installed, nothing left to offer. */
function installedIds(root: string, config: Config, catalog: Catalog): string[] {
  return (readLock(join(root, LOCK_FILE))?.skills ?? []).map((s) => s.id).filter((id) => copiedEverywhere(root, config, catalog, id));
}

/** The skills an accepted mock installs, for the spec's projects and the workspace harnesses, leaving out `done` (default: installed). */
export function skillsToOffer(root: string, config: Config, spec: SpecFolder, done?: readonly string[]) {
  const catalog = readCatalog();
  const projects = spec.story?.meta.projects ?? [];
  const profiles = config.projects.filter((p) => projects.includes(p.name)).map((p) => p.profile);
  const pinned = done ?? installedIds(root, config, catalog);
  return mockSkills(catalog, { profiles, harnesses: config.harnesses, pinned, spec: specId(spec) });
}

/**
 * The names the installed mock skills load under (the copied SKILL.md `name` when it is a plain slug, else the
 * folder id): upstream names differ from the catalog id (`landing-page-design` for `ai-design-skills`).
 */
export function mockSkillNames(root: string, config: Config): string[] {
  const catalog = readCatalog();
  return (readLock(join(root, LOCK_FILE))?.skills ?? [])
    .filter((s) => catalog.skills[s.id]?.install_on === 'mock-accepted')
    .flatMap((s) => {
      const file = skillFolders(config.harnesses)
        .map((folder) => join(root, folder, s.id, 'SKILL.md'))
        .find((f) => existsSync(f));
      return file ? [skillLoadName(parseFrontmatter(readFileSync(file, 'utf8')).data.name, s.id)] : [];
    });
}

/** The Reviewer's mock rule from the installed `rules/review.md` of the task project's profile. */
export function reviewRuleFor(root: string, config: Config, project: string): string {
  const profile = config.projects.find((p) => p.name === project)?.profile ?? config.default_profile;
  const file = join(root, TEMPLATES_DIR, profile, 'rules', 'review.md');
  return reviewerMockRule(existsSync(file) ? readFileSync(file, 'utf8') : undefined);
}
