import { execFileSync } from 'node:child_process';
import { realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { configSchema } from '../../src/schemas/index.js';
import { fixCommitsAfter, releaseBranchesContaining } from '../../src/scripts/close.js';
import { parseCloseSummary, renderCloseSummary, withEnvironment, withPublication } from '../../src/spec/index.js';
import { makeTree } from '../helpers.js';

const trailers = configSchema.parse({ schema_version: 1, workspace: 'single', projects: [{ name: 'p', path: '.' }], harnesses: ['claude'] })
  .commits.trailers;
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

beforeEach(() => {
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
  for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
});
afterEach(() => vi.unstubAllEnvs());

function commit(root: string, file: string, message: string, date: string) {
  writeFileSync(join(root, file), message);
  git(root, 'add', '.');
  execFileSync('git', ['commit', '-qm', message], { cwd: root, env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } });
  return git(root, 'rev-parse', '--short', 'HEAD');
}

describe('close in a real repository', () => {
  test('bugs after merge: fix commits that reference the spec, after it closed', () => {
    const root = realpathSync(makeTree({}));
    git(root, 'init', '-q', '-b', 'main');
    commit(root, 'a', '✨ feat(cli): add x\n\nRefs: MDO-0001\nMandao-Task: T1', '2026-10-01T10:00:00Z');
    commit(root, 'b', '🐛 fix(cli): before close\n\nRefs: MDO-0001', '2026-10-02T10:00:00Z');
    const after = commit(root, 'c', '🐛 fix(cli): after close\n\nRefs: MDO-0001', '2026-10-10T10:00:00Z');
    commit(root, 'd', '🐛 fix(cli): unreferenced', '2026-10-11T10:00:00Z');
    commit(root, 'e', '🐛 fix(cli): other spec\n\nRefs: MDO-0009', '2026-10-12T10:00:00Z');
    expect(fixCommitsAfter(root, 'MDO-0001', trailers, '2026-10-05T00:00:00Z')).toEqual([after]);
  });

  test('gitflow: the release branch that contains every commit of the spec', () => {
    const root = realpathSync(makeTree({}));
    git(root, 'init', '-q', '-b', 'develop');
    const t1 = commit(root, 'a', 'T1', '2026-10-01T10:00:00Z');
    git(root, 'branch', 'release/1.1');
    const t2 = commit(root, 'b', 'T2', '2026-10-02T10:00:00Z');
    git(root, 'branch', 'release/1.2');
    expect(releaseBranchesContaining(root, [t1, t2], 'release/')).toEqual(['release/1.2']);
    expect(releaseBranchesContaining(root, [t1], 'release/')).toEqual(['release/1.1', 'release/1.2']);
    expect(releaseBranchesContaining(root, [t1], '')).toEqual([]);
  });

  test('close-summary keeps real ISO timestamps as text across a round trip', () => {
    const s = { ...parseCloseSummary(undefined, 'MDO-0002'), closed_at: '2026-10-20T16:02:26.756Z' };
    expect(parseCloseSummary(renderCloseSummary(s), 'MDO-0002').closed_at).toBe('2026-10-20T16:02:26.756Z');
  });

  test('close-summary is idempotent: an environment or a publication is recorded once and updated', () => {
    let s = parseCloseSummary(undefined, 'MDO-0001');
    s = withEnvironment(s, 'staging', 'ci', 't1');
    s = withEnvironment(s, 'staging', 'tracker', 't2');
    s = withPublication(s, { target: 'jira:PROJ-1', kind: 'comment', id: '100', hash: 'h1', at: 't1' });
    s = withPublication(s, { target: 'jira:PROJ-1', kind: 'comment', id: '100', hash: 'h2', at: 't2' });
    const round = parseCloseSummary(renderCloseSummary(s), 'MDO-0001');
    expect(round.environments).toEqual([{ name: 'staging', at: 't2', source: 'tracker' }]);
    expect(round.published.map((p) => p.hash)).toEqual(['h2']);
  });
});

describe('mandao run diagram-drift', () => {
  test('derives the implemented graph from the spec commits and compares it by identity', async () => {
    const { buildProgram } = await import('../../src/cli/program.js');
    const { writeYaml } = await import('../../src/engine/files.js');
    const { cpSync, mkdirSync, readFileSync } = await import('node:fs');
    const root = realpathSync(makeTree({ 'src/cli/run.ts': 'x', 'src/engine/sync.ts': 'y' }));
    git(root, 'init', '-q', '-b', 'main');
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'p', path: '.' }],
      harnesses: ['claude'],
    });
    const spec = join(root, 'specs/MDO-0001-skills-list');
    cpSync(join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list'), spec, { recursive: true });
    mkdirSync(join(spec, 'diagrams'));
    writeFileSync(
      join(spec, 'diagrams/proposed.graph.json'),
      JSON.stringify({
        schema_version: 1,
        nodes: [
          { id: 'src/cli', label: 'CLI' },
          { id: 'src/skills', label: 'Skills' },
        ],
        edges: [],
      }),
    );
    writeFileSync(join(spec, 'design.md'), '---\ndepth: standard\nprojects: [p]\n---\n\n# Design\n\n## Decisions\n\nx\n');
    git(root, 'add', '.');
    commit(root, 'src/cli/run.ts', '✨ feat(cli): list\n\nRefs: MDO-0001\nMandao-Task: T1', '2026-10-01T10:00:00Z');
    const out: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
    const run = (...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
    writeFileSync(join(spec, 'flow.mmd'), 'flowchart LR\n  cli --> skills');
    await run(
      'diagram',
      'MDO-0001',
      '--stamp',
      '--tool',
      'mermaid',
      '--type',
      'workflow',
      '--mermaid',
      join(spec, 'flow.mmd'),
      '--graph',
      'diagrams/proposed.graph.json',
    );
    await run('diagram-drift', 'MDO-0001');
    expect(JSON.parse(out.at(-1)!)).toMatchObject({
      drift: true,
      missingNodes: ['src/skills'],
      addedNodes: ['src/engine'],
      implemented: 'diagrams/implemented.graph.json',
    });
    // The spec's commit touched src/cli and src/engine; the design proposed src/cli and src/skills.
    const built = JSON.parse(readFileSync(join(spec, 'diagrams/implemented.graph.json'), 'utf8'));
    expect(built.nodes.map((n: { id: string }) => n.id)).toEqual(['src/cli', 'src/engine']);
    vi.restoreAllMocks();
  });
});
