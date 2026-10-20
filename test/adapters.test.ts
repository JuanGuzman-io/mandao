import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { ADAPTERS, type AdapterInput } from '../src/adapters/index.js';
import { renderAgentsMd } from '../src/adapters/agents-md.js';
import { readLayer } from '../src/resolver/layers.js';
import { resolve } from '../src/resolver/resolve.js';
import { configSchema, type ConfigInput } from '../src/schemas/index.js';

const resolution = resolve([readLayer('core', 'core', join(import.meta.dirname, 'fixtures/content'))]);

const configs: Record<string, ConfigInput> = {
  single: {
    version: 1,
    workspace: { mode: 'single' },
    projects: [{ name: 'shop', path: '.', profile: 'app' }],
    harnesses: ['claude', 'copilot'],
    models: { claude: { fast: 'haiku', standard: 'sonnet', strong: 'opus' } },
  },
  monorepo: {
    version: 1,
    workspace: { mode: 'monorepo' },
    projects: [
      { name: 'api', path: 'services/api', profile: 'app' },
      { name: 'assistant', path: 'services/assistant', profile: 'ai' },
    ],
    harnesses: ['claude', 'copilot'],
    scripts: { runner: 'local' },
  },
  polyrepo: {
    version: 1,
    workspace: { mode: 'polyrepo', home: 'workspace' },
    projects: [
      { name: 'api', path: 'api', profile: 'app', repo: true },
      { name: 'web', path: 'web', profile: 'app', repo: true },
    ],
    harnesses: ['claude', 'copilot'],
  },
};

const input = (name: string, scope: AdapterInput['scope'] = 'project'): AdapterInput => ({
  resolution,
  config: configSchema.parse(configs[name]),
  version: '0.1.0',
  scope,
});

const asTree = (files: { path: string; content: string }[]) => Object.fromEntries(files.map((f) => [f.path, f.content]));

describe.each(Object.keys(configs))('%s workspace', (name) => {
  test.each(Object.keys(ADAPTERS))('%s output', async (harness) => {
    const out = ADAPTERS[harness as keyof typeof ADAPTERS].render(input(name));
    await expect(asTree(out.files)).toMatchFileSnapshot(`snapshots/${name}.${harness}.snap`);
  });

  test('AGENTS.md blocks', async () => {
    await expect(asTree(renderAgentsMd(input(name)).files)).toMatchFileSnapshot(`snapshots/${name}.agents-md.snap`);
  });
});

describe('selection', () => {
  test('profile-specific commands install only when a project uses the profile', () => {
    const paths = (n: string) => ADAPTERS.claude.render(input(n)).files.map((f) => f.path);
    expect(paths('single')).not.toContain('.claude/skills/mandao-evals/SKILL.md');
    expect(paths('monorepo')).toContain('.claude/skills/mandao-evals/SKILL.md');
  });

  test('global scope installs only global commands and no personas, relative to the harness home', () => {
    expect(ADAPTERS.claude.render(input('single', 'global')).files.map((f) => [f.path, f.scope])).toEqual([
      ['skills/mandao-init/SKILL.md', 'global'],
    ]);
    expect(ADAPTERS.copilot.render(input('single', 'global')).files.map((f) => f.path)).toEqual(['mandao-init.prompt.md']);
  });
});

describe('model separation', () => {
  test('warns when the reviewer and implementer resolve to the same model', () => {
    const i = input('single');
    i.config.models.claude = { fast: 'x', standard: 'same', strong: 'same' };
    expect(ADAPTERS.claude.render(i).warnings).toEqual(['claude: "reviewer" and "implementer" both resolve to model "same"']);
  });

  test('warns that the rule is instruction-only when no models are configured', () => {
    expect(ADAPTERS.copilot.render(input('single')).warnings[0]).toMatch(/enforced by instruction only/);
  });
});
