import { beforeAll, describe, expect, test } from 'vitest';
import { formatPinnedSkills } from '../../src/cli/skills.js';
import { readCatalog } from '../../src/engine/catalog.js';
import type { Lock } from '../../src/schemas/index.js';

beforeAll(() => {
  process.env.NO_COLOR = '1';
});

describe('formatPinnedSkills', () => {
  test('prints each pinned skill with its badge, id@version and source, sorted by id', () => {
    const skills: Lock['skills'] = [
      { id: 'zeta', version: '2.0.0', source: 'owner/zeta', author: 'a', license: 'MIT', vetted: false },
      { id: 'alpha', version: '1.0.0', source: 'owner/alpha', author: 'a', license: 'MIT', vetted: true },
    ];

    expect(formatPinnedSkills(skills)).toEqual(['  vetted   alpha@1.0.0 owner/alpha', '  unvetted zeta@2.0.0 owner/zeta']);
  });
});

describe('Graphify catalog installation', () => {
  test('uses its pinned HTTPS installer instead of copying the repository as a skill', () => {
    const graphify = readCatalog().skills.graphify;

    expect(graphify).toBeDefined();
    if (!graphify) return;

    expect(graphify.source).toEqual({
      type: 'command',
      repo: 'https://github.com/Graphify-Labs/graphify',
      install: ['uv tool install graphifyy==0.9.92', 'graphify install --project'],
      version_command: 'graphify --version',
    });
    expect(graphify.source.type).not.toBe('git');
    if (graphify.source.type === 'git') expect(graphify.source.path).toBeDefined();
  });
});
