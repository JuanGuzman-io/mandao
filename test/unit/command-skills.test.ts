import { describe, expect, test } from 'vitest';
import { readCatalog } from '../../src/engine/catalog.js';
import { type Catalog, catalogSchema, lockSchema } from '../../src/schemas/index.js';
import { commandSkills } from '../../src/skills/command-skills.js';

const catalog = readCatalog();
const FOUR = ['brainstorming', 'graphify', 'product-manager-toolkit', 'software-architect'];
const ids = (c: Catalog = catalog) =>
  commandSkills(c)
    .map((s) => s.id)
    .sort();
const commandsOf = (id: string, c: Catalog = catalog) => [...(commandSkills(c).find((s) => s.id === id)?.commands ?? [])].sort();

describe('commandSkills (FR-1, D1)', () => {
  test('S-1.1: the four skills with the commands that use them', () => {
    expect(ids()).toEqual(FOUR);
    expect(commandsOf('brainstorming')).toEqual(['constitution', 'specify', 'story']);
    expect(commandsOf('product-manager-toolkit')).toEqual(['constitution', 'specify', 'story']);
    expect(commandsOf('graphify')).toEqual(['close', 'constitution', 'implement', 'specify', 'story']);
    expect(commandsOf('software-architect')).toEqual(['constitution', 'specify']);
  });

  test('S-1.1/C1: mandao-skills (bundled) and stack, profile and conditional skills are not included', () => {
    const result = ids();
    expect(result).not.toContain('mandao-skills');
    for (const [id, s] of Object.entries(catalog.skills)) {
      if (s.binding !== 'core' || s.source.type === 'bundled') expect(result, id).not.toContain(id);
    }
    for (const binding of ['stack', 'profile', 'conditional']) {
      expect(
        Object.values(catalog.skills).some((s) => s.binding === binding),
        binding,
      ).toBe(true);
    }
  });

  test('S-1.2: the set does not depend on the harness (codex, opencode, copilot, antigravity get the same four)', () => {
    // D1: commandSkills takes only the catalog; no harness argument exists to vary the result.
    expect(commandSkills.length).toBe(1);
    expect(ids()).toEqual(FOUR);
    for (const id of FOUR) expect(commandsOf(id).length, id).toBeGreaterThan(0);
  });

  test('FR-1: a core skill outside bootstrap is excluded (synthetic catalog)', () => {
    const synthetic: Catalog = structuredClone(catalog);
    synthetic.skills['extra-core'] = { ...structuredClone(catalog.skills.graphify!), binding: 'core', phases: ['specify'] };
    expect(synthetic.bootstrap).not.toContain('extra-core');
    expect(ids(synthetic)).not.toContain('extra-core');
    synthetic.bootstrap = synthetic.bootstrap.filter((b) => b !== 'brainstorming');
    expect(ids(synthetic)).toEqual(['graphify', 'product-manager-toolkit', 'software-architect']);
  });
});

