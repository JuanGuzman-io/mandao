import { existsSync, readdirSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import semver from 'semver';
import { ADAPTERS } from '../adapters/index.js';
import { loadLayers } from '../resolver/layers.js';
import { ResolveError } from '../resolver/resolve.js';
import { type Config, GATES, LOCAL_REPO } from '../schemas/index.js';
import { sha256 } from '../util/hash.js';
import { packageInfo } from '../util/package-root.js';
import { isRepo } from '../workspace/detect.js';
import { planChanges } from '../writer/plan.js';
import { ConfigError, hasConfig, inputsText, LOCK_FILE, readConfig, readLock, readModels, readSources, SOURCES_FILE } from './files.js';
import { globalLockFile, home } from './global.js';
import { buildOutputs } from './sync.js';

export type Level = 'error' | 'warn' | 'info' | 'ok';

export interface Finding {
  level: Level;
  message: string;
  fix?: string;
}

const MIN_NODE = '22.18.0';

/** Optional tools: Mandao works without them, with lower confidence. */
const OPTIONAL_TOOLS = [
  { name: 'graphify', fallback: 'repository mapping falls back to grep/glob; reports lower their confidence' },
  { name: 'archify', fallback: 'diagrams fall back to Mermaid' },
];

function onPath(bin: string): boolean {
  return (process.env.PATH ?? '')
    .split(delimiter)
    .some((dir) => dir && (existsSync(join(dir, bin)) || existsSync(join(dir, `${bin}.cmd`))));
}

function hasSkill(root: string, name: string): boolean {
  return [join(root, '.claude', 'skills', name), join(home(), '.claude', 'skills', name)].some((p) => existsSync(p));
}

function workspaceFindings(root: string, config: Config): Finding[] {
  const out: Finding[] = [];
  for (const p of config.projects) {
    if (!existsSync(join(root, p.path))) out.push({ level: 'error', message: `project "${p.name}": path "${p.path}" does not exist` });
    else if (p.repo && !isRepo(join(root, p.path)))
      out.push({ level: 'warn', message: `project "${p.name}" is declared as a repository but has no .git` });
    if (p.repo === LOCAL_REPO)
      out.push({
        level: 'info',
        message: `project "${p.name}" has no remote yet (repo: local)`,
        fix: 'set projects[].repo to its remote URL so close can link PRs',
      });
    const missing = GATES.filter((g) => !p.gates[g]);
    if (missing.length) {
      out.push({
        level: 'info',
        message: `project "${p.name}": no command for gates ${missing.join(', ')}`,
        fix: `add projects[].gates in .mandao/config.yml, e.g. lint: "npm run lint"`,
      });
    }
  }
  if (config.workspace === 'polyrepo' && !isRepo(root)) {
    if (config.home === '.' && !config.local_only) {
      out.push({
        level: 'warn',
        message: 'polyrepo workspace root is not a git repository: specs and the workspace constitution are not versioned',
        fix: 'run `git init` at the root and ignore the child repositories, or set home to a project repository',
      });
    } else if (config.local_only) {
      out.push({ level: 'warn', message: 'workspace artifacts are local only (local_only: true) and not versioned' });
    }
  }
  return out;
}

export function runDoctor(root: string): Finding[] {
  const findings: Finding[] = [];
  const { version } = packageInfo();

  findings.push(
    semver.gte(process.versions.node, MIN_NODE)
      ? { level: 'ok', message: `Node ${process.versions.node}` }
      : { level: 'error', message: `Node ${process.versions.node} is older than ${MIN_NODE}` },
  );

  if (!hasConfig(root)) {
    findings.push({ level: 'error', message: 'no .mandao/config.yml in this directory', fix: 'run `npx mandao init`' });
    return findings;
  }

  let config: Config;
  try {
    config = readConfig(root);
    findings.push({
      level: 'ok',
      message: `config: ${config.workspace}, ${config.projects.length} project(s), harnesses ${config.harnesses.join(', ')}`,
    });
  } catch (e) {
    if (!(e instanceof ConfigError)) throw e;
    findings.push(...e.issues.map((m) => ({ level: 'error' as const, message: m })));
    return findings;
  }

  if (existsSync(join(root, SOURCES_FILE))) {
    try {
      const sources = readSources(root);
      findings.push({ level: 'ok', message: `sources: tracker ${sources.tracker.kind}` });
    } catch (e) {
      if (!(e instanceof ConfigError)) throw e;
      findings.push(...e.issues.map((m) => ({ level: 'error' as const, message: m })));
    }
  } else {
    findings.push({ level: 'info', message: 'no .mandao/sources.yml: story and constitution --product will only use local context' });
  }

  findings.push(...workspaceFindings(root, config));

  let build: ReturnType<typeof buildOutputs>;
  try {
    build = buildOutputs(config, readModels(root), loadLayers(root, config.presets), version, 'project');
  } catch (e) {
    if (e instanceof ResolveError) {
      findings.push(...e.issues.map((m) => ({ level: 'error' as const, message: m })));
      return findings;
    }
    findings.push({ level: 'error', message: (e as Error).message });
    return findings;
  }
  findings.push(...build.warnings.map((m) => ({ level: 'warn' as const, message: m })));

  const lock = readLock(join(root, LOCK_FILE));
  if (!lock) {
    findings.push({ level: 'error', message: 'no .mandao/mandao.lock', fix: 'run `mandao sync`' });
    return findings;
  }
  if (lock.mandao !== version) {
    findings.push({
      level: 'warn',
      message: `lock was written by mandao ${lock.mandao}; installed is ${version}`,
      fix: 'run `mandao update`',
    });
  }
  const global = readLock(globalLockFile());
  if (global && global.mandao !== lock.mandao) {
    findings.push({
      level: 'warn',
      message: `global install is mandao ${global.mandao}; this project pins ${lock.mandao} (the project version wins)`,
    });
  }
  if (lock.config_hash !== sha256(inputsText(root))) {
    findings.push({ level: 'warn', message: 'config.yml or models.yml changed since the last sync', fix: 'run `mandao sync`' });
  }

  const plan = planChanges(build.files, lock.files, { project: root });
  const drift = plan.filter((c) => c.action === 'drift' || c.action === 'drift-orphan');
  const pending = plan.filter((c) => ['create', 'update', 'delete'].includes(c.action));
  for (const c of drift) {
    findings.push({
      level: 'warn',
      message: `${c.path} was edited by hand`,
      fix: 'move the change into .mandao/overrides/, then `mandao sync --force`',
    });
  }
  if (pending.length) {
    findings.push({
      level: 'warn',
      message: `${pending.length} generated file(s) out of date: ${pending
        .map((c) => c.path)
        .slice(0, 5)
        .join(', ')}${pending.length > 5 ? ', …' : ''}`,
      fix: 'run `mandao sync`',
    });
  }
  if (!drift.length && !pending.length) findings.push({ level: 'ok', message: `${plan.length} generated file(s) in sync` });

  const unknown = config.harnesses.filter((h) => !(h in ADAPTERS));
  if (unknown.length) findings.push({ level: 'error', message: `unknown harnesses: ${unknown.join(', ')}` });

  for (const tool of OPTIONAL_TOOLS) {
    if (!onPath(tool.name) && !hasSkill(root, tool.name))
      findings.push({ level: 'info', message: `${tool.name} not found: ${tool.fallback}` });
  }

  const overrides = join(root, '.mandao', 'overrides');
  if (existsSync(overrides) && readdirSync(overrides).some((f) => f !== 'README.md')) {
    findings.push({ level: 'info', message: 'project overrides are active (.mandao/overrides/)' });
  }

  return findings;
}
