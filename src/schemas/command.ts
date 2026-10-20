import { z } from 'zod';
import { capability, harnessId, kebabId, PROFILES, profile, schemaVersion } from './common.js';

const io = z.object({
  path: z.string().min(1),
  required: z.boolean().default(false),
  description: z.string().optional(),
});

export const commandFrontmatterSchema = z
  .object({
    schema_version: schemaVersion,
    id: kebabId,
    title: z.string().min(1),
    description: z.string().min(1).max(300),
    status: z.enum(['stable', 'stub']),
    flow: z.object({ after: z.array(kebabId).default([]), next: z.array(kebabId).default([]) }).prefault({}),
    profiles: z
      .array(profile)
      .min(1)
      .default([...PROFILES]),
    arguments: z
      .array(
        z.object({
          name: z.string().regex(/^[a-z][a-zA-Z0-9]*$/, 'must be camelCase'),
          description: z.string().min(1),
          required: z.boolean().default(false),
          default: z.string().optional(),
          /** A switch such as `--product`, shown as `[--name]` in hints. */
          flag: z.boolean().default(false),
        }),
      )
      .default([]),
    inputs: z.array(io),
    outputs: z.array(io),
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
    schema_version: schemaVersion,
    id: kebabId,
    title: z.string().min(1),
    description: z.string().min(1).max(300),
    capabilities: z.array(capability).min(1),
    scripts: z.array(kebabId).default([]),
    /** Another persona whose model must differ (e.g. reviewer vs implementer). */
    must_differ_from: kebabId.optional(),
    harness: z.partialRecord(harnessId, z.record(z.string(), z.unknown())).default({}),
  })
  .strict();

export type PersonaFrontmatter = z.infer<typeof personaFrontmatterSchema>;
