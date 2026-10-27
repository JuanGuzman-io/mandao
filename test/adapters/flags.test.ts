import { join } from 'node:path';
import { expect, test } from 'vitest';
import { ADAPTERS } from '../../src/adapters/index.js';
import { readLayer } from '../../src/resolver/layers.js';
import { resolve } from '../../src/resolver/resolve.js';
import { configSchema } from '../../src/schemas/index.js';

/** Phase 19: the fixture's specify declares `--hotfix` between its positional `spec` and `depth`. */
const resolution = resolve([readLayer('core', 'core', join(import.meta.dirname, '../fixtures/content'))]);
const config = configSchema.parse({
  schema_version: 1,
  workspace: 'single',
  projects: [{ name: 'shop', path: '.', profile: 'app' }],
  harnesses: ['claude', 'opencode', 'copilot'],
});

test('a flag has no position: hints show it as typed, positional names and $n skip it (phase 19)', () => {
  const tree = Object.fromEntries(
    (['claude', 'opencode'] as const).flatMap((h) =>
      ADAPTERS[h].render({ resolution, config, models: {}, version: '0.1.0', scope: 'project' }).files.map((f) => [f.path, f.content]),
    ),
  );
  const claude = tree['.claude/skills/mandao-specify/SKILL.md']!;
  expect(claude).toMatch(/^argument-hint: <spec> \[--hotfix\] \[depth\]$/m);
  expect(claude).toMatch(/^arguments:\n {2}- spec\n {2}- depth\n/m);
  expect(claude).toContain('Depth: $depth');
  const opencode = tree['.opencode/commands/mandao-specify.md']!;
  expect(opencode).toContain('Depth: $2');
  expect(opencode).not.toMatch(/\$3/);
});

test('Copilot asks only positional arguments; a flag is read from what was typed (phase 20, review F12)', () => {
  const files = ADAPTERS.copilot.render({ resolution, config, models: {}, version: '0.1.0', scope: 'project' }).files;
  const copilot = files.find((f) => f.path === '.github/prompts/mandao-specify.prompt.md')!.content;
  expect(copilot).toContain('${input:spec:');
  expect(copilot).toContain('${input:depth:');
  expect(copilot).not.toContain('${input:hotfix');
  expect(copilot).toContain('flags typed after the command, if any: [--hotfix]');
});
