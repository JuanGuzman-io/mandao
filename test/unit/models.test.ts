import { describe, expect, test } from 'vitest';
import { flagLayer } from '../../src/cli/models.js';
import { recommendationOffers, seenRecommendations } from '../../src/models/offers.js';
import { independence, missingRoles, resolveModels } from '../../src/models/resolve.js';
import { recommendationsSchema } from '../../src/schemas/index.js';

const recs = recommendationsSchema.parse({
  schema_version: 1,
  harnesses: {
    claude: {
      reviewed: '2026-10-20',
      sources: ['https://example.com'],
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

describe('resolveModels', () => {
  test('precedence is flag > spec > project > workspace > recommendation, whatever the layer order', () => {
    const m = resolveModels('claude', 'routed', recs, [
      { source: 'flag', models: { reviewer: 'from-flag' } },
      { source: 'workspace', models: { reviewer: 'from-workspace', leader: 'ws-leader', tester: 'ws-tester' } },
      { source: 'spec', models: { reviewer: 'from-spec', leader: 'spec-leader' } },
      { source: 'project', models: { reviewer: 'from-project', leader: 'project-leader', tester: 'project-tester' } },
    ]);
    expect(m.reviewer).toEqual({ model: 'from-flag', source: 'flag' });
    expect(m.leader).toEqual({ model: 'spec-leader', source: 'spec' });
    expect(m.tester).toEqual({ model: 'project-tester', source: 'project' });
    expect(m.reviewer_alt).toEqual({ model: 'fable', source: 'recommendation' });
  });

  test('simple mode uses one implementer model and the simple reviewer', () => {
    const m = resolveModels('claude', 'simple', recs, [
      { source: 'workspace', models: { implementer: { fast: 'x', standard: 'mid', strong: 'y' } } },
    ]);
    expect(Object.values(m.implementer).map((c) => c?.model)).toEqual(['mid', 'mid', 'mid']);
    expect(m.reviewer?.model).toBe('opus');
  });

  test('a string implementer applies to every tier in routed mode; a partial map keeps other tiers', () => {
    expect(
      Object.values(resolveModels('claude', 'routed', recs, [{ source: 'workspace', models: { implementer: 'one' } }]).implementer).map(
        (c) => c?.model,
      ),
    ).toEqual(['one', 'one', 'one']);
    const partial = resolveModels('claude', 'routed', recs, [{ source: 'workspace', models: { implementer: { strong: 'big' } } }]);
    expect(partial.implementer.fast?.model).toBe('haiku');
    expect(partial.implementer.strong).toEqual({ model: 'big', source: 'workspace' });
  });

  test('a harness without recommendations reports every missing role', () => {
    expect(missingRoles(resolveModels('copilot', 'routed', recs, []))).toEqual([
      'leader',
      'reviewer',
      'reviewer_alt',
      'tester',
      'implementer.fast',
      'implementer.standard',
      'implementer.strong',
    ]);
  });
});

describe('independence', () => {
  test('reviewer_alt reviews the tier where the implementer equals the reviewer', () => {
    const checks = independence(resolveModels('claude', 'routed', recs, []));
    expect(checks.map((c) => [c.tier, c.reviewedBy, c.reduced])).toEqual([
      ['fast', 'opus', false],
      ['standard', 'opus', false],
      ['strong', 'fable', false],
    ]);
  });

  test('independence is reduced when no alternative differs', () => {
    const m = resolveModels('claude', 'routed', recs, [{ source: 'workspace', models: { reviewer_alt: 'opus' } }]);
    expect(independence(m).find((c) => c.tier === 'strong')).toMatchObject({ reviewedBy: 'opus', reduced: true });
  });
});

describe('recommendationOffers', () => {
  const chosen = {
    schema_version: 1 as const,
    mode: 'routed' as const,
    harnesses: { claude: { reviewer: 'sonnet', leader: 'opus', implementer: { fast: 'haiku', standard: 'old', strong: 'opus' } } },
  };

  test('offers the new recommendation where the choice differs, without changing it', () => {
    expect(recommendationOffers(chosen, recs, {})).toEqual([
      { harness: 'claude', role: 'reviewer', current: 'sonnet', recommended: 'opus' },
      { harness: 'claude', role: 'implementer.standard', current: 'old', recommended: 'sonnet' },
    ]);
  });

  test('stays quiet when the recommendations were already offered', () => {
    expect(recommendationOffers(chosen, recs, seenRecommendations(recs))).toEqual([]);
  });

  test('a revision with the same review date is offered again', () => {
    const revised = recommendationsSchema.parse({
      ...recs,
      harnesses: { claude: { ...recs.harnesses.claude, routed: { ...recs.harnesses.claude!.routed, reviewer: 'opus-next' } } },
    });
    expect(recommendationOffers(chosen, revised, seenRecommendations(recs)).map((o) => o.role)).toContain('reviewer');
  });
});

describe('flagLayer', () => {
  test('parses role and tier overrides', () => {
    expect(flagLayer(['reviewer=sonnet', 'implementer.strong=opus'])).toEqual({
      source: 'flag',
      models: { reviewer: 'sonnet', implementer: { strong: 'opus' } },
    });
  });

  test('rejects unknown roles and tiers', () => {
    expect(() => flagLayer(['boss=opus'])).toThrow('Unknown role "boss"');
    expect(() => flagLayer(['implementer.huge=opus'])).toThrow('Unknown tier "huge"');
    expect(() => flagLayer(['reviewer'])).toThrow('Expected role=model');
  });
});
