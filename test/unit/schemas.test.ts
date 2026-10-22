import { describe, expect, test } from 'vitest';
import { catalogSchema, commandFrontmatterSchema, configSchema, DEFAULT_COMMIT_EMOJI, sourcesSchema } from '../../src/schemas/index.js';

const baseConfig = {
  schema_version: 1,
  workspace: 'single',
  projects: [{ name: 'app', path: '.', profile: 'app' }],
  harnesses: ['claude'],
};

const messages = (r: { success: boolean; error?: { issues: { message: string }[] } }) => r.error?.issues.map((i) => i.message) ?? [];

describe('config', () => {
  test('fills defaults for paths, spec ids and the commit emoji map', () => {
    const cfg = configSchema.parse(baseConfig);
    expect(cfg.paths).toEqual({
      specs: 'specs',
      constitution: 'docs/constitution',
      releases: 'docs/releases',
      worktrees: '../{repo}.worktrees',
    });
    expect(cfg.spec.branch).toBe('{prefix}{id}-{slug}');
    expect(cfg.branching).toEqual({ model: 'feature-branch' });
    expect(cfg.delivery).toEqual({ pre_push: 'impacted' });
    expect(cfg.commits.emoji).toEqual(DEFAULT_COMMIT_EMOJI);
    expect(cfg.commits.max_subject_length).toBe(72);
  });

  test('rejects paths that escape the workspace', () => {
    const r = configSchema.safeParse({ ...baseConfig, projects: [{ name: 'x', path: '../other', profile: 'app' }] });
    expect(messages(r)).toContain('must not escape the workspace');
  });

  test('single mode allows exactly one project', () => {
    const r = configSchema.safeParse({
      ...baseConfig,
      projects: [
        { name: 'a', path: 'a', profile: 'app' },
        { name: 'b', path: 'b', profile: 'app' },
      ],
    });
    expect(messages(r)).toContain('single mode allows exactly one project');
  });

  test('rejects duplicate project names and paths', () => {
    const r = configSchema.safeParse({
      ...baseConfig,
      workspace: 'monorepo',
      projects: [
        { name: 'a', path: 'x', profile: 'app' },
        { name: 'a', path: 'x', profile: 'ai' },
      ],
    });
    expect(messages(r)).toEqual(expect.arrayContaining(['duplicate project name "a"', 'duplicate project path "x"']));
  });

  test('polyrepo projects cannot live at the root', () => {
    const r = configSchema.safeParse({
      ...baseConfig,
      workspace: 'polyrepo',
      projects: [{ name: 'a', path: '.', profile: 'app', repo: 'local' }],
    });
    expect(messages(r)).toContain('polyrepo projects cannot live at the workspace root');
  });

  test('commit emoji must be unique per type', () => {
    const r = configSchema.safeParse({
      ...baseConfig,
      commits: { emoji: { ...DEFAULT_COMMIT_EMOJI, fix: '✨' } },
    });
    expect(messages(r)).toContain('each commit type needs a distinct emoji');
  });
});

describe('catalog', () => {
  const skill = {
    description: 'x',
    source: { type: 'skills', ref: 'a/b' },
    version: '1',
    author: 'x',
    license: 'MIT',
    vetted: true,
    binding: 'stack',
    phases: ['implement'],
  };

  test('every referenced skill and facet must exist', () => {
    const r = catalogSchema.safeParse({
      schema_version: 1,
      bootstrap: ['ghost'],
      skills: { bloc: skill },
      technologies: {
        flutter: {
          match: { packages: ['flutter'] },
          primary: 'bloc',
          when: { state: 'bloc' },
          alt: [{ skill: 'riverpod', when: { state: 'riverpod' } }],
        },
      },
      packs: { dev: ['nope'] },
    });
    expect(messages(r)).toEqual(
      expect.arrayContaining([
        'unknown skill "ghost"',
        'unknown skill "riverpod"',
        'unknown skill "nope"',
        'facet "state: bloc" is not defined in facets',
      ]),
    );
  });

  test('rejects invalid version ranges and empty matchers', () => {
    const r = catalogSchema.safeParse({
      schema_version: 1,
      bootstrap: [],
      skills: { a: skill },
      technologies: { a: { match: { versions: 'not-a-range' }, primary: 'a' } },
    });
    expect(messages(r)).toEqual(expect.arrayContaining(['must be a valid semver range', 'needs at least one package or file matcher']));
  });
});

describe('sources', () => {
  test('accepts the shorthand form from the design doc', () => {
    const s = sourcesSchema.parse({ schema_version: 1, tracker: 'linear', docs: 'sharepoint', meetings: 'teams', chat: 'slack' });
    expect(s.tracker.kind).toBe('linear');
    expect(s.docs).toEqual([{ kind: 'sharepoint' }]);
    expect(s.chat).toEqual([{ kind: 'slack', channels: [] }]);
  });
});

describe('polyrepo', () => {
  test('every project needs a repo', () => {
    const r = configSchema.safeParse({ ...baseConfig, workspace: 'polyrepo', projects: [{ name: 'a', path: 'a', profile: 'app' }] });
    expect(messages(r)).toContain('polyrepo project "a" needs repo (remote URL, or "local")');
  });

  test('paths drop trailing slashes', () => {
    expect(configSchema.parse({ ...baseConfig, paths: { specs: 'specs/' } }).paths.specs).toBe('specs');
  });
});

describe('command frontmatter', () => {
  test('rejects unknown keys so typos do not pass silently', () => {
    const r = commandFrontmatterSchema.safeParse({
      schema_version: 1,
      id: 'x',
      title: 'X',
      description: 'x',
      status: 'stub',
      inputs: [],
      outputs: [],
      tier: 'fast',
      capabilities: ['read'],
      aproval: 'required',
    });
    expect(r.success).toBe(false);
  });
});
