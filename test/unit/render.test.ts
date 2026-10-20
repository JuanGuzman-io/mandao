import { describe, expect, test } from 'vitest';
import { applyConditionals, renderBody, renderInline, type RenderContext, type TokenSyntax } from '../../src/render/render.js';
import { installTemplates } from '../../src/render/templates.js';
import { commandFrontmatterSchema, type Profile } from '../../src/schemas/index.js';

const ctx = (over: Partial<RenderContext> = {}): RenderContext => ({
  harness: 'claude',
  profiles: new Set<Profile>(['app']),
  multiProject: false,
  mode: 'single',
  paths: { specs: 'specs', constitution: 'docs/constitution', releases: 'docs/releases' },
  version: '0.1.0',
  scriptRunner: 'npx',
  ...over,
});

const syntax: TokenSyntax = {
  args: () => 'ARGS',
  arg: (_m, name) => `ARG(${name})`,
  command: (id) => `/mandao-${id}`,
};

const meta = commandFrontmatterSchema.parse({
  id: 'x',
  title: 'X',
  description: 'x',
  status: 'stable',
  inputs: [],
  outputs: [],
  tier: 'fast',
  capabilities: ['read'],
  arguments: [{ name: 'spec', description: 's' }],
  templates: ['design.md'],
  scripts: ['quick-check'],
});

describe('conditionals', () => {
  const body = [
    'start',
    '<!-- mandao:if profile=ai -->',
    'ai only',
    '<!-- mandao:if multiProject -->',
    'ai and multi',
    '<!-- mandao:endif -->',
    '<!-- mandao:endif -->',
    '<!-- mandao:if !profile=ai -->',
    'not ai',
    '<!-- mandao:endif -->',
    'end',
    '',
  ].join('\n');

  test('keeps only the visible branches and drops marker lines', () => {
    expect(applyConditionals(body, ctx())).toBe('start\nnot ai\nend\n');
    expect(applyConditionals(body, ctx({ profiles: new Set(['ai', 'app']) }))).toBe('start\nai only\nend\n');
    expect(applyConditionals(body, ctx({ profiles: new Set(['ai']), multiProject: true }))).toBe('start\nai only\nai and multi\nend\n');
  });

  test('a hidden outer block hides inner blocks even when they are true', () => {
    expect(applyConditionals('<!-- mandao:if profile=ai -->\n<!-- mandao:if harness=claude -->\nx\n<!-- mandao:endif -->\n<!-- mandao:endif -->\n', ctx())).toBe('');
  });

  test.each([
    ['<!-- mandao:if profile=ai -->\nx\n', 'without a matching mandao:endif'],
    ['x\n<!-- mandao:endif -->\n', 'without a matching mandao:if'],
    ['<!-- mandao:if profile=web -->\n<!-- mandao:endif -->\n', 'unknown profile "web"'],
    ['<!-- mandao:if team=core -->\n<!-- mandao:endif -->\n', 'unknown condition "team=core"'],
  ])('rejects %j', (input, message) => {
    expect(() => applyConditionals(input, ctx())).toThrow(message);
  });
});

describe('tokens', () => {
  test('renders every token for the harness', () => {
    const out = renderBody(
      meta,
      '{{args}} {{arg:spec}} {{command:tasks}} {{template:design.md}} {{script:quick-check}} {{paths.specs}} {{version}}',
      ctx(),
      syntax,
    );
    expect(out).toBe('ARGS ARG(spec) /mandao-tasks .mandao/templates/app/design.md npx -y mandao@0.1.0 run quick-check specs 0.1.0');
  });

  test('template paths use a <profile> placeholder when the workspace mixes profiles', () => {
    expect(renderBody(meta, '{{template:design.md}}', ctx({ profiles: new Set(['app', 'ai']) }), syntax)).toBe(
      '.mandao/templates/<profile>/design.md',
    );
  });

  test('the local runner avoids the network', () => {
    expect(renderBody(meta, '{{script:quick-check}}', ctx({ scriptRunner: 'local' }), syntax)).toBe('npx --no-install mandao run quick-check');
  });

  test.each([
    ['{{template:other.md}}', 'not listed in frontmatter templates'],
    ['{{script:deploy}}', 'not listed in frontmatter scripts'],
    ['{{arg:depth}}', 'not a declared argument'],
    ['{{paths.secrets}}', 'unknown path token'],
    ['{{whoami}}', 'is not allowed here'],
    ['{{foo:bar}}', 'unknown token'],
  ])('rejects %s', (body, message) => {
    expect(() => renderBody(meta, body, ctx(), syntax)).toThrow(message);
  });

  test('tokens inside hidden blocks are not validated', () => {
    expect(renderBody(meta, '<!-- mandao:if profile=ai -->\n{{whoami}}\n<!-- mandao:endif -->\nok', ctx(), syntax)).toBe('ok');
  });

  test('renderInline only accepts path and version tokens', () => {
    expect(renderInline('{{paths.specs}}/<spec>/story.md', ctx())).toBe('specs/<spec>/story.md');
    expect(() => renderInline('{{args}}', ctx())).toThrow('not allowed here');
  });
});

test('installTemplates picks the profile variant and falls back to shared', () => {
  const t = (key: string) => ({ key, content: key, origin: { kind: 'core' as const, id: 'core', patchedBy: [] } });
  const out = installTemplates([t('shared/design.md'), t('shared/story.md'), t('ai/design.md'), t('ai/evals.md'), t('data/x.md')], ['app', 'ai']);
  expect(out.map((o) => [o.path, o.content])).toEqual([
    ['.mandao/templates/ai/design.md', 'ai/design.md'],
    ['.mandao/templates/ai/evals.md', 'ai/evals.md'],
    ['.mandao/templates/ai/story.md', 'shared/story.md'],
    ['.mandao/templates/app/design.md', 'shared/design.md'],
    ['.mandao/templates/app/story.md', 'shared/story.md'],
  ]);
});

test('command tokens must reference a known command when the context lists them', () => {
  expect(() => renderBody(meta, '{{command:ghost}}', ctx({ commands: new Set(['tasks']) }), syntax)).toThrow('unknown command');
});
