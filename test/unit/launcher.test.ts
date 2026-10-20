import { execFileSync } from 'node:child_process';
import { chmodSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { launcherScript } from '../../src/engine/launcher.js';
import { makeTree } from '../helpers.js';

/** Runs the generated launcher in print mode from `cwd` with the given PATH. */
function resolveWith(runner: 'auto' | 'local' | 'global' | 'npx', files: Record<string, string>, pathDirs: string[] = []) {
  // realpath: on macOS the temp dir is a symlink and process.cwd() returns the resolved path.
  const root = realpathSync(makeTree(files));
  const script = join(root, 'launcher.mjs');
  writeFileSync(script, launcherScript('1.2.3', runner));
  const out = execFileSync(process.execPath, [script, 'run', 'x'], {
    cwd: join(root, 'pkg'),
    env: { PATH: pathDirs.map((d) => join(root, d)).join(':'), MANDAO_LAUNCHER_PRINT: '1' },
    encoding: 'utf8',
  });
  return { root, choice: JSON.parse(out) as { source: string; command?: string; args?: string[] } };
}

const bin = (path: string) => ({ [path]: '#!/bin/sh\n' });

describe('launcher', () => {
  test('prefers the nearest local node_modules/.bin', () => {
    const { root, choice } = resolveWith('auto', { ...bin('node_modules/.bin/mandao'), ...bin('global/mandao'), 'pkg/': '' }, ['global']);
    expect(choice).toEqual({ source: 'local', command: join(root, 'node_modules/.bin/mandao'), args: ['run', 'x'] });
  });

  test('falls back to a global install on PATH', () => {
    const { root, choice } = resolveWith('auto', { ...bin('global/mandao'), 'pkg/': '' }, ['global']);
    expect(choice).toMatchObject({ source: 'global', command: join(root, 'global/mandao') });
  });

  test('ends with npx pinned to the locked version', () => {
    const { choice } = resolveWith('auto', { 'pkg/': '' });
    expect(choice).toEqual({ source: 'npx', command: 'npx', args: ['-y', 'mandao@1.2.3', 'run', 'x'] });
  });

  test('a forced runner never falls back', () => {
    expect(resolveWith('local', { ...bin('global/mandao'), 'pkg/': '' }, ['global']).choice).toEqual({ source: 'none', runner: 'local' });
    expect(resolveWith('npx', { ...bin('node_modules/.bin/mandao'), 'pkg/': '' }).choice.source).toBe('npx');
  });
});

test('the launcher propagates the exit code of the resolved command', () => {
  const root = makeTree({ 'node_modules/.bin/mandao': '#!/bin/sh\nexit 7\n', 'pkg/': '' });
  chmodSync(join(root, 'node_modules/.bin/mandao'), 0o755);
  const script = join(root, 'launcher.mjs');
  writeFileSync(script, launcherScript('1.2.3', 'auto'));
  let status = 0;
  try {
    execFileSync(process.execPath, [script], { cwd: join(root, 'pkg'), env: { PATH: '' }, stdio: 'ignore' });
  } catch (e) {
    status = (e as { status: number }).status;
  }
  expect(status).toBe(7);
});
