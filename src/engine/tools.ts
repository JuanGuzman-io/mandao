import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import semver from 'semver';
import type { Catalog, HarnessId, Recommendations } from '../schemas/index.js';
import type { Finding } from './doctor.js';
import { LAUNCHER_PATH } from './launcher.js';

/** Runs a command and returns its stdout, or undefined when it fails or is missing. */
export type Probe = (command: string) => string | undefined;

export const shellProbe: Probe = (command) => {
  const r = spawnSync(command, { shell: true, encoding: 'utf8', timeout: 10_000, stdio: ['ignore', 'pipe', 'ignore'] });
  return r.status === 0 ? r.stdout : undefined;
};

/** Compares the installed version of each external tool with the version pinned in the catalog. */
export function toolVersionFindings(catalog: Catalog, ids: string[], probe: Probe): Finding[] {
  const out: Finding[] = [];
  for (const id of ids) {
    const skill = catalog.skills[id];
    if (skill?.source.type !== 'command' || !skill.source.version_command) continue;
    const output = probe(skill.source.version_command);
    if (output === undefined) continue; // not installed: reported elsewhere as an optional tool
    const installed = semver.coerce(output)?.version;
    const pinned = semver.valid(skill.version);
    if (!installed || !pinned) continue;
    if (semver.lt(installed, pinned)) {
      out.push({
        level: 'warn',
        message: `${id} ${installed} is older than the pinned ${pinned}`,
        fix: `mandao skills add ${id} (shows the installer and asks before running it)`,
      });
    }
  }
  return out;
}

/** Runs the launcher in print mode from `root` and returns its JSON choice. */
export function launcherChoice(root: string, launcher: string): string | undefined {
  const r = spawnSync(process.execPath, [launcher], {
    cwd: root,
    env: { ...process.env, MANDAO_LAUNCHER_PRINT: '1' },
    encoding: 'utf8',
    timeout: 10_000,
  });
  return r.status === 0 ? r.stdout : undefined;
}

/** Asks the generated launcher which Mandao it would run, and checks that it can. */
export function runnerFindings(root: string, lockVersion: string | undefined, probe: Probe, printLauncher = launcherChoice): Finding[] {
  const launcher = join(root, LAUNCHER_PATH);
  if (!existsSync(launcher)) return [{ level: 'error', message: `${LAUNCHER_PATH} is missing`, fix: 'run `mandao sync`' }];
  const printed = printLauncher(root, launcher);
  let choice: { source: string; command?: string; runner?: string } | undefined;
  try {
    choice = printed ? JSON.parse(printed) : undefined;
  } catch {
    choice = undefined;
  }
  if (!choice)
    return [{ level: 'error', message: 'the Mandao launcher did not run', fix: 'run `mandao sync`, then `mandao doctor` again' }];
  if (choice.source === 'none') {
    return [
      {
        level: 'error',
        message: `scripts.runner is "${choice.runner}" but no such Mandao installation was found`,
        fix: 'install Mandao that way, or set scripts.runner: auto',
      },
    ];
  }
  if (choice.source !== 'npx') return [{ level: 'ok', message: `runner: ${choice.source} Mandao (${choice.command})` }];
  const version = lockVersion ?? 'latest';
  if (probe(`npm view mandao@${version} version`)?.trim()) return [{ level: 'ok', message: `runner: npx mandao@${version}` }];
  return [
    {
      level: 'warn',
      message: `the launcher falls back to npx, but mandao@${version} could not be found on the npm registry`,
      fix: 'before Mandao is published, run `npm link` in the Mandao repository (see README, Development)',
    },
  ];
}

/** Warns when an installed harness is older than the release the recommended models need. */
export function harnessVersionFindings(recs: Recommendations, harnesses: HarnessId[], probe: Probe): Finding[] {
  const out: Finding[] = [];
  for (const harness of harnesses) {
    const req = recs.harnesses[harness]?.harness_version;
    if (!req) continue;
    const output = probe(req.command);
    const installed = output === undefined ? undefined : semver.coerce(output)?.version;
    const min = semver.coerce(req.min)?.version;
    if (!installed || !min) continue; // harness CLI not on PATH: nothing to compare
    if (semver.lt(installed, min)) {
      out.push({
        level: 'warn',
        message: `${harness} ${installed} is older than ${min}, which the recommended models need`,
        fix: `update ${harness} (e.g. \`claude update\`), or choose models it supports with \`mandao models set\``,
      });
    }
  }
  return out;
}
