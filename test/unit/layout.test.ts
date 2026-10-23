// mandao-scans: docs/ specs/ test/fixtures/ — reads docs/spec-anatomy.md, README.md, the MDO-0001 spec folder and the sample spec by path.
import { cpSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { readLayout } from '../../src/scripts/spec.js';
import { acStatus, parseRequirements, parseStory, parseTasks, trace } from '../../src/spec/index.js';
import { anatomyTables, layoutFindings, layoutManifest, tasksHaveOwnFile } from '../../src/spec/layout.js';
import { makeTree } from '../helpers.js';

/**
 * ASSUMPTION (the spec fixes behavior, not the signature, design D1):
 * - `layoutManifest(version, depth)` is pure and returns plain data naming files (strings, at any nesting).
 * - `layoutFindings(input)` is pure (architecture: IO belongs in scripts). Its input is data only:
 *   `{ story: { schema_version, status }, docs: { 'spec.md' | 'requirements.md' | 'design.md': <frontmatter data> }, entries }`
 *   where `story` is the story.md frontmatter, `docs` has one key per present depth-bearing document with that
 *   document's frontmatter, and `entries` are the folder's entry names (directories end in `/`).
 *   It answers `{ ok, version, depth, missing, unexpected }`, file names relative to the folder, and throws on a
 *   `schema_version` other than 1 or 2.
 * - `readLayout(folder)` in `src/scripts/spec.ts` reads the folder and calls `layoutFindings` (same answer).
 */
const root = join(import.meta.dirname, '../..');
const MDO1 = join(root, 'specs/MDO-0001-list-pinned-skills');
const DEPTHS = ['lite', 'standard', 'full'] as const;

/** Every string inside a manifest, however it is nested. */
const names = (v: unknown): string[] => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(names) : []);

describe('layout manifest and pure findings (AC-2/C1, S-2.3/C1)', () => {
  test('S-2.3/C1: version 1 manifest lists the files version 1 allowed, including root execution.md and progress.yml', () => {
    const v1 = names(layoutManifest(1, 'standard'));
    expect(v1).toContain('execution.md');
    expect(v1).toContain('progress.yml');
  });

  test('S-2.3/C1: version 1 lite with requirements.md + design.md (depth: lite) is lite and ok (D1)', () => {
    const found = layoutFindings({
      story: { schema_version: 1, status: 'closed' },
      docs: { 'requirements.md': { depth: 'lite' }, 'design.md': { depth: 'lite' } },
      entries: ['story.md', 'requirements.md', 'design.md', 'tasks.md', 'execution.md', 'progress.yml', 'release-notes.md'],
    });
    expect(found).toMatchObject({ version: 1, depth: 'lite', ok: true, missing: [], unexpected: [] });
  });

  test('D1: with no depth: in any document, lite is the fallback only when spec.md exists', () => {
    const found = layoutFindings({
      story: { schema_version: 2, status: 'draft' },
      docs: { 'spec.md': {} },
      entries: ['story.md', 'spec.md'],
    });
    expect(found).toMatchObject({ version: 2, depth: 'lite' });
  });

  test('S-2.3/C1: the version is the story schema_version, never inferred from the files present', () => {
    const entries = ['story.md', 'requirements.md', 'design.md', 'tasks.md', 'execution.md', 'progress.yml'];
    const docs = { 'requirements.md': { depth: 'standard' }, 'design.md': { depth: 'standard' } };
    expect(layoutFindings({ story: { schema_version: 1, status: 'in-progress' }, docs, entries }).ok).toBe(true);
    // The same files do not pass once the story says version 2.
    expect(layoutFindings({ story: { schema_version: 2, status: 'in-progress' }, docs, entries }).ok).toBe(false);
  });

  test('S-2.3/C1: a schema_version other than 1 or 2 is an error', () => {
    for (const schema_version of [3, 0, '1', undefined]) {
      expect(() => layoutFindings({ story: { schema_version, status: 'draft' }, docs: {}, entries: ['story.md'] })).toThrow(
        /schema_version/,
      );
    }
  });

  test('S-2.1: a version 2 standard input names the missing design.md and the stray notes.md', () => {
    const found = layoutFindings({
      story: { schema_version: 2, status: 'verified' },
      docs: { 'requirements.md': { depth: 'standard' } },
      entries: ['story.md', 'requirements.md', 'tasks.md', 'notes.md'],
    });
    expect(found.ok).toBe(false);
    expect(found.missing).toContain('design.md');
    expect(found.unexpected).toContain('notes.md');
  });
});

