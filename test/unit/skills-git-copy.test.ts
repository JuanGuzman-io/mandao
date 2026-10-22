// mandao-scans: none — lists only the temporary trees it creates.
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, test } from 'vitest';

import { catalogSchema, lockSchema } from '../../src/schemas/index.js';
import { installSkills, pinSkills, type Runner, shellRunner, skillFolders } from '../../src/skills/install.js';
import { initTestRepo, makeTree } from '../helpers.js';

const meta = { version: '1.0.0', author: 'a', license: 'MIT', vetted: true, binding: 'stack', phases: ['implement'], description: 'x' };

// ---- MDO-0009 T2: a `git` source is copied at its pinned commit into each harness's skills folder (FR-3, D3) ----

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false', ...args], {
    cwd,
    encoding: 'utf8',
  }).trim();

const SCRIPT_EXTENSIONS = ['sh', 'bash', 'zsh', 'js', 'mjs', 'cjs', 'ts', 'py', 'rb', 'ps1', 'bat', 'cmd'];

const SKILL_FILES: Record<string, string> = {
  'SKILL.md': '---\nname: brainstorming\n---\nUpstream body\n',
  'visual-companion.md': 'a document',
  'reference/notes.md': 'a nested document',
  'scripts/start-server.sh': '#!/bin/sh\necho serve\n',
  'scripts/data.json': '{}',
  'bin-tool': 'no extension, executable bit',
  ...Object.fromEntries(SCRIPT_EXTENSIONS.map((ext) => [`extras/tool.${ext}`, 'x'])),
};
const EXECUTABLE = ['bin-tool'];
const SCRIPTS = ['scripts/start-server.sh', 'scripts/data.json', 'bin-tool', ...SCRIPT_EXTENSIONS.map((ext) => `extras/tool.${ext}`)];
const DOCS = ['SKILL.md', 'visual-companion.md', 'reference/notes.md'];

