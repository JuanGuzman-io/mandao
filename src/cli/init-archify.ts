import { join } from 'node:path';
import * as p from '@clack/prompts';
import { archifyScript } from '../engine/archify.js';
import { readCatalog } from '../engine/catalog.js';
import { LOCK_FILE, LOCK_HEADER, readConfig, readLock, writeYaml } from '../engine/files.js';
import { home } from '../engine/global.js';
import type { CatalogSkill, HarnessId, Lock } from '../schemas/index.js';
import { installSkills, pinSkills, shellRunner } from '../skills/install.js';

const ARCHIFY: CatalogSkill = {
  description: 'Pinned diagram authoring and rendering skill, shared by all supported harnesses.',
  source: {
    type: 'git',
    url: 'https://github.com/tt-a1i/archify',
    ref: 'v3.2.0',
    path: 'archify',
    commit: '208acba8d412335185b2056fedf54b3405df43fb',
  },
  version: '3.2.0',
  author: 'tt-a1i',
  license: 'MIT',
  vetted: true,
  binding: 'core',
  phases: ['specify', 'implement', 'close'],
  profiles: ['app', 'ai', 'data'],
  fallback: 'Run the shared `mandao run archify` helper after installing Archify.',
  model_invocation: true,
};

function archifyCatalog() {
  const catalog = readCatalog();
  catalog.skills.archify = ARCHIFY;
  return catalog;
}

/** Installs the verified Archify release into each selected harness folder after an explicit confirmation. */
export async function offerArchify(root: string, harnesses: readonly HarnessId[], opts: { yes?: boolean }): Promise<void> {
  if (readConfig(root).diagrams.engine === 'mermaid' || archifyScript(root, home())) return;
  const catalog = archifyCatalog();
  if (opts.yes) {
    p.log.info('Archify 3.2.0 is required for diagrams. Run `mandao init` interactively to review and confirm its pinned install.');
    return;
  }
  p.note(
    'Archify 3.2.0 (MIT) will be copied from its verified v3.2.0 commit into the selected harness skill folders. ' +
      'Its executable files are required to render diagrams.',
    'Required diagram tool',
  );
  const accepted = await p.confirm({ message: 'Install pinned Archify 3.2.0 now?' });
  if (p.isCancel(accepted) || !accepted) {
    p.log.warn(
      'Archify is not installed. Required diagram steps will stop until it is installed; configure ' +
        'diagrams.engine: mermaid to choose Mermaid instead.',
    );
    return;
  }
  const lockFile = join(root, LOCK_FILE);
  const lock = readLock(lockFile);
  if (!lock) throw new Error('Cannot pin Archify: .mandao/mandao.lock is missing; run `mandao sync` and retry.');
  const results = installSkills(['archify'], catalog, root, home(), shellRunner, {
    harnesses,
    withScripts: true,
    warn: (message) => p.log.warn(message),
  });
  const next: Lock = pinSkills(lock, results, catalog);
  if (results.some((result) => result.status === 'installed')) writeYaml(lockFile, next, LOCK_HEADER);
  for (const result of results) {
    if (result.status === 'installed') p.log.success('Installed and pinned Archify 3.2.0.');
    else p.log.warn(`Archify ${result.status}: ${result.detail ?? 'run the displayed install step manually'}`);
  }
}
