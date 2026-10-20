import { beforeAll, describe, expect, test } from 'vitest';
import { formatPinnedSkills } from '../../src/cli/skills.js';
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
