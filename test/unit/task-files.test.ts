import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { parseTasks, withTaskFields } from '../../src/spec/index.js';

const tasks = readFileSync(join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list/tasks.md'), 'utf8');

describe('withTaskFields: the files and kind of one task, edited by a script (phase 17)', () => {
  test('adds files once and sets the kind, leaving every other task as it was', () => {
    const edited = withTaskFields(tasks, 'T2', { add: ['src/b.ts', 'src/cli/skills.ts'], kind: 'feat' });
    const t2 = parseTasks(edited).tasks.find((t) => t.id === 'T2')!;
    expect(t2.files).toEqual(['src/cli/extensions.ts', 'src/cli/skills.ts', 'src/b.ts']);
    expect(t2.kind).toBe('feat');
    const t1 = (text: string) => text.slice(text.indexOf('### [x] T1'), text.indexOf('### [ ] T2'));
    expect(t1(edited)).toBe(t1(tasks));
  });

  test('a missing task or kind is an error', () => {
    expect(() => withTaskFields(tasks, 'T9', { add: ['a'] })).toThrow(/T9/);
    expect(() => withTaskFields(tasks, 'T2', { kind: 'nope' })).toThrow(/kind/);
  });
  test('a glob or quoted path stays valid YAML and is not added twice; a block-style list is refused (review F5)', () => {
    const quoted = tasks.replace(
      'files: [src/cli/extensions.ts, src/cli/skills.ts]',
      'files: ["src/cli/extensions.ts", src/cli/skills.ts]',
    );
    const edited = withTaskFields(quoted, 'T2', { add: ['**/x.ts', 'src/cli/extensions.ts'] });
    expect(parseTasks(edited).tasks.find((t) => t.id === 'T2')!.files).toEqual(['src/cli/extensions.ts', 'src/cli/skills.ts', '**/x.ts']);
    const block = tasks.replace(
      'files: [src/cli/extensions.ts, src/cli/skills.ts]',
      'files:\n  - src/cli/extensions.ts\n  - src/cli/skills.ts',
    );
    expect(() => withTaskFields(block, 'T2', { add: ['a.ts'] })).toThrow(/not an inline list/);
  });
});
