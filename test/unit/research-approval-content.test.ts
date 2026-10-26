import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

describe('terminal research approvals', () => {
  test('pass the active harness at every spec depth', () => {
    const specify = readFileSync('core/commands/specify.md', 'utf8');
    const lite = readFileSync('core/templates/shared/rules/doc-lite.md', 'utf8');
    const tasks = readFileSync('core/commands/tasks.md', 'utf8');
    expect(specify).toContain('mandao approve {{arg:ref}} design --harness {{harness}}');
    expect(lite).toContain('mandao approve <ID> spec --harness <claude|codex|copilot|opencode|antigravity>');
    expect(tasks).toContain('mandao approve {{arg:spec}} tasks --harness {{harness}}');
  });
});
