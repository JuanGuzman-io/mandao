import { describe, expect, test } from 'vitest';
import { testCommand } from '../../src/cli/run-red.js';
import { makeTree } from '../helpers.js';

const project = (path: string, gates: Record<string, string> = {}, impacted?: string) => ({
  path,
  gates,
  tests: impacted ? { impacted } : {},
});

describe('testCommand: red and mutation runs use the project command, from the project folder (phase 17)', () => {
  test('the test gate wins over the bare runner when it runs that runner (MDO-0001: uv run pytest, not pytest)', () => {
    const root = makeTree({ 'pyproject.toml': '' });
    expect(testCommand(root, project('.', { test: 'uv run pytest' }), ['tests/test_a.py'], 2)).toEqual({
      command: 'uv run pytest tests/test_a.py',
      shell: expect.stringContaining('uv run pytest tests/test_a.py'),
    });
    // A gate that does not name the runner (a package script) keeps the runner's own module command.
    expect(testCommand(root, project('.', { test: 'make test' }), ['tests/test_a.py'], 2)?.command).toBe('pytest tests/test_a.py');
  });

  test('in a monorepo the files are relative to the project and the command runs in its folder (MDO-0002)', () => {
    const root = makeTree({ 'apps/web/package.json': JSON.stringify({ devDependencies: { vitest: '5' } }) });
    const run = testCommand(root, project('apps/web'), ['apps/web/src/a.test.ts'], 2)!;
    expect(run.command).toBe('npx vitest run src/a.test.ts --maxWorkers=2');
    expect(run.shell).toMatch(/^cd 'apps\/web' && \{ npx vitest run src\/a\.test\.ts/);
  });

  test('tests.impacted still wins', () => {
    const root = makeTree({});
    expect(testCommand(root, project('.', { test: 'uv run pytest' }, 'make t FILES={files}'), ['t/a.py'], 1)?.command).toBe(
      'make t FILES=t/a.py',
    );
  });
});
