import { z } from 'zod';

export const REVIEW_LENSES = ['core', 'security', 'performance', 'data', 'accessibility', 'ai'] as const;
export const REVIEW_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export const reviewFindingSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['open', 'resolved']),
  severity: z.enum(REVIEW_SEVERITIES),
  lens: z.enum(REVIEW_LENSES),
  title: z.string().min(1),
  file: z.string().min(1),
  line: z.number().int().positive(),
  evidence: z.string().min(1),
  resolution: z.string().min(1).optional(),
});
export const reviewFindingsSchema = z.object({ version: z.literal(1), findings: z.array(reviewFindingSchema) });
export type ReviewFinding = z.infer<typeof reviewFindingSchema>;
