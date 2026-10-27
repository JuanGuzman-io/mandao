import { describe, expect, test } from 'vitest';
import { agentIdentity, identityCell, identityNotes } from '../../src/scripts/identity.js';
import { reviewCell } from '../../src/scripts/quick-log.js';

/** Phase 20: a task closed by evidence alone (MDO-0001 T11, T12) is not "implemented in the Leader context". */
describe('--implementer none', () => {
  const none = agentIdentity('/nowhere', 'none', 'claude');

  test('records no code written, not the Leader', () => {
    expect(identityCell(none)).toBe('no code (evidence only)');
    expect(identityNotes('implementer', none)).toEqual(['closed on evidence alone: no code written']);
    expect(identityNotes('implementer', agentIdentity('/nowhere', 'self', 'claude'))).toEqual(['implemented in the Leader context']);
  });

  test('a claim is never compared against it', () => {
    expect(identityNotes('implementer', none, 'claude-opus-5-5')).toEqual(['closed on evidence alone: no code written']);
  });

  test('is refused as a reviewer, in a task row and in the quick log', () => {
    expect(() => identityNotes('reviewer', none)).toThrow(/needs a reviewer/);
    expect(() => reviewCell({ verdict: 'PASS', reviewer: none })).toThrow(/needs a review/);
  });
});
