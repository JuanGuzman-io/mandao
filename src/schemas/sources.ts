import { z } from 'zod';
import { schemaVersion } from './common.js';

const mcp = z.string().min(1).optional();

/** Accepts the shorthand `tracker: linear` as well as `tracker: { kind: linear, ... }`. */
const shorthand = <T extends z.ZodType>(schema: T) => z.preprocess((v) => (typeof v === 'string' ? { kind: v } : v), schema);
const list = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]), z.array(shorthand(schema)));

export const sourcesSchema = z.object({
  schema_version: schemaVersion,
  tracker: shorthand(
    z.object({
      kind: z.enum(['jira', 'linear', 'clickup', 'monday', 'none']),
      project: z.string().optional(),
      url: z.string().optional(),
      mcp,
    }),
  ).default({ kind: 'none' }),
  docs: list(z.object({ kind: z.enum(['sharepoint', 'confluence', 'notion', 'google-drive', 'local']), ref: z.string().optional(), mcp })),
  meetings: list(z.object({ kind: z.enum(['teams', 'zoom', 'meet', 'local']), ref: z.string().optional(), mcp })),
  chat: list(z.object({ kind: z.enum(['slack', 'teams']), channels: z.array(z.string()).default([]), mcp })),
  design: list(z.object({ kind: z.enum(['figma']), ref: z.string().optional(), mcp })),
});

export type Sources = z.infer<typeof sourcesSchema>;
