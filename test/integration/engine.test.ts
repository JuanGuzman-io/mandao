import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, test } from 'vitest';
import { runDoctor } from '../../src/engine/doctor.js';
import { readLock, writeYaml } from '../../src/engine/files.js';
import { syncGlobal, syncProject } from '../../src/engine/sync.js';
import { makeTree, pkg } from '../helpers.js';

function workspace() {
  const root = makeTree({ '.git/': '', 'package.json': pkg('shop'), 'AGENTS.md': '# House rules\n' });
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.', profile: 'app' }],
    harnesses: ['claude', 'copilot'],
  });
  writeYaml(join(root, '.mandao/models.yml'), { schema_version: 1, harnesses: { claude: { fast: 'haiku', standard: 'sonnet', strong: 'opus' } } });
  return root;
}

const actions = (r: ReturnType<typeof syncProject>) => [...new Set(r.changes.map((c) => c.action))].sort();

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
});

describe('syncProject', () => {
  test('is idempotent and records every generated file in the lock', () => {
    const root = workspace();
    const first = syncProject(root);
    expect(actions(first)).toEqual(['create', 'update']); // AGENTS.md existed, so its block is an update
    expect(actions(syncProject(root))).toEqual(['unchanged']);
    const lock = readLock(join(root, '.mandao/mandao.lock'))!;
    expect(lock.files.map((f) => f.path)).toEqual(expect.arrayContaining(['AGENTS.md', 'CLAUDE.md', '.mandao/commitlint.config.mjs']));
    expect(readFileSync(join(root, 'AGENTS.md'), 'utf8')).toMatch(/^# House rules\n\n<!-- mandao:begin -->/);
  });

  test('removing a harness deletes its files', () => {
    const root = workspace();
    syncProject(root);
    expect(existsSync(join(root, '.github'))).toBe(true);
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'shop', path: '.', profile: 'app' }],
      harnesses: ['claude'],
    });
    const r = syncProject(root);
    expect(r.changes.filter((c) => c.action === 'delete').every((c) => c.path.startsWith('.github/'))).toBe(true);
    expect(existsSync(join(root, '.github'))).toBe(false);
  });

  test('an override wins and survives the next sync', () => {
    const root = workspace();
    syncProject(root);
    const before = readFileSync(join(root, '.claude/skills/mandao-specify/SKILL.md'), 'utf8');
    mkdirSync(join(root, '.mandao/overrides/commands'), { recursive: true });
    writeFileSync(join(root, '.mandao/overrides/commands/specify.patch.yml'), 'description: Our own specify.\n');
    syncProject(root);
    const after = readFileSync(join(root, '.claude/skills/mandao-specify/SKILL.md'), 'utf8');
    expect(before).not.toContain('Our own specify.');
    expect(after).toContain('description: Our own specify.');
  });
});

describe('doctor', () => {
  test('clean after sync; reports drift and config changes', () => {
    const root = workspace();
    syncProject(root);
    // Copilot has no model registry by default, so model separation is instruction-only.
    expect(runDoctor(root).filter((f) => f.level === 'error' || f.level === 'warn').map((f) => f.message)).toEqual([
      expect.stringMatching(/^copilot: "reviewer" must use a different model/),
    ]);

    writeFileSync(join(root, '.claude/skills/mandao-specify/SKILL.md'), 'hand edit');
    writeFileSync(join(root, '.mandao/models.yml'), 'schema_version: 1\nharnesses: {}\n');
    const warns = runDoctor(root).filter((f) => f.level === 'warn').map((f) => f.message);
    expect(warns).toEqual(
      expect.arrayContaining([
        '.claude/skills/mandao-specify/SKILL.md was edited by hand',
        'config.yml or models.yml changed since the last sync',
      ]),
    );
  });

  test('invalid config is an error with the field path', () => {
    const root = workspace();
    writeFileSync(join(root, '.mandao/config.yml'), 'schema_version: 1\nworkspace: galaxy\nprojects: []\nharnesses: [claude]\n');
    const errors = runDoctor(root).filter((f) => f.level === 'error').map((f) => f.message);
    expect(errors.some((m) => m.includes('workspace:'))).toBe(true);
    expect(errors.some((m) => m.includes('projects:'))).toBe(true);
  });
});

test('syncGlobal installs only /mandao-init under the user folders', () => {
  const r = syncGlobal(['claude']);
  expect(r.changes.map((c) => [c.path, c.action])).toEqual([['skills/mandao-init/SKILL.md', 'create']]);
  expect(existsSync(join(process.env.MANDAO_HOME!, '.claude/skills/mandao-init/SKILL.md'))).toBe(true);
});

describe('collectDiff', () => {
  test('works in a repository without commits and counts untracked files', async () => {
    const { execFileSync } = await import('node:child_process');
    const { collectDiff } = await import('../../src/scripts/quick-check.js');
    const root = makeTree({ 'src/a.ts': 'one\ntwo\n', 'package.json': pkg('x', { zod: '^4' }) });
    execFileSync('git', ['init', '-q'], { cwd: root });
    const diff = collectDiff(root, 'HEAD');
    expect(diff.files.map((f) => f.path).sort()).toEqual(['package.json', 'src/a.ts']);
    expect(diff.manifests).toEqual([{ path: 'package.json', before: undefined, after: pkg('x', { zod: '^4' }) }]);
  });
});
