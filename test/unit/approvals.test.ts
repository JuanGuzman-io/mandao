import { describe, expect, test } from 'vitest';
import { type Approval, activeApprovals, specBudget } from '../../src/spec/approvals.js';

const budget: Approval = { step: 'budget', by: 'person', at: '2026-01-01T00:00:00Z', to: 12 };

describe('append-only approval events', () => {
  test('revocation and annulment deactivate their target rows without rewriting history', () => {
    const revoke: Approval = {
      step: 'revocation',
      by: 'person',
      at: '2026-01-02T00:00:00Z',
      target_at: budget.at,
      target_step: 'budget',
      note: 'scope changed',
    };
    expect(activeApprovals([budget, revoke])).toEqual([]);
    const annulRevoke: Approval = {
      step: 'annulment',
      by: 'person',
      at: '2026-01-03T00:00:00Z',
      target_at: revoke.at,
      note: 'revocation was mistaken',
    };
    expect(activeApprovals([budget, revoke, annulRevoke])).toEqual([budget]);
    expect(specBudget([budget, revoke], 5)).toBe(5);
    expect(specBudget([budget, revoke, annulRevoke], 5)).toBe(12);
  });
});
