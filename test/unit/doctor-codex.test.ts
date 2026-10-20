import { describe, expect, test } from 'vitest';
import { codexFindings, isCodexTrusted } from '../../src/engine/doctor-codex.js';

const config = `model = "gpt-6-sol"

[projects."/work/app"]
trust_level = "trusted"

[projects."/work/other"]
trust_level = "untrusted"
`;

describe('codex trust and login (ADR 0021)', () => {
  test('trust is per path: an untrusted or unknown checkout is not trusted', () => {
    expect(isCodexTrusted(config, ['/work/app'])).toBe(true);
    expect(isCodexTrusted(config, ['/work/other'])).toBe(false);
    expect(isCodexTrusted(config, ['/work/app.worktrees/T-1'])).toBe(false);
    expect(isCodexTrusted(undefined, ['/work/app'])).toBe(false);
  });

  test('doctor says what does not load without trust, and asks for a login', () => {
    const loggedOut = (cmd: string) => (cmd === 'codex --version' ? 'codex-cli 0.163.0' : undefined);
    const findings = codexFindings(['/work/other'], loggedOut, config);
    expect(findings.map((f) => f.level)).toEqual(['warn', 'warn']);
    expect(findings[0]!.message).toMatch(/ignores \.codex\/agents .* and \.codex\/rules/);
    expect(findings[0]!.fix).toContain('[projects."/work/other"] trust_level = "trusted"');
    expect(findings[1]!.fix).toBe('run `codex login`');
    expect(codexFindings(['/work/app'], () => 'ok', config)).toEqual([
      { level: 'ok', message: 'codex: this project is trusted, so .codex/agents and .codex/rules load' },
    ]);
  });
});
