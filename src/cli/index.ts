import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as p from '@clack/prompts';
import { Command } from 'commander';
import { parseDocument } from 'yaml';
import { readCatalog } from '../engine/catalog.js';
import { runDoctor } from '../engine/doctor.js';
import { CONFIG_FILE, ConfigError, LOCK_FILE, LOCK_HEADER, readConfig, readLock, readModels, writeYaml } from '../engine/files.js';
import { home } from '../engine/global.js';
import { detectPackageManager, latestRunner } from '../engine/package-manager.js';
import { syncProject } from '../engine/sync.js';
import { readRecommendations } from '../models/load.js';
import { recommendationOffers } from '../models/offers.js';
import { independence } from '../models/resolve.js';
import { ResolveError } from '../resolver/resolve.js';
import { HARNESS_IDS, type HarnessId, MAX_PROJECT_SKILLS, PROFILES, ROLES, TIERS, type Tier } from '../schemas/index.js';
import { fingerprintProject, proposeSkills } from '../scripts/fingerprint.js';
import { analyzeDiff, collectDiff, DEFAULT_LIMITS } from '../scripts/quick-check.js';
import { installSkills, installStep, pinSkills, shellRunner } from '../skills/install.js';
import { packageInfo } from '../util/package-root.js';
import { type InitOptions, runInit } from './init.js';
import { isHarness, printModels, resolveForCli, setMode, setModel } from './models.js';
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
  .option('--default-profile <profile>', 'workspace default profile')
  .option('--language-business <lang>', 'language of business content (story, release notes, PO questions)')
  .option('--language-technical <lang>', 'language of technical content (requirements, design, tasks)')
  .option('--models-mode <mode>', 'simple | routed')
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
  .description('Re-resolve content with the installed Mandao version (overrides and model choices are never touched)')
  .option('--force', 'overwrite generated files that were edited by hand')
  .action((opts) => {
    const lockPath = join(root(), LOCK_FILE);
    const lock = readLock(lockPath);
    const { version } = packageInfo();
    if (lock && lock.mandao !== version) console.log(`  mandao ${lock.mandao} → ${version}`);
    else console.log(c.dim(`  Running mandao ${version}. For the newest release: ${latestRunner(detectPackageManager())} update`));
    sync(opts);

    const recs = readRecommendations();
    const offers = recommendationOffers(readModels(root()), recs, lock?.recommendations ?? {});
    for (const o of offers) {
      const [role, tier] = o.role.split('.');
      console.log(
        `  ${c.blue('offer')} ${o.harness}.${o.role}: Mandao now recommends ${o.recommended} (you use ${o.current}) → mandao models set ${role} "${o.recommended}" --harness ${o.harness}${tier ? ` --tier ${tier}` : ''}`,
      );
    }
    const fresh = readLock(lockPath);
    if (fresh) {
      const seen = Object.fromEntries(Object.entries(recs.harnesses).map(([h, r]) => [h, r!.reviewed]));
      writeYaml(lockPath, { ...fresh, recommendations: seen }, LOCK_HEADER);
    }
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
  .description('Install catalog skills (or packs) with their ecosystem tool, verify them and pin them in the lock')
  .option('-y, --yes', 'install without asking for confirmation (CI)')
  .action(async (ids: string[], opts: { yes?: boolean }) => {
    const catalog = readCatalog();
    const lockPath = join(root(), LOCK_FILE);
    const lock = readLock(lockPath);
    if (!lock) throw new Error('No lock found: run `mandao sync` first.');
    const config = readConfig(root());
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

    for (const id of wanted) {
      const s = catalog.skills[id]!;
      const step = installStep(id, s);
      const how = step.kind === 'manual' ? step.note : step.commands.join(' && ');
      console.log(
        `  ${s.vetted ? c.green('vetted  ') : c.yellow('unvetted')} ${id}@${s.version} ${c.dim(`(${s.author}, ${s.license})`)}\n           ${how}`,
      );
    }
    if (!opts.yes) {
      const ok = await p.confirm({ message: 'Run these installers now?' });
      if (p.isCancel(ok) || !ok) return console.log(c.dim('  Nothing installed.'));
    }

    const results = installSkills(wanted, catalog, root(), home(), shellRunner);
    for (const r of results) {
      const label = r.status === 'installed' ? c.green('installed') : r.status === 'pending' ? c.yellow('pending  ') : c.red('failed   ');
      console.log(`  ${label} ${r.id}${r.detail ? c.dim(` — ${r.detail}`) : ''}`);
      if (r.status === 'pending' && r.step.kind !== 'manual') {
        const where = r.step.kind === 'agent' ? 'in your agent' : 'in a terminal';
        for (const cmd of r.step.commands) console.log(`             run ${where}: ${cmd}`);
      }
    }
    writeYaml(lockPath, pinSkills(lock, results, catalog), LOCK_HEADER);
    if (packs.length) editConfig((doc) => doc.set('skill_packs', [...new Set([...config.skill_packs, ...packs])]));
    const pending = results.filter((r) => r.status !== 'installed').length;
    console.log(
      pending
        ? `  Pinned the verified skills. Re-run after installing the ${pending} pending one(s).`
        : '  All skills verified and pinned.',
    );
  });

const models = program
  .command('models')
  .description('Show the model each role uses per harness, with its source')
  .option('--project <name>', 'resolve for one project')
  .option('--harness <id>', 'only this harness')
  .action((opts: { project?: string; harness?: string }) => {
    if (opts.harness && !isHarness(opts.harness)) throw new Error(`Unknown harness "${opts.harness}"`);
    printModels(resolveForCli(root(), { project: opts.project, harness: opts.harness as HarnessId | undefined }));
  });
models
  .command('set <role> <model>')
  .description(`Choose the model for a role (${ROLES.join(', ')}) and regenerate`)
  .option('--harness <id>', 'only this harness (default: every active harness)')
  .option('--tier <tier>', 'implementer tier in routed mode: fast | standard | strong')
  .option('--project <name>', 'write to the project models.yml instead of the workspace one')
  .action((role: string, model: string, opts: { harness?: string; tier?: string; project?: string }) => {
    if (opts.harness && !isHarness(opts.harness)) throw new Error(`Unknown harness "${opts.harness}"`);
    if (opts.tier && !(TIERS as readonly string[]).includes(opts.tier)) throw new Error(`Unknown tier "${opts.tier}"`);
    setModel(root(), {
      role,
      model,
      harness: opts.harness as HarnessId | undefined,
      tier: opts.tier as Tier | undefined,
      project: opts.project,
    });
    sync({});
  });
models
  .command('mode <mode>')
  .description('simple: one model to implement and one to review · routed: the Implementer follows each task tier')
  .action((mode: string) => {
    setMode(root(), mode);
    sync({});
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
  .command('models')
  .description('Resolved model per role (flag > spec > project > workspace > recommendation), JSON on stdout')
  .option('--project <name>', 'project of the task')
  .option('--spec <dir>', 'spec folder whose story.md frontmatter may set models')
  .option('--set <role=model...>', 'command-line overrides, e.g. reviewer=sonnet or implementer.strong=opus')
  .option('--harness <id>', 'only this harness')
  .action((opts: { project?: string; spec?: string; set?: string[]; harness?: string }) => {
    if (opts.harness && !isHarness(opts.harness)) throw new Error(`Unknown harness "${opts.harness}"`);
    const all = resolveForCli(root(), { ...opts, harness: opts.harness as HarnessId | undefined });
    console.log(
      JSON.stringify(
        all.map((m) => ({ ...m, independence: independence(m) })),
        null,
        2,
      ),
    );
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
