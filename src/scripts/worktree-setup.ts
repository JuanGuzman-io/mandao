import { execFileSync } from 'node:child_process';
import { existsSync, globSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Worktree setup (§14.5, ADR 0037): everything a fresh checkout needs before a session opens in it, as
 * scripts, never model tokens.
 */

/** Dependency installs by lockfile, most specific first: frozen installs, so the lockfile is the truth. */
export const LOCKFILE_INSTALLS: { lockfile: string; command: string }[] = [
  { lockfile: 'pnpm-lock.yaml', command: 'pnpm install --frozen-lockfile' },
  { lockfile: 'package-lock.json', command: 'npm ci' },
  { lockfile: 'yarn.lock', command: 'yarn install --immutable' },
  { lockfile: 'bun.lock', command: 'bun install --frozen-lockfile' },
  { lockfile: 'bun.lockb', command: 'bun install --frozen-lockfile' },
  { lockfile: 'uv.lock', command: 'uv sync' },
  { lockfile: 'poetry.lock', command: 'poetry install' },
  { lockfile: 'go.mod', command: 'go mod download' },
  { lockfile: 'Cargo.lock', command: 'cargo fetch' },
  { lockfile: 'pubspec.lock', command: 'flutter pub get' },
  { lockfile: 'composer.lock', command: 'composer install' },
  { lockfile: 'Gemfile.lock', command: 'bundle install' },
];

/** Yarn v1 lockfiles say so in their header; they take `--frozen-lockfile` instead of `--immutable`. */
const yarnClassic = (dir: string) => /yarn lockfile v1/.test(readFileSync(join(dir, 'yarn.lock'), 'utf8').slice(0, 200));

/** The install commands a directory's lockfiles call for (a project can mix ecosystems). */
export function dependencyInstalls(dir: string): string[] {
  const out: string[] = [];
  const js = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'bun.lock', 'bun.lockb'];
  let jsDone = false;
  for (const { lockfile, command } of LOCKFILE_INSTALLS) {
    if (!existsSync(join(dir, lockfile))) continue;
    if (js.includes(lockfile)) {
      if (jsDone) continue; // one JS package manager per project: the first lockfile in the table wins
      jsDone = true;
      out.push(lockfile === 'yarn.lock' && yarnClassic(dir) ? 'yarn install --frozen-lockfile' : command);
      continue;
    }
    out.push(command);
  }
  return out;
}

const INCLUDE_FILES = ['.mandao/worktree-include', '.worktreeinclude'];

/** Patterns from `.mandao/worktree-include` and Claude Code's `.worktreeinclude` (one shared list). */
export function includePatterns(root: string): string[] {
  return INCLUDE_FILES.filter((f) => existsSync(join(root, f))).flatMap((f) =>
    readFileSync(join(root, f), 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#')),
  );
}

const git = (cwd: string, args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

function isTracked(root: string, file: string): boolean {
  try {
    git(root, ['ls-files', '--error-unmatch', '--', file]);
    return true;
  } catch {
    return false;
  }
}

function isIgnored(root: string, file: string): boolean {
  try {
    git(root, ['check-ignore', '-q', '--', file]);
    return true;
  } catch {
    return false;
  }
}

export interface IncludePlan {
  copy: string[];
  /** Listed but tracked: git already brings them, and env files must never be committed. */
  skipped: { file: string; reason: string }[];
}

/** Why a listed file is not copied, or undefined when it should be. */
function skipReason(root: string, file: string): string | undefined {
  if (isTracked(root, file)) return 'tracked by git: worktree-include is for gitignored files only';
  if (!isIgnored(root, file)) return 'not gitignored: add it to .gitignore before listing it';
  return undefined;
}

const matchesOf = (root: string, pattern: string) =>
  /[*?[]/.test(pattern) ? globSync(pattern, { cwd: root }) : existsSync(join(root, pattern)) ? [pattern] : [];

/** Which listed files to copy from the main checkout: matched, gitignored and untracked only. */
export function includePlan(root: string): IncludePlan {
  const plan: IncludePlan = { copy: [], skipped: [] };
  const files = [...new Set(includePatterns(root).flatMap((p) => matchesOf(root, p).map((m) => relative(root, join(root, m)))))];
  for (const file of files) {
    const reason = skipReason(root, file);
    if (reason) plan.skipped.push({ file, reason });
    else plan.copy.push(file);
  }
  return plan;
}
