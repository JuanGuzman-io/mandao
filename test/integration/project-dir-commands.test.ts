import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { requirePreCommitBuilds } from '../../src/cli/run-ledger.js';
import { readConfig, writeYaml } from '../../src/engine/files.js';
import { writeProgress } from '../../src/scripts/checkpoint.js';
import { readSpec } from '../../src/scripts/spec.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

const SPEC = 'specs/MDO-0001-skills-list';
const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');

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

/** A monorepo whose project lives at apps/x: its commands only succeed when run from that folder. */
function monorepo() {
  const root = realpathSync(makeTree({ 'package.json': pkg('mono'), 'apps/x/marker.txt': 'here', 'apps/x/src/a.test.ts': 'x\n' }));
  const fromHere = `node -e "require('fs').accessSync('marker.txt')"`;
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'monorepo',
    projects: [
      {
        name: 'x',
        path: 'apps/x',
        gates: { build: fromHere },
        tests: { impacted: `node -e "require('fs').accessSync(process.argv[1])" {files}` },
      },
    ],
    harnesses: ['claude'],
  });
  return root;
}
const run = (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);

describe('a non-root project’s commands run in its folder (phase 11 review, F7)', () => {
  test('mandao run build', async () => {
    const root = monorepo();
    await run(root, 'build', 'x');
    expect(JSON.parse(out.at(-1)!)).toMatchObject({ status: 'PASS' });
  });

  test('mandao run tests: project-relative impact files resolve', async () => {
    const root = monorepo();
    await run(root, 'tests', 'x', 'apps/x/src/a.test.ts');
    expect(JSON.parse(out.at(-1)!)).toMatchObject({ status: 'PASS' });
  });

  test('the pre-commit build that run commit requires', async () => {
    const root = monorepo();
    initTestRepo(root, '-q', '-b', 'feat/MDO-0001-skills-list');
    const { cpSync } = await import('node:fs');
    cpSync(fixture, join(root, SPEC), { recursive: true });
    const dir = join(root, SPEC);
    const spec = readSpec(dir);
    writeProgress(dir, { ...spec.progress!, pending_commits: [{ task: 'T1', subject: 's', files: [] }] });
    await expect(requirePreCommitBuilds({ root: () => root }, readConfig(root), readSpec(dir))).resolves.toBeUndefined();
  });
});
