import { z } from 'zod';
import { harnessId } from './common.js';

const hash = z.string().regex(/^sha256-[A-Za-z0-9+/=]+$/);

export const lockSchema = z.object({
  lockVersion: z.literal(1),
  mandao: z.string(),
  configHash: hash,
  layers: z.array(
    z.object({
      kind: z.enum(['core', 'preset', 'overrides']),
      id: z.string().optional(),
      version: z.string().optional(),
      hash: hash.optional(),
    }),
  ),
  skills: z
    .array(
      z.object({
        id: z.string(),
        version: z.string(),
        source: z.string(),
        author: z.string(),
        license: z.string(),
        vetted: z.boolean(),
      }),
    )
    .default([]),
  files: z.array(
    z.object({
      path: z.string(),
      harness: z.union([harnessId, z.enum(['agents-md', 'mandao'])]),
      from: z.string(),
      ownership: z.enum(['owned', 'managed-block']),
      /** For owned files: hash of the whole file. For managed blocks: hash of the block only. */
      hash,
      /** Files outside the workspace (global scope) are recorded with scope: global. */
      scope: z.enum(['project', 'global']).default('project'),
    }),
  ),
});

export type Lock = z.infer<typeof lockSchema>;
export type LockFile = Lock['files'][number];
