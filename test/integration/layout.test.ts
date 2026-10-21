// mandao-scans: specs/ — copies the MDO-0001 spec folder into a temporary tree.
import { cpSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { makeTree, pkg } from '../helpers.js';

/**
 * ASSUMPTION (the spec fixes behavior, not the signature): `mandao run layout <spec>` prints
 * `{ ok, missing, unexpected }` as JSON for that spec, with file names relative to the spec folder.
 */
const repoRoot = join(import.meta.dirname, '../..');
let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
});
afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

function project() {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude'],
  });
  syncProject(root);
  return root;
}
const run = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
  return JSON.parse(out.at(-1)!);
};

/** A verified standard version 2 spec without design.md and with a stray notes.md. */
function brokenV2() {
  const root = project();
  const dir = join(root, 'specs/MDO-0099-broken-layout');
  mkdirSync(dir, { recursive: true });
  const fixture = join(repoRoot, 'test/fixtures/spec/MDO-0001-skills-list');
  const story = readFileSync(join(fixture, 'story.md'), 'utf8')
    .replace(/^schema_version: 1$/m, 'schema_version: 2')
    .replace(/^id: .*$/m, 'id: MDO-0099')
    .replace(/^status: .*$/m, 'status: verified');
  writeFileSync(join(dir, 'story.md'), story);
  // S-2.1 is a standard spec: the sample's documents say lite, so rewrite their depth.
  const standard = (f: string) => readFileSync(join(fixture, f), 'utf8').replace(/^depth: .*$/m, 'depth: standard');
  writeFileSync(join(dir, 'requirements.md'), standard('requirements.md'));
  cpSync(join(fixture, 'tasks.md'), join(dir, 'tasks.md'));
  writeFileSync(join(dir, 'notes.md'), 'stray');
  return root;
}

describe('mandao run layout and the close gate (AC-2)', () => {
  test('S-2.1: names the missing design.md and the stray notes.md, ok false', async () => {
    const r = await run(brokenV2(), 'layout', 'MDO-0099');
    expect(r.ok).toBe(false);
    expect(r.missing).toContain('design.md');
    expect(r.unexpected).toContain('notes.md');
  });

  test('S-2.2: status closed is not allowed and the problem names the layout findings', async () => {
    const r = await run(brokenV2(), 'status', 'MDO-0099', 'closed');
    expect(r.allowed).toBe(false);
    const problems = r.problems.join('\n');
    expect(problems).toContain('design.md');
    expect(problems).toContain('notes.md');
  });

  test('S-2.3: MDO-0001, version 1 with execution.md and progress.yml at its root, is ok', async () => {
    const root = project();
    cpSync(join(repoRoot, 'specs/MDO-0001-list-pinned-skills'), join(root, 'specs/MDO-0001-list-pinned-skills'), {
      recursive: true,
    });
    const r = await run(root, 'layout', 'MDO-0001');
    expect(r).toMatchObject({ ok: true, missing: [], unexpected: [] });
  });

  test('S-2.3 and D1: MDO-0001 reports depth lite (its documents say depth: lite), not standard', async () => {
    const root = project();
    cpSync(join(repoRoot, 'specs/MDO-0001-list-pinned-skills'), join(root, 'specs/MDO-0001-list-pinned-skills'), {
      recursive: true,
    });
    const r = await run(root, 'layout', 'MDO-0001');
    expect(r).toMatchObject({ version: 1, depth: 'lite', ok: true });
  });
});
