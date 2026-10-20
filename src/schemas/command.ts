import { z } from 'zod';
import { capability, harnessId, kebabId, profile, PROFILES, tier } from './common.js';

const io = z.object({
  path: z.string().min(1),
  required: z.boolean().default(false),
  description: z.string().optional(),
});

export const commandFrontmatterSchema = z
  .object({
    id: kebabId,
    title: z.string().min(1),
    description: z.string().min(1).max(300),
    status: z.enum(['stable', 'stub']),
    flow: z
      .object({ after: z.array(kebabId).default([]), next: z.array(kebabId).default([]) })
      .prefault({}),
    profiles: z.array(profile).min(1).default([...PROFILES]),
    arguments: z
      .array(
        z.object({
          name: z.string().regex(/^[a-z][a-zA-Z0-9]*$/, 'must be camelCase'),
          description: z.string().min(1),
          required: z.boolean().default(false),
          default: z.string().optional(),
        }),
      )
      .default([]),
    inputs: z.array(io),
    outputs: z.array(io),
    tier,
    capabilities: z.array(capability).min(1),
    templates: z.array(z.string().min(1)).default([]),
    scripts: z.array(kebabId).default([]),
    approval: z.enum(['none', 'required']).default('none'),
    scope: z.enum(['project', 'global', 'both']).default('project'),
    harness: z.partialRecord(harnessId, z.record(z.string(), z.unknown())).default({}),
  })
  .strict();

export type CommandFrontmatter = z.infer<typeof commandFrontmatterSchema>;

export const personaFrontmatterSchema = z
  .object({
    id: kebabId,
    title: z.string().min(1),
    description: z.string().min(1).max(300),
    tier,
    capabilities: z.array(capability).min(1),
    /** Another persona whose model must differ (e.g. reviewer vs implementer). */
    must_differ_from: kebabId.optional(),
    harness: z.partialRecord(harnessId, z.record(z.string(), z.unknown())).default({}),
  })
  .strict();

export type PersonaFrontmatter = z.infer<typeof personaFrontmatterSchema>;
