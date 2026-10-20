import { describe, expect, test } from 'vitest';
import { detectWorkspace, expandWorkspaceGlobs } from '../../src/workspace/detect.js';
import { makeTree, pkg } from '../helpers.js';

describe('detectWorkspace', () => {
  test('a plain repo is a single project at the root', () => {
    const root = makeTree({ '.git/': '', 'package.json': pkg('@acme/Shop App') });
    expect(detectWorkspace(root)).toMatchObject({
      mode: 'single',
      rootIsRepo: true,
      projects: [{ name: 'shop-app', path: '.', profile: 'app' }],
    });
  });

  test('package.json workspaces make a monorepo and only dirs with manifests count', () => {
    const root = makeTree({
      '.git/': '',
      'package.json': JSON.stringify({ name: 'root', workspaces: ['apps/*', 'packages/*'] }),
      'apps/web/package.json': pkg('web'),
      'apps/notes/': '',
      'packages/api/package.json': pkg('api', { '@anthropic-ai/sdk': '^1' }),
    });
    const ws = detectWorkspace(root);
    expect(ws.mode).toBe('monorepo');
    expect(ws.reason).toBe('package.json workspaces');
    expect(ws.projects).toEqual([
      { name: 'web', path: 'apps/web', profile: 'app' },
      { name: 'api', path: 'packages/api', profile: 'ai' },
    ]);
  });

  test('pnpm-workspace.yaml takes precedence', () => {
    const root = makeTree({
      '.git/': '',
      'pnpm-workspace.yaml': 'packages:\n  - "services/*"\n',
      'services/billing/package.json': pkg('billing'),
    });
    expect(detectWorkspace(root)).toMatchObject({ mode: 'monorepo', reason: 'pnpm-workspace.yaml' });
  });

  test('several manifests in subfolders without workspace config is a monorepo', () => {
    const root = makeTree({
      '.git/': '',
      'backend/pyproject.toml': '[project]\ndependencies = ["fastapi>=0.1", "langchain"]\n',
      'frontend/package.json': pkg('frontend'),
      'node_modules/x/package.json': pkg('x'),
    });
    const ws = detectWorkspace(root);
    expect(ws.mode).toBe('monorepo');
    expect(ws.projects.map((p) => [p.path, p.profile])).toEqual([
      ['backend', 'ai'],
      ['frontend', 'app'],
    ]);
  });

  test('a non-repo root with two child repos is a polyrepo', () => {
    const root = makeTree({
      'api/.git/config': '[core]\n\tbare = false\n[remote "origin"]\n\turl = git@github.com:acme/api.git\n',
      'api/go.mod': 'module api',
      'web/.git/': '',
      'web/package.json': pkg('web'),
      'notes/': '',
    });
    expect(detectWorkspace(root)).toMatchObject({
      mode: 'polyrepo',
      rootIsRepo: false,
      projects: [
        { name: 'api', path: 'api', repo: 'git@github.com:acme/api.git' },
        { name: 'web', path: 'web', repo: 'local' },
      ],
    });
  });

  test('dbt projects get the data profile', () => {
    const root = makeTree({ '.git/': '', 'dbt_project.yml': 'name: x' });
    expect(detectWorkspace(root).projects[0]?.profile).toBe('data');
  });

  test('colliding directory names are disambiguated with their path', () => {
    const root = makeTree({
      '.git/': '',
      'package.json': JSON.stringify({ workspaces: ['apps/*', 'packages/*'] }),
      'apps/web/package.json': pkg('a'),
      'packages/web/package.json': pkg('b'),
    });
    expect(detectWorkspace(root).projects.map((p) => p.name)).toEqual(['web', 'packages-web']);
  });
});

test('expandWorkspaceGlobs ignores negations and missing dirs', () => {
  const root = makeTree({ 'libs/a/package.json': pkg('a'), 'tools/': '' });
  expect(expandWorkspaceGlobs(root, ['libs/*', '!libs/b', 'missing/*', 'tools'])).toEqual(['libs/a', 'tools']);
});
