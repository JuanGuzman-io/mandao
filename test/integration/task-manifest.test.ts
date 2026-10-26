// mandao-scans: none — lists only the temporary trees it creates.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { readSpec } from '../../src/scripts/spec.js';
import { initTestRepo, makeTree, pkg, reviewFile } from '../helpers.js';

/**
 * Phase 17 (phase 11 trial; MDO-0001/0002): the manifest a task is reviewed and committed with covers the task
 * only: its declared files, the out-of-list files the Leader names, and what the phase 11 brake accepts.
 */
const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  vi.stubEnv('CLAUDE_CODE_SESSION_ID', '');
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

function workspace() {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop'), '.gitignore': '.mandao/cache/\n' }));
  initTestRepo(root, '-q', '-b', 'main');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.', gates: { build: 'none' } }],
    harnesses: ['claude'],
    diagrams: { engine: 'mermaid' },
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  git(root, 'checkout', '-qb', 'feat/MDO-0001-skills-list');
  return root;
}
const put = (root: string, files: Record<string, string>) => {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
};
const run = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
  return JSON.parse(out.at(-1)!);
};
const packManifest = (root: string, pack: string) =>
  (
    JSON.parse(/## Mandao change manifest[\s\S]*?```json\s+([\s\S]*?)\s+```/.exec(readFileSync(join(root, pack), 'utf8'))![1]!) as {
      path: string;
    }[]
  ).map((m) => m.path);
const passAndQueue = (root: string) =>
  run(
    root,
    'checkpoint',
    'MDO-0001',
    '--task',
    'T2',
    '--harness',
    'claude',
    '--verdict',
    'PASS',
    '--reviewer',
    'mandao-reviewer',
    '--review',
    reviewFile('PASS'),
    '--pending-commit',
    'register the skills list command',
  );

describe("a task's manifest covers the task only (phase 17)", () => {
  test('an unrelated change stays out of the review and the commit, and does not block it', async () => {
    const root = workspace();
    put(root, { 'src/cli/skills.ts': 'export const list = 1;\n', 'notes/unrelated.md': 'someone else\n' });
    const { pack } = await run(root, 'review-pack', 'MDO-0001', 'T2');
    expect(packManifest(root, pack)).toEqual(['src/cli/skills.ts']);
    await passAndQueue(root);
    expect(readSpec(join(root, SPEC)).progress!.pending_commits[0]!.files).toEqual(['src/cli/skills.ts']);
    expect(await run(root, 'commit', 'MDO-0001', '--usd', '0')).toMatchObject({ committed: [{ task: 'T2' }] });
    expect(git(root, 'show', '--name-only', '--format=', 'HEAD')).toContain('src/cli/skills.ts');
    expect(git(root, 'show', '--name-only', '--format=', 'HEAD')).not.toContain('notes/unrelated.md');
    expect(git(root, 'status', '--porcelain', '--untracked-files=all')).toContain('notes/unrelated.md');
  });

  test('an out-of-list file enters only when the Leader names it with --include', async () => {
    const root = workspace();
    put(root, { 'src/cli/skills.ts': 'export const list = 1;\n', 'src/cli/format.ts': 'export const f = 1;\n' });
    const { pack } = await run(root, 'review-pack', 'MDO-0001', 'T2', '--include', 'src/cli/format.ts');
    expect(packManifest(root, pack)).toEqual(['src/cli/format.ts', 'src/cli/skills.ts']);
    // review F9: what the pack leaves out, and an --include that matches nothing, are said, never dropped silently.
    put(root, { 'notes/unrelated.md': 'x\n' });
    const r = await run(root, 'review-pack', 'MDO-0001', 'T2', '--include', 'src/cli/fromat.ts');
    expect(r).toMatchObject({
      leftOut: expect.arrayContaining(['notes/unrelated.md', 'src/cli/format.ts']),
      unmatched: ['src/cli/fromat.ts'],
    });
  });
  test('a task that declares the config takes the lock its approved change regenerates (MDO-0001 T1: build none)', async () => {
    const root = workspace();
    await run(root, 'task-files', 'MDO-0001', 'T2', '--add', '.mandao/config.yml');
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'mandao', path: '.', gates: { build: 'none', lint: 'true' } }],
      harnesses: ['claude'],
      diagrams: { engine: 'mermaid' },
    });
    syncProject(root);
    put(root, { 'notes/unrelated.md': 'someone else\n' });
    const { pack } = await run(root, 'review-pack', 'MDO-0001', 'T2');
    const paths = packManifest(root, pack);
    expect(paths).toContain('.mandao/config.yml');
    expect(paths).toContain('.mandao/mandao.lock');
    expect(paths).not.toContain('notes/unrelated.md');
  });
});
