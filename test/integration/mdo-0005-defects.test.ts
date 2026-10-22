// mandao-scans: core/ — reads commands, personas and rules by folder.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { readConfig, writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { readRecommendations, resolveWorkspaceModels } from '../../src/models/load.js';
import { configSchema } from '../../src/schemas/index.js';
import { changeManifest, commitPending } from '../../src/scripts/commits.js';
import { agentIdentity, claimedModels, identityNotes } from '../../src/scripts/identity.js';
import { reviewCell } from '../../src/scripts/quick-log.js';
import { readSpec } from '../../src/scripts/spec.js';
import { commitType, kindIssues, type Task } from '../../src/spec/index.js';
import { makeTree, pkg, reviewFile } from '../helpers.js';

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

describe('#1 and #5: identity comes from agent files and models.yml, never from the model', () => {
  test('free text that names no model is not a claim; the same model in other words is not a mismatch', () => {
    const id = { harness: 'claude', agent: 'mandao-reviewer', model: 'claude-opus-5-5', source: 'agent-file' as const };
    // The two notes MDO-0005 logged on every row.
    expect(identityNotes('reviewer', id, 'mandao-reviewer (identity not stated)')).toEqual([]);
    expect(identityNotes('implementer', { ...id, model: 'claude-sonnet-5-5' }, 'claude-sonnet-5-5 mandao-implementer-standard')).toEqual(
      [],
    );
    expect(identityNotes('reviewer', id, 'I am Claude Opus 5.5')).toEqual([]);
    expect(identityNotes('reviewer', id, 'Claude')).toEqual([]);
    expect(identityNotes('reviewer', id, 'sonnet')).toEqual(['identity mismatch: reviewer claimed sonnet, invoked claude-opus-5-5']);
    expect(claimedModels('anthropic/claude-sonnet-5-5 via Sonnet 5.5')).toEqual(['claude-sonnet-5-5', 'sonnet-5-5']);
  });

  test('a record never takes its identity from the model: claims are compared, cells come from agent files', async () => {
    const root = repo();
    await run(
      root,
      'checkpoint',
      'MDO-0001',
      '--task',
      'T2',
      '--harness',
      'claude',
      '--verdict',
      'REPORTED',
      '--implementer',
      'mandao-implementer-standard',
      '--claimed-implementer',
      'gpt-9-turbo',
    );
    const spec = readSpec(join(root, SPEC));
    const row = spec.execution.at(-1)!;
    const pinned = agentIdentity(root, 'mandao-implementer-standard', 'claude').model;
    expect(row.implementer).toBe(pinned);
    expect(row.implementer).not.toContain('gpt-9');
    expect(row.notes).toBe(`identity mismatch: implementer claimed gpt-9-turbo, invoked ${pinned}`);
    // progress.yml: the Leader's model from models.yml for the harness, nothing typed.
    const leader = resolveWorkspaceModels(root, readConfig(root), readRecommendations()).claude!.leader!;
    expect(spec.progress!.current!.model).toBe(`${leader.model}${leader.effort ? ` (${leader.effort})` : ''}`);
    // A model name where an agent is expected is refused: there is no agent file by that name.
    await run(root, 'review-pack', 'MDO-0001', 'T2');
    await expect(
      run(
        root,
        'checkpoint',
        'MDO-0001',
        '--task',
        'T2',
        '--verdict',
        'PASS',
        '--harness',
        'claude',
        '--reviewer',
        'claude-opus-5-5',
        '--review',
        reviewFile('PASS'),
      ),
    ).rejects.toThrow(/does not exist/);
  });

  test('the quick-log review cell comes from the reviewer agent file, whatever the reviewer said', async () => {
    const root = repo();
    writeFileSync(join(root, 'README.md'), 'y\n');
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
      '--claimed-reviewer',
      'reviewer on sonnet',
    );
    const pinned = agentIdentity(root, 'mandao-reviewer', 'claude').model;
    const log = readFileSync(join(root, 'specs/quick/quick-log.md'), 'utf8');
    const row = log.split('\n').find((l) => l.includes('| readme |'))!;
    expect(row).toContain(`PASS, mandao-reviewer on ${pinned}`);
    expect(row).toContain('`README.md`');
    expect(row).toContain('2 (+1/-1)');
    expect(row).toContain(`identity mismatch: reviewer claimed sonnet, invoked ${pinned}`);
    expect(reviewCell({ verdict: 'PASS', reviewer: agentIdentity(root, 'self', 'claude') })).toBe(
      'PASS, self; reduced independence (reviewed in the Leader context)',
    );
  });

  test('every CLI option that records who did a step takes an agent (resolved from its file) or is a compared claim', () => {
    const found: string[] = [];
    const walk = (c: Command, path: string) => {
      for (const o of c.options)
        if (/model|claim|implementer|reviewer|agent|leader/i.test(o.long ?? '') && path !== 'mandao init') found.push(`${path} ${o.long}`);
      for (const s of c.commands) walk(s, `${path} ${s.name()}`);
    };
    walk(
      buildProgram(() => '/nowhere'),
      'mandao',
    );
    // A new identity-bearing option fails here until it resolves through agentIdentity or models.yml.
    expect(found.sort()).toEqual(
      [
        'mandao run checkpoint --claimed-implementer',
        'mandao run checkpoint --claimed-reviewer',
        'mandao run checkpoint --implementer',
        'mandao run checkpoint --reviewer',
        'mandao run quick-log --claimed-reviewer',
        // `step` shares the checkpoint's options and its writer (agentIdentity).
        'mandao run step --claimed-implementer',
        'mandao run step --claimed-reviewer',
        'mandao run step --implementer',
        'mandao run step --reviewer',
        'mandao run quick-log --reviewer',
      ].sort(),
    );
  });

  test('no command or persona asks the model to type a model name into a record', () => {
    const core = join(import.meta.dirname, '../../core');
    const files = ['commands', 'personas', 'templates/shared/rules'].flatMap((d) =>
      readdirSync(join(core, d)).map((f) => join(core, d, f)),
    );
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      expect(text, f).not.toMatch(/--model <your model>|<your model>|reviewer model\)|on <model>/);
    }
    expect(readFileSync(join(core, 'commands/quick.md'), 'utf8')).toContain('{{script:quick-log}}');
  });
});

