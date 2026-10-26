import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { readConfig } from '../engine/files.js';
import type { Branching } from '../schemas/branching.js';
import type { Config } from '../schemas/index.js';
import { branchingFor, specBranch, startPoint } from '../scripts/branching.js';
import { parseRemoteBranches, providerForRemote } from '../scripts/delivery.js';
import type { SpecFolder } from '../scripts/spec.js';
import { findSpec, mainCheckout, readSpec } from '../scripts/spec.js';
import { STATE_FILE } from '../scripts/spec-log.js';
import { parseState } from '../spec/state.js';

/** Where a delivery starts: the spec or quick, its branch and worktree, the remote and the branching model. */

const git = (cwd: string, args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const readIf = (file: string) => (existsSync(file) ? readFileSync(file, 'utf8') : undefined);

type StartRecord = { id?: string; title?: string; lane?: string; branch?: string; base?: string };

export interface DeliveryContext {
  config: ReturnType<typeof readConfig>;
  repo: string;
  worktree: string;
  specDir: string;
  branch: string;
  start: StartRecord;
  spec?: SpecFolder;
  quick: boolean;
  quickName?: string;
  info: ReturnType<typeof originInfo>;
  branching: Branching;
}

function originInfo(repo: string): { url: string; provider: 'github' | 'other'; branches: string[] } {
  const url = git(repo, ['config', '--get', 'remote.origin.url']);
  const provider = providerForRemote(url);
  if (!provider) throw new Error('origin has no remote URL');
  const branches = parseRemoteBranches(git(repo, ['ls-remote', '--heads', 'origin']));
  return { url, provider, branches };
}

/** Reads the start record written by `mandao start`; quick starts retain one file per request. */
function startRecord(dir: string, quick = false, quickName?: string): StartRecord {
  const file = quick
    ? join(dir, '_log', `start-${quickName}.yml`)
    : [join(dir, '_log', STATE_FILE), join(dir, '_log', 'start.yml'), join(dir, 'start.yml')].find((candidate) => existsSync(candidate));
  if (!file) return {};
  const text = readIf(file);
  if (!text) return {};
  if (quick) {
    return parseYaml(text) as { id?: string; title?: string; lane?: string; branch?: string; base?: string };
  }
  if (file.endsWith(STATE_FILE)) return parseState(text).start ?? {};
  return parseYaml(text) as { id?: string; title?: string; lane?: string; branch?: string; base?: string };
}

/**
 * A quick change made without `mandao start --quick` has no start record: its branch is the current or the one
 * local branch named `…quick-<slug>`, else the configured name; base and lane follow from its prefix.
 */
function derivedQuickStart(config: Config, dir: string, slug: string): StartRecord {
  const b = branchingFor(config);
  const own = (name: string) => name.endsWith(`quick-${slug}`);
  const current = git(dir, ['branch', '--show-current']);
  const local = git(dir, ['for-each-ref', '--format=%(refname:short)', 'refs/heads']).split('\n').filter(own);
  // The quick's own branch, whatever its prefix (fix/, hotfix/): the current one, else the one local match.
  const found = own(current) ? current : local.length === 1 ? local[0] : undefined;
  const branch = found ?? specBranch(config, b, { id: 'quick', slug });
  const hotfix = branch.startsWith(b.prefixes.hotfix);
  return { id: 'quick', title: slug, branch, base: startPoint(b, hotfix), lane: hotfix ? 'hotfix' : 'normal' };
}

export function loadDeliveryContext(root: string, ref: string): DeliveryContext {
  const config = readConfig(root);
  const quickName = /^(?:quick\/|quick:)(.+)$/.exec(ref)?.[1];
  const quick = Boolean(quickName);
  const foundDir = quick ? join(root, config.paths.specs, 'quick') : findSpec(root, config, ref);
  const realFoundDir = realpathSync(foundDir);
  const repo = mainCheckout(realFoundDir);
  const invocationRoot = realpathSync(root);
  const recorded = startRecord(realFoundDir, quick, quickName);
  const start = quickName && !recorded.branch ? derivedQuickStart(config, realFoundDir, quickName) : recorded;
  if (!start.branch) throw new Error(`start record for ${ref} is missing its source branch`);
  const branch = start.branch;
  const worktree = findWorktree(repo, branch) ?? root;
  if (git(worktree, ['branch', '--show-current']) !== branch)
    throw new Error(`the worktree for ${branch} is unavailable; resume delivery from that branch`);
  const specDir = quick ? join(worktree, config.paths.specs, 'quick') : join(worktree, relative(invocationRoot, realFoundDir));
  const spec = quick ? undefined : readSpec(specDir);
  if (!quick && spec?.story?.meta.status !== 'closed') throw new Error(`${ref} must be a closed spec before delivery`);
  if (git(worktree, ['status', '--porcelain']))
    throw new Error('delivery stops with uncommitted or untracked changes; commit or review them first');
  const info = originInfo(repo);
  const branching = branchingFor(config, spec?.story?.meta.projects[0]);
  return {
    config,
    repo,
    worktree,
    specDir,
    branch,
    start,
    ...(spec ? { spec } : {}),
    quick,
    ...(quickName ? { quickName } : {}),
    info,
    branching,
  };
}

export function findWorktree(repo: string, branch: string): string | undefined {
  return git(repo, ['worktree', 'list', '--porcelain'])
    .split('\n\n')
    .map((block) => ({ path: /^worktree (.+)$/m.exec(block)?.[1], branch: /^branch refs\/heads\/(.+)$/m.exec(block)?.[1] }))
    .find((entry) => entry.branch === branch)?.path;
}
