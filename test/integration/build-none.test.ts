import { cpSync, existsSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { declaredNoBuild, requirePreCommitBuilds } from '../../src/cli/run-ledger.js';
import { readConfig, writeYaml } from '../../src/engine/files.js';
import { writeProgress } from '../../src/scripts/checkpoint.js';
import { readSpec } from '../../src/scripts/spec.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

// A busy machine would defer the real build below; the budget decision is not what these tests are about.
vi.mock('../../src/scripts/resources.js', async (original) => ({
  ...(await original<typeof import('../../src/scripts/resources.js')>()),
  probeMachine: () => ({ cores: 64, load1: 0, freeMemoryMb: 100_000 }),
}));

const SPEC = 'specs/MDO-0001-skills-list';
const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
/** A build that proves it ran, in its project folder, by writing a file. */
const marker = `node -e "require('fs').writeFileSync('ran.txt', '1')"`;

let out: string[];
beforeEach(() => {
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});
afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

/** A workspace with the given gates.build per project and one pending commit, ready for `run commit`. */
function workspace(builds: Record<string, string | undefined>) {
  const root = realpathSync(makeTree({ 'package.json': pkg('mono'), 'apps/a/marker.txt': 'here', 'apps/b/marker.txt': 'here' }));
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'monorepo',
    projects: Object.entries(builds).map(([name, build]) => ({ name, path: `apps/${name}`, gates: build ? { build } : {} })),
    harnesses: ['claude'],
  });
  initTestRepo(root, '-q', '-b', 'feat/MDO-0001-skills-list');
  cpSync(fixture, join(root, SPEC), { recursive: true });
  const dir = join(root, SPEC);
  writeProgress(dir, { ...readSpec(dir).progress!, pending_commits: [{ task: 'T1', subject: 's', files: [] }] });
  return { root, dir };
}
const check = ({ root, dir }: { root: string; dir: string }) =>
  requirePreCommitBuilds({ root: () => root }, readConfig(root), readSpec(dir));

describe('build: none (Phase 11)', () => {
  test('a project that declares build: none does not block run commit and never runs the string none', async () => {
    const w = workspace({ a: 'none' });
    await expect(check(w)).resolves.toBeUndefined();
    expect(declaredNoBuild(readConfig(w.root))).toEqual(['a']);
  });

  test('only the declared projects without none run their build', async () => {
    const w = workspace({ a: marker, b: 'none' });
    await expect(check(w)).resolves.toBeUndefined();
    expect(declaredNoBuild(readConfig(w.root))).toEqual(['b']);
    expect(existsSync(join(w.root, 'apps/a/ran.txt'))).toBe(true); // a's command ran
    expect(existsSync(join(w.root, 'apps/b/ran.txt'))).toBe(false);
  });

  test('a project is case-sensitive: None is a command, not a declaration', async () => {
    const w = workspace({ a: 'None' });
    expect(declaredNoBuild(readConfig(w.root))).toEqual([]);
    await expect(check(w)).rejects.toThrow(/a build is/);
  });

  test('run commit is still refused when no project declares a build at all', async () => {
    const w = workspace({ a: undefined });
    await expect(check(w)).rejects.toThrow(/configure a build command or `build: none`/);
  });

  test('run build on a none project is skipped, and the gates log says declared none, not not configured', async () => {
    const { root } = workspace({ a: 'none' });
    const run = (...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
    await run('build', 'a');
    expect(JSON.parse(out.at(-1)!)).toMatchObject({ status: 'SKIPPED', reason: expect.stringContaining('none') });
    await run('gates', 'MDO-0001', 'T1');
    const gates = JSON.parse(out.at(-1)!);
    expect(gates.results).toContainEqual({ gate: 'build', status: 'SKIPPED', reason: 'declared none' });
    expect(gates.notConfigured).not.toContain('build');
    expect(readFileSync(join(root, gates.log), 'utf8')).toContain('declared none: build');
  });
});
