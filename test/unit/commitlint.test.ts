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
