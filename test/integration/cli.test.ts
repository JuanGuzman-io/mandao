import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, expect, test, vi } from 'vitest';
import { parse } from 'yaml';
import { buildProgram } from '../../src/cli/program.js';
import { LOCK_FILE, LOCK_HEADER, readLock, writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { makeTree, pkg } from '../helpers.js';

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

function workspace() {
  const root = makeTree({ '.git/': '', 'package.json': pkg('shop') });
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.' }],
    harnesses: ['claude', 'copilot'],
  });
  syncProject(root);
  return root;
}

const run = (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', ...args]);

test('models set --harness changes only that harness', async () => {
  const root = workspace();
  await run(root, 'models', 'set', 'reviewer', 'GPT-6 Luna', '--harness', 'copilot');
  const models = parse(readFileSync(join(root, '.mandao/models.yml'), 'utf8'));
  expect(models.harnesses).toEqual({ copilot: { reviewer: 'GPT-6 Luna' } });
});

test('models set --tier writes a per-tier implementer', async () => {
  const root = workspace();
  await run(root, 'models', 'set', 'implementer', 'opus', '--harness', 'claude', '--tier', 'strong');
  expect(parse(readFileSync(join(root, '.mandao/models.yml'), 'utf8')).harnesses.claude).toEqual({ implementer: { strong: 'opus' } });
});

test('prints the add hint and exits 0 when nothing is pinned', async () => {
  const root = workspace();
  process.exitCode = undefined;
  try {
    await run(root, 'skills', 'list');
    expect(console.log).toHaveBeenCalledWith('  No skills pinned. Run `mandao skills add <id|pack>` to add one.');
    expect(process.exitCode ?? 0).toBe(0);
  } finally {
    process.exitCode = undefined;
  }
});

test('prints a JSON array of id, version, vetted, source, license and trust', async () => {
  const root = workspace();
  const lockPath = join(root, LOCK_FILE);
  const lock = readLock(lockPath)!;
  lock.skills = [
    { id: 'zeta', version: '2.0.0', source: 'owner/zeta', author: 'a', license: 'MIT', vetted: false },
    { id: 'alpha', version: '1.0.0', source: 'owner/alpha', author: 'a', license: 'MIT (frontmatter)', trust: 'vendor', vetted: true },
  ];
  writeYaml(lockPath, lock, LOCK_HEADER);
  await run(root, 'skills', 'list', '--json');
  expect(console.log).toHaveBeenCalledTimes(1);
  expect(JSON.parse(vi.mocked(console.log).mock.calls[0]![0])).toEqual([
    { id: 'alpha', version: '1.0.0', vetted: true, source: 'owner/alpha', license: 'MIT (frontmatter)', trust: 'vendor' },
    { id: 'zeta', version: '2.0.0', vetted: false, source: 'owner/zeta', license: 'MIT' },
  ]);
});

test('prints an empty JSON array when nothing is pinned', async () => {
  const root = workspace();
  await run(root, 'skills', 'list', '--json');
  expect(console.log).toHaveBeenCalledTimes(1);
  expect(JSON.parse(vi.mocked(console.log).mock.calls[0]![0])).toEqual([]);
});

function pinMixed(root: string) {
  const lockPath = join(root, LOCK_FILE);
  const lock = readLock(lockPath)!;
  lock.skills = [
    { id: 'zeta', version: '2.0.0', source: 'owner/zeta', author: 'a', license: 'MIT', vetted: false },
    { id: 'alpha', version: '1.0.0', source: 'owner/alpha', author: 'a', license: 'MIT', vetted: true },
  ];
  writeYaml(lockPath, lock, LOCK_HEADER);
}

test('--unvetted prints only unvetted skills, in text and JSON', async () => {
  const root = workspace();
  pinMixed(root);
  await run(root, 'skills', 'list', '--unvetted');
  const lines = vi.mocked(console.log).mock.calls.map((call) => String(call[0]));
  expect(lines).toHaveLength(1);
  expect(lines[0]).toContain('zeta@2.0.0');
  vi.mocked(console.log).mockClear();
  await run(root, 'skills', 'list', '--unvetted', '--json');
  expect(JSON.parse(vi.mocked(console.log).mock.calls[0]![0])).toEqual([
    { id: 'zeta', version: '2.0.0', vetted: false, source: 'owner/zeta', license: 'MIT' },
  ]);
});

test('--vetted prints only vetted skills', async () => {
  const root = workspace();
  pinMixed(root);
  await run(root, 'skills', 'list', '--vetted');
  const lines = vi.mocked(console.log).mock.calls.map((call) => String(call[0]));
  expect(lines).toHaveLength(1);
  expect(lines[0]).toContain('alpha@1.0.0');
});

test('--vetted with --unvetted fails with exit code 1', async () => {
  const root = workspace();
  pinMixed(root);
  await expect(run(root, 'skills', 'list', '--vetted', '--unvetted')).rejects.toThrow(/--vetted.*--unvetted/);
  expect(console.log).not.toHaveBeenCalled();
});
