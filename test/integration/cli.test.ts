import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, expect, test, vi } from 'vitest';
import { parse } from 'yaml';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { makeTree, pkg } from '../helpers.js';

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

function workspace() {
  const root = makeTree({ '.git/': '', 'package.json': pkg('shop') });
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.' }],
    harnesses: ['claude', 'copilot'],
  });
  syncProject(root);
  return root;
}

const run = (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', ...args]);

test('models set --harness changes only that harness', async () => {
  const root = workspace();
  await run(root, 'models', 'set', 'reviewer', 'GPT-6 Luna', '--harness', 'copilot');
  const models = parse(readFileSync(join(root, '.mandao/models.yml'), 'utf8'));
  expect(models.harnesses).toEqual({ copilot: { reviewer: 'GPT-6 Luna' } });
});

test('models set --tier writes a per-tier implementer', async () => {
  const root = workspace();
  await run(root, 'models', 'set', 'implementer', 'opus', '--harness', 'claude', '--tier', 'strong');
  expect(parse(readFileSync(join(root, '.mandao/models.yml'), 'utf8')).harnesses.claude).toEqual({ implementer: { strong: 'opus' } });
});
