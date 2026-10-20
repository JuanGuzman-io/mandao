import { join } from 'node:path';
import { renderAgentsMd } from '../adapters/agents-md.js';
import { ADAPTERS, type AdapterInput, type GeneratedFile, type InstallScope } from '../adapters/index.js';
import { COMMITLINT_PATH, commitlintConfig } from '../commits/commitlint.js';
import { readRecommendations, resolveWorkspaceModels } from '../models/load.js';
import { installTemplates } from '../render/templates.js';
import { type Layer, layerHash, loadLayers } from '../resolver/layers.js';
import { type Resolution, resolve } from '../resolver/resolve.js';
import { type Config, configSchema, type HarnessId, type Lock, type LockFile } from '../schemas/index.js';
import { sha256 } from '../util/hash.js';
import { packageInfo } from '../util/package-root.js';
import { applyChanges } from '../writer/apply.js';
import { type Change, planChanges } from '../writer/plan.js';
import { inputsText, LOCK_FILE, LOCK_HEADER, readConfig, readLock, writeYaml } from './files.js';
import { globalLockFile, globalRoots } from './global.js';
import { gitIgnoreBlock, graphIgnoreBlock } from './graph.js';
import { LAUNCHER_PATH, launcherScript } from './launcher.js';
import { findModuleGuides } from './modules.js';

export interface BuildResult {
  files: GeneratedFile[];
  warnings: string[];
  layers: Layer[];
  resolution: Resolution;
}

/** Everything a sync would write, computed without touching the disk (apart from reading layers). */
export function buildOutputs(
  config: Config,
  models: AdapterInput['models'],
  layers: Layer[],
  version: string,
  scope: InstallScope,
  moduleDirs: string[] = [],
): BuildResult {
  const resolution = resolve(layers);
  const input: AdapterInput = { resolution, config, models, version, scope, moduleDirs };
  const files: GeneratedFile[] = [];
  const warnings: string[] = [];

  for (const harness of config.harnesses) {
    const out = ADAPTERS[harness].render(input);
    files.push(...out.files);
    warnings.push(...out.warnings);
  }

  if (scope === 'project') {
    files.push(...renderAgentsMd(input).files);
    const profiles = config.projects.map((p) => p.profile);
    for (const t of installTemplates(resolution.templates, profiles)) {
      files.push({ path: t.path, content: t.content, ownership: 'owned', from: t.from, harness: 'mandao', scope: 'project' });
    }
    files.push({
      path: LAUNCHER_PATH,
      content: launcherScript(version, config.scripts.runner),
      ownership: 'owned',
      from: 'config:scripts',
      harness: 'mandao',
      scope: 'project',
    });
    files.push({
      path: COMMITLINT_PATH,
      content: commitlintConfig(config, version),
      ownership: 'owned',
      from: 'config:commits',
      harness: 'mandao',
      scope: 'project',
    });
    const childRepos = config.workspace === 'polyrepo' ? config.projects.map((p) => p.path) : [];
    files.push(gitIgnoreBlock(childRepos, version));
    files.push(graphIgnoreBlock(files, version));
  }

  return { files, warnings, layers, resolution };
}

export interface SyncOptions {
  force?: boolean;
  dryRun?: boolean;
}

export interface SyncResult {
  changes: Change[];
  warnings: string[];
  lock: Lock;
}

function lockFrom(previous: Lock | undefined, entries: LockFile[], layers: Layer[], configHash: string, version: string): Lock {
  return {
    schema_version: 1,
    mandao: version,
    config_hash: configHash,
    layers: layers.map((l) => (l.kind === 'core' ? { kind: l.kind, id: l.id, version } : { kind: l.kind, id: l.id, hash: layerHash(l) })),
    recommendations: previous?.recommendations ?? {},
    skills: previous?.skills ?? [],
    files: entries.sort((a, b) => a.path.localeCompare(b.path)),
  };
}

/** config → resolve → render → plan → write. Idempotent. */
export function syncProject(root: string, opts: SyncOptions = {}): SyncResult {
  const config = readConfig(root);
  const { version } = packageInfo();
  const layers = loadLayers(root, config.presets);
  const build = buildOutputs(
    config,
    resolveWorkspaceModels(root, config, readRecommendations()),
    layers,
    version,
    'project',
    findModuleGuides(root, config),
  );
  const lockPath = join(root, LOCK_FILE);
  const previous = readLock(lockPath);
  const changes = planChanges(build.files, previous?.files ?? [], { project: root }, opts.force);

  const entries = opts.dryRun ? changes.flatMap((c) => (c.lock ? [c.lock] : [])) : applyChanges(changes, [root]);
  const lock = lockFrom(previous, entries, layers, sha256(inputsText(root)), version);
  if (!opts.dryRun) writeYaml(lockPath, lock, LOCK_HEADER);
  return { changes, warnings: build.warnings, lock };
}

/** A minimal config for user-level installs, where there is no workspace. */
export function globalConfig(harnesses: HarnessId[]): Config {
  return configSchema.parse({
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'global', path: '.', profile: 'app' }],
    harnesses,
  });
}

/** Installs the global commands (only `/mandao-init` today) into each harness's user folder. */
export function syncGlobal(harnesses: HarnessId[], opts: SyncOptions = {}): SyncResult {
  const { version } = packageInfo();
  const config = globalConfig(harnesses);
  const layers = loadLayers(process.cwd(), []).filter((l) => l.kind === 'core');
  const build = buildOutputs(config, {}, layers, version, 'global');
  const roots = globalRoots();
  const lockPath = globalLockFile();
  const previous = readLock(lockPath);
  // Only manage the harnesses requested now; keep entries for the others.
  const kept = (previous?.files ?? []).filter((f) => !harnesses.includes(f.harness as HarnessId));
  const changes = planChanges(
    build.files,
    (previous?.files ?? []).filter((f) => harnesses.includes(f.harness as HarnessId)),
    { project: process.cwd(), global: roots },
    opts.force,
  );
  const entries = opts.dryRun ? changes.flatMap((c) => (c.lock ? [c.lock] : [])) : applyChanges(changes, Object.values(roots));
  const lock = lockFrom(previous, [...kept, ...entries], layers, sha256(JSON.stringify(harnesses)), version);
  if (!opts.dryRun) writeYaml(lockPath, lock, LOCK_HEADER);
  return { changes, warnings: build.warnings, lock };
}
