import { existsSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';
import type { Config } from '../schemas/index.js';
import { IGNORED_DIRS } from '../workspace/detect.js';

/**
 * Folders that hold a module-level `AGENTS.md` (anything below the workspace and project roots),
 * so the Claude Code adapter can put a `CLAUDE.md` pointer next to each one.
 */
export function findModuleGuides(root: string, config: Config, maxDepth = 8): string[] {
  const known = new Set([config.home, ...config.projects.map((p) => p.path)]);
  const found: string[] = [];
  const walk = (rel: string, depth: number) => {
    if (depth > maxDepth) return;
    const abs = rel === '.' ? root : join(root, rel);
    if (rel !== '.' && !known.has(rel) && existsSync(join(abs, 'AGENTS.md'))) found.push(rel);
    let entries: import('node:fs').Dirent[];
    try {
      entries = readdirSync(abs, { withFileTypes: true });
    } catch {
      return; // unreadable folder: nothing to point at
    }
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith('.') || IGNORED_DIRS.has(e.name)) continue;
      walk(rel === '.' ? e.name : posix.join(rel, e.name), depth + 1);
    }
  };
  walk('.', 0);
  return found.sort();
}
