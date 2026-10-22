import { describe, expect, test } from 'vitest';
import { parseReviewFindings, securityBlockers } from '../../src/spec/review-findings.js';

const review = (findings: unknown[]) =>
  `VERDICT: PASS\n\n## Findings (JSON)\n\n\`\`\`json\n${JSON.stringify({ version: 1, findings })}\n\`\`\``;
const finding = (overrides: Record<string, unknown> = {}) => ({
  id: 'F1',
  status: 'open',
  severity: 'high',
  lens: 'security',
  title: 'Untrusted input reaches a shell',
  file: 'src/run.ts',
  line: 12,
  evidence: 'The value is passed to exec.',
  ...overrides,
});

describe('structured Reviewer findings', () => {
  test('blocks only open high or critical security findings', () => {
    expect(securityBlockers(review([finding()]))).toHaveLength(1);
    expect(securityBlockers(review([finding({ status: 'resolved' })]))).toEqual([]);
    expect(securityBlockers(review([finding({ severity: 'medium' })]))).toEqual([]);
    expect(securityBlockers(review([finding({ lens: 'core' })]))).toEqual([]);
  });

  test('fails closed when the structured payload is missing or invalid', () => {
    expect(parseReviewFindings('VERDICT: PASS\nNo findings.').success).toBe(false);
    expect(parseReviewFindings(review([finding({ severity: 'urgent' })])).success).toBe(false);
  });

  test('free text mentioning security severity has no effect on the guard', () => {
    expect(securityBlockers(`${review([])}\nThe old high severity security issue is fixed.`)).toEqual([]);
  });

  test('rejects duplicate findings envelopes instead of silently ignoring later findings', () => {
    const ambiguous = `${review([])}\n\n${review([finding()])}`;
    expect(parseReviewFindings(ambiguous).success).toBe(false);
    expect(securityBlockers(ambiguous)).toEqual(['Reviewer findings payload is missing or invalid']);

    const duplicateBlocks = `## Findings (JSON)\n\n\`\`\`json\n${JSON.stringify({ version: 1, findings: [] })}\n\`\`\`\n\n\`\`\`json\n${JSON.stringify({ version: 1, findings: [finding()] })}\n\`\`\``;
    expect(parseReviewFindings(duplicateBlocks).success).toBe(false);
  });
});
