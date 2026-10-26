// mandao-scans: none — lists only the temporary trees it creates.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { constitutionHash } from '../../src/engine/constitution-hash.js';
import { readConfig, writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { logPath } from '../../src/scripts/spec-log.js';
import { parseApprovals, withStatus } from '../../src/spec/index.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

/** Phase 18: a constitution reopened after a spec's approval makes `next` name the documents to update. */
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

/** The fixture as a lite spec in draft, with a workspace constitution, committed on the spec branch. */
function repo() {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
  initTestRepo(root, '-q', '-b', 'feat/MDO-0001-skills-list');
  git(root, 'config', 'user.name', 'Ana PE');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.', gates: { lint: 'true' } }],
    harnesses: ['claude'],
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  const dir = join(root, SPEC);
  writeFileSync(join(dir, 'spec.md'), withStatus(readFileSync(join(dir, 'requirements.md'), 'utf8'), 'draft'));
  writeFileSync(join(dir, 'story.md'), withStatus(readFileSync(join(dir, 'story.md'), 'utf8'), 'draft'));
  rmSync(join(dir, 'requirements.md'));
  rmSync(join(dir, 'tasks.md'));
  mkdirSync(join(root, 'docs/constitution'), { recursive: true });
  writeFileSync(
    join(root, 'docs/constitution/architecture.md'),
    '# Architecture\n\n| Concern | Choice |\n|---|---|\n| Vectors | sqlite-vec |\n',
  );
  writeFileSync(join(root, 'docs/constitution/CHANGELOG.md'), '# Changelog\n');
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}
const cli = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', ...args]);
  return JSON.parse(out.at(-1)!);
};
const approvals = (root: string) => parseApprovals(readFileSync(logPath(join(root, SPEC), 'approvals.yml'), 'utf8'));
const edit = (root: string, file: string, text: string) => writeFileSync(join(root, 'docs/constitution', file), text);

describe('a constitution changed after the approval (phase 18)', () => {
  test('approve spec records the constitution hash; a later architecture change makes next recommend specify', async () => {
    const root = repo();
    await cli(root, 'approve', 'MDO-0001', 'spec');
    expect(approvals(root)[0]?.sha256).toMatchObject({ constitution: constitutionHash(root, readConfig(root), ['mandao']) });
    expect((await cli(root, 'run', 'next', 'MDO-0001')).recommended.command).toBe('/mandao-implement');

    edit(root, 'architecture.md', '# Architecture\n\n| Concern | Choice |\n|---|---|\n| Vectors | Qdrant local |\n');
    const n = await cli(root, 'run', 'next', 'MDO-0001');
    expect(n.recommended.invocation).toBe('/mandao-specify MDO-0001');
    expect(n.recommended.reason).toContain('constitution changed');
    expect(n.recommended.reason).toContain('spec.md');
    expect(n.recommended.reason).toContain('mandao approve MDO-0001 spec');
  });

  test('a CHANGELOG entry or a status change is not a constitution change', async () => {
    const root = repo();
    await cli(root, 'approve', 'MDO-0001', 'spec');
    edit(root, 'CHANGELOG.md', '# Changelog\n\n- 2026-10-26: reopened for MDO-0001.\n');
    expect((await cli(root, 'run', 'next', 'MDO-0001')).recommended.command).toBe('/mandao-implement');
  });

  test('approving again after the update clears the recommendation', async () => {
    const root = repo();
    await cli(root, 'approve', 'MDO-0001', 'spec');
    edit(root, 'architecture.md', '# Architecture\n\nQdrant local.\n');
    await cli(root, 'approve', 'MDO-0001', 'spec');
    expect((await cli(root, 'run', 'next', 'MDO-0001')).recommended.command).toBe('/mandao-implement');
  });
});
