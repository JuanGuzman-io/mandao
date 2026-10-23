// mandao-scans: none — builds temporary trees; no secrets, no network.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { dropLogCache, specLogInCache, updateState } from '../../src/scripts/spec-log.js';
import { writeText } from '../../src/writer/files.js';
import { logDiscrepancies, specCacheDir, usesLogCache } from '../../src/writer/log-integrity.js';
import { makeTree } from '../helpers.js';

/** A workspace with a version 2 spec whose story id is `id` (or has none), in a folder called `folder`. */
function workspace(id: string | undefined, folder = 'MDO-0001-thing') {
  const root = makeTree({
    '.mandao/config.yml': 'schema_version: 1\n',
    'package.json': '{}\n',
    [`specs/${folder}/story.md`]: `---\nschema_version: 2\n${id === undefined ? '' : `id: '${id}'\n`}---\n# X\n`,
    [`specs/${folder}/_log/execution.md`]: '# Execution\n',
  });
  return { root, spec: join(root, 'specs', folder) };
}
const alive = (root: string) => ['.mandao/config.yml', 'package.json'].map((f) => existsSync(join(root, f)));

describe('specCacheDir: the cache folder is always .mandao/cache/<valid id>', () => {
  test.each([['MDO-0001'], ['PROJ-123'], ['A_B-7']])('a valid id %s gives .mandao/cache/%s', (id) => {
    const { root, spec } = workspace(id);
    expect(specCacheDir(spec)).toBe(join(root, '.mandao', 'cache', id));
  });

  test.each([['..'], ['../..'], ['../../x'], ['MDO-0001/../..'], ['mdo-1'], ['MDO-1/x'], ['.'], ['MDO']])(
    'the story id %s is refused',
    (id) => {
      const { spec } = workspace(id);
      expect(() => specCacheDir(spec)).toThrow();
    },
  );

  test('the folder-name fallback is validated the same way: a name that is not a story id is refused', () => {
    expect(() => specCacheDir(workspace(undefined, 'not-a-story-id').spec)).toThrow();
    expect(() => specCacheDir(workspace(undefined, 'x..y').spec)).toThrow();
  });

  test('the folder-name fallback accepts a folder that starts with a story id', () => {
    const { root, spec } = workspace(undefined, 'MDO-0007-thing');
    expect(specCacheDir(spec)).toBe(join(root, '.mandao', 'cache', 'MDO-0007'));
  });
});

describe('dropLogCache and log writes never touch anything outside .mandao/cache/', () => {
  test.each([['..'], ['../..'], ['../../x']])('dropLogCache with the story id %s refuses, and the config and files survive', (id) => {
    const { root, spec } = workspace(id);
    expect(() => dropLogCache(spec, 'summary')).toThrow();
    expect(alive(root)).toEqual([true, true]);
    expect(existsSync(join(spec, 'story.md'))).toBe(true);
  });

  test('dropLogCache removes only the spec cache folder, not its siblings or .mandao/', () => {
    const { root, spec } = workspace('MDO-0001');
    mkdirSync(join(root, '.mandao/cache/MDO-0001'), { recursive: true });
    mkdirSync(join(root, '.mandao/cache/MDO-0002'), { recursive: true });
    writeFileSync(join(root, '.mandao/cache/MDO-0001/pack.md'), 'x');
    writeFileSync(join(root, '.mandao/cache/MDO-0002/pack.md'), 'y');
    expect(dropLogCache(spec, 'summary')).toBe(true);
    expect(existsSync(join(root, '.mandao/cache/MDO-0001'))).toBe(false);
    expect(existsSync(join(root, '.mandao/cache/MDO-0002/pack.md'))).toBe(true);
    expect(alive(root)).toEqual([true, true]);
  });

  test('a log write for a spec whose id is a path writes no integrity file outside .mandao/cache/', () => {
    const { root, spec } = workspace('../..');
    try {
      writeText(join(spec, '_log/execution.md'), '# Execution\n\nrow\n');
    } catch {
      // refusing is the expected outcome
    }
    expect(existsSync(join(root, 'integrity.json'))).toBe(false);
    expect(existsSync(join(root, '.mandao/integrity.json'))).toBe(false);
  });
});

describe('one version predicate: the log files and the hashes of a spec follow the same layout', () => {
  test.each([
    ['2', true],
    ["'2'", false],
    ['"2"', false],
    ['3', false],
    ['1', false],
  ])('schema_version: %s routes both to the cache: %s', (version, cache) => {
    const root = makeTree({
      '.mandao/config.yml': 'schema_version: 1\n',
      'specs/MDO-0001-thing/story.md': `---\nschema_version: ${version}\nid: MDO-0001\n---\n# X\n`,
    });
    const spec = join(root, 'specs', 'MDO-0001-thing');
    expect([specLogInCache(spec), usesLogCache(spec)]).toEqual([cache, cache]);
  });
});

describe('a spec started by `mandao start`, before its story exists, already follows layout v2', () => {
  test('with only _log/state.yml, logs and hashes go to the cache, never _log/.integrity.json', () => {
    const root = makeTree({
      '.mandao/config.yml': 'schema_version: 1\n',
      'specs/MDO-0001-thing/_log/state.yml': 'start:\n  id: MDO-0001\n',
    });
    const spec = join(root, 'specs', 'MDO-0001-thing');
    expect(specLogInCache(spec)).toBe(true);
    expect(usesLogCache(spec)).toBe(true);
    writeText(join(spec, '_log/execution.md'), '# Execution\n\nrow\n');
    expect(existsSync(join(spec, '_log/.integrity.json'))).toBe(false);
    expect(existsSync(join(root, '.mandao/cache/MDO-0001/integrity.json'))).toBe(true);
  });

  test('a folder with neither story nor state (a quick change) keeps its own files', () => {
    const root = makeTree({ '.mandao/config.yml': 'schema_version: 1\n', 'specs/quick/_log/execution.md': '# Execution\n' });
    expect(specLogInCache(join(root, 'specs', 'quick'))).toBe(false);
    expect(usesLogCache(join(root, 'specs', 'quick'))).toBe(false);
  });

  test('the real start path: empty folder, updateState, a log write, then the story arrives', () => {
    const root = makeTree({ '.mandao/config.yml': 'schema_version: 1\n' });
    const spec = join(root, 'specs', 'MDO-0002-new');
    mkdirSync(spec, { recursive: true });
    updateState(spec, (state) => ({ ...state, start: { title: 'New', id: 'MDO-0002' } }));
    writeText(join(spec, '_log/execution.md'), '# Execution\n\nrow\n');
    expect(existsSync(join(spec, '_log/.integrity.json'))).toBe(false);
    const cached = join(root, '.mandao/cache/MDO-0002/integrity.json');
    expect(JSON.parse(readFileSync(cached, 'utf8'))).toHaveProperty(['_log/execution.md']);
    writeFileSync(join(spec, 'story.md'), '---\nschema_version: 2\nid: MDO-0002\n---\n# X\n');
    expect(logDiscrepancies(spec)).toEqual([]);
  });
});
