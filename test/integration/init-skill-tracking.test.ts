import { join } from 'node:path';
import { expect, test, vi } from 'vitest';
import { chooseSkillTracking } from '../../src/cli/init-skill-tracking.js';
import { LOCK_FILE, readConfig, writeYaml } from '../../src/engine/files.js';
import { emptyLock } from '../git-skill-fixture.js';
import { makeTree } from '../helpers.js';

const answer = vi.hoisted(() => ({ value: true as boolean | symbol, asked: 0 }));
vi.mock('@clack/prompts', () => ({
  select: async () => {
    answer.asked++;
    return answer.value;
  },
  isCancel: (value: unknown) => typeof value === 'symbol',
}));
vi.mock('../../src/engine/sync.js', () => ({ syncProject: () => ({ changes: [], warnings: [] }) }));
vi.mock('../../src/cli/output.js', () => ({ printChanges: () => {}, printWarnings: () => {} }));

test.each([
  [true, true],
  [false, false],
  [Symbol('cancel'), true],
] as const)('init choice %s stores tracking %s', async (choice, expected) => {
  const root = makeTree({
    '.mandao/config.yml': 'schema_version: 1\nworkspace: single\nprojects:\n  - name: app\n    path: .\nharnesses: [codex]\n',
  });
  const lock = emptyLock();
  lock.skills.push({ id: 'example', version: '1', source: 'x', author: 'a', license: 'MIT', vetted: true });
  writeYaml(join(root, LOCK_FILE), lock);
  answer.value = choice;
  answer.asked = 0;
  await chooseSkillTracking(root, new Set(), false);
  expect(answer.asked).toBe(1);
  expect(readConfig(root).skills.track).toBe(expected);
});

test('init --yes does not ask about skill tracking', async () => {
  const root = makeTree({});
  answer.asked = 0;
  await chooseSkillTracking(root, new Set(), true);
  expect(answer.asked).toBe(0);
});
