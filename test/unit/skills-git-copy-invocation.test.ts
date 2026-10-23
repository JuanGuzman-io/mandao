// mandao-scans: none — lists only the temporary trees it creates.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { catalogSchema } from '../../src/schemas/index.js';
import { installSkills, pinSkills } from '../../src/skills/install.js';
import { emptyLock, gitCatalog, gitRunner, leftInTemp, SKILL_FILES, skillRepo, withLocalGitFixture } from '../git-skill-fixture.js';
import { makeTree } from '../helpers.js';

describe('phase 13: a skill with model_invocation: false is copied with automatic invocation disabled', () => {
  test('SKILL.md gets disable-model-invocation: true (Claude Code) and .agents/skills gets agents/openai.yaml (Codex)', () => {
    const repo = skillRepo();
    const root = makeTree({});
    const base = gitCatalog(repo.url, repo.commit);
    const catalog = catalogSchema.parse({
      ...base,
      bootstrap: [],
      skills: {
        brainstorming: { ...base.skills.brainstorming!, binding: 'conditional', install_on: 'mock-accepted', model_invocation: false },
      },
    });
    const [result] = withLocalGitFixture(repo, () =>
      installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['claude', 'codex'] }),
    );
    expect(result).toMatchObject({ status: 'installed', detail: expect.stringMatching(/automatic invocation disabled/) });
    for (const folder of ['.claude/skills', '.agents/skills']) {
      expect(readFileSync(join(root, folder, 'brainstorming', 'SKILL.md'), 'utf8')).toBe(
        '---\nname: brainstorming\ndisable-model-invocation: true\n---\nUpstream body\n',
      );
    }
    expect(readFileSync(join(root, '.agents/skills/brainstorming/agents/openai.yaml'), 'utf8')).toMatch(/allow_implicit_invocation: false/);
    expect(existsSync(join(root, '.claude/skills/brainstorming/agents/openai.yaml'))).toBe(false);
  });

  test('the default (model_invocation absent) copies SKILL.md byte for byte', () => {
    const repo = skillRepo();
    const root = makeTree({});
    withLocalGitFixture(repo, () =>
      installSkills(['brainstorming'], gitCatalog(repo.url, repo.commit), root, root, gitRunner(), { harnesses: ['codex'] }),
    );
    expect(readFileSync(join(root, '.agents/skills/brainstorming/SKILL.md'), 'utf8')).toBe(SKILL_FILES['SKILL.md']);
    expect(existsSync(join(root, '.agents/skills/brainstorming/agents/openai.yaml'))).toBe(false);
  });

  test('F4: an upstream agents/openai.yaml keeps its content and gets allow_implicit_invocation: false', () => {
    const upstream = '# upstream\ninterface:\n  display_name: Brainstorm\npolicy:\n  allow_implicit_invocation: true\n  other: 1\n';
    const repo = skillRepo({ 'agents/openai.yaml': upstream });
    const root = makeTree({});
    const base = gitCatalog(repo.url, repo.commit);
    const catalog = catalogSchema.parse({
      ...base,
      bootstrap: [],
      skills: { brainstorming: { ...base.skills.brainstorming!, binding: 'conditional', model_invocation: false } },
    });
    const [result] = withLocalGitFixture(repo, () =>
      installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['codex'] }),
    );
    expect(result).toMatchObject({ status: 'installed' });
    const written = readFileSync(join(root, '.agents/skills/brainstorming/agents/openai.yaml'), 'utf8');
    expect(parseYaml(written)).toEqual({
      interface: { display_name: 'Brainstorm' },
      policy: { allow_implicit_invocation: false, other: 1 },
    });
    expect(written).toContain('# upstream');
  });

  test('round 3: a ref that is the full commit (upstream without tags) is fetched by commit and copied', () => {
    const repo = skillRepo();
    const root = makeTree({});
    const base = gitCatalog(repo.url, repo.commit);
    const catalog = catalogSchema.parse({
      ...base,
      skills: { brainstorming: { ...base.skills.brainstorming!, source: { ...base.skills.brainstorming!.source, ref: repo.commit } } },
    });
    const { value, left } = leftInTemp(() =>
      withLocalGitFixture(repo, () => installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['claude'] })),
    );
    expect(value[0]).toMatchObject({ status: 'installed' });
    expect(readFileSync(join(root, '.claude/skills/brainstorming/SKILL.md'), 'utf8')).toBe(SKILL_FILES['SKILL.md']);
    expect(existsSync(join(root, '.claude/skills/brainstorming/README.md'))).toBe(false);
    expect(left).toEqual([]);
    expect(pinSkills(emptyLock(), value, catalog).skills[0]).toMatchObject({ commit: repo.commit });
  });

  test('round 4: a failed fetch on the commit path leaves the skill pending and nothing behind', () => {
    const repo = skillRepo();
    const url = 'https://fixture.invalid/brainstorming.git';
    const root = makeTree({});
    const base = gitCatalog(url, repo.commit);
    const catalog = catalogSchema.parse({
      ...base,
      skills: { brainstorming: { ...base.skills.brainstorming!, source: { ...base.skills.brainstorming!.source, ref: repo.commit } } },
    });
    const { value, left } = leftInTemp(() =>
      withLocalGitFixture({ url, localUrl: 'file:///nonexistent/mandao-no-such-repository' }, () =>
        installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['claude', 'codex'] }),
      ),
    );
    expect(value[0]?.status).toBe('pending');
    for (const part of [url, repo.commit, 'skills/brainstorming', '.claude/skills', '.agents/skills'])
      expect(value[0]?.detail).toContain(part);
    expect(existsSync(join(root, '.claude/skills/brainstorming'))).toBe(false);
    expect(left).toEqual([]);
    expect(pinSkills(emptyLock(), value, catalog).skills).toEqual([]);
  });

  test('round 4: an uppercase full-commit ref (bypassing the schema) still takes the commit path', () => {
    const repo = skillRepo();
    const root = makeTree({});
    const base = gitCatalog(repo.url, repo.commit);
    const catalog = structuredClone(base);
    (catalog.skills.brainstorming!.source as { ref: string }).ref = repo.commit.toUpperCase();
    const [result] = withLocalGitFixture(repo, () =>
      installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['claude'] }),
    );
    expect(result).toMatchObject({ status: 'installed' });
  });
});
