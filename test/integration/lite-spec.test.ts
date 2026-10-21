import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { readLayout, readSpec } from '../../src/scripts/spec.js';
import { docPath } from '../../src/scripts/spec-log.js';
import { makeTree, pkg } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';
const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
let out: string[];

const task = (id: string, title: string, ac: string, s: string, deps = '[]') => `### [ ] ${id} — ${title}

- **What:** ${title.toLowerCase()}.
- **Done when:**
  - ${s} holds.

\`\`\`yaml
project: mandao
kind: feat
tier: fast
files: [src/cli/skills.ts]
ac: [${ac}, ${ac}/C1]
scenarios: [${s}, ${s}/C1]
test_levels: { ${s}: unit, ${s}/C1: unit }
evidence: tdd
depends_on: ${deps}
verify: npx vitest run test/unit/skills.test.ts
\`\`\`
`;

/** A lite spec.md built from the fixture's requirements, with design sections and inline tasks. */
function liteSpec(tasks: string) {
  const reqs = readFileSync(join(fixture, 'requirements.md'), 'utf8')
    .split('## Consistency Check')[0]!
    .replace(/^---[\s\S]*?---\n/, '');
  return `---
schema_version: 1
spec: MDO-0001-skills-list
depth: lite
projects: [mandao]
status: approved
---
${reqs.replace(/^# .*$/m, '# Spec — List the skills pinned in a workspace\n\nThe CLI lists pinned skills.')}
## Decisions

### D1 — Read the lock only

- The catalog is not needed to list what is pinned.

## Changes by project and module

| Project | Module | Change | Exemplar file |
|---|---|---|---|
| mandao | cli | new command | src/cli/extensions.ts |

## Risks and impacts

## Constitution Impact

- Add \`skills list\` to the CLI reference.

## Consistency Check

No findings.

## Tasks

${tasks}`;
}

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
});
afterEach(() => vi.restoreAllMocks());

function repo(tasks: string) {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
  git(root, 'init', '-q');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude'],
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  for (const f of ['requirements.md', 'tasks.md', 'execution.md', 'progress.yml']) rmSync(join(root, SPEC, f));
  writeFileSync(join(root, SPEC, 'spec.md'), liteSpec(tasks));
  return root;
}
const run = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
  return JSON.parse(out.at(-1)!);
};

describe('lite: story.md + spec.md', () => {
  const two = task('T1', 'Pinned skills are listed', 'AC-1', 'S-1.1') + task('T2', 'An empty lock shows a hint', 'AC-2', 'S-2.1', '[T1]');

  test('requirements, design and inline tasks are read from spec.md; trace and tasks work the same', async () => {
    const root = repo(two);
    const dir = join(root, SPEC);
    for (const d of ['requirements', 'design', 'tasks'] as const) expect(docPath(dir, d)).toBe(join(dir, 'spec.md'));
    const spec = readSpec(dir);
    expect(spec.requirements?.requirements.map((r) => r.id)).toEqual(['FR-1', 'FR-2']);
    expect(spec.tasks.map((t) => t.id)).toEqual(['T1', 'T2']);
    const t = await run(root, 'trace', 'MDO-0001');
    expect(t.findings).toEqual([]);
    expect(t.rows.map((r: { ref: string; tasks: string[] }) => [r.ref, r.tasks])).toEqual([
      ['AC-1', ['T1']],
      ['AC-1/C1', ['T1']],
      ['AC-2', ['T2']],
      ['AC-2/C1', ['T2']],
    ]);
    expect(await run(root, 'tasks', 'MDO-0001')).toMatchObject({ waves: [['T1'], ['T2']], issues: [] });
    expect((await run(root, 'impacts', 'MDO-0001')).constitution).toEqual([expect.stringContaining('skills list')]);
  });

  test('the checkpoint ticks the task inside spec.md', async () => {
    const root = repo(two);
    await run(root, 'checkpoint', 'MDO-0001', '--task', 'T1', '--done', 'T1', '--clear');
    expect(readFileSync(join(root, SPEC, 'spec.md'), 'utf8')).toContain('### [x] T1 — Pinned skills are listed');
  });

  test('more than 3 inline tasks go to tasks.md; the task rules apply inline too', async () => {
    const four = [1, 2, 3, 4].map((n) => task(`T${n}`, n === 4 ? 'Edit `src/cli/skills.ts`' : `Step ${n}`, 'AC-1', 'S-1.1')).join('');
    const root = repo(four);
    const issues = (await run(root, 'tasks', 'MDO-0001')).issues;
    expect(issues).toContain('spec.md: 4 tasks inline; more than 3 go to tasks.md');
    expect(issues).toContain('T4: the title names a file; say the result instead');
  });
});

