// mandao-scans: none — copies the MDO-0001 fixture into temporary trees and lists only those.
import { existsSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { writeYaml } from '../../src/engine/files.js';
import { mockupBlockers, mockupHashes } from '../../src/scripts/mockups.js';
import { makeTree } from '../helpers.js';
import { captureOutput, cli, mockReadme, mockRepo as repo, SPEC, writeSpecFile as write } from '../mock-fixture.js';

let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  out = captureOutput();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

const lastJson = () => JSON.parse(out.at(-1)!);
const state = (root: string) => parseYaml(readFileSync(join(root, SPEC, '_log/state.yml'), 'utf8')) as Record<string, unknown>;

describe('run mock-offer', () => {
  test('a React project, a story without UX references, nothing decided: suggest', async () => {
    const root = repo(2);
    await cli(root, 'run', 'mock-offer', 'MDO-0001');
    // Trial 13 D1: the skills come before the answer, so the one consent question can name them.
    expect(lastJson()).toEqual({
      suggest: true,
      reason: expect.any(String),
      uiProjects: ['mandao'],
      uxReferences: false,
      skills: [{ id: 'ai-design-skills', install: 'node .mandao/bin/mandao.mjs run mock-install MDO-0001 --yes' }],
    });
  });

  test('a back-end project is not suggested; projects[].ui: true overrides it', async () => {
    const root = repo(2, { express: '^4.0.0' });
    await cli(root, 'run', 'mock-offer', 'MDO-0001');
    expect(lastJson()).toMatchObject({ suggest: false, uiProjects: [] });
    expect(lastJson().skills).toBeUndefined();
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
    expect(lastJson().skills).toEqual([{ id: 'ai-design-skills', install: 'node .mandao/bin/mandao.mjs run mock-install MDO-0001 --yes' }]);
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
    expect(mockupBlockers(dir)).toEqual([
      'mockups/x is a symlink: copy the file instead',
      expect.stringMatching(/mockups\/x\/a\.html is not a regular file/),
    ]);
  });
});
