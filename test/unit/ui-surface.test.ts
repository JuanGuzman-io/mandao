import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { configSchema } from '../../src/schemas/config.js';
import { isUiProject, uiEvidence, uiSurface } from '../../src/scripts/ui-surface.js';
import { makeTree, pkg } from '../helpers.js';

/**
 * Phase 13: a project has a UI surface when it declares front-end or mobile dependencies, carries a
 * mobile manifest (Flutter `pubspec.yaml`, an Xcode or Gradle project under `ios/` / `android/`) or an
 * HTML entry (`index.html` at the root, under `public/` or `src/`). `projects[].ui` overrides detection.
 */
describe('uiSurface: the pure decision', () => {
  test.each([
    'react',
    'react-dom',
    'vue',
    '@angular/core',
    'svelte',
    'solid-js',
    'preact',
    'next',
    'nuxt',
    '@remix-run/react',
    'astro',
    'react-native',
    'expo',
  ])('the dependency %s is a UI surface, named in the reason', (dep) => {
    const found = uiSurface({ dependencies: [dep, 'zod'], files: [] });
    expect(found.ui).toBe(true);
    expect(found.reason).toContain(dep);
  });

  test('a back end (express, zod) without an HTML entry or mobile manifest has no UI surface', () => {
    expect(uiSurface({ dependencies: ['express', 'zod', 'remix-utils'], files: ['Dockerfile', 'pubspec.yaml'] })).toEqual({
      ui: false,
      reason: 'no front-end or mobile dependency, mobile manifest, HTML entry or web template',
    });
  });

  test.each([
    'index.html',
    'public/index.html',
    'src/index.html',
    'ios/App.xcodeproj/',
    'android/build.gradle',
    'android/app/build.gradle.kts',
  ])('the file %s is a UI surface', (file) => {
    expect(uiSurface({ dependencies: [], files: [file] })).toMatchObject({ ui: true, reason: expect.stringContaining(file) });
  });

  test('a Flutter pubspec.yaml is a UI surface; a pubspec without Flutter (a Dart CLI) is not', () => {
    expect(uiSurface({ dependencies: [], files: ['pubspec.yaml'], flutter: true }).ui).toBe(true);
    expect(uiSurface({ dependencies: [], files: ['pubspec.yaml'], flutter: false }).ui).toBe(false);
  });

  test('an HTML file elsewhere (docs/index.html) is not an HTML entry', () => {
    expect(uiSurface({ dependencies: [], files: ['docs/index.html'] }).ui).toBe(false);
  });
});

describe('uiEvidence and isUiProject: read from the project folder', () => {
  test('package.json dependencies, a Flutter pubspec, an Xcode project and an HTML entry are collected', () => {
    const dir = makeTree({
      'package.json': pkg('web', { vue: '^3.0.0' }),
      'pubspec.yaml': 'name: app\ndependencies:\n  flutter:\n    sdk: flutter\n',
      'ios/Runner.xcodeproj/project.pbxproj': '',
      'public/index.html': '<html></html>',
    });
    const evidence = uiEvidence(dir);
    expect(evidence.dependencies).toContain('vue');
    expect(evidence.flutter).toBe(true);
    expect(evidence.files).toEqual(expect.arrayContaining(['pubspec.yaml', 'ios/Runner.xcodeproj/', 'public/index.html']));
  });

  test('an empty ios/ or android/ folder is not a mobile project', () => {
    const dir = makeTree({ 'ios/': '', 'android/README.md': 'x' });
    expect(uiSurface(uiEvidence(dir)).ui).toBe(false);
  });

  test('projects[].ui overrides detection both ways', () => {
    const root = makeTree({ 'web/package.json': pkg('web', { react: '18' }), 'api/package.json': pkg('api', { express: '4' }) });
    expect(isUiProject(root, { path: 'web' })).toBe(true);
    expect(isUiProject(root, { path: 'web', ui: false })).toBe(false);
    expect(isUiProject(root, { path: 'api' })).toBe(false);
    expect(isUiProject(root, { path: 'api', ui: true })).toBe(true);
    expect(isUiProject(join(root, 'missing'), { path: '.' })).toBe(false);
  });

  test('config: projects[].ui is an optional boolean', () => {
    const base = { schema_version: 1, workspace: 'single', harnesses: ['claude'] };
    const ok = configSchema.parse({ ...base, projects: [{ name: 'web', path: '.', ui: true }] });
    expect(ok.projects[0]!.ui).toBe(true);
    expect(configSchema.parse({ ...base, projects: [{ name: 'web', path: '.' }] }).projects[0]!.ui).toBeUndefined();
    expect(configSchema.safeParse({ ...base, projects: [{ name: 'web', path: '.', ui: 'yes' }] }).success).toBe(false);
  });
});

describe('rework F5: native Android/iOS at the root and server-rendered templates', () => {
  test.each<Record<string, string>>([
    { 'app/build.gradle': "plugins { id 'com.android.application' }" },
    { 'app/build.gradle.kts': 'android {\n  namespace = "shop"\n}' },
    { 'app/src/main/AndroidManifest.xml': '<manifest/>' },
    { 'build.gradle': "plugins { id 'com.android.application' }" },
    { 'build.gradle.kts': 'plugins { id("com.android.application") }' },
    { 'Shop.xcodeproj/project.pbxproj': '' },
    { 'Shop.xcworkspace/contents.xcworkspacedata': '' },
    { 'templates/home.html': '<p>' },
    { 'app/views/users/index.html.erb': '<p>' },
    { 'resources/views/welcome.blade.php': '<p>' },
    { 'Views/Home/Index.cshtml': '<p>' },
    { 'shop/templates/base.jinja': '{{ x }}' },
    { 'templates/base.j2': '{{ x }}' },
    { 'templates/page.twig': '{{ x }}' },
    { 'views/layout.hbs': '{{x}}' },
  ])('%o is a UI surface', (files) => {
    expect(uiSurface(uiEvidence(makeTree(files)))).toMatchObject({ ui: true });
  });

  test.each<Record<string, string>>([
    { 'build.gradle': "plugins { id 'java' }" },
    { 'app/build.gradle': "plugins { id 'application' }" },
    { 'app/README.md': 'x' },
    { 'templates/issue.md': 'x', 'core/templates/shared/rule.md': 'x' },
    { 'views/README.md': 'x', 'templates/config.yml': 'x' },
    { 'node_modules/pkg/templates/a.html': '<p>' },
    { 'Shop.xcodeproj': 'a file, not a folder' },
  ])('%o is not a UI surface', (files) => {
    expect(uiSurface(uiEvidence(makeTree(files))).ui).toBe(false);
  });
});
