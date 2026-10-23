// mandao-scans: none — copies the MDO-0001 fixture into temporary trees.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { writeYaml } from '../../src/engine/files.js';
import { makeTree } from '../helpers.js';
import {
  CACHE,
  filesUnder,
  git,
  lastOut,
  NOISY_GATE,
  REVIEW_FAIL,
  REVIEW_PASS,
  repo,
  run,
  SIX,
  SPEC,
  useLogEnv,
} from '../log-v2-helpers.js';

useLogEnv();

// ---- Rework 2: the Done-when history at full size, the version 2 full-run path, a story id that is a path ----

const CODE = 'export const answer = 42;\n';
const IMPACTED = `node -e "process.exit(require('fs').readFileSync('src/code.js','utf8').includes('MUTATED')?1:0)" {files}`;
const T3 = `
### [ ] T3 — Pin the alias

\`\`\`yaml
project: mandao
tier: standard
kind: test
characterization: true
files: [test/a.test.ts]
exemplar: src/cli/skills.ts
ac: [AC-2]
scenarios: [S-2.1]
tests: { unit: [pins the alias] }
verify: npx vitest run test/a.test.ts
depends_on: []
\`\`\`
`;
const bigFile = (tag: string, n = 5000) => `${Array.from({ length: n }, (_, i) => `export const ${tag}_${i} = ${i};`).join('\n')}\n`;
const lineCount = (f: string) => readFileSync(f, 'utf8').split('\n').length;

/** A version 2 repo with three tasks (T3 is characterization), a failing 10,000-line gate and a gate whose tool is not installed. */
function wideRepo() {
  const root = repo(2);
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [
      {
        name: 'mandao',
        path: '.',
        gates: { typecheck: NOISY_GATE, secrets: 'mandao-no-such-tool-xyz --scan', build: 'node -e "process.exit(0)"' },
        tests: { impacted: IMPACTED },
      },
    ],
    harnesses: ['claude'],
    // The gate must run wherever the suite runs: a busy CI runner would otherwise defer it, with no output.
    resources: { min_free_memory_mb: 0 },
  });
  const tasks = join(root, SPEC, 'tasks.md');
  writeFileSync(tasks, `${readFileSync(tasks, 'utf8').replace('### [x] T1', '### [ ] T1').trimEnd()}\n${T3}`);
  mkdirSync(join(root, 'test'), { recursive: true });
  writeFileSync(join(root, 'src/code.js'), CODE);
  writeFileSync(join(root, 'test/a.test.ts'), 'export {};\n');
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'three tasks');
  return root;
}

/** The mutation patch: src/code.js with MUTATED in it, as a unified diff. */
function mutationPatch(root: string) {
  writeFileSync(join(root, 'src/code.js'), 'export const answer = "MUTATED";\n');
  const diff = execFileSync('git', ['diff', '--', 'src/code.js'], { cwd: root, encoding: 'utf8' });
  git(root, 'checkout', '--', 'src/code.js');
  const file = join(makeTree({}), 'm.patch');
  writeFileSync(file, diff);
  return file;
}

/** One attempt at task `t`: a 5,000-line change, gates, a pack, a mutation for T3's first, then FAIL (first) or PASS. */
async function wideAttempt(root: string, t: string, attempt: number) {
  const T = ['--task', t, '--harness', 'claude'];
  const file = t === 'T3' ? 'test/a.test.ts' : 'src/cli/skills.ts';
  await run(root, 'checkpoint', 'MDO-0001', ...T, '--verdict', 'STARTED', '--tier', 'standard');
  writeFileSync(join(root, file), bigFile(`${t}a${attempt}`));
  await run(root, 'gates', 'MDO-0001', t);
  await run(root, 'review-pack', 'MDO-0001', t);
  if (t === 'T3' && attempt === 1) {
    await run(root, 'mutation', 'MDO-0001', 'T3', 'test/a.test.ts', '--patch', mutationPatch(root));
    expect(lastOut()).toMatchObject({ recorded: true });
  }
  const review = join(makeTree({}), `review-${t}-${attempt}.txt`);
  writeFileSync(review, attempt === 1 ? REVIEW_FAIL : REVIEW_PASS);
  const verdict =
    attempt === 1 ? ['--verdict', 'FAIL', '--reason', 'B1: alias missing'] : ['--verdict', 'PASS', '--pending-commit', `finish ${t}`];
  await run(root, 'checkpoint', 'MDO-0001', ...T, ...verdict, '--reviewer', 'self', '--implementer', 'self', '--review', review);
}

