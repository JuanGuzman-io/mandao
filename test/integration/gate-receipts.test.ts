import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { runWithGateReceipt } from '../../src/scripts/gate-receipts.js';
import type { TestRun } from '../../src/scripts/run-tests.js';
import { initTestRepo, makeTree } from '../helpers.js';

const passed: TestRun = {
  status: 'PASS',
  command: 'node -e "process.exit(0)"',
  workers: 1,
  exitCode: 0,
  durationMs: 10,
  reason: 'within budget',
};

test('gate receipt persists across identical runs and invalidates when the code tree changes', async () => {
  const root = makeTree({ 'src/app.ts': 'export const value = 1;\n' });
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  initTestRepo(root, '-q');
  git('add', 'src/app.ts');
  const input = {
    root,
    project: 'app',
    gate: 'test',
    command: passed.command!,
    configuration: { tests: { impacted: 'node {files}' } },
    selectedTests: ['test/app.test.ts'],
    budget: { decision: 'run', workers: 1, priority: 'normal', timeoutS: 60, reason: 'within budget' } as const,
  };
  let executions = 0;
  const execute = async () => {
    executions += 1;
    return passed;
  };

  await expect(runWithGateReceipt(input, execute)).resolves.toEqual(passed);
  await expect(runWithGateReceipt(input, execute)).resolves.toEqual(passed);
  expect(executions).toBe(1);

  writeFileSync(join(root, 'src/app.ts'), 'export const value = 2;\n');
  await expect(runWithGateReceipt(input, execute)).resolves.toEqual(passed);
  expect(executions).toBe(2);
});
