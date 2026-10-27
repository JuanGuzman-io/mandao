// mandao-scans: none — copies the MDO-0001 fixture into temporary trees.
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, vi } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { buildProgram } from '../src/cli/program.js';
import { writeYaml } from '../src/engine/files.js';
import { syncProject } from '../src/engine/sync.js';
import { initTestRepo, makeTree, pkg } from './helpers.js';

const fixture = join(import.meta.dirname, 'fixtures/spec/MDO-0001-skills-list');
export const SPEC = 'specs/MDO-0001-skills-list';
export const CACHE = '.mandao/cache/MDO-0001';
export const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
let out: string[] = [];
export const ledger = `---
schema_version: 1
spec: MDO-0001-skills-list
depth: standard
status: draft
writes_data: no
---

# Design — skills list

## Principle check

| ID | Applies? | Application or reason not applicable |
|---|---|---|
| none | n/a | No principles are declared. |

## Premise Ledger

<a id="p1"></a>
### P1 — The lock lists every pinned skill (High)

- **If false:** the command misses skills.

<a id="p2"></a>
### P2 — The catalog is not needed (High)

- **If false:** the command misses entries.

## Evidence
`;

/** A gate that fails with 10,000 lines: odd lines name the task's file, even lines another file. */
export const NOISY_GATE = `node -e "for(let i=1;i<=10000;i++)console.log((i%2?'src/cli/skills.ts(':'src/other/noise.ts(')+i+'): error TS'+i);process.exitCode=1"`;
export const OTHER_LAST = 'src/other/noise.ts(10000): error TS10000';
export const REVIEW_FAIL =
  'VERDICT: FAIL\n\n## Findings (JSON)\n\n```json\n{"version":1,"findings":[{"id":"B1","status":"open","severity":"medium","lens":"core","title":"skills ls is not registered as an alias.","file":"src/cli/skills.ts","line":1,"evidence":"The alias is not registered."}]}\n```\n\n## Blocking findings\n\n- B1: `skills ls` is not registered as an alias.\n';
export const REVIEW_PASS = 'VERDICT: PASS\n\n## Findings (JSON)\n\n```json\n{"version":1,"findings":[]}\n```\n\nThe alias is registered.\n';

/** The fixture as a spec of layout `version`, on its spec branch, committed. */
export function repo(version: 1 | 2) {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop'), 'src/cli/skills.ts': 'export const a = 1;\n' }));
  initTestRepo(root, '-q', '-b', 'feat/MDO-0001-skills-list');
  git(root, 'config', 'user.name', 'Ana PO');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.', gates: { typecheck: NOISY_GATE, build: 'node -e "process.exit(0)"' } }],
    harnesses: ['claude'],
    // The gate must run wherever the suite runs: a busy CI runner would otherwise defer it, with no output.
    resources: { min_free_memory_mb: 0 },
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  const dir = join(root, SPEC);
  const story = readFileSync(join(dir, 'story.md'), 'utf8').replace(/^schema_version: 1$/m, `schema_version: ${version}`);
  writeFileSync(join(dir, 'story.md'), story);
  if (version === 2) {
    const requirements = readFileSync(join(dir, 'requirements.md'), 'utf8').replace(/^depth: lite$/m, 'depth: standard');
    writeFileSync(join(dir, 'requirements.md'), requirements);
  }
  writeFileSync(join(dir, 'design.md'), ledger);
  mkdirSync(join(dir, '_log'));
  for (const f of ['execution.md', 'progress.yml']) renameSync(join(dir, f), join(dir, '_log', f));
  if (version === 2) {
    // A version 2 spec keeps its progress in state.yml, not in progress.yml.
    const progress = parseYaml(readFileSync(join(dir, '_log/progress.yml'), 'utf8'));
    rmSync(join(dir, '_log/progress.yml'));
    writeYaml(join(dir, '_log/state.yml'), { progress });
  }
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}

export const cli = async (root: string, ...args: string[]) => {
  process.exitCode = undefined;
  await buildProgram(() => root).parseAsync(['node', 'mandao', ...args]);
  process.exitCode = undefined;
  return JSON.parse(out.at(-1)!);
};
export const run = (root: string, ...args: string[]) => cli(root, 'run', ...args);

/** Two attempts at T2: a failing gate and a FAIL review, then the same again ending in PASS and a task commit; two premises and an approval with words. */
export async function history(root: string) {
  const dir = join(root, SPEC);
  const T = ['--task', 'T2', '--harness', 'claude'];
  for (const p of ['P1', 'P2']) await run(root, 'premise', 'MDO-0001', p, '--', 'node', '-e', `console.log('pinned ${p}')`);
  for (const attempt of [1, 2]) {
    await run(root, 'checkpoint', 'MDO-0001', ...T, '--verdict', 'STARTED', '--tier', 'standard');
    writeFileSync(join(root, 'src/cli/skills.ts'), `export const a = ${attempt + 1};\n`);
    await run(root, 'gates', 'MDO-0001', 'T2');
    await run(root, 'review-pack', 'MDO-0001', 'T2');
    const review = join(makeTree({}), `review-${attempt}.txt`);
    writeFileSync(review, attempt === 1 ? REVIEW_FAIL : REVIEW_PASS);
    const verdict =
      attempt === 1
        ? ['--verdict', 'FAIL', '--reason', 'B1: alias missing']
        : ['--verdict', 'PASS', '--pending-commit', 'register the skills list command'];
    await run(root, 'checkpoint', 'MDO-0001', ...T, ...verdict, '--reviewer', 'self', '--implementer', 'self', '--review', review);
  }
  await run(root, 'commit', 'MDO-0001');
  await cli(root, 'approve', 'MDO-0001', 'design', '--by-running', '/mandao-implement', '--words', 'go ahead, looks right');
  return dir;
}

export const filesUnder = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? filesUnder(join(dir, f)) : [join(dir, f)]))
    : [];
export const SIX = ['costs.yml', 'execution.md', 'gates.md', 'premises.md', 'reviews.md', 'state.yml'];

/** Registers the per-test environment: a temp MANDAO_HOME, git identity and captured console output. */
export function useLogEnv() {
  beforeEach(() => {
    process.env.MANDAO_HOME = makeTree({});
    for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
    for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
    // Run inside Claude Code, the readers would measure the live session's transcript, which grows as it runs.
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', '');
    out = [];
    vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });
}

/** The last JSON line the CLI printed. */
export const lastOut = () => JSON.parse(out.at(-1)!);
