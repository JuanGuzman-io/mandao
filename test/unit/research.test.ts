import { describe, expect, test } from 'vitest';
import { configSchema } from '../../src/schemas/config.js';
import {
  highImpactResearch,
  researchGateFindings,
  researchQuestions,
  reusableResearch,
  validateResearch,
} from '../../src/spec/research.js';

const source = (tier: string, value: string, url = `https://${tier}.example/docs`) => ({ tier, value, url, checked_on: '2026-10-01' });
const entry = (overrides: Record<string, unknown> = {}) => ({
  id: 'R1',
  topic: 'react-server-components',
  topic_type: 'framework',
  question: 'Which server component API is supported?',
  status: 'resolved',
  decision: 'Use API v2.',
  rationale: 'The framework documentation describes it.',
  alternatives: ['API v1'],
  premise_ids: [],
  checked_on: '2026-10-01',
  expires: '2027-04-01',
  claims: [{ id: 'C1', key: 'server-api', kind: 'api', value: 'v2', sources: [source('official', 'v2')] }],
  contradictions: [],
  ...overrides,
});

describe('research evidence', () => {
  test('uses explicit high-impact categories and High premise links', () => {
    expect(highImpactResearch('architecture', [], [])).toBe(true);
    expect(highImpactResearch('data', [], [])).toBe(true);
    expect(highImpactResearch('security', [], [])).toBe(true);
    expect(highImpactResearch('public-contract', [], [])).toBe(true);
    expect(highImpactResearch('framework', ['P2'], ['P2'])).toBe(true);
    expect(highImpactResearch('framework', ['P2'], [])).toBe(false);
  });

  test('requires research to be resolved, sourced and current before design approval', () => {
    expect(validateResearch({ schema_version: 1, entries: [entry()] }, { today: '2026-10-22' })).toEqual([]);
    expect(validateResearch({ schema_version: 1, entries: [entry({ status: 'open' })] }, { today: '2026-10-22' })).toContainEqual(
      expect.objectContaining({ code: 'RESEARCH_OPEN', ref: 'R1' }),
    );
    expect(validateResearch({ schema_version: 1, entries: [entry({ expires: '2026-10-02' })] }, { today: '2026-10-22' })).toContainEqual(
      expect.objectContaining({ code: 'RESEARCH_EXPIRED', ref: 'R1' }),
    );
    expect(
      validateResearch(
        {
          schema_version: 1,
          entries: [entry({ topic_type: 'architecture', claims: [{ id: 'C1', key: 'api', kind: 'api', value: 'v2', sources: [] }] })],
        },
        { today: '2026-10-22', highPremiseIds: [] },
      ),
    ).toContainEqual(expect.objectContaining({ code: 'RESEARCH_UNVERIFIED_HIGH_IMPACT', ref: 'R1' }));
  });

  test('without a detected search tool, sourced model claims remain unverified and cannot justify high impact', () => {
    const claim = { id: 'C1', key: 'architecture choice', kind: 'general', value: 'v2', sources: [source('official', 'v2')] };
    expect(
      validateResearch(
        { schema_version: 1, entries: [entry({ topic_type: 'architecture', claims: [claim] })] },
        {
          today: '2026-10-22',
          webSearchAvailable: false,
        },
      ),
    ).toContainEqual(expect.objectContaining({ code: 'RESEARCH_UNVERIFIED_HIGH_IMPACT' }));
  });

  test('enforces official source priority and a recorded contradiction when sources disagree', () => {
    const sources = [source('technical', 'v1'), source('official', 'v2')];
    const claim = { id: 'C1', key: 'api', kind: 'api', value: 'v2', sources };
    expect(validateResearch({ schema_version: 1, entries: [entry({ claims: [claim] })] }, { today: '2026-10-22' })).toContainEqual(
      expect.objectContaining({ code: 'RESEARCH_CONTRADICTION_UNRECORDED', ref: 'R1/C1' }),
    );
    expect(
      validateResearch(
        {
          schema_version: 1,
          entries: [
            entry({ claims: [claim], contradictions: [{ claim_id: 'C1', resolution: 'The official docs describe the current API.' }] }),
          ],
        },
        { today: '2026-10-22' },
      ),
    ).toEqual([]);
    expect(
      validateResearch({ schema_version: 1, entries: [entry({ claims: [{ ...claim, value: 'v1' }] })] }, { today: '2026-10-22' }),
    ).toContainEqual(expect.objectContaining({ code: 'RESEARCH_SOURCE_PRIORITY', ref: 'R1/C1' }));
  });

  test('computes expiry from the configurable topic duration', () => {
    expect(
      validateResearch(
        { schema_version: 1, entries: [entry({ topic_type: 'ai-model', expires: '2027-01-02' })] },
        {
          today: '2026-10-22',
          expiryMonths: { 'ai-model': 3 },
        },
      ),
    ).toContainEqual(expect.objectContaining({ code: 'RESEARCH_EXPIRY_MISMATCH', ref: 'R1' }));
    expect(
      validateResearch(
        { schema_version: 1, entries: [entry({ topic_type: 'ai-model', expires: '2027-01-22', checked_on: '2026-10-22' })] },
        {
          today: '2026-10-22',
          expiryMonths: { 'ai-model': 3 },
        },
      ),
    ).toEqual([]);
  });

  test('reuses only unexpired evidence for the same normalized topic and type', () => {
    const matches = reusableResearch(
      [
        { source: 'MDO-1/research.md#R1', entry: entry() },
        { source: 'MDO-2/research.md#R2', entry: entry({ id: 'R2', expires: '2026-10-02' }) },
        { source: 'MDO-3/research.md#R3', entry: entry({ id: 'R3', topic: 'other-topic' }) },
      ],
      'React Server Components',
      'framework',
      '2026-10-22',
    );
    expect(matches.map((match) => match.source)).toEqual(['MDO-1/research.md#R1']);
  });

  test('asks for prioritization above the configured per-spec question cap', () => {
    const over = researchQuestions(
      [
        '[NEEDS RESEARCH: api / Auth.js sessions] What session API is supported?',
        '[NEEDS RESEARCH: framework / Next rendering] Which rendering mode is current?',
        '[NEEDS RESEARCH: ai-model / GPT models] Which model is current?',
      ],
      2,
    );
    expect(over).toMatchObject({ total: 3, maxQuestions: 2, needsPriority: true, dispatchable: [] });
    expect(over.questions[0]).toMatchObject({ id: 'Q1', topic_type: 'api', topic: 'Auth.js sessions' });
    expect(researchQuestions(['[NEEDS RESEARCH] A', '[NEEDS RESEARCH] B'], 2, ['Q2'])).toMatchObject({
      needsPriority: false,
      dispatchable: [{ id: 'Q2', question: 'B' }],
    });
  });

  test('requires an entry for each marker and enforces the question limit', () => {
    const text = '[NEEDS RESEARCH: api / Auth.js sessions] Which session API is supported?';
    const findings = researchGateFindings([text], { schema_version: 1, entries: [] }, { maxQuestions: 1, today: '2026-10-22' });
    expect(findings).toContainEqual(expect.objectContaining({ code: 'RESEARCH_UNCOVERED', ref: 'Q1' }));
    expect(
      validateResearch({ schema_version: 1, entries: [entry(), entry({ id: 'R2', topic: 'other' })] }, { maxQuestions: 1 }),
    ).toContainEqual(expect.objectContaining({ code: 'RESEARCH_QUESTION_LIMIT' }));
  });

  test('research configuration has a bounded default and topic expiry defaults', () => {
    const parsed = configSchema.parse({
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'app', path: '.' }],
      harnesses: ['claude'],
    });
    expect(parsed.research.max_questions).toBeGreaterThan(0);
    expect(parsed.research.expires_months['ai-model']).toBe(3);
    expect(parsed.research.expires_months.architecture).toBe(12);
  });
});
