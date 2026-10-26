import { z } from 'zod';

export const RESEARCH_TOPIC_TYPES = [
  'ai-model',
  'api',
  'library',
  'framework',
  'architecture',
  'data',
  'security',
  'public-contract',
  'other',
] as const;
export type ResearchTopicType = (typeof RESEARCH_TOPIC_TYPES)[number];
export const DEFAULT_RESEARCH_EXPIRY: Record<ResearchTopicType, number> = {
  'ai-model': 3,
  api: 6,
  library: 6,
  framework: 6,
  architecture: 12,
  data: 6,
  security: 3,
  'public-contract': 6,
  other: 6,
};

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date (YYYY-MM-DD)');

const researchSourceSchema = z.object({
  tier: z.enum(['official', 'manufacturer', 'technical']),
  url: z.url(),
  checked_on: date,
  value: z.string().trim().min(1),
});

const researchClaimSchema = z.object({
  id: z.string().regex(/^C\d+$/),
  key: z.string().trim().min(1),
  kind: z.enum(['general', 'version', 'api']),
  value: z.string().trim().min(1),
  sources: z.array(researchSourceSchema).default([]),
});

const researchEntrySchema = z.object({
  id: z.string().regex(/^R\d+$/),
  topic: z.string().trim().min(1),
  topic_type: z.enum(RESEARCH_TOPIC_TYPES),
  question: z.string().trim().min(1),
  /** `accepted`: the PO accepted other evidence (a premise run, a clarification) for what web research could not show. */
  status: z.enum(['open', 'resolved', 'accepted']),
  decision: z.string().trim().optional(),
  rationale: z.string().trim().optional(),
  alternatives: z.array(z.string().trim().min(1)).default([]),
  premise_ids: z.array(z.string().regex(/^P\d+$/)).default([]),
  checked_on: date,
  expires: date,
  claims: z.array(researchClaimSchema).default([]),
  contradictions: z.array(z.object({ claim_id: z.string().regex(/^C\d+$/), resolution: z.string().trim().min(1) })).default([]),
  reused_from: z.string().trim().min(1).optional(),
  /** An accepted entry: who accepted it, why, and the evidence it rests on (`P2`, `C-7`). */
  accepted_by: z.string().trim().min(1).optional(),
  reason: z.string().trim().min(1).optional(),
  evidence: z
    .string()
    .regex(/^(P\d+|C-\d+)$/, 'must be a premise run (P<n>) or a clarification (C-<n>)')
    .optional(),
});

export const researchDocumentSchema = z.object({ schema_version: z.literal(1), entries: z.array(researchEntrySchema).default([]) });
export type ResearchDocument = z.infer<typeof researchDocumentSchema>;
export type ResearchEntry = z.infer<typeof researchEntrySchema>;

export const researchConfigSchema = z
  .object({
    max_questions: z.number().int().min(1).max(50).default(5),
    /** Explicit MCP references: <harness>:<config-file>:<server-name>; checked against the repository config. */
    web_search_servers: z.array(z.string().min(1)).default([]),
    expires_months: z
      .object({
        'ai-model': z.number().int().min(1).max(120).default(3),
        api: z.number().int().min(1).max(120).default(6),
        library: z.number().int().min(1).max(120).default(6),
        framework: z.number().int().min(1).max(120).default(6),
        architecture: z.number().int().min(1).max(120).default(12),
        data: z.number().int().min(1).max(120).default(6),
        security: z.number().int().min(1).max(120).default(3),
        'public-contract': z.number().int().min(1).max(120).default(6),
        other: z.number().int().min(1).max(120).default(6),
      })
      .partial()
      .default(DEFAULT_RESEARCH_EXPIRY),
  })
  .prefault({});
export type ResearchConfig = z.infer<typeof researchConfigSchema>;
