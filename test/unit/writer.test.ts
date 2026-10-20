import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import type { GeneratedFile } from '../../src/adapters/types.js';
import type { LockFile } from '../../src/schemas/index.js';
import { applyChanges } from '../../src/writer/apply.js';
import { removeBlock, upsertBlock } from '../../src/writer/blocks.js';
import { planChanges } from '../../src/writer/plan.js';
import { makeTree } from '../helpers.js';

const owned = (path: string, content: string): GeneratedFile => ({ path, content, ownership: 'owned', from: 'command:x', harness: 'claude', scope: 'project' });
const block = (body: string) => `<!-- mandao:begin -->\n${body}\n<!-- mandao:end -->`;
const managed = (path: string, body: string): GeneratedFile => ({ path, content: block(body), ownership: 'managed-block', from: 'block:mandao', harness: 'agents-md', scope: 'project' });

/** Runs a sync round: plan, apply, return the plan and the new lock. */
function sync(root: string, files: GeneratedFile[], lock: LockFile[], force = false) {
  const plan = planChanges(files, lock, { project: root }, force);
  return { plan: plan.map((c) => [c.path, c.action]), lock: applyChanges(plan, [root]) };
}

describe('owned files', () => {
  test('create, then unchanged on the second run', () => {
    const root = makeTree({});
    const first = sync(root, [owned('.claude/skills/a/SKILL.md', 'A')], []);
    expect(first.plan).toEqual([['.claude/skills/a/SKILL.md', 'create']]);
    expect(sync(root, [owned('.claude/skills/a/SKILL.md', 'A')], first.lock).plan).toEqual([['.claude/skills/a/SKILL.md', 'unchanged']]);
  });

  test('a hand-edited file is reported as drift and kept, unless forced', () => {
    const root = makeTree({});
    const { lock } = sync(root, [owned('a.md', 'v1')], []);
    writeFileSync(join(root, 'a.md'), 'my edit');

    const drift = sync(root, [owned('a.md', 'v2')], lock);
    expect(drift.plan).toEqual([['a.md', 'drift']]);
    expect(readFileSync(join(root, 'a.md'), 'utf8')).toBe('my edit');
    // The old lock entry is kept so the drift stays visible on the next run.
    expect(drift.lock).toEqual(lock);

    expect(sync(root, [owned('a.md', 'v2')], drift.lock, true).plan).toEqual([['a.md', 'update']]);
    expect(readFileSync(join(root, 'a.md'), 'utf8')).toBe('v2');
  });

  test('a pre-existing user file at a generated path is never overwritten silently', () => {
    const root = makeTree({ 'a.md': 'theirs' });
    expect(sync(root, [owned('a.md', 'ours')], []).plan).toEqual([['a.md', 'drift']]);
    expect(readFileSync(join(root, 'a.md'), 'utf8')).toBe('theirs');
  });

  test('orphans are deleted with their empty folders; edited orphans are kept', () => {
    const root = makeTree({});
    const { lock } = sync(root, [owned('.claude/skills/a/SKILL.md', 'A'), owned('b.md', 'B')], []);
    writeFileSync(join(root, 'b.md'), 'edited');
    const next = sync(root, [], lock);
    expect(next.plan).toEqual([
      ['.claude/skills/a/SKILL.md', 'delete'],
      ['b.md', 'drift-orphan'],
    ]);
    expect(existsSync(join(root, '.claude'))).toBe(false);
    expect(existsSync(join(root, 'b.md'))).toBe(true);
    expect(next.lock.map((l) => l.path)).toEqual(['b.md']);
  });
});

describe('managed blocks', () => {
  test('appended to an existing AGENTS.md without touching user content', () => {
    const root = makeTree({ 'AGENTS.md': '# Team rules\n\nBe nice.\n' });
    const { plan, lock } = sync(root, [managed('AGENTS.md', 'v1')], []);
    expect(plan).toEqual([['AGENTS.md', 'update']]);
    expect(readFileSync(join(root, 'AGENTS.md'), 'utf8')).toBe(`# Team rules\n\nBe nice.\n\n${block('v1')}\n`);

    writeFileSync(join(root, 'AGENTS.md'), readFileSync(join(root, 'AGENTS.md'), 'utf8') + '\n## Skill Map\n- x\n');
    expect(sync(root, [managed('AGENTS.md', 'v2')], lock).plan).toEqual([['AGENTS.md', 'update']]);
    expect(readFileSync(join(root, 'AGENTS.md'), 'utf8')).toBe(`# Team rules\n\nBe nice.\n\n${block('v2')}\n\n## Skill Map\n- x\n`);
  });

  test('an edit inside the block is drift', () => {
    const root = makeTree({});
    const { lock } = sync(root, [managed('AGENTS.md', 'v1')], []);
    writeFileSync(join(root, 'AGENTS.md'), block('hacked') + '\n');
    expect(sync(root, [managed('AGENTS.md', 'v2')], lock).plan).toEqual([['AGENTS.md', 'drift']]);
  });

  test('an orphan block is removed and the file deleted only if nothing else is left', () => {
    expect(removeBlock(`${block('x')}\n`)).toBeUndefined();
    expect(removeBlock(`# Mine\n\n${block('x')}\n`)).toBe('# Mine\n');
  });
});

test('upsertBlock replaces in place even if the block contains $ patterns', () => {
  expect(upsertBlock(`a\n${block('old')}\nb`, block('cost $1 $&'))).toBe(`a\n${block('cost $1 $&')}\nb`);
});
