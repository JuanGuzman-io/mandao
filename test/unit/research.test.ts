import { describe, expect, test } from 'vitest';
import { configSchema } from '../../src/schemas/config.js';
import type { ResearchEntry } from '../../src/schemas/research.js';
import { researchDocumentSchema } from '../../src/schemas/research.js';
import {
  highImpactResearch,
  researchGateFindings,
  researchQuestions,
  reusableResearch,
  validateResearch,
  verifiedReusedResearchReferences,
} from '../../src/spec/research.js';

const source = (tier: ResearchEntry['claims'][number]['sources'][number]['tier'], value: string, url = `https://${tier}.example/docs`) => ({
  tier,
  value,
  url,
  checked_on: '2026-10-01',
});
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
  test('an unverified claim is named with its reason (MDO-0001 R3)', () => {
    const architecture = entry({ topic_type: 'architecture' });
    const noSearch = validateResearch({ schema_version: 1, entries: [architecture] }, { today: '2026-10-22', webSearchAvailable: false });
    expect(noSearch).toContainEqual(
      expect.objectContaining({
        code: 'RESEARCH_UNVERIFIED_HIGH_IMPACT',
        ref: 'R1/C1',
        message: expect.stringMatching(/server-api: no web search available to this harness .*research\.web_search_servers/),
      }),
    );
    const unsourced = entry({
      topic_type: 'architecture',
      claims: [{ id: 'C1', key: 'server-api', kind: 'api', value: 'v2', sources: [] }],
    });
    expect(validateResearch({ schema_version: 1, entries: [unsourced] }, { today: '2026-10-22' })).toContainEqual(
      expect.objectContaining({ ref: 'R1/C1', message: expect.stringMatching(/server-api has no source \(model knowledge\)/) }),
    );
  });

  test('an entry the PO accepted with its evidence reference does not block (MDO-0001 C-7)', () => {
    const accepted = entry({
      topic_type: 'architecture',
      status: 'accepted',
      expires: '2027-10-01',
      claims: [{ id: 'C1', key: 'server-api', kind: 'api', value: 'v2', sources: [] }],
      accepted_by: 'PE',
      reason: 'the premise run P2 proved it on this machine',
      evidence: 'P2',
    });
    const findings = validateResearch({ schema_version: 1, entries: [accepted] }, { today: '2026-10-22', webSearchAvailable: false });
    expect(findings.filter((f) => f.severity === 'error')).toEqual([]);
    const gate = (evidence: string, docs: string[]) =>
      researchGateFindings(docs, { schema_version: 1, entries: [{ ...accepted, evidence }] }, { today: '2026-10-22' });
    expect(gate('P2', ['| P2 | sqlite loads extensions | High |'])).toEqual([]);
    expect(gate('C-7', ['- C-7: the PE accepts the local premise run'])).toEqual([]);
    expect(gate('P9', ['| P2 | sqlite loads extensions | High |'])).toContainEqual(
      expect.objectContaining({ code: 'RESEARCH_ACCEPTANCE_UNKNOWN_EVIDENCE', ref: 'R1', message: expect.stringContaining('P9') }),
    );
    expect(validateResearch({ schema_version: 1, entries: [{ ...accepted, evidence: 'trust me' }] })).toContainEqual(
      expect.objectContaining({ code: 'RESEARCH_SCHEMA' }),
    );
    const bare = entry({ status: 'accepted', accepted_by: 'PE' });
    expect(validateResearch({ schema_version: 1, entries: [bare] }, { today: '2026-10-22' })).toContainEqual(
      expect.objectContaining({ code: 'RESEARCH_ACCEPTANCE_INCOMPLETE', ref: 'R1' }),
    );
  });

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
    ).toContainEqual(expect.objectContaining({ code: 'RESEARCH_UNVERIFIED_HIGH_IMPACT', ref: 'R1/C1' }));
  });

  test('without a detected search tool, sourced model claims remain unverified but valid reused evidence is accepted', () => {
    const claim: ResearchEntry['claims'][number] = {
      id: 'C1',
      key: 'architecture choice',
      kind: 'general',
      value: 'v2',
      sources: [source('official', 'v2')],
    };
    expect(
      validateResearch(
        { schema_version: 1, entries: [entry({ topic_type: 'architecture', claims: [claim] })] },
        {
          today: '2026-10-22',
          webSearchAvailable: false,
        },
      ),
    ).toContainEqual(expect.objectContaining({ code: 'RESEARCH_UNVERIFIED_HIGH_IMPACT' }));
    const reused = researchDocumentSchema.parse({
      schema_version: 1,
      entries: [
        entry({
          topic: 'Auth boundary',
          topic_type: 'architecture',
          question: 'Is the auth boundary adequate?',
          expires: '2027-10-01',
          reused_from: 'specs/MDO-0001-auth/research.md#R1',
          claims: [claim],
        }),
      ],
    }).entries[0]!;
    const prior = { ...reused, reused_from: undefined };
    const candidates = [{ source: 'specs/MDO-0001-auth/research.md#R1', entry: prior }];
    const validRefs = verifiedReusedResearchReferences([reused], candidates, '2026-10-22');
    expect(validRefs).toEqual(['specs/MDO-0001-auth/research.md#R1']);
    expect(
      validateResearch(
        { schema_version: 1, entries: [reused] },
        { today: '2026-10-22', webSearchAvailable: false, verifiedReuseReferences: validRefs },
      ),
    ).toEqual([]);
    expect(verifiedReusedResearchReferences([{ ...reused, claims: [{ ...claim, value: 'invented' }] }], candidates, '2026-10-22')).toEqual(
      [],
    );
    expect(
      verifiedReusedResearchReferences([{ ...reused, checked_on: '2027-01-01', expires: '2028-01-01' }], candidates, '2026-10-22'),
    ).toEqual([]);
    const expiredPrior = {
      ...prior,
      checked_on: '2025-10-01',
      expires: '2026-10-01',
      claims: [{ ...claim, sources: claim.sources.map((item) => ({ ...item, checked_on: '2025-10-01' })) }],
    };
    expect(verifiedReusedResearchReferences([reused], [{ source: candidates[0]!.source, entry: expiredPrior }], '2026-10-22')).toEqual([]);
    expect(
      researchGateFindings(
        ['[NEEDS RESEARCH: architecture / Auth boundary] Is the auth boundary adequate?'],
        { schema_version: 1, entries: [reused] },
        { today: '2026-10-22', webSearchAvailable: false, verifiedReuseReferences: validRefs },
      ),
    ).toEqual([]);
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

  test('asks for prioritization above the per-dispatch question cap', () => {
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
    expect(researchQuestions(['[NEEDS RESEARCH] A'], 1, ['Q99'])).toMatchObject({
      needsPriority: true,
      selectionIssues: ['unknown research question IDs: Q99'],
      dispatchable: [],
    });
    expect(researchQuestions(['[NEEDS RESEARCH] A', '[NEEDS RESEARCH] B'], 1, ['Q1', 'Q2'])).toMatchObject({
      needsPriority: true,
      selectionIssues: ['select at most 1 questions per dispatch'],
      dispatchable: [],
    });
  });

  test('requires an entry for each marker and allows evidence to accumulate across dispatch batches', () => {
    const text = '[NEEDS RESEARCH: api / Auth.js sessions] Which session API is supported?';
    const findings = researchGateFindings([text], { schema_version: 1, entries: [] }, { maxQuestions: 1, today: '2026-10-22' });
    expect(findings).toContainEqual(expect.objectContaining({ code: 'RESEARCH_UNCOVERED', ref: 'Q1' }));
    const markers = Array.from({ length: 6 }, (_, index) => `[NEEDS RESEARCH: framework / Topic ${index + 1}] Which version is supported?`);
    const records = markers.map((_, index) =>
      entry({ id: `R${index + 1}`, topic: `Topic ${index + 1}`, question: 'Which version is supported?' }),
    );
    expect(researchQuestions(markers, 5)).toMatchObject({ total: 6, needsPriority: true, dispatchable: [] });
    expect(researchQuestions(markers, 5, ['Q6'])).toMatchObject({
      needsPriority: false,
      dispatchable: [{ id: 'Q6', topic: 'Topic 6' }],
    });
    expect(researchGateFindings(markers, { schema_version: 1, entries: records }, { maxQuestions: 5, today: '2026-10-22' })).toEqual([]);
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
