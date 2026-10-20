import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Command } from 'commander';
import { parseDocument } from 'yaml';
import { readCatalog } from '../engine/catalog.js';
import { runDoctor } from '../engine/doctor.js';
import { CONFIG_FILE, ConfigError, LOCK_FILE, readConfig, readLock, writeYaml } from '../engine/files.js';
import { detectPackageManager, latestRunner } from '../engine/package-manager.js';
import { syncProject } from '../engine/sync.js';
import { ResolveError } from '../resolver/resolve.js';
import { HARNESS_IDS, type HarnessId, MAX_PROJECT_SKILLS, PROFILES } from '../schemas/index.js';
import { fingerprintProject, proposeSkills } from '../scripts/fingerprint.js';
import { analyzeDiff, collectDiff, DEFAULT_LIMITS } from '../scripts/quick-check.js';
import { installStep, sourceLabel } from '../skills/install.js';
import { packageInfo } from '../util/package-root.js';
import { type InitOptions, runInit } from './init.js';
import { c, printChanges, printFindings, printWarnings } from './output.js';

const root = () => process.cwd();

/** Edits config.yml in place, keeping the user's comments and ordering. */
function editConfig(mutate: (doc: ReturnType<typeof parseDocument>) => void) {
  const file = join(root(), CONFIG_FILE);
  const doc = parseDocument(readFileSync(file, 'utf8'));
  mutate(doc);
  writeFileSync(file, doc.toString({ lineWidth: 0 }));
}

function sync(opts: { force?: boolean; dryRun?: boolean; verbose?: boolean }) {
  const result = syncProject(root(), opts);
  printChanges(result.changes, opts.verbose);
  printWarnings(result.warnings);
  if (opts.dryRun) console.log(c.dim('  Dry run: nothing was written.'));
}

const program = new Command()
  .name('mandao')
  .description('Spec-Driven Development for coding agents, across harnesses. Every command is a mandao.')
  .version(packageInfo().version);

program
  .command('init')
  .description('Set up Mandao in this workspace, or install /mandao-init globally')
  .option('--scope <scope>', 'project | global')
  .option('--harness <ids...>', `harnesses to generate (${HARNESS_IDS.join(', ')})`)
  .option('--profile <profile>', `profile for every detected project (${PROFILES.join(' | ')})`)
  .option('--polyrepo <strategy>', 'workspace-repo | home | local (polyrepo only)')
  .option('--home <path>', 'home repository path when --polyrepo home')
  .option('-y, --yes', 'accept detected defaults without prompting')
  .option('--force', 'overwrite an existing config and drifted generated files')
  .action((opts: InitOptions) => runInit(root(), opts));

program
  .command('sync')
  .description('Regenerate harness files from .mandao/config.yml')
  .option('--force', 'overwrite generated files that were edited by hand')
  .option('--dry-run', 'show what would change without writing')
  .option('-v, --verbose', 'list unchanged files too')
  .action((opts) => sync(opts));

program
  .command('doctor')
  .description('Check configuration, generated files and optional tools')
  .action(() => {
    const findings = runDoctor(root());
    printFindings(findings);
    if (findings.some((f) => f.level === 'error')) process.exitCode = 1;
  });

program
  .command('update')
  .description('Re-resolve content with the installed Mandao version (overrides are never touched)')
  .option('--force', 'overwrite generated files that were edited by hand')
  .action((opts) => {
    const lock = readLock(join(root(), LOCK_FILE));
    const { version } = packageInfo();
    if (lock && lock.mandao !== version) console.log(`  mandao ${lock.mandao} → ${version}`);
    else console.log(c.dim(`  Running mandao ${version}. For the newest release: ${latestRunner(detectPackageManager())} update`));
    sync(opts);
  });

const harness = program.command('harness').description('Manage harnesses');
harness
  .command('add <ids...>')
  .description('Generate files for more harnesses')
  .action((ids: string[]) => {
    const bad = ids.filter((h) => !(HARNESS_IDS as readonly string[]).includes(h));
    if (bad.length) throw new Error(`Unknown harness: ${bad.join(', ')}. Available: ${HARNESS_IDS.join(', ')}`);
    const current = readConfig(root()).harnesses;
    const added = (ids as HarnessId[]).filter((h) => !current.includes(h));
    if (!added.length) return console.log(c.dim('  Nothing to add.'));
    editConfig((doc) => doc.set('harnesses', [...current, ...added]));
    sync({});
  });

