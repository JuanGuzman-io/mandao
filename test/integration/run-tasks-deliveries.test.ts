import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { makeTree, pkg } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';
let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});
afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

const task = (n: number, delivery: number | undefined, ac: string, depends: string[] = []) =>
  `### [ ] T${n} — result ${n}\n\n\`\`\`yaml\nproject: mandao\nkind: feat\ntier: fast\nfiles: [src/f${n}.ts]\nac: [${ac}]\n` +
  `${delivery === undefined ? '' : `delivery: ${delivery}\n`}depends_on: [${depends.join(', ')}]\n\`\`\`\n`;

function workspace(tasks: string, config: Record<string, unknown> = {}) {
  const files = Object.fromEntries(['story.md', 'requirements.md'].map((f) => [`${SPEC}/${f}`, readFileSync(join(fixture, f), 'utf8')]));
  const root = realpathSync(makeTree({ 'package.json': pkg('shop'), ...files }));
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude'],
    ...config,
  });
  writeFileSync(
    join(root, SPEC, 'tasks.md'),
    `---\nschema_version: 1\nspec: MDO-0001-skills-list\nstatus: draft\n---\n\n# Tasks\n\n## Details\n\n${tasks}`,
  );
  return root;
}

const runTasks = async (root: string) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', 'tasks', 'MDO-0001']);
  return JSON.parse(out.at(-1)!);
};

describe('run tasks with deliveries (MDO-0013)', () => {
  test('reports the deliveries, which one is current, and a broken split as issues', async () => {
    const ok = await runTasks(workspace(`${task(1, 1, 'AC-1')}\n${task(2, 2, 'AC-2', ['T1'])}`));
    expect(ok.deliveries).toEqual([
      { number: 1, tasks: ['T1'], ac: ['AC-1'], done: false },
      { number: 2, tasks: ['T2'], ac: ['AC-2'], done: false },
    ]);
    expect(ok.delivery).toEqual({ current: 1, total: 2, tasks: ['T1'], ac: ['AC-1'] });
    expect(ok.issues.filter((i: string) => /deliver/.test(i))).toEqual([]);

    const broken = await runTasks(workspace(`${task(1, 1, 'AC-1', ['T2'])}\n${task(2, 2, 'AC-2')}`));
    expect(broken.issues).toContain('T1 (delivery 1) depends on T2 of a later delivery 2');
  });

  test('proposes deliveries past `deliveries.propose_above_tasks`, and stays quiet under it', async () => {
    const three = [1, 2, 3].map((n) => task(n, undefined, `AC-${n}`)).join('\n');
    expect((await runTasks(workspace(three, { deliveries: { propose_above_tasks: 2 } }))).proposeDeliveries).toEqual({
      propose: true,
      reasons: ['3 tasks (more than 2)'],
    });
    const quiet = await runTasks(workspace(three));
    expect(quiet.proposeDeliveries).toEqual({ propose: false, reasons: [] });
    expect(quiet.delivery).toBeUndefined();
  });
});
