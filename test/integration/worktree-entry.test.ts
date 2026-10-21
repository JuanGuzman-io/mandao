// mandao-scans: none — lists only the temporary workspace it syncs into.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'tsup';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { makeTree, removeTrees } from '../helpers.js';

// MDO-0010 S-2.1 and S-2.2 end to end: `mandao sync` run as a process, all five harnesses.
const root = fileURLToPath(new URL('../..', import.meta.url));
const cache = join(root, 'node_modules', '.cache');
let outDir = '';
let ws = '';

const HARNESSES = ['claude', 'codex', 'opencode', 'copilot', 'antigravity'] as const;
/** The path prefix each harness writes its commands under. */
const DIRS: Record<(typeof HARNESSES)[number], string> = {
  claude: '.claude/skills',
  codex: '.agents/skills',
  opencode: '.opencode/commands',
  copilot: '.github/prompts',
  antigravity: '.agents/skills',
};

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
}

beforeAll(async () => {
  mkdirSync(cache, { recursive: true });
  outDir = join(cache, `mandao-entry-${process.pid}`);
  await build({
    entry: { cli: join(root, 'src/cli/index.ts') },
    format: ['esm'],
    target: 'node22',
    platform: 'node',
    outDir,
    config: false,
    silent: true,
  });
  ws = makeTree({
    '.mandao/config.yml': `schema_version: 1\nworkspace: single\nprojects:\n  - name: a\n    path: .\nharnesses: [${HARNESSES.join(', ')}]\n`,
  });
  const r = spawnSync(process.execPath, [join(outDir, 'cli.js'), 'sync'], {
    cwd: ws,
    encoding: 'utf8',
    timeout: 60_000,
    env: { ...process.env, MANDAO_HOME: makeTree({}) },
  });
  expect(r.status, r.stderr).toBe(0);
}, 90_000);

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
  removeTrees();
});

const commandFiles = (h: (typeof HARNESSES)[number], id: string) =>
  walk(ws).filter((f) => f.includes(`/${DIRS[h]}/`) && new RegExp(`mandao-${id}(/SKILL\\.md|\\.md|\\.prompt\\.md)$`).test(f));

describe('S-2.1: EnterWorktree only in the Claude Code files', () => {
  test.each(['specify', 'quick', 'implement'])('mandao-%s: EnterWorktree appears in the claude file and in no other harness file', (id) => {
    const claude = commandFiles('claude', id);
    expect(claude.length).toBe(1);
    expect(readFileSync(claude[0]!, 'utf8')).toMatch(/EnterWorktree/);
    for (const h of HARNESSES.filter((x) => x !== 'claude')) {
      const files = commandFiles(h, id);
      expect(files.length, `${h}: mandao-${id}`).toBeGreaterThan(0);
      for (const f of files) expect(readFileSync(f, 'utf8'), f).not.toMatch(/EnterWorktree/);
    }
  });
});

/** A resume command copied into a text: the adapters own those (D2), the texts only point at the `resume` field. */
const COPIED = /(claude|codex) ["']\/?\$?mandao-|then run \/mandao-|open (opencode|antigravity) there/;

describe('S-2.2: the other harnesses print the resume field of the script output', () => {
  test.each(['specify', 'quick', 'implement'])('mandao-%s: every non-claude file prints the resume field and copies no command', (id) => {
    for (const h of HARNESSES.filter((x) => x !== 'claude')) {
      for (const f of commandFiles(h, id)) {
        expect(readFileSync(f, 'utf8'), f).toMatch(/`resume`/);
        expect(readFileSync(f, 'utf8'), f).not.toMatch(COPIED);
      }
    }
  });
});
