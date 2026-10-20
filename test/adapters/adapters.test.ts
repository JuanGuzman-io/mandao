import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { renderAgentsMd } from '../../src/adapters/agents-md.js';
import { ADAPTERS, type AdapterInput } from '../../src/adapters/index.js';
import { type ModelLayer, resolveModels } from '../../src/models/resolve.js';
import { readLayer } from '../../src/resolver/layers.js';
import { resolve } from '../../src/resolver/resolve.js';
import { type ConfigInput, configSchema, type ModelMode, recommendationsSchema } from '../../src/schemas/index.js';

const resolution = resolve([readLayer('core', 'core', join(import.meta.dirname, '../fixtures/content'))]);

const configs: Record<string, ConfigInput> = {
  single: {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.', profile: 'app' }],
    harnesses: ['claude', 'copilot'],
  },
  monorepo: {
    schema_version: 1,
    workspace: 'monorepo',
    projects: [
      { name: 'api', path: 'services/api', profile: 'app' },
      { name: 'assistant', path: 'services/assistant', profile: 'ai' },
    ],
    harnesses: ['claude', 'copilot'],
    scripts: { runner: 'local' },
  },
  polyrepo: {
    schema_version: 1,
    workspace: 'polyrepo',
    home: 'workspace',
    projects: [
      { name: 'api', path: 'api', profile: 'app', repo: 'git@github.com:acme/api.git' },
      { name: 'web', path: 'web', profile: 'app', repo: 'local' },
    ],
    harnesses: ['claude', 'copilot'],
  },
};

const recommendations = recommendationsSchema.parse({
  schema_version: 1,
  harnesses: {
    claude: {
      reviewed: '2026-10-20',
      sources: ['https://example.com/claude'],
      available: ['opus', 'sonnet', 'haiku', 'fable'],
      routed: {
        leader: 'opus',
        reviewer: 'opus',
        reviewer_alt: 'fable',
        implementer: { fast: 'haiku', standard: 'sonnet', strong: 'opus' },
        tester: 'sonnet',
      },
      simple: { implementer: 'sonnet', reviewer: 'opus' },
    },
  },
});

const modelsFor = (mode: ModelMode = 'routed', layers: ModelLayer[] = []) => ({
  claude: resolveModels('claude', mode, recommendations, layers),
});

const input = (name: string, scope: AdapterInput['scope'] = 'project', models: AdapterInput['models'] = {}): AdapterInput => ({
  resolution,
  config: configSchema.parse(configs[name]),
  models: name === 'single' && Object.keys(models).length === 0 ? modelsFor() : models,
  version: '0.1.0',
  scope,
});

const asTree = (files: { path: string; content: string }[]) => Object.fromEntries(files.map((f) => [f.path, f.content]));

describe.each(Object.keys(configs))('%s workspace', (name) => {
  test.each(Object.keys(ADAPTERS))('%s output', async (harness) => {
    const out = ADAPTERS[harness as keyof typeof ADAPTERS].render(input(name));
    await expect(asTree(out.files)).toMatchFileSnapshot(`__snapshots__/${name}.${harness}.snap`);
  });

  test('AGENTS.md blocks', async () => {
    await expect(asTree(renderAgentsMd(input(name)).files)).toMatchFileSnapshot(`__snapshots__/${name}.agents-md.snap`);
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

describe('persona variants', () => {
  const agents = (i: AdapterInput) =>
    Object.fromEntries(
      ADAPTERS.claude
        .render(i)
        .files.filter((f) => f.path.startsWith('.claude/agents/'))
        .map((f) => [f.path.slice('.claude/agents/'.length), f.content.match(/^model: (.+)$/m)?.[1]]),
    );

  test('routed mode generates one implementer per tier and an alternative reviewer', () => {
    expect(agents(input('single'))).toEqual({
      'mandao-implementer-fast.md': 'haiku',
      'mandao-implementer-standard.md': 'sonnet',
      'mandao-implementer-strong.md': 'opus',
      'mandao-reviewer.md': 'opus',
      'mandao-reviewer-alt.md': 'fable',
    });
  });

  test('simple mode generates a single implementer', () => {
    expect(agents(input('single', 'project', modelsFor('simple')))).toEqual({
      'mandao-implementer.md': 'sonnet',
      'mandao-reviewer.md': 'opus',
      'mandao-reviewer-alt.md': 'fable',
    });
  });

  test('a harness without recommendations gets agents without a model', () => {
    const copilot = ADAPTERS.copilot.render(input('single')).files.filter((f) => f.path.startsWith('.github/agents/'));
    expect(copilot.map((f) => f.path)).toEqual(['.github/agents/mandao-implementer.agent.md', '.github/agents/mandao-reviewer.agent.md']);
    expect(copilot.every((f) => !/^model:/m.test(f.content))).toBe(true);
  });
});
