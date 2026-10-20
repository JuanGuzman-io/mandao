import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Catalog, CatalogSkill, Lock } from '../schemas/index.js';
import { coreDir } from '../util/package-root.js';

export type InstallStep =
  /** Commands Mandao runs after confirmation. */
  | { kind: 'shell'; commands: string[] }
  /** Commands the user runs inside the agent (e.g. `/plugin install …`). */
  | { kind: 'agent'; commands: string[] }
  /** Nothing to run: bundled with Mandao, or a source without a documented installer. */
  | { kind: 'manual'; note: string };

/** Pure: how to install one catalog skill. */
export function installStep(id: string, skill: CatalogSkill): InstallStep {
  const s = skill.source;
  switch (s.type) {
    case 'skills':
      return { kind: 'shell', commands: [`npx -y skills add ${s.ref}`] };
    case 'npm':
      return { kind: 'shell', commands: [`npm install --save-dev ${s.package}@${skill.version}`] };
    case 'command':
      return { kind: 'shell', commands: s.install };
    case 'plugin':
      return { kind: 'agent', commands: s.install };
    case 'git':
      return { kind: 'manual', note: `copy ${s.path ?? '.'} from ${s.url} at ${s.ref} into your harness skills folder as "${id}"` };
    case 'bundled':
      return { kind: 'manual', note: 'bundled with Mandao' };
  }
}

export function sourceLabel(skill: CatalogSkill): string {
  const s = skill.source;
  switch (s.type) {
    case 'git':
      return `${s.url}#${s.ref}${s.path ? `:${s.path}` : ''}`;
    case 'npm':
      return `npm:${s.package}`;
    case 'skills':
      return `skills:${s.ref}`;
    case 'command':
    case 'plugin':
      return s.repo;
    case 'bundled':
      return `bundled:${s.path}`;
  }
}

export interface Runner {
  /** Runs a shell command; resolves true on exit code 0. */
  run(command: string, cwd: string): boolean;
  /** True when the executable is on PATH. */
  has(bin: string): boolean;
}

export const shellRunner: Runner = {
  run: (command, cwd) => spawnSync(command, { cwd, shell: true, stdio: 'inherit' }).status === 0,
  has: (bin) => spawnSync(process.platform === 'win32' ? 'where' : 'which', [bin], { stdio: 'ignore' }).status === 0,
};

const SKILL_DIRS = ['.claude/skills', '.agents/skills', '.github/skills'];

/** Looks for `skills/<id>/SKILL.md` inside installed plugins (bounded depth). */
function inPlugins(dir: string, id: string, depth = 6): boolean {
  if (depth === 0 || !existsSync(dir)) return false;
  if (existsSync(join(dir, 'skills', id, 'SKILL.md'))) return true;
  try {
    return readdirSync(dir, { withFileTypes: true }).some(
      (e) => e.isDirectory() && !e.name.startsWith('.') && inPlugins(join(dir, e.name), id, depth - 1),
    );
  } catch {
    return false;
  }
}

/** A skill counts as installed when its verify command passes, or when a SKILL.md for it exists. */
export function isInstalled(id: string, skill: CatalogSkill, root: string, home: string, runner: Runner): boolean {
  const verify = 'verify' in skill.source ? skill.source.verify : undefined;
  if (verify) return runner.run(verify, root);
  if (skill.source.type === 'bundled') return existsSync(join(coreDir(), skill.source.path, 'SKILL.md'));
  if ([root, home].some((base) => SKILL_DIRS.some((dir) => existsSync(join(base, dir, id, 'SKILL.md'))))) return true;
  return skill.source.type === 'plugin' && inPlugins(join(home, '.claude', 'plugins'), id);
}

export interface SkillResult {
  id: string;
  step: InstallStep;
  /** `installed`: verified now · `pending`: the user must act · `failed`: the installer or verification failed. */
  status: 'installed' | 'pending' | 'failed';
  detail?: string;
}

/** The executable a shell command starts with, to check it exists before running it. */
const firstBin = (command: string) => command.trim().split(/\s+/)[0] ?? '';

/**
 * Runs the ecosystem installer for each skill (the caller has already confirmed), then verifies it.
 * When the tool is missing, the step is reported as pending so the command can be printed instead.
 */
export function installSkills(ids: string[], catalog: Catalog, root: string, home: string, runner: Runner): SkillResult[] {
  return ids.map((id) => {
    const skill = catalog.skills[id]!;
    const step = installStep(id, skill);
    if (step.kind === 'manual') {
      const ok = isInstalled(id, skill, root, home, runner);
      const detail = skill.source.type === 'bundled' && !ok ? 'not shipped in this Mandao version' : step.note;
      return { id, step, status: ok ? 'installed' : 'pending', detail };
    }
    if (step.kind === 'agent') {
      return { id, step, status: isInstalled(id, skill, root, home, runner) ? 'installed' : 'pending' };
    }
    const missing = step.commands.map(firstBin).find((bin) => !runner.has(bin));
    if (missing) return { id, step, status: 'pending', detail: `${missing} is not available` };
    for (const command of step.commands) {
      if (!runner.run(command, root)) return { id, step, status: 'failed', detail: `failed: ${command}` };
    }
    return isInstalled(id, skill, root, home, runner)
      ? { id, step, status: 'installed' }
      : { id, step, status: 'failed', detail: 'installer finished but the skill could not be verified' };
  });
}

/** Pins verified skills in the lock with their catalog metadata. */
export function pinSkills(lock: Lock, results: SkillResult[], catalog: Catalog): Lock {
  const pinned = new Map(lock.skills.map((s) => [s.id, s]));
  for (const r of results) {
    if (r.status !== 'installed') continue;
    const s = catalog.skills[r.id]!;
    pinned.set(r.id, { id: r.id, version: s.version, source: sourceLabel(s), author: s.author, license: s.license, vetted: s.vetted });
  }
  return { ...lock, skills: [...pinned.values()].sort((a, b) => a.id.localeCompare(b.id)) };
}
