import { execFileSync } from 'node:child_process';
import { realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { branchingFindings } from '../../src/engine/doctor-specs.js';
import { configSchema, resolveBranching } from '../../src/schemas/index.js';
import { branchingFor, detectBranching, specBranch } from '../../src/scripts/branching.js';
import { commitPending } from '../../src/scripts/commits.js';
import { proposeSpec } from '../../src/scripts/spec.js';
import { initTestRepo, makeTree } from '../helpers.js';

const config = (extra: Record<string, unknown> = {}) =>
  configSchema.parse({ schema_version: 1, workspace: 'single', projects: [{ name: 'shop', path: '.' }], harnesses: ['claude'], ...extra });
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

beforeEach(() => {
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
  for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
});
afterEach(() => vi.unstubAllEnvs());

function repo(branches: string[] = []) {
  const root = realpathSync(makeTree({ 'README.md': 'x\n' }));
  initTestRepo(root, '-q', '-b', 'main');
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'init');
  for (const b of branches) git(root, 'branch', b);
  return root;
}

describe('presets (ADR 0023)', () => {
  test('each model has its base, prefixes, hotfix and protected branches; fields override the preset', () => {
    expect(resolveBranching({ model: 'gitflow' })).toMatchObject({
      base: 'develop',
      prefixes: { feature: 'feature/', fix: 'bugfix/', hotfix: 'hotfix/', release: 'release/' },
      hotfix: { from: 'main', merge_to: ['main', 'develop'] },
      protected: ['main', 'develop'],
    });
    expect(resolveBranching({ model: 'env-branches' })).toMatchObject({ base: 'test', promotion: ['test', 'staging', 'main'] });
    expect(resolveBranching({ model: 'trunk' }).max_branch_age_days).toBe(2);
    expect(resolveBranching({ model: 'feature-branch', max_branch_age_days: 5 }).max_branch_age_days).toBeUndefined();
    expect(resolveBranching({ model: 'gitflow', base: 'dev', prefixes: { feature: 'feat/' } })).toMatchObject({
      base: 'dev',
      prefixes: { feature: 'feat/', fix: 'bugfix/' },
    });
  });

  test('names carry the ID with the prefix for the spec type; polyrepo projects can override', () => {
    const gitflow = config({ branching: { model: 'gitflow' } });
    const b = branchingFor(gitflow);
    expect(specBranch(gitflow, b, { id: 'PROJ-1', slug: 'login' })).toBe('feature/PROJ-1-login');
    expect(specBranch(gitflow, b, { id: 'PROJ-2', slug: 'crash', type: 'bug' })).toBe('bugfix/PROJ-2-crash');
    expect(specBranch(gitflow, b, { id: 'PROJ-3', slug: 'outage', hotfix: true })).toBe('hotfix/PROJ-3-outage');
    const poly = config({ branching: { model: 'gitflow' }, projects: [{ name: 'api', path: '.', branching: { model: 'trunk' } }] });
    expect(branchingFor(poly, 'api').base).toBe('main');
    expect(branchingFor(poly).base).toBe('develop');
  });

  test('detection: develop or release/* → gitflow, test or staging → env-branches, only main → ask', () => {
    expect(detectBranching(['main', 'develop']).suggested).toBe('gitflow');
    expect(detectBranching(['main', 'release/1.2']).suggested).toBe('gitflow');
    expect(detectBranching(['main', 'staging', 'test']).suggested).toBe('env-branches');
    expect(detectBranching(['main']).suggested).toBeUndefined();
    expect(detectBranching(['main']).ask).toEqual(['trunk', 'feature-branch']);
  });
});

describe('branching in a repository', () => {
  test('spec-new starts the worktree from the base and says when the base is missing', () => {
    const root = repo(['develop']);
    const p = proposeSpec(root, config({ branching: { model: 'gitflow' } }), 'Remember me', { id: 'PROJ-9' });
    expect(p).toMatchObject({ branch: 'feature/PROJ-9-remember-me', base: 'develop', issues: [] });
    expect(p.command).toMatch(/^git worktree add -b feature\/PROJ-9-remember-me ".*PROJ-9-remember-me" develop$/);
    const env = proposeSpec(root, config({ branching: { model: 'env-branches' } }), 'Remember me', { id: 'PROJ-9' });
    expect(env.issues[0]).toMatch(/base branch "test" does not exist here/);
  });

  test('never commits on a protected branch', () => {
    const root = repo();
    const run = commitPending({
      repo: root,
      specDir: join(root, 'specs/x'),
      config: config(),
      story: {} as never,
      tasks: [],
      progress: {
        schema_version: 1,
        spec: 'x',
        updated_at: 'now',
        current: null,
        open_questions: [],
        next_step: '',
        deferred_to_ci: [],
        red_tests: [],
        pending_commits: [{ task: 'T1', subject: 's', files: [] }],
        approved_manifests: [],
      },
      protectedBranches: ['main'],
    });
    expect(run.error).toMatch(/^main is a protected branch/);
  });

  test('trunk: doctor warns about a spec branch older than max_branch_age_days', () => {
    const root = repo();
    git(root, 'checkout', '-qb', 'feat/MDO-0001-old');
    writeFileSync(join(root, 'a.txt'), 'a\n');
    git(root, 'add', '.');
    git(root, 'commit', '-qm', 'work');
    git(root, 'checkout', '-q', 'main');
    const inFiveDays = Date.now() + 5 * 86_400_000;
    expect(branchingFindings(root, config({ branching: { model: 'trunk' } }), inFiveDays)).toEqual([
      expect.objectContaining({ level: 'warn', message: 'branching: feat/MDO-0001-old is 5 days old; trunk keeps branches under 2 days' }),
    ]);
    expect(branchingFindings(root, config(), inFiveDays)).toEqual([]);
  });
});

describe('hotfix lane (ADR 0030)', () => {
  test('a hotfix story expects the hotfix branch, from hotfix.from', async () => {
    const { expectedPlace } = await import('../../src/scripts/spec.js');
    const root = repo(['develop']);
    const cfg = config({ branching: { model: 'gitflow' } });
    const p = proposeSpec(root, cfg, 'Outage on login', { id: 'PROJ-7', hotfix: true });
    expect(p).toMatchObject({ branch: 'hotfix/PROJ-7-outage-on-login', base: 'main' });
    const spec = {
      dir: root,
      name: 'PROJ-7-outage-on-login',
      tasks: [],
      execution: [],
      issues: [],
      story: { meta: { lane: 'hotfix', type: 'bug' } },
    } as never;
    expect(expectedPlace(root, cfg, spec).branch).toBe('hotfix/PROJ-7-outage-on-login');
    expect(branchingFor(cfg).hotfix.merge_to).toEqual(['main', 'develop']);
  });
});
