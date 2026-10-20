import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeTree, removeTrees } from '../helpers.js';

describe('removeTrees', () => {
  it('S-1.1: removes a folder created by makeTree', () => {
    const dir = makeTree({ 'a/b.txt': 'x' });
    expect(existsSync(dir)).toBe(true);
    removeTrees();
    expect(existsSync(dir)).toBe(false);
  });

  it('S-2.1: leaves a look-alike folder it did not create, content intact', () => {
    const lookAlike = join(dirname(makeTree({})), 'mandao-test-lookalike-S21');
    mkdirSync(lookAlike);
    writeFileSync(join(lookAlike, 'keep.txt'), 'keep');
    try {
      removeTrees();
      expect(existsSync(dirname(lookAlike))).toBe(true);
      expect(readFileSync(join(lookAlike, 'keep.txt'), 'utf8')).toBe('keep');
    } finally {
      rmSync(lookAlike, { recursive: true, force: true });
    }
  });

  it('S-2.2: tolerates a workspace the test already deleted and removes the other one', () => {
    const gone = makeTree({ 'f.txt': 'x' });
    const other = makeTree({ 'g.txt': 'y' });
    rmSync(gone, { recursive: true, force: true });
    expect(() => removeTrees()).not.toThrow();
    expect(existsSync(other)).toBe(false);
  });
});
