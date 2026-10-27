import { cpSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { renameRef, staleRefs } from '../../src/spec/index.js';
import { makeTree, pkg } from '../helpers.js';

/** Phase 20: a reference fix reaches every document of the spec, and trace names a document left behind (MDO-0001). */
const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';
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

const cli = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', ...args]);
  return JSON.parse(out.at(-1)!);
};

function workspace() {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude'],
  });
  cpSync(fixture, join(root, SPEC), { recursive: true });
  return root;
}

describe('reference renames', () => {
  test('whole references only: FR-1 is not inside NFR-1 or FR-10; an AC rename carries its clauses', () => {
    const r = renameRef('FR-1, NFR-1, FR-10, `FR-1`, S-1.1, AC-2/C1 and AC-2.', 'FR-1', 'FR-3');
    expect(r).toEqual({ text: 'FR-3, NFR-1, FR-10, `FR-3`, S-1.1, AC-2/C1 and AC-2.', count: 2 });
    expect(renameRef('AC-2/C1 and AC-2.', 'AC-2', 'AC-4').text).toBe('AC-4/C1 and AC-4.');
    expect(renameRef('S-1.1 and S-1.10', 'S-1.1', 'S-1.2').text).toBe('S-1.2 and S-1.10');
    expect(() => renameRef('x', 'SEC-1', 'IF-1')).toThrow(/look like/);
  });

  test('a document citing an undefined reference is STALE_REF; examples and other specs are not (review F2)', () => {
    const text = 'Covers AC-1 and AC-9 (FR-1). Like MDO-0003 FR-7.\n\n```\nAC-42 is an example\n```\n';
    const found = staleRefs([{ name: 'design.md', text }], new Set(['AC-1', 'FR-1']));
    // A list of this spec's own references still checks each one (round 2, R2-F2).
    expect(staleRefs([{ name: 'tasks.md', text: 'FR-1: AC-8 / AC-1 AC-7' }], new Set(['AC-1', 'FR-1'])).map((f) => f.ref)).toEqual([
      'AC-8',
      'AC-7',
    ]);
    expect(found).toEqual([
      expect.objectContaining({ type: 'STALE_REF', ref: 'AC-9', message: expect.stringMatching(/^design\.md cites AC-9/) }),
    ]);
  });

  test('a removed AC keeps its record: citing it is not STALE_REF (review F2)', async () => {
    const root = workspace();
    const story = join(root, SPEC, 'story.md');
    writeFileSync(
      story,
      readFileSync(story, 'utf8').replace('### AC-2 — Nothing pinned\n', '### AC-2 — Nothing pinned\nstatus: removed\n'),
    );
    const stale = (await cli(root, 'run', 'trace', 'MDO-0001')).findings.filter((f: { type: string }) => f.type === 'STALE_REF');
    expect(stale).toEqual([]);
  });

  test('run rename-ref fixes every document; trace no longer reports the one left behind', async () => {
    const root = workspace();
    // The story's fix happened (AC-2 → AC-3 there); design still cites the old ID.
    writeFileSync(join(root, SPEC, 'design.md'), '# Design\n\nServes AC-3 through FR-2.\n');
    const story = join(root, SPEC, 'story.md');
    writeFileSync(story, readFileSync(story, 'utf8').replaceAll('AC-2', 'AC-3'));
    const before = await cli(root, 'run', 'trace', 'MDO-0001');
    expect(before.findings.filter((f: { type: string }) => f.type === 'STALE_REF').map((f: { ref: string }) => f.ref)).toContain('AC-2');

    // Undo the half-applied fix and apply it to the whole spec instead.
    writeFileSync(story, readFileSync(story, 'utf8').replaceAll('AC-3', 'AC-2'));
    writeFileSync(join(root, SPEC, 'design.md'), '# Design\n\nServes AC-2 through FR-2.\n');
    // A rename onto a defined ID would merge two references (review F3).
    await expect(cli(root, 'run', 'rename-ref', 'MDO-0001', 'AC-2', 'AC-1')).rejects.toThrow(/AC-1 is already defined/);
    const renamed = await cli(root, 'run', 'rename-ref', 'MDO-0001', 'AC-2', 'AC-3');
    expect(renamed.files.map((f: { file: string }) => f.file)).toEqual(expect.arrayContaining([`${SPEC}/story.md`, `${SPEC}/design.md`]));
    expect(renamed.stale).toEqual([]);
    expect(readFileSync(join(root, SPEC, 'design.md'), 'utf8')).toContain('Serves AC-3 through FR-2.');
  });
});
