// mandao-scans: none — reads only the temporary skill tree created by this test.
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import type { Catalog } from '../../src/schemas/index.js';

/** The catalog the CLI reads is the fixture's, so its pin matches the legacy lock (PR #42 review). */
const fixture = vi.hoisted(() => ({ catalog: undefined as Catalog | undefined }));
vi.mock('../../src/engine/catalog.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/engine/catalog.js')>();
  return { ...actual, readCatalog: () => fixture.catalog ?? actual.readCatalog() };
});

const { skillsRestore } = await import('../../src/cli/skills.js');
const { LOCK_FILE, readLock, writeYaml } = await import('../../src/engine/files.js');
const { syncProject } = await import('../../src/engine/sync.js');
const { installSkills, pinSkills } = await import('../../src/skills/install.js');
const { gitCatalog, gitRunner, skillRepo, withLocalGitFixture } = await import('../git-skill-fixture.js');
const { initTestRepo, makeTree } = await import('../helpers.js');

afterEach(() => {
  fixture.catalog = undefined;
});

test('a skill pinned before beta.3 is ignored and restored once sync records its recipe from the copy on disk', () => {
  const repo = skillRepo();
  fixture.catalog = gitCatalog(repo.url, repo.commit);
  const root = makeTree({
    '.mandao/config.yml':
      'schema_version: 1\nworkspace: single\nprojects:\n  - name: app\n    path: .\nharnesses: [claude]\nskills:\n  track: false\n',
  });
  initTestRepo(root);
  syncProject(root);
  const installed = withLocalGitFixture(repo, () =>
    installSkills(['brainstorming'], fixture.catalog!, root, root, gitRunner(), { harnesses: ['claude'] }),
  );
  // A lock written by beta.2: the pin has no restore recipe.
  const path = join(root, LOCK_FILE);
  const pinned = pinSkills(readLock(path)!, installed, fixture.catalog!);
  writeYaml(path, { ...pinned, skills: pinned.skills.map(({ restore: _, ...s }) => s) });

  syncProject(root);
  expect(readLock(path)?.skills[0]?.restore).toEqual({
    type: 'git',
    url: repo.url,
    path: 'skills/brainstorming',
    model_invocation: true,
  });
  expect(readFileSync(join(root, '.gitignore'), 'utf8')).toContain('/.claude/skills/brainstorming/');

  // A clone without the copy restores it from the recipe now in the lock.
  const skill = join(root, '.claude/skills/brainstorming/SKILL.md');
  const original = readFileSync(skill, 'utf8');
  rmSync(join(root, '.claude/skills/brainstorming'), { recursive: true });
  withLocalGitFixture(repo, () => skillsRestore({ root: () => root }));
  expect(readFileSync(skill, 'utf8')).toBe(original);
});
