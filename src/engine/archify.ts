import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Finds the shared Archify entry point in project or user-level skill folders, for any harness. */
export function archifyScript(root: string, homeDir: string): string | undefined {
  const folders = [
    '.claude/skills',
    '.agents/skills',
    '.github/skills',
    '.copilot/skills',
    '.config/opencode/skills',
    '.gemini/antigravity/skills',
  ];
  const candidates = folders.flatMap((folder) => [
    join(root, folder, 'archify/bin/archify.mjs'),
    join(homeDir, folder, 'archify/bin/archify.mjs'),
  ]);
  return candidates.find(existsSync);
}
