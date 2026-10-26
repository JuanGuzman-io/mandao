// mandao-scans: none — lists only the temporary trees it creates.
import { cpSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { readSpec } from '../../src/scripts/spec.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';
let out: string[];
beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});
afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

function workspace(e2e: string) {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
  initTestRepo(root, '-q');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.', tests: { e2e } }],
    harnesses: ['claude'],
    diagrams: { engine: 'mermaid' },
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  return root;
}
const run = (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
const checkpoint = (root: string) =>
  run(
    root,
    'checkpoint',
    'MDO-0001',
    '--task',
    'T2',
    '--verdict',
    'REPORTED',
    '--harness',
    'claude',
    '--implementer',
    'mandao-implementer-standard',
    '--deferred',
    'e2e login|no browser here',
  );

describe('runs deferred to CI (phase 17, MDO-0002)', () => {
  test('repeating the same deferral on later checkpoints keeps one entry', async () => {
    const root = workspace('node -e "process.exit(0)"');
    await checkpoint(root);
    await checkpoint(root);
    expect(readSpec(join(root, SPEC)).progress!.deferred_to_ci).toEqual([{ task: 'T2', tests: ['e2e login'], reason: 'no browser here' }]);
  });

  test('a passing local run of the deferred suite clears it, and a failing one keeps it', async () => {
    const failing = workspace('node -e "process.exit(1)"');
    await checkpoint(failing);
    await run(failing, 'tests', 'shop', '--spec', 'MDO-0001', '--deferred', 'T2');
    expect(JSON.parse(out.at(-1)!)).toMatchObject({ status: 'FAIL', cleared: [] });
    expect(readSpec(join(failing, SPEC)).progress!.deferred_to_ci).toHaveLength(1);
    process.exitCode = undefined;

    const passing = workspace('node -e "process.exit(0)"');
    await checkpoint(passing);
    await run(passing, 'tests', 'shop', '--spec', 'MDO-0001', '--deferred', 'T2');
    expect(JSON.parse(out.at(-1)!)).toMatchObject({ status: 'PASS', cleared: ['T2'] });
    expect(readSpec(join(passing, SPEC)).progress!.deferred_to_ci).toEqual([]);
  });
});
