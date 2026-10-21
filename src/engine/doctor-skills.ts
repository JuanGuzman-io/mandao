import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Catalog, HarnessId } from '../schemas/index.js';
import { commandSkills } from '../skills/command-skills.js';
import { readableSkillFolders } from '../skills/install.js';
import type { Finding } from './doctor.js';

/** Skills doctor already reports as optional tools: no second finding for them. */
const REPORTED_AS_TOOLS = ['graphify'];

export interface SkillFindingsInput {
  catalog: Catalog;
  /** Ids of the skills pinned in the lock. */
  pinned: readonly string[];
  harnesses: readonly HarnessId[];
  root: string;
  home: string;
}

/**
 * One finding per command skill missing for a configured harness (D4): `warn` when the lock pins it
 * (it disappeared), `info` when it was never installed. Reads the filesystem only.
 */
export function skillFindings({ catalog, pinned, harnesses, root, home }: SkillFindingsInput): Finding[] {
  const found = (h: HarnessId, id: string) =>
    readableSkillFolders(h).some((dir) => [root, home].some((base) => existsSync(join(base, dir, id, 'SKILL.md'))));
  const out: Finding[] = [];
  for (const { id, commands } of commandSkills(catalog)) {
    if (REPORTED_AS_TOOLS.includes(id)) continue;
    const lacking = harnesses.filter((h) => !found(h, id));
    if (lacking.length === 0) continue;
    const fallback = catalog.skills[id]?.fallback;
    out.push({
      level: pinned.includes(id) ? 'warn' : 'info',
      message: `${id} is missing: ${commands.join(', ')} lose it${fallback ? ` (${fallback})` : ''}; not found for ${lacking.join(', ')}`,
      fix: `mandao skills add ${id}`,
    });
  }
  return out;
}
