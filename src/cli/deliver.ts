import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import * as p from '@clack/prompts';
import type { Command } from 'commander';
import { parse as parseYaml } from 'yaml';
import { readConfig } from '../engine/files.js';
import type { Branching } from '../schemas/branching.js';
import { branchingFor } from '../scripts/branching.js';
import {
  canDeleteMergedBranch,
  hasSecurityCheck,
  manualPullRequestUrl,
  parseRemoteBranches,
  providerForRemote,
} from '../scripts/delivery.js';
import type { SpecFolder } from '../scripts/spec.js';
import { findSpec, mainCheckout, readSpec } from '../scripts/spec.js';
import { STATE_FILE } from '../scripts/spec-log.js';
import { deliveryTargets, resolveDeliveryTarget } from '../spec/delivery.js';
import {
  changelogLine,
  parseCloseSummary,
  pullRequestBody,
  renderCloseDocument,
  sectionOf,
  upsertChangelog,
  withDelivery,
} from '../spec/index.js';
import { parseState } from '../spec/state.js';
import { writeText } from '../writer/files.js';
import type { CliContext } from './context.js';
import { prePush } from './delivery-gates.js';

const git = (cwd: string, args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const readIf = (file: string) => (existsSync(file) ? readFileSync(file, 'utf8') : undefined);

interface DeliveryChoices {
  target: string;
  other?: string;
  scope: 'all' | 'push-pr' | 'nothing';
}

type StartRecord = { id?: string; title?: string; lane?: string; branch?: string; base?: string };

interface DeliveryContext {
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

function quickPullRequestBody(title: string, quickDir: string, repo: string): string {
  const href = relative(repo, quickDir).split(sep).join('/');
  return `## Outcome\n\n${title}\n\n## For developers\n\nSee the quick log for measured files, gates and review evidence.\n\nQuick log: [quick-log.md](${href}/quick-log.md)`;
}

function loadDeliveryContext(root: string, ref: string): DeliveryContext {
  const config = readConfig(root);
  const quickName = /^(?:quick\/|quick:)(.+)$/.exec(ref)?.[1];
  const quick = Boolean(quickName);
  const foundDir = quick ? join(root, config.paths.specs, 'quick') : findSpec(root, config, ref);
  const realFoundDir = realpathSync(foundDir);
  const repo = mainCheckout(realFoundDir);
  const invocationRoot = realpathSync(root);
  const start = startRecord(realFoundDir, quick, quickName);
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

async function selectDestination(delivery: DeliveryContext): Promise<{ choices: DeliveryChoices; target?: string }> {
  const targets = deliveryTargets(delivery.start.base, delivery.branching, delivery.info.branches, delivery.start.lane === 'hotfix');
  if (!targets.length) throw new Error('origin has no configured destination branch; create a remote branch before delivery');
  const choices = await confirmDelivery(
    targets.map((target) => ({
      value: target.branch,
      label: `${target.default ? 'Default · ' : ''}${target.label}`,
      ...(target.difference ? { hint: target.difference } : {}),
    })),
    targets.find((target) => target.default)!.branch,
  );
  if (choices.scope === 'nothing') return { choices };
  const target = resolveDeliveryTarget(
    choices.target === '__other__' ? `other:${choices.other ?? ''}` : choices.target,
    targets,
    delivery.info.branches,
  );
  return { choices, target };
}

function pullRequest(delivery: DeliveryContext): { title: string; body: string } {
  const closeText = delivery.quick ? undefined : readIf(join(delivery.specDir, 'close-summary.md'));
  const title = delivery.quick ? (delivery.start.title ?? delivery.quickName!) : delivery.spec!.story!.title;
  const body = delivery.quick
    ? quickPullRequestBody(title, delivery.specDir, delivery.worktree)
    : pullRequestBody(
        closeText,
        parseCloseSummary(closeText, delivery.spec!.name),
        `${relative(delivery.worktree, delivery.specDir).split(sep).join('/')}/`,
      );
  return { title, body };
}

function pushBranch(delivery: DeliveryContext): void {
  const remoteHead = delivery.info.branches.includes(delivery.branch);
  command(delivery.worktree, 'git', ['push', 'origin', `${delivery.branch}${remoteHead ? '' : `:${delivery.branch}`}`]);
}

async function mergeWithGithub(
  delivery: DeliveryContext,
  target: string,
  title: string,
  body: string,
  scope: DeliveryChoices['scope'],
): Promise<void> {
  const { repo, worktree, branch, quick, specDir, start, branching } = delivery;
  const prUrl = command(worktree, 'gh', ['pr', 'create', '--base', target, '--head', branch, '--title', title, '--body', body]);
  if (!quick) recordSpecDelivery(worktree, specDir, target, prUrl);
  command(worktree, 'git', ['push', 'origin', branch]);
  console.log(`PR: ${prUrl}`);
  if (scope !== 'all') return;
  command(worktree, 'gh', ['pr', 'checks', '--watch', branch]);
  const checkRows = JSON.parse(command(worktree, 'gh', ['pr', 'checks', branch, '--json', 'name,workflow']));
  if (!hasSecurityCheck(checkRows))
    console.log(
      'Warning: no identifiable secret-scanning or SAST check is reported for this PR; review its security coverage before merge.',
    );
  command(worktree, 'gh', ['pr', 'merge', branch, '--merge']);
  console.log(`Merged into ${target}.`);
  if (start.lane === 'hotfix') console.log(`Hotfix back-merge reminder: ${branching.hotfix.merge_to.join(', ')}.`);
  command(repo, 'git', ['fetch', '--quiet', 'origin', `${target}:refs/remotes/origin/${target}`]);
  cleanupMergedWorktree(repo, branch, target);
  await offerPromotion(repo, branching.promotion, target, title, body);
}

async function manualDelivery(delivery: DeliveryContext, target: string): Promise<void> {
  const manualUrl = manualPullRequestUrl(delivery.info.url, target, delivery.branch);
  if (!delivery.quick) recordSpecDelivery(delivery.worktree, delivery.specDir, target, manualUrl);
  command(delivery.worktree, 'git', ['push', 'origin', delivery.branch]);
  console.log(
    manualUrl ? `Open the PR manually: ${manualUrl}` : `Open a PR manually from ${delivery.branch} into ${target} on ${delivery.info.url}.`,
  );
  if (!delivery.quick)
    console.log(
      `After creating it, record the actual URL before merging: mandao deliver ${delivery.spec!.story!.meta.id} --record-pr-url <url>`,
    );
  console.log('CI status: no verificable. Merge remains with the user.');
}

async function executeDelivery(delivery: DeliveryContext, choices: DeliveryChoices, target: string): Promise<void> {
  if (delivery.branching.protected.includes(delivery.branch))
    throw new Error(`refusing to push protected branch ${delivery.branch}; delivery must come from a feature branch`);
  await prePush(delivery.worktree, delivery.config, target, delivery.branch);
  pushBranch(delivery);
  const { title, body } = pullRequest(delivery);
  if (delivery.info.provider === 'github' && spawnSync('gh', ['--version'], { stdio: 'ignore' }).status === 0) {
    return mergeWithGithub(delivery, target, title, body, choices.scope);
  }
  return manualDelivery(delivery, target);
}

function recordManualPrUrl(delivery: DeliveryContext, url: string): void {
  if (delivery.quick) throw new Error('quick delivery does not have a close-summary record');
  const current = parseCloseSummary(readIf(join(delivery.specDir, 'close-summary.md')), delivery.spec!.name).delivery;
  if (!current) throw new Error('select and record a delivery target before recording the PR URL');
  recordSpecDelivery(delivery.worktree, delivery.specDir, current.target, url);
  command(delivery.worktree, 'git', ['push', 'origin', delivery.branch]);
  console.log(`Recorded PR URL for ${current.target}; the PR now contains the delivery record.`);
}

async function runDelivery(ctx: CliContext, ref: string, options: { recordPrUrl?: string }): Promise<void> {
  const delivery = loadDeliveryContext(ctx.root(), ref);
  if (options.recordPrUrl) return recordManualPrUrl(delivery, options.recordPrUrl);
  const selected = await selectDestination(delivery);
  if (selected.choices.scope === 'nothing') {
    console.log('Delivery cancelled; no Git action was taken.');
    return;
  }
  await executeDelivery(delivery, selected.choices, selected.target!);
}

/** Groups destination and delivery scope into one confirmation; no git action occurs before it resolves. */
async function confirmDelivery(
  targetOptions: { value: string; label: string; hint?: string }[],
  preferred: string,
): Promise<DeliveryChoices> {
  const result = await p.group(
    {
      target: () =>
        p.select({
          message: 'PR destination (the worktree start is the default; protected branches are PR targets only)',
          options: [...targetOptions, { value: '__other__', label: 'Other existing remote branch' }],
          initialValue: preferred,
        }),
      other: ({ results }) =>
        results.target === '__other__'
          ? p.text({ message: 'Existing remote branch name', validate: (value) => (value?.trim() ? undefined : 'Enter a branch name') })
          : undefined,
      scope: () =>
        p.select({
          message: 'Delivery actions',
          options: [
            { value: 'all', label: 'Everything', hint: 'push, open PR, merge only after green CI, then cleanup' },
            { value: 'push-pr', label: 'Push and PR only', hint: 'leave merge and cleanup to me' },
            { value: 'nothing', label: 'Nothing', hint: 'cancel delivery' },
          ],
          initialValue: 'push-pr',
        }),
    },
    { onCancel: () => p.cancel('Delivery cancelled.') },
  );
  if (p.isCancel(result)) throw new Error('delivery cancelled');
  return {
    target: String(result.target),
    ...(typeof result.other === 'string' ? { other: result.other } : {}),
    scope: result.scope as DeliveryChoices['scope'],
  };
}

function command(cwd: string, bin: string, args: string[], timeout = 15 * 60_000): string {
  const result = spawnSync(bin, args, { cwd, encoding: 'utf8', timeout, stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${bin} ${args.join(' ')} failed: ${(result.stderr || result.stdout || '').trim()}`);
  return result.stdout.trim();
}

function recordSpecDelivery(repo: string, specDir: string, target: string, prUrl?: string) {
  const spec = readSpec(specDir);
  if (!spec.story) return;
  const summaryFile = join(specDir, 'close-summary.md');
  const prior = readIf(summaryFile);
  const summary = parseCloseSummary(prior, spec.name);
  const next = withDelivery(summary, { target, ...(prUrl ? { pr_url: prUrl } : {}) });
  const outcome = (sectionOf(prior, 'Outcome') ?? '').trim().split('\n').filter(Boolean);
  writeText(summaryFile, renderCloseDocument(next, prior, outcome));
  const changelogFile = join(repo, 'docs', 'CHANGELOG.md');
  const href = `${relative(join(repo, 'docs'), specDir).split(sep).join('/')}/`;
  const line = changelogLine(
    spec.story.meta.id,
    spec.story.title,
    spec.story.meta.type,
    summary.closed_at ?? new Date().toISOString(),
    href,
  );
  writeText(changelogFile, upsertChangelog(readIf(changelogFile), spec.story.meta.id, line));
  const files = [relative(repo, summaryFile), relative(repo, changelogFile)];
  git(repo, ['add', '--', ...files]);
  try {
    git(repo, ['diff', '--cached', '--quiet']);
    return;
  } catch {
    // A non-zero status means the delivery record is staged and needs its own branch commit.
  }
  command(repo, 'git', ['commit', '-m', '📝 docs(delivery): record PR destination']);
}

function findWorktree(repo: string, branch: string): string | undefined {
  return git(repo, ['worktree', 'list', '--porcelain'])
    .split('\n\n')
    .map((block) => ({ path: /^worktree (.+)$/m.exec(block)?.[1], branch: /^branch refs\/heads\/(.+)$/m.exec(block)?.[1] }))
    .find((entry) => entry.branch === branch)?.path;
}

/** Cleanup runs from the principal checkout, after checking branch ancestry and refusing dirty trees. */
function cleanupMergedWorktree(repo: string, branch: string, target: string): void {
  const worktree = findWorktree(repo, branch);
  if (!worktree) return;
  const dirty = git(worktree, ['status', '--porcelain']);
  if (dirty) {
    console.log(`Cleanup kept ${worktree}: uncommitted or untracked files need review.`);
    return;
  }
  if (!canDeleteMergedBranch(ancestor(repo, branch, `origin/${target}`))) {
    console.log(`Cleanup kept ${branch}: it is not an ancestor of origin/${target}.`);
    return;
  }
  process.chdir(repo);
  command(repo, 'git', ['worktree', 'remove', worktree]);
  command(repo, 'git', ['branch', '-d', branch]);
  if (parseRemoteBranches(git(repo, ['ls-remote', '--heads', 'origin'])).includes(branch))
    command(repo, 'git', ['push', 'origin', '--delete', branch]);
}

function ancestor(repo: string, branch: string, target: string): boolean {
  try {
    git(repo, ['merge-base', '--is-ancestor', branch, target]);
    return true;
  } catch {
    return false; // Git's non-zero exit is the expected negative ancestry result.
  }
}

/** `mandao deliver <spec>`: confirmation-gated push/PR/merge with a manual fallback for non-GitHub remotes. */
export function registerDeliver(program: Command, ctx: CliContext) {
  program
    .command('deliver <spec>')
    .description('Confirm a destination, then push and open a PR; merge only after green CI')
    .option('--record-pr-url <url>', 'record a manually-created PR URL before merge, then push the update')
    .action((ref: string, options: { recordPrUrl?: string }) => runDelivery(ctx, ref, options));
}

async function offerPromotion(repo: string, promotion: string[], target: string, title: string, body: string) {
  const next = promotion[promotion.indexOf(target) + 1];
  if (!next) return;
  const answer = await p.confirm({ message: `Promote ${target} to ${next} by opening a separate PR?`, initialValue: false });
  if (p.isCancel(answer) || !answer) return;
  const url = command(repo, 'gh', ['pr', 'create', '--base', next, '--head', target, '--title', title, '--body', body]);
  console.log(`Promotion PR: ${url}`);
}
