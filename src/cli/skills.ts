import { join } from 'node:path';
import * as p from '@clack/prompts';
import { readCatalog } from '../engine/catalog.js';
import { LOCK_FILE, LOCK_HEADER, readConfig, readLock, writeYaml } from '../engine/files.js';
import { home } from '../engine/global.js';
import { type Catalog, type HarnessId, type Lock, MAX_PROJECT_SKILLS } from '../schemas/index.js';
import {
  describeStep,
  type InstallOptions,
  installSkills,
  installStep,
  pinSkills,
  type SkillResult,
  shellRunner,
  skillFolders,
} from '../skills/install.js';
import { type CliContext, editConfig } from './context.js';
import { c } from './output.js';
import { requireTerminal } from './terminal.js';

/** Expands packs, rejects unknown skills and enforces the project cap. Pure. */
export function selectSkills(ids: string[], catalog: Catalog, lock: Lock): { wanted: string[]; packs: string[] } {
  const packs = ids.filter((id) => id in catalog.packs);
  const wanted = [...new Set(ids.flatMap((id) => catalog.packs[id] ?? [id]))];
  const unknown = wanted.filter((id) => !(id in catalog.skills));
  if (unknown.length) {
    throw new Error(
      `Not in the catalog: ${unknown.join(', ')}. Unknown technologies get unvetted candidates or a generated skill via /mandao-constitution.`,
    );
  }
  const bootstrap = new Set(catalog.bootstrap);
  const counted = new Set([...lock.skills.map((s) => s.id), ...wanted].filter((id) => !bootstrap.has(id)));
  if (counted.size > MAX_PROJECT_SKILLS) {
    throw new Error(`That would pin ${counted.size} project skills; the cap is ${MAX_PROJECT_SKILLS}. Remove some first.`);
  }
  return { wanted, packs };
}

/** One skill as the plan shows it: vetted state, id, version, author and license, then how it installs. Pure. */
export function planLines(id: string, catalog: Catalog, harnesses: readonly HarnessId[]): string[] {
  const s = catalog.skills[id]!;
  const badge = s.vetted ? c.green('vetted  ') : c.yellow('unvetted');
  const how = describeStep(id, installStep(id, s), skillFolders(harnesses));
  return [`  ${badge} ${id}@${s.version} ${c.dim(`(${s.author}, ${s.license})`)}`, `           ${how}`];
}

function printPlan(wanted: string[], catalog: Catalog, harnesses: readonly HarnessId[]) {
  for (const id of wanted) console.log(planLines(id, catalog, harnesses).join('\n'));
}

/** Pinned skills in the order every `skills list` output uses: by id. Pure. */
function sortedPinnedSkills(skills: Lock['skills']) {
  return [...skills].sort((a, b) => a.id.localeCompare(b.id));
}

/** One terminal line per pinned skill, sorted by id. Reads only the lock, never the catalog. Pure. */
export function formatPinnedSkills(skills: Lock['skills']): string[] {
  return sortedPinnedSkills(skills).map((s) => {
    const badge = s.vetted ? c.green('vetted  ') : c.yellow('unvetted');
    return `  ${badge} ${s.id}@${s.version} ${s.source}`;
  });
}

/** Pinned skills as `{ id, version, vetted, source }`, sorted by id. Reads only the lock. Pure. */
export function pinnedSkillsJson(skills: Lock['skills']) {
  return sortedPinnedSkills(skills).map(({ id, version, vetted, source }) => ({ id, version, vetted, source }));
}

/** Keeps only the vetted or only the unvetted pinned skills; no filter keeps all. Pure. */
export function filterByVetting(skills: Lock['skills'], filter?: 'vetted' | 'unvetted'): Lock['skills'] {
  if (!filter) return skills;
  return skills.filter((s) => s.vetted === (filter === 'vetted'));
}

/** `mandao skills list`: print pinned skills (or JSON with `--json`), or the add hint when the lock is empty. */
export function skillsList(ctx: CliContext, opts: { json?: boolean; vetted?: boolean; unvetted?: boolean } = {}) {
  if (opts.vetted && opts.unvetted) throw new Error('Use either --vetted or --unvetted, not both.');
  const lock = readLock(join(ctx.root(), LOCK_FILE));
  if (!lock) throw new Error('No lock found: run `mandao sync` first.');
  const skills = filterByVetting(lock.skills, opts.vetted ? 'vetted' : opts.unvetted ? 'unvetted' : undefined);
  if (opts.json) return console.log(JSON.stringify(pinnedSkillsJson(skills), null, 2));
  const lines = formatPinnedSkills(skills);
  if (lines.length) {
    for (const line of lines) console.log(line);
    return;
  }
  console.log('  No skills pinned. Run `mandao skills add <id|pack>` to add one.');
}

const STATUS_LABEL: Record<SkillResult['status'], string> = {
  installed: c.green('installed'),
  pending: c.yellow('pending  '),
  failed: c.red('failed   '),
};

function printResults(results: SkillResult[]) {
  for (const r of results) {
    console.log(`  ${STATUS_LABEL[r.status]} ${r.id}${r.detail ? c.dim(` — ${r.detail}`) : ''}`);
    if (r.status !== 'pending' || r.step.kind === 'manual' || r.step.kind === 'copy') continue;
    const where = r.step.kind === 'agent' ? 'in your agent' : 'in a terminal';
    for (const cmd of r.step.commands) console.log(`             run ${where}: ${cmd}`);
  }
  const pending = results.filter((r) => r.status !== 'installed').length;
  console.log(
    pending ? `  Pinned the verified skills. Re-run after installing the ${pending} pending one(s).` : '  All skills verified and pinned.',
  );
}

/**
 * The install-verify-pin path shared by `skills add` and `init` (D2): runs the installers or copies
 * (the caller has already confirmed), prints each result and pins what was verified in the lock.
 */
export function installAndPin(root: string, ids: string[], catalog: Catalog, opts: InstallOptions): SkillResult[] {
  const lockPath = join(root, LOCK_FILE);
  const lock = readLock(lockPath);
  if (!lock) throw new Error('No lock found: run `mandao sync` first.');
  const results = installSkills(ids, catalog, root, home(), shellRunner, opts);
  printResults(results);
  writeYaml(lockPath, pinSkills(lock, results, catalog), LOCK_HEADER);
  return results;
}

/** `mandao skills add`: show the installers, confirm, run, verify, and pin what was verified. */
export async function skillsAdd(ctx: CliContext, ids: string[], opts: { yes?: boolean; withScripts?: boolean }) {
  const catalog = readCatalog();
  const lock = readLock(join(ctx.root(), LOCK_FILE));
  if (!lock) throw new Error('No lock found: run `mandao sync` first.');
  const { wanted, packs } = selectSkills(ids, catalog, lock);
  const harnesses = readConfig(ctx.root()).harnesses;

  printPlan(wanted, catalog, harnesses);
  if (!opts.yes) {
    requireTerminal('mandao skills add', '--yes');
    const ok = await p.confirm({ message: 'Run these installers now?' });
    if (p.isCancel(ok) || !ok) return console.log(c.dim('  Nothing installed.'));
  }

  const warn = (message: string) => console.log(c.yellow(`  ${message}`));
  installAndPin(ctx.root(), wanted, catalog, { harnesses, withScripts: opts.withScripts, warn });
  if (packs.length) {
    const current = readConfig(ctx.root()).skill_packs;
    editConfig(ctx, (doc) => doc.set('skill_packs', [...new Set([...current, ...packs])]));
  }
}
