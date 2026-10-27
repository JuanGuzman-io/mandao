import { describe, expect, it } from 'vitest';
import { gitIgnoreBlock } from '../../src/engine/graph.js';
import { ignoredSkills } from '../../src/engine/sync.js';
import { configSchema } from '../../src/schemas/config.js';
import type { Lock } from '../../src/schemas/lock.js';

describe('skill tracking', () => {
  it('keeps existing projects tracked unless explicitly disabled', () => {
    const base = { schema_version: 1, workspace: 'single', projects: [{ name: 'app', path: '.' }], harnesses: ['codex'] };
    expect(configSchema.parse(base).skills.track).toBe(true);
    expect(configSchema.parse({ ...base, skills: { track: false } }).skills.track).toBe(false);
  });

  it('puts only selected skill paths in the managed block', () => {
    const content = gitIgnoreBlock([], '1', ['/.agents/skills/example/']).content;
    expect(content).toContain('/.agents/skills/example/');
    expect(content).not.toContain('graphify/');
  });

  it('ignores restorable catalog skills only in the active harness folders', () => {
    const config = configSchema.parse({
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'app', path: '.' }],
      harnesses: ['claude', 'codex', 'copilot'],
      skills: { track: false },
    });
    const common = { version: '1', author: 'a', license: 'MIT', vetted: true };
    const skills: Lock['skills'] = [
      {
        ...common,
        id: 'example',
        source: 'https://example.com/repo',
        commit: 'a'.repeat(40),
        restore: { type: 'git', url: 'https://example.com/repo', path: '.', model_invocation: true },
      },
      { ...common, id: 'graphify', source: 'https://example.com/graphify' },
      { ...common, id: 'project-skill', source: 'project' },
    ];
    expect(ignoredSkills(config, skills)).toEqual(['/.agents/skills/example/', '/.claude/skills/example/']);
    expect(ignoredSkills({ ...config, skills: { track: true } }, skills)).toEqual([]);
  });
});
