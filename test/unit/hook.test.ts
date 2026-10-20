import { describe, expect, test } from 'vitest';
import { agentWithoutShell } from '../../src/cli/hook.js';
import { makeTree } from '../helpers.js';

describe('graph guard only for roles with a shell (ADR 0021)', () => {
  const root = makeTree({
    '.claude/agents/mandao-reviewer.md': '---\nname: mandao-reviewer\ntools: Read, Grep, Glob\n---\n',
    '.claude/agents/mandao-implementer-standard.md': '---\nname: x\ntools: Read, Grep, Glob, Edit, Write, Bash\n---\n',
    '.claude/agents/free.md': '---\nname: free\n---\n',
  });

  test('a read-only subagent skips the guard; shell roles, the main session and unknown agents keep it', () => {
    expect(agentWithoutShell(root, 'mandao-reviewer')).toBe(true);
    expect(agentWithoutShell(root, 'mandao-implementer-standard')).toBe(false);
    expect(agentWithoutShell(root, 'free')).toBe(false);
    expect(agentWithoutShell(root, undefined)).toBe(false);
    expect(agentWithoutShell(root, 'ghost')).toBe(false);
    expect(agentWithoutShell(root, '../../etc/passwd')).toBe(false);
  });
});
