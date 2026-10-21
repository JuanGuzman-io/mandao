// mandao-scans: none — copies the MDO-0001 fixture into temporary trees.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { recordedPremises } from '../../src/cli/run-premise.js';
import { writeYaml } from '../../src/engine/files.js';
import { recordFullRun } from '../../src/scripts/forced.js';
import { logDiscrepancies } from '../../src/writer/log-integrity.js';
import { makeTree } from '../helpers.js';
import { CACHE, filesUnder, git, history, OTHER_LAST, repo, run, SIX, SPEC, useLogEnv } from '../log-v2-helpers.js';

useLogEnv();

describe('S-3.1: a version 2 log is six committed files', () => {
  test('S-3.1: after attempts, gates, reviews and premises, git ls-files _log lists exactly the six files, in at most 1000 lines', async () => {
    const root = repo(2);
    await history(root);
    git(root, 'add', '-A');
    git(root, 'commit', '-qm', 'log');
    const tracked = git(root, 'ls-files', `${SPEC}/_log`).split('\n').filter(Boolean);
    expect(tracked.map((f) => f.split('/').at(-1)).sort()).toEqual(SIX);
    expect(tracked.every((f) => f.split('/').length === SPEC.split('/').length + 2)).toBe(true);
    const lines = tracked.reduce((n, f) => n + readFileSync(join(root, f), 'utf8').split('\n').length, 0);
    expect(lines).toBeLessThanOrEqual(1000);
  });

  test('S-3.1 (regression pin): a version 1 spec still keeps its per-attempt files in _log/', async () => {
    const root = repo(1);
    await history(root);
    const base = join(root, SPEC, '_log');
    const names = filesUnder(base).map((f) => f.slice(base.length + 1));
    expect(names).toEqual(expect.arrayContaining(['gates/T2-1.md', 'reviews/T2-1-review.md', 'reviews/T2-1-pack.md', 'premises/P1.md']));
    expect(existsSync(join(base, 'reviews.md'))).toBe(false);
  });
});

describe('S-3.2: the bulk stays in .mandao/cache/<ID>/, outside git', () => {
  test('S-3.2: the pack and the full gate output are written under .mandao/cache/MDO-0001/', async () => {
    const root = repo(2);
    await history(root);
    const cached = filesUnder(join(root, CACHE));
    expect(cached.some((f) => /pack/.test(f))).toBe(true);
    expect(cached.some((f) => readFileSync(f, 'utf8').includes(OTHER_LAST))).toBe(true);
    expect(filesUnder(join(root, SPEC, '_log')).some((f) => /pack/.test(f) || readFileSync(f, 'utf8').includes(OTHER_LAST))).toBe(false);
  });

  test('S-3.2/C1: git status does not show the cache, and the managed ignore block lists it', async () => {
    const root = repo(2);
    await history(root);
    expect(git(root, 'status', '--porcelain', '--untracked-files=all')).not.toContain('.mandao/cache');
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toContain('.mandao/cache/');
    expect(git(root, 'ls-files', '.mandao/cache')).toBe('');
  });
});

describe('logs.level: what close does with the cache', () => {
  test('logs.level: the default summary deletes the cache at close, full keeps it, and neither commits it', async () => {
    for (const level of ['summary', 'full'] as const) {
      const root = repo(2);
      if (level === 'full') {
        const config = parseYaml(readFileSync(join(root, '.mandao/config.yml'), 'utf8')) as Record<string, unknown>;
        writeYaml(join(root, '.mandao/config.yml'), { ...config, logs: { level } });
      }
      await history(root);
      expect(filesUnder(join(root, CACHE)).length).toBeGreaterThan(0);
      await run(root, 'close-summary', 'MDO-0001', '--closed');
      expect(existsSync(join(root, CACHE))).toBe(level === 'full');
      expect(git(root, 'status', '--porcelain', '--untracked-files=all')).not.toContain('.mandao/cache');
    }
  });
});

describe('S-3.3: every reader gives the same answer on both versions of one history', () => {
  /** Normalised so the two trees compare: their roots, timestamps and short hashes differ. */
  const norm = (value: unknown, root: string) =>
    JSON.stringify(value)
      .split(root)
      .join('<root>')
      .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g, '<at>')
      .replace(/\b[0-9a-f]{7,64}\b/g, '<sha>');

  async function answers(version: 1 | 2) {
    const root = repo(version);
    await history(root);
    const a = {
      trace: await run(root, 'trace', 'MDO-0001'),
      verifyPlan: await run(root, 'verify-plan', 'MDO-0001'),
      summary: await run(root, 'implement-summary', 'MDO-0001'),
      kaizen: await run(root, 'kaizen', 'MDO-0001'),
      compare: await run(root, 'kaizen-compare'),
      next: (await run(root, 'next', 'MDO-0001')).recommended,
      resume: await run(root, 'step', 'MDO-0001', 'T2', '--harness', 'claude', '--no-brief'),
    };
    return { root, text: norm(a, root), a };
  }

  test('S-3.3: trace, verify-plan, implement-summary, kaizen, kaizen-compare and next', async () => {
    const [v1, v2] = [await answers(1), await answers(2)];
    expect(v2.a.summary.tasks.find((t: { id: string }) => t.id === 'T2')).toMatchObject({ attempts: 2, verdict: 'PASS', committed: true });
    expect(v2.text).toBe(v1.text);
  });

  test('S-3.3/C2: the integrity check sees a hand edit of a log on both versions, and nothing before it', async () => {
    for (const version of [1, 2] as const) {
      const root = repo(version);
      const dir = await history(root);
      expect(logDiscrepancies(dir)).toEqual([]);
      writeFileSync(join(dir, '_log/execution.md'), `${readFileSync(join(dir, '_log/execution.md'), 'utf8')}\nedited by hand\n`);
      expect(logDiscrepancies(dir).join(' ')).toContain('execution.md');
    }
  });
});

