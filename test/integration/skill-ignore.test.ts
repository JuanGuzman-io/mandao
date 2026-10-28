import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { LOCK_FILE, readLock, writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { initTestRepo, makeTree } from '../helpers.js';

test('sync reports tracked ignored skill files without removing them from the index', () => {
  const root = makeTree({
    '.mandao/config.yml':
      'schema_version: 1\nworkspace: single\nprojects:\n  - name: app\n    path: .\nharnesses: [codex]\nskills:\n  track: false\n',
    '.agents/skills/example/SKILL.md': 'example',
  });
  initTestRepo(root);
  execFileSync('git', ['add', '--', '.agents/skills/example/SKILL.md'], { cwd: root });
  syncProject(root);
  const path = join(root, LOCK_FILE);
  const lock = readLock(path)!;
  lock.skills.push({
    id: 'example',
    version: '1',
    source: 'https://example.com/repo',
    author: 'a',
    license: 'MIT',
    vetted: true,
    commit: 'a'.repeat(40),
    restore: { type: 'git', url: 'https://example.com/repo', path: '.', model_invocation: true },
  });
  writeYaml(path, lock);
  const result = syncProject(root);
  expect(result.warnings.join('\n')).toContain("git rm --cached -r -- '.agents/skills/example'");
  expect(execFileSync('git', ['ls-files', '--', '.agents/skills/example'], { cwd: root, encoding: 'utf8' })).toContain('SKILL.md');
});
