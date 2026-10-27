import { beforeAll, describe, expect, test } from 'vitest';
import { planLines, selectSkills } from '../../src/cli/skills.js';
import { readCatalog } from '../../src/engine/catalog.js';
import { type Catalog, catalogSchema, installable, type Lock } from '../../src/schemas/index.js';
import { type ProjectFingerprint, proposeSkills } from '../../src/scripts/fingerprint.js';

/** Phase 20: the catalog offers only what can be installed, and says who publishes it and under which license. */
const catalog = readCatalog();
const lock = { skills: [] } as unknown as Lock;
const fp = (dependencies: Record<string, string>, files: string[] = [], profile: ProjectFingerprint['profile'] = 'app') => ({
  project: 'web',
  path: '.',
  profile,
  dependencies,
  files,
  facets: {},
});

beforeAll(() => {
  process.env.NO_COLOR = '1';
});

describe('the shipped catalog (phase 20)', () => {
  test('every entry is installable: no UNVERIFIED placeholder anywhere', () => {
    for (const [id, s] of Object.entries(catalog.skills)) expect(installable(s), id).toBe(true);
  });

  test('every third-party entry says who publishes it; every phase 20 git pin carries its audit date', () => {
    for (const [id, s] of Object.entries(catalog.skills)) {
      if (s.source.type === 'bundled') continue;
      expect(s.trust, id).toBeDefined();
      if (s.source.type === 'git' && !catalog.bootstrap.includes(id) && !s.install_on) expect(s.audit?.checked, id).toMatch(/^\d{4}-/);
    }
  });

  test('a license declared only in the frontmatter is shown as such', () => {
    expect(planLines('vercel-react-best-practices', catalog, ['claude'])[0]).toContain('(Vercel, MIT (frontmatter), vendor)');
    expect(planLines('next-dev-loop', catalog, ['claude'])[0]).toContain('MIT, official)');
  });

  test('a Next.js project gets the React and Next.js skills; a NestJS one gets a project skill', () => {
    const next = proposeSkills([fp({ next: '^15.0.0', react: '^19.0.0' })], catalog);
    expect(next.matches.map((m) => m.skill)).toEqual(['next-dev-loop', 'vercel-react-best-practices']);
    const nest = proposeSkills([fp({ '@nestjs/core': '^11.0.0' })], catalog);
    expect(nest.matches).toEqual([]);
    expect(nest.projectSkills).toEqual([
      expect.objectContaining({ technology: 'nestjs', projects: ['web'], evidence: '@nestjs/core@^11.0.0' }),
    ]);
  });

  test('llm-evaluation is proposed for the ai profile only', () => {
    expect(proposeSkills([fp({}, [], 'ai')], catalog).matches.map((m) => m.skill)).toEqual(['llm-evaluation']);
    expect(proposeSkills([fp({}, [], 'app')], catalog).matches).toEqual([]);
  });
});

describe('an entry without a verified source (the real-state trial)', () => {
  const seed = (): Catalog =>
    catalogSchema.parse({
      schema_version: 1,
      bootstrap: [],
      skills: {
        seed: {
          description: 'x',
          source: { type: 'skills', ref: 'UNVERIFIED/seed' },
          version: 'UNVERIFIED',
          author: 'UNVERIFIED',
          license: 'UNVERIFIED',
          vetted: false,
          binding: 'stack',
          phases: ['implement'],
        },
      },
      technologies: { react: { match: { packages: ['react'] }, primary: 'seed' } },
    });

  test('run fingerprint never proposes it and says why', () => {
    const r = proposeSkills([fp({ react: '^19.0.0' })], seed());
    expect(r.matches).toEqual([]);
    expect(r.dropped).toEqual([{ skill: 'seed', technology: 'react', reason: expect.stringMatching(/no verified source/) }]);
  });

  test('skills add refuses it before any question', () => {
    expect(() => selectSkills(['seed'], seed(), lock)).toThrow(/Not installable: seed .*project skill/);
  });

  test('a technology names exactly one of a primary skill or a project skill', () => {
    const tech = (t: object) => () =>
      catalogSchema.parse({ schema_version: 1, bootstrap: [], skills: {}, technologies: { x: { match: { packages: ['x'] }, ...t } } });
    expect(tech({})).toThrow(/exactly one of primary or project_skill/);
    expect(tech({ project_skill: 'none passes' })).not.toThrow();
  });
});
