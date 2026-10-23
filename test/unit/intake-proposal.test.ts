// mandao-scans: none — pure intake proposal parsing and checks over strings, no folder is listed.
import { describe, expect, test } from 'vitest';
import { intakeCheck, markStoryOpened, parseIntakeProposal, storyPrefill } from '../../src/spec/intake-proposal.js';

const SHA = 'c'.repeat(64);
const SECTIONS = [
  { id: 'S1', ref: 'p. 1', chars: 900, ocr: false },
  { id: 'S2', ref: 'p. 2', chars: 800, ocr: false },
  { id: 'S3', ref: 'p. 3', chars: 3, ocr: true },
];

interface Parts {
  status?: string;
  context?: string;
  epics?: string;
  stories?: string;
  open?: string;
  coverage?: string;
}

const STORY_1 = `### I-1 — Sign in with email
- epic: E-1
- refs: [p. 1, p. 2]
- priority: Must
- depends_on: []
- invest: small, testable
#### AC-1 — Valid credentials
- GIVEN a registered user / WHEN they sign in / THEN they see the home page
#### AC-2 — Wrong password
- GIVEN a user / WHEN the password is wrong / THEN an error is shown
`;
const STORY_2 = `### I-2 — Remember me
- epic: E-1
- inferred: true
- priority: Could
- depends_on: [I-1]
- invest: depends on sign in
#### AC-1 — Stays signed in
- GIVEN a ticked box / WHEN the browser reopens / THEN the session holds
`;

function proposal(p: Parts = {}): string {
  return `---
schema_version: 1
source: { path: "docs/req.pdf", sha256: "${SHA}", extractor: pdftotext }
doc: req
date: 2026-10-22
status: ${p.status ?? 'proposed'}
---

# Intake: req

## Business context

| ID | Kind | Proposal | Target | Ref | Status |
|---|---|---|---|---|---|
${p.context ?? '| C-1 | rule | Passwords expire after 90 days | business-rules.md | p. 2 | approved |'}

## Epics

${p.epics ?? '### E-1 — Access\nUsers get in and stay in; refs: [p. 1]'}

## Stories

${p.stories ?? `${STORY_1}\n${STORY_2}`}

## Open and conflicts

| ID | Type | Question or contradiction | Ref | Status |
|---|---|---|---|---|
${p.open ?? '| Q-1 | OPEN | Which identity provider? | p. 1 | open |\n| Q-2 | CONFLICT | 60 or 90 days? | p. 3 | open |'}

## Coverage

| Section | Ref | Covered by | Status |
|---|---|---|---|
${p.coverage ?? '| S1 | p. 1 | I-1, E-1, Q-1 | covered |\n| S2 | p. 2 | I-1, C-1 | covered |\n| S3 | p. 3 | — | requires OCR |'}
`;
}

const codes = (md: string, sections: typeof SECTIONS | undefined = SECTIONS) => intakeCheck(md, sections).problems.map((p) => p.code);

describe('parseIntakeProposal', () => {
  test('reads every section of the template', () => {
    const p = parseIntakeProposal(proposal());
    expect(p.context).toEqual([
      {
        id: 'C-1',
        kind: 'rule',
        proposal: 'Passwords expire after 90 days',
        target: 'business-rules.md',
        refs: ['p. 2'],
        status: 'approved',
      },
    ]);
    expect(p.epics).toEqual([{ id: 'E-1', name: 'Access', refs: ['p. 1'] }]);
    expect(p.stories[0]).toMatchObject({ id: 'I-1', title: 'Sign in with email', epic: 'E-1', refs: ['p. 1', 'p. 2'], inferred: false });
    expect(p.stories[0]!.ac).toEqual([
      { id: 'AC-1', name: 'Valid credentials', text: '- GIVEN a registered user / WHEN they sign in / THEN they see the home page' },
      { id: 'AC-2', name: 'Wrong password', text: '- GIVEN a user / WHEN the password is wrong / THEN an error is shown' },
    ]);
    expect(p.stories[1]).toMatchObject({ id: 'I-2', inferred: true, refs: [], depends_on: ['I-1'], priority: 'Could' });
    expect(p.open.map((q) => q.id)).toEqual(['Q-1', 'Q-2']);
    expect(p.coverage[0]).toEqual({ section: 'S1', refs: ['p. 1'], coveredBy: ['I-1', 'E-1', 'Q-1'], status: 'covered' });
  });

  test('a heading ref that holds a comma stays one ref', () => {
    const p = parseIntakeProposal(proposal({ epics: '### E-1 — Access\nText; refs: [§ Users, roles > Admin, p. 4]' }));
    expect(p.epics[0]!.refs).toEqual(['§ Users, roles > Admin', 'p. 4']);
  });
});

