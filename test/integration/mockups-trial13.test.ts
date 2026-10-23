// mandao-scans: none — copies the MDO-0001 fixture into temporary trees and lists only those.
import { readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { mockupHashes, mockupPackSection } from '../../src/scripts/mockups.js';
import { makeTree } from '../helpers.js';
import { captureOutput, cli, mockReadme, mockRepo as repo, SPEC, writeSpecFile as write } from '../mock-fixture.js';

/** Phase 13 external trial: the code-side defects D2, D4, D5 and D6. */
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
const append = (root: string, f: string, text: string) =>
  writeFileSync(join(root, SPEC, f), `${readFileSync(join(root, SPEC, f), 'utf8')}${text}`);
const replaceIn = (root: string, f: string, from: string, to: string) => {
  const text = readFileSync(join(root, SPEC, f), 'utf8');
  expect(text).toContain(from);
  writeFileSync(join(root, SPEC, f), text.replace(from, to));
};
const pack = async (root: string) => {
  await cli(root, 'run', 'review-pack', 'MDO-0001', 'T1');
  return readFileSync(join(root, lastJson().pack), 'utf8');
};

describe('D2, D5: what mockups/ may hold', () => {
  test('D2: an html mock listing only a .txt, with the real mock unlisted, is refused twice', async () => {
    const root = repo(2);
    write(root, 'mockups/README.md', mockReadme('source: html\nfiles: [notes.txt]'));
    write(root, 'mockups/notes.txt', 'notes');
    write(root, 'mockups/list-states.html', '<p>');
    await cli(root, 'approve', 'MDO-0001', 'design');
    expect(lastJson()).toMatchObject({ approved: false });
    expect(lastJson().problems).toEqual([
      'unlisted file mockups/list-states.html: list it in files or remove it',
      expect.stringMatching(/source html lists no export/),
    ]);
  });

  test('D5: an unlisted symlink under mockups/ is refused, without following it', async () => {
    const root = repo(2);
    const outside = makeTree({ 'card.html': '<p>' });
    write(root, 'mockups/README.md', mockReadme('source: html\nfiles: [card.html]'));
    write(root, 'mockups/card.html', '<p>');
    symlinkSync(outside, join(root, SPEC, 'mockups/linked'));
    await cli(root, 'approve', 'MDO-0001', 'design');
    expect(lastJson()).toMatchObject({ approved: false, problems: ['mockups/linked is a symlink: copy the file instead'] });
  });
});

describe('review F1: mockups/ itself as a symlink', () => {
  test('is refused whatever the decision or the README, and nothing under it is hashed or read', async () => {
    const root = repo(2);
    const outside = makeTree({ 'README.md': mockReadme('source: html\nfiles: [form.html]'), 'form.html': '<p>' });
    symlinkSync(outside, join(root, SPEC, 'mockups'));
    await cli(root, 'approve', 'MDO-0001', 'design');
    expect(lastJson()).toMatchObject({ approved: false, problems: ['mockups is a symlink: use a real folder'] });
    await cli(root, 'run', 'mock-offer', 'MDO-0001', '--record', 'accepted', '--source', 'html');
    await cli(root, 'approve', 'MDO-0001', 'design');
    expect(lastJson().problems).toEqual(['mockups is a symlink: use a real folder']);
    await cli(root, 'run', 'brief', 'MDO-0001', 'T1');
    expect(lastJson().mockup).toBeUndefined();
    expect(mockupHashes(join(root, SPEC))).toEqual({});
  });
});

describe('review round 2 F5: mockups/README.md is read only as a regular file', () => {
  test('a README.md that is a symlink reaches neither the brief nor the pack, and approval refuses it', async () => {
    const root = repo(2);
    const outside = makeTree({ 'README.md': `${mockReadme('source: html\nfiles: [form.html]')}\nSECRET-OUTSIDE\n` });
    write(root, 'mockups/form.html', '<p>');
    symlinkSync(join(outside, 'README.md'), join(root, SPEC, 'mockups/README.md'));
    await cli(root, 'run', 'brief', 'MDO-0001', 'T1');
    expect(lastJson().mockup).toBeUndefined();
    const mockup = { readme: `${SPEC}/mockups/README.md`, files: [`${SPEC}/mockups/form.html`], source: 'html' as const };
    const section = mockupPackSection(root, mockup, 'rule').join('\n');
    expect(section).not.toContain('SECRET-OUTSIDE');
    expect(section).toMatch(/README\.md is not a regular file/);
    await cli(root, 'approve', 'MDO-0001', 'design');
    expect(lastJson().problems).toContain('mockups/README.md is a symlink: copy the file instead');
  });

  test('review round 3 F4: the pack reads no README through a symlinked mockups/', () => {
    const root = repo(2);
    const outside = makeTree({ 'README.md': `${mockReadme('source: html\nfiles: [form.html]')}\nSECRET-OUTSIDE\n`, 'form.html': '<p>' });
    symlinkSync(outside, join(root, SPEC, 'mockups'));
    const mockup = { readme: `${SPEC}/mockups/README.md`, files: [`${SPEC}/mockups/form.html`], source: 'html' as const };
    const section = mockupPackSection(root, mockup, 'rule').join('\n');
    expect(section).not.toContain('SECRET-OUTSIDE');
    expect(section).toMatch(/README\.md is not a regular file/);
  });
});

describe('D6: no claude.ai address reaches a brief or a pack, and approval refuses one in any document', () => {
  test.each([['https://claude.ai/design/p/7f3a9c'], ['claude.ai/design/p/7f3a9c']])(
    'an address in the story and the requirements (%s) is redacted from the brief and the pack',
    async (address) => {
      const root = repo(2);
      write(root, 'mockups/README.md', mockReadme('source: html\nfiles: [form.html]'));
      write(root, 'mockups/form.html', `<a href="${address}">canvas</a>`);
      // The trial's probe: the address inside an AC clause and a scenario's THEN, which the brief quotes.
      replaceIn(root, 'story.md', 'and its source', `and its source (${address})`);
      replaceIn(root, 'requirements.md', 'vetted flag and source', `vetted flag and source, as in ${address}`);
      append(root, 'tasks.md', `\nCanvas: ${address}\n`);
      await cli(root, 'run', 'brief', 'MDO-0001', 'T1');
      expect(out.at(-1)).not.toMatch(/claude\.ai\//);
      expect(lastJson().acceptance[0].text).toContain('[private claude.ai link omitted]');
      const content = await pack(root);
      expect(content).not.toMatch(/claude\.ai\//);
      expect(content).toContain('[private claude.ai link omitted]');
    },
  );

  test('the frontmatter link value never reaches the pack, even inside the diff of a mock file', async () => {
    const root = repo(2);
    write(root, 'mockups/README.md', mockReadme('source: design\nlink: https://canvas.example/private\nfiles: [form.html]'));
    write(root, 'mockups/form.html', '<p>see https://canvas.example/private</p>');
    expect(await pack(root)).not.toContain('canvas.example/private');
  });

  test.each([
    ['story.md', 'story'],
    ['requirements.md', 'design'],
    ['tasks.md', 'design'],
    ['tasks.md', 'tasks'],
  ])('an address in %s refuses approve %s, naming the file and line', async (file, step) => {
    const root = repo(2);
    append(root, file, '\nOld canvas: claude.ai/design/p/abc\n');
    await cli(root, 'approve', 'MDO-0001', step);
    expect(lastJson()).toMatchObject({ approved: false });
    expect(lastJson().problems).toEqual(
      expect.arrayContaining([expect.stringMatching(new RegExp(`^${file.replace('.', '\\.')}:\\d+: .*claude\\.ai`))]),
    );
  });

  test('review F2: research.md is checked too', async () => {
    const root = repo(2);
    write(root, 'research.md', '---\nschema_version: 1\nentries: []\n---\n\nSee claude.ai/design/p/abc\n');
    await cli(root, 'approve', 'MDO-0001', 'design');
    expect(lastJson().problems).toEqual(expect.arrayContaining([expect.stringMatching(/^research\.md:6: .*claude\.ai/)]));
  });

  test('review F7: a %-encoded address is refused and redacted', async () => {
    const root = repo(2);
    replaceIn(root, 'story.md', 'and its source', 'and its source (https://example.com/?u=https%3A%2F%2Fclaude%2Eai%2Fdesign)');
    await cli(root, 'approve', 'MDO-0001', 'story');
    expect(lastJson().problems).toEqual([expect.stringMatching(/^story\.md:\d+: /)]);
    const content = await pack(root);
    expect(content).toContain('[private claude.ai link omitted]');
    expect(content.split('[private claude.ai link omitted]').join('')).not.toMatch(/claude(?:\.|%2E)ai/i);
  });

  test('an address in a listed mock .html or .svg refuses the approval; a .png is not read', async () => {
    const root = repo(2);
    write(root, 'mockups/README.md', mockReadme('source: html\nfiles: [form.html, icon.svg, style.css, shot.png, spec.PDF]'));
    write(root, 'mockups/form.html', '<p>\n<a href="https://claude.ai/design/p/1">x</a>\n');
    write(root, 'mockups/icon.svg', '<svg><!-- www.claude.ai/x --></svg>');
    write(root, 'mockups/style.css', '/* claude.ai/design/p/2 */');
    write(root, 'mockups/shot.png', 'claude.ai/png-bytes');
    write(root, 'mockups/spec.PDF', 'claude.ai/pdf-bytes');
    await cli(root, 'approve', 'MDO-0001', 'design');
    // Review F2: every listed file that is text is read; only the binary images and PDF are not.
    expect(lastJson().problems).toEqual([
      expect.stringMatching(/^mockups\/form\.html:2: /),
      expect.stringMatching(/^mockups\/icon\.svg:1: /),
      expect.stringMatching(/^mockups\/style\.css:1: /),
    ]);
  });
});

describe('D4: the pack carries the Reviewer mock rule', () => {
  test('the mock paragraph of the installed rules/review.md, and the fixed instruction when it is gone', async () => {
    const root = repo(2);
    write(root, 'mockups/README.md', mockReadme('source: html\nfiles: [form.html]'));
    write(root, 'mockups/form.html', '<p>');
    const content = await pack(root);
    const section = content.slice(content.indexOf('## Approved mock'), content.indexOf('## Diff'));
    expect(section).toMatch(/A task whose brief carries `mockup` must follow the approved mock/);
    expect(section).toMatch(/records an open finding/);
    rmSync(join(root, '.mandao/templates/app/rules/review.md'));
    expect(await pack(root)).toContain(
      "Follow the approved mock: a deviation must be justified in the Implementer's report; otherwise FAIL on the core lens.",
    );
  });
});
