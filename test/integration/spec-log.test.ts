import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { readSpec } from '../../src/scripts/spec.js';
import { logPath } from '../../src/scripts/spec-log.js';
import { makeTree, pkg } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';
const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
  for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function repo() {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop'), 'README.md': 'x\n' }));
  git(root, 'init', '-q', '-b', 'feat/MDO-0001-skills-list');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.' }],
    harnesses: ['claude'],
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  writeFileSync(
    join(root, SPEC, 'verify-report.md'),
    '# Verify\n\n## Acceptance criteria → tests\n\n| AC | Clause | Tests | Level | Result |\n|---|---|---|---|---|\n| AC-1 | main | t | unit | PASS |\n',
  );
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}
const run = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
  return JSON.parse(out.at(-1)!);
};
/** The readability move: machine files from the spec root into `_log/`. */
function moveToLog(root: string) {
  mkdirSync(join(root, SPEC, '_log'));
  for (const f of ['execution.md', 'progress.yml']) renameSync(join(root, SPEC, f), join(root, SPEC, '_log', f));
}

describe('machine files in _log/ (readability pass)', () => {
  test('release-status, kaizen and kaizen-compare give the same answers with the log in the root or in _log/', async () => {
    const root = repo();
    const before = {
      status: await run(root, 'release-status', 'MDO-0001'),
      kaizen: await run(root, 'kaizen', 'MDO-0001'),
      compare: await run(root, 'kaizen-compare'),
    };
    expect(before.compare.specs).toHaveLength(1);
    moveToLog(root);
    expect(await run(root, 'release-status', 'MDO-0001')).toEqual(before.status);
    expect(await run(root, 'kaizen', 'MDO-0001')).toEqual(before.kaizen);
    expect(await run(root, 'kaizen-compare')).toEqual(before.compare);
    expect(readSpec(join(root, SPEC)).execution.length).toBeGreaterThan(0);
  });

  test('a new spec writes its log in _log/; an older spec keeps writing in the root, never split', () => {
    const fresh = realpathSync(makeTree({ 'specs/X/story.md': 'x' }));
    expect(logPath(join(fresh, 'specs/X'), 'execution.md')).toBe(join(fresh, 'specs/X/_log/execution.md'));
    expect(logPath(join(fresh, 'specs/X'), 'mutations')).toBe(join(fresh, 'specs/X/_log/mutations'));
    const older = realpathSync(makeTree({ 'specs/Y/execution.md': '# log' }));
    expect(logPath(join(older, 'specs/Y'), 'progress.yml')).toBe(join(older, 'specs/Y/progress.yml'));
    expect(logPath(join(older, 'specs/Y'), 'mutations')).toBe(join(older, 'specs/Y/mutations'));
  });

  test('checkpoint writes to _log/ once the spec has moved', async () => {
    const root = repo();
    moveToLog(root);
    await run(root, 'checkpoint', 'MDO-0001', '--task', 'T2', '--harness', 'claude', '--verdict', 'STARTED', '--tier', 'standard');
    expect(existsSync(join(root, SPEC, 'execution.md'))).toBe(false);
    expect(readFileSync(join(root, SPEC, '_log/execution.md'), 'utf8')).toMatch(/\| T2 \| 1 \| standard \| claude \| — \| — \| STARTED \|/);
    expect(readSpec(join(root, SPEC)).progress?.current?.task).toBe('T2');
  });

  test('close-summary writes the links itself, only to documents that exist', async () => {
    const root = repo();
    mkdirSync(join(root, 'docs/releases/MDO-0001'), { recursive: true });
    writeFileSync(join(root, 'docs/releases/MDO-0001/release-notes.md'), 'notes\n');
    await run(root, 'close-summary', 'MDO-0001');
    const text = readFileSync(join(root, SPEC, 'close-summary.md'), 'utf8');
    expect(text).toContain('- [Release notes](../../docs/releases/MDO-0001/release-notes.md)');
    expect(text).toContain('- [Verify report](verify-report.md)');
    expect(text).not.toContain('Technical notes');
    expect(text).not.toContain('Kaizen');
  });
});