describe('catalog and lock schemas (D1, D3)', () => {
  test('AC-3: every git source has a 40-hex commit; one without commit is rejected', () => {
    const gits = Object.entries(catalog.skills).filter(([, s]) => s.source.type === 'git');
    expect(gits.map(([id]) => id).sort()).toEqual(['ai-design-skills', 'brainstorming', 'product-manager-toolkit', 'software-architect']);
    for (const [id, s] of gits) expect((s.source as { commit?: string }).commit, id).toMatch(/^[0-9a-f]{40}$/);
    const bad = structuredClone(catalog) as unknown as { skills: Record<string, { source: Record<string, unknown> }> };
    delete bad.skills['software-architect']!.source.commit;
    expect(catalogSchema.safeParse(bad).success).toBe(false);
  });

  test('round 3: every git ref is a tag/branch-like name (not hex) or the full 40-hex commit itself', () => {
    const gits = Object.entries(catalog.skills).filter(([, s]) => s.source.type === 'git');
    for (const [id, s] of gits) {
      const { ref, commit } = s.source as { ref: string; commit: string };
      if (/^[0-9a-f]{40}$/.test(ref)) expect(ref, id).toBe(commit);
      else expect(ref, id).not.toMatch(/^[0-9a-f]+$/);
    }
    expect((catalog.skills['ai-design-skills']!.source as { ref: string }).ref).toBe('1c1e97cb9878e236552c772092dda7adcdddbcb2');
  });

  test('round 3: the schema refuses a short hash ref and a full hash ref that differs from commit', () => {
    const withRef = (ref: string) => {
      const c = structuredClone(catalog) as unknown as { skills: Record<string, { source: Record<string, unknown> }> };
      c.skills['ai-design-skills']!.source.ref = ref;
      return catalogSchema.safeParse(c);
    };
    const short = withRef('1c1e97c');
    expect(short.success).toBe(false);
    expect(JSON.stringify(short.error?.issues)).toMatch(/tag or the full 40-hex commit/);
    expect(withRef('a'.repeat(40)).success).toBe(false);
    expect(withRef('1c1e97cb9878e236552c772092dda7adcdddbcb2').success).toBe(true);
    const upper = withRef('1C1E97CB9878E236552C772092DDA7ADCDDDBCB2');
    expect(upper.success).toBe(false);
    expect(JSON.stringify(upper.error?.issues)).toMatch(/lowercase/);
    expect(withRef('1C1E97C').success).toBe(false);
  });

  test('AC-3/D3: brainstorming, product-manager-toolkit and software-architect use the pinned git sources', () => {
    const src = (id: string) => catalog.skills[id]!.source as { type: string; url: string; ref: string; commit?: string; path?: string };
    expect(src('brainstorming')).toMatchObject({
      type: 'git',
      url: 'https://github.com/obra/superpowers',
      ref: 'v7.0.0',
      commit: 'bb92a77741419a4ab5f06e711a283343f1ada0c3',
    });
    expect(src('product-manager-toolkit')).toMatchObject({
      type: 'git',
      url: 'https://github.com/alirezarezvani/claude-skills',
      ref: 'v2.12.0',
      commit: '437f321c8cadf9f68ba0d8440ef02dc21ebb3d72',
    });
    expect(src('software-architect')).toMatchObject({ type: 'git', ref: 'v2.34.1', commit: 'b04e03f555ec26b0221b0675a3225a9d0da3200d' });
    for (const id of ['brainstorming', 'product-manager-toolkit']) expect(src(id).path, id).toBeTruthy();
  });

  test('D1: the four core skills carry a fallback; the catalog has no harnesses field', () => {
    for (const id of FOUR) expect((catalog.skills[id] as { fallback?: string }).fallback, id).toMatch(/\S/);
    for (const [id, s] of Object.entries(catalog.skills)) expect('harnesses' in s, id).toBe(false);
    const withHarnesses = structuredClone(catalog) as unknown as { skills: Record<string, Record<string, unknown>> };
    withHarnesses.skills.graphify!.harnesses = ['claude'];
    const parsed = catalogSchema.parse(withHarnesses);
    expect('harnesses' in parsed.skills.graphify!).toBe(false);
  });

  test('D3: the lock skill entry accepts an optional commit, and works without it', () => {
    const entry = { id: 'brainstorming', version: '7.0.0', source: 'git', author: 'a', license: 'MIT', vetted: true };
    const lock = (skills: unknown[]) => ({ schema_version: 1, mandao: '0.0.0', config_hash: 'sha256-abc', layers: [], files: [], skills });
    const withCommit = lockSchema.parse(lock([{ ...entry, commit: 'a'.repeat(40) }]));
    expect((withCommit.skills[0] as { commit?: string }).commit).toBe('a'.repeat(40));
    expect(lockSchema.safeParse(lock([entry])).success).toBe(true);
  });
});
