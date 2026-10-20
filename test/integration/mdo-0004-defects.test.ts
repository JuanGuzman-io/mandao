import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { configSchema } from '../../src/schemas/index.js';
import { commitsSize } from '../../src/scripts/close.js';
import { commitSpecDocs } from '../../src/scripts/commits.js';
import { nextLocalId, readSpec } from '../../src/scripts/spec.js';
import { impactItems, readClauses, verifyResults } from '../../src/spec/index.js';
import { makeTree, pkg } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';
const config = configSchema.parse({
  schema_version: 1,
  workspace: 'single',
  projects: [{ name: 'shop', path: '.' }],
  harnesses: ['claude'],
});
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
  for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function repo() {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop'), 'README.md': 'x\n' }));
  git(root, 'init', '-q', '-b', 'main');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.' }],
    harnesses: ['claude'],
  });
  cpSync(fixture, join(root, SPEC), { recursive: true });
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}

describe('defects found by MDO-0004', () => {
  test('#1 a queued commit takes only the files its task declares', async () => {
    const root = repo();
    mkdirSync(join(root, 'src/cli'), { recursive: true });
    writeFileSync(join(root, 'src/cli/extensions.ts'), 'export {};\n'); // declared by T2
    writeFileSync(join(root, 'src/other-task.ts'), 'export {};\n'); // another task's work in progress
    const file = join(root, SPEC, 'execution.md');
    writeFileSync(
      file,
      readFileSync(file, 'utf8').replace(/(\| STARTED \| \|\n)/, '$1| d | T2 | 1 | standard | claude | x | y | PASS | |\n'),
    );
    await buildProgram(() => root).parseAsync([
      'node',
      'mandao',
      'run',
      'checkpoint',
      'MDO-0001',
      '--task',
      'T2',
      '--pending-commit',
      'register the command',
    ]);
    expect(readSpec(join(root, SPEC)).progress!.pending_commits[0]!.files).toEqual(['src/cli/extensions.ts']);
  });

  test('#2 the size of a PR leaves out what is not code', () => {
    const root = repo();
    mkdirSync(join(root, 'src'), { recursive: true });
    writeFileSync(join(root, 'src/a.ts'), 'a\nb\n');
    writeFileSync(join(root, SPEC, 'design.md'), 'x\n'.repeat(500));
    git(root, 'add', '.');
    git(root, 'commit', '-qm', 'task');
    const sha = git(root, 'rev-parse', '--short', 'HEAD');
    expect(commitsSize(root, [sha]).changedLines).toBe(502);
    expect(commitsSize(root, [sha], (p) => p.startsWith('specs/'))).toEqual({ files: ['src/a.ts'], changedLines: 2 });
  });

  test('#6 release status reads an AC id followed by a description', () => {
    const report =
      '## Acceptance criteria → tests\n\n| AC / clause | Critical | Tests | Level | Result |\n|---|---|---|---|---|\n| AC-1 main | yes | t | unit | PASS |\n| AC-2/C1 edge | no | t | unit | PASS |\n';
    expect([...verifyResults(report)]).toEqual([
      ['AC-1', 'PASS'],
      ['AC-2/C1', 'PASS'],
    ]);
  });

  test('#7 impacts keep wrapped bullets and paragraphs whole', () => {
    const design =
      '## Constitution Impact\n- critical-flows.md: name the CLI test\n  for the doctor flow.\n- standards.md: one JSON\n  document per command.\n\n## Product Impact\nproduct.md gains a capability row\nfor doctor findings as JSON.\n';
    expect(impactItems(design, 'Constitution Impact')).toEqual([
      'critical-flows.md: name the CLI test for the doctor flow.',
      'standards.md: one JSON document per command.',
    ]);
    expect(impactItems(design, 'Product Impact')).toEqual(['product.md gains a capability row for doctor findings as JSON.']);
  });

  test('#8 a clause id on the wrapped line is read', () => {
    const issues: string[] = [];
    const body = '- **GIVEN** a workspace\n- **BUT it must NOT** print anything but the JSON document, not even\n  color codes (C2)\n';
    const clauses = readClauses(body, 'story.md', issues);
    expect(clauses.find((c) => c.kind === 'but-not')?.id).toBe('C2');
    expect(issues).toEqual([]);
  });

  test('the next local id skips one used by a deleted branch whose evidence stayed in the repo (MDO-0003)', () => {
    const root = repo();
    git(root, 'checkout', '-qb', 'feat/MDO-0003-count');
    mkdirSync(join(root, 'specs/MDO-0003-count'), { recursive: true });
    writeFileSync(join(root, 'specs/MDO-0003-count/story.md'), 'x');
    git(root, 'add', '.');
    git(root, 'commit', '-qm', 'spec\n\nRefs: MDO-0003');
    git(root, 'checkout', '-q', 'main');
    mkdirSync(join(root, 'docs/acceptance/evidence'), { recursive: true });
    writeFileSync(join(root, 'docs/acceptance/evidence/2b-opencode-MDO-0003-review.md'), 'x');
    git(root, 'add', '.');
    git(root, 'commit', '-qm', 'evidence');
    git(root, 'branch', '-D', 'feat/MDO-0003-count');
    expect(nextLocalId(root, config)).toBe('MDO-0004');
  });

  test('the spec documents get their own docs commit with Refs, never on a protected branch', () => {
    const root = repo();
    git(root, 'checkout', '-qb', 'feat/MDO-0001-skills-list');
    writeFileSync(join(root, SPEC, 'design.md'), '# approved\n');
    writeFileSync(join(root, 'src.ts'), 'not part of it\n');
    const input = { repo: root, specDir: join(root, SPEC), header: '📝 docs(shop): specify skills list', specId: 'MDO-0001', config };
    expect(commitSpecDocs({ ...input, protectedBranches: ['feat/MDO-0001-skills-list'] }).committed).toBe(false);
    const done = commitSpecDocs({ ...input, protectedBranches: ['main'] });
    expect(done.committed).toBe(true);
    expect(git(root, 'log', '-1', '--format=%B')).toBe('📝 docs(shop): specify skills list\n\nRefs: MDO-0001');
    expect(git(root, 'show', '--name-only', '--format=', 'HEAD')).toBe(`${SPEC}/design.md`);
    expect(git(root, 'status', '--porcelain')).toBe('?? src.ts');
    expect(commitSpecDocs({ ...input, protectedBranches: ['main'] })).toMatchObject({
      committed: false,
      reason: 'nothing to commit in the spec folder',
    });
  });
});

describe('content defects found by MDO-0004', () => {
  const core = (p: string) => readFileSync(join(import.meta.dirname, '../../core', p), 'utf8');

  test('#3 implement says --pending-commit takes only the subject', () => {
    expect(core('commands/implement.md')).toMatch(/`<subject>` is \*\*only the subject\*\*/);
  });

  test('#4 specify moves a story written before the worktree into it', () => {
    expect(core('commands/specify.md')).toMatch(
      /move the whole spec folder\s+into\s+the worktree|move the whole spec folder into\s+the worktree/,
    );
  });

  test('#5 the verify report asks for the bare AC id in the first column', () => {
    expect(core('templates/shared/spec/verify-report.md')).toContain('First column: the bare id, `AC-n` or `AC-n/Cn`');
  });

  test('specify and clarify commit the spec documents on their own', () => {
    expect(core('commands/specify.md')).toContain('{{script:commit-spec}}');
    expect(core('commands/clarify.md')).toContain('{{script:commit-spec}}');
  });
});
