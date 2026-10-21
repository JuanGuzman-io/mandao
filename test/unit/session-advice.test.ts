import { describe, expect, test } from 'vitest';
import { ADAPTERS } from '../../src/adapters/index.js';
// ASSUMPTION (the spec fixes behavior, not names): `sessionAdvice(harness, worktree, first)` is exported from
// src/cli/session-advice.ts and returns `{ action, then, fallback }` (spec D4); `action` is undefined when the
// harness has no in-place new-conversation action.
import { sessionAdvice } from '../../src/cli/session-advice.js';
import { openCommand } from '../../src/cli/start.js';

const WORKTREE = '/work/MDO-0001-wt';
const FIRST = '/mandao-implement MDO-0001';

describe('session advice: the active harness own new-conversation action (FR-3)', () => {
  test('S-3.1: Claude Code reads /clear, then the next command, with the worktree command as the fallback', () => {
    expect(sessionAdvice('claude', WORKTREE, FIRST)).toEqual({
      action: '/clear',
      then: '/mandao-implement MDO-0001',
      fallback: `cd ${JSON.stringify(WORKTREE)} && claude "/mandao-implement MDO-0001"`,
    });
  });

  test.each([
    ['codex', '/new', 'codex'],
    ['opencode', '/new', 'opencode'],
  ])('S-3.2: %s names %s, then the next command, with its open command as the fallback', (harness, action, binary) => {
    const advice = sessionAdvice(harness, WORKTREE, FIRST);
    expect(advice.action).toBe(action);
    expect(advice.then).toContain('mandao-implement MDO-0001');
    expect(advice.fallback).toContain(WORKTREE);
    expect(advice.fallback).toContain(binary);
    expect(advice.fallback).toContain('mandao-implement MDO-0001');
  });

  test('S-3.2: Copilot names "New chat" with its shortcuts', () => {
    const advice = sessionAdvice('copilot', WORKTREE, FIRST);
    expect(advice.action).toMatch(/New chat/);
    expect(advice.action).toMatch(/Ctrl\+N/);
    expect(advice.then).toContain('mandao-implement MDO-0001');
    expect(advice.fallback).toContain(WORKTREE);
  });

  test('S-3.2: Antigravity names its shortcuts', () => {
    const advice = sessionAdvice('antigravity', WORKTREE, FIRST);
    expect(advice.action).toMatch(/Ctrl\+N/);
    expect(advice.action).not.toMatch(/\/clear|\/new/);
    expect(advice.then).toContain('mandao-implement MDO-0001');
    expect(advice.fallback).toContain(WORKTREE);
  });

  test('S-3.2/C2: a harness with no in-place action gets the open-session command and no action', () => {
    const advice = sessionAdvice('no-such-harness', WORKTREE, FIRST);
    expect(advice.action).toBeUndefined();
    expect(advice.fallback).toContain(WORKTREE);
    expect(advice.fallback).toContain('mandao-implement MDO-0001');
  });
});

describe('D2: resume is part of each adapter session facts', () => {
  const expected: Record<string, string> = {
    claude: `cd "/work/wt" && claude "/mandao-implement MDO-0001"`,
    codex: `cd "/work/wt" && codex '$mandao-implement MDO-0001'`,
    copilot: `code "/work/wt"   # then run /mandao-implement MDO-0001 in Copilot Chat`,
    opencode: `cd "/work/wt"   # open opencode there and run /mandao-implement MDO-0001`,
    antigravity: `cd "/work/wt"   # open antigravity there and run /mandao-implement MDO-0001`,
  };
  test.each(Object.keys(expected))('%s: session.resume equals today openCommand, and is the advice fallback', (id) => {
    const facts = ADAPTERS[id as keyof typeof ADAPTERS].session as unknown as {
      resume: (worktree: string, first: string) => { text: string; launch?: string[] };
    };
    expect(typeof facts.resume).toBe('function');
    const resumed = facts.resume('/work/wt', '/mandao-implement MDO-0001');
    expect(resumed.text).toBe(expected[id]);
    expect(resumed).toEqual(openCommand(id, '/work/wt', '/mandao-implement MDO-0001'));
    expect(sessionAdvice(id, '/work/wt', '/mandao-implement MDO-0001').fallback).toBe(expected[id]);
  });
});
