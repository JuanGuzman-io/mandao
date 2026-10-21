import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { makeTree } from '../helpers.js';
import { lastOut, useLogEnv } from '../log-v2-helpers.js';

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function commit(root: string, file: string, message: string, date: string) {
  writeFileSync(join(root, file), message);
  git(root, 'add', '.');
  execFileSync('git', ['commit', '-qm', message], { cwd: root, env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } });
}

describe('diagram-drift by spec depth (MDO-0011 AC-6)', () => {
  useLogEnv();
  const SPEC = 'specs/MDO-0001-skills-list';
  const CONFIG = 'schema_version: 1\nworkspace: single\nprojects: [{ name: p, path: . }]\nharnesses: [claude]\n';
  const PROPOSED = {
    schema_version: 1,
    nodes: [
      { id: 'src/cli', label: 'CLI' },
      { id: 'src/skills', label: 'Skills' },
    ],
    edges: [],
  };

  /** One committed spec: lite keeps spec.md; standard keeps an unstamped design.md and its proposed graph. */
  function specRepo(depth: 'lite' | 'standard') {
    const root = realpathSync(makeTree({ 'src/cli/run.ts': 'x', 'src/engine/sync.ts': 'y' }));
    git(root, 'init', '-q', '-b', 'main');
    mkdirSync(join(root, '.mandao'));
    writeFileSync(join(root, '.mandao/config.yml'), CONFIG);
    const spec = join(root, SPEC);
    mkdirSync(join(spec, 'diagrams'), { recursive: true });
    cpSync(join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list/story.md'), join(spec, 'story.md'));
    if (depth === 'lite') writeFileSync(join(spec, 'spec.md'), '---\ndepth: lite\n---\n\n# Spec\n');
    else {
      writeFileSync(join(spec, 'diagrams/proposed.graph.json'), JSON.stringify(PROPOSED));
      writeFileSync(join(spec, 'flow.mmd'), 'flowchart LR\n  cli --> skills');
      writeFileSync(join(spec, 'design.md'), '---\ndepth: standard\n---\n\n# Design\n');
    }
    git(root, 'add', '.');
    commit(root, 'src/cli/run.ts', '✨ feat(cli): list\n\nRefs: MDO-0001\nMandao-Task: T1', '2026-10-01T10:00:00Z');
    return root;
  }
  /** Runs one `mandao run` command and returns the exit code it set. */
  async function cli(root: string, ...args: string[]) {
    process.exitCode = undefined;
    await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
    return process.exitCode ?? 0;
  }

  test('S-6.1: a lite spec reports applicable false with the reason, exits 0, and stamps no graph', async () => {
    const root = specRepo('lite');
    expect(await cli(root, 'diagram-drift', 'MDO-0001')).toBe(0);
    expect(lastOut()).toMatchObject({ applicable: false, reason: 'lite specs have no diagram' });
    expect(existsSync(join(root, SPEC, 'diagrams/implemented.graph.json'))).toBe(false);
  });

  test('S-6.2: a standard spec with a stamped graph reports its drift as today', async () => {
    const root = specRepo('standard');
    const stamp = ['diagram', 'MDO-0001', '--stamp', '--tool', 'mermaid', '--type', 'workflow', '--graph', 'diagrams/proposed.graph.json'];
    await cli(root, ...stamp, '--mermaid', join(root, SPEC, 'flow.mmd'));
    expect(await cli(root, 'diagram-drift', 'MDO-0001')).toBe(0);
    expect(lastOut()).toMatchObject({ drift: true, missingNodes: ['src/skills'], addedNodes: ['src/engine'] });
  });

  test('S-6.2/C1: a standard spec without a stamp still fails', async () => {
    const root = specRepo('standard');
    await expect(cli(root, 'diagram-drift', 'MDO-0001')).rejects.toThrow(/no diagram with a structured graph/);
  });
});
