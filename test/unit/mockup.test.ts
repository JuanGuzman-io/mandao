import { describe, expect, test } from 'vitest';
import { hasUxReferences, mockOffer, mockupProblems, parseMockupReadme, redactPrivateLinks } from '../../src/spec/mockup.js';
import { changedSince } from '../../src/spec/next.js';
import { parseState, renderState } from '../../src/spec/state.js';

const readme = (fm: string) => `---\nschema_version: 1\n${fm}\n---\n\n# Mockups\n`;
const story = (ux: string) => `---\nschema_version: 2\n---\n# T\n\n## Dependencies\n\n## UX references\n${ux}\n## Data involved\n\nx\n`;

describe('mockups/README.md frontmatter', () => {
  test('html with files parses; design carries link and artboard', () => {
    expect(parseMockupReadme(readme('source: html\nfiles: [form.html]')).readme).toEqual({
      schema_version: 1,
      source: 'html',
      files: ['form.html'],
    });
    const design = parseMockupReadme(readme('source: design\nlink: https://claude.ai/design/x\nartboard: Form\nfiles: [form.png]'));
    expect(design.readme).toMatchObject({ source: 'design', link: 'https://claude.ai/design/x', artboard: 'Form' });
  });

  test('link and artboard only with source design; files are paths inside mockups/', () => {
    expect(parseMockupReadme(readme('source: html\nlink: https://x\nfiles: [a.html]')).issues.join()).toMatch(/link/);
    expect(parseMockupReadme(readme('source: html\nartboard: A\nfiles: [a.html]')).issues.join()).toMatch(/artboard/);
    expect(parseMockupReadme(readme('source: html\nfiles: [../a.html]')).issues).not.toEqual([]);
    expect(parseMockupReadme(readme('source: html\nfiles: [/tmp/a.html]')).issues).not.toEqual([]);
    expect(parseMockupReadme(readme('source: figma\nfiles: [a.html]')).issues).not.toEqual([]);
  });
});

