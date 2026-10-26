import { describe, expect, test } from 'vitest';
import { harnessOption } from '../../src/cli/spec-context.js';

describe('harnessOption', () => {
  test('defaults to claude and accepts every harness id', () => {
    expect(harnessOption(undefined)).toBe('claude');
    expect(harnessOption('codex')).toBe('codex');
  });

  test('accepts claude-code as an alias of claude (MDO-0001)', () => {
    expect(harnessOption('claude-code')).toBe('claude');
  });

  test('an unknown harness names the valid ids', () => {
    expect(() => harnessOption('nope')).toThrow('Unknown harness "nope". Available: claude, copilot, codex, opencode, antigravity');
  });
});
