// mandao-scans: .claude/skills .agents/skills .github/skills
import { beforeEach, describe, expect, test } from 'vitest';
import { readCatalog } from '../../src/engine/catalog.js';
import { skillFindings } from '../../src/engine/doctor-skills.js';
import { makeTree } from '../helpers.js';

const catalog = readCatalog();
const fallback = catalog.skills.brainstorming!.fallback;
const skill = (folder: string, id: string) => ({ [`${folder}/${id}/SKILL.md`]: '# skill\n' });

let home: string;
beforeEach(() => {
  home = makeTree({});
});

const find = (findings: ReturnType<typeof skillFindings>, id: string) => findings.filter((f) => f.message.startsWith(`${id} is missing`));

describe('doctor: skills the commands use', () => {
  test('S-6.1: a pinned skill that is gone warns with its harnesses, the commands that lose it, its fallback and the fix', () => {
    const root = makeTree({ ...skill('.claude/skills', 'product-manager-toolkit') });
    const findings = skillFindings({ catalog, pinned: ['brainstorming'], harnesses: ['claude', 'codex'], root, home });
    const [f, ...rest] = find(findings, 'brainstorming');
    expect(rest).toEqual([]);
    expect(f!.level).toBe('warn');
    expect(f!.message).toContain('brainstorming is missing: constitution, story, specify lose it');
    expect(f!.message).toContain(fallback);
    expect(f!.message).toMatch(/claude.*codex/);
    expect(f!.fix).toBe('mandao skills add brainstorming');
  });

  test('S-6.1: only the harnesses that lack the skill are named', () => {
    const root = makeTree({ ...skill('.claude/skills', 'brainstorming') });
    const [f] = find(skillFindings({ catalog, pinned: ['brainstorming'], harnesses: ['claude', 'codex'], root, home }), 'brainstorming');
    expect(f!.level).toBe('warn');
    expect(f!.message).toContain('codex');
    expect(f!.message).not.toContain('claude');
    const found = makeTree({ ...skill('.claude/skills', 'brainstorming'), ...skill('.agents/skills', 'brainstorming') });
    expect(
      find(skillFindings({ catalog, pinned: ['brainstorming'], harnesses: ['claude', 'codex'], root: found, home }), 'brainstorming'),
    ).toEqual([]);
  });

  test('S-6.1: a skill in the home folder of the harness counts as found', () => {
    const root = makeTree({});
    const homed = makeTree({ ...skill('.claude/skills', 'brainstorming') });
    expect(find(skillFindings({ catalog, pinned: ['brainstorming'], harnesses: ['claude'], root, home: homed }), 'brainstorming')).toEqual(
      [],
    );
  });

  test('S-6.2: a skill never installed is an info with the same content, and nothing warns or errors', () => {
    const root = makeTree({});
    const findings = skillFindings({ catalog, pinned: [], harnesses: ['claude'], root, home });
    const [f, ...rest] = find(findings, 'brainstorming');
    expect(rest).toEqual([]);
    expect(f!.level).toBe('info');
    expect(f!.message).toContain('brainstorming is missing: constitution, story, specify lose it');
    expect(f!.message).toContain(fallback);
    expect(f!.fix).toBe('mandao skills add brainstorming');
    expect(find(findings, 'product-manager-toolkit')).toHaveLength(1);
    expect(findings.filter((x) => x.level === 'warn' || x.level === 'error')).toEqual([]);
  });

  test('S-6.2: graphify, which doctor reports as an optional tool, gives no skill finding', () => {
    const root = makeTree({});
    for (const pinned of [[], ['graphify']]) {
      const findings = skillFindings({ catalog, pinned, harnesses: ['claude'], root, home });
      expect(findings.filter((x) => x.message.includes('graphify'))).toEqual([]);
    }
  });
});
