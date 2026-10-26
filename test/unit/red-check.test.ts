import { describe, expect, test } from 'vitest';
import { redCheck } from '../../src/scripts/red.js';

describe('redCheck: only failing tests are red evidence', () => {
  test('a runner that could not run is never red evidence (MDO-0001 T17)', () => {
    expect(redCheck('FAIL', 127).problem).toMatch(/runner could not run \(exit 127\)/);
    expect(redCheck('FAIL', 126).red).toBe(false);
    expect(redCheck('FAIL', 1, 'pytest', 'sh: pytest: command not found').red).toBe(false);
    expect(redCheck('FAIL', 1, undefined, "'pytest' is not recognized as an internal or external command").red).toBe(false);
  });

  test('a runner killed by a signal (exit above 128) is a crash, not red', () => {
    expect(redCheck('FAIL', 137, 'pytest').problem).toMatch(/runner crashed or was killed \(exit 137\)/);
    expect(redCheck('FAIL', 139, 'vitest').red).toBe(false);
  });

  test('pytest exits other than 1 are not failing tests', () => {
    expect(redCheck('FAIL', 1, 'pytest')).toEqual({ red: true });
    expect(redCheck('FAIL', 2, 'pytest').problem).toMatch(/interrupted or failed to collect/);
    expect(redCheck('FAIL', 3, 'pytest').problem).toMatch(/internal error/);
    expect(redCheck('FAIL', 4, 'pytest').problem).toMatch(/usage error/);
    expect(redCheck('FAIL', 5, 'pytest').problem).toMatch(/no tests were collected/);
    expect(redCheck('FAIL', 2, 'vitest')).toEqual({ red: true });
  });

  test('vitest and jest runs that found or loaded no tests are not red', () => {
    expect(redCheck('FAIL', 1, 'vitest', 'No test files found, exiting with code 1').red).toBe(false);
    expect(redCheck('FAIL', 1, 'vitest', 'FAIL  a.test.ts [ a.test.ts ]\nError: Failed to load url ./sum').problem).toMatch(
      /could not load/,
    );
    expect(redCheck('FAIL', 1, 'jest', 'No tests found, exiting with code 1').red).toBe(false);
    expect(redCheck('FAIL', 1, 'jest', '● Test suite failed to run\n\nCannot find module').red).toBe(false);
    expect(redCheck('FAIL', 1, 'vitest', 'AssertionError: expected 1 to be 2')).toEqual({ red: true });
  });
});
