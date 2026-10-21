import * as p from '@clack/prompts';
import { readCatalog } from '../engine/catalog.js';
import type { Catalog, HarnessId } from '../schemas/index.js';
import { type CommandSkill, commandSkills } from '../skills/command-skills.js';
import { sourceLabel } from '../skills/install.js';
import { c } from './output.js';
import { installAndPin, planLines } from './skills.js';

/** Pure: what the offer shows for one skill: what it does, source, version, vetted state, commands and how it installs. */
function offerLines(skill: CommandSkill, catalog: Catalog, harnesses: readonly HarnessId[]): string[] {
  const s = catalog.skills[skill.id]!;
  return [
    ...planLines(skill.id, catalog, harnesses),
    `           ${s.description}`,
    `           used by ${skill.commands.map((cmd) => `/mandao-${cmd}`).join(', ')} · source ${sourceLabel(s)}`,
  ];
}

/** `--yes`: the list and the command that installs them later; nothing runs (like the budget, no default is chosen). */
function listOnly(skills: CommandSkill[], catalog: Catalog) {
  console.log('Skills the commands use (none installed; init --yes never installs one):');
  for (const { id } of skills) {
    const s = catalog.skills[id]!;
    console.log(`  ${id}@${s.version} ${sourceLabel(s)}`);
  }
  console.log(`Install them later with: mandao skills add ${skills.map((s) => s.id).join(' ')}`);
}

/**
 * The init step that offers the commands' skills (FR-2, D2), after sync so the lock exists. It shows
 * each skill and how it would be installed, then asks with nothing selected; only the selection goes
 * through the `skills add` path. Cancel or no selection installs and pins nothing. A skill that cannot
 * be installed is reported and never fails init.
 */
export async function offerSkills(
  root: string,
  harnesses: readonly HarnessId[],
  opts: { yes?: boolean; withScripts?: boolean },
): Promise<void> {
  const catalog = readCatalog();
  const skills = commandSkills(catalog);
  if (!skills.length) return;
  if (opts.yes) return listOnly(skills, catalog);
  p.note(skills.flatMap((s) => offerLines(s, catalog, harnesses)).join('\n'), 'Skills the commands use');
  const picked = await p.multiselect({
    message: 'Which skills should Mandao install now? (space to select, enter to confirm; none is fine)',
    options: skills.map((s) => ({ value: s.id, label: s.id, hint: s.commands.join(', ') })),
    required: false,
  });
  if (p.isCancel(picked) || picked.length === 0) {
    p.log.info(`No skills installed. Add them later with ${c.bold('mandao skills add <id>')}.`);
    return;
  }
  installAndPin(root, picked, catalog, { harnesses, withScripts: opts.withScripts, warn: (m) => p.log.warn(m) });
}