const skills = program.command('skills').description('Manage project skills');
skills
  .command('add <ids...>')
  .description('Pin skills (or packs) from the catalog in the lock and print how to install them')
  .action((ids: string[]) => {
    const catalog = readCatalog();
    const lockPath = join(root(), LOCK_FILE);
    const lock = readLock(lockPath);
    if (!lock) throw new Error('No lock found: run `mandao sync` first.');
    const config = readConfig(root());
    const packs = ids.filter((id) => id in catalog.packs);
    const wanted = [...new Set(ids.flatMap((id) => catalog.packs[id] ?? [id]))];
    const unknown = wanted.filter((id) => !(id in catalog.skills));
    if (unknown.length)
      throw new Error(
        `Not in the catalog: ${unknown.join(', ')}. Unknown technologies get unvetted candidates or a generated skill via /mandao-constitution.`,
      );
    const bootstrap = new Set(catalog.bootstrap);
    const pinned = new Map(lock.skills.map((s) => [s.id, s]));
    for (const id of wanted) {
      const s = catalog.skills[id]!;
      const source = sourceLabel(s);
      pinned.set(id, { id, version: s.version, source, author: s.author, license: s.license, vetted: s.vetted });
    }
    const counted = [...pinned.keys()].filter((id) => !bootstrap.has(id));
    if (counted.length > MAX_PROJECT_SKILLS) {
      throw new Error(`That would pin ${counted.length} project skills; the cap is ${MAX_PROJECT_SKILLS}. Remove some first.`);
    }
    writeYaml(
      lockPath,
      { ...lock, skills: [...pinned.values()].sort((a, b) => a.id.localeCompare(b.id)) },
      '# Written by mandao. Do not edit by hand.',
    );
    if (packs.length) editConfig((doc) => doc.set('skill_packs', [...new Set([...config.skill_packs, ...packs])]));
    console.log('  Pinned in .mandao/mandao.lock. Install them with your ecosystem tooling:');
    for (const id of wanted) {
      const s = catalog.skills[id]!;
      const step = installStep(id, s);
      const how = step.kind === 'manual' ? step.note : step.commands.join(' && ');
      console.log(
        `  ${s.vetted ? c.green('vetted  ') : c.yellow('unvetted')} ${id}@${s.version} — ${how} ${c.dim(`(${s.author}, ${s.license})`)}`,
      );
    }
  });

const run = program.command('run').description('Helper scripts that Mandao commands call');
run
  .command('quick-check')
  .description('Measure the working-tree diff against the quick limits (JSON on stdout)')
  .option('--base <ref>', 'git ref to diff against', 'HEAD')
  .option('--max-files <n>', 'file limit', String(DEFAULT_LIMITS.maxFiles))
  .option('--max-loc <n>', 'changed-lines limit', String(DEFAULT_LIMITS.maxLoc))
  .action((opts: { base: string; maxFiles: string; maxLoc: string }) => {
    const config = readConfig(root());
    const repos =
      config.workspace === 'polyrepo'
        ? config.projects.map((p) => ({ dir: join(root(), p.path), prefix: p.path }))
        : [{ dir: root(), prefix: '' }];
    const files = [];
    const manifests = [];
    for (const r of repos) {
      const diff = collectDiff(r.dir, opts.base, r.prefix);
      files.push(...diff.files);
      manifests.push(...diff.manifests);
    }
    const report = analyzeDiff(files, manifests, config, { maxFiles: Number(opts.maxFiles), maxLoc: Number(opts.maxLoc) });
    console.log(JSON.stringify(report, null, 2));
  });
run
  .command('fingerprint')
  .description('Stack fingerprint per project and the skills the catalog proposes (JSON on stdout)')
  .action(() => {
    const config = readConfig(root());
    const catalog = readCatalog();
    const fingerprints = config.projects.map((p) => fingerprintProject(root(), p, catalog));
    console.log(JSON.stringify({ fingerprints, bootstrap: catalog.bootstrap, proposal: proposeSkills(fingerprints, catalog) }, null, 2));
  });

try {
  await program.parseAsync();
} catch (e) {
  if (e instanceof ConfigError || e instanceof ResolveError) {
    console.error(c.red('error'), e instanceof ResolveError ? 'content failed validation:' : 'invalid configuration:');
    for (const issue of e.issues) console.error(`  ${issue}`);
  } else {
    console.error(c.red('error'), (e as Error).message);
  }
  process.exitCode = 1;
}
