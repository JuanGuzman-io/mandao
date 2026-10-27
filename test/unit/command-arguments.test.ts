// mandao-scans: core/commands/ — reads every shipped command's frontmatter by path.
import { describe, expect, test } from 'vitest';
import { renderBody, type TokenSyntax } from '../../src/render/render.js';
import { loadLayers } from '../../src/resolver/layers.js';
import { resolve } from '../../src/resolver/resolve.js';
import { argumentSyntax, commandFrontmatterSchema, configSchema, usageLine } from '../../src/schemas/index.js';

/** Phase 19: one syntax for every argument, the way the user types it, everywhere it is shown. */
const config = configSchema.parse({ schema_version: 1, workspace: 'single', projects: [{ name: 'a', path: '.' }], harnesses: ['claude'] });
const commands = resolve(loadLayers(process.cwd(), []).filter((l) => l.kind === 'core')).commands;
const usage = (id: string) => {
  const c = commands.find((x) => x.meta.id === id)!;
  return usageLine(id, c.meta);
};

describe('command arguments (phase 19)', () => {
  test('a flag is typed as --kebab-case, with its value; a positional one as <name> or its values', () => {
    const arg = (o: object) => commandFrontmatterSchema.shape.arguments.parse([{ name: 'x', description: 'd', ...o }])[0]!;
    expect(argumentSyntax(arg({ name: 'depth', flag: true, value: 'lite|standard|full' }))).toBe('--depth <lite|standard|full>');
    expect(argumentSyntax(arg({ name: 'withScripts', flag: true }))).toBe('--with-scripts');
    expect(argumentSyntax(arg({ name: 'spec' }))).toBe('<spec>');
    expect(argumentSyntax(arg({ name: 'mode', value: 'auto|new' }))).toBe('<auto|new>');
  });

  test('the shipped commands show the flags every hand-over uses', () => {
    expect(usage('specify')).toBe('/mandao-specify [ref] [--depth <lite|standard|full>] [--hotfix]');
    expect(usage('story')).toBe('/mandao-story [ref] [--from <file>] [--intake <proposal#I-n>]');
    expect(usage('implement')).toBe('/mandao-implement <spec> [task]');
    expect(usage('constitution')).toBe('/mandao-constitution [auto|new|legacy|active] [--product]');
  });

  test('every stable command with arguments has an example that uses only its declared flags', () => {
    for (const c of commands.filter((x) => x.meta.status === 'stable' && x.meta.arguments.length)) {
      expect(c.meta.examples.length, c.meta.id).toBeGreaterThan(0);
      const flags = new Set(c.meta.arguments.filter((a) => a.flag).map((a) => argumentSyntax(a).split(' ')[0]));
      for (const e of c.meta.examples) {
        expect(e.run.startsWith(`/mandao-${c.meta.id}`), e.run).toBe(true);
        for (const used of e.run.match(/(?<=\s)--[a-z-]+/g) ?? []) expect(flags.has(used), `${c.meta.id}: ${used}`).toBe(true);
      }
    }
  });

  test('a flag has no position, so {{arg:x}} on it is refused', () => {
    const meta = commandFrontmatterSchema.parse({
      schema_version: 1,
      id: 'x',
      title: 'X',
      description: 'x',
      status: 'stable',
      arguments: [{ name: 'depth', description: 'd', flag: true }],
      inputs: [],
      outputs: [],
      capabilities: ['read'],
    });
    const syntax: TokenSyntax = { args: () => '', arg: (_m, n) => n, command: (id) => id };
    const ctx = {
      harness: 'claude',
      profiles: new Set(['app'] as const),
      multiProject: false,
      mode: 'single' as const,
      paths: config.paths,
      version: '0',
      language: config.language,
      roles: config.roles,
    };
    expect(() => renderBody(meta, '{{arg:depth}}', ctx, syntax)).toThrow(/is a flag/);
  });
});