describe('mockupProblems: what refuses the design (lite: spec) approval', () => {
  const all = () => 'file' as const;
  test('no README and no accepted mock: nothing to check', () => {
    expect(mockupProblems({ kind: all })).toEqual([]);
    expect(mockupProblems({ decision: 'declined', kind: all })).toEqual([]);
  });

  test('an accepted mock without mockups/README.md is refused', () => {
    expect(mockupProblems({ decision: 'accepted', kind: all })).toEqual([expect.stringMatching(/accepted.*mockups\/README\.md/)]);
  });

  test('a listed file that is missing is refused, by name', () => {
    const problems = mockupProblems({
      readme: readme('source: html\nfiles: [a.html, b.html]'),
      kind: (f) => (f === 'a.html' ? 'file' : 'missing'),
    });
    expect(problems).toEqual([expect.stringContaining('mockups/b.html')]);
  });

  test('source design without an export file is refused: the claude.ai link is private', () => {
    const problems = mockupProblems({ readme: readme('source: design\nlink: https://claude.ai/x\nfiles: [notes.md]'), kind: all });
    expect(problems).toEqual([expect.stringMatching(/claude\.ai link is private.*export the chosen artboard into mockups\//)]);
  });

  test.each(['a.html', 'a.htm', 'a.png', 'a.jpg', 'a.jpeg', 'a.webp', 'a.svg', 'a.PDF'])('source design with %s is accepted', (file) => {
    expect(mockupProblems({ readme: readme(`source: design\nfiles: [${file}]`), kind: all })).toEqual([]);
  });

  test('an invalid README is refused with its issues', () => {
    expect(mockupProblems({ readme: readme('source: html'), kind: all })[0]).toMatch(/^mockups\/README\.md: /);
  });
});

describe('rework F1, F12: private links and what files may list', () => {
  const all = () => 'file' as const;
  test('F1: the link or any claude.ai URL in the README body is refused: keep it only in the frontmatter link', () => {
    const link = 'https://claude.ai/design/p/abc';
    const withLink = `${readme(`source: design\nlink: ${link}\nfiles: [a.png]`)}\nSee ${link} for the canvas.\n`;
    expect(mockupProblems({ readme: withLink, kind: all })).toEqual([expect.stringMatching(/body.*private.*frontmatter `link`/)]);
    const other = `${readme('source: html\nfiles: [a.html]')}\nOld canvas: https://www.claude.ai/chat/xyz\n`;
    expect(mockupProblems({ readme: other, kind: all })).toEqual([expect.stringMatching(/frontmatter `link`/)]);
  });

  test('F1: redactPrivateLinks replaces the link value and every claude.ai URL', () => {
    const text = 'a https://canvas.example/x b https://claude.ai/design/p/1?q=2 c https://sub.claude.ai/y.';
    expect(redactPrivateLinks(text, 'https://canvas.example/x')).toBe(
      'a [private claude.ai link omitted] b [private claude.ai link omitted] c [private claude.ai link omitted].',
    );
    expect(redactPrivateLinks('$& https://claude.ai/z', undefined)).toBe('$& [private claude.ai link omitted]');
  });

  test('round 3: claude.ai URLs without a scheme are redacted; look-alike hosts are not', () => {
    expect(redactPrivateLinks('see claude.ai/design/p/1, www.claude.ai/x and claude.ai.', undefined)).toBe(
      'see [private claude.ai link omitted], [private claude.ai link omitted] and [private claude.ai link omitted].',
    );
    expect(redactPrivateLinks('notclaude.ai/x and claude.aim/x and my-claude.ai/y', undefined)).toBe(
      'notclaude.ai/x and claude.aim/x and my-claude.ai/y',
    );
  });

  test('round 4: a claude.ai address inside "[private ...]" is still redacted and refused; redaction is idempotent', () => {
    const texts = ['[private claude.ai/design/p/abc]', '[private www.claude.ai/x]'];
    for (const text of texts) {
      const once = redactPrivateLinks(text, undefined);
      expect(once, text).not.toMatch(/claude\.ai\//);
      expect(redactPrivateLinks(once, undefined), text).toBe(once);
      const body = `${readme('source: design\nfiles: [a.png]')}\n${text}\n`;
      expect(mockupProblems({ readme: body, kind: () => 'file' }), text).toEqual([expect.stringMatching(/frontmatter `link`/)]);
    }
    const mixed = 'a https://claude.ai/x b [private claude.ai link omitted] c claude.ai';
    const once = redactPrivateLinks(mixed, undefined);
    expect(once).toBe('a [private claude.ai link omitted] b [private claude.ai link omitted] c [private claude.ai link omitted]');
    expect(redactPrivateLinks(once, undefined)).toBe(once);
    expect(
      mockupProblems({ readme: `${readme('source: html\nfiles: [a.html]')}\n[private claude.ai link omitted]\n`, kind: () => 'file' }),
    ).toEqual([]);
  });

  test('round 3: a scheme-less claude.ai URL in the body refuses the approval', () => {
    const body = `${readme('source: design\nfiles: [a.png]')}\nCanvas: claude.ai/design/p/abc\n`;
    expect(mockupProblems({ readme: body, kind: () => 'file' })).toEqual([expect.stringMatching(/frontmatter `link`/)]);
  });

  test.each(['.', './a.html', 'a//b.html', 'shots/', 'README.md'])('F12: files entry %s is refused by the schema', (entry) => {
    expect(parseMockupReadme(readme(`source: html\nfiles: ['${entry}']`)).issues).not.toEqual([]);
  });

  test('F12: a listed entry that is a folder (or not a regular file) is refused', () => {
    const problems = mockupProblems({ readme: readme('source: html\nfiles: [shots]'), kind: () => 'other' });
    expect(problems).toEqual([expect.stringMatching(/mockups\/shots is not a regular file/)]);
  });
});

describe('rework B: a /design export that arrives as a .zip is unzipped into mockups/ and not kept', () => {
  const all = () => 'file' as const;
  test('a .zip anywhere under mockups/, listed or not, is refused', () => {
    const ok = readme('source: design\nfiles: [form.png]');
    expect(mockupProblems({ readme: ok, kind: all, present: ['README.md', 'form.png', 'export/Form.ZIP'] })).toEqual([
      expect.stringMatching(/mockups\/export\/Form\.ZIP.*unzip the export into mockups\/ and remove the \.zip/),
    ]);
    expect(mockupProblems({ readme: ok, kind: all, present: ['README.md', 'form.png'] })).toEqual([]);
  });

  test('a .zip without README is refused too', () => {
    expect(mockupProblems({ kind: all, present: ['design.zip'] })).toEqual([expect.stringMatching(/unzip the export/)]);
  });
});

describe('rework F9: a mock file deleted after approval is reported; other documents keep "missing hash = no claim"', () => {
  const row = {
    step: 'design' as const,
    by: 'a',
    at: 'b',
    sha256: { 'design.md': 'h1', 'mockups/a.png': 'h2', 'mockups/README.md': 'h3' },
  };
  test('a deleted mockups/ file is a change; a missing design.md is not', () => {
    expect(changedSince([row], { 'mockups/README.md': 'h3' })).toEqual(['mockups/a.png']);
  });
  test('no hashes at all makes no claim', () => {
    expect(changedSince([row], undefined)).toEqual([]);
  });
});

describe('hasUxReferences', () => {
  test.each(['None', 'N/A', '-', '—', '- None.', 'n/a', 'ASSUMPTION: there are no designs yet', 'OPEN: no mockups or Figma files exist'])(
    'F6: placeholder %s is no reference',
    (line) => {
      expect(hasUxReferences(story(`\n${line}\n`))).toBe(false);
    },
  );

  test('round 3: an ASSUMPTION that only contains "not" is a reference', () => {
    expect(hasUxReferences(story('\nASSUMPTION: follows the existing checkout page, not a new design\n'))).toBe(true);
    expect(hasUxReferences(story('\nOPEN: do not change the header\n'))).toBe(true);
  });

  test('round 3: an ASSUMPTION/OPEN line stating that references are absent is none', () => {
    expect(hasUxReferences(story('\nASSUMPTION: no UX references were provided\n'))).toBe(false);
    expect(hasUxReferences(story('\nOPEN: none\n'))).toBe(false);
    expect(hasUxReferences(story('\nASSUMPTION(source: PO): built without a Figma file\n'))).toBe(false);
  });

  test('F6: a marker that points at a design is a reference', () => {
    expect(hasUxReferences(story('\nASSUMPTION: the design is https://figma.com/file/x\n'))).toBe(true);
    expect(hasUxReferences(story('\nNone of the screens change; see ux.md tokens\n'))).toBe(true);
  });

  test('an empty section, whitespace or HTML comments only is no reference', () => {
    expect(hasUxReferences(story('\n'))).toBe(false);
    expect(hasUxReferences(story('\n<!-- link Figma or screenshots -->\n  \n<!--\nmulti\n-->\n'))).toBe(false);
    expect(hasUxReferences('---\nschema_version: 2\n---\n# T\n')).toBe(false);
  });

  test('any content is a reference', () => {
    expect(hasUxReferences(story('\n- https://figma.com/file/x\n'))).toBe(true);
  });
});

describe('mockOffer: suggest once, only for a UI project without UX references', () => {
  const base = { storyProjects: ['web', 'api'], uiProjects: ['web', 'admin'], uxReferences: false, keepsState: true };
  test('suggests when the story touches a UI project and has no UX references', () => {
    expect(mockOffer(base)).toEqual({ suggest: true, reason: expect.stringContaining('web'), uiProjects: ['web'], uxReferences: false });
  });

  test('no UI project in the story, existing UX references, or a recorded decision: no suggestion', () => {
    expect(mockOffer({ ...base, storyProjects: ['api'] })).toMatchObject({ suggest: false, uiProjects: [] });
    expect(mockOffer({ ...base, uxReferences: true })).toMatchObject({ suggest: false, uxReferences: true });
    const decided = mockOffer({ ...base, mock: { decision: 'accepted', source: 'html', at: '2026-10-22T10:00:00Z' } });
    expect(decided).toMatchObject({ suggest: false, decided: 'accepted', source: 'html' });
  });

  test('a version 1 spec keeps no decision, so nothing is suggested', () => {
    expect(mockOffer({ ...base, keepsState: false })).toMatchObject({ suggest: false, reason: expect.stringMatching(/version 1/) });
  });
});

describe('state.yml: the mock section', () => {
  test('a recorded decision reads back, after the approvals', () => {
    const text = renderState({ mock: { decision: 'accepted', source: 'design', at: '2026-10-22T10:00:00.000Z' } });
    expect(parseState(text).mock).toEqual({ decision: 'accepted', source: 'design', at: '2026-10-22T10:00:00.000Z' });
    expect(renderState({ approvals: [{ step: 'story', by: 'a', at: 'b' }], mock: { decision: 'declined', at: 'c' } })).toMatch(
      /approvals:[\s\S]*mock:/,
    );
  });

  test('a declined mock has no source', () => {
    expect(() => parseState('mock:\n  decision: declined\n  source: html\n  at: x\n')).toThrow();
  });
});
