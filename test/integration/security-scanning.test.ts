import { execFileSync } from 'node:child_process';
import { describe, expect, test } from 'vitest';
import { readConfig } from '../../src/engine/files.js';
import { collectSecurityScanning } from '../../src/engine/security-scanning.js';
import { initTestRepo, makeTree } from '../helpers.js';

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

function repo(input: { gates?: string; workflows?: string; infrastructure?: string; github?: boolean } = {}) {
  const root = makeTree({
    '.mandao/config.yml': `schema_version: 1\nworkspace: single\nprojects:\n  - name: app\n    path: .\n${(input.gates ?? '').trimEnd()}\nharnesses: [codex]\n`,
    ...(input.workflows ? { '.github/workflows/security.yml': input.workflows } : {}),
    'docs/constitution/infrastructure.md': input.infrastructure ?? '---\nlevel: workspace\n---\n# Infrastructure\n',
    'tracked.txt': 'base\n',
  });
  initTestRepo(root, '-q', '-b', 'main');
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'fixture');
  if (input.github) git(root, 'remote', 'add', 'origin', 'https://github.com/org/repo.git');
  return root;
}

describe('collectSecurityScanning', () => {
  test('records local and CI scanners independently and verifies GitHub provider settings', () => {
    const root = repo({
      gates: '    gates:\n      secrets: gitleaks git .\n      sast: semgrep scan --config p/typescript\n    ',
      workflows: 'steps:\n  - uses: gitleaks/gitleaks-action@v2\n  - run: semgrep scan --config p/typescript\n',
      github: true,
    });
    const report = collectSecurityScanning(root, readConfig(root), {
      githubApi: (_cwd, endpoint) =>
        endpoint.endsWith('/code-scanning/analyses?per_page=1')
          ? '[]'
          : JSON.stringify({
              security_and_analysis: {
                secret_scanning: { status: 'enabled' },
                secret_scanning_push_protection: { status: 'enabled' },
              },
            }),
    })[0]!;

    expect(report.detected.secrets).toMatchObject({
      local: ['gitleaks'],
      ci: ['gitleaks'],
      provider: ['github-secret-scanning', 'github-push-protection'],
      checked: { local: true, ci: true, provider: true },
    });
    expect(report.detected.sast).toMatchObject({ local: ['semgrep'], ci: ['semgrep'], provider: [] });
    expect(report.state).toEqual({ secrets: 'covered', sast: 'covered' });
  });

  test.each([
    ['secrets only', '    gates:\n      secrets: gitleaks git .\n    ', 'secrets'],
    ['SAST only', '    gates:\n      sast: semgrep scan\n    ', 'sast'],
  ])('keeps %s as separate partial coverage', (_label, gates, kind) => {
    const root = repo({ gates });
    const report = collectSecurityScanning(root, readConfig(root), { githubApi: () => undefined })[0]!;
    expect(report.detected[kind as 'secrets' | 'sast'].local).not.toEqual([]);
    expect(report.detected[kind === 'secrets' ? 'sast' : 'secrets'].local).toEqual([]);
  });

  test('manual infrastructure declarations remain labeled declared, not detected', () => {
    const root = repo({
      infrastructure:
        '---\nlevel: workspace\nsecurity_scanning:\n  secrets:\n    declared:\n      local: [gitleaks]\n      ci: [github-actions]\n  sast: {}\n---\n# Infrastructure\n',
    });
    const report = collectSecurityScanning(root, readConfig(root), { githubApi: () => undefined })[0]!;
    expect(report.detected.secrets.local).toEqual([]);
    expect(report.recorded.secrets.declared).toMatchObject({ local: ['gitleaks'], ci: ['github-actions'] });
    expect(report.state.secrets).toBe('covered');
  });
});