/** A local git repository with the skill under `skills/brainstorming`, tagged `v7.0.0`. */
function skillRepo() {
  const dir = makeTree({});
  initTestRepo(dir, '--quiet', '--initial-branch=main');
  git(dir, 'config', 'uploadpack.allowFilter', 'true');
  for (const [file, content] of Object.entries(SKILL_FILES)) {
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

function gitCatalog(url: string, commit: string) {
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
function withLocalGitFixture<T>(repo: { url: string; localUrl: string }, fn: () => T): T {
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
function leftInTemp<T>(fn: () => T): { value: T; left: string[] } {
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

const emptyLock = () => lockSchema.parse({ schema_version: 1, mandao: '0.1.0', config_hash: 'sha256-x', layers: [], files: [] });
const gitRunner = (): Runner & { ran: string[] } => {
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

describe('skillFolders (D3 folder map, AC-3)', () => {
  test('S-3.1 AC-3: each harness maps to the folder it reads, with no duplicates', () => {
    expect(skillFolders(['claude', 'codex']).sort()).toEqual(['.agents/skills', '.claude/skills']);
    expect(skillFolders(['codex', 'antigravity'])).toEqual(['.agents/skills']);
    expect(skillFolders(['opencode'])).toEqual(['.agents/skills']);
    expect(skillFolders(['copilot'])).toEqual(['.github/skills']);
  });

  test('S-3.1 AC-3: OpenCode and Copilot add no folder when .claude or .agents is already a target', () => {
    expect(skillFolders(['claude', 'copilot', 'opencode'])).toEqual(['.claude/skills']);
    expect(skillFolders(['copilot', 'codex'])).toEqual(['.agents/skills']);
  });
});

describe('git source install (FR-3)', () => {
  test('S-3.1: copies the pinned folder into both harness folders, pins the commit, and removes the temporary folder', () => {
    const repo = skillRepo();
    const root = makeTree({});
    const catalog = gitCatalog(repo.url, repo.commit);
    const { value, left } = leftInTemp(() =>
      withLocalGitFixture(repo, () =>
        installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['claude', 'codex'] }),
      ),
    );
    expect(value[0]).toMatchObject({ id: 'brainstorming', status: 'installed' });
    for (const folder of ['.claude/skills', '.agents/skills']) {
      expect(readFileSync(join(root, folder, 'brainstorming', 'SKILL.md'), 'utf8')).toBe(SKILL_FILES['SKILL.md']);
      expect(existsSync(join(root, folder, 'brainstorming', '.git'))).toBe(false);
      expect(existsSync(join(root, folder, 'brainstorming', 'README.md'))).toBe(false);
    }
    expect(left).toEqual([]);
    const pinned = pinSkills(emptyLock(), value, catalog);
    expect(pinned.skills).toHaveLength(1);
    expect(pinned.skills[0]).toMatchObject({ id: 'brainstorming', version: '7.0.0', commit: repo.commit });
  });

  test('S-3.1/C1: a folder that already exists is left as is, the output says so, and the other folder is still copied', () => {
    const repo = skillRepo();
    const root = makeTree({ '.claude/skills/brainstorming/SKILL.md': 'my own edits' });
    const [r] = withLocalGitFixture(repo, () =>
      installSkills(['brainstorming'], gitCatalog(repo.url, repo.commit), root, root, gitRunner(), {
        harnesses: ['claude', 'codex'],
      }),
    );
    expect(readFileSync(join(root, '.claude/skills/brainstorming/SKILL.md'), 'utf8')).toBe('my own edits');
    expect(existsSync(join(root, '.claude/skills/brainstorming/visual-companion.md'))).toBe(false);
    expect(readFileSync(join(root, '.agents/skills/brainstorming/SKILL.md'), 'utf8')).toBe(SKILL_FILES['SKILL.md']);
    expect(r?.detail).toMatch(/already exists/i);
    expect(r?.detail).toContain('.claude/skills/brainstorming');
  });

  test('S-3.2: a tag that moved to another commit copies nothing, fails with both commits, and is not pinned', () => {
    const repo = skillRepo();
    const catalog = gitCatalog(repo.url, repo.commit);
    writeFileSync(join(repo.dir, 'skills/brainstorming/SKILL.md'), 'tampered');
    git(repo.dir, 'commit', '--quiet', '-am', 'moved');
    git(repo.dir, 'tag', '-f', 'v7.0.0');
    const moved = git(repo.dir, 'rev-parse', 'HEAD');
    expect(moved).not.toBe(repo.commit);
    const root = makeTree({});
    const { value, left } = leftInTemp(() =>
      withLocalGitFixture(repo, () =>
        installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['claude', 'codex'] }),
      ),
    );
    expect(value[0]?.status).toBe('failed');
    expect(value[0]?.detail).toContain(repo.commit);
    expect(value[0]?.detail).toContain(moved);
    expect(existsSync(join(root, '.claude/skills/brainstorming'))).toBe(false);
    expect(existsSync(join(root, '.agents/skills/brainstorming'))).toBe(false);
    expect(left).toEqual([]);
    expect(pinSkills(emptyLock(), value, catalog).skills).toEqual([]);
  });

  const manualStep = (detail: string | undefined, url: string, commit: string) => {
    for (const part of [url, 'v7.0.0', commit, 'skills/brainstorming', '.claude/skills', '.agents/skills']) expect(detail).toContain(part);
  };

  test('S-3.3: git not on PATH leaves the skill pending with the manual step, runs nothing and copies nothing', () => {
    const repo = skillRepo();
    const ran: string[] = [];
    const runner: Runner = {
      run: (cmd) => {
        ran.push(cmd);
        return true;
      },
      has: (bin) => bin !== 'git',
    };
    const root = makeTree({});
    const { value, left } = leftInTemp(() =>
      withLocalGitFixture(repo, () =>
        installSkills(['brainstorming'], gitCatalog(repo.url, repo.commit), root, root, runner, { harnesses: ['claude', 'codex'] }),
      ),
    );
    expect(value[0]?.status).toBe('pending');
    manualStep(value[0]?.detail, repo.url, repo.commit);
    expect(ran).toEqual([]);
    expect(existsSync(join(root, '.claude/skills/brainstorming'))).toBe(false);
    expect(left).toEqual([]);
  });

  test('S-3.3: a fetch that exits non-zero leaves the skill pending with the manual step and nothing behind', () => {
    const repo = skillRepo();
    const url = 'https://fixture.invalid/brainstorming.git';
    const root = makeTree({});
    const catalog = gitCatalog(url, repo.commit);
    const { value, left } = leftInTemp(() =>
      withLocalGitFixture({ url, localUrl: 'file:///nonexistent/mandao-no-such-repository' }, () =>
        installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['claude', 'codex'] }),
      ),
    );
    expect(value[0]?.status).toBe('pending');
    manualStep(value[0]?.detail, url, repo.commit);
    expect(existsSync(join(root, '.claude/skills/brainstorming'))).toBe(false);
    expect(left).toEqual([]);
    expect(pinSkills(emptyLock(), value, catalog).skills).toEqual([]);
  });

  test('S-3.4 and S-3.4/C1: without --with-scripts, documents are copied and no script is, and each one left out is named', () => {
    const repo = skillRepo();
    const root = makeTree({});
    const catalog = gitCatalog(repo.url, repo.commit);
    const [r] = withLocalGitFixture(repo, () =>
      installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['claude', 'codex'] }),
    );
    expect(r?.status).toBe('installed');
    for (const folder of ['.claude/skills', '.agents/skills']) {
      for (const doc of DOCS) expect(existsSync(join(root, folder, 'brainstorming', doc)), `${folder}/${doc}`).toBe(true);
      for (const script of SCRIPTS) expect(existsSync(join(root, folder, 'brainstorming', script)), `${folder}/${script}`).toBe(false);
    }
    for (const script of SCRIPTS) expect(r?.detail, script).toContain(script);
    expect(r?.detail).toContain('--with-scripts');
    const pinned = pinSkills(emptyLock(), [r!], catalog).skills[0];
    expect(pinned?.commit).toBe(repo.commit);
    expect(pinned?.scripts).not.toBe(true);
  });

  test('S-3.5: with --with-scripts the whole folder is copied and the lock records that scripts were copied', () => {
    const repo = skillRepo();
    const root = makeTree({});
    const catalog = gitCatalog(repo.url, repo.commit);
    const [r] = withLocalGitFixture(repo, () =>
      installSkills(['brainstorming'], catalog, root, root, gitRunner(), {
        harnesses: ['claude', 'codex'],
        withScripts: true,
        warn: () => {},
      }),
    );
    expect(r?.status).toBe('installed');
    for (const folder of ['.claude/skills', '.agents/skills']) {
      for (const file of [...DOCS, ...SCRIPTS])
        expect(existsSync(join(root, folder, 'brainstorming', file)), `${folder}/${file}`).toBe(true);
    }
    expect(statSync(join(root, '.claude/skills/brainstorming/bin-tool')).mode & 0o111).not.toBe(0);
    expect(pinSkills(emptyLock(), [r!], catalog).skills[0]).toMatchObject({ id: 'brainstorming', commit: repo.commit, scripts: true });
  });

  test('S-3.5/C1: the warning (third-party code, brainstorming starts a local server) comes before anything is copied', () => {
    const repo = skillRepo();
    const root = makeTree({});
    const warnings: string[] = [];
    const copiedWhenWarned: boolean[] = [];
    withLocalGitFixture(repo, () =>
      installSkills(['brainstorming'], gitCatalog(repo.url, repo.commit), root, root, gitRunner(), {
        harnesses: ['claude', 'codex'],
        withScripts: true,
        warn: (message) => {
          warnings.push(message);
          copiedWhenWarned.push(
            existsSync(join(root, '.claude/skills/brainstorming')) || existsSync(join(root, '.agents/skills/brainstorming')),
          );
        },
      }),
    );
    const all = warnings.join('\n');
    expect(all).toMatch(/third-party/i);
    expect(all).toMatch(/local server/i);
    expect(copiedWhenWarned.length).toBeGreaterThan(0);
    expect(copiedWhenWarned.every((copied) => !copied)).toBe(true);
  });
});
