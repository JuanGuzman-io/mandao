import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, test } from 'vitest';
import { findClimbs, withoutAllowed } from '../guards.js';

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));

/** ADR 0007: every write goes through src/writer, so idempotence and edit detection apply everywhere. */
test('only src/writer writes to the filesystem', () => {
  const root = join(import.meta.dirname, '../..');
  const offenders = files(join(root, 'src'))
    .filter((f) => !relative(root, f).startsWith('src/writer/'))
    .filter((f) =>
      /\b(writeFileSync|appendFileSync|mkdirSync|rmSync|rmdirSync|renameSync|copyFileSync|unlinkSync)\b/.test(readFileSync(f, 'utf8')),
    );
  expect(offenders.map((f) => relative(root, f))).toEqual([]);
});

/** MDO-0006 D4: temporary folders come from makeTree, so test/setup.ts removes them after each file. */
test('only test/helpers.ts creates temporary folders', () => {
  const root = join(import.meta.dirname, '../..');
  // doctor-process.test.ts creates its folder under node_modules/.cache/ and removes it in its own afterAll (D4).
  const ALLOWED = ['test/integration/doctor-process.test.ts'];
  const offenders = files(join(root, 'test'))
    .map((f) => relative(root, f))
    .filter((f) => f !== 'test/unit/architecture.test.ts' && f !== 'test/helpers.ts')
    .filter((f) => !ALLOWED.includes(f))
    .filter((f) => /\bmkdtemp(Sync)?\b|\btmpdir\b/.test(readFileSync(join(root, f), 'utf8')));
  expect(offenders).toEqual([]);
});

/**
 * MDO-0007 D4/D5: no test calls a node:path function that climbs out of its work folder (join/resolve with a
 * '..' segment, dirname of a makeTree folder). A finding is excused only by an exact { file, call } entry.
 */
test('no test climbs out of its work folder', () => {
  const root = join(import.meta.dirname, '../..');
  const ALLOWED = [
    {
      file: 'test/unit/helpers.test.ts',
      call: 'dirname(makeTree({}))',
      // MDO-0006 S-2.1 needs a look-alike folder next to a workspace and removes it in its own finally.
      why: 'look-alike folder next to a workspace, removed in the same test',
    },
  ];
  const offenders = files(join(root, 'test'))
    .filter((f) => f.endsWith('.ts'))
    .map((f) => relative(root, f))
    .flatMap((f) => withoutAllowed(f, findClimbs(f, readFileSync(join(root, f), 'utf8')), ALLOWED).map((c) => `${f}:${c.line} ${c.text}`));
  expect(offenders).toEqual([]);
});
