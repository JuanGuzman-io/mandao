import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { readSpec } from '../../src/scripts/spec.js';
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
