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

describe('reference renames', () => {
  test('whole references only: FR-1 is not inside NFR-1 or FR-10; an AC rename carries its clauses', () => {
    const r = renameRef('FR-1, NFR-1, FR-10, `FR-1`, S-1.1, AC-2/C1 and AC-2.', 'FR-1', 'FR-3');
    expect(r).toEqual({ text: 'FR-3, NFR-1, FR-10, `FR-3`, S-1.1, AC-2/C1 and AC-2.', count: 2 });
    expect(renameRef('AC-2/C1 and AC-2.', 'AC-2', 'AC-4').text).toBe('AC-4/C1 and AC-4.');
    expect(renameRef('S-1.1 and S-1.10', 'S-1.1', 'S-1.2').text).toBe('S-1.2 and S-1.10');
    expect(() => renameRef('x', 'SEC-1', 'IF-1')).toThrow(/look like/);
  });

  test('a document citing an undefined reference is STALE_REF', () => {
    const found = staleRefs([{ name: 'design.md', text: 'Covers AC-1 and AC-9 (FR-1).' }], new Set(['AC-1', 'FR-1']));
    expect(found).toEqual([
      expect.objectContaining({ type: 'STALE_REF', ref: 'AC-9', message: expect.stringMatching(/^design\.md cites AC-9/) }),
    ]);
  });

  test('run rename-ref fixes every document; trace no longer reports the one left behind', async () => {
    const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'mandao', path: '.' }],
      harnesses: ['claude'],
    });
    cpSync(fixture, join(root, SPEC), { recursive: true });
    // The story's fix happened (AC-2 → AC-3 there); design still cites the old ID.
    writeFileSync(join(root, SPEC, 'design.md'), '# Design\n\nServes AC-3 through FR-2.\n');
    const story = join(root, SPEC, 'story.md');
    writeFileSync(story, readFileSync(story, 'utf8').replaceAll('AC-2', 'AC-3'));
    const before = await cli(root, 'run', 'trace', 'MDO-0001');
    expect(before.findings.filter((f: { type: string }) => f.type === 'STALE_REF').map((f: { ref: string }) => f.ref)).toContain('AC-2');

    // Undo the half-applied fix and apply it to the whole spec instead.
    writeFileSync(story, readFileSync(story, 'utf8').replaceAll('AC-3', 'AC-2'));
    writeFileSync(join(root, SPEC, 'design.md'), '# Design\n\nServes AC-2 through FR-2.\n');
    const renamed = await cli(root, 'run', 'rename-ref', 'MDO-0001', 'AC-2', 'AC-3');
    expect(renamed.files.map((f: { file: string }) => f.file)).toEqual(expect.arrayContaining([`${SPEC}/story.md`, `${SPEC}/design.md`]));
    expect(renamed.stale).toEqual([]);
    expect(readFileSync(join(root, SPEC, 'design.md'), 'utf8')).toContain('Serves AC-3 through FR-2.');
  });
});
