import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { deliveryIssues, deliveryProgress, parseTasks, proposeDeliveries, splitDeliveries } from '../../src/spec/index.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const base = parseTasks(readFileSync(join(fixture, 'tasks.md'), 'utf8')).tasks[0]!;
const task = (id: string, delivery: number | undefined, ac: string[], extra: Partial<typeof base> = {}) => ({
  ...base,
  id,
  done: false,
  ac,
  depends_on: [],
  ...(delivery === undefined ? {} : { delivery }),
  ...extra,
});

describe('a task declares its delivery', () => {
  test('tasks.md accepts a positive integer `delivery` and rejects anything else', () => {
    const md = (value: string) => `### [ ] T1 — a result\n\n\`\`\`yaml\nproject: a\ntier: fast\ndelivery: ${value}\n\`\`\`\n`;
    expect(parseTasks(md('2'))).toMatchObject({ tasks: [{ id: 'T1', delivery: 2 }], issues: [] });
    expect(parseTasks(md('0')).issues).not.toEqual([]);
    expect(parseTasks(md('first')).issues).not.toEqual([]);
  });
});

describe('splitDeliveries', () => {
  test('without any `delivery` the spec is one delivery holding every task, as before', () => {
    expect(splitDeliveries([task('T1', undefined, ['AC-1']), task('T2', undefined, ['AC-2'])])).toEqual([
      { number: 1, tasks: ['T1', 'T2'], ac: ['AC-1', 'AC-2'], done: false },
    ]);
  });

  test('an AC belongs to the delivery of its last task: that is where it is met end to end', () => {
    const deliveries = splitDeliveries([
      task('T1', 1, ['AC-1', 'AC-2'], { done: true }),
      task('T2', 1, ['AC-1'], { done: true }),
      task('T3', 2, ['AC-2', 'AC-3']),
    ]);
    expect(deliveries).toEqual([
      { number: 1, tasks: ['T1', 'T2'], ac: ['AC-1'], done: true },
      { number: 2, tasks: ['T3'], ac: ['AC-2', 'AC-3'], done: false },
    ]);
  });

  test('deliveries sort by number, so 10 comes after 2', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => task(`T${i + 1}`, 10 - i, [`AC-${i + 1}`]));
    expect(splitDeliveries(tasks).map((d) => d.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  test('a clause id counts as its AC', () => {
    expect(splitDeliveries([task('T1', 1, ['AC-1/C1']), task('T2', 2, ['AC-1'])]).map((d) => d.ac)).toEqual([[], ['AC-1']]);
  });
});

describe('deliveryIssues', () => {
  test('a well-formed split has no issues', () => {
    const tasks = [task('T1', 1, ['AC-1']), task('T2', 2, ['AC-2'], { depends_on: ['T1'] })];
    expect(deliveryIssues(tasks)).toEqual([]);
  });

  test('every task declares a delivery once one does', () => {
    expect(deliveryIssues([task('T1', 1, ['AC-1']), task('T2', undefined, ['AC-2'])])).toEqual([
      'T2 declares no delivery while other tasks do',
    ]);
  });

  test('deliveries are numbered 1 to n without gaps', () => {
    expect(deliveryIssues([task('T1', 1, ['AC-1']), task('T2', 3, ['AC-2'])])).toEqual([
      'deliveries must be numbered 1 to 2 without gaps: found 1, 3',
    ]);
  });

  test('a delivery depends only on earlier deliveries', () => {
    const tasks = [task('T1', 1, ['AC-1'], { depends_on: ['T2'] }), task('T2', 2, ['AC-2'])];
    expect(deliveryIssues(tasks)).toEqual(['T1 (delivery 1) depends on T2 of a later delivery 2']);
  });

  test('a delivery that meets no AC end to end is a technical layer, not a delivery', () => {
    const tasks = [task('T1', 1, ['AC-1']), task('T2', 2, ['AC-1']), task('T3', 2, ['AC-2'])];
    expect(deliveryIssues(tasks)).toEqual(['delivery 1 meets no acceptance criterion end to end: group tasks by AC, never by layer']);
  });
});

describe('deliveryProgress', () => {
  test('names the first unfinished delivery out of the total', () => {
    const tasks = [task('T1', 1, ['AC-1'], { done: true }), task('T2', 2, ['AC-2']), task('T3', 3, ['AC-3'])];
    expect(deliveryProgress(tasks)).toEqual({ current: 2, total: 3, tasks: ['T2'], ac: ['AC-2'], checkpoint: 1 });
  });

  test('at a delivery boundary it names the finished delivery whose partial verify comes before the next one', () => {
    const boundary = [task('T1', 1, ['AC-1'], { done: true }), task('T2', 2, ['AC-2']), task('T3', 2, ['AC-3'])];
    expect(deliveryProgress(boundary)).toMatchObject({ current: 2, checkpoint: 1 });
    const started = [task('T1', 1, ['AC-1'], { done: true }), task('T2', 2, ['AC-2'], { done: true }), task('T3', 2, ['AC-3'])];
    expect(deliveryProgress(started)).not.toHaveProperty('checkpoint');
    expect(deliveryProgress([task('T1', 1, ['AC-1']), task('T2', 2, ['AC-2'])])).not.toHaveProperty('checkpoint');
  });

  test('is absent while the split is invalid, so a gap never reads as "3 of 2"', () => {
    expect(deliveryProgress([task('T1', 1, ['AC-1'], { done: true }), task('T2', 3, ['AC-2'])])).toBeUndefined();
  });

  test('is absent for a spec of one delivery, and past the last one', () => {
    expect(deliveryProgress([task('T1', undefined, ['AC-1'])])).toBeUndefined();
    expect(deliveryProgress([task('T1', 1, ['AC-1'], { done: true }), task('T2', 2, ['AC-2'], { done: true })])).toBeUndefined();
  });
});

describe('proposeDeliveries', () => {
  const limits = { max_files: 25, max_changed_lines: 400 };

  test('proposes deliveries past the task threshold or when the declared files foresee a PR over its limit', () => {
    const many = Array.from({ length: 9 }, (_, i) => task(`T${i + 1}`, undefined, ['AC-1'], { files: [`src/f${i}.ts`] }));
    expect(proposeDeliveries(many, { above: 8, limits })).toEqual({ propose: true, reasons: ['9 tasks (more than 8)'] });
    const wide = [task('T1', undefined, ['AC-1'], { files: Array.from({ length: 26 }, (_, i) => `src/w${i}.ts`) })];
    expect(proposeDeliveries(wide, { above: 8, limits })).toEqual({
      propose: true,
      reasons: ['26 declared files foresee a PR over size_limits.pr (25 files)'],
    });
  });

  test('stays quiet under both thresholds, and once the spec already declares deliveries', () => {
    expect(proposeDeliveries([task('T1', undefined, ['AC-1'])], { above: 8, limits })).toEqual({ propose: false, reasons: [] });
    const declared = Array.from({ length: 9 }, (_, i) => task(`T${i + 1}`, 1, ['AC-1']));
    expect(proposeDeliveries(declared, { above: 8, limits }).propose).toBe(false);
  });
});
