// mandao-scans: core/ — reads commands and templates by folder.
import { execFileSync } from 'node:child_process';
import { cpSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { agentIdentity } from '../../src/scripts/identity.js';
import { readSpec } from '../../src/scripts/spec.js';
import { testWriter } from '../../src/spec/index.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const core = join(import.meta.dirname, '../../core');
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

function repo() {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop'), 'README.md': 'x\n', 'test/a.test.ts': 'x\n' }));
  initTestRepo(root, '-q', '-b', 'feat/MDO-0001-skills-list');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.', tests: { impacted: 'node -e "process.exit(1)" {files}' } }],
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

describe('minor defects found by the MDO-0006 run', () => {
  test('tasks and verify commit their documents on their own, with fixed subjects', async () => {
    const root = repo();
    writeFileSync(join(root, SPEC, 'tasks.md'), `${readFileSync(join(root, SPEC, 'tasks.md'), 'utf8')}\n`);
    await run(root, 'commit-spec', 'MDO-0001', 'tasks');
    expect(lastJson()).toMatchObject({ committed: true, header: '📝 docs(mandao): approve the MDO-0001 task plan' });
    writeFileSync(join(root, SPEC, 'verify-report.md'), '# Verify\n');
    await run(root, 'commit-spec', 'MDO-0001', 'verify');
    expect(lastJson()).toMatchObject({ committed: true, header: '📝 docs(mandao): record the MDO-0001 verify report' });
    expect(git(root, 'status', '--porcelain')).toBe('');
    for (const c of ['tasks', 'verify'])
      expect(readFileSync(join(core, `commands/${c}.md`), 'utf8')).toContain(`{{script:commit-spec}} {{arg:spec}} ${c}`);
  });

  test('red evidence records the agent Mandao routed the task to, never a name the model types', async () => {
    const root = repo();
    // T2 (standard, no risk tags) goes to the standard Implementer; the command takes no agent at all.
    await run(root, 'red', 'MDO-0001', 'T2', 'test/a.test.ts', '--harness', 'claude');
    const row = readSpec(join(root, SPEC)).execution.at(-1)!;
    expect(row).toMatchObject({ verdict: 'RED', implementer: agentIdentity(root, 'mandao-implementer-standard', 'claude').model });
    expect(row.notes).toMatch(/^red tests by mandao-implementer-standard:/);
    // Routing follows the task: risk tags → Tester; after two FAILs → the escalated tier; simple mode → one Implementer.
    const t = { id: 'T9', tier: 'standard' as const, tests: { unit: ['S-1.1'], e2e: [] }, risk_tags: [] as string[] };
    const fail = {
      date: 'd',
      task: 'T9',
      attempt: 1,
      tier: 'standard',
      harness: 'claude',
      implementer: 'x',
      reviewer: 'y',
      verdict: 'FAIL' as const,
      notes: '',
    };
    expect(testWriter({ ...t, risk_tags: ['auth'] }, [], false)).toBe('mandao-tester');
    expect(testWriter(t, [fail, { ...fail, attempt: 2 }], false)).toBe('mandao-implementer-strong');
    expect(testWriter(t, [], true)).toBe('mandao-implementer');
  });

  test('quick-log puts reduced independence in the Review column and refuses it in Gates', async () => {
    const root = repo();
    writeFileSync(join(root, 'README.md'), 'y\n');
    await expect(
      run(root, 'quick-log', 'readme', '--gates', 'lint pass; reduced independence', '--verdict', 'PASS', '--reviewer', 'mandao-reviewer'),
    ).rejects.toThrow(/--gates lists gate results only/);
    await run(
      root,
      'quick-log',
      'readme',
      '--gates',
      'lint pass',
      '--verdict',
      'PASS',
      '--reviewer',
      'mandao-reviewer',
      '--reduced-independence',
    );
    const row = readFileSync(join(root, 'specs/quick/quick-log.md'), 'utf8')
      .split('\n')
      .find((l) => l.includes('| readme |'))!;
    const cells = row.split(' | ');
    expect(cells[5]).toBe('lint pass');
    expect(cells[6]).toMatch(/^PASS, mandao-reviewer on .+; reduced independence \(the reviewer shares the author model\)$/);
  });

  test('close lists a write the harness refuses as pending, with its diff, instead of failing', () => {
    const close = readFileSync(join(core, 'commands/close.md'), 'utf8');
    expect(close).toMatch(/A write the harness refuses[\s\S]*pending in the grouped\s+confirmation[\s\S]*exact diff/);
  });
});

describe('readability pass in the content', () => {
  test('specify loads diagram, hotfix, type, lite and data-model rules only when they apply (ADR 0034)', () => {
    const specify = readFileSync(join(core, 'commands/specify.md'), 'utf8');
    for (const r of ['diagram', 'hotfix', 'spec-types', 'doc-lite', 'doc-data-model'])
      expect(specify).toContain(`{{template:rules/${r}.md}}`);
    expect(specify).not.toContain('sequence` · pipeline'); // the diagram table lives in rules/diagram.md
    expect(specify.length).toBeLessThan(12_000);
    expect(readFileSync(join(core, 'templates/shared/rules/diagram.md'), 'utf8')).toContain(
      '| Data change | Entities and relationships (`erd`',
    );
  });

  test('spec-docs.md keeps only the principles; each command loads the rules of the documents it writes', () => {
    expect(readFileSync(join(core, 'templates/shared/rules/spec-docs.md'), 'utf8').length).toBeLessThan(3000);
    const loads: Record<string, string[]> = {
      story: ['doc-story'],
      clarify: ['doc-requirements'],
      tasks: ['doc-tasks'],
      verify: ['doc-verify'],
      close: ['doc-close'],
      specify: ['doc-requirements', 'doc-design', 'doc-lite'],
    };
    for (const [c, docs] of Object.entries(loads)) {
      const text = readFileSync(join(core, `commands/${c}.md`), 'utf8');
      for (const d of docs) expect(text, c).toContain(`{{template:rules/${d}.md}}`);
    }
  });

  const templates = (dir: string) => readdirSync(join(core, 'templates', dir)).map((f) => join(core, 'templates', dir, f));
  const docs = [...templates('shared/spec'), ...templates('shared/close'), ...templates('ai/spec')].filter(
    (f) => !f.endsWith('execution.md'),
  );

  test('spec and close templates carry no HTML comments and open with a summary line', () => {
    for (const f of docs) {
      const text = readFileSync(f, 'utf8');
      expect(text, f).not.toContain('<!--');
      const content = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
      if (/\.md$/.test(f) && /^# /m.test(content) && !/pivot-record|quick-log/.test(f))
        expect(content, f).toMatch(/^# .+\n\n(<.+>|\*\*Before you start)/m);
    }
  });

  test('the documents follow rules/spec-docs.md, tasks plans executable premises, and quickstart is conditional and short', () => {
    for (const c of ['story', 'specify', 'clarify', 'tasks', 'verify', 'close']) {
      const text = readFileSync(join(core, `commands/${c}.md`), 'utf8');
      expect(text, c).toContain('rules/spec-docs.md');
    }
    expect(readFileSync(join(core, 'commands/tasks.md'), 'utf8')).toMatch(
      /High premise[\s\S]*UNVERIFIED[\s\S]*Done when[\s\S]*first task that can run it/,
    );
    expect(readFileSync(join(core, 'commands/tasks.md'), 'utf8')).toContain('{{script:tasks}} {{arg:spec}} --index --write');
    expect(readFileSync(join(core, 'commands/specify.md'), 'utf8')).toMatch(/quickstart\.md[\s\S]*Not for test-only specs/);
    expect(readFileSync(join(core, 'templates/shared/spec/quickstart.md'), 'utf8').length).toBeLessThan(1600);
  });
});
