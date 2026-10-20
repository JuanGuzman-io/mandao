import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, test } from 'vitest';

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
