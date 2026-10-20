import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { logPath } from '../../src/scripts/spec-log.js';
import { parseApprovals, withStatus } from '../../src/spec/index.js';
import { makeTree, pkg } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
  for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

/** The fixture with its documents back in draft, committed on the spec branch. */
function repo() {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
  git(root, 'init', '-q', '-b', 'feat/MDO-0001-skills-list');
  git(root, 'config', 'user.name', 'Ana PO');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude'],
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  for (const f of ['story.md', 'requirements.md', 'tasks.md']) {
    const file = join(root, SPEC, f);
    writeFileSync(file, withStatus(readFileSync(file, 'utf8'), 'draft'));
  }
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}
const approve = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'approve', ...args]);
  return JSON.parse(out.at(-1)!);
};
const status = (root: string, f: string) => /^status:\s*(\S+)/m.exec(readFileSync(join(root, SPEC, f), 'utf8'))?.[1];

describe('mandao approve: no model session', () => {
  test('design: statuses approved, who and when recorded, the specify commit made with its fixed subject', async () => {
    const root = repo();
    const r = await approve(root, 'MDO-0001', 'design');
    expect(r).toMatchObject({ approved: true, step: 'design', by: 'Ana PO', commit: { committed: true }, next: '/mandao-tasks' });
    expect(r.newSession).toBeUndefined();
    expect(status(root, 'story.md')).toBe('approved');
    expect(status(root, 'requirements.md')).toBe('approved');
    expect(git(root, 'log', '-1', '--format=%s')).toBe('📝 docs(mandao): approve the MDO-0001 requirements and design');
    const log = parseApprovals(readFileSync(logPath(join(root, SPEC), 'approvals.yml'), 'utf8'));
    expect(log).toEqual([expect.objectContaining({ step: 'design', by: 'Ana PO', at: expect.any(String) })]);
  });

  test('a lite spec is approved under its own subject (MDO-0007)', async () => {
    const root = repo();
    expect(await approve(root, 'MDO-0001', 'spec')).toMatchObject({
      approved: true,
      commit: { committed: true },
      next: '/mandao-implement',
      // ADR 0038: implement starts in a new session from the worktree, not in the specify one.
      newSession: `cd ${JSON.stringify(root)} && claude "/mandao-implement MDO-0001"`,
    });
    expect(git(root, 'log', '-1', '--format=%s')).toBe('📝 docs(mandao): approve the MDO-0001 spec');
  });

  test('a critical OPEN blocks the approval: nothing changes', async () => {
    const root = repo();
    const file = join(root, SPEC, 'requirements.md');
    writeFileSync(file, `${readFileSync(file, 'utf8')}\n- OPEN(critical, PO): who approves refunds?\n`);
    const r = await approve(root, 'MDO-0001', 'design');
    expect(r).toMatchObject({ approved: false, problems: ['critical OPEN: who approves refunds?'] });
    expect(process.exitCode).toBe(1);
    expect(status(root, 'requirements.md')).toBe('draft');
  });

  test('close records the approved items for the close session to apply, and changes no status', async () => {
    const root = repo();
    const r = await approve(root, 'MDO-0001', 'close', '--items', '1', '3a', '--by', 'Lead');
    expect(r).toMatchObject({ approved: true, step: 'close', by: 'Lead', items: ['1', '3a'], statusChanged: [] });
    expect(r.commit).toBeUndefined();
    expect(status(root, 'story.md')).toBe('draft');
  });

  test('an unknown step is refused', async () => {
    await expect(approve(repo(), 'MDO-0001', 'deploy')).rejects.toThrow(/step must be one of story, design, spec, tasks, close/);
  });
});

describe('withStatus', () => {
  test('changes only the status value and keeps its comment', () => {
    expect(withStatus('---\nid: X\nstatus: draft           # draft | approved\n---\n# T\nstatus: draft\n', 'approved')).toBe(
      '---\nid: X\nstatus: approved           # draft | approved\n---\n# T\nstatus: draft\n',
    );
  });
});
