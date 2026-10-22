import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { initTestRepo, makeTree, removeTrees, testTreeScope } from '../helpers.js';

describe('removeTrees', () => {
  it('removes only the current test owner folders and tolerates an already missing folder', () => {
    const first = testTreeScope.run('owner-one', () => makeTree({ 'a/b.txt': 'x' }));
    const second = testTreeScope.run('owner-two', () => makeTree({ 'b.txt': 'y' }));
    expect(existsSync(first)).toBe(true);
    expect(existsSync(second)).toBe(true);

    rmSync(first, { recursive: true, force: true });
    expect(() => removeTrees('owner-one')).not.toThrow();
    expect(existsSync(first)).toBe(false);
    expect(existsSync(second)).toBe(true);

    expect(() => removeTrees('owner-two')).not.toThrow();
    expect(existsSync(second)).toBe(false);
  });

  it('gives each temporary Git repo local identity and disables background maintenance', () => {
    const root = makeTree({});
    initTestRepo(root);
    const gitConfig = (key: string) => execFileSync('git', ['config', '--local', key], { cwd: root, encoding: 'utf8' }).trim();
    expect(gitConfig('user.name')).toBe('Mandao Test');
    expect(gitConfig('user.email')).toBe('mandao-test@example.invalid');
    expect(gitConfig('gc.auto')).toBe('0');
    expect(gitConfig('maintenance.auto')).toBe('false');
  });
});
