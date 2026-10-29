import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeEach, describe, expect, test } from 'vitest';
import { branchIdPattern, commitlintConfig } from '../../src/commits/commitlint.js';
import { configSchema } from '../../src/schemas/index.js';
import { makeTree } from '../helpers.js';

type Rule = (parsed: Record<string, unknown>) => [boolean, string];
let cfg: {
  parserPreset: { parserOpts: { headerPattern: RegExp; headerCorrespondence: string[] } };
  plugins: { rules: Record<string, Rule> }[];
};

/** Mimics the conventional-commits parser: header pattern + correspondence. */
function parse(message: string) {
  const [header = '', ...rest] = message.split('\n');
  const { headerPattern, headerCorrespondence } = cfg.parserPreset.parserOpts;
  const m = header.match(headerPattern);
  const parsed: Record<string, unknown> = {
    header,
    raw: message,
    notes: rest.some((l) => l.startsWith('BREAKING CHANGE')) ? [{ title: 'BREAKING CHANGE' }] : [],
  };
  headerCorrespondence.forEach((k, i) => {
    parsed[k] = m?.[i + 1] ?? null;
  });
  return parsed;
}
const check = (rule: string, message: string) => cfg.plugins[0]!.rules[rule]!(parse(message));

beforeEach(async () => {
  process.env.MANDAO_SPEC_ID = 'PROJ-123';
  const config = configSchema.parse({
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'a', path: '.', profile: 'app' }],
    harnesses: ['claude'],
  });
  const file = join(makeTree({}), 'commitlint.config.mjs');
  writeFileSync(file, commitlintConfig(config, '0.1.0'));
  cfg = (await import(pathToFileURL(file).href)).default;
});

describe('generated commitlint config', () => {
  test('accepts the documented example', () => {
    const msg = '✨ feat(api): add remember-me token endpoint\n\nRefs: PROJ-123\nMandao-Task: T2\nMandao-AC: AC-1, AC-3';
    expect(parse(msg)).toMatchObject({ emoji: '✨', type: 'feat', scope: 'api', subject: 'add remember-me token endpoint' });
    expect(check('mandao-emoji', msg)[0]).toBe(true);
  });

  test('accepts emoji with variation selectors', () => {
    expect(check('mandao-emoji', '♻️ refactor(web): extract cart totals')[0]).toBe(true);
  });

  test('rejects an emoji that does not match the type', () => {
    expect(check('mandao-emoji', '🐛 feat(api): add endpoint')).toEqual([false, '"feat" commits start with ✨']);
  });

  test('a breaking change requires 💥, via ! or footer', () => {
    expect(check('mandao-emoji', '✨ feat(api)!: drop v1 tokens')[0]).toBe(false);
    expect(check('mandao-emoji', '💥 feat(api)!: drop v1 tokens')[0]).toBe(true);
    expect(check('mandao-emoji', '💥 feat(api): drop v1 tokens\n\nBREAKING CHANGE: v1 removed')[0]).toBe(true);
  });

  test('rejects headers without an emoji prefix', () => {
    expect(check('mandao-emoji', 'feat(api): add endpoint')[0]).toBe(false);
  });

  test('requires the Refs trailer for the active spec id', () => {
    expect(check('mandao-refs', '✨ feat(api): add endpoint\n\nRefs: PROJ-123')[0]).toBe(true);
    expect(check('mandao-refs', '✨ feat(api): add endpoint\n\nRefs: PROJ-1234')).toEqual([
      false,
      'spec PROJ-123 is active: add the trailer "Refs: PROJ-123"',
    ]);
    expect(check('mandao-refs', '✨ feat(api): add endpoint')[0]).toBe(false);
  });

  test('length is counted without the emoji', () => {
    const subject = 'x'.repeat(72 - 'feat(api): '.length);
    expect(check('mandao-header-length', `✨ feat(api): ${subject}`)[0]).toBe(true);
    expect(check('mandao-header-length', `✨ feat(api): ${subject}y`)[0]).toBe(false);
  });
});

test('branchIdPattern extracts tracker and local ids', () => {
  const re = new RegExp(branchIdPattern('{type}/{id}-{slug}', 'MDO'));
  expect('feat/PROJ-123-remember-me'.match(re)?.[1]).toBe('PROJ-123');
  expect('fix/MDO-0007-typo'.match(re)?.[1]).toBe('MDO-0007');
  expect('main'.match(re)).toBeNull();
});

test('branchIdPattern reads the id through the default {prefix} template, with or without a tracker reference', () => {
  const re = new RegExp(branchIdPattern('{prefix}{id}-{ref}-{slug}', 'MDO', ['feature/', 'feat/', 'fix/', '']));
  expect('feature/MDO-0012-contract-wizard'.match(re)?.[1]).toBe('MDO-0012');
  expect('feat/MDO-0012-CU-86e3w5954-contract-wizard'.match(re)?.[1]).toBe('MDO-0012');
  expect('MDO-0012-VZ-12-wizard'.match(re)?.[1]).toBe('MDO-0012');
  expect('main'.match(re)).toBeNull();
  // Not a spec branch: an uppercase word with a number in the slug is no id (review F12).
  expect('fix/handle-HTTP-500-errors'.match(re)).toBeNull();
  expect('docs/bump-README-2-links'.match(re)).toBeNull();
  const custom = new RegExp(branchIdPattern('{prefix}{id}-{slug}', 'MDO', ['users/jd/feature/', 'feature-']));
  expect('users/jd/feature/MDO-0004-x'.match(custom)?.[1]).toBe('MDO-0004');
  expect('feature-MDO-0005-x'.match(custom)?.[1]).toBe('MDO-0005');
  expect('jd/feat-ABC-1-x'.match(custom)).toBeNull();
});

describe('generated commitlint config with commits.emoji false', () => {
  test('parses a plain header and does not require the emoji rule', async () => {
    const config = configSchema.parse({
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'a', path: '.', profile: 'app' }],
      harnesses: ['claude'],
      commits: { emoji: false },
    });
    const file = join(makeTree({}), 'commitlint.config.mjs');
    writeFileSync(file, commitlintConfig(config, '0.1.0'));
    const plain = (await import(pathToFileURL(file).href)).default as typeof cfg & { rules: Record<string, unknown> };
    expect(plain.rules).not.toHaveProperty('mandao-emoji');
    expect(plain.rules['type-enum']).toEqual([
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'build', 'ci', 'revert'],
    ]);
    const m = 'feat(api)!: add endpoint'.match(plain.parserPreset.parserOpts.headerPattern);
    expect(plain.parserPreset.parserOpts.headerCorrespondence).toEqual(['type', 'scope', 'breaking', 'subject']);
    expect(m?.slice(1)).toEqual(['feat', 'api', '!', 'add endpoint']);
    expect('✨ feat(api): x'.match(plain.parserPreset.parserOpts.headerPattern)).toBeNull();
    const rule = plain.plugins[0]!.rules['mandao-header-length']!;
    expect(rule({ header: `feat: ${'x'.repeat(70)}` })[0]).toBe(false);
    expect(rule({ header: 'feat: short' })[0]).toBe(true);
  });
});
