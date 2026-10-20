import { describe, expect, test } from 'vitest';
import { analyzeDiff, manifestDeps } from '../../src/scripts/quick-check.js';
import { proposeSkills, type ProjectFingerprint } from '../../src/scripts/fingerprint.js';
import { catalogSchema } from '../../src/schemas/index.js';

const config = {
  projects: [
    { name: 'api', path: 'services/api', profile: 'app' as const, gates: {} },
    { name: 'bot', path: 'services/bot', profile: 'ai' as const, gates: {} },
  ],
};
const f = (path: string, added = 1, deleted = 0) => ({ path, added, deleted });

describe('quick-check', () => {
  test('a small change in one project is quick', () => {
    const r = analyzeDiff([f('services/api/src/copy.ts', 3, 1)], [], config);
    expect(r).toMatchObject({ withinLimits: true, reasons: [], projects: ['api'], totals: { files: 1, loc: 4 } });
  });

  test('limits on files, lines and projects', () => {
    const r = analyzeDiff([f('services/api/a.ts', 60), f('services/api/b.ts', 50), f('services/bot/c.ts'), f('services/bot/d.ts')], [], config);
    expect(r.reasons).toEqual(['touches 2 projects (api, bot)', '4 files changed (limit 3)', '112 lines changed (limit ~100)']);
  });

  test('exactly at the limits is still quick', () => {
    expect(analyzeDiff([f('services/api/a.ts', 50, 48), f('services/api/b.ts', 2), f('services/api/c.ts', 0)], [], config).withinLimits).toBe(true);
  });

  test('new dependencies escalate; version bumps of existing ones do not', () => {
    const before = JSON.stringify({ dependencies: { zod: '^3' } });
    const bump = analyzeDiff([f('services/api/package.json')], [{ path: 'services/api/package.json', before, after: JSON.stringify({ dependencies: { zod: '^4' } }) }], config);
    expect(bump.newDependencies).toEqual([]);
    const added = analyzeDiff([f('services/api/package.json')], [{ path: 'services/api/package.json', before, after: JSON.stringify({ dependencies: { zod: '^3', lodash: '1' } }) }], config);
    expect(added.reasons).toContain('new dependencies: services/api/package.json: lodash');
  });

  test.each([
    ['services/api/src/auth/session.ts', 'auth'],
    ['services/api/src/billing/invoice.ts', 'payments'],
    ['services/api/src/privacy/consent.ts', 'pii'],
    ['services/api/migrations/0002_add.sql', 'migration'],
  ])('%s carries the forbidden tag %s', (path, tag) => {
    const r = analyzeDiff([f(path)], [], config);
    expect(r.riskTags).toContain(tag);
    expect(r.withinLimits).toBe(false);
    expect(r.reasons.some((x) => x.includes('never allowed in quick') && x.includes(tag))).toBe(true);
  });

  test('words that merely contain a risky stem are not tagged', () => {
    expect(analyzeDiff([f('services/api/src/author-card.tsx')], [], config).riskTags).toEqual([]);
  });

  test('public contracts escalate', () => {
    expect(analyzeDiff([f('services/api/openapi.yaml')], [], config).reasons).toContain('public contracts: services/api/openapi.yaml');
  });

  test('prompt changes escalate only in ai projects', () => {
    expect(analyzeDiff([f('services/bot/prompts/system.md')], [], config).withinLimits).toBe(false);
    expect(analyzeDiff([f('services/api/prompts/help.md')], [], config).withinLimits).toBe(true);
  });

  test('nested projects resolve to the deepest path', () => {
    const nested = { projects: [{ name: 'root', path: '.', profile: 'app' as const, gates: {} }, { name: 'web', path: 'apps/web', profile: 'app' as const, gates: {} }] };
    expect(analyzeDiff([f('apps/web/x.ts')], [], nested).projects).toEqual(['web']);
  });

  test('manifestDeps reads requirements and pyproject strings', () => {
    expect([...manifestDeps('requirements.txt', 'fastapi>=0.1\n# c\nhttpx\n')]).toEqual(['fastapi', 'httpx']);
    expect(manifestDeps('pyproject.toml', 'dependencies = ["openai>=1", "rich[jupyter]"]').has('rich')).toBe(true);
  });
});

describe('proposeSkills', () => {
  const skill = (id: string, technology: string, extra: Record<string, unknown> = {}) => ({
    id,
    technology,
    role: 'primary',
    description: 'x',
    match: { packages: [technology] },
    profiles: ['app'],
    source: { type: 'bundled', path: 'x' },
    version: '1.0.0',
    author: 'x',
    license: 'MIT',
    vetted: true,
    ...extra,
  });
  const fp = (deps: Record<string, string>, profile: ProjectFingerprint['profile'] = 'app'): ProjectFingerprint => ({ project: 'api', path: '.', profile, dependencies: deps, files: [] });

  test('matches by package and version range, skipping incompatible versions', () => {
    const catalog = catalogSchema.parse({ version: 1, skills: [skill('react-19', 'react', { match: { packages: ['react'], versions: '>=19' } })] });
    expect(proposeSkills([fp({ react: '^19.1.0' })], catalog).matches.map((m) => m.skill)).toEqual(['react-19']);
    expect(proposeSkills([fp({ react: '^18.2.0' })], catalog).matches).toEqual([]);
  });

  test('keeps one primary per technology and prefers vetted ones', () => {
    const catalog = catalogSchema.parse({
      version: 1,
      skills: [skill('nest-community', 'nestjs', { vetted: false, profiles: ['ai'], match: { packages: ['nestjs'] } }), skill('nest-official', 'nestjs', { match: { packages: ['nestjs'] } })],
    });
    const r = proposeSkills([fp({ nestjs: '10' }, 'app'), { ...fp({ nestjs: '10' }, 'ai'), project: 'bot' }], catalog);
    expect(r.matches.map((m) => m.skill)).toEqual(['nest-official']);
    expect(r.dropped).toEqual([{ skill: 'nest-community', reason: '"nest-official" is already the primary skill for nestjs' }]);
  });

  test('enforces the cap and ignores bootstrap skills', () => {
    const catalog = catalogSchema.parse({ version: 1, skills: [skill('a', 'a'), skill('b', 'b'), skill('c', 'c'), skill('boot', 'boot', { bootstrap: true })] });
    const r = proposeSkills([fp({ a: '1', b: '1', c: '1', boot: '1' })], catalog, 2);
    expect(r.matches.map((m) => m.skill)).toEqual(['a', 'b']);
    expect(r.dropped).toEqual([{ skill: 'c', reason: 'cap of 2 skills reached' }]);
  });
});
