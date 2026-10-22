// mandao-scans: specs/ — copies the MDO-0001 spec folder into temporary trees.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { cutAdvice, recordCutEstimate } from '../../src/scripts/session-cut.js';
import { measureSessions } from '../../src/scripts/session-turns.js';
import { readSpec } from '../../src/scripts/spec.js';
import { withStatus } from '../../src/spec/index.js';
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
  // A missing command argument must fail the test, not end the test process.
  vi.spyOn(process, 'exit').mockImplementation(((c?: number) => {
    throw new Error(`process.exit(${c})`);
  }) as never);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

/** The fixture as a spec of layout `version`, documents in draft, log in `_log/`, committed on the spec branch. */
function repo(version: 1 | 2) {
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
  const dir = join(root, SPEC);
  for (const f of ['story.md', 'requirements.md', 'tasks.md']) {
    writeFileSync(join(dir, f), withStatus(readFileSync(join(dir, f), 'utf8'), 'draft'));
  }
  const story = readFileSync(join(dir, 'story.md'), 'utf8').replace(/^schema_version: 1$/m, `schema_version: ${version}`);
  writeFileSync(join(dir, 'story.md'), story);
  mkdirSync(join(dir, '_log'));
  for (const f of ['execution.md', 'progress.yml']) renameSync(join(dir, f), join(dir, '_log', f));
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}
const specFile = (root: string, f: string) => join(root, SPEC, f);
const read = (root: string, f: string) => readFileSync(specFile(root, f), 'utf8');
const state = (root: string) => parseYaml(read(root, '_log/state.yml')) as Record<string, unknown>;
const cli = (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', ...args]);
const lastJson = () => JSON.parse(out.at(-1)!);

describe('S-3.5: approvals live in state.yml and show in the timeline', () => {
  /** Execution rows on 18 and 20 October, approvals on 17, 19 and 21: the dates alternate. */
  function withEvents(root: string) {
    const exec = read(root, '_log/execution.md').replace('| 2026-10-20 | T1 |', '| 2026-10-18 | T1 |');
    writeFileSync(specFile(root, '_log/execution.md'), exec);
    const rows = [
      ['story', '2026-10-17T09:00:00.000Z'],
      ['design', '2026-10-19T09:00:00.000Z'],
      ['tasks', '2026-10-21T09:00:00.000Z'],
    ];
    const yaml = rows.map(([step, at]) => `  - step: ${step}\n    by: Ana PO\n    at: "${at}"\n`).join('');
    writeFileSync(specFile(root, '_log/state.yml'), `approvals:\n${yaml}`);
  }
  /** ASSUMPTION: both commands print a `timeline` array whose entries mention their step or task. */
  const positions = (timeline: unknown[]) => {
    const text = timeline.map((e) => JSON.stringify(e));
    const at = (needle: RegExp) => text.findIndex((t) => needle.test(t));
    return [at(/"story"/), at(/"T1"/), at(/"design"/), at(/"T2"/), at(/"tasks"/)];
  };
  const expectInDateOrder = (timeline: unknown[]) => {
    const p = positions(timeline);
    expect(p.every((i) => i >= 0)).toBe(true);
    expect(p).toEqual([...p].sort((a, b) => a - b));
  };

  test('S-3.5: run status without a target lists approvals by date among the execution rows', async () => {
    const root = repo(2);
    withEvents(root);
    await cli(root, 'run', 'status', 'MDO-0001');
    expectInDateOrder(lastJson().timeline);
  });

  test('S-3.5: implement-summary shows the same timeline', async () => {
    const root = repo(2);
    withEvents(root);
    await cli(root, 'run', 'implement-summary', 'MDO-0001');
    expectInDateOrder(lastJson().timeline);
  });

  test('S-3.5/C1: showing the timeline writes nothing, and approving writes no row into execution.md', async () => {
    const root = repo(2);
    withEvents(root);
    const before = [read(root, '_log/execution.md'), read(root, '_log/state.yml')];
    await cli(root, 'run', 'status', 'MDO-0001');
    expect(lastJson().timeline).toBeDefined();
    expect([read(root, '_log/execution.md'), read(root, '_log/state.yml')]).toEqual(before);

    await cli(root, 'approve', 'MDO-0001', 'design');
    expect(read(root, '_log/execution.md')).toBe(before[0]);
    expect((state(root).approvals as { step: string }[]).map((a) => a.step)).toEqual(['story', 'design', 'tasks', 'design']);
  });
});

describe('T3 writers: a version 2 spec keeps its logs in state.yml, a version 1 spec in its own files', () => {
  test('approve writes the approvals section of state.yml and no approvals.yml', async () => {
    const root = repo(2);
    await cli(root, 'approve', 'MDO-0001', 'design');
    expect(state(root).approvals).toEqual([expect.objectContaining({ step: 'design', by: 'Ana PO', at: expect.any(String) })]);
    expect(existsSync(specFile(root, '_log/approvals.yml'))).toBe(false);
    expect(existsSync(specFile(root, 'approvals.yml'))).toBe(false);
  });

  test('run next --shown records the shown hashes in state.yml and no approvals.yml', async () => {
    const root = repo(2);
    await cli(root, 'run', 'next', 'MDO-0001', '--shown');
    const approvals = state(root).approvals as { step: string; sha256: Record<string, string> }[];
    expect(approvals).toEqual([
      expect.objectContaining({ step: 'shown', sha256: expect.objectContaining({ 'story.md': expect.any(String) }) }),
    ]);
    expect(existsSync(specFile(root, '_log/approvals.yml'))).toBe(false);
  });

  test('checkpoint writes the progress section, keeps the approvals, and readSpec still reads the progress', async () => {
    const root = repo(2);
    await cli(root, 'approve', 'MDO-0001', 'design');
    const checkpoint = ['run', 'checkpoint', 'MDO-0001', '--task', 'T2', '--verdict', 'REPORTED', '--harness', 'claude'];
    await cli(root, ...checkpoint, '--implementer', 'mandao-implementer-standard');
    const s = state(root);
    expect(s.progress).toMatchObject({ spec: 'MDO-0001-skills-list' });
    expect((s.approvals as unknown[]).length).toBe(1);
    // The old file is no longer written: the fixture's progress.yml keeps the content it had.
    expect(read(root, '_log/progress.yml')).not.toContain('mandao-implementer-standard');
    expect(readSpec(join(root, SPEC)).progress?.spec).toBe('MDO-0001-skills-list');
  });

  test('(regression pin) a version 1 spec still writes approvals.yml and no state.yml: older specs are read as they are', async () => {
    const root = repo(1);
    await cli(root, 'approve', 'MDO-0001', 'design');
    expect(existsSync(specFile(root, '_log/approvals.yml'))).toBe(true);
    expect(existsSync(specFile(root, '_log/state.yml'))).toBe(false);
  });

  test('cut estimates go to the cut_estimates section, and Kaizen reads them from there', () => {
    const root = makeTree({
      'spec/story.md': '---\nschema_version: 2\nid: MDO-0001\n---\n# X\n',
      'spec/_log/costs.yml': 'costs: []\n',
    });
    const specDir = join(root, 'spec');
    const now = Date.parse('2026-10-20T21:00:00Z');
    const opus = { input: 4, cache_write_5m: 5, cache_write_1h: 8, cache_read: 0.2, output: 20 };
    const session = { model: 'claude-opus-5-5', first: 33_865, last: 125_542, lastAt: now - 60_000, ttl: '1h' as const };
    recordCutEstimate(specDir, {
      at: '2026-10-20T20:00:00.000Z',
      task: 'T2',
      session,
      tasksLeft: 1,
      advice: cutAdvice(session, 1, opus, now),
      decision: 'go on',
    });
    const written = parseYaml(readFileSync(join(specDir, '_log/state.yml'), 'utf8')) as { cut_estimates: unknown[] };
    expect(written.cut_estimates).toEqual([expect.objectContaining({ task: 'T2' })]);
    expect(existsSync(join(specDir, '_log/session-cuts.md'))).toBe(false);
    const measured = measureSessions({ specDir, commitTimes: new Map(), home: join(root, 'no-home') });
    expect(measured.estimates).toEqual([{ at: '2026-10-20T20:00:00.000Z', task: 'T2', estimated: 43, actual: undefined }]);
  });

  test('a version 2 session-cut boundary is persisted and can be suggested only once', () => {
    const root = makeTree({
      'spec/story.md': '---\nschema_version: 2\nid: MDO-0001\n---\n# X\n',
      'spec/_log/costs.yml': 'costs: []\n',
    });
    const specDir = join(root, 'spec');
    const now = Date.parse('2026-10-20T21:00:00Z');
    const opus = { input: 4, cache_write_5m: 5, cache_write_1h: 8, cache_read: 0.2, output: 20 };
    const session = { model: 'claude-opus-5-5', first: 33_865, last: 125_542, lastAt: now - 60_000, ttl: '1h' as const };
    const row = {
      at: '2026-10-20T20:00:00.000Z',
      task: 'T2',
      session,
      tasksLeft: 1,
      advice: cutAdvice(session, 1, opus, now),
      decision: 'stop: suggest a new session',
      boundaryId: 'implement:T2',
      suggest: true,
    };
    expect(recordCutEstimate(specDir, row)).toBe(true);
    expect(recordCutEstimate(specDir, { ...row, at: '2026-10-20T20:01:00.000Z' })).toBe(false);
    const estimates = parseYaml(readFileSync(join(specDir, '_log/state.yml'), 'utf8')).cut_estimates as {
      boundary_id?: string;
      suggested?: boolean;
    }[];
    expect(estimates).toHaveLength(2);
    expect(estimates[0]).toMatchObject({ boundary_id: 'implement:T2', suggested: true });
    expect(estimates[1]).toMatchObject({ boundary_id: 'implement:T2', decision: 'go on: suggestion already shown at boundary' });
  });
});

describe('T3 readers: next and approve read the hashes and shown rows from state.yml on version 2', () => {
  const settled = (root: string) => {
    for (const f of ['story.md', 'requirements.md', 'tasks.md']) {
      writeFileSync(specFile(root, f), withStatus(read(root, f), 'approved'));
    }
  };
  const append = (root: string, f: string, add: string) => writeFileSync(specFile(root, f), `${read(root, f)}\n${add}\n`);
  const next = async (root: string, ...more: string[]) => {
    await cli(root, 'run', 'next', 'MDO-0001', ...more);
    return lastJson();
  };

  test('a story changed after its approval is reported by run next (hashes read from state.yml)', async () => {
    const root = repo(2);
    settled(root);
    await cli(root, 'approve', 'MDO-0001', 'story');
    expect((state(root).approvals as { sha256?: Record<string, string> }[])[0]!.sha256).toHaveProperty('story.md');
    append(root, 'story.md', 'A line added after the approval.');
    const n = await next(root);
    expect(n.recommended.reason).toContain('story.md changed after its approval');
  });

  test('approve --by-running asks about a document changed after the summary was shown (shown row read from state.yml)', async () => {
    const root = repo(2);
    settled(root);
    await next(root, '--shown');
    append(root, 'story.md', 'A line added after the summary was shown.');
    const before = read(root, '_log/state.yml');
    await cli(root, 'approve', 'MDO-0001', 'tasks', '--by-running', '/mandao-implement');
    const r = lastJson();
    expect(r.result).toBe('ask');
    expect(JSON.stringify(r)).toContain('story.md');
    expect(read(root, '_log/state.yml')).toBe(before);
  });
});

describe('T3 Kaizen: a schema error in state.yml is not swallowed', () => {
  test('cutEstimateRows on a version 2 spec with a bad approval row surfaces the schema error', () => {
    const root = makeTree({
      'spec/story.md': '---\nschema_version: 2\nid: MDO-0001\n---\n# X\n',
      'spec/_log/costs.yml': 'costs: []\n',
      'spec/_log/state.yml': 'approvals:\n  - step: not-a-step\n    by: Ana\n    at: "2026-10-20T20:00:00.000Z"\n',
    });
    const specDir = join(root, 'spec');
    expect(() => measureSessions({ specDir, commitTimes: new Map(), home: join(root, 'no-home') })).toThrow();
  });
});

describe('mandao start in a new (version 2) spec', () => {
  function startRepo() {
    const root = realpathSync(makeTree({ 'package.json': pkg('shop'), 'README.md': 'x\n', '.gitignore': '.worktrees/\n' }));
    git(root, 'init', '-q', '-b', 'main');
    const typecheck = 'node -e "console.log(\'error TS1: broken on main\'); process.exit(2)"';
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'shop', path: '.', gates: { typecheck } }],
      harnesses: ['claude'],
      paths: { worktrees: '.worktrees' },
    });
    git(root, 'add', '.');
    git(root, 'commit', '-qm', 'base');
    return root;
  }

  test('the request and the baseline go to state.yml; start.yml and baseline.md are not written', async () => {
    const root = startRepo();
    await cli(root, 'start', 'Add', 'a', 'login', 'rate', 'limit', '--no-install', '--json');
    const r = lastJson();
    const log = join(r.worktree as string, `specs/${r.id}-add-a-login-rate-limit`, '_log');
    const s = parseYaml(readFileSync(join(log, 'state.yml'), 'utf8')) as Record<string, unknown>;
    expect(JSON.stringify(s.start)).toContain('Add a login rate limit');
    const baseline = JSON.stringify(s.baseline);
    expect(baseline).toContain('typecheck');
    expect(baseline).toContain('FAIL');
    expect(baseline).toContain('error TS1: broken on main');
    expect(existsSync(join(log, 'start.yml'))).toBe(false);
    expect(existsSync(join(log, 'baseline.md'))).toBe(false);
  });
});

