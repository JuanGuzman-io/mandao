// mandao-scans: none — builds a temporary version 2 repo and closes its spec.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { syncProject } from '../../src/engine/sync.js';
import { git, lastOut, repo, run, SPEC, useLogEnv } from '../log-v2-helpers.js';

useLogEnv();

/** The override that makes `sync` render the changed command here; in the real repo the edit to core/ does it. */
const OVERRIDE = '.mandao/overrides/commands/tasks.patch.yml';
const put = (root: string, file: string, text: string) => {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), text);
};

/** Derived docs a project's diagram build leaves; real `sync` does not lock them, so neither does this fixture. */
const REGENERATED = ['docs/commands/tasks.md', 'docs/diagrams/MDO-0001/tasks.mmd', 'docs/diagrams/src/command-tasks.json'];

/**
 * A version 2 spec whose close applied an approved edit to `core/commands/tasks.md`, ran `mandao sync`
 * (an override changes the rendered command) and rebuilt the derived docs, with `src/cli/start.ts` changed on the side.
 */
async function closedSpec() {
  const root = repo(2);
  put(root, 'src/cli/start.ts', 'export const start = 1;\n');
  put(root, 'core/commands/tasks.md', '---\nid: tasks\n---\nold\n');
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'more base');

  put(root, 'core/commands/tasks.md', '---\nid: tasks\n---\nnew, approved by the person\n');
  put(root, OVERRIDE, 'description: "Break an approved spec into tasks, regenerated."\n');
  syncProject(root);
  for (const f of REGENERATED) put(root, f, `${f} regenerated\n`);

  put(root, 'docs/kaizen/lessons.md', '- MDO-0001: a lesson the person approved\n');
  await run(root, 'close-summary', 'MDO-0001', '--closed', '--applied', 'core/commands/tasks.md', '--applied', OVERRIDE);
  put(root, 'src/cli/start.ts', 'export const start = 2; // not recorded by close\n');
  return root;
}
const committed = (root: string) => git(root, 'show', '--name-only', '--format=', 'HEAD').split('\n').filter(Boolean);

describe('close commits what it applied and what was regenerated from it', () => {
  test('S-5.1: one commit holds the spec, the changelog line, the applied edit, the regenerated files and the lock', async () => {
    const root = await closedSpec();
    expect(readFileSync(join(root, SPEC, 'close-summary.md'), 'utf8')).toContain('core/commands/tasks.md');
    const before = git(root, 'rev-list', '--count', 'HEAD');
    await run(root, 'commit-spec', 'MDO-0001', 'close');
    expect(git(root, 'rev-list', '--count', 'HEAD')).toBe(String(Number(before) + 1));
    const files = committed(root);
    expect(files).toEqual(
      expect.arrayContaining([
        `${SPEC}/close-summary.md`,
        'docs/CHANGELOG.md',
        'docs/kaizen/lessons.md',
        'core/commands/tasks.md',
        '.claude/skills/mandao-tasks/SKILL.md',
        '.mandao/mandao.lock',
        ...REGENERATED,
      ]),
    );
    expect(files).not.toContain('src/cli/start.ts');
  });

  test('S-5.2: an unrecorded change to src/cli/start.ts is not committed', async () => {
    const root = await closedSpec();
    await run(root, 'commit-spec', 'MDO-0001', 'close');
    expect(committed(root)).not.toContain('src/cli/start.ts');
    expect(git(root, 'status', '--porcelain')).toBe('M src/cli/start.ts');
  });

  test('S-5.2/C1: the result names the file it left out', async () => {
    const root = await closedSpec();
    await run(root, 'commit-spec', 'MDO-0001', 'close');
    const result = lastOut();
    expect(result.committed).toBe(true);
    expect(result.leftOut).toEqual(['src/cli/start.ts']);
  });
});
