import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import type { Command } from 'commander';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { readCatalog } from '../engine/catalog.js';
import { LOCK_FILE, LOCK_HEADER, readLock, writeYaml } from '../engine/files.js';
import { home } from '../engine/global.js';
import type { Catalog, Config, Lock } from '../schemas/index.js';
import { branchingFor } from '../scripts/branching.js';
import { repoRoot, type SpecCommit } from '../scripts/commits.js';
import { mockDecision } from '../scripts/mockups.js';
import type { SpecFolder } from '../scripts/spec.js';
import { installSkills, installStep, pinSkills, type SkillResult, shellRunner, skillFolders } from '../skills/install.js';
import { emojiPrefix, specTrailers } from '../spec/index.js';
import { makeScratchDir, removeScratchDir } from '../writer/files.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { skillsToOffer, specId } from './mock-skills.js';
import { loadSpec } from './spec-context.js';

const git = (cwd: string, args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const exists = (path: string) => lstatSync(path, { throwIfNoEntry: false }) !== undefined;
const NOTHING_TO_COMMIT = 'the mock skills are already installed and committed';
const LOCK_REFUSAL = 'the lock has uncommitted changes: commit or discard them first, so the skill commit carries only the install';

interface Install {
  root: string;
  repo: string;
  config: Config;
  catalog: Catalog;
  ids: string[];
  /** Relative to the repository: the lock first, then `<folder>/<id>` per harness folder and skill. */
  paths: string[];
}

const rel = (i: Pick<Install, 'root' | 'repo'>, p: string) => relative(i.repo, join(i.root, p)).split('\\').join('/');
const dirty = (i: Install, p: string) => git(i.repo, ['status', '--porcelain', '--', rel(i, p)]).trim() !== '';

/** Every entry under `dir` with its bytes (base64); anything but a regular file or folder is a mismatch marker. */
function tree(dir: string, prefix = ''): [string, string][] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e): [string, string][] => {
    const path = `${prefix}${e.name}`;
    if (e.isDirectory()) return tree(join(dir, e.name), `${path}/`);
    return [[path, e.isFile() ? readFileSync(join(dir, e.name), 'base64') : `not a file: ${path}`]];
  });
}
const sameTree = (a: string, b: string) => existsSync(b) && JSON.stringify(tree(a).sort()) === JSON.stringify(tree(b).sort());

/** Each folder holds exactly what installing `id` at the catalog commit writes there, or the fetch did not complete. */
type Verdict = 'match' | 'mismatch' | { fetch: string };

/** Installs `id` at the catalog commit into a scratch folder and compares each folder with that copy, byte for byte. */
function verifyAgainstCatalog(i: Install, id: string, folders: string[]): Verdict {
  const scratch = makeScratchDir('mandao-verify-');
  try {
    const [r] = installSkills([id], i.catalog, scratch, home(), shellRunner, { harnesses: i.config.harnesses, warn: () => {} });
    if (r?.status !== 'installed') return { fetch: r?.detail ?? 'the install gave no result' };
    return folders.every((f) => sameTree(join(i.root, f, id), join(scratch, f, id))) ? 'match' : 'mismatch';
  } finally {
    removeScratchDir(scratch, tmpdir());
  }
}

