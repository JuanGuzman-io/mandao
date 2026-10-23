// mandao-scans: core/commands core/personas — reads every command and persona frontmatter for its scripts list.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { parseFrontmatter } from '../../src/engine/frontmatter.js';

const runCommands = () =>
  new Set(
    buildProgram()
      .commands.find((c) => c.name() === 'run')!
      .commands.map((c) => c.name()),
  );

describe('{{script:x}} ids', () => {
  test('every scripts id in core frontmatter is a `mandao run` subcommand', () => {
    const names = runCommands();
    const missing: string[] = [];
    for (const dir of ['commands', 'personas']) {
      const abs = join(process.cwd(), 'core', dir);
      for (const file of readdirSync(abs).filter((f) => f.endsWith('.md'))) {
        const scripts = (parseFrontmatter(readFileSync(join(abs, file), 'utf8')).data.scripts ?? []) as string[];
        for (const id of scripts) if (!names.has(id)) missing.push(`${dir}/${file}: ${id}`);
      }
    }
    expect(missing).toEqual([]);
  });

  test('the intake scripts are registered (phase 14)', () => {
    const names = runCommands();
    for (const id of ['intake-extract', 'intake-check', 'intake-open', 'intake-story']) expect(names.has(id)).toBe(true);
  });
});
