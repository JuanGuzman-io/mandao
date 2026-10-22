import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { logPath } from '../../src/scripts/spec-log.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const spec = 'specs/MDO-0001-skills-list';
const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  for (const key of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(key, 'test');
  for (const key of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(key, 'test@example.com');
  out = [];
  vi.spyOn(console, 'log').mockImplementation((value: string) => void out.push(value));
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

function repo() {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop'), 'src/cli/skills.ts': 'export {};\n' }));
  initTestRepo(root, '-q', '-b', 'feat/MDO-0001-skills-list');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [
      {
        name: 'mandao',
        path: '.',
        gates: {
          lint: 'node -e "process.exit(0)"',
          typecheck: 'node -e "console.log(\'src/cli/skills.ts(1,1): error TS2304\'); process.exit(2)"',
          secrets: 'mandao-no-such-scanner detect',
        },
        tests: { impacted: 'node -e "process.exit(0)" {files}' },
      },
    ],
    harnesses: ['claude'],
  });
  syncProject(root);
  cpSync(fixture, join(root, spec), { recursive: true });
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}

const run = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
  return JSON.parse(out.at(-1)!);
};

describe('session cut boundaries', () => {
  test('suggests a new session at most once per boundary (ADR 0038)', async () => {
    const root = repo();
    const session = 'cut-session';
    const usage = (read: number, write: number) => ({
      input_tokens: 0,
      cache_read_input_tokens: read,
      cache_creation_input_tokens: write,
      cache_creation: { ephemeral_1h_input_tokens: write },
    });
    const turn = (id: string, read: number, write: number) =>
      JSON.stringify({ timestamp: new Date().toISOString(), message: { id, model: 'claude-opus-5-5', usage: usage(read, write) } });
    const home = makeTree({ [`projects/x/${session}.jsonl`]: `${turn('a', 0, 34_000)}\n${turn('b', 34_000, 126_000)}\n` });
    vi.stubEnv('CLAUDE_CONFIG_DIR', home);
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', session);
    const step = await run(root, 'step', 'MDO-0001', 'T2', '--harness', 'claude', '--no-brief');
    expect(step.session).toMatchObject({
      cut: true,
      savings: 0.65,
      stop: false,
      minSavings: 1,
      reason: expect.stringMatching(/context 160k vs 44k/),
    });
    const cuts = logPath(join(root, spec), 'session-cuts.md');
    expect(readFileSync(cuts, 'utf8')).toMatch(/\| T2 \| 160000 \| 44000 \| 43 \| 0\.65 \| go on: below 1 \|/);
    const summary = await run(root, 'implement-summary', 'MDO-0001');
    expect(summary.session).toMatchObject({ cut: true, savings: 0.3, command: expect.stringContaining('"/mandao-verify MDO-0001"') });
    const repeated = await run(root, 'implement-summary', 'MDO-0001');
    expect(repeated.session.command).toBeUndefined();
    const log = readFileSync(cuts, 'utf8');
    const verifyRows = log.split('\n').filter((line) => /^\| [^|]+ \| verify \|/.test(line));
    expect(verifyRows).toHaveLength(2);
    expect(verifyRows.filter((line) => line.endsWith('| true |'))).toHaveLength(1);
    await run(root, 'checkpoint', 'MDO-0001', '--task', 'T2', '--harness', 'claude', '--verdict', 'RED');
    const mid = await run(root, 'step', 'MDO-0001', 'T2', '--harness', 'claude', '--no-brief');
    expect(mid.loop.action).toBe('implement');
    expect(mid.session).toBeUndefined();
  });
});
