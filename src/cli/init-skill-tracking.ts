import { join } from 'node:path';
import * as p from '@clack/prompts';
import { CONFIG_FILE, LOCK_FILE, readLock } from '../engine/files.js';
import { syncProject } from '../engine/sync.js';
import { editYaml } from '../writer/files.js';
import { printChanges, printWarnings } from './output.js';

export function readInitSkillIds(root: string): Set<string> {
  return new Set(readLock(join(root, LOCK_FILE))?.skills.map((skill) => skill.id) ?? []);
}

export async function chooseSkillTracking(root: string, prior: Set<string>, yes: boolean): Promise<void> {
  if (yes || ![...readInitSkillIds(root)].some((id) => !prior.has(id))) return;
  const track = await p.select({
    message: 'Commit installed skills or ignore them and restore from the lock?',
    options: [
      { value: false, label: 'Ignore and restore from the lock' },
      { value: true, label: 'Commit installed skills' },
    ],
    initialValue: false,
  });
  if (p.isCancel(track)) return;
  editYaml(join(root, CONFIG_FILE), (doc) => doc.set('skills', { track }));
  const result = syncProject(root);
  printChanges(result.changes);
  printWarnings(result.warnings);
}
