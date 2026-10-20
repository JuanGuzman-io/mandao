import { describe, expect, test } from 'vitest';
import { catalogSchema, commandFrontmatterSchema, configSchema, DEFAULT_COMMIT_EMOJI } from '../../src/schemas/index.js';

const baseConfig = {
  version: 1,
  workspace: { mode: 'single' },
  projects: [{ name: 'app', path: '.', profile: 'app' }],
  harnesses: ['claude'],
};

const messages = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.error?.issues.map((i) => i.message) ?? [];

describe('config', () => {
  test('fills defaults for paths, spec ids and the commit emoji map', () => {
    const cfg = configSchema.parse(baseConfig);
    expect(cfg.paths).toEqual({ specs: 'specs', constitution: 'docs/constitution', releases: 'docs/releases' });
    expect(cfg.spec.id).toBe('tracker');
    expect(cfg.commits.emoji).toEqual(DEFAULT_COMMIT_EMOJI);
    expect(cfg.commits.maxSubjectLength).toBe(72);
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
      workspace: { mode: 'monorepo' },
      projects: [
        { name: 'a', path: 'x', profile: 'app' },
        { name: 'a', path: 'x', profile: 'ai' },
      ],
    });
    expect(messages(r)).toEqual(expect.arrayContaining(['duplicate project name "a"', 'duplicate project path "x"']));
  });

  test('polyrepo projects cannot live at the root', () => {
    const r = configSchema.safeParse({ ...baseConfig, workspace: { mode: 'polyrepo' } });
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
    id: 'nest-a',
    technology: 'nestjs',
    role: 'primary',
    description: 'x',
    match: { packages: ['@nestjs/core'], versions: '>=10' },
    profiles: ['app'],
    source: { type: 'git', url: 'https://github.com/x/y', ref: 'v1' },
    version: '1.0.0',
    author: 'x',
    license: 'MIT',
    vetted: true,
  };

  test('allows only one primary skill per technology and profile', () => {
    const r = catalogSchema.safeParse({ version: 1, skills: [skill, { ...skill, id: 'nest-b' }] });
    expect(messages(r)).toContain('"nest-b" and "nest-a" are both primary for nestjs (app)');
  });

  test('the same technology may have one primary per profile', () => {
    const r = catalogSchema.safeParse({ version: 1, skills: [skill, { ...skill, id: 'nest-b', profiles: ['ai'] }] });
    expect(r.success).toBe(true);
  });

  test('rejects invalid version ranges and empty matchers', () => {
    const r = catalogSchema.safeParse({
      version: 1,
      skills: [{ ...skill, match: { versions: 'not-a-range' } }],
    });
    expect(messages(r)).toEqual(
      expect.arrayContaining(['must be a valid semver range', 'needs at least one package or file matcher']),
    );
  });
});

describe('command frontmatter', () => {
  test('rejects unknown keys so typos do not pass silently', () => {
    const r = commandFrontmatterSchema.safeParse({
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
