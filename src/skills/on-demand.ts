import type { Catalog, HarnessId, Profile } from '../schemas/index.js';

/** A skill the command may offer to install, as the exact command; nothing here installs it. */
export interface OnDemandSkill {
  id: string;
  install: string;
}

/**
 * Pure: the `install_on: mock-accepted` skills for a spec whose mock was accepted, for its projects' profiles
 * and the workspace harnesses (a `plugin` source installs only in Claude Code), leaving out those already pinned.
 * Installing fetches third-party content, so the command runs `install` (launcher form, `--yes`: the agent shell has no prompt) only after the person agrees.
 */
export function mockSkills(
  catalog: Catalog,
  o: { profiles: readonly Profile[]; harnesses: readonly HarnessId[]; pinned: readonly string[] },
): OnDemandSkill[] {
  return Object.entries(catalog.skills)
    .filter(([id, s]) => s.install_on === 'mock-accepted' && !o.pinned.includes(id))
    .filter(([, s]) => s.profiles.some((p) => o.profiles.includes(p)))
    .filter(([, s]) => s.source.type !== 'plugin' || o.harnesses.includes('claude'))
    .map(([id]) => ({ id, install: `node .mandao/bin/mandao.mjs skills add ${id} --yes` }))
    .sort((a, b) => a.id.localeCompare(b.id));
}
