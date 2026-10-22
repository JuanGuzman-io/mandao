import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'tsup';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { makeTree, makeTreeAt } from '../helpers.js';

// MDO-0010 P1: `mandao hook graph-guard` resolves its project from its working directory, so after
// EnterWorktree it reads the worktree, not the main checkout. Real entry point, run as a process.
const root = fileURLToPath(new URL('../..', import.meta.url));
const cache = join(root, 'node_modules', '.cache');
let outDir = '';
let main = '';
let worktree = '';

beforeEach(async () => {
  outDir = makeTreeAt(cache, 'mandao-hook-', {});
  main = realpathSync(makeTree({ '.mandao/config.yml': 'schema_version: 1\n' }));
  worktree = realpathSync(
    makeTree({ '.claude/agents/mandao-reviewer.md': readOnlyRole, '.claude/agents/mandao-implementer-standard.md': shellRole }),
  );
  await build({
    entry: { cli: join(root, 'src/cli/index.ts') },
    format: ['esm'],
    target: 'node22',
    platform: 'node',
    outDir,
    config: false,
    silent: true,
  });
}, 20_000);

afterEach(() => {
  outDir = '';
});

const readOnlyRole = '---\nname: mandao-reviewer\ntools: Read, Grep, Glob\n---\n';
const shellRole = '---\nname: mandao-implementer-standard\ntools: Read, Edit, Bash\n---\n';

/** A fake graphify that records that it ran, so the test sees whether the guard handed over to it. */
function fakeGraphify() {
  const dir = makeTree({ graphify: '#!/bin/sh\npwd > "$MARK"\n' });
  chmodSync(join(dir, 'graphify'), 0o755);
  return dir;
}

function guard(cwd: string, agent: string) {
  const mark = join(makeTree({}), 'ran');
  const r = spawnSync(process.execPath, [join(outDir, 'cli.js'), 'hook', 'graph-guard', 'pre'], {
    cwd,
    input: JSON.stringify({ agent_type: agent }),
    encoding: 'utf8',
    timeout: 20_000,
    env: { ...process.env, MANDAO_HOME: makeTree({}), MARK: mark, PATH: `${fakeGraphify()}:${process.env.PATH}` },
  });
  return { status: r.status, ran: existsSync(mark) };
}

describe('P1: graph-guard reads the worktree it runs in', () => {
  // The main checkout holds no agent files; only the worktree does. A guard that read the main
  // checkout would not know the role and would keep the guard on.
  test('with a worktree as cwd, a read-only role defined only there skips the guard', () => {
    const r = guard(worktree, 'mandao-reviewer');
    expect(r.status).toBe(0);
    expect(r.ran).toBe(false);
  });

  test('with the main checkout as cwd the same role is unknown and keeps the guard', () => {
    expect(main).not.toBe(worktree);
    expect(guard(main, 'mandao-reviewer').ran).toBe(true);
  });

  test('a shell role in the worktree keeps the guard', () => {
    expect(guard(worktree, 'mandao-implementer-standard').ran).toBe(true);
  });
});
