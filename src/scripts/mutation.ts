import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { isTestFile } from './impact.js';

const git = (cwd: string, args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });

/** Files a unified diff touches, from its `+++ b/<path>` (or `--- a/<path>` for a deletion) lines. */
export function patchFiles(patch: string): string[] {
  const files = new Set<string>();
  for (const m of patch.matchAll(/^(?:\+\+\+ b\/|--- a\/)(.+)$/gm)) files.add(m[1]!.trim());
  return [...files];
}

/**
 * Why a mutation cannot count as characterization evidence (ADR 0022): it must change the code the tests
 * pin down, so it never touches a test or the task's own files.
 */
export function mutationIssues(files: string[], taskFiles: string[]): string[] {
  if (!files.length) return ['the patch changes no file'];
  const issues: string[] = [];
  const tests = files.filter(isTestFile);
  if (tests.length) issues.push(`the mutation changes tests (${tests.join(', ')}): it must change the code they protect`);
  const own = files.filter((f) => taskFiles.includes(f));
  if (own.length) issues.push(`the mutation changes the task's own files (${own.join(', ')})`);
  return issues;
}

/** The working-tree state of `files` against HEAD: equal before and after means the revert was clean. */
export function treeState(repo: string, files: string[]): string {
  return createHash('sha256')
    .update(git(repo, ['diff', 'HEAD', '--', ...files]))
    .update(git(repo, ['status', '--porcelain=v1', '--', ...files]))
    .digest('hex');
}

export function applyPatch(repo: string, patchFile: string, reverse = false): void {
  git(repo, ['apply', ...(reverse ? ['-R'] : []), '--', patchFile]);
}

/** Fails loudly when the patch does not apply cleanly to the current tree. */
export function checkPatch(repo: string, patchFile: string): void {
  git(repo, ['apply', '--check', '--', patchFile]);
}
