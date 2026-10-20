import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { publishPlan } from '../../src/scripts/publish.js';
import {
  acStatus,
  type ExecutionRow,
  impactItems,
  parseCloseSummary,
  parseStory,
  parseTasks,
  verifyResults,
  withPublication,
} from '../../src/spec/index.js';
import { makeTree } from '../helpers.js';

const dir = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const story = parseStory(readFileSync(join(dir, 'story.md'), 'utf8')).story!;
const tasks = parseTasks(readFileSync(join(dir, 'tasks.md'), 'utf8')).tasks.map((t) => ({ ...t, done: true }));
const pass = (task: string): ExecutionRow => ({
  date: 'd',
  task,
  attempt: 1,
  tier: 'fast',
  harness: 'claude',
  implementer: 'x',
  reviewer: 'y',
  verdict: 'PASS',
  notes: '',
});
const report = (rows: string) =>
  `## Acceptance criteria → tests\n\n| AC / clause | Critical | Tests | Level | Result |\n|---|---|---|---|---|\n${rows}\n## Product bugs\n`;

describe('release notes criterion by criterion (ADR 0026)', () => {
  test('met needs every covering task committed and verify PASS; otherwise partial or pending', () => {
    const verify = verifyResults(report('| AC-1 | yes | t | unit | PASS |\n| AC-2 | no | t | unit | FAIL |'));
    const all = acStatus(story, tasks, [pass('T1'), pass('T2')], new Set(['T1', 'T2']), verify);
    expect(all.map((a) => [a.ref, a.status])).toEqual(
      story.acs.map((ac) => [ac.id, ac.id === 'AC-1' ? 'met' : ac.id === 'AC-2' ? 'partial' : 'pending']),
    );
    expect(acStatus(story, tasks, [pass('T1')], new Set(), verify)[0]).toMatchObject({ status: 'pending', why: 'T1 not finished' });
  });

  test('impacts are the bullet items of the design sections, without comments or "none"', () => {
    const design =
      '## Constitution Impact\n<!-- applied by close -->\n- standards.md: name exemplar for CLI commands\n\n## Product Impact\n- None.\n';
    expect(impactItems(design, 'Constitution Impact')).toEqual(['standards.md: name exemplar for CLI commands']);
    expect(impactItems(design, 'Product Impact')).toEqual([]);
  });
});

describe('publish plan', () => {
  test('first publication shows a preview; the same payload is unchanged; new content is an update', () => {
    const root = makeTree({ 'docs/releases/MDO-0001/release-notes.md': 'AC-1 met', 'specs/x/diagrams/flow.png': 'png' });
    const releases = join(root, 'docs/releases/MDO-0001');
    const spec = join(root, 'specs/x');
    let summary = parseCloseSummary(undefined, 'x');
    const first = publishPlan(root, releases, spec, 'jira:PROJ-1', summary);
    expect(first).toMatchObject({
      action: 'create',
      preview: true,
      payload: { text: 'AC-1 met', attachments: [{ path: 'specs/x/diagrams/flow.png', bytes: 3 }] },
    });
    summary = withPublication(summary, { target: 'jira:PROJ-1', kind: 'comment', id: '1', hash: first.payload.hash, at: 't' });
    expect(publishPlan(root, releases, spec, 'jira:PROJ-1', summary)).toMatchObject({ action: 'unchanged', preview: false });
    writeFileSync(join(releases, 'release-notes.md'), 'AC-1 met, AC-2 met');
    expect(publishPlan(root, releases, spec, 'jira:PROJ-1', summary).action).toBe('update');
    expect(publishPlan(root, releases, spec, 'jira:PROJ-2', summary)).toMatchObject({ action: 'create', preview: false });
  });
});
