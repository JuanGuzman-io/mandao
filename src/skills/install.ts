import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Catalog, CatalogSkill, HarnessId, Lock } from '../schemas/index.js';
import { coreDir } from '../util/package-root.js';
import { copyGitSkill } from './git-copy.js';

export type InstallStep =
  /** Commands Mandao runs after confirmation. */
  | { kind: 'shell'; commands: string[] }
  /** Commands the user runs inside the agent (e.g. `/plugin install …`). */
  | { kind: 'agent'; commands: string[] }
  /** A `git` source: fetch `ref`, check it is `commit`, copy `path` into each harness skills folder (D3). */
  | { kind: 'copy'; url: string; ref: string; commit: string; path: string }
  /** Nothing to run: bundled with Mandao, or a source without a documented installer. */
  | { kind: 'manual'; note: string };

/** Pure: how to install one catalog skill. */
export function installStep(_id: string, skill: CatalogSkill): InstallStep {
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
      return { kind: 'copy', url: s.url, ref: s.ref, commit: s.commit, path: s.path ?? '.' };
    case 'bundled':
      return { kind: 'manual', note: 'bundled with Mandao' };
  }
}

/** Pure: one line saying how a step installs the skill; a copy names the folders it would write. */
export function describeStep(id: string, step: InstallStep, folders: readonly string[]): string {
  switch (step.kind) {
    case 'shell':
    case 'agent':
      return step.commands.join(' && ');
    case 'copy':
      return `copy ${step.path} from ${step.url} at ${step.ref} (commit ${step.commit}) into ${folders.map((f) => `${f}/${id}`).join(', ')}`;
    case 'manual':
      return step.note;
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

/** The project skills folder each harness reads, from its official docs (D3, P4). */
const HARNESS_FOLDER: Record<HarnessId, string> = {
  claude: '.claude/skills',
  codex: '.agents/skills',
  antigravity: '.agents/skills',
  opencode: '.agents/skills',
  copilot: '.github/skills',
};
/** Harnesses that also read `.claude/skills` and `.agents/skills`: they add no folder when one is already a target. */
const READS_SHARED: readonly HarnessId[] = ['opencode', 'copilot'];
const SHARED_FOLDERS = ['.claude/skills', '.agents/skills'];

/** Pure: every project skills folder this harness reads, its own first (detection, unlike the copy target). */
export function readableSkillFolders(harness: HarnessId): string[] {
  return [...new Set([HARNESS_FOLDER[harness], ...(READS_SHARED.includes(harness) ? SHARED_FOLDERS : [])])];
}

/** Pure: the folders a skill is copied into for these harnesses, each once. */
export function skillFolders(harnesses: readonly HarnessId[]): string[] {
  const out: string[] = [];
  const add = (folder: string) => {
    if (!out.includes(folder)) out.push(folder);
  };
  for (const h of harnesses) if (!READS_SHARED.includes(h)) add(HARNESS_FOLDER[h]);
  for (const h of READS_SHARED) {
    if (harnesses.includes(h) && !out.some((f) => SHARED_FOLDERS.includes(f))) add(HARNESS_FOLDER[h]);
  }
  return out;
}

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
  /** A `git` copy that included the skill's scripts (`--with-scripts`). */
  scripts?: boolean;
}

export interface InstallOptions {
  /** Harnesses whose skills folders a `git` source is copied into; default Claude Code. */
  harnesses?: readonly HarnessId[];
  /** Copy a `git` skill's executable scripts too (C-2); off by default. */
  withScripts?: boolean;
  /** Called before any script is copied; default prints to stdout. */
  warn?: (message: string) => void;
}

/** The executable a shell command starts with, to check it exists before running it. */
const firstBin = (command: string) => command.trim().split(/\s+/)[0] ?? '';

function runShell(id: string, step: InstallStep & { kind: 'shell' }, skill: CatalogSkill, root: string, home: string, runner: Runner) {
  const missing = step.commands.map(firstBin).find((bin) => !runner.has(bin));
  if (missing) return { id, step, status: 'pending', detail: `${missing} is not available` } satisfies SkillResult;
  for (const command of step.commands) {
    if (!runner.run(command, root)) return { id, step, status: 'failed', detail: `failed: ${command}` } satisfies SkillResult;
  }
  return isInstalled(id, skill, root, home, runner)
    ? ({ id, step, status: 'installed' } satisfies SkillResult)
    : ({ id, step, status: 'failed', detail: 'installer finished but the skill could not be verified' } satisfies SkillResult);
}

/**
 * Runs the ecosystem installer for each skill (the caller has already confirmed), then verifies it.
 * A `git` source is copied at its pinned commit into each harness skills folder. When the tool is
 * missing, the step is reported as pending so the command can be printed instead.
 */
export function installSkills(
  ids: string[],
  catalog: Catalog,
  root: string,
  home: string,
  runner: Runner,
  opts: InstallOptions = {},
): SkillResult[] {
  return ids.map((id): SkillResult => {
    const skill = catalog.skills[id]!;
    const step = installStep(id, skill);
    switch (step.kind) {
      case 'manual': {
        const ok = isInstalled(id, skill, root, home, runner);
        const detail = skill.source.type === 'bundled' && !ok ? 'not shipped in this Mandao version' : step.note;
        return { id, step, status: ok ? 'installed' : 'pending', detail };
      }
      case 'agent':
        return { id, step, status: isInstalled(id, skill, root, home, runner) ? 'installed' : 'pending' };
      case 'copy': {
        const folders = skillFolders(opts.harnesses ?? ['claude']);
        const outcome = copyGitSkill(id, step, root, runner, { ...opts, folders, manual: describeStep(id, step, folders) });
        return { id, step, ...outcome };
      }
    }
    return runShell(id, step, skill, root, home, runner);
  });
}

/** Pins verified skills in the lock with their catalog metadata, the commit of a `git` source and whether scripts were copied. */
export function pinSkills(lock: Lock, results: SkillResult[], catalog: Catalog): Lock {
  const pinned = new Map(lock.skills.map((s) => [s.id, s]));
  for (const r of results) {
    if (r.status !== 'installed') continue;
    const s = catalog.skills[r.id]!;
    const commit = s.source.type === 'git' ? s.source.commit : undefined;
    pinned.set(r.id, {
      id: r.id,
      version: s.version,
      source: sourceLabel(s),
      author: s.author,
      license: s.license,
      vetted: s.vetted,
      ...(commit ? { commit } : {}),
      ...(r.scripts ? { scripts: true } : {}),
    });
  }
  return { ...lock, skills: [...pinned.values()].sort((a, b) => a.id.localeCompare(b.id)) };
}
