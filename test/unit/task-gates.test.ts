import { describe, expect, test } from 'vitest';
import { type Task, taskGateIssues } from '../../src/spec/index.js';

const task = (id: string, files: string[], extra: Partial<Task> = {}) =>
  ({ id, title: id, project: 'api', files, kind: 'feat', depends_on: [], done: false, ...extra }) as unknown as Task;

describe('taskGateIssues (phase 17, MDO-0001: a first implementation with no lint, format or typecheck gate)', () => {
  test('a project with no gates needs a task that sets them in .mandao/config.yml', () => {
    const none = [{ name: 'api', gates: {} }];
    expect(taskGateIssues([task('T1', ['pyproject.toml', 'src/app.py'])], none)).toEqual([
      'project api has no gates in .mandao/config.yml: the task that creates its manifest must declare .mandao/config.yml and set the gates the constitution proposed',
    ]);
    expect(taskGateIssues([task('T1', ['pyproject.toml', '.mandao/config.yml', 'tests/test_app.py'])], none)).toEqual([]);
  });

  test('the first code task of a project with a test gate declares a test file (MDO-0002: T1 could not pass its own gates)', () => {
    const gated = [{ name: 'api', gates: { test: 'uv run pytest' } }];
    expect(taskGateIssues([task('T1', ['src/app.py']), task('T2', ['tests/test_app.py'], { depends_on: ['T1'] })], gated)).toEqual([
      'T1 is the first task of api and runs its test gate, but declares no test file: add one to its files',
    ]);
    expect(
      taskGateIssues(
        [
          task('T1', ['docs/x.md'], { kind: 'docs' } as Partial<Task>),
          task('T2', ['tests/test_app.py', 'src/app.py'], { depends_on: ['T1'] }),
        ],
        gated,
      ),
    ).toEqual([]);
  });
  test('build: none or eval alone is no check gate; ./ paths count; a finished task is not reported again (review F10)', () => {
    const issue = /project api has no gates/;
    expect(taskGateIssues([task('T1', ['src/app.py'])], [{ name: 'api', gates: { build: 'none' } }])[0]).toMatch(issue);
    expect(taskGateIssues([task('T1', ['src/app.py'])], [{ name: 'api', gates: { eval: 'x' } }])[0]).toMatch(issue);
    expect(taskGateIssues([task('T1', ['./.mandao/config.yml', 'tests/test_a.py'])], [{ name: 'api', gates: {} }])).toEqual([]);
    const gated = [{ name: 'api', gates: { test: 'uv run pytest' } }];
    expect(taskGateIssues([task('T1', ['src/app.py'], { done: true }), task('T2', ['tests/test_b.py'])], gated)).toEqual([]);
    // review F10 (second pass): once the first code task is done, the check does not move on to the next one.
    expect(taskGateIssues([task('T1', ['tests/test_a.py'], { done: true }), task('T2', ['src/more.py'])], gated)).toEqual([]);
  });
});