describe('intakeCheck', () => {
  test('a complete proposal passes', () => {
    expect(intakeCheck(proposal(), SECTIONS)).toEqual({ ok: true, problems: [], warnings: [] });
  });

  test('invalid frontmatter is a problem', () => {
    expect(codes(proposal({ status: 'done' }))).toContain('frontmatter');
    expect(codes(proposal().replace(SHA, 'nothex'))).toContain('frontmatter');
  });

  test('a story needs refs or inferred: true', () => {
    expect(codes(proposal({ stories: STORY_1.replace('- refs: [p. 1, p. 2]\n', '') }))).toContain('story-unreferenced');
  });

  test('every ref of a story, context row, open row or epic must exist in the sections', () => {
    expect(codes(proposal({ stories: STORY_1.replace('p. 2]', 'p. 9]') }))).toContain('unknown-ref');
    expect(codes(proposal({ context: '| C-1 | rule | X | business-rules.md | p. 7 | approved |' }))).toContain('unknown-ref');
    expect(codes(proposal({ epics: '### E-1 — Access\nText; refs: [§ Nowhere]' }))).toContain('unknown-ref');
    expect(codes(proposal({ open: '| Q-1 | OPEN | ? | p. 8 | open |' }))).toContain('unknown-ref');
  });

  test('dependencies exist and form no cycle', () => {
    expect(codes(proposal({ stories: `${STORY_1}\n${STORY_2.replace('[I-1]', '[I-7]')}` }))).toContain('unknown-dependency');
    const cyclic = `${STORY_1.replace('depends_on: []', 'depends_on: [I-2]')}\n${STORY_2}`;
    expect(codes(proposal({ stories: cyclic }))).toContain('dependency-cycle');
  });

  test('each section has exactly one coverage row', () => {
    expect(codes(proposal({ coverage: '| S1 | p. 1 | I-1 | covered |\n| S3 | p. 3 | — | requires OCR |' }))).toContain('coverage-missing');
    const twice =
      '| S1 | p. 1 | I-1 | covered |\n| S1 | p. 1 | I-1 | covered |\n| S2 | p. 2 | — | no requirement |\n| S3 | p. 3 | — | requires OCR |';
    expect(codes(proposal({ coverage: twice }))).toContain('coverage-duplicate');
  });

  test('an OCR section is never covered nor "no requirement"', () => {
    const base = '| S1 | p. 1 | I-1 | covered |\n| S2 | p. 2 | I-1 | covered |\n';
    expect(codes(proposal({ coverage: `${base}| S3 | p. 3 | I-1 | covered |` }))).toContain('ocr-not-flagged');
    expect(codes(proposal({ coverage: `${base}| S3 | p. 3 | — | no requirement |` }))).toContain('ocr-not-flagged');
  });

  test('a covered row lists IDs that exist', () => {
    const rows = '| S1 | p. 1 | I-1, I-9 | covered |\n| S2 | p. 2 | | covered |\n| S3 | p. 3 | — | requires OCR |';
    const found = intakeCheck(proposal({ coverage: rows }), SECTIONS).problems.filter((p) => p.code === 'coverage-unknown-id');
    expect(found.map((p) => p.at)).toEqual(['S1', 'S2']);
  });

  test('IDs are unique', () => {
    expect(codes(proposal({ stories: `${STORY_1}\n${STORY_1}\n${STORY_2}` }))).toContain('duplicate-id');
  });

  test('the epic a story names exists', () => {
    expect(codes(proposal({ stories: `${STORY_1.replace('epic: E-1', 'epic: E-4')}\n${STORY_2}` }))).toContain('unknown-epic');
  });

  test('closed is refused while a business context row is still proposed', () => {
    const context = '| C-1 | rule | X | business-rules.md | p. 2 | proposed |';
    expect(codes(proposal({ status: 'closed', context }))).toContain('closed-with-proposed-context');
    expect(codes(proposal({ status: 'proposed', context }))).not.toContain('closed-with-proposed-context');
  });

  test('without the cache, references are unverified: a warning, not a problem', () => {
    const r = intakeCheck(proposal({ stories: STORY_1.replace('p. 2]', 'p. 9]') }), undefined);
    expect(r.ok).toBe(true);
    expect(r.warnings.map((w) => w.code)).toEqual(['references-unverified']);
  });
});

