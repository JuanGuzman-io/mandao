import { describe, expect, test } from 'vitest';
import { defaultProfileGuess, PROFILE_QUESTION, profileOptions, startingProfile } from '../../src/cli/init-work-profile.js';
import { profileEvidence } from '../../src/workspace/detect.js';
import { makeTree } from '../helpers.js';

/** Phase 20: the profile question says what it decides, what each option means and why one is preselected. */
describe('the profile question at init', () => {
  test('says what it decides and offers app and ai with their hints; data is not offered', () => {
    expect(PROFILE_QUESTION).toMatch(/What kind of project is this\? It changes the spec templates, not the commands/);
    const options = profileOptions('app');
    expect(options.map((o) => o.value)).toEqual(['app', 'ai']);
    expect(options[0]!.hint).toMatch(/Given\/When\/Then/);
    expect(options[1]!.hint).toMatch(/eval thresholds.*an app with AI features picks ai/);
  });

  test('the preselected option names what was detected', () => {
    const root = makeTree({ 'pyproject.toml': '[project]\ndependencies = ["openai>=1.0", "fastapi"]\n' });
    const guess = profileEvidence(root)!;
    expect(guess).toEqual({ profile: 'ai', evidence: 'openai in pyproject.toml' });
    const ai = profileOptions('ai', guess.evidence).find((o) => o.value === 'ai')!;
    expect(ai.hint).toMatch(/detected: openai in pyproject\.toml$/);
    expect(profileOptions('ai', guess.evidence).find((o) => o.value === 'app')!.hint).not.toMatch(/detected/);
  });

  test('a detected data project starts as app and says why; --profile data is still taken', () => {
    const ws = {
      mode: 'single' as const,
      rootIsRepo: true,
      reason: 'single git repository',
      projects: [{ name: 'dw', path: '.', profile: 'data' as const, evidence: 'dbt_project.yml' }],
    };
    expect(defaultProfileGuess(ws)).toEqual({ profile: 'app', evidence: 'dbt_project.yml (the data profile is not specialized yet)' });
    expect(startingProfile(ws.projects[0]!, undefined, 'app')).toBe('app');
    expect(startingProfile(ws.projects[0]!, 'data', 'app')).toBe('data');
    // --default-profile data keeps a detected data project as data (review F3).
    expect(startingProfile(ws.projects[0]!, undefined, 'data')).toBe('data');
    // Re-asking a project already set to data can keep it (review F4).
    expect(profileOptions('data').map((o) => o.value)).toEqual(['app', 'ai', 'data']);
  });

  test('nothing detected: app, with no evidence', () => {
    expect(defaultProfileGuess({ mode: 'single', rootIsRepo: false, reason: 'x', projects: [{ name: 'a', path: '.' }] })).toEqual({
      profile: 'app',
    });
  });
});
