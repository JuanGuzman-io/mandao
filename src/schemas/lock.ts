import { z } from 'zod';
import { harnessId, schemaVersion } from './common.js';

const hash = z.string().regex(/^sha256-[A-Za-z0-9+/=]+$/);

export const lockSchema = z.object({
  schema_version: schemaVersion,
  mandao: z.string(),
  /** Hash of config.yml + models.yml as last synced. */
  config_hash: hash,
  layers: z.array(
    z.object({
      kind: z.enum(['core', 'preset', 'overrides']),
      id: z.string().optional(),
      version: z.string().optional(),
      hash: hash.optional(),
    }),
  ),
  /** Hash of the model recommendation last offered, per harness (see models/offers.ts). */
  recommendations: z.partialRecord(harnessId, z.string()).default({}),
  skills: z
    .array(
      z.object({
        id: z.string(),
        version: z.string(),
        source: z.string(),
        author: z.string(),
        license: z.string(),
        vetted: z.boolean(),
        /** Pinned commit of a `git` source (40 hex). */
        commit: z
          .string()
          .regex(/^[0-9a-f]{40}$/)
          .optional(),
      }),
    )
    .default([]),
  files: z.array(
    z.object({
      path: z.string(),
      harness: z.union([harnessId, z.enum(['agents-md', 'mandao'])]),
      from: z.string(),
      ownership: z.enum(['owned', 'managed-block']),
      /** Owned files: hash of the whole file. Managed blocks: hash of the block only. */
      hash,
      scope: z.enum(['project', 'global']).default('project'),
    }),
  ),
});

export type Lock = z.infer<typeof lockSchema>;
export type LockFile = Lock['files'][number];
