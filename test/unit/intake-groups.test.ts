// mandao-scans: none — pure intake proposal parsing over strings, no folder is listed.
import { describe, expect, test } from 'vitest';
import { intakeCheck, markQuestionAnswered, markStoryOpened, parseIntakeProposal, storyPrefill } from '../../src/spec/intake-proposal.js';

const story = (id: string, title: string, group?: string) => `### ${id} — ${title}
- refs: [p. 1]
- depends_on: []${group ? `\n- group: ${group}` : ''}
#### AC-1 — It works
- GIVEN a user / WHEN they act / THEN it works
`;

const proposal = (stories: string) => `---
schema_version: 1
source: { path: "docs/req.pdf", sha256: "${'c'.repeat(64)}", extractor: pdftotext }
doc: req
date: 2026-10-26
status: proposed
---

# Intake: req

## Stories

${stories}
## Open and conflicts

| ID | Type | Question or contradiction | Ref | Status |
|---|---|---|---|---|
| Q-1 | OPEN | Which identity provider? | p. 1 | open |

## Coverage

| Section | Ref | Covered by | Status |
|---|---|---|---|
| S1 | p. 1 | I-1 | covered |
`;

describe('intake: stories grouped into one spec (phase 16)', () => {
  const md = proposal(`${story('I-1', 'Sign in', 'G-1')}\n${story('I-2', 'Remember me', 'G-1')}\n${story('I-3', 'Export')}`);

  test('a story names its group; the prefill of one brings the others of its group', () => {
    expect(parseIntakeProposal(md).stories.map((s) => s.group)).toEqual(['G-1', 'G-1', undefined]);
    expect(storyPrefill(md, 'I-1').group).toEqual({ id: 'G-1', stories: [expect.objectContaining({ id: 'I-2', title: 'Remember me' })] });
    expect(storyPrefill(md, 'I-3').group).toBeUndefined();
  });

  test('opening one story of a group records the spec on every story of it', () => {
    const opened = parseIntakeProposal(markStoryOpened(md, 'I-1', 'MDO-0003')).stories;
    expect(opened.map((s) => s.opened)).toEqual(['MDO-0003', 'MDO-0003', undefined]);
  });

  test('a group must be G-<n>', () => {
    const bad = proposal(story('I-1', 'Sign in', 'login'));
    expect(intakeCheck(bad, undefined).problems.map((p) => p.code)).toContain('bad-group');
  });
});

describe('intake: the PE answers recorded in the proposal (phase 16)', () => {
  test('an answer resolves its row with the text; the prefill carries it', () => {
    const md = proposal(story('I-1', 'Sign in'));
    const answered = markQuestionAnswered(md, 'Q-1', 'Auth0, decided by the PE');
    expect(parseIntakeProposal(answered).open[0]).toMatchObject({ id: 'Q-1', status: 'resolved: Auth0, decided by the PE' });
    expect(storyPrefill(answered, 'I-1').open[0]?.status).toBe('resolved: Auth0, decided by the PE');
    expect(() => markQuestionAnswered(md, 'Q-9', 'x')).toThrow(/Q-9/);
    expect(() => markQuestionAnswered(md, 'Q-1', 'a | b')).toThrow(/one line, without \|/);
    // Only a Q-n row of Open and conflicts: never a coverage or story row (review F8).
    expect(() => markQuestionAnswered(md, 'S1', 'x')).toThrow(/Q-<n>/);
    expect(() => markQuestionAnswered(md, 'Q-1.*', 'x')).toThrow(/Q-<n>/);
    const coverageQ = md.replace('| S1 | p. 1 | I-1 | covered |', '| Q-7 | p. 1 | I-1 | covered |');
    expect(() => markQuestionAnswered(coverageQ, 'Q-7', 'x')).toThrow(/not a row of Open and conflicts/);
  });
});
