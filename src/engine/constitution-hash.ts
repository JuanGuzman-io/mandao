import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import type { Config } from '../schemas/index.js';
import { docHash } from '../spec/index.js';
import { sha256 } from '../util/hash.js';

/** Constitution files that record history, not rules: editing them changes no decision a spec relied on. */
const HISTORY = new Set(['CHANGELOG.md']);

/** The constitution folders a spec reads: the workspace's, then those of its projects. */
function constitutionDirs(root: string, config: Config, projectNames: string[]): string[] {
  const dir = (projectPath = '') => resolve(root, config.home, projectPath, config.paths.constitution);
  const own = config.projects.filter((p) => projectNames.includes(p.name)).map((p) => dir(p.path));
  return [...new Set([dir(), ...own])].filter((d) => existsSync(d));
}

/**
 * One hash over the constitution a spec was approved against (phase 18): every top-level `.md` of the
 * workspace constitution and of the spec's projects, `status:` ignored, the CHANGELOG left out. Undefined
 * when there is no constitution, so the approval makes no claim about it.
 */
export function constitutionHash(root: string, config: Config, projectNames: string[]): string | undefined {
  const files = constitutionDirs(root, config, projectNames).flatMap((d) =>
    readdirSync(d, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.md') && !HISTORY.has(e.name))
      .map((e) => join(d, e.name)),
  );
  if (!files.length) return undefined;
  const lines = files.map((f) => `${relative(root, f)} ${docHash(readFileSync(f, 'utf8'))}`).sort();
  return sha256(lines.join('\n'));
}
