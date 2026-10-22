import { cpSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

describe('run verify-plan --delivery', () => {
  test.each(['0', 'x'])('--delivery %s is rejected before any plan is built', async (value) => {
    const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
    initTestRepo(root, '-q', '-b', 'main');
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'mandao', path: '.' }],
      harnesses: ['claude'],
    });
    cpSync(fixture, join(root, 'specs/MDO-0001-skills-list'), { recursive: true });
    await expect(
      buildProgram(() => root).parseAsync(['node', 'mandao', 'run', 'verify-plan', 'MDO-0001', '--delivery', value]),
    ).rejects.toThrow('--delivery needs a positive integer');
  });
});
