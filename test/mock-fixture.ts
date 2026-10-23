// mandao-scans: none — copies the MDO-0001 fixture into temporary trees and lists only those.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { vi } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { buildProgram } from '../src/cli/program.js';
import { writeYaml } from '../src/engine/files.js';
import { syncProject } from '../src/engine/sync.js';
import type { Catalog, HarnessId } from '../src/schemas/index.js';
import { withStatus } from '../src/spec/index.js';
import { skillRepo } from './git-skill-fixture.js';
import { initTestRepo, makeTree, pkg } from './helpers.js';

/** Shared by the phase 13 mock tests: the MDO-0001 fixture as a spec of a React project, committed. */
const fixture = join(import.meta.dirname, 'fixtures/spec/MDO-0001-skills-list');
export const SPEC = 'specs/MDO-0001-skills-list';
export const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/** Captures `console.log` lines (the JSON the commands print) and the test git identity. */
export function captureOutput(): string[] {
  const out: string[] = [];
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
  for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  return out;
}

/** The fixture as a layout `version` spec of a React project (`mandao`), documents in draft, committed. */
export function mockRepo(version: 1 | 2, deps: Record<string, string> = { react: '^18.0.0' }) {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop', deps) }));
  initTestRepo(root, '-q', '-b', 'feat/MDO-0001-skills-list');
  git(root, 'config', 'user.name', 'Ana PO');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude'],
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  const dir = join(root, SPEC);
  for (const f of ['story.md', 'requirements.md', 'tasks.md'])
    writeFileSync(join(dir, f), withStatus(readFileSync(join(dir, f), 'utf8'), 'draft'));
  const story = readFileSync(join(dir, 'story.md'), 'utf8').replace(/^schema_version: 1$/m, `schema_version: ${version}`);
  writeFileSync(join(dir, 'story.md'), `${story}\n## UX references\n\n<!-- Figma links or screenshots -->\n`);
  mkdirSync(join(dir, '_log'));
  for (const f of ['execution.md', 'progress.yml']) renameSync(join(dir, f), join(dir, '_log', f));
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}

export const cli = (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', ...args]);
export const writeSpecFile = (root: string, f: string, text: string) => {
  mkdirSync(dirname(join(root, SPEC, f)), { recursive: true });
  writeFileSync(join(root, SPEC, f), text);
};
export const mockReadme = (fm: string) => `---\nschema_version: 1\n${fm}\n---\n\n# Mockups\n`;

/**
 * The catalog with ai-design-skills fetched from a local repository (git URL rewrite stubbed in the env): its
 * upstream folder is skills/brainstorming, and its SKILL.md is named brainstorming unless `extra` replaces it.
 */
export function localDesignSkill(real: Catalog, extra: Record<string, string> = {}): Catalog {
  const upstream = skillRepo(extra);
  vi.stubEnv('GIT_CONFIG_COUNT', '1');
  vi.stubEnv('GIT_CONFIG_KEY_0', `url.${upstream.localUrl}.insteadOf`);
  vi.stubEnv('GIT_CONFIG_VALUE_0', upstream.url);
  const design = real.skills['ai-design-skills']!;
  const source = { type: 'git' as const, url: upstream.url, ref: 'v7.0.0', path: 'skills/brainstorming', commit: upstream.commit };
  return { ...real, skills: { ...real.skills, 'ai-design-skills': { ...design, source } } };
}

/** Sets the workspace harnesses and commits the config. */
export function setHarnesses(root: string, harnesses: HarnessId[]) {
  const file = join(root, '.mandao/config.yml');
  writeYaml(file, { ...parseYaml(readFileSync(file, 'utf8')), harnesses });
  git(root, 'commit', '-qam', 'harnesses');
}