/** A lite version 2 spec: story.md says version 2, spec.md has no `## Tasks` unless `stale` is given, the tasks live in tasks.md. */
function repoV2(tasks: string, stale = '') {
  const root = repo(task('T9', 'Stale inline task', 'AC-1', 'S-1.1'));
  const dir = join(root, SPEC);
  const story = readFileSync(join(dir, 'story.md'), 'utf8').replace(/schema_version: 1/, 'schema_version: 2');
  writeFileSync(join(dir, 'story.md'), story);
  const spec = readFileSync(join(dir, 'spec.md'), 'utf8').split('## Tasks')[0]!;
  writeFileSync(join(dir, 'spec.md'), stale ? `${spec}## Tasks\n\n${stale}` : spec);
  writeFileSync(join(dir, 'tasks.md'), `# Tasks\n\n## Details\n\n${tasks}`);
  return root;
}

describe('lite version 2: tasks.md always (AC-1)', () => {
  const taskList = (n: number) => Array.from({ length: n }, (_, i) => task(`T${i + 1}`, `Step ${i + 1}`, 'AC-1', 'S-1.1')).join('');

  test('S-1.1: one task is in tasks.md, and spec.md has no ## Tasks', async () => {
    const root = repoV2(taskList(1));
    const dir = join(root, SPEC);
    expect(readFileSync(join(dir, 'spec.md'), 'utf8')).not.toContain('## Tasks');
    expect(docPath(dir, 'tasks')).toBe(join(dir, 'tasks.md'));
    expect(readSpec(dir).tasks.map((t) => t.id)).toEqual(['T1']);
    expect((await run(root, 'tasks', 'MDO-0001')).waves).toEqual([['T1']]);
  });

  test('S-1.2: 3 and 4 tasks give the same file set, and tasks are never read from spec.md', () => {
    const stale = task('T9', 'Stale inline task', 'AC-1', 'S-1.1');
    const three = repoV2(taskList(3), stale);
    const four = repoV2(taskList(4), stale);
    const a = readLayout(join(three, SPEC));
    const b = readLayout(join(four, SPEC));
    expect({ missing: b.missing, unexpected: b.unexpected }).toEqual({ missing: a.missing, unexpected: a.unexpected });
    expect(readSpec(join(four, SPEC)).tasks.map((t) => t.id)).toEqual(['T1', 'T2', 'T3', 'T4']);
  });

  test('S-1.2/C2: with 4 tasks the check never says "more than 3 go to tasks.md"', async () => {
    const root = repoV2(taskList(4));
    const issues: string[] = (await run(root, 'tasks', 'MDO-0001')).issues;
    expect(issues.filter((i) => /more than 3|inline/.test(i))).toEqual([]);
  });

  test('S-1.1: before the tasks step, the tasks path is tasks.md, not spec.md', () => {
    const root = repoV2('');
    const dir = join(root, SPEC);
    rmSync(join(dir, 'tasks.md'));
    expect(docPath(dir, 'tasks')).toBe(join(dir, 'tasks.md'));
  });

  test('S-1.2/C2: four tasks written inline in spec.md are not read as the spec tasks', () => {
    const inline = [1, 2, 3, 4].map((n) => task(`T${n}`, `Step ${n}`, 'AC-1', 'S-1.1')).join('');
    const root = repoV2('', inline);
    const dir = join(root, SPEC);
    rmSync(join(dir, 'tasks.md'));
    expect(readSpec(dir).tasks).toEqual([]);
  });

  test('S-1.1: the checkpoint ticks the task in tasks.md and leaves spec.md alone (regression pin)', async () => {
    const root = repoV2(taskList(1));
    const dir = join(root, SPEC);
    const specBefore = readFileSync(join(dir, 'spec.md'), 'utf8');
    await run(root, 'checkpoint', 'MDO-0001', '--task', 'T1', '--done', 'T1', '--clear');
    expect(readFileSync(join(dir, 'tasks.md'), 'utf8')).toContain('### [x] T1 — Step 1');
    expect(readFileSync(join(dir, 'spec.md'), 'utf8')).toBe(specBefore);
  });

  test('S-1.1: approve tasks on the same fixture approves tasks.md with no inline issue (regression pin)', async () => {
    const root = repoV2(taskList(4));
    git(root, 'add', '.');
    git(root, 'commit', '-qm', 'base');
    await run(root, 'tasks', 'MDO-0001', '--index', '--write');
    const r = await approveTasks(root);
    expect(JSON.stringify(r)).not.toMatch(/inline|more than 3/);
    expect(r).toMatchObject({ approved: true });
  });

  test('S-1.2/C2: approve tasks with no tasks.md refuses, and never approves tasks written inline in spec.md', async () => {
    const inline = [1, 2, 3, 4].map((n) => task(`T${n}`, `Step ${n}`, 'AC-1', 'S-1.1')).join('');
    const root = repoV2('', inline);
    const dir = join(root, SPEC);
    rmSync(join(dir, 'tasks.md'));
    const specBefore = readFileSync(join(dir, 'spec.md'), 'utf8');
    const r = await approveTasks(root);
    expect(r).toMatchObject({ approved: false });
    expect(JSON.stringify(r)).toContain('no tasks to approve');
    expect(readFileSync(join(dir, 'spec.md'), 'utf8')).toBe(specBefore);
  });
});

const approveTasks = async (root: string) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'approve', 'MDO-0001', 'tasks']);
  return JSON.parse(out.at(-1)!);
};
