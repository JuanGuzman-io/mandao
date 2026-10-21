// mandao-scans: none — lists only the temporary trees it creates.
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { catalogSchema, lockSchema } from '../../src/schemas/index.js';
import { installSkills, pinSkills, shellRunner } from '../../src/skills/install.js';
import { makeTree } from '../helpers.js';

// MDO-0009 T2, review attempt 1: a failure while copying must not throw (AC-3/C1, S-3.3/C1), and a folder that
// merely exists must not be pinned with the catalog commit unverified (S-2.2, FR-2, D3).

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false', ...args], {
    cwd,
    encoding: 'utf8',
  }).trim();

/** A local git repository with `skills/brainstorming/{SKILL.md,guide.md}`, tagged `v7.0.0`. */
function skillRepo() {
  const dir = makeTree({
    'skills/brainstorming/SKILL.md': '---\nname: brainstorming\n---\nUpstream body\n',
    'skills/brainstorming/guide.md': 'a document',
  });
  git(dir, 'init', '--quiet', '--initial-branch=main');
  git(dir, 'config', 'uploadpack.allowFilter', 'true');
  git(dir, 'add', '-A');
  git(dir, 'commit', '--quiet', '-m', 'v7');
  git(dir, 'tag', 'v7.0.0');
  return { url: `file://${dir}`, commit: git(dir, 'rev-parse', 'HEAD') };
}

const catalogFor = (url: string, commit: string) =>
  catalogSchema.parse({
    schema_version: 1,
    bootstrap: ['brainstorming'],
    skills: {
      brainstorming: {
        version: '7.0.0',
        author: 'a',
        license: 'MIT',
        vetted: true,
        binding: 'core',
        phases: ['constitution', 'story', 'specify'],
        description: 'Elicit intent.',
        source: { type: 'git', url, ref: 'v7.0.0', path: 'skills/brainstorming', commit },
      },
    },
    technologies: {},
  });

const emptyLock = () => lockSchema.parse({ schema_version: 1, mandao: '0.1.0', config_hash: 'sha256-x', layers: [], files: [] });

/** Runs `fn` with the OS temporary folder pointed at a fresh folder, and returns what `fn` left in it. */
function leftInTemp<T>(fn: () => T): { value: T; left: string[] } {
  const fresh = makeTree({});
  const before = process.env.TMPDIR;
  process.env.TMPDIR = fresh;
  try {
    return { value: fn(), left: readdirSync(fresh) };
  } finally {
    if (before === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = before;
  }
}

const manualStep = (detail: string | undefined, url: string, commit: string) => {
  for (const part of [url, 'v7.0.0', commit, 'skills/brainstorming']) expect(detail).toContain(part);
};

const isRoot = process.getuid?.() === 0;

describe('a copy that fails does not throw (AC-3/C1, S-3.3/C1)', () => {
  test.skipIf(isRoot)(
    'AC-3/C1 and S-3.3/C1: a read-only skills folder gives `failed` with the error and the manual step, no partial folder, nothing in temp',
    () => {
      const repo = skillRepo();
      const root = makeTree({ '.claude/skills/': '' });
      const readOnly = join(root, '.claude/skills');
      chmodSync(readOnly, 0o555);
      try {
        const run = () =>
          leftInTemp(() =>
            installSkills(['brainstorming'], catalogFor(repo.url, repo.commit), root, root, shellRunner, {
              harnesses: ['claude', 'codex'],
            }),
          );
        let outcome: ReturnType<typeof run> | undefined;
        expect(() => {
          outcome = run();
        }).not.toThrow();
        const [r] = outcome?.value ?? [];
        expect(r?.status).toBe('failed');
        expect(r?.detail).toMatch(/EACCES|EPERM|permission/i);
        manualStep(r?.detail, repo.url, repo.commit);
        expect(r?.detail).toContain('.claude/skills');
        expect(existsSync(join(root, '.claude/skills/brainstorming'))).toBe(false);
        expect(existsSync(join(root, '.agents/skills/brainstorming'))).toBe(false);
        expect(outcome?.left).toEqual([]);
        expect(pinSkills(emptyLock(), outcome?.value ?? [], catalogFor(repo.url, repo.commit)).skills).toEqual([]);
      } finally {
        chmodSync(readOnly, 0o755);
      }
    },
  );
});

describe('a folder that merely exists is not pinned unverified (S-2.2, FR-2, D3)', () => {
  const setup = () => {
    const repo = skillRepo();
    const root = makeTree({ '.claude/skills/brainstorming/': '', '.agents/skills/brainstorming/': '' });
    const catalog = catalogFor(repo.url, repo.commit);
    const { value, left } = leftInTemp(() =>
      installSkills(['brainstorming'], catalog, root, root, shellRunner, { harnesses: ['claude', 'codex'] }),
    );
    return { repo, root, catalog, value, left };
  };

  test('S-2.2 and D3: empty existing folders are reported pending, "already exists" and "not verified", with the kept folders and the manual step', () => {
    const { repo, value } = setup();
    expect(value[0]?.status).toBe('pending');
    expect(value[0]?.detail).toMatch(/already exists/i);
    expect(value[0]?.detail).toMatch(/not verified|unverified/i);
    expect(value[0]?.detail).toContain('.claude/skills/brainstorming');
    expect(value[0]?.detail).toContain('.agents/skills/brainstorming');
    manualStep(value[0]?.detail, repo.url, repo.commit);
  });

  test('S-2.2 and D3: the lock does not pin the skill with the catalog commit', () => {
    const { value, catalog } = setup();
    const pinned = pinSkills(emptyLock(), value, catalog).skills;
    expect(pinned.find((s) => s.id === 'brainstorming')?.commit).toBeUndefined();
    expect(pinned).toEqual([]);
  });

  test('S-3.1/C1: the existing folders are left untouched and nothing is left in temp', () => {
    const { root, left } = setup();
    expect(readdirSync(join(root, '.claude/skills/brainstorming'))).toEqual([]);
    expect(readdirSync(join(root, '.agents/skills/brainstorming'))).toEqual([]);
    expect(left).toEqual([]);
  });

  test('S-2.2 and D3: a folder holding other files but no SKILL.md is not verified either, and is left as is', () => {
    const repo = skillRepo();
    const root = makeTree({ '.claude/skills/brainstorming/notes.txt': 'mine' });
    mkdirSync(join(root, '.agents/skills'), { recursive: true });
    writeFileSync(join(root, '.agents/skills/brainstorming'), 'a file, not a folder');
    const catalog = catalogFor(repo.url, repo.commit);
    const [r] = installSkills(['brainstorming'], catalog, root, root, shellRunner, { harnesses: ['claude', 'codex'] });
    expect(r?.status).toBe('pending');
    expect(r?.detail).toMatch(/not verified|unverified/i);
    expect(readdirSync(join(root, '.claude/skills/brainstorming'))).toEqual(['notes.txt']);
    expect(pinSkills(emptyLock(), [r!], catalog).skills).toEqual([]);
  });
});
