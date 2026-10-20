import { expect, test } from 'vitest';
import { toolVersionFindings } from '../../src/engine/tools.js';
import { catalogSchema } from '../../src/schemas/index.js';

const catalog = catalogSchema.parse({
  schema_version: 1,
  bootstrap: ['graphify'],
  skills: {
    graphify: {
      description: 'x',
      source: {
        type: 'command',
        install: ['uv tool install graphifyy==0.9.92'],
        repo: 'https://github.com/x/y',
        version_command: 'graphify --version',
      },
      version: '0.9.92',
      author: 'a',
      license: 'Apache-2.0',
      vetted: true,
      binding: 'core',
      phases: ['constitution'],
    },
  },
  technologies: {},
});

test('warns when an installed tool is older than the pinned version and offers the pinned install', () => {
  expect(toolVersionFindings(catalog, ['graphify'], () => 'graphify 0.9.13\n')).toEqual([
    {
      level: 'warn',
      message: 'graphify 0.9.13 is older than the pinned 0.9.92',
      fix: 'mandao skills add graphify (shows the installer and asks before running it)',
    },
  ]);
});

test('stays quiet when the tool is current, newer or missing', () => {
  expect(toolVersionFindings(catalog, ['graphify'], () => 'graphify 0.9.92')).toEqual([]);
  expect(toolVersionFindings(catalog, ['graphify'], () => 'graphify 1.0.0')).toEqual([]);
  expect(toolVersionFindings(catalog, ['graphify'], () => undefined)).toEqual([]);
});

test('warns when the harness is older than the recommended models need', async () => {
  const { harnessVersionFindings } = await import('../../src/engine/tools.js');
  const { recommendationsSchema } = await import('../../src/schemas/index.js');
  const recs = recommendationsSchema.parse({
    schema_version: 1,
    harnesses: {
      claude: {
        reviewed: '2026-10-20',
        sources: ['https://example.com'],
        harness_version: { min: '2.1.293', command: 'claude --version' },
        available: ['m'],
        routed: { leader: 'm', reviewer: 'm', reviewer_alt: 'm', implementer: { fast: 'm', standard: 'm', strong: 'm' }, tester: 'm' },
        simple: { implementer: 'm', reviewer: 'm' },
      },
    },
  });
  expect(harnessVersionFindings(recs, ['claude'], () => '2.1.250 (Claude Code)')[0]?.message).toBe(
    'claude 2.1.250 is older than 2.1.293, which the recommended models need',
  );
  expect(harnessVersionFindings(recs, ['claude'], () => '2.1.300 (Claude Code)')).toEqual([]);
  expect(harnessVersionFindings(recs, ['claude'], () => undefined)).toEqual([]);
});
