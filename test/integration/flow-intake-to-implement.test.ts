// mandao-scans: none — lists only the temporary trees it creates.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

/**
 * Phase 16 "done when": from an intake to the first implement with no git command outside Mandao, in place and
 * in a worktree. The agent's writing (the proposal, the story and spec documents) is played by fixtures; every
 * step that touches git or the flow is a Mandao command.
 */
const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const PROPOSAL = 'docs/product/intake/req-2026-10-26.md';
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
let out: string[];
const cwd = process.cwd();

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});
afterEach(() => {
  process.chdir(cwd);
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

function repo() {
  const root = realpathSync(
    makeTree({
      'package.json': pkg('shop'),
      '.gitignore': '.worktrees/\n.mandao/cache/\n',
      'docs/req.md': '# Access\n\nUsers sign in with email.\n\n## Sessions\n\nA session lasts 8 hours.\n',
      'docs/constitution/product.md': '# Product\n',
    }),
  );
  initTestRepo(root, '-q', '-b', 'main');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude'],
    paths: { worktrees: '.worktrees' },
  });
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}

const proposal = (sha: string) => `---
schema_version: 1
source: { path: "docs/req.md", sha256: "${sha}", extractor: markdown }
doc: req
date: 2026-10-26
status: proposed
---

# Intake: req

## Stories

### I-1 — Sign in
- refs: [§ Access]
- depends_on: []
- group: G-1
#### AC-1 — Signs in
- GIVEN a user / WHEN they sign in / THEN they are in

### I-2 — Session length
- refs: [§ Access > Sessions]
- depends_on: [I-1]
- group: G-1
#### AC-1 — Lasts 8 hours
- GIVEN a session / WHEN 8 hours pass / THEN it ends

## Open and conflicts

| ID | Type | Question or contradiction | Ref | Status |
|---|---|---|---|---|
| Q-1 | OPEN | Which provider? | § Access | open |

## Coverage

| Section | Ref | Covered by | Status |
|---|---|---|---|
| S1 | § Access | I-1 | covered |
| S2 | § Access > Sessions | I-2 | covered |
`;

const run = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
  return JSON.parse(out.at(-1)!);
};

describe('intake → story → specify → implement, no git outside Mandao (phase 16)', () => {
  test.each([false, true])('worktree: %s', async (worktree) => {
    const root = repo();
    // Intake: no spec yet, so its log is the workspace's.
    await run(root, 'event', 'workspace', 'command_start', '--command', 'story');
    const extracted = await run(root, 'intake-extract', 'docs/req.md');
    mkdirSync(join(root, 'docs/product/intake'), { recursive: true });
    writeFileSync(join(root, PROPOSAL), proposal(extracted.source.sha256));
    expect(await run(root, 'intake-check', PROPOSAL)).toMatchObject({ ok: true });
    await run(root, 'intake-answer', PROPOSAL, 'Q-1', '--answer', 'Auth0');
    expect((await run(root, 'intake-story', PROPOSAL, 'I-1')).group.stories.map((s: { id: string }) => s.id)).toEqual(['I-2']);

    // story --intake opens the spec: branch, request record, the uncommitted proposal carried.
    const opened = await run(
      root,
      'spec-new',
      'skills list',
      '--id',
      'MDO-0001',
      '--create',
      '--no-baseline',
      '--no-install',
      ...(worktree ? ['--worktree'] : []),
    );
    expect(opened).toMatchObject({ mode: worktree ? 'worktree' : 'in-place', ok: true });
    const dir: string = opened.dir;
    expect(git(dir, 'branch', '--show-current')).toBe(opened.branch);
    expect(readFileSync(join(dir, PROPOSAL), 'utf8')).toContain('resolved: Auth0');
    if (worktree) expect(existsSync(join(root, PROPOSAL))).toBe(false);

    // The agent writes the story and the spec documents (played by the fixture), then records the opening.
    cpSync(fixture, join(dir, 'specs/MDO-0001-skills-list'), { recursive: true });
    await run(dir, 'intake-open', PROPOSAL, 'I-1', '--as', 'MDO-0001');
    expect(readFileSync(join(dir, PROPOSAL), 'utf8').match(/- opened: MDO-0001/g)).toHaveLength(2);

    // Every later command finds the session on the spec's branch and names the next step complete.
    process.chdir(dir);
    expect(await run(dir, 'where', 'MDO-0001')).toMatchObject({ ready: true, mode: worktree ? 'worktree' : 'in-place' });
    expect(await run(dir, 'next', 'MDO-0001')).toMatchObject({
      recommended: { command: '/mandao-implement', invocation: '/mandao-implement MDO-0001' },
      autoContinue: true,
    });
    expect(existsSync(join(root, '.mandao/log/_log/execution.md'))).toBe(true);
    expect(existsSync(join(root, 'specs/quick'))).toBe(false);
  });
});
