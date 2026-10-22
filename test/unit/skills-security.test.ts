// mandao-scans: none — creates and removes only the temporary trees it owns.
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test, vi } from 'vitest';

const childProcessMock = vi.hoisted(() => ({
  spawnSync: vi.fn(),
  originalSpawnSync: undefined as ((...args: unknown[]) => unknown) | undefined,
}));

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  childProcessMock.originalSpawnSync = actual.spawnSync as (...args: unknown[]) => unknown;
  childProcessMock.spawnSync.mockImplementation((...args: unknown[]) => childProcessMock.originalSpawnSync!(...args));
  return { ...actual, spawnSync: childProcessMock.spawnSync };
});

import { catalogSchema } from '../../src/schemas/index.js';
import { installSkills, type Runner, shellRunner } from '../../src/skills/install.js';
import { makeTree } from '../helpers.js';

const meta = { version: '1.0.0', author: 'a', license: 'MIT', vetted: true, binding: 'stack', phases: ['implement'], description: 'x' };
const url = 'https://fixture.invalid/skill.git';

function catalog(repo: string, commit = 'a'.repeat(40)) {
  return catalogSchema.parse({
    schema_version: 1,
    bootstrap: ['brainstorming'],
    skills: {
      brainstorming: {
        ...meta,
        source: { type: 'git', url: repo, ref: 'v1.0.0', path: 'skills/brainstorming', commit },
      },
    },
    technologies: {},
  });
}

function withLocalGit<T>(repo: string, local: string, run: () => T): T {
  const keys = ['GIT_CONFIG_COUNT', 'GIT_CONFIG_KEY_0', 'GIT_CONFIG_VALUE_0'] as const;
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  process.env.GIT_CONFIG_COUNT = '1';
  process.env.GIT_CONFIG_KEY_0 = `url.${local}.insteadOf`;
  process.env.GIT_CONFIG_VALUE_0 = repo;
  try {
    return run();
  } finally {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function localRepo() {
  const dir = makeTree({ 'skills/brainstorming/SKILL.md': '---\n---\n' });
  const git = (...args: string[]) =>
    execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false', ...args], { cwd: dir });
  git('init', '--quiet', '--initial-branch=main');
  git('config', 'uploadpack.allowFilter', 'true');
  git('add', '-A');
  git('commit', '--quiet', '-m', 'fixture');
  git('tag', 'v1.0.0');
  return { dir, commit: String(git('rev-parse', 'HEAD')).trim() };
}

describe('skill source security', () => {
  test.each([
    'http://example.invalid/skill.git',
    'file:///tmp/skill.git',
    'ssh://git@example.invalid/skill.git',
    'git://example.invalid/skill.git',
    'not-a-url',
  ])('rejects non-HTTPS source %s before starting git or copying files', (repo) => {
    const root = makeTree({});
    const source = catalog(url);
    const candidate = structuredClone(source);
    (candidate.skills.brainstorming!.source as { url: string }).url = repo;
    expect(catalogSchema.safeParse(candidate).success).toBe(false);
    (source.skills.brainstorming!.source as { url: string }).url = repo;
    const runner: Runner = { run: () => true, has: () => true };
    childProcessMock.spawnSync.mockClear();
    const [result] = installSkills(['brainstorming'], source, root, root, runner, { harnesses: ['claude', 'codex'] });
    expect(result).toMatchObject({ status: 'failed' });
    expect(result?.detail).toContain('unsupported repository URL');
    expect(childProcessMock.spawnSync).not.toHaveBeenCalled();
    expect(existsSync(join(root, '.claude/skills/brainstorming'))).toBe(false);
  });

  test.each([
    ['--keep-user-option', 'yes'],
    ['-o BatchMode=yes --keep-user-option', 'yes'],
    ['-o BatchMode=no --keep-user-option', 'no'],
  ])('preserves GIT_SSH_COMMAND (%s), adding BatchMode only when absent', (options, expectedBatchMode) => {
    const repo = localRepo();
    const root = makeTree({});
    const wrapper = join(root, 'ssh-wrapper');
    writeFileSync(wrapper, '#!/bin/sh\nexit 1\n');
    chmodSync(wrapper, 0o755);
    const previous = process.env.GIT_SSH_COMMAND;
    process.env.GIT_SSH_COMMAND = `${wrapper} ${options}`;
    let command: string | undefined;
    childProcessMock.spawnSync.mockImplementation((...args: unknown[]) => {
      if ((args[1] as string[] | undefined)?.includes('clone')) {
        command = (args[2] as { env?: NodeJS.ProcessEnv } | undefined)?.env?.GIT_SSH_COMMAND;
      }
      return childProcessMock.originalSpawnSync!(...args);
    });
    try {
      const result = withLocalGit(
        url,
        `file://${repo.dir}`,
        () => installSkills(['brainstorming'], catalog(url, repo.commit), root, root, shellRunner, { harnesses: ['claude'] })[0],
      );
      expect(result?.status).toBe('installed');
      expect(command).toContain(wrapper);
      expect(command).toContain('--keep-user-option');
      expect(command).toMatch(new RegExp(`BatchMode=${expectedBatchMode}`));
      expect((command?.match(/BatchMode=/g) ?? []).length).toBe(1);
    } finally {
      if (previous === undefined) delete process.env.GIT_SSH_COMMAND;
      else process.env.GIT_SSH_COMMAND = previous;
    }
  });
});
