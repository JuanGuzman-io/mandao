import { describe, expect, test } from 'vitest';
import { commitlintFindings } from '../../src/engine/doctor-commitlint.js';
import { configSchema } from '../../src/schemas/index.js';
import { makeTree } from '../helpers.js';

const base = { schema_version: 1, workspace: 'single', projects: [{ name: 'a', path: '.' }], harnesses: ['claude'] } as const;
const withEmoji = configSchema.parse(base);
const plain = configSchema.parse({ ...base, commits: { emoji: false } });

describe('project-owned commitlint config (ADR 0055)', () => {
  test('no project config: nothing reported', () => {
    expect(commitlintFindings(makeTree({}), withEmoji)).toEqual([]);
  });

  test("Mandao's own generated config alone is ignored", () => {
    expect(commitlintFindings(makeTree({ '.mandao/commitlint.config.mjs': 'export default {}' }), withEmoji)).toEqual([]);
  });

  test('extending config-conventional while emoji is on warns and suggests commits.emoji: false', () => {
    const root = makeTree({ 'commitlint.config.js': "module.exports = { extends: ['@commitlint/config-conventional'] };" });
    const [f, ...rest] = commitlintFindings(root, withEmoji);
    expect(rest).toEqual([]);
    expect(f).toMatchObject({
      level: 'warn',
      message: expect.stringContaining('commitlint.config.js'),
      fix: expect.stringContaining('commits.emoji: false'),
    });
  });

  test.each([
    ['commitlint.config.cjs', "module.exports = { extends: ['@commitlint/config-conventional'] };"],
    ['commitlint.config.mjs', "export default { extends: ['@commitlint/config-conventional'] };"],
    ['commitlint.config.ts', "export default { extends: ['@commitlint/config-conventional'] };"],
    ['.commitlintrc', '{ "extends": ["@commitlint/config-conventional"] }'],
    ['.commitlintrc.json', '{ "extends": ["@commitlint/config-conventional"] }'],
    ['.commitlintrc.yml', 'extends:\n  - "@commitlint/config-conventional"\n'],
    ['package.json', '{ "name": "x", "commitlint": { "extends": ["@commitlint/config-conventional"] } }'],
  ])('detects %s', (file, body) => {
    const [f] = commitlintFindings(makeTree({ [file]: body }), withEmoji);
    expect(f).toMatchObject({ level: 'warn', message: expect.stringContaining(file) });
  });

  test.each([
    ['commitlint.config.cts', "export default { extends: ['@commitlint/config-conventional'] };"],
    ['.commitlintrc.cts', "export default { extends: ['@commitlint/config-conventional'] };"],
    ['.config/commitlintrc', '{ "extends": ["@commitlint/config-conventional"] }'],
    ['.config/commitlintrc.json', '{ "extends": ["@commitlint/config-conventional"] }'],
    ['.config/commitlintrc.yml', 'extends:\n  - "@commitlint/config-conventional"\n'],
    ['.config/commitlintrc.ts', "export default { extends: ['@commitlint/config-conventional'] };"],
  ])('detects %s (widened locations)', (file, body) => {
    expect(commitlintFindings(makeTree({ [file]: body }), withEmoji)[0]).toMatchObject({
      level: 'warn',
      message: expect.stringContaining(file),
    });
  });

  test.each(['@commitlint/config-angular', '@commitlint/config-conventional'])(
    'extends %s rejects the emoji prefix (commitlint resolves no shorthand to these official packages)',
    (name) => {
      const root = makeTree({ 'commitlint.config.js': `module.exports = { extends: ['${name}'] };` });
      expect(commitlintFindings(root, withEmoji)[0]).toMatchObject({ level: 'warn', fix: expect.stringContaining('commits.emoji: false') });
    },
  );

  test('an unrelated extends is not mistaken for conventional', () => {
    const root = makeTree({
      'commitlint.config.js':
        "module.exports = { extends: ['@acme/commitlint-config-conventional-ish', '@commitlint/config-angular-type-enum'] };",
    });
    expect(commitlintFindings(root, withEmoji)).toEqual([]);
  });

  test('custom rules in a YAML block, and JS shorthand `rules,`', () => {
    const yaml = makeTree({ '.commitlintrc.yml': 'rules:\n  subject-case:\n    - 2\n    - always\n    - lower-case\n' });
    expect(commitlintFindings(yaml, withEmoji)[0]).toMatchObject({ level: 'info' });
    const js = makeTree({
      'commitlint.config.js': "const rules = { 'subject-case': [2, 'always', 'lower-case'] };\nmodule.exports = { rules, };",
    });
    expect(commitlintFindings(js, withEmoji)[0]).toMatchObject({ level: 'info' });
    const js2 = makeTree({ 'commitlint.config.js': 'const rules = {};\nexport default { rules }' });
    expect(commitlintFindings(js2, withEmoji)[0]).toMatchObject({ level: 'info' });
  });

  test('a polyrepo checks each project repository root too', () => {
    const root = makeTree({
      'api/commitlint.config.js': "module.exports = { extends: ['@commitlint/config-conventional'] };",
      'web/package.json': '{ "commitlint": { "rules": { "x": [2, "always"] } } }',
      'docs/': '',
    });
    const config = configSchema.parse({
      schema_version: 1,
      workspace: 'polyrepo',
      home: 'workspace',
      projects: [
        { name: 'api', path: 'api', repo: 'git@github.com:acme/api.git' },
        { name: 'web', path: 'web', repo: 'git@github.com:acme/web.git' },
        { name: 'docs', path: 'docs', repo: 'local' },
      ],
      harnesses: ['claude'],
    });
    const found = commitlintFindings(root, config);
    expect(found.map((f) => f.level)).toEqual(['warn', 'info']);
    expect(found[0]!.message).toContain('api/commitlint.config.js');
    expect(found[1]!.message).toContain('web/package.json');
  });

  test('a package.json without a commitlint key is not a config', () => {
    expect(commitlintFindings(makeTree({ 'package.json': '{ "name": "x" }' }), withEmoji)).toEqual([]);
  });

  test('with commits.emoji: false, config-conventional is compatible: no warning', () => {
    const root = makeTree({ 'commitlint.config.js': "module.exports = { extends: ['@commitlint/config-conventional'] };" });
    expect(commitlintFindings(root, plain)).toEqual([]);
  });

  test('a config that just extends Mandao is fine', () => {
    const root = makeTree({ 'commitlint.config.mjs': "export default { extends: ['./.mandao/commitlint.config.mjs'] };" });
    expect(commitlintFindings(root, withEmoji)).toEqual([]);
  });

  test('custom rules that do not extend Mandao: info suggesting to extend it', () => {
    const root = makeTree({ 'commitlint.config.js': "module.exports = { rules: { 'subject-case': [2, 'always', 'lower-case'] } };" });
    const [f, ...rest] = commitlintFindings(root, withEmoji);
    expect(rest).toEqual([]);
    expect(f).toMatchObject({ level: 'info', fix: expect.stringContaining('./.mandao/commitlint.config.mjs') });
  });

  test('a config with no rules and no extends is not reported', () => {
    expect(commitlintFindings(makeTree({ 'commitlint.config.js': 'module.exports = {};' }), withEmoji)).toEqual([]);
  });

  test('never edits the config', async () => {
    const body = "module.exports = { extends: ['@commitlint/config-conventional'] };";
    const root = makeTree({ 'commitlint.config.js': body });
    commitlintFindings(root, withEmoji);
    const { readFileSync } = await import('node:fs');
    expect(readFileSync(`${root}/commitlint.config.js`, 'utf8')).toBe(body);
  });
});