/** True when git ignores `path` (relative to the repository), so the skill commit could not carry it. */
function ignored(repo: string, path: string): boolean {
  try {
    execFileSync('git', ['check-ignore', '-q', '--', path], { cwd: repo, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** A pin exactly as `skills add` / `pinSkills` writes it from the catalog: the copies were verified. */
const verifiedResult = (i: Install, id: string): SkillResult => ({
  id,
  step: installStep(id, i.catalog.skills[id]!),
  status: 'installed',
  detail: 'adopted: the copies match the pinned catalog commit',
});

/**
 * Review F1-F4 (rounds 1 and 2): nothing is pinned or committed unverified. Every install path ignored by git is
 * refused; a skill folder that is a symlink is refused before it is read; every existing copy of an unpinned skill,
 * and every uncommitted copy of a pinned one, must match a fresh install at the catalog commit (adopted), else the
 * command stops and names the folders to remove. A fetch that cannot run is reported as such. Returns the adopted ids.
 */
function verifyFolders(i: Install, pinned: (id: string) => boolean): Set<string> {
  const skipped = i.paths.filter((p) => ignored(i.repo, p));
  if (skipped.length)
    throw new Error(
      `${skipped.join(', ')} is ignored by git, so the skill commit cannot carry it: change .gitignore, then run mock-install again`,
    );
  // Review round 3 F4: a skills parent folder (or its harness folder) that is a symlink would send the copy elsewhere.
  const parents = skillFolders(i.config.harnesses).flatMap((f) => [f.split('/')[0]!, f]);
  const linked = [...new Set(parents)].find((p) => lstatSync(join(i.root, p), { throwIfNoEntry: false })?.isSymbolicLink());
  if (linked) throw new Error(`${linked} is a symlink: make it a real folder, then run mock-install again`);
  const adopted = new Set<string>();
  const unverified: string[] = [];
  for (const id of i.ids) {
    const existing = skillFolders(i.config.harnesses).filter((f) => exists(join(i.root, f, id)));
    const link = existing.find((f) => lstatSync(join(i.root, f, id)).isSymbolicLink());
    if (link) throw new Error(`${link}/${id} is a symlink: remove it so mock-install can copy the skill, then run mock-install again`);
    const check = existing.filter((f) => !pinned(id) || dirty(i, `${f}/${id}`));
    if (!check.length) continue;
    const verdict = verifyAgainstCatalog(i, id, check);
    const list = check.map((f) => `${f}/${id}`).join(', ');
    if (typeof verdict === 'object')
      throw new Error(`could not fetch ${id} to verify ${list}: ${verdict.fetch}; check the network and git, then run mock-install again`);
    if (verdict === 'match') adopted.add(id);
    else unverified.push(list);
  }
  if (unverified.length) {
    const list = unverified.join(', ');
    throw new Error(`${list} could not be verified against the pinned catalog commit: remove ${list}, then run mock-install again`);
  }
  return adopted;
}

/** The committed lock (`HEAD`), parsed; undefined when HEAD has none or it does not parse as a lock. */
function headLock(i: Install): Lock | undefined {
  try {
    const head = parseYaml(git(i.repo, ['show', `HEAD:${rel(i, LOCK_FILE)}`])) as Lock;
    return Array.isArray(head?.skills) ? head : undefined;
  } catch {
    return undefined;
  }
}

/** The lock as `writeYaml` writes it: the committed lock with only the mock skills' entries taken from `now`. */
function lockWithMockPins(head: Lock, now: Lock, ids: string[]): string {
  const skills = [...head.skills.filter((s) => !ids.includes(s.id)), ...now.skills.filter((s) => ids.includes(s.id))];
  const lock = { ...head, skills: skills.sort((a, b) => a.id.localeCompare(b.id)) };
  return `${LOCK_HEADER}\n${stringifyYaml(lock, { lineWidth: 0 })}`;
}

/** Review F3: a lock changed (staged or not) by anything but the mock skills' own pins would ride in the skill commit. */
function checkLock(i: Install, head: Lock | undefined) {
  if (!dirty(i, LOCK_FILE)) return;
  const text = readFileSync(join(i.root, LOCK_FILE), 'utf8');
  const now = parseYaml(text) as Lock;
  if (!head || !Array.isArray(now?.skills) || lockWithMockPins(head, now, i.ids) !== text) throw new Error(LOCK_REFUSAL);
  const withScripts = now.skills.find((s) => i.ids.includes(s.id) && s.scripts);
  if (withScripts)
    throw new Error(
      `${withScripts.id}: mock skills are installed without scripts; reinstall without --with-scripts (remove its folders and restore ${LOCK_FILE} from git, then run mock-install again)`,
    );
  // Review round 2 F6: the mock skills' own pins must be what pinSkills writes from the catalog, never hand-edited.
  const expected = pinSkills(
    { ...now, skills: [] },
    i.ids.map((id) => verifiedResult(i, id)),
    i.catalog,
  ).skills;
  for (const pin of now.skills.filter((s) => i.ids.includes(s.id)))
    if (canonical(pin) !== canonical(expected.find((e) => e.id === pin.id)))
      throw new Error(
        `the lock pin of ${pin.id} differs from the catalog (edited by hand?): restore ${LOCK_FILE} from git, then run mock-install again`,
      );
}

/** JSON with sorted keys, to compare two pins whatever their key order. */
const canonical = (value: unknown) =>
  JSON.stringify(value, (_, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v));

/**
 * Refuses before anything is written: a protected branch, a foreign or hand-edited lock change, other staged changes
 * (cheap), then ignored paths, symlinked folders or copies that do not verify (may fetch). Returns the adopted ids.
 */
function preflight(i: Install): Set<string> {
  const branch = git(i.repo, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
  if (branchingFor(i.config).protected.includes(branch))
    throw new Error(`${branch} is a protected branch: install the mock skills from the spec's branch or worktree`);
  if (!readLock(join(i.root, LOCK_FILE))) throw new Error('No lock found: run `mandao sync` first.');
  // Review round 3 F2: the cheap refusals run before any third-party fetch.
  const head = headLock(i);
  checkLock(i, head);
  const mine = (p: string) => i.paths.some((o) => p === o || p.startsWith(`${o}/`));
  const other = git(i.repo, ['diff', '--cached', '--name-only'])
    .split('\n')
    .filter((p) => p && !mine(p));
  if (other.length)
    throw new Error(
      `other changes are staged (${other.join(', ')}): commit or unstage them first; mock-install commits only the skills it installs`,
    );
  // Review round 3 F1: "pinned" is what HEAD pins; a pin only in the working lock proves nothing about the folder.
  return verifyFolders(i, (id) => Boolean(head?.skills.some((s) => s.id === id)));
}

/**
 * Installs what is missing in any harness folder (F11: every copy, not one), pins the verified (adopted) copies from
 * the catalog, and leaves committed, pinned copies alone. Returns each result; `warn` collects the installer's warnings.
 */
function install(i: Install, adopted: Set<string>, warn: (m: string) => void): SkillResult[] {
  const lockPath = join(i.root, LOCK_FILE);
  const lock = readLock(lockPath);
  if (!lock) throw new Error('No lock found: run `mandao sync` first.');
  const pinned = (id: string) => lock.skills.some((s) => s.id === id);
  const missing = (id: string) =>
    i.catalog.skills[id]!.source.type === 'git' ? skillFolders(i.config.harnesses).some((f) => !exists(join(i.root, f, id))) : !pinned(id);
  const todo = i.ids.filter(missing);
  const kept = i.ids.filter((id) => adopted.has(id) && !todo.includes(id)).map((id) => verifiedResult(i, id));
  const fresh = todo.length ? installSkills(todo, i.catalog, i.root, home(), shellRunner, { harnesses: i.config.harnesses, warn }) : [];
  const results = [...fresh, ...kept];
  if (results.length) writeYaml(lockPath, pinSkills(lock, results, i.catalog), LOCK_HEADER);
  return results;
}

/** `[<emoji> ]chore(<scope>): install mock skills for <ID>` with `Refs: <ID>`, staging only the install paths. Local only. */
function commitInstall(i: Install, spec: SpecFolder): SpecCommit {
  const present = i.paths.filter((p) => exists(join(i.repo, p)));
  git(i.repo, ['add', '--', ...present]);
  if (!git(i.repo, ['diff', '--cached', '--name-only', '--', ...present]).trim()) return { committed: false, reason: NOTHING_TO_COMMIT };
  const id = specId(spec);
  const scope = i.config.projects.length > 1 ? 'specs' : (spec.story?.meta.projects[0] ?? i.config.projects[0]!.name);
  const header = `${emojiPrefix(i.config, 'chore')}chore(${scope}): install mock skills for ${id}`;
  try {
    git(i.repo, ['commit', '-q', '-m', [header, '', ...specTrailers(i.config, { ...spec.story?.meta, id })].join('\n'), '--', ...present]);
  } catch (e) {
    return { committed: false, reason: String((e as { stderr?: string }).stderr || (e as Error).message).trim() };
  }
  return { committed: true, sha: git(i.repo, ['rev-parse', '--short', 'HEAD']).trim() };
}

/**
 * `mandao run mock-install <spec> --yes` (trial 13 D3): installs the accepted mock's skills and commits them on
 * their own, before the first task, so they never enter the approval commit, a task commit or a review pack.
 */
function mockInstall(ctx: CliContext, ref: string, yes: boolean | undefined) {
  const { config, spec } = loadSpec(ctx, ref);
  const decision = mockDecision(spec.dir)?.decision;
  if (decision !== 'accepted')
    throw new Error(`${specId(spec)}: the mock is ${decision ?? 'not decided'}: mock-install runs only after mock-offer --record accepted`);
  if (!yes) throw new Error('mock-install installs unvetted third-party content: pass --yes once the person agreed');
  const root = ctx.root();
  const repo = repoRoot(spec.dir);
  const ids = skillsToOffer(root, config, spec, []).map((s) => s.id);
  const paths = [LOCK_FILE, ...ids.flatMap((id) => skillFolders(config.harnesses).map((f) => `${f}/${id}`))].map((p) =>
    rel({ root, repo }, p),
  );
  const i: Install = { root, repo, config, catalog: readCatalog(), ids, paths };
  const adopted = preflight(i);
  const warnings: string[] = [];
  const results = install(i, adopted, (m) => warnings.push(m));
  for (const w of warnings) process.stderr.write(`${w}\n`);
  const failed = results.filter((r) => r.status !== 'installed');
  const commit: SpecCommit = failed.length
    ? { committed: false, reason: `not installed: ${failed.map((r) => r.id).join(', ')}; nothing committed` }
    : commitInstall(i, spec);
  const installed = results.map((r) => ({ id: r.id, status: r.status, ...(r.detail ? { detail: r.detail } : {}) }));
  json({ installed, commit, ...(warnings.length ? { warnings } : {}) });
  if (failed.length || (!commit.committed && commit.reason !== NOTHING_TO_COMMIT)) process.exitCode = 1;
}

export function registerMockInstall(run: Command, ctx: CliContext) {
  run
    .command('mock-install <spec>')
    .description('Install the accepted mock skills and commit them on their own, before the first task (JSON)')
    .option('--yes', 'the person agreed to install these unvetted third-party skills')
    .action((ref: string, o: { yes?: boolean }) => mockInstall(ctx, ref, o.yes));
}
