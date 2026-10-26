import { cpSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
});
afterEach(() => vi.restoreAllMocks());

/** An approved spec with a task left: next recommends implement. */
function repo(flow?: { chain: boolean }) {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
  initTestRepo(root, '-q', '-b', 'feat/MDO-0001-skills-list');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude', 'codex'],
    ...(flow ? { flow } : {}),
  });
  syncProject(root);
  cpSync(fixture, join(root, 'specs/MDO-0001-skills-list'), { recursive: true });
  return root;
}
const next = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', 'next', 'MDO-0001', ...args]);
  return JSON.parse(out.at(-1)!);
};

describe('run next: complete, copy-ready invocations (phase 16)', () => {
  test('the recommended step and every option carry the spec id, in the harness syntax', async () => {
    const root = repo();
    const claude = await next(root);
    expect(claude.recommended).toMatchObject({ command: '/mandao-implement', invocation: '/mandao-implement MDO-0001' });
    expect(claude.invocations).toEqual(claude.options.map((o: string) => (o.startsWith('/mandao-') ? `${o} MDO-0001` : o)));
    const codex = await next(root, '--harness', 'codex');
    expect(codex.recommended.invocation).toBe('$mandao-implement MDO-0001');
  });

  test('commands chain by default and stop when flow.chain is false', async () => {
    expect((await next(repo())).autoContinue).toBe(true);
    expect((await next(repo({ chain: false }))).autoContinue).toBeUndefined();
  });
});
