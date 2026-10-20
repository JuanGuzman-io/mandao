import { describe, expect, test } from 'vitest';
import { opencodeFindings } from '../../src/engine/doctor-opencode.js';
import { chooseProviderSet, detectProviders, openCodeSources } from '../../src/models/providers.js';
import type { ResolvedModels } from '../../src/models/resolve.js';
import { makeTree } from '../helpers.js';

const sets = {
  anthropic: { providers: ['anthropic'] },
  openai: { providers: ['openai'] },
  'anthropic+openai': { providers: ['anthropic', 'openai'] },
};

describe('OpenCode providers (ADR 0017)', () => {
  test('auth.json keys and provider env vars, never the credentials themselves', () => {
    const authJson = '{ "anthropic": { "type": "api", "key": "sk-secret" } }';
    expect(detectProviders({ authJson, env: {}, configs: [] })).toEqual(['anthropic']);
    expect(detectProviders({ authJson, env: { OPENAI_API_KEY: 'x' }, configs: [] })).toEqual(['anthropic', 'openai']);
    expect(detectProviders({ env: { OPENAI_API_KEY: '' }, configs: [] })).toEqual([]);
  });

  test('OpenCode 2: provider ids from `opencode auth list --format json` (ADR 0025)', () => {
    const authList = JSON.stringify([
      { id: 'anthropic', name: 'Anthropic', connections: [{ type: 'credential', label: 'work' }] },
      { id: 'openai', name: 'OpenAI', connections: [{ type: 'env', name: 'OPENAI_API_KEY' }] },
    ]);
    expect(detectProviders({ authList, env: {}, configs: [] })).toEqual(['anthropic', 'openai']);
    expect(detectProviders({ authList: '[]', env: {}, configs: [] })).toEqual([]);
    expect(detectProviders({ authList: 'not json', env: { ANTHROPIC_API_KEY: 'a' }, configs: [] })).toEqual(['anthropic']);
  });

  test('openCodeSources asks the CLI and tolerates its absence', () => {
    const root = makeTree({});
    const env = { XDG_DATA_HOME: root, XDG_CONFIG_HOME: root };
    expect(
      openCodeSources(
        root,
        env,
        () => '[{"id":"openai"}]',
        () => undefined,
      ).authList,
    ).toBe('[{"id":"openai"}]');
    expect(
      openCodeSources(
        root,
        env,
        () => undefined,
        () => undefined,
      ),
    ).toEqual({ env, configs: [] });
    expect(
      openCodeSources(
        root,
        env,
        () => '[]',
        () => 'opencode/beam-free\n',
      ).models,
    ).toBe('opencode/beam-free\n');
  });

  test('free models listed by `opencode models` count without credentials (ADR 0029)', () => {
    const models = 'opencode/beam-free\nopencode/glm-5.3-flash-free\n';
    expect(detectProviders({ models, authList: '[]', env: {}, configs: [] })).toEqual(['opencode']);
    const zen = (reviewer: string): ResolvedModels => ({
      harness: 'opencode',
      mode: 'simple',
      reviewer: { model: reviewer, source: 'workspace' },
      implementer: { standard: { model: 'opencode/glm-5.3-flash-free', source: 'workspace' } },
      tiers: {},
    });
    expect(opencodeFindings(zen('opencode/beam-free'), { models, env: {}, configs: [] }).map((f) => f.level)).toEqual(['ok']);
    expect(opencodeFindings(zen('opencode/gone-free'), { models, env: {}, configs: [] })[1]).toMatchObject({
      level: 'warn',
      message: 'opencode: reviewer (opencode/gone-free) not in `opencode models` here',
    });
  });

  test('enabled and disabled providers in config (JSONC, later file wins)', () => {
    const env = { ANTHROPIC_API_KEY: 'a', OPENAI_API_KEY: 'o' };
    const global = '{ // global\n "disabled_providers": ["openai"], }';
    expect(detectProviders({ env, configs: [global] })).toEqual(['anthropic']);
    expect(detectProviders({ env, configs: [global, '{ "disabled_providers": [] }'] })).toEqual(['anthropic', 'openai']);
    expect(detectProviders({ env, configs: ['{ "enabled_providers": ["openai"] }'] })).toEqual(['openai']);
    expect(detectProviders({ env, configs: ['{ "$schema": "https://opencode.ai/config.json" }'] })).toEqual(['anthropic', 'openai']);
  });

  test('optional sets are never chosen by detection, only offered with their terms (ADR 0027)', async () => {
    const { readRecommendations } = await import('../../src/models/load.js');
    const { optionalSetFindings } = await import('../../src/engine/doctor-opencode.js');
    const sets = readRecommendations().harnesses.opencode!.provider_sets!;
    expect(chooseProviderSet(sets, ['opencode'])).toBeUndefined();
    const [offer] = optionalSetFindings(sets, ['opencode']);
    expect(offer).toMatchObject({
      level: 'info',
      message: expect.stringContaining('free for a limited time; free models may use data for training'),
    });
    expect(offer!.fix).toContain('mandao models set reviewer opencode/beam-free --harness opencode');
    expect(sets['opencode-zen']!.simple.implementer).not.toBe(sets['opencode-zen']!.simple.reviewer);
    expect(optionalSetFindings(sets, ['anthropic'])).toEqual([]);
  });

  test('the largest recommended set that every detected provider covers', () => {
    expect(chooseProviderSet(sets, ['anthropic', 'openai', 'ollama'])).toBe('anthropic+openai');
    expect(chooseProviderSet(sets, ['openai'])).toBe('openai');
    expect(chooseProviderSet(sets, ['ollama'])).toBeUndefined();
  });
});

describe('doctor for OpenCode', () => {
  const models = (reviewer: string): ResolvedModels => ({
    harness: 'opencode',
    mode: 'routed',
    reviewer: { model: reviewer, source: 'recommendation' },
    implementer: {
      fast: { model: 'ollama/qwen', source: 'workspace' },
      standard: { model: 'anthropic/claude-sonnet-5-5', source: 'recommendation' },
    },
    tiers: {},
  });

  test('a role whose provider is not configured is a warning; local providers need no credentials', () => {
    const src = { env: { ANTHROPIC_API_KEY: 'a' }, configs: [] };
    expect(opencodeFindings(models('anthropic/claude-opus-5-5'), src).map((f) => f.level)).toEqual(['ok']);
    expect(opencodeFindings(models('openai/gpt-6-astra'), src)[1]).toMatchObject({
      level: 'warn',
      message: 'opencode: reviewer uses openai, which is not configured here',
    });
    expect(opencodeFindings(models('openai/gpt-6-astra'), { env: {}, configs: [] })[0]!.level).toBe('warn');
  });
});