describe('#2: the commit type is the task kind, checked against the real diff', () => {
  const task = (kind?: Task['kind']) => ({ id: 'T1', project: 'shop', ...(kind ? { kind } : {}) }) as Task;
  const story = { meta: { type: 'story' } } as Parameters<typeof commitType>[0];

  test('declared kinds the diff contradicts are issues; without a kind the diff decides', () => {
    expect(kindIssues('feat', ['test/a.test.ts'])).toEqual(['kind is feat but every changed file is a test: use test']);
    expect(kindIssues('test', ['test/a.test.ts', 'src/a.ts'])).toEqual(['kind is test but non-test files changed: src/a.ts']);
    expect(kindIssues('docs', ['docs/a.md', 'src/a.ts'])).toEqual(['kind is docs but non-documentation files changed: src/a.ts']);
    expect(kindIssues('feat', ['src/a.ts', 'test/a.test.ts'])).toEqual([]);
    expect(kindIssues('test', [])).toEqual([]);
    expect(commitType(story, task(), ['test/integration/doctor-process.test.ts'])).toBe('test');
    expect(commitType(story, task(), ['docs/x.md'])).toBe('docs');
    expect(commitType(story, task(), ['src/a.ts'])).toBe('feat');
    expect(commitType({ meta: { type: 'bug' } } as typeof story, task(), ['src/a.ts'])).toBe('fix');
  });

  test('mandao run commit refuses a kind the diff contradicts and commits a test-only task as ✅ test', async () => {
    const root = repo();
    mkdirSync(join(root, 'test'), { recursive: true });
    writeFileSync(join(root, 'test/skills.test.ts'), 'test("x", () => {});\n');
    const cfg = configSchema.parse(readConfig(root));
    const input = (kind: 'feat' | 'test') => {
      const spec = readSpec(join(root, SPEC));
      return {
        repo: root,
        specDir: spec.dir,
        config: cfg,
        story: spec.story!,
        tasks: spec.tasks.map((task) => (task.id === 'T2' ? { ...task, kind, files: ['test/skills.test.ts'] } : task)),
        progress: {
          ...spec.progress!,
          pending_commits: [
            {
              task: 'T2',
              subject: 'pin the skills list output',
              files: ['test/skills.test.ts'],
              manifest: changeManifest(root, spec.dir),
            },
          ],
        },
      };
    };
    expect(commitPending(input('feat')).error).toBe('T2: kind is feat but every changed file is a test: use test');
    expect(commitPending(input('test')).error).toBeUndefined();
    expect(git(root, 'log', '-1', '--format=%s')).toBe('✅ test(test): pin the skills list output');
  });

  test('mandao run tasks reports a task without a kind', async () => {
    const root = repo();
    await run(root, 'tasks', 'MDO-0001');
    expect(lastJson().issues).toEqual(
      expect.arrayContaining([expect.stringMatching(/^T1 declares no kind/), expect.stringMatching(/^T2 declares no kind/)]),
    );
  });
});

