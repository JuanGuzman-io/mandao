// mandao-scans: none — lists only the temporary trees it creates.
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

import { installSkills, pinSkills, type Runner, skillFolders } from '../../src/skills/install.js';
import {
  DOCS,
  emptyLock,
  git,
  gitCatalog,
  gitRunner,
  leftInTemp,
  SCRIPTS,
  SKILL_FILES,
  skillRepo,
  withLocalGitFixture,
} from '../git-skill-fixture.js';
import { makeTree } from '../helpers.js';

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
