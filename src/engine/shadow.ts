import { execFileSync } from 'node:child_process';
import { relative, resolve } from 'node:path';
import type { GeneratedFile } from '../adapters/types.js';
import type { Config } from '../schemas/index.js';
import { wrapBlock } from '../writer/blocks.js';
import { generatedPatterns } from './graph.js';

const git = (root: string, args: string[]) => {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return undefined;
  }
};

/** Files git tracks here, relative to `root`. */
export function trackedFiles(root: string): Set<string> {
  return new Set((git(root, ['ls-files', '-z']) ?? '').split('\0').filter(Boolean));
}

/** `.git/info/exclude` as a path relative to `root`; shared by every worktree of the repository. */
export function excludePath(root: string): string | undefined {
  const path = git(root, ['rev-parse', '--git-path', 'info/exclude'])?.trim();
  return path ? relative(root, resolve(root, path)).replace(/\\/g, '/') : undefined;
}

export interface ShadowBuild {
  files: GeneratedFile[];
  /** Managed blocks left out because the file is tracked: the team's own files stay untouched. */
  skipped: string[];
}

/**
 * Shadow mode (ADR 0030): no managed block in a tracked file, and one managed block in `.git/info/exclude`
 * listing what Mandao generates plus the constitution and the specs, so none of it shows up for the team.
 */
export function applyShadow(root: string, config: Config, files: GeneratedFile[], version: string): ShadowBuild {
  if (!config.shadow) return { files, skipped: [] };
  const tracked = trackedFiles(root);
  const skipped = files.filter((f) => f.ownership === 'managed-block' && tracked.has(f.path)).map((f) => f.path);
  const kept = files.filter((f) => !skipped.includes(f.path));
  const exclude = excludePath(root);
  if (!exclude) return { files: kept, skipped };
  const untrackedBlocks = kept.filter((f) => f.ownership === 'managed-block' && f.scope === 'project').map((f) => f.path);
  const patterns = ['.mandao/', ...generatedPatterns(kept), ...untrackedBlocks, `${config.paths.constitution}/`, `${config.paths.specs}/`];
  const block: GeneratedFile = {
    path: exclude,
    content: wrapBlock(exclude, [
      `# Managed by mandao ${version}: shadow mode, nothing generated reaches the team (ADR 0030).`,
      ...new Set(patterns),
    ]),
    ownership: 'managed-block',
    from: 'block:shadow',
    harness: 'mandao',
    scope: 'project',
  };
  return { files: [...kept, block], skipped };
}
