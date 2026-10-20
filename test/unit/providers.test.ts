import { describe, expect, test } from 'vitest';
import { opencodeFindings } from '../../src/engine/doctor-opencode.js';
import { chooseProviderSet, detectProviders } from '../../src/models/providers.js';
import type { ResolvedModels } from '../../src/models/resolve.js';

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

  test('enabled and disabled providers in config (JSONC, later file wins)', () => {
    const env = { ANTHROPIC_API_KEY: 'a', OPENAI_API_KEY: 'o' };
    const global = '{ // global\n "disabled_providers": ["openai"], }';
    expect(detectProviders({ env, configs: [global] })).toEqual(['anthropic']);
    expect(detectProviders({ env, configs: [global, '{ "disabled_providers": [] }'] })).toEqual(['anthropic', 'openai']);
    expect(detectProviders({ env, configs: ['{ "enabled_providers": ["openai"] }'] })).toEqual(['openai']);
    expect(detectProviders({ env, configs: ['{ "$schema": "https://opencode.ai/config.json" }'] })).toEqual(['anthropic', 'openai']);
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