describe('#3: a FAIL keeps its reason', () => {
  test('FAIL without --reason is refused; with it the row says why', async () => {
    const root = repo();
    await expect(
      run(
        root,
        'checkpoint',
        'MDO-0001',
        '--task',
        'T2',
        '--verdict',
        'FAIL',
        '--harness',
        'claude',
        '--reviewer',
        'mandao-reviewer',
        '--review',
        reviewFile('FAIL'),
      ),
    ).rejects.toThrow(/--reason/);
    await run(
      root,
      'checkpoint',
      'MDO-0001',
      '--task',
      'T2',
      '--verdict',
      'FAIL',
      '--harness',
      'claude',
      '--reviewer',
      'mandao-reviewer',
      '--reason',
      'schema_version is not checked',
      '--review',
      reviewFile('FAIL'),
    );
    expect(readSpec(join(root, SPEC)).execution.at(-1)!.notes).toBe('FAIL: schema_version is not checked');
  });
});

describe('#4 and #6: commit-spec has fixed subjects, and close commits its documents', () => {
  test('close of a version 2 spec commits the changelog and lessons, not per-spec release or Kaizen documents', async () => {
    const root = repo();
    const story = join(root, SPEC, 'story.md');
    writeFileSync(story, readFileSync(story, 'utf8').replace(/^schema_version: 1$/m, 'schema_version: 2'));
    for (const [f, c] of Object.entries({
      'docs/CHANGELOG.md': '| MDO-0001 | line |\n',
      'docs/kaizen/lessons.md': '- a lesson\n',
      'docs/releases/MDO-0001/release-notes.md': 'notes\n',
      'docs/kaizen/MDO-0001.md': 'kaizen\n',
      'docs/constitution/CHANGELOG.md': 'entry\n',
      'src/AGENTS.md': 'guide\n',
      'src/unrelated.ts': 'export {};\n',
    })) {
      mkdirSync(dirname(join(root, f)), { recursive: true });
      writeFileSync(join(root, f), c);
    }
    writeFileSync(join(root, SPEC, 'close-summary.md'), 'closed\n');
    await run(root, 'commit-spec', 'MDO-0001', 'close');
    expect(git(root, 'show', '--name-only', '--format=', 'HEAD').split('\n').sort()).toEqual(
      [
        'docs/CHANGELOG.md',
        'docs/constitution/CHANGELOG.md',
        'docs/kaizen/lessons.md',
        `${SPEC}/close-summary.md`,
        `${SPEC}/story.md`,
        'src/AGENTS.md',
      ].sort(),
    );
    expect(lastJson().leftOut).toEqual(
      expect.arrayContaining(['docs/kaizen/MDO-0001.md', 'docs/releases/MDO-0001/release-notes.md', 'src/unrelated.ts']),
    );
  });

  test('close commits release docs, Kaizen, constitution and changed module guides with the spec; nothing else (version 1)', async () => {
    const root = repo();
    for (const [f, c] of Object.entries({
      'docs/releases/MDO-0001/release-notes.md': 'notes\n',
      'docs/kaizen/MDO-0001.md': 'kaizen\n',
      'docs/constitution/CHANGELOG.md': 'entry\n',
      'src/AGENTS.md': 'guide\n',
      'src/unrelated.ts': 'export {};\n',
    })) {
      mkdirSync(dirname(join(root, f)), { recursive: true });
      writeFileSync(join(root, f), c);
    }
    writeFileSync(join(root, SPEC, 'close-summary.md'), 'closed\n');
    await run(root, 'commit-spec', 'MDO-0001', 'close');
    expect(lastJson()).toMatchObject({ committed: true, header: '📝 docs(mandao): close MDO-0001 with release docs and Kaizen' });
    expect(git(root, 'show', '--name-only', '--format=', 'HEAD').split('\n').sort()).toEqual(
      [
        'docs/constitution/CHANGELOG.md',
        'docs/kaizen/MDO-0001.md',
        'docs/releases/MDO-0001/release-notes.md',
        `${SPEC}/close-summary.md`,
        'src/AGENTS.md',
      ].sort(),
    );
    expect(git(root, 'status', '--porcelain')).toBe('?? src/unrelated.ts');
  });

  test('specify and clarify get fixed, unambiguous subjects; an unknown step is refused', async () => {
    const root = repo();
    writeFileSync(join(root, SPEC, 'requirements.md'), `${readFileSync(join(root, SPEC, 'requirements.md'), 'utf8')}\n`);
    await run(root, 'commit-spec', 'MDO-0001', 'clarify');
    expect(lastJson().header).toBe('📝 docs(mandao): record the MDO-0001 clarification answers');
    await expect(run(root, 'commit-spec', 'MDO-0001', 'approve')).rejects.toThrow(
      /step must be one of specify, spec, clarify, tasks, verify, close/,
    );
  });
});
