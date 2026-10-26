import { existsSync, readdirSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { makeTree, pkg } from '../helpers.js';

let out: string[];
beforeEach(() => {
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
});
afterEach(() => vi.restoreAllMocks());

describe('a command with no spec yet logs outside the spec tree (phase 16)', () => {
  test('telemetry and cost for `workspace` go to .mandao/log/, never to <paths.specs>/quick', async () => {
    const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'shop', path: '.' }],
      harnesses: ['claude'],
    });
    const run = (...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
    await run('event', 'workspace', 'command_start', '--command', 'story');
    expect(JSON.parse(out.at(-1)!).runId).toBeTruthy();
    await run('cost', 'workspace', '--record', '--command', 'story', '--usd', '0.5', '--harness', 'codex');
    expect(existsSync(join(root, '.mandao/log/_log'))).toBe(true);
    expect(readdirSync(join(root, '.mandao/log/_log')).sort()).toEqual(expect.arrayContaining(['costs.yml']));
    expect(existsSync(join(root, 'specs/quick'))).toBe(false);
  });
});
