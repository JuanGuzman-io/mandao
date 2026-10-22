import { describe, expect, test } from 'vitest';
import { unresolvedPremises } from '../../src/spec/premises.js';

describe('unresolved close premises', () => {
  test('finds live assumptions and conflicts while ignoring code examples and resolved rows', () => {
    const markdown = [
      'ASSUMPTION(source: issue): refunds are immediate.',
      'CONFLICT(a: docs, b: code, decides: tech lead): which contract wins?',
      '`ASSUMPTION(source: example): not real`',
      '```md',
      'CONFLICT(a: sample, b: text, decides: nobody): example',
      '```',
      '| CC-1 | CONFLICT | old disagreement | normal | lead | resolved: ADR 1 |',
    ].join('\n');
    expect(unresolvedPremises(markdown)).toEqual([
      'ASSUMPTION(source: issue): refunds are immediate.',
      'CONFLICT(a: docs, b: code, decides: tech lead): which contract wins?',
    ]);
  });
});
