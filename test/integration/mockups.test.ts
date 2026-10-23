// mandao-scans: none — copies the MDO-0001 fixture into temporary trees and lists only those.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { mockupBlockers, mockupHashes } from '../../src/scripts/mockups.js';
import { withStatus } from '../../src/spec/index.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
  for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

/** The fixture as a layout `version` spec of a React project (`mandao`), documents in draft, committed. */
function repo(version: 1 | 2, deps: Record<string, string> = { react: '^18.0.0' }) {
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
const cli = (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', ...args]);
const lastJson = () => JSON.parse(out.at(-1)!);
const write = (root: string, f: string, text: string) => {
  mkdirSync(dirname(join(root, SPEC, f)), { recursive: true });
  writeFileSync(join(root, SPEC, f), text);
};
const mockReadme = (fm: string) => `---\nschema_version: 1\n${fm}\n---\n\n# Mockups\n`;
const state = (root: string) => parseYaml(readFileSync(join(root, SPEC, '_log/state.yml'), 'utf8')) as Record<string, unknown>;

describe('run mock-offer', () => {
  test('a React project, a story without UX references, nothing decided: suggest', async () => {
    const root = repo(2);
    await cli(root, 'run', 'mock-offer', 'MDO-0001');
    expect(lastJson()).toEqual({ suggest: true, reason: expect.any(String), uiProjects: ['mandao'], uxReferences: false });
  });

  test('a back-end project is not suggested; projects[].ui: true overrides it', async () => {
    const root = repo(2, { express: '^4.0.0' });
    await cli(root, 'run', 'mock-offer', 'MDO-0001');
    expect(lastJson()).toMatchObject({ suggest: false, uiProjects: [] });
    const config = parseYaml(readFileSync(join(root, '.mandao/config.yml'), 'utf8'));
    config.projects[0].ui = true;
    writeYaml(join(root, '.mandao/config.yml'), config);
    await cli(root, 'run', 'mock-offer', 'MDO-0001');
    expect(lastJson()).toMatchObject({ suggest: true, uiProjects: ['mandao'] });
  });

  test('--record writes the mock section of state.yml once; a second record needs --force', async () => {
    const root = repo(2);
    await cli(root, 'run', 'mock-offer', 'MDO-0001', '--record', 'accepted', '--source', 'html');
    expect(lastJson()).toMatchObject({ suggest: false, decided: 'accepted', source: 'html', recorded: true });
    // The design skill is offered as a command for the session to run; the script installs nothing.
    expect(lastJson().skills).toEqual([
      { id: 'ai-design-skills', install: 'node .mandao/bin/mandao.mjs skills add ai-design-skills --yes' },
    ]);
    expect(existsSync(join(root, '.claude/skills/ai-design-skills'))).toBe(false);
    expect(state(root).mock).toEqual({ decision: 'accepted', source: 'html', at: expect.any(String) });
    await expect(cli(root, 'run', 'mock-offer', 'MDO-0001', '--record', 'declined')).rejects.toThrow(/already accepted.*--force/);
    await cli(root, 'run', 'mock-offer', 'MDO-0001', '--record', 'declined', '--force');
    expect(state(root).mock).toEqual({ decision: 'declined', at: expect.any(String) });
    expect(lastJson().skills).toBeUndefined();
  });

  test('--source goes only with accepted; an unknown decision is refused', async () => {
    const root = repo(2);
    await expect(cli(root, 'run', 'mock-offer', 'MDO-0001', '--record', 'declined', '--source', 'html')).rejects.toThrow(/source/);
    await expect(cli(root, 'run', 'mock-offer', 'MDO-0001', '--record', 'maybe')).rejects.toThrow(/accepted.*declined/);
  });

  test('a version 1 spec suggests nothing and refuses to record, saying why', async () => {
    const root = repo(1);
    await cli(root, 'run', 'mock-offer', 'MDO-0001');
    expect(lastJson()).toMatchObject({ suggest: false, reason: expect.stringMatching(/version 1/) });
    await expect(cli(root, 'run', 'mock-offer', 'MDO-0001', '--record', 'declined')).rejects.toThrow(/version 1/);
  });
});

describe('approve design with a mock', () => {
  test('refuses an accepted mock without mockups/README.md', async () => {
    const root = repo(2);
    await cli(root, 'run', 'mock-offer', 'MDO-0001', '--record', 'accepted', '--source', 'html');
    await cli(root, 'approve', 'MDO-0001', 'design');
    expect(lastJson()).toMatchObject({ approved: false, problems: [expect.stringMatching(/mockups\/README\.md is missing/)] });
  });

  test('refuses a listed file that is missing, and a design source without an export', async () => {
    const root = repo(2);
    write(root, 'mockups/README.md', mockReadme('source: html\nfiles: [form.html]'));
    await cli(root, 'approve', 'MDO-0001', 'design');
    expect(lastJson()).toMatchObject({ approved: false, problems: [expect.stringContaining('mockups/form.html')] });
    write(root, 'mockups/README.md', mockReadme('source: design\nlink: https://claude.ai/design/p/x\nfiles: [notes.md]'));
    write(root, 'mockups/notes.md', 'notes');
    await cli(root, 'approve', 'MDO-0001', 'design');
    expect(lastJson().problems).toEqual([expect.stringMatching(/claude\.ai link is private/)]);
  });

  test('approves with the mock hashed; a mock changed afterwards is reported by next', async () => {
    const root = repo(2);
    write(root, 'mockups/README.md', mockReadme('source: design\nartboard: Form\nfiles: [form.png]'));
    write(root, 'mockups/form.png', 'png-bytes');
    await cli(root, 'approve', 'MDO-0001', 'design');
    const approved = lastJson();
    expect(approved).toMatchObject({ approved: true });
    expect(Object.keys(approved.sha256)).toEqual(expect.arrayContaining(['mockups/README.md', 'mockups/form.png']));
    write(root, 'mockups/form.png', 'other-bytes');
    await cli(root, 'run', 'next', 'MDO-0001');
    expect(lastJson().recommended.reason).toMatch(/mockups\/form\.png changed after its approval/);
  });
});

describe('the mock reaches the brief and the review pack of a UI task', () => {
  test('brief: mockup with the README, the files and the source, never the link', async () => {
    const root = repo(2);
    write(
      root,
      'mockups/README.md',
      mockReadme('source: design\nlink: https://claude.ai/design/p/secret\nartboard: Form\nfiles: [form.png]'),
    );
    write(root, 'mockups/form.png', 'png');
    await cli(root, 'run', 'brief', 'MDO-0001', 'T1');
    const brief = lastJson();
    expect(brief.mockup).toEqual({
      readme: `${SPEC}/mockups/README.md`,
      files: [`${SPEC}/mockups/form.png`],
      source: 'design',
      artboard: 'Form',
    });
    expect(JSON.stringify(brief)).not.toContain('claude.ai');
  });

  test('brief: no mockup for a project without a UI surface, nor without a README', async () => {
    const api = repo(2, { express: '^4.0.0' });
    write(api, 'mockups/README.md', mockReadme('source: html\nfiles: [form.html]'));
    await cli(api, 'run', 'brief', 'MDO-0001', 'T1');
    expect(lastJson().mockup).toBeUndefined();
    const web = repo(2);
    await cli(web, 'run', 'brief', 'MDO-0001', 'T1');
    expect(lastJson().mockup).toBeUndefined();
  });

  test('review pack: an Approved mock section with the files and the README body, without the link', async () => {
    const root = repo(2);
    write(
      root,
      'mockups/README.md',
      `${mockReadme('source: design\nlink: https://claude.ai/design/p/secret\nfiles: [form.png]')}\nStarting points: ux.md\n`,
    );
    write(root, 'mockups/form.png', 'png');
    await cli(root, 'run', 'review-pack', 'MDO-0001', 'T1');
    const pack = readFileSync(join(root, lastJson().pack), 'utf8');
    expect(pack).toContain('## Approved mock');
    expect(pack).toContain(`${SPEC}/mockups/form.png`);
    expect(pack).toContain('Starting points: ux.md');
    expect(pack).not.toContain('claude.ai');
  });
});

describe('rework: private links, missing files, broken README, symlinks', () => {
  const link = 'https://claude.ai/design/p/secret';
  test('F1: a link pasted in the README body never reaches the pack, and the approval refuses it', async () => {
    const root = repo(2);
    write(
      root,
      'mockups/README.md',
      `${mockReadme(`source: design\nlink: ${link}\nfiles: [form.png]`)}\nCanvas: ${link} and https://claude.ai/chat/other\n`,
    );
    write(root, 'mockups/form.png', 'png');
    await cli(root, 'run', 'review-pack', 'MDO-0001', 'T1');
    const pack = readFileSync(join(root, lastJson().pack), 'utf8');
    expect(pack).not.toContain('claude.ai/');
    expect(pack).toContain('Canvas: [private claude.ai link omitted] and [private claude.ai link omitted]');
    await cli(root, 'approve', 'MDO-0001', 'design');
    expect(lastJson()).toMatchObject({ approved: false, problems: [expect.stringMatching(/frontmatter `link`/)] });
  });

  test('F9: a listed file missing after approval is in the brief and the pack, and next reports its deletion', async () => {
    const root = repo(2);
    write(root, 'mockups/README.md', mockReadme('source: html\nfiles: [form.html, empty.html]'));
    write(root, 'mockups/form.html', '<p>');
    write(root, 'mockups/empty.html', '<p>');
    await cli(root, 'approve', 'MDO-0001', 'design');
    expect(lastJson()).toMatchObject({ approved: true });
    rmSync(join(root, SPEC, 'mockups/empty.html'));
    await cli(root, 'run', 'brief', 'MDO-0001', 'T1');
    expect(lastJson().mockup).toMatchObject({
      files: [`${SPEC}/mockups/form.html`, `${SPEC}/mockups/empty.html`],
      missing: [`${SPEC}/mockups/empty.html`],
    });
    await cli(root, 'run', 'review-pack', 'MDO-0001', 'T1');
    expect(readFileSync(join(root, lastJson().pack), 'utf8')).toMatch(/Missing.*mockups\/empty\.html/);
    await cli(root, 'run', 'next', 'MDO-0001');
    expect(lastJson().recommended.reason).toMatch(/mockups\/empty\.html changed after its approval/);
  });

  test('F11: a README that stops parsing gives the brief its path and the problem, and the pack says so', async () => {
    const root = repo(2);
    write(root, 'mockups/README.md', mockReadme('source: figma\nfiles: [a.png]'));
    await cli(root, 'run', 'brief', 'MDO-0001', 'T1');
    expect(lastJson().mockup).toEqual({ readme: `${SPEC}/mockups/README.md`, problem: expect.stringMatching(/source/) });
    await cli(root, 'run', 'review-pack', 'MDO-0001', 'T1');
    expect(readFileSync(join(root, lastJson().pack), 'utf8')).toMatch(/mockups\/README\.md does not parse/);
  });

  test('F10: symlinks under mockups/ are not hashed or followed', () => {
    const outside = makeTree({ 'secret.txt': 'outside' });
    const dir = makeTree({ 'mockups/form.png': 'png' });
    symlinkSync(outside, join(dir, 'mockups/linked'));
    symlinkSync(join(outside, 'secret.txt'), join(dir, 'mockups/file-link.png'));
    expect(Object.keys(mockupHashes(dir))).toEqual(['mockups/form.png']);
  });

  test('round 3: a listed path through a symlinked folder is not a regular file of mockups/', () => {
    const outside = makeTree({ 'a.html': '<p>' });
    const dir = makeTree({ 'mockups/README.md': mockReadme('source: html\nfiles: [x/a.html]') });
    symlinkSync(outside, join(dir, 'mockups/x'));
    expect(mockupBlockers(dir)).toEqual([expect.stringMatching(/mockups\/x\/a\.html is not a regular file/)]);
  });
});
