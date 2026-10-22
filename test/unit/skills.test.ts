// mandao-scans: none — lists only the temporary trees it creates.
import { describe, expect, test } from 'vitest';

import { catalogSchema, lockSchema } from '../../src/schemas/index.js';
import { installSkills, pinSkills, type Runner } from '../../src/skills/install.js';
import { makeTree } from '../helpers.js';

const meta = { version: '1.0.0', author: 'a', license: 'MIT', vetted: true, binding: 'stack', phases: ['implement'], description: 'x' };
const catalog = catalogSchema.parse({
  schema_version: 1,
  bootstrap: [],
  skills: {
    'via-skills': { ...meta, source: { type: 'skills', ref: 'owner/repo' } },
    'via-command': {
      ...meta,
      source: { type: 'command', install: ['uv tool install x', 'x install'], repo: 'https://github.com/o/x', verify: 'x --version' },
    },
    'via-plugin': { ...meta, source: { type: 'plugin', install: ['/plugin install p@m'], repo: 'https://github.com/o/p' } },
  },
  technologies: {},
});

/** Records commands; `ok` decides each command's result. */
function fakeRunner(ok: (cmd: string) => boolean, bins = ['npx', 'uv', 'x']): Runner & { ran: string[] } {
  const ran: string[] = [];
  return {
    ran,
    run: (cmd) => {
      ran.push(cmd);
      return ok(cmd);
    },
    has: (bin) => bins.includes(bin),
  };
}

describe('installSkills', () => {
  test('runs the ecosystem installer, then verifies', () => {
    const root = makeTree({ '.claude/skills/via-skills/SKILL.md': '---\n---\n' });
    const runner = fakeRunner(() => true);
    const [r] = installSkills(['via-skills'], catalog, root, root, runner);
    expect(runner.ran).toEqual(['npx -y skills add owner/repo']);
    expect(r?.status).toBe('installed');
  });

  test('installer commands run in order and stop at the first failure', () => {
    const runner = fakeRunner((cmd) => cmd !== 'x install');
    const [r] = installSkills(['via-command'], catalog, '/tmp', '/tmp', runner);
    expect(runner.ran).toEqual(['uv tool install x', 'x install']);
    expect(r).toMatchObject({ status: 'failed', detail: 'failed: x install' });
  });

  test('a missing tool leaves the skill pending so the command can be printed', () => {
    const runner = fakeRunner(() => true, ['npx']);
    const [r] = installSkills(['via-command'], catalog, '/tmp', '/tmp', runner);
    expect(runner.ran).toEqual([]);
    expect(r).toMatchObject({ status: 'pending', detail: 'uv is not available' });
  });

  test('an installer that succeeds without a verifiable skill is a failure', () => {
    const root = makeTree({});
    const [r] = installSkills(
      ['via-skills'],
      catalog,
      root,
      root,
      fakeRunner(() => true),
    );
    expect(r).toMatchObject({ status: 'failed', detail: 'installer finished but the skill could not be verified' });
  });

  test('agent-side installs are never run by Mandao', () => {
    const runner = fakeRunner(() => true);
    const root = makeTree({});
    const [r] = installSkills(['via-plugin'], catalog, root, root, runner);
    expect(runner.ran).toEqual([]);
    expect(r?.status).toBe('pending');
  });
});

test('pinSkills records only verified skills', () => {
  const lock = lockSchema.parse({ schema_version: 1, mandao: '0.1.0', config_hash: 'sha256-x', layers: [], files: [] });
  const pinned = pinSkills(
    lock,
    [
      { id: 'via-skills', step: { kind: 'shell', commands: [] }, status: 'installed' },
      { id: 'via-command', step: { kind: 'shell', commands: [] }, status: 'failed' },
    ],
    catalog,
  );
  expect(pinned.skills).toEqual([
    { id: 'via-skills', version: '1.0.0', source: 'skills:owner/repo', author: 'a', license: 'MIT', vetted: true },
  ]);
});

test('plugin skills are verified inside the plugins folder', async () => {
  const { isInstalled } = await import('../../src/skills/install.js');
  const home = makeTree({ '.claude/plugins/cache/market/superpowers/7.0.0/skills/brainstorming/SKILL.md': '---\n---\n' });
  const skill = catalogSchema.parse({
    schema_version: 1,
    bootstrap: [],
    skills: { brainstorming: { ...meta, source: { type: 'plugin', install: ['/plugin install x'], repo: 'https://github.com/o/x' } } },
    technologies: {},
  }).skills.brainstorming!;
  expect(
    isInstalled(
      'brainstorming',
      skill,
      makeTree({}),
      home,
      fakeRunner(() => true),
    ),
  ).toBe(true);
});
