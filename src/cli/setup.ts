import { join } from 'node:path';
import type { Command } from 'commander';
import { runDoctor } from '../engine/doctor.js';
import { LOCK_FILE, LOCK_HEADER, readLock, readModels, writeYaml } from '../engine/files.js';
import { detectPackageManager, latestRunner } from '../engine/package-manager.js';
import { readRecommendations } from '../models/load.js';
import { recommendationOffers, seenRecommendations } from '../models/offers.js';
import { HARNESS_IDS, PROFILES } from '../schemas/index.js';
import { packageInfo } from '../util/package-root.js';
import { type CliContext, sync } from './context.js';
import { type InitOptions, runInit } from './init.js';
import { prepareTarget } from './init-target.js';
import { c, doctorReport, printFindings } from './output.js';

function update(ctx: CliContext, opts: { force?: boolean }) {
  const lockPath = join(ctx.root(), LOCK_FILE);
  const lock = readLock(lockPath);
  const { version } = packageInfo();
  if (lock && lock.mandao !== version) console.log(`  mandao ${lock.mandao} → ${version}`);
  else console.log(c.dim(`  Running mandao ${version}. For the newest release: ${latestRunner(detectPackageManager())} update`));
  sync(ctx, opts);

  const recs = readRecommendations();
  for (const o of recommendationOffers(readModels(ctx.root()), recs, lock?.recommendations ?? {})) {
    const [role, tier] = o.role.split('.');
    const command = `mandao models set ${role} "${o.recommended}" --harness ${o.harness}${tier ? ` --tier ${tier}` : ''}`;
    console.log(`  ${c.blue('offer')} ${o.harness}.${o.role}: Mandao now recommends ${o.recommended} (you use ${o.current}) → ${command}`);
  }
  const fresh = readLock(lockPath);
  if (fresh) {
    writeYaml(lockPath, { ...fresh, recommendations: seenRecommendations(recs) }, LOCK_HEADER);
  }
}

/** init, sync, doctor, update. */
export function registerSetup(program: Command, ctx: CliContext) {
  program
    .command('init [dir]')
    .description('Set up Mandao in this workspace (or in [dir], created with git init if needed), or install /mandao-init globally')
    .option('--scope <scope>', 'project | global')
    .option('--harness <ids...>', `harnesses to generate (${HARNESS_IDS.join(', ')})`)
    .option('--profile <profile>', `profile for every detected project (${PROFILES.join(' | ')})`)
    .option('--default-profile <profile>', 'workspace default profile')
    .option('--language-business <lang>', 'language of business content (story, release notes, PO questions)')
    .option('--language-technical <lang>', 'language of technical content (requirements, design, tasks)')
    .option('--models-mode <mode>', 'simple | routed')
    .option('--model-profile <profile>', 'peak | balanced | economy (default: peak)')
    .option('--polyrepo <strategy>', 'workspace-repo | home | local (polyrepo only)')
    .option('--home <path>', 'home repository path when --polyrepo home')
    .option('-y, --yes', 'accept detected defaults without prompting')
    .option('--force', 'overwrite an existing config and drifted generated files')
    .option('--shadow', 'shadow mode for pilots: generated files go to .git/info/exclude and tracked files are never touched')
    .action((dir: string | undefined, opts: InitOptions) => runInit(prepareTarget(ctx.root(), dir), opts));

  program
    .command('sync')
    .description('Regenerate harness files from .mandao/config.yml')
    .option('--force', 'overwrite generated files that were edited by hand')
    .option('--dry-run', 'show what would change without writing')
    .option('-v, --verbose', 'list unchanged files too')
    .action((opts) => sync(ctx, opts));

  program
    .command('doctor')
    .description('Check configuration, generated files and optional tools')
    .option('--json', 'print the findings as one JSON document')
    .action((opts: { json?: boolean }) => {
      const findings = runDoctor(ctx.root());
      if (opts.json) console.log(JSON.stringify(doctorReport(findings), null, 2));
      else printFindings(findings);
      if (findings.some((f) => f.level === 'error')) process.exitCode = 1;
    });

  program
    .command('update')
    .description('Re-resolve content with the installed Mandao version (overrides and model choices are never touched)')
    .option('--force', 'overwrite generated files that were edited by hand')
    .action((opts) => update(ctx, opts));
}
