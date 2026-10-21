import { describe, expect, test } from 'vitest';
// Missing until T3: the one zod schema behind `state.yml` (design D3).
import { parseState, renderState } from '../../src/spec/state.js';

/**
 * ASSUMPTION (the spec fixes the sections, not the signatures): `src/spec/state.ts` exports
 * `parseState(text | undefined)` and `renderState(state)`; the sections are `start`, `baseline`,
 * `progress`, `approvals` and `cut_estimates` (design D3, FR-3).
 */
const approval = { step: 'design' as const, by: 'Ana PO', at: '2026-10-20T10:00:00.000Z', sha256: { 'story.md': 'a'.repeat(64) } };
const progress = {
  schema_version: 1,
  spec: 'MDO-0001-x',
  updated_at: '2026-10-20T11:00:00.000Z',
  current: { task: 'T2', phase: 'implementing', harness: 'claude', model: 'claude-sonnet-5-5' },
  open_questions: [],
  next_step: 'review',
  deferred_to_ci: [],
  red_tests: [{ task: 'T2', files: [{ path: 'test/a.test.ts', sha256: 'b'.repeat(64), tests: ['rejects x'] }] }],
  pending_commits: [],
};

describe('state.yml: one schema for five logical logs (AC-3, S-3.5)', () => {
  test('an absent or empty file reads as no approvals and no cut estimates', () => {
    expect(parseState(undefined).approvals).toEqual([]);
    expect(parseState('').cut_estimates).toEqual([]);
  });

  test('approvals and progress written to the file read back unchanged', () => {
    const text = renderState({ approvals: [approval], progress } as never);
    const back = parseState(text);
    expect(back.approvals).toEqual([approval]);
    expect(back.progress).toMatchObject({ spec: 'MDO-0001-x', red_tests: progress.red_tests });
  });

  test('the start request and the baseline survive a round trip beside the other sections', () => {
    const text = renderState({
      start: { title: 'Add a login rate limit' },
      baseline: { text: 'Green before any change.' },
      approvals: [approval],
    } as never);
    const back = parseState(text) as unknown as Record<string, unknown>;
    expect(JSON.stringify(back.start)).toContain('Add a login rate limit');
    expect(JSON.stringify(back.baseline)).toContain('Green before any change.');
    expect(parseState(text).approvals).toHaveLength(1);
  });

  test('a row that is not a valid approval is rejected, not dropped', () => {
    expect(() => parseState('approvals:\n  - step: nonsense\n    by: x\n    at: y\n')).toThrow();
  });
});
