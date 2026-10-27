import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { skillsRestore } from '../../src/cli/skills.js';
import { LOCK_FILE, readLock, writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { installSkills, pinSkills } from '../../src/skills/install.js';
import { git, gitCatalog, gitRunner, skillRepo, withLocalGitFixture } from '../git-skill-fixture.js';
import { initTestRepo, makeTree } from '../helpers.js';

function contents(root: string, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    readdirSync(join(root, prefix), { withFileTypes: true }).flatMap((entry) => {
      const path = join(prefix, entry.name);
      return entry.isDirectory() ? Object.entries(contents(root, path)) : [[path, readFileSync(join(root, path), 'utf8')]];
    }),
  );
}

test('sync ignores an installed git skill and restore recreates its pinned contents', () => {
  const repo = skillRepo();
  const root = makeTree({
    '.mandao/config.yml':
      'schema_version: 1\nworkspace: single\nprojects:\n  - name: app\n    path: .\nharnesses: [codex]\nskills:\n  track: false\n',
  });
  initTestRepo(root);
  syncProject(root);
  const catalog = gitCatalog(repo.url, repo.commit);
  const results = withLocalGitFixture(repo, () =>
    installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['codex'] }),
  );
  const path = join(root, LOCK_FILE);
  writeYaml(path, pinSkills(readLock(path)!, results, catalog));
  const target = join(root, '.agents/skills/brainstorming');
  const original = contents(target);
  writeFileSync(join(repo.dir, 'skills/brainstorming/SKILL.md'), 'changed upstream');
  git(repo.dir, 'add', '-A');
  git(repo.dir, 'commit', '--quiet', '-m', 'new version');
  git(repo.dir, 'tag', '-f', 'v7.0.0');
  syncProject(root);
  expect(readFileSync(join(root, '.gitignore'), 'utf8')).toContain('/.agents/skills/brainstorming/');
  rmSync(target, { recursive: true });
  withLocalGitFixture(repo, () => skillsRestore({ root: () => root }));
  expect(contents(target)).toEqual(original);
  expect(readLock(path)?.skills[0]?.commit).toBe(repo.commit);
});