describe('readLayout reads the folder and answers the same (scripts wrapper)', () => {
  test('S-2.3/C1: the real MDO-0001 folder, version 1 lite, is ok', () => {
    const dir = makeTree({});
    cpSync(MDO1, dir, { recursive: true });
    expect(readLayout(dir)).toMatchObject({ version: 1, depth: 'lite', ok: true, missing: [], unexpected: [] });
  });

  test('S-2.3/C1: the same files with the story at schema_version 2 do not pass', () => {
    const story = readFileSync(join(MDO1, 'story.md'), 'utf8').replace(/^schema_version: 1$/m, 'schema_version: 2');
    const dir = makeTree({ 'story.md': story });
    for (const f of ['requirements.md', 'design.md', 'tasks.md', 'execution.md', 'progress.yml']) {
      cpSync(join(MDO1, f), join(dir, f));
    }
    expect(readLayout(dir).ok).toBe(false);
  });

  test('a schema_version of 3 is an error', () => {
    const dir = makeTree({ 'story.md': '---\nschema_version: 3\nstatus: draft\n---\n# s\n' });
    expect(() => readLayout(dir)).toThrow(/schema_version/);
  });

  test('a separate layout: key does not change the version', () => {
    const story = '---\nschema_version: 2\nlayout: 1\nid: MDO-0099\nstatus: draft\n---\n# s\n';
    const dir = makeTree({ 'story.md': story, 'execution.md': 'x', 'progress.yml': 'x' });
    expect(readLayout(dir).unexpected).toEqual(expect.arrayContaining(['execution.md', 'progress.yml']));
  });
});

describe('a removed AC is skipped (T1 done-when, traceability.md)', () => {
  const sample = join(root, 'test/fixtures/spec/MDO-0001-skills-list');
  const read = (f: string) => readFileSync(join(sample, f), 'utf8');
  const md = read('story.md').replace('### AC-2', '### AC-3 — Gone\ncritical: false\nstatus: removed\n\nMoved away.\n\n### AC-2');
  const story = parseStory(md).story!;
  const reqs = parseRequirements(read('requirements.md')).requirements;
  const tasks = parseTasks(read('tasks.md')).tasks;

  test('parseStory sets removed for status: removed and only for it', () => {
    expect(story.acs.map((a) => [a.id, a.removed])).toEqual([
      ['AC-1', false],
      ['AC-3', true],
      ['AC-2', false],
    ]);
  });

  test('trace gives no GAP for a removed AC', () => {
    const t = trace(story, reqs, tasks);
    expect(t.findings.filter((f) => f.ref.startsWith('AC-3'))).toEqual([]);
    expect(t.rows.map((r) => r.ref)).not.toContain('AC-3');
  });

  test('acStatus leaves a removed AC out', () => {
    expect(acStatus(story, tasks, [], new Set(), new Map()).map((a) => a.ref)).toEqual(['AC-1', 'AC-2']);
  });
});

describe('docs/spec-anatomy.md is built from the manifest (S-8.1)', () => {
  test('S-8.1: the page contains the tables rendered from the manifest, exactly', () => {
    expect(readFileSync(join(root, 'docs/spec-anatomy.md'), 'utf8')).toContain(anatomyTables());
  });

  test('S-8.1: every file the manifest lists per depth is in the rendered tables', () => {
    const tables = anatomyTables();
    for (const depth of DEPTHS) {
      const files = names(layoutManifest(2, depth).required).filter((n) => /\.[a-z]+$/.test(n));
      expect(files.length, depth).toBeGreaterThan(0);
      for (const f of files) expect(tables, `${depth}: ${f}`).toContain(f);
    }
  });

  test('phase 13: mockups/ is a version 2 conditional at every depth, rendered with its purpose; version 1 does not allow it', () => {
    for (const depth of DEPTHS) expect(layoutManifest(2, depth).optional, depth).toContain('mockups/');
    expect(layoutManifest(1, 'standard').optional).not.toContain('mockups/');
    expect(anatomyTables()).toContain('| `mockups/` | UI mock approved with the design | only when a mock was made |');
    const entries = ['story.md', 'spec.md', 'mockups/'];
    expect(layoutFindings({ story: { schema_version: 2, status: 'draft' }, docs: { 'spec.md': {} }, entries }).unexpected).toEqual([]);
  });

  test('S-8.1: the README links the page', () => {
    expect(readFileSync(join(root, 'README.md'), 'utf8')).toContain('docs/spec-anatomy.md');
  });
});

describe('tasksHaveOwnFile: the layout version decides where tasks live (MDO-0011 AC-1)', () => {
  test('version 2 always has tasks.md, version 1 does not; any other value is no known layout', () => {
    expect(tasksHaveOwnFile(2)).toBe(true);
    expect(tasksHaveOwnFile(1)).toBe(false);
    for (const v of [3, 2.5, '2', undefined, null]) expect(tasksHaveOwnFile(v), String(v)).toBe(false);
  });
});
