import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { makeTree, removeTrees } from '../helpers.js';

const moduleTree = makeTree({});

afterAll(() => {
  // S-3.1: still there, with what the tests wrote, when the file's own last hook runs.
  expect(existsSync(moduleTree)).toBe(true);
  expect(readFileSync(join(moduleTree, 'written.txt'), 'utf8')).toBe('first');
});

describe('module-level workspace', () => {
  it('S-3.2: first test writes into it', () => {
    expect(typeof removeTrees).toBe('function');
    writeFileSync(join(moduleTree, 'written.txt'), 'first');
  });

  it('S-3.2: second test finds it intact', () => {
    expect(readFileSync(join(moduleTree, 'written.txt'), 'utf8')).toBe('first');
  });
});
