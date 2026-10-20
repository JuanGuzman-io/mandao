import { execFileSync } from 'node:child_process';
import { relative } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { branchingFor } from '../scripts/branching.js';
import { mainCheckout, worktreesDir } from '../scripts/spec.js';
import type { CliContext } from './context.js';

const git = (cwd: string, args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

export interface WorktreeInfo {
  path: string;
  branch: string;
  /** Every commit of the branch is in the base: the spec was merged. */
  merged: boolean;
  /** Uncommitted or untracked files in the worktree. */
  dirty: boolean;
}

/** The spec worktrees (those under `paths.worktrees`), with whether they were merged and whether they hold work. */
export function specWorktrees(root: string): WorktreeInfo[] {
  const config = readConfig(root);
  const main = mainCheckout(root);
  const dir = worktreesDir(root, config);
  const base = branchingFor(config).base;
  const merged = new Set(
    git(main, ['branch', '--merged', base, '--format=%(refname:short)'])
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean),
  );
  const out: WorktreeInfo[] = [];
  for (const block of git(main, ['worktree', 'list', '--porcelain']).split('\n\n')) {
    const path = /^worktree (.+)$/m.exec(block)?.[1];
    const branch = /^branch refs\/heads\/(.+)$/m.exec(block)?.[1] ?? '(detached)';
    if (!path || relative(dir, path).startsWith('..')) continue;
    let dirty = true;
    try {
      dirty = git(path, ['status', '--porcelain']).trim().length > 0;
    } catch {
      dirty = true; // cannot read it: treat as holding work
    }
    out.push({ path, branch, merged: merged.has(branch), dirty });
  }
  return out;
}

/** `mandao worktree list | clean` (§14.5): leftovers after merge; clean removes only merged, clean worktrees. */
export function registerWorktree(program: Command, ctx: CliContext) {
  const wt = program.command('worktree').description('Spec worktrees: list them, or remove the ones already merged');
  wt.command('list')
    .description('Spec worktrees with their branch, whether they were merged and whether they hold work')
    .option('--json', 'print JSON')
    .action((o: { json?: boolean }) => {
      const list = specWorktrees(ctx.root());
      if (o.json) return console.log(JSON.stringify(list));
      if (!list.length) return console.log('No spec worktrees.');
      for (const w of list) console.log(`${w.merged ? 'merged ' : 'active '} ${w.dirty ? 'has work' : 'clean   '}  ${w.branch}  ${w.path}`);
    });
  wt.command('clean')
    .description('Remove spec worktrees whose branch is merged into the base and that hold no work (never forced)')
    .option('--dry-run', 'only say what would be removed')
    .action((o: { dryRun?: boolean }) => {
      const main = mainCheckout(ctx.root());
      for (const w of specWorktrees(ctx.root())) {
        if (!w.merged || w.dirty) {
          console.log(`kept     ${w.path} (${!w.merged ? 'not merged' : 'has uncommitted work'})`);
          continue;
        }
        if (o.dryRun) {
          console.log(`would remove ${w.path} and branch ${w.branch}`);
          continue;
        }
        git(main, ['worktree', 'remove', w.path]);
        git(main, ['branch', '-d', w.branch]);
        console.log(`removed  ${w.path} and branch ${w.branch}`);
      }
    });
}
