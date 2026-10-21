import type { Catalog } from '../schemas/index.js';

export interface CommandSkill {
  id: string;
  /** The commands that use the skill (its catalog `phases`). */
  commands: string[];
}

/** Pure: the bootstrap, core, non-bundled skills the commands use, with those commands. Independent of the harness. */
export function commandSkills(catalog: Catalog): CommandSkill[] {
  return catalog.bootstrap
    .map((id) => [id, catalog.skills[id]] as const)
    .filter(([, s]) => s !== undefined && s.binding === 'core' && s.source.type !== 'bundled')
    .map(([id, s]) => ({ id, commands: [...s!.phases] }));
}
