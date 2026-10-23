// mandao-scans: package.json — reads Mandao's package.json (files, prepare); walks the git hooks folder of temporary repos only.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeEach, expect, test, vi } from 'vitest';
import { runInit } from '../../src/cli/init.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

// ADR 0055: Mandao never installs git hooks in a user project; only its own repo does, through `prepare`.

vi.mock('@clack/prompts', () => {
  const noop = () => {};
  return {
    intro: noop,
    outro: noop,
    cancel: noop,
    isCancel: () => false,
    note: noop,
    log: { info: noop, warn: noop, message: noop, step: noop, success: noop, error: noop },
    spinner: () => ({ start: noop, stop: noop, message: noop }),
    confirm: async () => false,
    text: async () => '',
    select: async (o: { initialValue?: unknown; options: { value: unknown }[] }) => o.initialValue ?? o.options[0]?.value,
    multiselect: async () => [],
  };
});
vi.mock('../../src/cli/init-archify.js', () => ({ offerArchify: async () => {} }));

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

/** Every file under the git hooks folder with its content and mtime, so any create or touch shows. */
function hooksState(root: string): Record<string, string> {
  const hooks = resolve(root, execFileSync('git', ['rev-parse', '--git-path', 'hooks'], { cwd: root, encoding: 'utf8' }).trim());
  const out: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, name.name);
      if (name.isDirectory()) walk(full);
      else out[full.slice(hooks.length)] = `${readFileSync(full, 'utf8')}@${statSync(full).mtimeMs}`;
    }
  };
  if (existsSync(hooks)) walk(hooks);
  return out;
}

test('init and sync in a user project never create or modify git hooks', async () => {
  const root = makeTree({ 'package.json': pkg('shop') });
  initTestRepo(root);
  writeFileSync(join(root, '.git/hooks/commit-msg'), '#!/bin/sh\n# the project own hook\n');
  const before = hooksState(root);
  expect(Object.keys(before)).toContain('/commit-msg');

  await runInit(root, {
    yes: true,
    scope: 'project',
    harness: ['claude'],
    defaultProfile: 'app',
    languageBusiness: 'en',
    languageTechnical: 'en',
    budget: 'none',
    modelsMode: 'simple',
    modelProfile: 'peak',
  });
  expect(existsSync(join(root, '.mandao/config.yml'))).toBe(true);
  expect(hooksState(root)).toEqual(before);

  syncProject(root, { force: true });
  expect(hooksState(root)).toEqual(before);
});

test('sync of a project with no hooks creates none', () => {
  const root = makeTree({ 'package.json': pkg('shop') });
  initTestRepo(root);
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.' }],
    harnesses: ['claude'],
  });
  const before = hooksState(root);
  syncProject(root);
  expect(hooksState(root)).toEqual(before);
});

test('the hook installer is Mandao-repo only: it is not published and runs from prepare', () => {
  const manifest = JSON.parse(readFileSync(join(import.meta.dirname, '../../package.json'), 'utf8')) as {
    files: string[];
    scripts: Record<string, string>;
  };
  expect(manifest.files.some((f) => /^(scripts|\.?\/?scripts\/)/.test(f))).toBe(false);
  expect(manifest.files).not.toContain('scripts/install-hooks.mjs');
  expect(manifest.scripts.prepare).toBe('node scripts/install-hooks.mjs');
});
