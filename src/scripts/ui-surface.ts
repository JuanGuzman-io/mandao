import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProjectConfig } from '../schemas/index.js';
import { readDependencies } from './fingerprint.js';
import { projectDir } from './impact.js';

/** What decides a project's UI surface, read from its folder by `uiEvidence` (phase 13). */
export interface UiEvidence {
  /** Declared dependency names. */
  dependencies: string[];
  /** Project-relative marker files present (directories end in `/`). */
  files: string[];
  /** `pubspec.yaml` declares Flutter. */
  flutter?: boolean;
  /** Root or `app/` Gradle files that apply the Android application plugin. */
  androidGradle?: string[];
}

/** Front-end and mobile frameworks; an entry ending in `/` is a package scope. */
const UI_DEPENDENCIES = [
  'react',
  'react-dom',
  'vue',
  '@angular/core',
  'svelte',
  'solid-js',
  'preact',
  'next',
  'nuxt',
  '@remix-run/',
  'astro',
  'react-native',
  'expo',
];
const HTML_ENTRIES = ['index.html', 'public/index.html', 'src/index.html'];
const GRADLE = ['build.gradle', 'build.gradle.kts', 'settings.gradle', 'settings.gradle.kts'];
const ANDROID_FILES = [
  ...GRADLE.flatMap((f) => [`android/${f}`, `android/app/${f}`]),
  'app/src/main/AndroidManifest.xml',
  'android/app/src/main/AndroidManifest.xml',
];
/** Root Gradle files that are Android only when they apply the Android plugin (a JVM `app/` module is not a UI). */
const GRADLE_AT_ROOT = ['build.gradle', 'build.gradle.kts', 'app/build.gradle', 'app/build.gradle.kts'];
const ANDROID_PLUGIN = /com\.android\.application|^\s*android\s*\{/m;
const XCODE = /^(?:ios\/)?[^/]+\.(?:xcodeproj|xcworkspace)\/$/;
const TEMPLATE_DIR = /^(?:templates|views)$/i;
const TEMPLATE_FILE = /\.(?:html?|erb|blade\.php|cshtml|jinja2?|j2|twig|hbs)$/i;
/** A server-rendered template: a template file under a `templates/` or `views/` folder. */
const isTemplate = (f: string) =>
  TEMPLATE_FILE.test(f) &&
  f
    .split('/')
    .slice(0, -1)
    .some((seg) => TEMPLATE_DIR.test(seg));

const isUiDependency = (name: string) => UI_DEPENDENCIES.some((d) => (d.endsWith('/') ? name.startsWith(d) : name === d));

/** Pure: whether the evidence shows a UI surface, and why. */
export function uiSurface(evidence: UiEvidence): { ui: boolean; reason: string } {
  const dep = evidence.dependencies.find(isUiDependency);
  if (dep) return { ui: true, reason: `front-end or mobile dependency ${dep}` };
  if (evidence.flutter && evidence.files.includes('pubspec.yaml')) return { ui: true, reason: 'Flutter pubspec.yaml' };
  const android = evidence.androidGradle?.[0];
  if (android) return { ui: true, reason: `Android application ${android}` };
  const mobile = evidence.files.find((f) => XCODE.test(f) || ANDROID_FILES.includes(f));
  if (mobile) return { ui: true, reason: `mobile project ${mobile}` };
  const html = evidence.files.find((f) => HTML_ENTRIES.includes(f));
  if (html) return { ui: true, reason: `HTML entry ${html}` };
  const template = evidence.files.find(isTemplate);
  if (template) return { ui: true, reason: `server-rendered template ${template}` };
  return { ui: false, reason: 'no front-end or mobile dependency, mobile manifest, HTML entry or web template' };
}

const isDir = (path: string) => lstatSync(path, { throwIfNoEntry: false })?.isDirectory() === true;
/** Folders never searched for templates: dependencies, build output and dot folders. */
const SKIP = /^(?:node_modules|vendor|dist|build|target|coverage|out|\..*)$/;

/** Sub-folders of `dir` (no symlinks), relative to it. */
const subdirs = (dir: string) =>
  readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !SKIP.test(e.name))
    .map((e) => e.name)
    .sort();

/** The first template file under a `templates/` or `views/` folder, searched a few levels deep. */
function findTemplate(dir: string, rel = '', depth = 0): string | undefined {
  if (depth > 6) return undefined;
  const inTemplates = rel.split('/').some((seg) => TEMPLATE_DIR.test(seg));
  if (inTemplates) {
    const file = readdirSync(join(dir, rel), { withFileTypes: true }).find((e) => e.isFile() && TEMPLATE_FILE.test(e.name));
    if (file) return `${rel}/${file.name}`;
  } else if (depth > 4) return undefined;
  for (const name of subdirs(join(dir, rel))) {
    const found = findTemplate(dir, rel ? `${rel}/${name}` : name, depth + 1);
    if (found) return found;
  }
  return undefined;
}

/** The UI markers of a project folder: dependencies (as `run fingerprint` reads them), mobile manifests, HTML entries and templates. */
export function uiEvidence(dir: string): UiEvidence {
  if (!isDir(dir)) return { dependencies: [], files: [] };
  const files = [...HTML_ENTRIES, ...ANDROID_FILES, 'pubspec.yaml'].filter((f) => existsSync(join(dir, f)));
  for (const base of ['', 'ios/']) if (isDir(join(dir, base))) files.push(...subdirs(join(dir, base)).map((d) => `${base}${d}/`));
  const template = findTemplate(dir);
  const read = (f: string) => (existsSync(join(dir, f)) ? readFileSync(join(dir, f), 'utf8') : '');
  const pubspec = read('pubspec.yaml');
  return {
    dependencies: Object.keys(readDependencies(dir)),
    files: [...files.filter((f) => !f.endsWith('/') || XCODE.test(f)), ...(template ? [template] : [])],
    flutter: /^\s+flutter\s*:/m.test(pubspec),
    androidGradle: GRADLE_AT_ROOT.filter((f) => ANDROID_PLUGIN.test(read(f))),
  };
}

/** `projects[].ui` when set, else detection from the project's folder. */
export function isUiProject(root: string, project: Pick<ProjectConfig, 'path'> & { ui?: boolean | undefined }): boolean {
  return project.ui ?? uiSurface(uiEvidence(projectDir(root, project.path))).ui;
}
