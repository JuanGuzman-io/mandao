import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { constitutionHash } from '../engine/constitution-hash.js';
import type { readConfig } from '../engine/files.js';
import { MOCKUPS_DIR, mockupHashes } from '../scripts/mockups.js';
import type { SpecFolder } from '../scripts/spec.js';
import { CONSTITUTION, docHash } from '../spec/index.js';

const APPROVABLE = ['story.md', 'requirements.md', 'design.md', 'data-model.md', 'spec.md', 'research.md'];

/** The hash of each approvable document by file name, plus every `mockups/` file unless `only` leaves it out. tasks.md is left out: its checkboxes change. */
export function currentHashes(dir: string, only?: string[]): Record<string, string> {
  const files = APPROVABLE.filter((f) => (!only || only.includes(f)) && existsSync(join(dir, f)));
  const docs = Object.fromEntries(files.map((f) => [f, docHash(readFileSync(join(dir, f), 'utf8'))]));
  return !only || only.includes(MOCKUPS_DIR) ? { ...docs, ...mockupHashes(dir) } : docs;
}

/** The hashes plus the constitution's, when the project has one: design and spec approvals rely on it (phase 18). */
export function withConstitution(root: string, config: ReturnType<typeof readConfig>, spec: SpecFolder, hashes: Record<string, string>) {
  const hash = constitutionHash(root, config, spec.story?.meta.projects ?? []);
  return hash ? { ...hashes, [CONSTITUTION]: hash } : hashes;
}

/** Who approves: the person at the terminal, as git knows them; never a model. */
export function approver(cwd: string, by?: string): string {
  if (by) return by;
  try {
    const name = execFileSync('git', ['config', 'user.name'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (name) return name;
  } catch {
    // no git identity: fall back to the OS user
  }
  return process.env.USER ?? process.env.USERNAME ?? 'unknown';
}

export function budgetTo(to: string | undefined): number | 'none' {
  if (to === 'none') return 'none';
  const n = Number(to);
  if (!(n > 0)) throw new Error('budget needs --to <USD> (the total this spec may spend) or --to none (no cap)');
  return n;
}
