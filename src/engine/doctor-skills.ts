import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Catalog, HarnessId, Lock } from '../schemas/index.js';
import { commandSkills } from '../skills/command-skills.js';
import { readableSkillFolders, skillFolders } from '../skills/install.js';
import { restorableSkill } from '../skills/restore.js';
import type { Finding } from './doctor.js';

/** Skills doctor already reports as optional tools: no second finding for them. */
const REPORTED_AS_TOOLS = ['graphify'];

export interface SkillFindingsInput {
  catalog: Catalog;
  /** Ids of the skills pinned in the lock. */
  pinned: readonly string[];
  locked?: Lock['skills'];
  harnesses: readonly HarnessId[];
  root: string;
  home: string;
}

function otherPinnedFindings(
  locked: Lock['skills'],
  restorable: Set<string>,
  catalog: Catalog,
  harnesses: readonly HarnessId[],
  found: (h: HarnessId, id: string) => boolean,
): Finding[] {
  const out: Finding[] = [];
  const commandIds = new Set(commandSkills(catalog).map((s) => s.id));
  for (const s of locked) {
    if (restorable.has(s.id) || commandIds.has(s.id) || REPORTED_AS_TOOLS.includes(s.id)) continue;
    const lacking = harnesses.filter((h) => !found(h, s.id));
    if (lacking.length)
      out.push({ level: 'warn', message: `${s.id} is missing: not found for ${lacking.join(', ')}`, fix: `mandao skills add ${s.id}` });
  }
  return out;
}

function restorableFindings(locked: Lock['skills'], harnesses: readonly HarnessId[], root: string): Finding[] {
  const out: Finding[] = [];
  for (const s of locked.filter(restorableSkill)) {
    const lacking = skillFolders(harnesses).filter((folder) => !existsSync(join(root, folder, s.id, 'SKILL.md')));
    if (lacking.length) {
      const incomplete = lacking.filter((folder) => existsSync(join(root, folder, s.id)));
      const fix = incomplete.length
        ? `Review and remove the incomplete folder(s) ${incomplete.map((folder) => `${folder}/${s.id}`).join(', ')}, then run mandao skills restore`
        : 'mandao skills restore';
      out.push({ level: 'warn', message: `${s.id} is missing: not found in ${lacking.join(', ')}`, fix });
    }
  }
  return out;
}

/**
 * One finding per command skill missing for a configured harness (D4): `warn` when the lock pins it
 * (it disappeared), `info` when it was never installed. Reads the filesystem only.
 */
export function skillFindings({ catalog, pinned, locked = [], harnesses, root, home }: SkillFindingsInput): Finding[] {
  const found = (h: HarnessId, id: string) =>
    readableSkillFolders(h).some((dir) => [root, home].some((base) => existsSync(join(base, dir, id, 'SKILL.md'))));
  const out: Finding[] = [];
  const restorable = new Set(locked.filter(restorableSkill).map((s) => s.id));
  out.push(...restorableFindings(locked, harnesses, root));
  for (const { id, commands } of commandSkills(catalog)) {
    if (REPORTED_AS_TOOLS.includes(id) || restorable.has(id)) continue;
    const lacking = harnesses.filter((h) => !found(h, id));
    if (lacking.length === 0) continue;
    const fallback = catalog.skills[id]?.fallback;
    out.push({
      level: pinned.includes(id) ? 'warn' : 'info',
      message: `${id} is missing: ${commands.join(', ')} lose it${fallback ? ` (${fallback})` : ''}; not found for ${lacking.join(', ')}`,
      fix: `mandao skills add ${id}`,
    });
  }
  return [...out, ...otherPinnedFindings(locked, restorable, catalog, harnesses, found)];
}