/** 3 tasks x 2 attempts: a 10,000-line failing gate, a 5,000-line change (so a 5,000-line pack) per attempt, FAIL then PASS, a mutation, 2 premises. */
async function wideHistory(root: string) {
  const long = "for(let i=1;i<=100;i++)console.log('line '+i)";
  for (const p of ['P1', 'P2']) await run(root, 'premise', 'MDO-0001', p, '--', 'node', '-e', long);
  for (const t of ['T1', 'T2', 'T3']) {
    for (const attempt of [1, 2]) await wideAttempt(root, t, attempt);
    await run(root, 'commit', 'MDO-0001');
  }
}

describe('S-3.1 at the Done-when size: 3 tasks x 2 attempts, a mutation, 2 premises, 10,000-line gate, 5,000-line pack', {
  timeout: 60_000,
}, () => {
  test('S-3.1: every task commit touches only the six files in _log/, and the committed _log is at most 1000 lines', async () => {
    const root = wideRepo();
    await wideHistory(root);
    git(root, 'add', '-A');
    if (git(root, 'status', '--porcelain')) git(root, 'commit', '-qm', 'log');
    const tracked = git(root, 'ls-files', `${SPEC}/_log`).split('\n').filter(Boolean);
    expect(tracked.map((f) => f.split('/').at(-1)).sort()).toEqual(SIX);
    const touched = git(root, 'log', '--name-only', '--format=', '--', `${SPEC}/_log`).split('\n').filter(Boolean);
    expect(touched.length).toBeGreaterThan(0);
    expect(touched.every((f) => SIX.includes(f.split('/').at(-1)!) && f.split('/').length === SPEC.split('/').length + 2)).toBe(true);
    expect(tracked.reduce((n, f) => n + lineCount(join(root, f)), 0)).toBeLessThanOrEqual(1000);
  });

  test('S-3.2: a pack per attempt, the full 10,000-line gate output and the mutation are in the cache, none in _log/', async () => {
    const root = wideRepo();
    await wideHistory(root);
    const cached = filesUnder(join(root, CACHE));
    expect(cached.filter((f) => /pack/.test(f)).length).toBeGreaterThanOrEqual(6);
    expect(cached.some((f) => lineCount(f) >= 10000)).toBe(true);
    expect(cached.some((f) => /mutations\/T3-1\.md$/.test(f))).toBe(true);
    expect(filesUnder(join(root, SPEC, '_log')).some((f) => /pack|mutations/.test(f))).toBe(false);
    expect(git(root, 'status', '--porcelain', '--untracked-files=all')).not.toContain('.mandao/cache');
  });

  test('S-3.1: the mutation is a MUTANT row in execution.md and its evidence path points into the cache', async () => {
    const root = wideRepo();
    await wideHistory(root);
    const execution = readFileSync(join(root, SPEC, '_log/execution.md'), 'utf8');
    expect(execution).toMatch(/MUTANT/);
    expect(execution).toContain('.mandao/cache/MDO-0001/mutations/T3-1.md');
  });

  test('S-3.4: premises.md keeps the exit code and at most 20 lines of a long probe output', async () => {
    const root = wideRepo();
    await wideHistory(root);
    const premises = readFileSync(join(root, SPEC, '_log/premises.md'), 'utf8');
    expect(premises).toMatch(/Exit: 0/);
    const isLine = (l: string) => /^line \d+$/.test(l);
    expect(premises.split('\n').filter(isLine).length).toBeGreaterThan(0);
    for (const section of premises.split(/^## /m).filter((s) => /^P\d+ — /.test(s)))
      expect(section.split('\n').filter(isLine).length).toBeLessThanOrEqual(20);
  });

  test('S-3.4: a not-installed gate is named once per attempt in gates.md, with no output block', async () => {
    const root = wideRepo();
    await wideHistory(root);
    const gates = readFileSync(join(root, SPEC, '_log/gates.md'), 'utf8');
    const sections = gates.split(/^## /m).filter((s) => /^T\d+ — attempt \d+/.test(s));
    expect(sections.length).toBe(6);
    for (const s of sections) {
      expect(s.match(/NOT_INSTALLED/g)?.length).toBe(1);
      expect(s.match(/\bsecrets\b/g)?.length).toBe(1);
    }
    expect(gates).not.toContain('mandao-no-such-tool-xyz');
    // T3's files (test/a.test.ts) are named by no gate line: its sections keep the last lines instead, so only T1 and T2 are filtered.
    for (const s of sections.filter((s) => !s.startsWith('T3'))) expect(s).not.toContain('src/other/noise.ts(');
    for (const s of sections) expect(s.split('\n').filter((l) => l.startsWith('src/cli/skills.ts(')).length).toBeLessThanOrEqual(40);
  });
});
