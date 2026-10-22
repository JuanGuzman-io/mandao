import { describe, expect, test } from 'vitest';
import { gateResult } from '../../src/scripts/gates.js';
import type { TestRun } from '../../src/scripts/run-tests.js';

const run = (status: TestRun['status'], exitCode: number, output = ''): TestRun => ({
  status,
  exitCode,
  workers: 1,
  durationMs: 1,
  reason: 'test run',
  output,
});

describe('gate status follows the runner result', () => {
  test('successful commands are PASS even if their output mentions a missing command', () => {
    expect(gateResult('test', run('PASS', 0, 'command not found: optional-tool'))).toMatchObject({ status: 'PASS', exitCode: 0 });
  });

  test('failed commands reporting a missing executable are NOT_INSTALLED', () => {
    expect(gateResult('test', run('FAIL', 127, 'optional-tool: command not found'))).toMatchObject({
      status: 'NOT_INSTALLED',
      exitCode: 127,
    });
  });
});
