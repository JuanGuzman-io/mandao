import { describe, expect, test } from 'vitest';
import { sddConflictFindings } from '../../src/engine/doctor-sdd.js';
import { makeTree } from '../helpers.js';

describe('other SDD frameworks (ADR 0030)', () => {
  test('user-level and project-level installs are reported with where they are; Mandao is never one', () => {
    const home = makeTree({
      '.claude/commands/akili-specify.md': 'x',
      '.claude/commands/mandao-specify.md': 'x',
      '.claude/skills/graphify/SKILL.md': 'x',
    });
    const root = makeTree({ '.specify/memory/constitution.md': 'x', '.claude/commands/speckit.plan.md': 'x' });
    const findings = sddConflictFindings(root, home);
    expect(findings.map((f) => f.message.split(' is installed')[0])).toEqual(['AKILI-SPECS', 'GitHub Spec Kit']);
    expect(findings[0]).toMatchObject({
      level: 'warn',
      message: expect.stringContaining('akili-specify.md'),
      fix: expect.stringContaining('Mandao does not touch them'),
    });
    expect(findings[1]!.message).toContain('project .specify/');
    expect(findings[1]!.fix).toContain('use one SDD framework per project');
  });

  test('nothing installed, nothing reported', () => {
    expect(sddConflictFindings(makeTree({ '.claude/skills/mandao-specify/SKILL.md': 'x' }), makeTree({}))).toEqual([]);
  });
});
