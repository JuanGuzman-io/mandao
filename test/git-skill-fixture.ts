import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { catalogSchema, lockSchema } from '../src/schemas/index.js';
import { type Runner, shellRunner } from '../src/skills/install.js';
import { initTestRepo, makeTree } from './helpers.js';

/** Shared fixture for the git-copy tests: a local tagged skill repository reached through an HTTPS URL rewrite. */
export const meta = {
  version: '1.0.0',
  author: 'a',
  license: 'MIT',
  vetted: true,
  binding: 'stack',
  phases: ['implement'],
  description: 'x',
};

// ---- MDO-0009 T2: a `git` source is copied at its pinned commit into each harness's skills folder (FR-3, D3) ----

export const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false', ...args], {
    cwd,
    encoding: 'utf8',
  }).trim();

export const SCRIPT_EXTENSIONS = ['sh', 'bash', 'zsh', 'js', 'mjs', 'cjs', 'ts', 'py', 'rb', 'ps1', 'bat', 'cmd'];

export const SKILL_FILES: Record<string, string> = {
  'SKILL.md': '---\nname: brainstorming\n---\nUpstream body\n',
  'visual-companion.md': 'a document',
  'reference/notes.md': 'a nested document',
  'scripts/start-server.sh': '#!/bin/sh\necho serve\n',
  'scripts/data.json': '{}',
  'bin-tool': 'no extension, executable bit',
  ...Object.fromEntries(SCRIPT_EXTENSIONS.map((ext) => [`extras/tool.${ext}`, 'x'])),
};
export const EXECUTABLE = ['bin-tool'];
export const SCRIPTS = [
  'scripts/start-server.sh',
  'scripts/data.json',
  'bin-tool',
  ...SCRIPT_EXTENSIONS.map((ext) => `extras/tool.${ext}`),
];
export const DOCS = ['SKILL.md', 'visual-companion.md', 'reference/notes.md'];

/** A local git repository with the skill under `skills/brainstorming`, tagged `v7.0.0`. */
export function skillRepo(extra: Record<string, string> = {}) {
  const dir = makeTree({});
  initTestRepo(dir, '--quiet', '--initial-branch=main');
  git(dir, 'config', 'uploadpack.allowFilter', 'true');
  for (const [file, content] of Object.entries({ ...SKILL_FILES, ...extra })) {
    const full = join(dir, 'skills', 'brainstorming', file);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
    if (EXECUTABLE.includes(file)) chmodSync(full, 0o755);
  }
  writeFileSync(join(dir, 'README.md'), 'outside the skill folder');
  git(dir, 'add', '-A');
  git(dir, 'commit', '--quiet', '-m', 'v7');
  git(dir, 'tag', 'v7.0.0');
  return { dir, url: 'https://fixture.invalid/brainstorming.git', localUrl: `file://${dir}`, commit: git(dir, 'rev-parse', 'HEAD') };
}

export function gitCatalog(url: string, commit: string) {
  return catalogSchema.parse({
    schema_version: 1,
    bootstrap: ['brainstorming'],
    skills: {
      brainstorming: {
        ...meta,
        binding: 'core',
        phases: ['constitution', 'story', 'specify'],
        description: 'Elicit intent.',
        version: '7.0.0',
        source: { type: 'git', url, ref: 'v7.0.0', path: 'skills/brainstorming', commit },
      },
    },
    technologies: {},
  });
}

/** Rewrites only the fixture's HTTPS URL to its local repository for this synchronous install call. */
export function withLocalGitFixture<T>(repo: { url: string; localUrl: string }, fn: () => T): T {
  const keys = ['GIT_CONFIG_COUNT', 'GIT_CONFIG_KEY_0', 'GIT_CONFIG_VALUE_0'] as const;
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  process.env.GIT_CONFIG_COUNT = '1';
  process.env.GIT_CONFIG_KEY_0 = `url.${repo.localUrl}.insteadOf`;
  process.env.GIT_CONFIG_VALUE_0 = repo.url;
  try {
    return fn();
  } finally {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

/** Runs `fn` with the OS temporary folder pointed at a fresh folder, and returns what `fn` left in it. */
export function leftInTemp<T>(fn: () => T): { value: T; left: string[] } {
  const fresh = makeTree({});
  const before = process.env.TMPDIR;
  process.env.TMPDIR = fresh;
  try {
    const value = fn();
    return { value, left: readdirSync(fresh) };
  } finally {
    if (before === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = before;
  }
}

export const emptyLock = () => lockSchema.parse({ schema_version: 1, mandao: '0.1.0', config_hash: 'sha256-x', layers: [], files: [] });
export const gitRunner = (): Runner & { ran: string[] } => {
  const ran: string[] = [];
  return {
    ran,
    run: (cmd, cwd) => {
      ran.push(cmd);
      return shellRunner.run(cmd, cwd);
    },
    has: (bin) => shellRunner.has(bin),
  };
};
