// mandao-scans: README.md docs/ core/commands/ — reads the front-page docs and every command by path.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Command } from 'commander';
import { describe, expect, test } from 'vitest';
// @ts-expect-error: a plain ES module of the docs generator, no types
import * as generator from '../../scripts/diagrams/docs.mjs';
import { buildProgram } from '../../src/cli/program.js';
import { loadLayers } from '../../src/resolver/layers.js';
import { resolve } from '../../src/resolver/resolve.js';
import { argumentSyntax, usageLine } from '../../src/schemas/index.js';

/**
 * Phase 19: what the front-page docs say exists, exists. Every `mandao …` command and flag they show is in the
 * CLI, every `/mandao-…` command and flag is declared in core/commands, and every local link resolves.
 */
const DOCS = ['README.md', 'docs/cli.md', 'docs/quality.md', 'docs/commands/README.md'];
const commands = resolve(loadLayers(process.cwd(), []).filter((l) => l.kind === 'core')).commands;
const PLANNED = new Set(['research']);

/** Every CLI command path (`run cost`, `models set`…) with its long flags. */
function cliFlags(): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  const walk = (cmd: Command, prefix: string[]) => {
    for (const sub of cmd.commands) {
      const path = [...prefix, sub.name()];
      out.set(path.join(' '), new Set(sub.options.map((o) => o.long).filter((l): l is string => Boolean(l))));
      walk(sub, path);
    }
  };
  walk(buildProgram(), []);
  return out;
}

/** The snippets that show a command: inline code spans and fenced lines. */
function snippets(text: string): string[] {
  const fenced = [...text.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].flatMap((m) => m[1]!.split('\n'));
  const inline = [...text.replace(/```[\s\S]*?```/g, '').matchAll(/`([^`\n]+)`/g)].map((m) => m[1]!);
  return [...fenced, ...inline].map((s) => s.replace(/\s#\s.*$/, '').replace(/\\$/, ''));
}

const cli = cliFlags();

describe('front-page docs match what exists (phase 19)', () => {
  test.each(DOCS)('%s: every `mandao` command and flag shown is in the CLI', (doc) => {
    for (const s of snippets(readFileSync(doc, 'utf8'))) {
      for (const m of s.matchAll(/(?:^|[\s(])mandao(?:@beta)?\s+([a-z][a-z-]*(?:\s+[a-z][a-z-]*)*)([^&|;]*)/g)) {
        const words = m[1]!.split(/\s+/);
        const path = [3, 2, 1].map((n) => words.slice(0, n).join(' ')).find((p) => cli.has(p));
        expect(path, `${doc}: "${s}"`).toBeDefined();
        for (const flag of `${m[1]} ${m[2]}`.match(/(?<=\s|^)--[a-z][a-z-]*/g) ?? [])
          expect(cli.get(path!)!.has(flag), `${doc}: ${flag} in "${s}"`).toBe(true);
      }
    }
  });

  test.each(DOCS)('%s: every agent command and flag shown is declared', (doc) => {
    for (const s of snippets(readFileSync(doc, 'utf8'))) {
      for (const m of s.matchAll(/\/mandao-([a-z]+)([^`]*)/g)) {
        const c = commands.find((x) => x.meta.id === m[1]);
        if (PLANNED.has(m[1]!)) continue;
        expect(c, `${doc}: /mandao-${m[1]}`).toBeDefined();
        const flags = new Set(c!.meta.arguments.filter((a) => a.flag).map((a) => argumentSyntax(a).split(' ')[0]));
        for (const flag of m[2]!.match(/(?<=\s|^)--[a-z][a-z-]*/g) ?? [])
          expect(flags.has(flag), `${doc}: /mandao-${m[1]} ${flag}`).toBe(true);
      }
    }
  });

  test.each(DOCS)('%s: every local link resolves', (doc) => {
    for (const m of readFileSync(doc, 'utf8').matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)|srcset="([^"]+)"|src="([^"]+)"/g)) {
      const target = m[1] ?? m[2] ?? m[3]!;
      if (/^[a-z]+:/.test(target)) continue;
      expect(existsSync(join(dirname(doc), target)), `${doc} → ${target}`).toBe(true);
    }
  });

  test('the docs generator writes each usage line exactly as the CLI schema does', () => {
    for (const c of commands) expect(generator.usageLine(c.meta.id, c.meta), c.meta.id).toBe(usageLine(c.meta.id, c.meta));
  });

  test('the README states no retired flow: no per-spec worktree by default, no terminal step to deliver', () => {
    const text = readFileSync('README.md', 'utf8');
    expect(text).not.toMatch(/every spec works in its own (git )?worktree/i);
    expect(text).not.toMatch(/then `mandao deliver`/i);
    expect(text).not.toContain('mandao start');
  });
});
