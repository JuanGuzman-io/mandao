// mandao-scans: src/ test/ — reads these folders by path, so impact selection runs it when they change.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, test } from 'vitest';
import { findClimbs, findProcessExits, findRawGitInits } from '../guards.js';

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

/** Temporary workspaces are unique to each test and removed by the hook for that test ID. */
test('only test/helpers.ts creates temporary folders', () => {
  const root = join(import.meta.dirname, '../..');
  const offenders = files(join(root, 'test'))
    .map((f) => relative(root, f))
    .filter((f) => f !== 'test/unit/architecture.test.ts' && f !== 'test/helpers.ts')
    .filter((f) => /\bmkdtemp(Sync)?\b|\btmpdir\b/.test(readFileSync(join(root, f), 'utf8')));
  expect(offenders).toEqual([]);
});

test('temporary workspaces are deleted by their exact test owner', () => {
  const root = join(import.meta.dirname, '../..');
  const helper = readFileSync(join(root, 'test/helpers.ts'), 'utf8');
  const setup = readFileSync(join(root, 'test/setup.ts'), 'utf8');
  expect(helper).toContain('new AsyncLocalStorage<string>()');
  expect(helper).toContain('new Map<string, Set<string>>()');
  expect(helper).toContain("return makeTreeAt(tmpdir(), 'mandao-test-', files)");
  expect(helper).toMatch(/mkdtempSync\(join\(parent, prefix\)\)/);
  expect(helper).toMatch(/for \(const dir of trees\.get\(owner\) \?\? \[\]\) rmSync\(dir, \{ recursive: true, force: true \}\)/);
  expect(helper).not.toMatch(/readdirSync|glob|mandao-test-\*/);
  expect(setup).toContain('aroundEach((runTest, { task }) => testTreeScope.run(task.id, runTest))');
  expect(setup).toContain('afterEach(({ task }) => removeTrees(task.id))');
  const testCode = files(join(root, 'test'))
    .filter((f) => f.endsWith('.ts') && relative(root, f) !== 'test/helpers.ts')
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
  expect(testCode).not.toMatch(/afterAll\(removeTrees\)|afterEach\(removeTrees\)/);
});

/**
 * MDO-0007 D4/D5: no test calls a node:path function that climbs out of its work folder (join/resolve with a
 * '..' segment, dirname of a makeTree folder). A finding is excused only by an exact { file, call } entry.
 */
test('no test climbs out of its work folder', () => {
  const root = join(import.meta.dirname, '../..');
  const offenders = files(join(root, 'test'))
    .filter((f) => f.endsWith('.ts'))
    .map((f) => relative(root, f))
    .flatMap((f) => findClimbs(f, readFileSync(join(root, f), 'utf8')).map((c) => `${f}:${c.line} ${c.text}`));
  expect(offenders).toEqual([]);
});

/** MDO-0008: gray-matter evals `---js` front matter; only the YAML/JSON-only wrapper may use it. */
test('only src/engine/frontmatter.ts imports gray-matter', () => {
  const root = join(import.meta.dirname, '../..');
  const offenders = files(join(root, 'src'))
    .map((f) => relative(root, f))
    .filter((f) => f !== 'src/engine/frontmatter.ts')
    .filter((f) => /from 'gray-matter'|require\('gray-matter'\)/.test(readFileSync(join(root, f), 'utf8')));
  expect(offenders).toEqual([]);
});

/** Machine-independent fixtures use local Git identity and never terminate before buffered output flushes. */
test('test repos configure local Git identity and test scripts use process.exitCode', () => {
  const root = join(import.meta.dirname, '../..');
  const helper = readFileSync(join(root, 'test/helpers.ts'), 'utf8');
  expect(helper).toMatch(/\['config', '--local', 'user\.name'/);
  expect(helper).toMatch(/\['config', '--local', 'user\.email'/);
  const code = files(join(root, 'test')).filter((f) => /\.(?:[cm]?[jt]sx?)$/.test(f));
  const rawGit = code
    .filter((f) => relative(root, f) !== 'test/helpers.ts')
    .flatMap((f) =>
      findRawGitInits(relative(root, f), readFileSync(f, 'utf8')).map((call) => `${relative(root, f)}:${call.line} ${call.text}`),
    );
  const processExits = code.flatMap((f) =>
    findProcessExits(relative(root, f), readFileSync(f, 'utf8')).map((call) => `${relative(root, f)}:${call.line} ${call.text}`),
  );
  expect(rawGit).toEqual([]);
  expect(processExits).toEqual([]);
  expect(helper).toContain("['config', '--local', 'gc.auto', '0']");
  expect(helper).toContain("['config', '--local', 'maintenance.auto', 'false']");
});
