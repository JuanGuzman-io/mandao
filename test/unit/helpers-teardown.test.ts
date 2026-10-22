import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeTree } from '../helpers.js';

let firstTestTree = '';

describe('per-test temporary folders', () => {
  it('creates a folder owned by the first test', () => {
    firstTestTree = makeTree({ 'written.txt': 'first' });
    expect(readFileSync(join(firstTestTree, 'written.txt'), 'utf8')).toBe('first');
  });

  it('gets a fresh folder after the previous test cleanup', () => {
    const secondTestTree = makeTree({ 'written.txt': 'second' });
    expect(secondTestTree).not.toBe(firstTestTree);
    expect(existsSync(firstTestTree)).toBe(false);
    expect(readFileSync(join(secondTestTree, 'written.txt'), 'utf8')).toBe('second');
  });
});