describe('costs.yml keeps one cumulative per role (C-2)', () => {
  const sonnetSession = (home: string, id: string, usd: number) => {
    const dir = join(home, 'projects', '-tmp-proj');
    mkdirSync(dir, { recursive: true });
    const usage = { output_tokens: usd * 100_000 };
    writeFileSync(join(dir, `${id}.jsonl`), JSON.stringify({ message: { id: 'm1', model: 'claude-sonnet-5-5', usage } }));
  };
  const earlier = (extra: string, models = '{}') =>
    `costs:\n  - at: 2026-01-05T10:00:00.000Z\n    command: implement\n    harness: claude\n    session: s9\n    usd: 9\n    roles:\n      leader: 9\n    models: ${models}\n    cumulative:\n      main-session: 9\n${extra}    source: claude-code\n`;

  function costRepo(prior: string, version: 1 | 2) {
    const root = realpathSync(makeTree({}));
    const home = realpathSync(makeTree({}));
    vi.stubEnv('CLAUDE_CONFIG_DIR', home);
    vi.stubEnv('MANDAO_COST_BASIS', 'equivalent');
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'a', path: '.' }],
      harnesses: ['claude'],
    });
    mkdirSync(join(root, 'specs/MDO-0009-y/_log'), { recursive: true });
    writeFileSync(join(root, 'specs/MDO-0009-y/story.md'), `---\nschema_version: ${version}\nid: MDO-0009\n---\n# Y\n`);
    writeFileSync(join(root, 'specs/MDO-0009-y/_log/costs.yml'), prior);
    sonnetSession(home, 's9', 9.5);
    return root;
  }

  test('a new entry has cumulative per role and no per-model lines', async () => {
    const root = costRepo('costs: []\n', 2);
    await cli(root, 'run', 'cost', 'MDO-0009', '--record', '--command', 'implement', '--session', 's9');
    const file = readFileSync(join(root, 'specs/MDO-0009-y/_log/costs.yml'), 'utf8');
    const entries = (parseYaml(file) as { costs: { cumulative: Record<string, number> }[] }).costs;
    const cumulative = entries.at(-1)!.cumulative;
    expect(Object.keys(cumulative)).toContain('main-session');
    expect(Object.keys(cumulative).filter((k) => k.startsWith('model:'))).toEqual([]);
  });

  test('(regression pin) the cross-spec baseline gives 0.5 from a version 1 record with model lines and from a version 2 record without', async () => {
    const cases = [
      ['      "model:claude-sonnet-5-5": 9\n', 1],
      ['', 2],
    ] as const;
    for (const [extra, version] of cases) {
      const root = costRepo(earlier(extra), version);
      mkdirSync(join(root, 'specs/quick'), { recursive: true });
      await cli(root, 'run', 'cost', 'quick', '--record', '--command', 'quick', '--session', 's9');
      expect(lastJson().recorded).toMatchObject({ usd: 0.5, roles: { quick: 0.5 } });
    }
  });

  test('a version 2 record followed by a quick entry counts only the new model spend (0.5, not the whole session)', async () => {
    const root = costRepo(earlier('', "{ 'claude-sonnet-5-5': 9 }"), 2);
    mkdirSync(join(root, 'specs/quick'), { recursive: true });
    await cli(root, 'run', 'cost', 'quick', '--record', '--command', 'quick', '--session', 's9');
    const file = readFileSync(join(root, 'specs/quick/_log/costs.yml'), 'utf8');
    const entries = (parseYaml(file) as { costs: { models: Record<string, number> }[] }).costs;
    expect(entries.at(-1)!.models).toEqual({ 'claude-sonnet-5-5': 0.5 });
  });
});
