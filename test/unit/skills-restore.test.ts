// mandao-scans: none — lists only the temporary trees it creates.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { expect, test } from 'vitest';
import { installSkills, pinSkills } from '../../src/skills/install.js';
import { enrichLegacySkills, restorableSkill, restoreSkills } from '../../src/skills/restore.js';
import { packageInfo } from '../../src/util/package-root.js';
import { emptyLock, gitCatalog, gitRunner, skillRepo, withLocalGitFixture } from '../git-skill-fixture.js';
import { makeTree } from '../helpers.js';

test('restores a missing pinned git skill at its exact commit without overwriting existing copies', () => {
  const repo = skillRepo();
  const root = makeTree({});
  const catalog = gitCatalog(repo.url, repo.commit);
  const installed = withLocalGitFixture(repo, () =>
    installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['claude', 'codex'] }),
  );
  const lock = pinSkills(emptyLock(), installed, catalog);
  const skill = lock.skills[0]!;
  expect(restorableSkill(skill)).toBe(true);
  const claude = join(root, '.claude/skills/brainstorming');
  const codex = join(root, '.agents/skills/brainstorming/SKILL.md');
  const original = readFileSync(join(claude, 'SKILL.md'), 'utf8');
  rmSync(claude, { recursive: true });
  const results = withLocalGitFixture(repo, () => restoreSkills(lock.skills, root, ['claude', 'codex'], gitRunner()));
  expect(results[0]?.status).toBe('installed');
  expect(readFileSync(join(claude, 'SKILL.md'), 'utf8')).toBe(original);
  expect(existsSync(codex)).toBe(true);
  expect(withLocalGitFixture(repo, () => restoreSkills(lock.skills, root, ['claude', 'codex'], gitRunner()))[0]?.status).toBe('present');
});

test('unavailable sources and unsafe lock recipes are reported without touching targets', () => {
  const root = makeTree({});
  const repo = skillRepo();
  const catalog = gitCatalog(repo.url, repo.commit);
  const installed = withLocalGitFixture(repo, () =>
    installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['claude'] }),
  );
  const skill = pinSkills(emptyLock(), installed, catalog).skills[0]!;
  const unsafe = { ...skill, id: '../escape' };
  const unavailable = { ...skill, restore: undefined };
  expect(restoreSkills([unsafe, unavailable], root, ['claude'], gitRunner()).map((r) => r.status)).toEqual(['unavailable', 'unavailable']);
});

test('a missing git executable fails a reinstatable skill, and continues to the next entry', () => {
  const root = makeTree({});
  const repo = skillRepo();
  const catalog = gitCatalog(repo.url, repo.commit);
  const installed = withLocalGitFixture(repo, () =>
    installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['claude'] }),
  );
  const skill = pinSkills(emptyLock(), installed, catalog).skills[0]!;
  rmSync(join(root, '.claude/skills/brainstorming'), { recursive: true });
  const results = restoreSkills([skill, { ...skill, restore: undefined }], root, ['claude'], { has: () => false, run: () => false });
  expect(results.map((r) => r.status)).toEqual(['failed', 'unavailable']);
});

test('without a root to read the installed copy, a legacy git pin gets no recipe (review F4)', () => {
  const repo = skillRepo();
  const root = makeTree({});
  const catalog = gitCatalog(repo.url, repo.commit);
  const installed = withLocalGitFixture(repo, () =>
    installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['claude'] }),
  );
  const pin = { ...pinSkills(emptyLock(), installed, catalog).skills[0]!, restore: undefined };
  expect(restorableSkill(enrichLegacySkills([pin], catalog, '0.1.0')[0]!)).toBe(false);
  expect(restorableSkill(enrichLegacySkills([{ ...pin, commit: 'a'.repeat(40) }], catalog, '0.1.0')[0]!)).toBe(false);
});

test('a legacy git pin gets its recipe from the installed copy when the catalog pins the same commit (PR #42 review)', () => {
  const repo = skillRepo();
  const root = makeTree({});
  const catalog = gitCatalog(repo.url, repo.commit);
  const installed = withLocalGitFixture(repo, () =>
    installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['claude'] }),
  );
  const pin = { ...pinSkills(emptyLock(), installed, catalog).skills[0]!, restore: undefined };
  const [enriched] = enrichLegacySkills([pin], catalog, '0.1.0', root);
  expect(enriched?.restore).toEqual({ type: 'git', url: repo.url, path: 'skills/brainstorming', model_invocation: true });
  expect(restorableSkill(enriched!)).toBe(true);

  // The copy says invocation was disabled: the recipe keeps that, whatever the catalog says today.
  const skill = join(root, '.claude/skills/brainstorming/SKILL.md');
  writeFileSync(skill, readFileSync(skill, 'utf8').replace(/^---\n/, '---\ndisable-model-invocation: true\n'));
  expect(enrichLegacySkills([pin], catalog, '0.1.0', root)[0]?.restore).toMatchObject({ model_invocation: false });

  // Another commit in the catalog, or no copy on disk: nothing is proven, so no recipe.
  expect(enrichLegacySkills([{ ...pin, commit: 'a'.repeat(40) }], catalog, '0.1.0', root)[0]?.restore).toBeUndefined();
  expect(enrichLegacySkills([pin], catalog, '0.1.0', makeTree({}))[0]?.restore).toBeUndefined();
});

test('the Codex policy file and the catalog setting each turn invocation off (review F2, F3)', () => {
  const repo = skillRepo();
  const root = makeTree({});
  const catalog = gitCatalog(repo.url, repo.commit);
  const installed = withLocalGitFixture(repo, () =>
    installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['codex'] }),
  );
  const pin = { ...pinSkills(emptyLock(), installed, catalog).skills[0]!, restore: undefined };
  expect(enrichLegacySkills([pin], catalog, '0.1.0', root)[0]?.restore).toMatchObject({ model_invocation: true });
  const policy = join(root, '.agents/skills/brainstorming/agents/openai.yaml');
  mkdirSync(dirname(policy), { recursive: true });
  writeFileSync(policy, 'policy:\n  allow_implicit_invocation: false\n');
  expect(enrichLegacySkills([pin], catalog, '0.1.0', root)[0]?.restore).toMatchObject({ model_invocation: false });
  rmSync(policy);
  // A copy without the marker does not loosen a catalog entry that sets invocation off.
  const off = { ...catalog, skills: { brainstorming: { ...catalog.skills.brainstorming!, model_invocation: false } } };
  expect(enrichLegacySkills([pin], off, '0.1.0', root)[0]?.restore).toMatchObject({ model_invocation: false });
});

test('a missing bundled source is never considered restorable', () => {
  const pin = {
    id: 'bundled-test',
    version: '1',
    source: 'bundled:does-not-exist',
    author: 'a',
    license: 'MIT',
    vetted: true,
    restore: { type: 'bundled' as const, path: 'does-not-exist', mandao: packageInfo().version },
  };
  expect(restorableSkill(pin)).toBe(false);
});

test('a bundled recipe from a different Mandao version fails with its required version', () => {
  const root = makeTree({});
  const skill = {
    id: 'bundled',
    version: '1',
    source: 'bundled:skills/test',
    author: 'a',
    license: 'MIT',
    vetted: true,
    restore: { type: 'bundled' as const, path: 'skills/test', mandao: '0.0.0' },
  };
  expect(restoreSkills([skill], root, ['claude'], gitRunner())[0]).toMatchObject({ status: 'failed', detail: 'requires Mandao 0.0.0' });
});
