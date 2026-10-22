import { describe, expect, test } from 'vitest';
import { securityScanningFindings } from '../../src/engine/doctor.js';
import { readConfig } from '../../src/engine/files.js';
import { makeTree } from '../helpers.js';

describe('doctor security-scan findings', () => {
  test('reports missing/unverifiable coverage as informational and identifies manual declarations', () => {
    const root = makeTree({
      '.mandao/config.yml':
        'schema_version: 1\nworkspace: single\nprojects:\n  - name: app\n    path: .\n    gates:\n      secrets: gitleaks git .\nharnesses: [codex]\n',
      'docs/constitution/infrastructure.md':
        '---\nlevel: workspace\nsecurity_scanning:\n  secrets:\n    declared:\n      local: [company-gitleaks-wrapper]\n---\n# Infrastructure\n',
    });

    const findings = securityScanningFindings(root, readConfig(root));

    expect(findings).toContainEqual(
      expect.objectContaining({ level: 'info', message: expect.stringContaining('secrets scanning is covered') }),
    );
    expect(findings).toContainEqual(
      expect.objectContaining({ level: 'info', message: expect.stringContaining('declared local:company-gitleaks-wrapper') }),
    );
    expect(findings).toContainEqual(
      expect.objectContaining({ level: 'info', message: expect.stringContaining('sast scanning is unknown') }),
    );
    expect(findings.some((finding) => finding.level === 'error')).toBe(false);
  });
});
