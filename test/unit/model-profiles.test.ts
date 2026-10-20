import { readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { parse } from 'yaml';
import { setModel, setProfile } from '../../src/cli/models.js';
import { writeYaml } from '../../src/engine/files.js';
import { forProviders, profileChoices } from '../../src/models/defaults.js';
import { readRecommendations } from '../../src/models/load.js';
import { compareChoices, resolveModels } from '../../src/models/resolve.js';
import { HARNESS_IDS, MODEL_PROFILES, TIERS } from '../../src/schemas/index.js';
import { makeTree } from '../helpers.js';

const recs = readRecommendations();

describe('model profiles (cost-conscious design)', () => {
  /** Problems of one resolved profile: a Reviewer below an Implementer tier, or a model not on every plan. */
  function profileProblems(h: (typeof HARNESS_IDS)[number], profile: (typeof MODEL_PROFILES)[number]): string[] {
    const m = resolveModels(h, 'routed', recs, [], profile);
    const below = TIERS.filter((t) => (compareChoices(m.reviewer!, m.implementer[t]!, m.tiers) ?? 0) < 0).map(
      (t) => `${h} ${profile}: reviewer ${m.reviewer!.model} below ${t} ${m.implementer[t]!.model}`,
    );
    const used = [m.leader, m.reviewer, m.tester, ...Object.values(m.implementer)].map((c) => c!.model);
    const offPlan = used.filter((model) => !recs.harnesses[h]!.available.includes(model)).map((model) => `${h} ${profile} uses ${model}`);
    return [...below, ...offPlan];
  }

  test('no profile puts the Reviewer below any Implementer tier, and every model is plan-wide', () => {
    const harnesses = HARNESS_IDS.filter((h) => recs.harnesses[h]);
    expect(harnesses.flatMap((h) => MODEL_PROFILES.flatMap((p) => profileProblems(h, p)))).toEqual([]);
  });

  test('a profile overrides the recommendation and records its source; peak is the recommendation', () => {
    expect(resolveModels('claude', 'routed', recs, [], 'balanced')).toMatchObject({
      profile: 'balanced',
      leader: { model: 'claude-sonnet-5-5', source: 'profile' },
      reviewer: { model: 'claude-opus-5-5', source: 'recommendation' },
    });
    expect(resolveModels('codex', 'routed', recs, [], 'balanced').leader).toMatchObject({ model: 'gpt-6.1-sol', effort: 'low' });
    expect(resolveModels('claude', 'routed', recs, [], 'peak').leader).toMatchObject({
      model: 'claude-opus-5-5',
      source: 'recommendation',
    });
  });

  test('another provider set in OpenCode has no profiles yet', () => {
    const { rec } = forProviders(recs.harnesses.opencode!, ['openai']);
    expect(profileChoices(rec, 'routed', 'economy').leader).toBe('openai/gpt-6-astra');
  });
});

describe('mandao models profile', () => {
  let root: string;
  beforeEach(() => {
    root = realpathSync(makeTree({}));
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'a', path: '.' }],
      harnesses: ['claude'],
    });
    writeYaml(join(root, '.mandao/models.yml'), {
      schema_version: 1,
      mode: 'routed',
      harnesses: { claude: profileChoices(recs.harnesses.claude!, 'routed', 'peak') },
    });
  });
  afterEach(() => vi.restoreAllMocks());
  const models = () => parse(readFileSync(join(root, '.mandao/models.yml'), 'utf8'));

  test('switches every role to the profile and keeps the roles the user chose by hand', () => {
    setModel(root, { role: 'tester', model: 'claude-opus-5-5' });
    const r = setProfile(root, 'economy');
    expect(r).toMatchObject({ profile: 'economy', previous: 'peak', kept: { claude: { tester: 'claude-opus-5-5' } } });
    expect(models()).toMatchObject({
      profile: 'economy',
      harnesses: {
        claude: {
          leader: 'claude-sonnet-5-5',
          reviewer: 'claude-sonnet-5-5',
          tester: 'claude-opus-5-5',
          implementer: { strong: 'claude-sonnet-5-5' },
        },
      },
    });
    setProfile(root, 'peak');
    expect(models().harnesses.claude).toMatchObject({ leader: 'claude-opus-5-5', reviewer: 'claude-opus-5-5', tester: 'claude-opus-5-5' });
  });

  test('an unknown profile is refused', () => {
    expect(() => setProfile(root, 'turbo')).toThrow(/Profile must be one of peak, balanced, economy/);
  });
});
