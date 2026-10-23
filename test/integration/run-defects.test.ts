import { execFileSync } from 'node:child_process';
import { cpSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { runDoctor } from '../../src/engine/doctor.js';
import { readConfig, writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { findSpec } from '../../src/scripts/spec.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';

let out: string[];
let err: string[];
let stdout: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  out = [];
  err = [];
  stdout = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
  vi.spyOn(process.stdout, 'write').mockImplementation((s: string | Uint8Array) => {
    stdout.push(String(s));
    return true;
  });
  vi.spyOn(process.stderr, 'write').mockImplementation((s: string | Uint8Array) => {
    err.push(String(s));
    return true;
  });
});
afterEach(() => vi.restoreAllMocks());

function workspace() {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop'), 'test/a.test.ts': 'x\n' }));
  initTestRepo(root, '-q');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.', tests: { impacted: 'node -e "console.log(\'RUNNER-OUTPUT\'); process.exit(1)" {files}' } }],
    harnesses: ['claude'],
    diagrams: { engine: 'mermaid' },
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  return root;
}
const run = (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);

describe('run scripts keep stdout to one JSON value', () => {
  test('run red sends the test runner output to stderr; stdout parses as a single JSON value', async () => {
    const root = workspace();
    await run(root, 'red', 'MDO-0001', 'T2', 'test/a.test.ts');
    expect(out).toHaveLength(1);
    expect(JSON.parse(out[0]!)).toMatchObject({ red: true, task: 'T2' });
    expect(stdout.join('')).not.toContain('RUNNER-OUTPUT');
    expect(err.join('')).toContain('RUNNER-OUTPUT');
  });
});

describe('run commit-msg --trailer', () => {
  test('extra trailers join the trailer block that git parses', async () => {
    const root = workspace();
    await run(
      root,
      'commit-msg',
      'MDO-0001',
      'T2',
      'register skills list',
      '--trailer',
      'Co-Authored-By: A <a@x.io>',
      '--trailer',
      'Reviewed-by: B <b@x.io>',
    );
    const text = JSON.parse(out.at(-1)!).text as string;
    const parsed = execFileSync('git', ['interpret-trailers', '--parse'], { input: text, encoding: 'utf8' });
    expect(parsed.trim().split('\n')).toEqual([
      'Refs: MDO-0001',
      'Mandao-Task: T2',
      expect.stringMatching(/^Mandao-AC: /),
      'Co-Authored-By: A <a@x.io>',
      'Reviewed-by: B <b@x.io>',
    ]);
  });

  test.each([
    ['a newline', 'Co-Authored-By: A\nRefs: X', /newline/],
    ['no Token: value shape', 'just words', /Token: value/],
    ['a key Mandao writes (Refs)', 'Refs: OTHER-1', /Refs/],
    ['a key Mandao writes, any case (mandao-task)', 'mandao-task: T9', /mandao-task/],
  ])('rejects a trailer with %s as an issue and exits non-zero', async (_name, line, issue) => {
    const root = workspace();
    process.exitCode = undefined;
    await run(root, 'commit-msg', 'MDO-0001', 'T2', 'register skills list', '--trailer', line);
    const r = JSON.parse(out.at(-1)!);
    expect(r.issues.join('\n')).toMatch(issue);
    expect(r.text).not.toContain(line);
    expect(process.exitCode).toBe(1);
    process.exitCode = undefined;
  });

  test('without --trailer the message is unchanged', async () => {
    const root = workspace();
    await run(root, 'commit-msg', 'MDO-0001', 'T2', 'register skills list');
    const r = JSON.parse(out.at(-1)!);
    expect(r.text).toBe(`${r.header}\n\n${r.trailers.join('\n')}\n`);
  });
});

describe('doctor gate hint', () => {
  test('says a gate runs from the project folder', () => {
    const root = workspace();
    const hint = runDoctor(root).find((f) => f.message.includes('no command for gates'));
    expect(hint?.fix).toMatch(/runs from the project folder \(projects\[\]\.path\)/);
  });
});

describe('spec lookup', () => {
  test('a relative folder path resolves from the workspace root, not the shell folder', () => {
    const root = workspace();
    const config = readConfig(root);
    const cwd = process.cwd();
    process.chdir(join(root, 'test'));
    try {
      expect(findSpec(root, config, SPEC)).toBe(join(root, SPEC));
    } finally {
      process.chdir(cwd);
    }
  });
});
