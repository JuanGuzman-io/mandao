import { describe, expect, test } from 'vitest';
import { scannersInText } from '../../src/engine/security-scanning.js';
import { securityScanState } from '../../src/schemas/security-scanning.js';
import { securityGateCommand } from '../../src/scripts/security-gates.js';

const empty = () => ({
  local: [],
  ci: [],
  provider: [],
  declared: { local: [], ci: [], provider: [] },
  unknown: [],
  checked: { local: false, ci: false, provider: false },
});

describe('security scanning inventory', () => {
  test('recognizes secret and SAST scanners independently', () => {
    expect(scannersInText('secrets', 'uses: gitleaks/gitleaks-action@v2')).toEqual(['gitleaks']);
    expect(scannersInText('sast', 'run: semgrep scan --config p/typescript')).toEqual(['semgrep']);
    expect(scannersInText('secrets', 'run: semgrep scan')).toEqual([]);
  });

  test('an unverified empty inventory is unknown, while a fully checked empty inventory is none', () => {
    expect(securityScanState(empty())).toBe('unknown');
    expect(securityScanState({ ...empty(), checked: { local: true, ci: true, provider: true } })).toBe('none');
  });

  test('unknown provider evidence is never collapsed into none', () => {
    expect(
      securityScanState({
        ...empty(),
        checked: { local: true, ci: true, provider: true },
        unknown: ['github security settings unavailable'],
      }),
    ).toBe('unknown');
  });

  test('declared scanner entries count as declared coverage, independently of detected entries', () => {
    expect(securityScanState({ ...empty(), declared: { local: ['gitleaks'], ci: [], provider: [] } })).toBe('covered');
  });

  test('local defaults run only for security-tagged tasks, and configured commands always win', () => {
    expect(securityGateCommand('secrets', undefined, true, (binary) => binary === 'gitleaks')).toBe('gitleaks git . --redact --no-banner');
    expect(securityGateCommand('sast', undefined, true, (binary) => binary === 'semgrep')).toBe(
      'semgrep scan --config auto --error --metrics=off',
    );
    expect(securityGateCommand('secrets', undefined, false, () => true)).toBeUndefined();
    expect(securityGateCommand('secrets', 'custom-scanner --quiet', true, () => false)).toBe('custom-scanner --quiet');
  });
});
