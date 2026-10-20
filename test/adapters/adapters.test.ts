import { readdirSync, readFileSync } from 'node:fs';
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

describe('prompt cache (ADR 0036)', () => {
  test("Mandao's commands never set a model or effort (a per-command switch is a cache miss)", () => {
    const dir = join(import.meta.dirname, '../../core/commands');
    for (const f of readdirSync(dir)) {
      const front = readFileSync(join(dir, f), 'utf8').split('\n---')[0]!;
      expect(front, f).not.toMatch(/\b(model|effort|model_reasoning_effort)\s*:/);
    }
  });

  test('no generated file carries a timestamp, so it stays byte-identical across syncs', () => {
    for (const [id, adapter] of Object.entries(ADAPTERS))
      for (const f of adapter.render(input('single')).files)
        expect(f.content, `${id} ${f.path}`).not.toMatch(/\b20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}/);
  });
});

describe('the AGENTS.md block every session loads', () => {
  test('is only a pointer to the generated guide, which holds the commands, rules and commit conventions', () => {
    const files = renderAgentsMd(input('single')).files;
    const root = files.find((f) => f.path === 'AGENTS.md')!.content;
    expect(root.length).toBeLessThan(600);
    expect(root).toContain('[.mandao/guide.md](.mandao/guide.md)');
    const guide = files.find((f) => f.path === '.mandao/guide.md')!;
    expect(guide.ownership).toBe('owned');
    expect(guide.content).toContain('## Commands');
    expect(guide.content).toContain('## Commits');
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

describe('codex', () => {
  const codexRecs = recommendationsSchema.parse({
    schema_version: 1,
    harnesses: {
      codex: {
        reviewed: '2026-10-20',
        sources: ['https://example.com/codex'],
        available: ['gpt-6-luna', 'gpt-6.1-sol', 'gpt-6-sol'],
        routed: {
          leader: 'gpt-6.1-sol',
          reviewer: 'gpt-6-sol',
          reviewer_alt: 'gpt-6.1-sol',
          implementer: { fast: 'gpt-6-luna', standard: 'gpt-6.1-sol', strong: 'gpt-6.1-sol' },
          tester: 'gpt-6.1-sol',
        },
        simple: { implementer: 'gpt-6.1-sol', reviewer: 'gpt-6-sol' },
        effort: { reviewer: 'high', implementer: { fast: 'medium', standard: 'medium', strong: 'high' } },
      },
    },
  });

  test('agents get snake_case names, their model and their reasoning effort', () => {
    const i = input('single', 'project', { codex: resolveModels('codex', 'routed', codexRecs, []) });
    const agents = Object.fromEntries(
      ADAPTERS.codex
        .render(i)
        .files.filter((f) => f.path.startsWith('.codex/agents/'))
        .map((f) => [
          f.path,
          [
            f.content.match(/^name = (.+)$/m)?.[1],
            f.content.match(/^model = (.+)$/m)?.[1],
            f.content.match(/^model_reasoning_effort = (.+)$/m)?.[1],
          ],
        ]),
    );
    expect(agents['.codex/agents/mandao-implementer-strong.toml']).toEqual(['"mandao_implementer_strong"', '"gpt-6.1-sol"', '"high"']);
    expect(agents['.codex/agents/mandao-implementer-standard.toml']).toEqual([
      '"mandao_implementer_standard"',
      '"gpt-6.1-sol"',
      '"medium"',
    ]);
    expect(agents['.codex/agents/mandao-reviewer.toml']).toEqual(['"mandao_reviewer"', '"gpt-6-sol"', '"high"']);
  });

  test('skills are explicit-only and live in .agents/skills', () => {
    const files = ADAPTERS.codex.render(input('single')).files;
    expect(files.find((f) => f.path === '.agents/skills/mandao-specify/agents/openai.yaml')?.content).toContain(
      'allow_implicit_invocation: false',
    );
    expect(ADAPTERS.codex.render(input('single', 'global')).files.map((f) => f.path)).toEqual([
      'skills/mandao-init/SKILL.md',
      'skills/mandao-init/agents/openai.yaml',
    ]);
  });

  test('the commit runs outside the sandbox only after the user approves it (prompt rule)', () => {
    const rules = ADAPTERS.codex.render(input('single')).files.find((f) => f.path === '.codex/rules/mandao.rules');
    expect(rules?.content).toContain('prefix_rule(pattern=["node",".mandao/bin/mandao.mjs","run","commit"], decision="prompt")');
  });

  test('tomlString falls back to an escaped string when the body contains triple quotes', async () => {
    const { tomlString } = await import('../../src/adapters/codex.js');
    expect(tomlString('a\nb')).toBe("'''\na\nb'''");
    expect(tomlString("x'''y")).toBe("\"x'''y\"");
  });
});

describe('opencode', () => {
  const ocRecs = recommendationsSchema.parse({
    schema_version: 1,
    harnesses: {
      opencode: {
        reviewed: '2026-10-20',
        sources: ['https://example.com/opencode'],
        available: ['anthropic/claude-opus-5-5'],
        routed: {
          leader: 'anthropic/claude-opus-5-5',
          reviewer: 'openai/gpt-6-astra',
          implementer: { fast: 'anthropic/claude-haiku-5-5', standard: 'anthropic/claude-sonnet-5-5', strong: 'anthropic/claude-opus-5-5' },
          tester: 'anthropic/claude-sonnet-5-5',
        },
        simple: { implementer: 'anthropic/claude-sonnet-5-5', reviewer: 'openai/gpt-6-astra' },
        effort: { reviewer: 'high' },
      },
    },
  });
  const files = () =>
    asTree(ADAPTERS.opencode.render(input('single', 'project', { opencode: resolveModels('opencode', 'routed', ocRecs, []) })).files);

  test('agents carry provider/model, effort as variant, a mode and permissions from capabilities', () => {
    const tree = files();
    const reviewer = tree['.opencode/agents/mandao-reviewer.md']!;
    expect(reviewer).toMatch(/^mode: all$/m);
    expect(reviewer).toMatch(/^model: openai\/gpt-6-astra$/m);
    expect(reviewer).toMatch(/^variant: high$/m);
    expect(reviewer).toMatch(/permission:\n {2}edit: deny\n {2}bash: deny/);
    expect(tree['.opencode/agents/mandao-implementer-strong.md']).toMatch(/^mode: subagent$/m);
    expect(tree['.opencode/agents/mandao-implementer-strong.md']).not.toMatch(/edit: deny|bash: deny/);
  });

  test('commands take $ARGUMENTS and positional arguments; global installs only /mandao-init', () => {
    const tree = files();
    expect(Object.keys(tree).filter((p) => p.startsWith('.opencode/commands/'))).toContain('.opencode/commands/mandao-specify.md');
    expect(ADAPTERS.opencode.render(input('single', 'global')).files.map((f) => f.path)).toEqual(['commands/mandao-init.md']);
  });
});

/**
 * What each harness shows as mandaos when Claude Code, Codex and OpenCode share a workspace, modelled on
 * the loaders verified for ADR 0017: OpenCode reads `.opencode/commands`, plus skills from `.claude/skills`
 * and `.agents/skills` (one entry per name), a command shadows a skill of the same name, and
 * `permission.skill` deny patterns hide skills from the skill tool.
 */
describe('Claude Code + Codex + OpenCode together', () => {
  const together = () => ['claude', 'codex', 'opencode'].flatMap((h) => ADAPTERS[h as keyof typeof ADAPTERS].render(input('single')).files);
  const names = (paths: string[], re: RegExp) => paths.flatMap((p) => p.match(re)?.[1] ?? []);

  test('every mandao is visible exactly once per harness', () => {
    const all = together();
    const paths = all.map((f) => f.path);
    const claude = names(paths, /^\.claude\/skills\/(mandao-[^/]+)\/SKILL\.md$/);
    const codex = names(paths, /^\.agents\/skills\/(mandao-[^/]+)\/SKILL\.md$/);
    const commands = names(paths, /^\.opencode\/commands\/(mandao-[^/]+)\.md$/);
    const ids = selectedIds();
    for (const list of [claude, codex, commands]) expect([...list].sort()).toEqual(ids);

    const config = all.find((f) => f.path === '.opencode/opencode.jsonc')!.content;
    const denied = JSON.parse(config.replace(/^\s*\/\/.*$/gm, '')).permission.skill as Record<string, string>;
    const hidden = (name: string) =>
      Object.entries(denied).some(([pattern, v]) => v === 'deny' && new RegExp(`^${pattern.replace('*', '.*')}$`).test(name));
    const skillTool = [...new Set([...claude, ...codex])].filter((n) => !commands.includes(n) && !hidden(n));
    const slashMenu = [...new Set([...commands, ...claude, ...codex])];
    expect(skillTool).toEqual([]);
    expect(slashMenu.sort()).toEqual(ids);
  });

  test('snapshot of the three harnesses in one workspace', async () => {
    await expect(asTree(together())).toMatchFileSnapshot('__snapshots__/single.claude+codex+opencode.snap');
  });

  const selectedIds = () =>
    ADAPTERS.claude
      .render(input('single'))
      .files.flatMap((f) => f.path.match(/^\.claude\/skills\/(mandao-[^/]+)\//)?.[1] ?? [])
      .sort();
});

describe('antigravity (experimental)', () => {
  const withHarnesses = (harnesses: string[]) => ({
    ...input('single'),
    config: configSchema.parse({ ...configs.single, harnesses }),
  });
  const render = (h: 'codex' | 'antigravity', harnesses: string[]) => ADAPTERS[h].render(withHarnesses(harnesses)).files;

  test('alone: skills in .agents/skills invoked as /name, without the Codex policy file', () => {
    const files = render('antigravity', ['antigravity']);
    const skill = files.find((f) => f.path === '.agents/skills/mandao-specify/SKILL.md')!;
    expect(skill.harness).toBe('antigravity');
    expect(skill.content).toContain('continue with /mandao-tasks');
    expect(files.some((f) => f.path.endsWith('agents/openai.yaml'))).toBe(false);
  });

  test('with Codex: the shared skills are rendered once, by Codex, naming both invocations', () => {
    const both = ['codex', 'antigravity'];
    const codex = render('codex', both);
    const antigravity = render('antigravity', both);
    expect(antigravity.some((f) => f.path.startsWith('.agents/skills/'))).toBe(false);
    const skill = codex.find((f) => f.path === '.agents/skills/mandao-specify/SKILL.md')!;
    expect(skill.content).toContain('continue with $mandao-tasks (`/mandao-tasks` in Antigravity)');
    const paths = [...codex, ...antigravity].map((f) => f.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  test('subagents take a model tier, never a model ID', () => {
    const recs = recommendationsSchema.parse({
      schema_version: 1,
      harnesses: {
        antigravity: {
          reviewed: '2026-10-20',
          sources: ['https://example.com/antigravity'],
          default_mode: 'simple',
          available: ['flash'],
          routed: {
            leader: 'flash',
            reviewer: 'flash',
            implementer: { fast: 'flash', standard: 'flash', strong: 'flash' },
            tester: 'flash',
          },
          simple: { implementer: 'flash', reviewer: 'flash' },
        },
      },
    });
    const files = ADAPTERS.antigravity.render(
      input('single', 'project', { antigravity: resolveModels('antigravity', 'simple', recs, []) }),
    ).files;
    const reviewer = files.find((f) => f.path === '.agents/agents/mandao-reviewer.md')!;
    expect(reviewer.content).toMatch(/^model: flash$/m);
  });
});
