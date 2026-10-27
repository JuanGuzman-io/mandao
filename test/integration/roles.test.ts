// mandao-scans: none — walks only the temporary project it creates.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { runInit } from '../../src/cli/init.js';
import { parseRoles } from '../../src/cli/init-roles.js';
import { initTestRepo, makeTree, pkg, stubTerminal } from '../helpers.js';

/** Phase 18: a solo maintainer is one role (PE); generated commands and templates say it, not PO or tech lead. */
let restoreTerminal: () => void;
beforeEach(() => {
  restoreTerminal = stubTerminal();
  process.env.MANDAO_HOME = makeTree({});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  restoreTerminal();
  vi.restoreAllMocks();
});

vi.mock('@clack/prompts', () => {
  const noop = () => {};
  return {
    intro: noop,
    outro: noop,
    cancel: noop,
    isCancel: () => false,
    note: noop,
    log: { info: noop, warn: noop, message: noop, step: noop, success: noop, error: noop },
    spinner: () => ({ start: noop, stop: noop, message: noop }),
    confirm: async () => false,
    text: async () => '',
    select: async (o: { initialValue?: unknown; options: { value: unknown }[] }) => o.initialValue ?? o.options[0]?.value,
    multiselect: async () => [],
  };
});
vi.mock('../../src/cli/init-archify.js', () => ({ offerArchify: async () => {} }));

/** Every generated text file of the project, by path. */
function generated(root: string, rel = ''): [string, string][] {
  return readdirSync(join(root, rel), { withFileTypes: true }).flatMap((e): [string, string][] => {
    const r = join(rel, e.name);
    if (e.name === '.git') return [];
    return e.isDirectory() ? generated(root, r) : [[r, readFileSync(join(root, r), 'utf8')]];
  });
}

const init = (root: string, roles: string) =>
  runInit(root, {
    yes: true,
    scope: 'project',
    harness: ['claude', 'codex'],
    defaultProfile: 'app',
    languageBusiness: 'en',
    languageTechnical: 'en',
    budget: 'none',
    modelsMode: 'simple',
    modelProfile: 'peak',
    roles,
  });

test('init --roles solo writes PE in every role and no generated file names a PO, tech lead or dev as a decider', async () => {
  const root = makeTree({ 'package.json': pkg('shop') });
  initTestRepo(root);
  await init(root, 'solo');
  expect(parseYaml(readFileSync(join(root, '.mandao/config.yml'), 'utf8')).roles).toEqual({ po: 'PE', tech_lead: 'PE', dev: 'PE' });
  const files = generated(root).filter(([p]) => /\.(md|toml)$/.test(p));
  const offenders = files.flatMap(([p, text]) =>
    text
      .split('\n')
      .filter((l) => /\bPO\b|tech lead|→ dev\b|the dev\b/.test(l.replaceAll('For the PO', '')))
      .map((l) => `${p}: ${l.trim()}`),
  );
  expect(offenders).toEqual([]);
  expect(readFileSync(join(root, '.mandao/templates/app/constitution/product.md'), 'utf8')).toMatch(/^owner: PE$/m);
  expect(readFileSync(join(root, '.mandao/templates/app/constitution/architecture.md'), 'utf8')).toMatch(/^owner: PE$/m);
});

test('a team keeps the defaults, and --roles takes named roles', async () => {
  const root = makeTree({ 'package.json': pkg('shop') });
  initTestRepo(root);
  await init(root, 'team');
  expect(parseYaml(readFileSync(join(root, '.mandao/config.yml'), 'utf8')).roles).toBeUndefined();
  expect(readFileSync(join(root, '.mandao/templates/app/constitution/architecture.md'), 'utf8')).toMatch(/^owner: tech lead$/m);
  expect(parseRoles('solo=Owner')).toEqual({ po: 'Owner', tech_lead: 'Owner', dev: 'Owner' });
  expect(parseRoles('po=Ana, tech_lead=Luis')).toEqual({ po: 'Ana', tech_lead: 'Luis' });
  expect(() => parseRoles('cto=Ana')).toThrow(/--roles must be/);
});

test("a role name that would break the templates' YAML frontmatter is refused (review F7)", async () => {
  const { configSchema } = await import('../../src/schemas/index.js');
  const base = { schema_version: 1, workspace: 'single', projects: [{ name: 'p', path: '.' }], harnesses: ['claude'] };
  expect(configSchema.parse({ ...base, roles: { po: 'Product Engineer (PE)' } }).roles.po).toBe('Product Engineer (PE)');
  for (const bad of ['PE: Juan', '#lead', '*x', 'a\nb'])
    expect(configSchema.safeParse({ ...base, roles: { po: bad } }).success).toBe(false);
});
