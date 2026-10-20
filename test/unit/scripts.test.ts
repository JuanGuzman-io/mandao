import { describe, expect, test } from 'vitest';
import { catalogSchema } from '../../src/schemas/index.js';
import { detectFacets, type ProjectFingerprint, proposeSkills } from '../../src/scripts/fingerprint.js';
import { analyzeDiff, manifestDeps, sizeLimits } from '../../src/scripts/quick-check.js';

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
    expect(r).toMatchObject({ withinLimits: true, reasons: [], projects: ['api'], totals: { files: 1, changedLines: 4 } });
  });

  test('limits on files, lines and projects', () => {
    const r = analyzeDiff(
      [f('services/api/a.ts', 60), f('services/api/b.ts', 50), f('services/bot/c.ts'), f('services/bot/d.ts')],
      [],
      config,
    );
    expect(r.reasons).toEqual(['touches 2 projects (api, bot)', '4 files changed (limit 3)', '112 lines changed (limit 100)']);
  });

  test('limits come from size_limits: workspace, then project, over the defaults (ADR 0028)', () => {
    expect(sizeLimits().quick).toEqual({ max_files: 3, max_changed_lines: 100 });
    const l = sizeLimits({ quick: { max_changed_lines: 200 }, pr: { max_files: 10 } }, { quick: { max_files: 5 } });
    expect(l).toEqual({ quick: { max_files: 5, max_changed_lines: 200 }, pr: { max_files: 10, max_changed_lines: 400 } });
    const big = [f('services/api/a.ts', 150)];
    expect(analyzeDiff(big, [], config).withinLimits).toBe(false);
    expect(analyzeDiff(big, [], config, { maxFiles: 3, maxChangedLines: l.quick.max_changed_lines }).withinLimits).toBe(true);
  });

  test('exactly at the limits is still quick', () => {
    expect(
      analyzeDiff([f('services/api/a.ts', 50, 48), f('services/api/b.ts', 2), f('services/api/c.ts', 0)], [], config).withinLimits,
    ).toBe(true);
  });

  test('new dependencies escalate; version bumps of existing ones do not', () => {
    const before = JSON.stringify({ dependencies: { zod: '^3' } });
    const bump = analyzeDiff(
      [f('services/api/package.json')],
      [{ path: 'services/api/package.json', before, after: JSON.stringify({ dependencies: { zod: '^4' } }) }],
      config,
    );
    expect(bump.newDependencies).toEqual([]);
    const added = analyzeDiff(
      [f('services/api/package.json')],
      [{ path: 'services/api/package.json', before, after: JSON.stringify({ dependencies: { zod: '^3', lodash: '1' } }) }],
      config,
    );
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
    const nested = {
      projects: [
        { name: 'root', path: '.', profile: 'app' as const, gates: {} },
        { name: 'web', path: 'apps/web', profile: 'app' as const, gates: {} },
      ],
    };
    expect(analyzeDiff([f('apps/web/x.ts')], [], nested).projects).toEqual(['web']);
  });

  test('manifestDeps reads requirements and pyproject strings', () => {
    expect([...manifestDeps('requirements.txt', 'fastapi>=0.1\n# c\nhttpx\n')]).toEqual(['fastapi', 'httpx']);
    expect(manifestDeps('pyproject.toml', 'dependencies = ["openai>=1", "rich[jupyter]"]').has('rich')).toBe(true);
  });
});

describe('proposeSkills', () => {
  const skill = (extra: Record<string, unknown> = {}) => ({
    description: 'x',
    source: { type: 'skills', ref: 'x/y' },
    version: '1.0.0',
    author: 'x',
    license: 'MIT',
    vetted: true,
    binding: 'stack',
    phases: ['implement'],
    profiles: ['app'],
    ...extra,
  });
  const catalog = (over: Record<string, unknown> = {}) =>
    catalogSchema.parse({
      schema_version: 1,
      bootstrap: ['graphify'],
      skills: {
        graphify: skill({ binding: 'core' }),
        'react-19': skill(),
        'flutter-bloc': skill(),
        'flutter-riverpod': skill({ vetted: false }),
        a: skill(),
        b: skill(),
        c: skill(),
      },
      technologies: {
        react: { match: { packages: ['react'], versions: '>=19' }, primary: 'react-19' },
        flutter: {
          match: { packages: ['flutter'] },
          primary: 'flutter-bloc',
          when: { state: 'bloc' },
          alt: [{ skill: 'flutter-riverpod', when: { state: 'riverpod' } }],
        },
      },
      facets: { state: { bloc: { packages: ['flutter_bloc'] }, riverpod: { packages: ['flutter_riverpod'] } } },
      ...over,
    });
  const fp = (deps: Record<string, string>, cat = catalog(), project = 'app'): ProjectFingerprint => ({
    project,
    path: '.',
    profile: 'app',
    dependencies: deps,
    files: [],
    facets: detectFacets(cat, deps, []),
  });

  test('matches by package and version range', () => {
    expect(proposeSkills([fp({ react: '^19.1.0' })], catalog()).matches.map((m) => m.skill)).toEqual(['react-19']);
    expect(proposeSkills([fp({ react: '^18.2.0' })], catalog()).matches).toEqual([]);
  });

  test('facets pick the primary or the alternative', () => {
    expect(proposeSkills([fp({ flutter: '*', flutter_bloc: '^8' })], catalog()).matches.map((m) => m.skill)).toEqual(['flutter-bloc']);
    expect(proposeSkills([fp({ flutter: '*', flutter_riverpod: '^2' })], catalog()).matches.map((m) => m.skill)).toEqual([
      'flutter-riverpod',
    ]);
  });

  test('when no facet is detected the primary is not guessed', () => {
    const r = proposeSkills([fp({ flutter: '*' })], catalog());
    expect(r.matches).toEqual([]);
    expect(r.dropped[0]?.reason).toMatch(/could not detect state/);
  });

  test('merges projects and enforces the cap, keeping vetted skills first', () => {
    const cat = catalog({
      technologies: {
        a: { match: { packages: ['a'] }, primary: 'a' },
        b: { match: { packages: ['b'] }, primary: 'b' },
        c: { match: { packages: ['c'] }, primary: 'flutter-riverpod' },
        graph: { match: { packages: ['g'] }, primary: 'graphify' },
      },
      facets: {},
    });
    const r = proposeSkills([fp({ a: '1', b: '1' }, cat, 'api'), fp({ a: '1', c: '1', g: '1' }, cat, 'web')], cat, 2);
    expect(r.matches.map((m) => [m.skill, m.projects])).toEqual([
      ['a', ['api', 'web']],
      ['b', ['api']],
    ]);
    expect(r.dropped).toEqual([{ skill: 'flutter-riverpod', technology: 'c', reason: 'cap of 2 skills reached' }]);
  });
});
