import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { archifyScript } from '../../src/engine/archify.js';
import { configSchema } from '../../src/schemas/index.js';
import { makeTree } from '../helpers.js';

describe('Archify selection', () => {
  test('finds the same skill entry point across project harness folders', () => {
    const root = makeTree({});
    const home = makeTree({});
    const script = join(root, '.agents/skills/archify/bin/archify.mjs');
    mkdirSync(join(root, '.agents/skills/archify/bin'), { recursive: true });
    writeFileSync(script, '');
    expect(archifyScript(root, home)).toBe(script);
  });

  test.each([
    '.claude/skills',
    '.agents/skills',
    '.github/skills',
    '.copilot/skills',
    '.config/opencode/skills',
    '.gemini/antigravity/skills',
  ])('discovers Archify in %s', (folder) => {
    const root = makeTree({});
    const home = makeTree({});
    const script = join(root, folder, 'archify/bin/archify.mjs');
    mkdirSync(join(root, folder, 'archify/bin'), { recursive: true });
    writeFileSync(script, '');
    expect(archifyScript(root, home)).toBe(script);
  });

  test('finds a user-level install when the project has no copy', () => {
    const root = makeTree({});
    const home = makeTree({});
    const script = join(home, '.claude/skills/archify/bin/archify.mjs');
    mkdirSync(join(home, '.claude/skills/archify/bin'), { recursive: true });
    writeFileSync(script, '');
    expect(archifyScript(root, home)).toBe(script);
  });

  test('defaults diagrams to Archify and accepts explicit Mermaid', () => {
    const base = { schema_version: 1, workspace: 'single', projects: [{ name: 'app', path: '.' }], harnesses: ['claude'] };
    expect(configSchema.parse(base).diagrams.engine).toBe('archify');
    expect(configSchema.parse({ ...base, diagrams: { engine: 'mermaid' } }).diagrams.engine).toBe('mermaid');
  });
});
