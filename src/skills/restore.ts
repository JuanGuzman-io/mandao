import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import type { Catalog, HarnessId, Lock } from '../schemas/index.js';
import { coreDir, packageInfo } from '../util/package-root.js';
import { copyNewFile, removeScratchDir } from '../writer/files.js';
import { copyGitSkill } from './git-copy.js';
import { type Runner, skillFolders, sourceLabel } from './install.js';

type Pinned = Lock['skills'][number];
export type RestoreResult = { id: string; status: 'installed' | 'present' | 'unavailable' | 'failed'; detail?: string };

const safePath = (path: string) => !isAbsolute(path) && !path.startsWith('-') && !path.split(/[\\/]/).includes('..');
const safeId = (id: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);

/** Only explicit, validated recipes can become ignored or restored. */
export function restorableSkill(skill: Pinned): boolean {
  const recipe = skill.restore;
  if (!safeId(skill.id) || !recipe || !safePath(recipe.path)) return false;
  if (recipe.type === 'bundled') {
    if (recipe.mandao !== packageInfo().version) return false;
    const source = join(coreDir(), recipe.path);
    return Boolean(
      lstatSync(source, { throwIfNoEntry: false })?.isDirectory() &&
        lstatSync(join(source, 'SKILL.md'), { throwIfNoEntry: false })?.isFile(),
    );
  }
  return Boolean(skill.commit && /^[0-9a-f]{40}$/.test(skill.commit) && /^https:\/\//i.test(recipe.url));
}

const COPY_DIRS = ['.claude/skills', '.agents/skills', '.github/skills'];

/**
 * The invocation policy a legacy git copy was installed with, read from the copy itself: Mandao writes
 * `disable-model-invocation: true` (SKILL.md) or `allow_implicit_invocation: false` (Codex) when it is off.
 * Undefined when no copy is on disk: nothing proves it.
 */
function installedInvocation(root: string, id: string): boolean | undefined {
  const copies = COPY_DIRS.map((dir) => join(root, dir, id)).filter((dir) => existsSync(join(dir, 'SKILL.md')));
  if (!copies.length) return undefined;
  const disabled = copies.some(
    (dir) =>
      /^disable-model-invocation:[ \t]*true[ \t]*\r?$/m.test(readFileSync(join(dir, 'SKILL.md'), 'utf8')) ||
      (existsSync(join(dir, 'agents/openai.yaml')) &&
        /^[ \t]*allow_implicit_invocation:[ \t]*false\b/m.test(readFileSync(join(dir, 'agents/openai.yaml'), 'utf8'))),
  );
  return !disabled;
}

/**
 * Recover an old lock recipe only when the installed catalog agrees with the complete old pin. A git pin also needs
 * the same commit in the catalog and a copy on disk (`root`) that shows its invocation policy; `sync` then writes
 * the recipe into the lock, so a clone without the copies can restore them.
 */
export function enrichLegacySkills(skills: Pinned[], catalog: Catalog, mandao: string, root?: string): Pinned[] {
  return skills.map((skill) => {
    if (skill.restore) return skill;
    const entry = catalog.skills[skill.id];
    if (!entry || entry.version !== skill.version || sourceLabel(entry) !== skill.source) return skill;
    const source = entry.source;
    if (source.type === 'bundled') return { ...skill, restore: { type: 'bundled', path: source.path, mandao } };
    if (source.type !== 'git' || !root || !safeId(skill.id) || skill.commit !== source.commit) return skill;
    const invocation = installedInvocation(root, skill.id);
    if (invocation === undefined) return skill;
    // Either side saying off wins: an edited copy never loosens what the catalog sets today (review F2).
    const model_invocation = invocation && entry.model_invocation;
    return { ...skill, restore: { type: 'git', url: source.url, path: source.path ?? '.', model_invocation } };
  });
}

function copyBundledFiles(source: string, target: string) {
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const from = join(source, entry.name);
    const to = join(target, entry.name);
    if (entry.isDirectory()) copyBundledFiles(from, to);
    else if (entry.isFile()) copyNewFile(from, to);
  }
}

function restoreBundled(skill: Pinned, root: string, targets: string[]): RestoreResult {
  const recipe = skill.restore;
  if (recipe?.type !== 'bundled') return { id: skill.id, status: 'unavailable' };
  if (recipe.mandao !== packageInfo().version) return { id: skill.id, status: 'failed', detail: `requires Mandao ${recipe.mandao}` };
  const source = join(coreDir(), recipe.path);
  if (!lstatSync(source, { throwIfNoEntry: false })?.isDirectory() || !existsSync(join(source, 'SKILL.md')))
    return { id: skill.id, status: 'failed', detail: 'bundled source is missing' };
  const written: string[] = [];
  try {
    for (const target of targets) {
      written.push(target);
      copyBundledFiles(source, join(root, target));
    }
    return { id: skill.id, status: 'installed', detail: targets.join(', ') };
  } catch (error) {
    for (const target of written) removeScratchDir(join(root, target), root);
    return { id: skill.id, status: 'failed', detail: String(error) };
  }
}

function wrongBundledVersion(skill: Pinned, root: string, harnesses: readonly HarnessId[]): RestoreResult | undefined {
  const recipe = skill.restore;
  if (recipe?.type !== 'bundled' || !safeId(skill.id) || !safePath(recipe.path) || recipe.mandao === packageInfo().version) return;
  const missing = skillFolders(harnesses).some((folder) => !lstatSync(join(root, folder, skill.id), { throwIfNoEntry: false }));
  return missing ? { id: skill.id, status: 'failed', detail: `requires Mandao ${recipe.mandao}` } : { id: skill.id, status: 'present' };
}

/** Restore only absent targets, using the lock rather than mutable catalog refs. */
export function restoreSkills(skills: Pinned[], root: string, harnesses: readonly HarnessId[], runner: Runner): RestoreResult[] {
  return skills.map((skill): RestoreResult => {
    const recipe = skill.restore;
    const wrongVersion = wrongBundledVersion(skill, root, harnesses);
    if (wrongVersion) return wrongVersion;
    if (!restorableSkill(skill)) return { id: skill.id, status: 'unavailable', detail: 'no reproducible recipe in lock' };
    const folders = skillFolders(harnesses);
    const missing = folders.filter((folder) => !lstatSync(join(root, folder, skill.id), { throwIfNoEntry: false }));
    if (!missing.length) return { id: skill.id, status: 'present' };
    if (!recipe) return { id: skill.id, status: 'unavailable' };
    if (recipe.type === 'bundled')
      return restoreBundled(
        skill,
        root,
        missing.map((folder) => `${folder}/${skill.id}`),
      );
    const step = { kind: 'copy' as const, url: recipe.url, ref: skill.commit!, commit: skill.commit!, path: recipe.path };
    const result = copyGitSkill(skill.id, step, root, runner, {
      folders: missing,
      manual: `restore ${skill.id} from ${recipe.url}`,
      withScripts: skill.scripts,
      modelInvocation: recipe.model_invocation,
    });
    return { id: skill.id, status: result.status === 'installed' ? 'installed' : 'failed', detail: result.detail };
  });
}
