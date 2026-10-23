import { join, posix, relative, sep } from 'node:path';
import { LOCK_FILE } from '../engine/files.js';
import { declaredCovers, type Progress, type Task } from '../spec/index.js';

/** What a Reviewer was shown for a change set: source diff paths and generated files seen only as receipts. */
export interface ReviewScope {
  /** Changed paths shown as a source diff (never the lock, whose rule is below). */
  reviewed: string[];
  /** Generated files shown only as hash receipts, with the source they were rendered from. */
  receipts: { path: string; origin: string }[];
}

export const posixPath = (p: string) => p.split(sep).join('/');

/** Repo-relative path of the lock of the workspace at `home`. */
export const lockPath = (repo: string, home: string = repo): string => posixPath(relative(repo, join(home, LOCK_FILE)));

/**
 * The files an origin id is rendered from, as workspace-relative paths (core and overrides; a folder or a file).
 * Origins without a source file in the repo (`block:*`, `guide:*`, `rules:*`) have none: a generated file from
 * them is never in scope through its origin. A diagram receipt's origin is already a path.
 */
export function originSources(origin: string): string[] {
  const [kind, name = '', variant] = origin.split(':');
  const overrides = '.mandao/overrides';
  if (kind === 'command')
    return [`core/commands/${name}.md`, `${overrides}/commands/${name}.md`, `${overrides}/commands/${name}.patch.yml`];
  if (kind === 'persona')
    return [`core/personas/${name}.md`, `${overrides}/personas/${name}.md`, `${overrides}/personas/${name}.patch.yml`];
  if (kind === 'template')
    return [`core/templates/${origin.slice('template:'.length)}`, `${overrides}/templates/${origin.slice('template:'.length)}`];
  if (kind === 'config' && variant === undefined) return ['.mandao/config.yml'];
  return origin.includes('/') && !origin.includes(':') ? [origin] : [];
}

/** Mandao content a generated file can be rendered from: `core/`, `.mandao/overrides/` and `.mandao/config.yml`. */
const contentSource = (p: string) => p === '.mandao/config.yml' || /^(core|\.mandao\/overrides)(\/|$)/.test(p);

/**
 * The files of a task's commit that are out of scope: neither declared by the task nor reviewed. `reviewed`
 * and `receipts` come from the Reviewer's approval of that task (`ReviewScope`).
 *
 * - declared: the task's `files` (workspace paths, mapped into the repo like origins), normalized like the
 *   planner does; a glob is matched, never widened (`declaredCovers`).
 * - reviewed: shown to the Reviewer as a source diff.
 * - a generated file shown as a receipt: in scope when its precise origin source is declared or reviewed, or
 *   when any Mandao content source (`core/`, `.mandao/overrides/`, `.mandao/config.yml`) is declared or
 *   reviewed in the same task (command and persona renders embed shared rules and blocks). A Mandao upgrade
 *   that changed no source (only the version) leaves its regenerated files out of scope.
 * - the lock (`home` is the workspace root): in scope only when an in-scope generated file changed with it.
 */
export function outOfScope(files: string[], declared: string[], scope: ReviewScope, repo: string, home: string): string[] {
  const homeInRepo = posixPath(relative(repo, home));
  const inRepo = (p: string) => (homeInRepo ? posix.join(homeInRepo, p) : p);
  const inHome = (p: string) => (homeInRepo ? (p.startsWith(`${homeInRepo}/`) ? p.slice(homeInRepo.length + 1) : undefined) : p);
  const bounded = declared
    .map((d) => posix.normalize(d.replaceAll('\\', '/')).replace(/^\/+/, ''))
    .filter((d) => d !== '..' && !d.startsWith('../'));
  const isDeclared = (p: string) => bounded.some((d) => declaredCovers(inRepo(d), p));
  const reviewed = new Set(scope.reviewed);
  const sourceChanged = (src: string) => isDeclared(inRepo(src)) || reviewed.has(inRepo(src));
  const anyContent =
    bounded.some((d) => contentSource(d)) ||
    scope.reviewed.some((p) => {
      const rel = inHome(p);
      return rel !== undefined && contentSource(rel);
    });
  const generated = new Set(scope.receipts.filter((r) => anyContent || originSources(r.origin).some(sourceChanged)).map((r) => r.path));
  const lock = lockPath(repo, home);
  const generatedInScope = files.some((f) => generated.has(f));
  return files.filter((f) => !(isDeclared(f) || reviewed.has(f) || generated.has(f) || (f === lock && generatedInScope))).sort();
}

/**
 * Per task, the out-of-scope files of its pending entry. The scope is the one recorded with the entry; an
 * entry without it predates the brake and is not checked, unless its approved manifest recorded a scope (the
 * entry was edited by hand): then nothing was reviewed and only declared files pass.
 */
export function strayByTask(
  entries: Progress['pending_commits'],
  tasks: Task[],
  approvedManifests: Progress['approved_manifests'],
  repo: string,
  home: string,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const entry of entries) {
    const approved = approvedManifests.some((m) => m.task === entry.task && m.reviewed);
    const scope = entry.reviewed
      ? { reviewed: entry.reviewed, receipts: entry.receipts ?? [] }
      : approved
        ? { reviewed: [], receipts: [] }
        : undefined;
    if (!scope) continue;
    const stray = outOfScope(entry.files, tasks.find((t) => t.id === entry.task)?.files ?? [], scope, repo, home);
    if (stray.length) out[entry.task] = stray;
  }
  return out;
}

/** The refusal text: the files per task and the real ways out. */
export function outOfScopeMessage(stray: Record<string, string[]>): string {
  const listed = Object.entries(stray)
    .map(([task, files]) => `${task}: ${files.join(', ')}`)
    .join('; ');
  return `files would enter the commit that are not in the task's declared files and not in the reviewed diff (${listed}); declare them in the task's files, commit them separately outside the task (e.g. a chore commit), or, for generated files, commit the source change they come from in the same task (a generated file is in scope when its source, or any core/, .mandao/overrides/ or .mandao/config.yml file, is declared or reviewed in the task; .mandao/mandao.lock only rides with an in-scope generated file)`;
}

/** The refusal for a hand commit that already carries out-of-scope files: the task stays pending. */
export function reconcileMessage(stray: Record<string, string[]>, othersCommitted: boolean): string {
  const listed = Object.entries(stray)
    .map(([task, files]) => `${task}: ${files.join(', ')}`)
    .join('; ');
  return `a hand commit already carries files that are not in the task's declared files and not in the reviewed diff (${listed}); the files are already in the hand commit: amend or revert that commit, or declare the files in tasks.md and get the task re-reviewed.${othersCommitted ? ' The other pending tasks were committed as usual' : ''}`;
}
