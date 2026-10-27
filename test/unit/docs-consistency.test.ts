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
 * Phase 19: what the front-page docs say exists, exists. Every `mandao …` command, subcommand and flag they show
 * is in the CLI, every `/mandao-…` command and flag is declared in core/commands, and every local link and
 * anchor resolves.
 */
const DOCS = ['README.md', 'docs/cli.md', 'docs/quality.md', 'docs/commands/README.md'];
const commands = resolve(loadLayers(process.cwd(), []).filter((l) => l.kind === 'core')).commands;
const PLANNED = new Set(['research']);
/** A long flag, also right after the bracket of an optional one (`[--depth`). */
const FLAG = /(?<=[\s[]|^)--[a-z][a-z-]*/g;

interface CliEntry {
  flags: Set<string>;
  subs: Set<string>;
}

/** Every CLI command path (`run cost`, `models set`…) with its long flags and its subcommands. */
function cliEntries(): Map<string, CliEntry> {
  const out = new Map<string, CliEntry>();
  const walk = (cmd: Command, prefix: string[]) => {
    for (const sub of cmd.commands) {
      const path = [...prefix, sub.name()];
      const flags = new Set(sub.options.map((o) => o.long).filter((l): l is string => Boolean(l)));
      out.set(path.join(' '), { flags, subs: new Set(sub.commands.map((c) => c.name())) });
      walk(sub, path);
    }
  };
  walk(buildProgram(), []);
  return out;
}

/** The snippets that show a command: inline code spans and fenced lines, comments dropped. */
function snippets(text: string): string[] {
  const fenced = [...text.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].flatMap((m) => m[1]!.split('\n'));
  const inline = [...text.replace(/```[\s\S]*?```/g, '').matchAll(/`([^`\n]+)`/g)].map((m) => m[1]!);
  return [...fenced, ...inline].map((s) => s.replace(/\s#\s.*$/, '').replace(/\\$/, ''));
}

/** GitHub's anchor for a heading: lower case, punctuation dropped, spaces as hyphens. */
const slug = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N} _-]/gu, '')
    .replace(/ /g, '-');

/** The anchors a Markdown file offers: its headings and explicit `<a id>` tags. */
const anchors = (text: string) =>
  new Set([
    ...[...text.replace(/```[\s\S]*?```/g, '').matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => slug(m[1]!.trim())),
    ...[...text.matchAll(/<a id="([^"]+)"/g)].map((m) => m[1]!),
  ]);

const cli = cliEntries();

describe('front-page docs match what exists (phase 19)', () => {
  test.each(DOCS)('%s: every `mandao` command, subcommand and flag shown is in the CLI', (doc) => {
    for (const s of snippets(readFileSync(doc, 'utf8'))) {
      for (const m of s.matchAll(/(?:^|[\s(])mandao(?:@beta)?\s+([a-z][a-z-]*(?:\s+[a-z][a-z-]*)*)([^&|;]*)/g)) {
        const words = m[1]!.split(/\s+/);
        const path = [3, 2, 1].map((n) => words.slice(0, n).join(' ')).find((p) => cli.has(p));
        expect(path, `${doc}: "${s}"`).toBeDefined();
        const { flags, subs } = cli.get(path!)!;
        // A word after a command that has subcommands must be one of them: `run nonexistent` fails (review F3).
        const next = words[path!.split(' ').length];
        if (next && subs.size) expect(subs.has(next), `${doc}: "mandao ${path} ${next}"`).toBe(true);
        for (const flag of `${m[1]} ${m[2]}`.match(FLAG) ?? []) expect(flags.has(flag), `${doc}: ${flag} in "${s}"`).toBe(true);
      }
    }
  });

  test.each(DOCS)('%s: every agent command and flag shown is declared', (doc) => {
    for (const s of snippets(readFileSync(doc, 'utf8'))) {
      for (const m of s.matchAll(/\/mandao-([a-z]+)([^`]*)/g)) {
        if (PLANNED.has(m[1]!)) continue;
        const c = commands.find((x) => x.meta.id === m[1]);
        expect(c, `${doc}: /mandao-${m[1]}`).toBeDefined();
        const flags = new Set(c!.meta.arguments.filter((a) => a.flag).map((a) => argumentSyntax(a).split(' ')[0]));
        for (const flag of m[2]!.match(FLAG) ?? []) expect(flags.has(flag), `${doc}: /mandao-${m[1]} ${flag}`).toBe(true);
      }
    }
  });

  test.each(DOCS)('%s: every local link and anchor resolves', (doc) => {
    const text = readFileSync(doc, 'utf8');
    for (const m of text.matchAll(/\]\(([^)#\s]*)(?:#([^)\s]*))?\)|srcset="([^"]+)"|src="([^"]+)"/g)) {
      const target = m[1] ?? m[3] ?? m[4] ?? '';
      if (/^[a-z]+:/.test(target)) continue;
      const file = target ? join(dirname(doc), target) : doc;
      expect(existsSync(file), `${doc} → ${target}`).toBe(true);
      // An anchor into a Markdown file must name a heading there (review F5).
      if (m[2] && file.endsWith('.md')) expect(anchors(readFileSync(file, 'utf8')).has(m[2]), `${doc} → ${target}#${m[2]}`).toBe(true);
    }
  });

  test('the docs generator, from the raw frontmatter, writes each usage and argument as the CLI schema does', () => {
    const raw = generator.rawCommands((p: string) => readFileSync(p, 'utf8'));
    for (const c of commands) {
      const meta = raw[c.meta.id]?.meta;
      if (!meta) continue;
      expect(generator.usageLine(c.meta.id, meta), c.meta.id).toBe(usageLine(c.meta.id, c.meta));
      (meta.arguments ?? []).forEach((a: object, i: number) => {
        expect(generator.argumentSyntax(a), `${c.meta.id} argument ${i}`).toBe(argumentSyntax(c.meta.arguments[i]!));
      });
    }
  });

  test('the README states no retired flow: no per-spec worktree by default, no terminal step to deliver', () => {
    const text = readFileSync('README.md', 'utf8');
    expect(text).not.toMatch(/every spec works in its own (git )?worktree/i);
    expect(text).not.toMatch(/then `mandao deliver`/i);
    expect(text).not.toContain('mandao start');
  });
});