describe('S-3.4: what must not be lost stays in the committed log', () => {
  test('S-3.4: reviews.md has the FAIL verdict and findings, gates.md the failing output of the task files, state.yml the approval, premises.md the exit and excerpt', async () => {
    const root = repo(2);
    const dir = await history(root);
    const log = (f: string) => readFileSync(join(dir, '_log', f), 'utf8');
    expect(log('reviews.md')).toContain('VERDICT: FAIL');
    expect(log('reviews.md')).toContain('B1: `skills ls` is not registered as an alias.');
    const gates = log('gates.md');
    expect(gates).toContain('src/cli/skills.ts(');
    expect(gates).not.toContain('src/other/noise.ts(');
    expect(gates.split('\n').filter((l) => l.startsWith('src/cli/skills.ts(')).length).toBeLessThanOrEqual(40);
    const approvals = (parseYaml(log('state.yml')) as { approvals: Record<string, unknown>[] }).approvals;
    expect(approvals.at(-1)).toMatchObject({ step: 'design', words: 'go ahead, looks right', sha256: expect.any(Object) });
    const premises = log('premises.md');
    expect(premises).toMatch(/Exit: 0/);
    expect(premises).toContain('pinned P1');
    expect(premises).toContain('pinned P2');
  });

  test('S-3.4/C3: the readers find a recorded premise in premises.md, so a premise run is not lost', () => {
    const root = makeTree({
      'spec/story.md': '---\nschema_version: 2\nid: MDO-0001\n---\n# X\n',
      'spec/_log/premises.md': '# Premises\n\n## P1 — run\n\n- Command: `node -e "1"`\n- Exit: 0\n\n```\npinned: 2\n```\n',
    });
    expect([...recordedPremises(join(root, 'spec'))]).toEqual(['P1']);
  });
});

describe('MDO-0007 on a version 2 spec: a forced full run is a section of execution.md', () => {
  test('S-3.1: recordFullRun lands in "## Full runs" of execution.md and adds no file to _log/', () => {
    const root = repo(2);
    const names = () => filesUnder(join(root, SPEC, '_log')).map((f) => f.split('/').at(-1)!);
    const before = names();
    recordFullRun(
      root,
      { at: '2026-01-01T00:00:00.000Z', project: 'mandao', reason: 'migrating the runner', status: 'PASS' },
      join(root, SPEC),
    );
    const execution = readFileSync(join(root, SPEC, '_log/execution.md'), 'utf8');
    expect(execution).toContain('## Full runs');
    expect(execution.slice(execution.indexOf('## Full runs'))).toContain('migrating the runner');
    expect(names().filter((f) => !before.includes(f))).toEqual([]);
    expect(existsSync(join(root, SPEC, '_log/full-runs.md'))).toBe(false);
    expect(existsSync(join(root, SPEC, 'full-runs.md'))).toBe(false);
  });

  test('S-3.3: a version 1 spec still gets full-runs.md', () => {
    const root = repo(1);
    recordFullRun(root, { at: '2026-01-01T00:00:00.000Z', project: 'mandao', reason: 'why not', status: 'PASS' }, join(root, SPEC));
    expect(readFileSync(join(root, SPEC, '_log/full-runs.md'), 'utf8')).toContain('why not');
  });
});

describe('security: a story id that is a path never reaches outside .mandao/cache/', () => {
  const survivors = (root: string) =>
    ['.mandao/config.yml', 'package.json', 'src/cli/skills.ts', '.git/HEAD'].map((f) => existsSync(join(root, f)));

  test.each(['..', '../..', '../../x', 'MDO-0001/../..', 'mdo-1'])(
    'close-summary --closed with id %s deletes nothing outside the cache',
    async (id) => {
      const root = repo(2);
      const story = join(root, SPEC, 'story.md');
      writeFileSync(story, readFileSync(story, 'utf8').replace(/^id: .*$/m, `id: '${id}'`));
      await run(root, 'close-summary', 'MDO-0001', '--closed').catch(() => undefined);
      expect(survivors(root)).toEqual([true, true, true, true]);
    },
  );

  test('a story id that is a path writes no log or hash outside .mandao/cache/', async () => {
    const root = repo(2);
    const story = join(root, SPEC, 'story.md');
    writeFileSync(story, readFileSync(story, 'utf8').replace(/^id: .*$/m, "id: '../..'"));
    const before = readdirSync(root).sort();
    await run(root, 'premise', 'MDO-0001', 'P1', '--', 'node', '-e', '"1"').catch(() => undefined);
    expect(readdirSync(root).sort()).toEqual(before);
    expect(existsSync(join(root, 'integrity.json'))).toBe(false);
  });
});
