import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { launcherScript } from '../../src/engine/launcher.js';
import { makeTree } from '../helpers.js';

/** Runs the generated launcher in print mode from `cwd` with the given PATH. */
function resolveWith(runner: 'auto' | 'local' | 'global' | 'npx', files: Record<string, string>, pathDirs: string[] = []) {
  // realpath: on macOS the temp dir is a symlink and process.cwd() returns the resolved path.
  const root = realpathSync(makeTree({ '.mandao/mandao.lock': 'mandao: 1.2.3\n', ...files }));
  const script = join(root, '.mandao/bin/mandao.mjs');
  mkdirSync(join(root, '.mandao/bin'), { recursive: true });
  writeFileSync(script, launcherScript('1.2.3', runner));
  for (const path of Object.keys(files).filter((path) => path.endsWith('/mandao'))) chmodSync(join(root, path), 0o755);
  const out = execFileSync(process.execPath, [script, 'run', 'x'], {
    cwd: join(root, 'pkg'),
    env: { PATH: pathDirs.map((d) => join(root, d)).join(':'), MANDAO_LAUNCHER_PRINT: '1' },
    encoding: 'utf8',
  });
  return { root, choice: JSON.parse(out) as { source: string; command?: string; args?: string[] } };
}

const bin = (path: string, version = '1.2.3') => ({
  [path]: `#!/bin/sh\nif [ "$1" = "--version" ]; then echo ${version}; exit 0; fi\n`,
});

describe('launcher', () => {
  test('prefers the nearest local node_modules/.bin when it matches the lock', () => {
    const { root, choice } = resolveWith('auto', { ...bin('node_modules/.bin/mandao'), ...bin('global/mandao'), 'pkg/': '' }, ['global']);
    expect(choice).toMatchObject({ source: 'local', command: join(root, 'node_modules/.bin/mandao'), args: ['run', 'x'] });
  });

  test('falls back to a global install on PATH', () => {
    const { root, choice } = resolveWith('auto', { ...bin('global/mandao'), 'pkg/': '' }, ['global']);
    expect(choice).toMatchObject({ source: 'global', command: join(root, 'global/mandao') });
  });

  test('ignores an older global install and pins npx to the lock', () => {
    const { choice } = resolveWith('auto', { ...bin('global/mandao', '1.0.0'), 'pkg/': '' }, ['global']);
    expect(choice).toEqual({
      source: 'npx',
      command: 'npx',
      args: ['-y', 'mandao@1.2.3', 'run', 'x'],
      mismatch: { source: 'global', version: '1.0.0' },
    });
  });

  test('reads the current lock instead of relying on the version embedded at sync time', () => {
    const { choice } = resolveWith(
      'auto',
      {
        '.mandao/mandao.lock': 'mandao: 2.0.0\n',
        ...bin('global/mandao', '1.2.3'),
        'pkg/': '',
      },
      ['global'],
    );
    expect(choice).toMatchObject({ source: 'npx', args: ['-y', 'mandao@2.0.0', 'run', 'x'] });
  });

  test('prefers the current Mandao worktree build while dogfooding', () => {
    const { root, choice } = resolveWith(
      'auto',
      {
        ...bin('global/mandao', '1.0.0'),
        'package.json': '{"name":"mandao","version":"1.2.3"}',
        'dist/cli.js': '#!/usr/bin/env node\n',
        'pkg/': '',
      },
      ['global'],
    );
    expect(choice).toMatchObject({ source: 'worktree', command: process.execPath, args: [join(root, 'dist/cli.js'), 'run', 'x'] });
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
  const root = makeTree({
    '.mandao/mandao.lock': 'mandao: 1.2.3\n',
    'node_modules/.bin/mandao': '#!/bin/sh\nif [ "$1" = "--version" ]; then echo 1.2.3; exit 0; fi\nexit 7\n',
    'pkg/': '',
  });
  chmodSync(join(root, 'node_modules/.bin/mandao'), 0o755);
  const script = join(root, '.mandao/bin/mandao.mjs');
  mkdirSync(join(root, '.mandao/bin'), { recursive: true });
  writeFileSync(script, launcherScript('1.2.3', 'auto'));
  let status = 0;
  try {
    execFileSync(process.execPath, [script], { cwd: join(root, 'pkg'), env: { PATH: '' }, stdio: 'ignore' });
  } catch (e) {
    status = (e as { status: number }).status;
  }
  expect(status).toBe(7);
});

test('when the locked version cannot run, the launcher says how to pin the installed one', () => {
  const root = realpathSync(
    makeTree({
      '.mandao/mandao.lock': 'mandao: 1.2.3\n',
      ...bin('node_modules/.bin/mandao', '2.0.0'),
      'tools/npx': '#!/bin/sh\necho "npm error 404 mandao@1.2.3" >&2\nexit 1\n',
      'pkg/': '',
    }),
  );
  for (const path of ['node_modules/.bin/mandao', 'tools/npx']) chmodSync(join(root, path), 0o755);
  const script = join(root, '.mandao/bin/mandao.mjs');
  mkdirSync(join(root, '.mandao/bin'), { recursive: true });
  writeFileSync(script, launcherScript('1.2.3', 'auto'));
  let failure = { status: 0, stderr: '' };
  try {
    execFileSync(process.execPath, [script, 'doctor'], {
      cwd: join(root, 'pkg'),
      env: { PATH: join(root, 'tools') },
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch (e) {
    failure = e as { status: number; stderr: string };
  }
  expect(failure.status).toBe(1);
  expect(failure.stderr).toContain('if npm could not fetch the locked mandao@1.2.3');
  expect(failure.stderr).toContain(`${join(root, 'node_modules/.bin/mandao')} sync`);
});