describe('source and ID checks (review F2, F4)', () => {
  test('a cached extraction of another file or version is source-changed', () => {
    const r = intakeCheck(proposal(), SECTIONS, 'd'.repeat(64));
    expect(r.problems).toEqual([
      {
        code: 'source-changed',
        at: 'frontmatter',
        message: 'the cached extraction is from a different file or version: re-run intake-extract',
      },
    ]);
    expect(intakeCheck(proposal(), SECTIONS, SHA).ok).toBe(true);
  });

  test('a proposal without source.sha256, checked against a cache, is source-changed', () => {
    const md = proposal().replace(`, sha256: "${SHA}"`, '');
    expect(codes(md)).not.toContain('source-changed');
    expect(intakeCheck(md, SECTIONS, SHA).problems.map((p) => p.code)).toEqual(['frontmatter', 'source-changed']);
  });

  test('IDs carry the prefix of their table', () => {
    const found = (md: string) =>
      intakeCheck(md, SECTIONS)
        .problems.filter((p) => p.code === 'invalid-id')
        .map((p) => p.at);
    expect(found(proposal({ context: '| R-1 | rule | X | business-rules.md | p. 2 | approved |' }))).toEqual(['R-1']);
    expect(found(proposal({ epics: '### I-9 — Access\nText; refs: [p. 1]' }))).toContain('I-9');
    expect(found(proposal({ stories: `${STORY_1.replace('### I-1', '### S-1')}` }))).toContain('S-1');
    expect(found(proposal({ open: '| C-7 | OPEN | ? | p. 1 | open |' }))).toEqual(['C-7']);
  });

  test('"no requirement" and "requires OCR" rows list no ID (—, - or empty)', () => {
    const rows = (s2: string, s3: string) =>
      `| S1 | p. 1 | I-1 | covered |\n| S2 | p. 2 | ${s2} | no requirement |\n| S3 | p. 3 | ${s3} | requires OCR |`;
    expect(codes(proposal({ coverage: rows('—', '-') }))).not.toContain('coverage-ids-not-allowed');
    expect(codes(proposal({ coverage: rows('', '—') }))).not.toContain('coverage-ids-not-allowed');
    const r = intakeCheck(proposal({ coverage: rows('I-1', 'Q-2') }), SECTIONS).problems.filter(
      (p) => p.code === 'coverage-ids-not-allowed',
    );
    expect(r.map((p) => p.at)).toEqual(['S2', 'S3']);
  });
});

describe('markStoryOpened', () => {
  test('writes `- opened:` after the story fields, before its AC', () => {
    const md = markStoryOpened(proposal(), 'I-2', 'MDO-0042');
    const story = parseIntakeProposal(md).stories.find((s) => s.id === 'I-2')!;
    expect(story.opened).toBe('MDO-0042');
    expect(md).toContain('- invest: depends on sign in\n- opened: MDO-0042\n#### AC-1 — Stays signed in');
  });

  test('refuses a story already opened or one that does not exist', () => {
    const once = markStoryOpened(proposal(), 'I-1', 'https://tracker.example/T-1');
    expect(() => markStoryOpened(once, 'I-1', 'MDO-0043')).toThrow(/already opened/);
    expect(() => markStoryOpened(proposal(), 'I-9', 'MDO-0043')).toThrow(/I-9/);
  });
});

describe('storyPrefill', () => {
  test('the story, its AC, the open rows on its refs and the source', () => {
    expect(storyPrefill(proposal(), 'I-1')).toEqual({
      id: 'I-1',
      title: 'Sign in with email',
      epic: 'E-1',
      refs: ['p. 1', 'p. 2'],
      inferred: false,
      priority: 'Must',
      depends_on: [],
      ac: parseIntakeProposal(proposal()).stories[0]!.ac,
      open: [{ id: 'Q-1', type: 'OPEN', text: 'Which identity provider?', refs: ['p. 1'], status: 'open' }],
      source: { path: 'docs/req.pdf', sha256: SHA, doc: 'req' },
    });
    expect(() => storyPrefill(proposal(), 'I-5')).toThrow(/I-5/);
  });
});
