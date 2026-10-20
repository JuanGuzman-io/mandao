import { z } from 'zod';

const mcpRef = z.string().min(1).optional();

export const sourcesSchema = z.object({
  version: z.literal(1),
  tracker: z
    .object({
      kind: z.enum(['jira', 'linear', 'clickup', 'monday', 'github', 'none']),
      project: z.string().optional(),
      url: z.string().optional(),
      mcp: mcpRef,
    })
    .default({ kind: 'none' }),
  docs: z
    .array(z.object({ kind: z.enum(['sharepoint', 'confluence', 'notion', 'local']), ref: z.string(), mcp: mcpRef }))
    .default([]),
  chat: z
    .array(z.object({ kind: z.enum(['slack', 'teams']), channels: z.array(z.string()).min(1), mcp: mcpRef }))
    .default([]),
  design: z.array(z.object({ kind: z.enum(['figma']), ref: z.string(), mcp: mcpRef })).default([]),
  transcripts: z.array(z.object({ kind: z.enum(['local', 'sharepoint']), path: z.string() })).default([]),
});

export type Sources = z.infer<typeof sourcesSchema>;
