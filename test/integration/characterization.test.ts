import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { agentIdentity } from '../../src/scripts/identity.js';
import { mutationIssues, patchFiles } from '../../src/scripts/mutation.js';
import { readSpec } from '../../src/scripts/spec.js';
import { specMetrics, type Task } from '../../src/spec/index.js';
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
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

/** A synced repo (agent files exist) with the MDO-0001 spec, committed on a feature branch. */
function repo(impacted = 'node -e "process.exit(0)" {files}') {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop'), 'README.md': 'x\n', 'src/code.js': 'export const answer = 42;\n' }));
  git(root, 'init', '-q', '-b', 'feat/MDO-0001-skills-list');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.', tests: { impacted } }],
    harnesses: ['claude'],
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}
const run = (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
const lastJson = () => JSON.parse(out.at(-1)!);

describe('decision 1: characterization tests with recorded mutations (ADR 0022)', () => {
  /** Tests fail when src/code.js contains MUTATED: a mutation that writes it is killed. */
  const IMPACTED = `node -e "process.exit(require('fs').readFileSync('src/code.js','utf8').includes('MUTATED')?1:0)" {files}`;

  function characterizationRepo() {
    const root = repo(IMPACTED);
    const tasksFile = join(root, SPEC, 'tasks.md');
    writeFileSync(
      tasksFile,
      readFileSync(tasksFile, 'utf8').replace(
        'files: [src/cli/extensions.ts, src/cli/skills.ts]',
        'kind: test\ncharacterization: true\nfiles: [test/a.test.ts]',
      ),
    );
    git(root, 'commit', '-qam', 'characterization task');
    return root;
  }
  function patch(root: string, content: string) {
    writeFileSync(join(root, 'src/code.js'), content);
    const diff = execFileSync('git', ['diff', '--', 'src/code.js'], { cwd: root, encoding: 'utf8' });
    git(root, 'checkout', '--', 'src/code.js');
    const file = join(makeTree({}), `${Date.now()}-${Math.random()}.patch`);
    writeFileSync(file, diff);
    return file;
  }

  test('a killed mutation is recorded with its diff and failing output, and reverted to a clean tree', async () => {
    const root = characterizationRepo();
    await run(root, 'mutation', 'MDO-0001', 'T2', 'test/a.test.ts', '--patch', patch(root, 'export const answer = "MUTATED";\n'));
    expect(lastJson()).toMatchObject({ recorded: true, mutation: 1, files: ['src/code.js'] });
    expect(git(root, 'status', '--porcelain')).toMatch(/specs\//);
    expect(git(root, 'status', '--porcelain')).not.toMatch(/src\/code\.js/);
    const row = readSpec(join(root, SPEC)).execution.at(-1)!;
    expect(row).toMatchObject({
      verdict: 'MUTANT',
      task: 'T2',
      implementer: agentIdentity(root, 'mandao-implementer-standard', 'claude').model,
    });
    const evidence = readFileSync(join(root, SPEC, 'mutations/T2-1.md'), 'utf8');
    expect(evidence).toContain('+export const answer = "MUTATED";');
    expect(evidence).toContain('→ FAIL (exit 1)');
  });

  test('a surviving mutation, a mutation of a test, and a task that is not characterization are not evidence', async () => {
    const root = characterizationRepo();
    await run(root, 'mutation', 'MDO-0001', 'T2', 'test/a.test.ts', '--patch', patch(root, 'export const answer = 41;\n'));
    expect(lastJson()).toMatchObject({ recorded: false, problem: expect.stringMatching(/survived/) });
    expect(process.exitCode).toBe(1);
    expect(existsSync(join(root, SPEC, 'mutations'))).toBe(false);
    expect(git(root, 'status', '--porcelain')).toBe('');
    expect(mutationIssues(['test/a.test.ts'], [])).toEqual([expect.stringMatching(/changes tests/)]);
    expect(mutationIssues(['src/x.ts'], ['src/x.ts'])).toEqual([expect.stringMatching(/task's own files/)]);
    expect(patchFiles('--- a/src/x.ts\n+++ b/src/x.ts\n@@\n')).toEqual(['src/x.ts']);
    await expect(run(root, 'mutation', 'MDO-0001', 'T1', 'test/a.test.ts', '--patch', patch(root, 'MUTATED\n'))).rejects.toThrow(
      /not a characterization task: new behavior needs a red test/,
    );
  });

  test('Kaizen counts characterization tasks apart from tdd and no-tdd', () => {
    const t = (id: string, characterization: boolean) => ({ id, characterization, tests: { unit: ['x'], e2e: [] } }) as unknown as Task;
    const mutant = {
      date: 'd',
      task: 'T1',
      attempt: 1,
      tier: 'standard',
      harness: 'claude',
      implementer: 'x',
      reviewer: '—',
      verdict: 'MUTANT' as const,
      notes: '',
    };
    expect(specMetrics('S', [t('T1', true)], [mutant]).tdd).toEqual({
      practice: 'characterization',
      tasksWithTests: 0,
      tasksWithRed: 0,
      tasksCharacterized: 1,
      tasksWithMutants: 1,
    });
    expect(specMetrics('S', [t('T1', true), t('T2', false)], [mutant]).tdd.practice).toBe('no-tdd');
  });
});

describe('decision 2: high-impact premises are executed in specify', () => {
  test('specify and the design template require an executed, safe run for High premises', () => {
    const core = join(import.meta.dirname, '../../core');
    const specify = readFileSync(join(core, 'commands/specify.md'), 'utf8');
    expect(specify).toMatch(/\*\*High\*\* impact is verified by \*\*running\*\* it/);
    expect(specify).toMatch(/read-only, inside the worktree or a sandbox, no writes to real systems/);
    expect(specify).toContain('{{script:resources}}');
    expect(readFileSync(join(core, 'templates/shared/rules/spec-docs.md'), 'utf8')).toMatch(
      /A High\s+premise counts as verified only with an executed command/,
    );
  });
});
