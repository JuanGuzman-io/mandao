import { describe, expect, test } from 'vitest';
import { readCatalog } from '../../src/engine/catalog.js';
import { catalogSchema } from '../../src/schemas/index.js';
import { commandSkills } from '../../src/skills/command-skills.js';
import { withModelInvocationDisabled } from '../../src/skills/git-copy.js';
import { mockSkills } from '../../src/skills/on-demand.js';

/** Phase 13: skills installed only when the user accepts a mock (`install_on: mock-accepted`). */
const meta = { version: '1', author: 'a', license: 'MIT', vetted: false, phases: ['implement'], description: 'x' };
const gitSource = { type: 'git', url: 'https://x.dev/d', ref: 'v1', path: 'd', commit: 'a'.repeat(40) };
const catalog = (extra: Record<string, unknown> = {}) => ({
  schema_version: 1,
  bootstrap: ['core-skill'],
  skills: {
    'core-skill': { ...meta, binding: 'core', source: { type: 'plugin', install: ['/plugin install x'], repo: 'https://x.dev/r' } },
    design: { ...meta, binding: 'conditional', profiles: ['app'], source: gitSource, install_on: 'mock-accepted', model_invocation: false },
    'claude-only': {
      ...meta,
      binding: 'conditional',
      source: { type: 'plugin', install: ['/plugin install y'], repo: 'https://x.dev/y' },
      install_on: 'mock-accepted',
    },
  },
  technologies: {},
  ...extra,
});

describe('catalog: install_on and model_invocation', () => {
  test('both are optional; model_invocation defaults to true', () => {
    const parsed = catalogSchema.parse(catalog());
    expect(parsed.skills.design).toMatchObject({ install_on: 'mock-accepted', model_invocation: false });
    expect(parsed.skills['core-skill']!.install_on).toBeUndefined();
    expect(parsed.skills['core-skill']!.model_invocation).toBe(true);
    expect(
      catalogSchema.safeParse(catalog({ skills: { ...catalog().skills, design: { ...catalog().skills.design, install_on: 'init' } } }))
        .success,
    ).toBe(false);
  });

  test('an install_on skill can be neither bootstrap, in a pack, nor a technology match: only `skills add <id>` installs it', () => {
    expect(catalogSchema.safeParse(catalog({ bootstrap: ['design'] })).success).toBe(false);
    expect(catalogSchema.safeParse(catalog({ packs: { web: ['design'] } })).success).toBe(false);
    const technologies = { react: { match: { packages: ['react'] }, primary: 'design' } };
    expect(catalogSchema.safeParse(catalog({ technologies })).success).toBe(false);
  });

  test('init and doctor (commandSkills) never offer it, even if it were core', () => {
    const c = catalogSchema.parse(catalog());
    expect(commandSkills(c).map((s) => s.id)).toEqual(['core-skill']);
  });

  test('the shipped catalog: ai-design-skills installs only on an accepted mock, without automatic invocation', () => {
    expect(readCatalog().skills['ai-design-skills']).toMatchObject({ install_on: 'mock-accepted', model_invocation: false });
  });
});

describe('mockSkills: what an accepted mock may install, as commands, never run', () => {
  const c = () => catalogSchema.parse(catalog());
  test('lists matching skills with the exact skills add command', () => {
    expect(mockSkills(c(), { profiles: ['app'], harnesses: ['claude'], pinned: [] })).toEqual([
      { id: 'claude-only', install: 'node .mandao/bin/mandao.mjs skills add claude-only --yes' },
      { id: 'design', install: 'node .mandao/bin/mandao.mjs skills add design --yes' },
    ]);
  });

  test('profile, harness (a plugin needs Claude Code) and already pinned skills filter it', () => {
    expect(mockSkills(c(), { profiles: ['data'], harnesses: ['claude'], pinned: [] }).map((s) => s.id)).toEqual(['claude-only']);
    expect(mockSkills(c(), { profiles: ['app'], harnesses: ['codex'], pinned: [] }).map((s) => s.id)).toEqual(['design']);
    expect(mockSkills(c(), { profiles: ['app'], harnesses: ['codex'], pinned: ['design'] })).toEqual([]);
  });
});

describe('withModelInvocationDisabled', () => {
  test('adds the key to the frontmatter, replaces a false value, and creates a frontmatter when there is none', () => {
    expect(withModelInvocationDisabled('---\nname: a\n---\nbody\n')).toBe('---\nname: a\ndisable-model-invocation: true\n---\nbody\n');
    expect(withModelInvocationDisabled('---\nname: a\ndisable-model-invocation: false\n---\nb')).toBe(
      '---\nname: a\ndisable-model-invocation: true\n---\nb',
    );
    expect(withModelInvocationDisabled('body\n')).toBe('---\ndisable-model-invocation: true\n---\nbody\n');
    expect(withModelInvocationDisabled('---\r\nname: a\r\n---\r\nb')).toContain('disable-model-invocation: true');
  });
});

describe('rework F7: the frontmatter rewrite is literal and keeps the file format', () => {
  test('$ patterns in the frontmatter or body are kept as written', () => {
    expect(withModelInvocationDisabled("---\nname: a $& $1 $$\n---\nbody $' $`\n")).toBe(
      "---\nname: a $& $1 $$\ndisable-model-invocation: true\n---\nbody $' $`\n",
    );
  });

  test('CRLF files stay CRLF', () => {
    expect(withModelInvocationDisabled('---\r\nname: a\r\n---\r\nb\r\n')).toBe(
      '---\r\nname: a\r\ndisable-model-invocation: true\r\n---\r\nb\r\n',
    );
    expect(withModelInvocationDisabled('body\r\n')).toBe('---\r\ndisable-model-invocation: true\r\n---\r\nbody\r\n');
  });

  test('a BOM stays first, and an empty frontmatter gets the key', () => {
    expect(withModelInvocationDisabled('\uFEFF---\nname: a\n---\nb')).toBe('\uFEFF---\nname: a\ndisable-model-invocation: true\n---\nb');
    expect(withModelInvocationDisabled('---\n---\nb')).toBe('---\ndisable-model-invocation: true\n---\nb');
  });
});

describe('rework F8: model_invocation: false only for git sources', () => {
  test('a non-git source with model_invocation: false is refused with a clear error', () => {
    const skills = { ...catalog().skills, design: { ...catalog().skills.design, source: { type: 'bundled', path: 'x' } } };
    const r = catalogSchema.safeParse(catalog({ skills }));
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/model_invocation: false.*git source/);
  });
});
