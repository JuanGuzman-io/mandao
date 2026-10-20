import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedFile } from '../adapters/types.js';
import { readRecommendations, resolveWorkspaceModels } from '../models/load.js';
import { missingRoles } from '../models/resolve.js';
import type { Config, HarnessId, LockFile, Recommendations } from '../schemas/index.js';
import { onPath } from '../util/which.js';
import { isRepo } from '../workspace/detect.js';
import { planChanges } from '../writer/plan.js';
import type { Finding } from './doctor.js';
import { harnessVersionFindings, type Probe } from './tools.js';

/** Committed settings that must stay portable (ADR 0015); local variants are git-ignored. */
const SHARED_SETTINGS = ['.claude/settings.json', '.codex/hooks.json', '.codex/config.toml'];
const ABSOLUTE_PATH = /(?:^|[\s"'=])(\/(?:Users|home|opt|usr\/local|private|var|root)\/[^\s"']+|[A-Za-z]:\\[^\s"']+)/;

/** Absolute paths in committed agent settings break every other machine. */
export function portabilityFindings(root: string): Finding[] {
  const out: Finding[] = [];
  for (const rel of SHARED_SETTINGS) {
    const file = join(root, rel);
    if (!existsSync(file)) continue;
    const match = readFileSync(file, 'utf8').match(ABSOLUTE_PATH);
    if (match) {
      out.push({
        level: 'warn',
        message: `${rel} contains an absolute path (${match[1]}), which only works on this machine`,
        fix: 'resolve the tool through PATH or the Mandao runner, or move that setting to the git-ignored local settings file',
      });
    }
  }
  return out;
}

/** graphify installs its own hooks; Mandao only checks that they are there (shared or local settings). */
function graphHookFindings(root: string, config: Config): Finding[] {
  if (!onPath('graphify')) return [];
  const out: Finding[] = [];
  const claudeSettings = ['.claude/settings.json', '.claude/settings.local.json'].map((f) => join(root, f));
  const hasClaudeHook = claudeSettings.some((f) => existsSync(f) && readFileSync(f, 'utf8').includes('graphify'));
  if (config.harnesses.includes('claude') && !hasClaudeHook) {
    out.push({ level: 'info', message: 'graphify is installed but its Claude Code hooks are not', fix: 'run `graphify claude install`' });
  }
  const postCommit = join(root, '.git', 'hooks', 'post-commit');
  if (isRepo(root) && !(existsSync(postCommit) && readFileSync(postCommit, 'utf8').includes('graphify'))) {
    out.push({
      level: 'info',
      message: 'graphify is installed but its git hooks are not (the graph will go stale)',
      fix: 'run `graphify hook install`',
    });
  }
  return out;
}

/** One summary line per installed harness: generated files, models per role, minimum version. */
function statusFindings(
  root: string,
  config: Config,
  files: GeneratedFile[],
  lock: LockFile[],
  recs: Recommendations,
  probe: Probe,
): Finding[] {
  const plan = planChanges(files, lock, { project: root });
  const models = resolveWorkspaceModels(root, config, recs);
  return config.harnesses.map((harness: HarnessId) => {
    const own = plan.filter((c) => c.lock?.harness === harness || files.some((f) => f.path === c.path && f.harness === harness));
    const stale = own.filter((c) => c.action !== 'unchanged').length;
    const missing = missingRoles(models[harness]!);
    const version = harnessVersionFindings(recs, [harness], probe);
    const problems = [
      ...(stale ? [`${stale} file(s) not in sync`] : []),
      ...(missing.length ? [`no model for ${missing.join(', ')}`] : []),
      ...version.map((v) => v.message),
    ];
    return problems.length
      ? {
          level: 'warn' as const,
          message: `harness ${harness}: not ready to switch to (${problems.join('; ')})`,
          fix: 'run `mandao sync` and `mandao models`',
        }
      : {
          level: 'ok' as const,
          message: `harness ${harness}: files in sync, every role has a model, version requirement met or not checkable`,
        };
  });
}

export function harnessFindings(
  root: string,
  config: Config,
  files: GeneratedFile[],
  lock: LockFile[],
  recs: Recommendations = readRecommendations(),
  probe: Probe,
): Finding[] {
  const out = [...statusFindings(root, config, files, lock, recs, probe), ...portabilityFindings(root), ...graphHookFindings(root, config)];
  if (config.harnesses.includes('codex')) {
    out.push({ level: 'info', message: 'codex: project agents in .codex/ load only when you trust this project in Codex' });
  }
  return out;
}
