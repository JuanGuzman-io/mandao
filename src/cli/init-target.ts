import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { ensureDir } from '../writer/files.js';

const insideRepo = (dir: string) => {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: dir, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

/**
 * `mandao init [dir]`: the folder to set up, created when missing, with `git init` when it is not inside
 * a repository yet. Without `dir`, the current workspace as it is.
 */
export function prepareTarget(cwd: string, dir: string | undefined): string {
  if (!dir) return cwd;
  const target = resolve(cwd, dir);
  ensureDir(target);
  if (!insideRepo(target)) execFileSync('git', ['init', '-q'], { cwd: target, stdio: 'ignore' });
  return target;
}
