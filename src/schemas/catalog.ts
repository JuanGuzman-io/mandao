import { z } from 'zod';
import semver from 'semver';
import { kebabId, profile } from './common.js';

export const MAX_PROJECT_SKILLS = 10;

const source = z.discriminatedUnion('type', [
  z.object({ type: z.literal('git'), url: z.string().url(), ref: z.string().min(1), path: z.string().optional() }),
  z.object({ type: z.literal('npm'), package: z.string().min(1), version: z.string().min(1) }),
  z.object({ type: z.literal('bundled'), path: z.string().min(1) }),
]);

const skill = z.object({
  id: kebabId,
  technology: kebabId,
  role: z.enum(['primary', 'secondary']),
  description: z.string().min(1),
  match: z
    .object({
      packages: z.array(z.string()).default([]),
      versions: z
        .string()
        .refine((r) => semver.validRange(r) !== null, 'must be a valid semver range')
        .optional(),
      files: z.array(z.string()).default([]),
    })
    .refine((m) => m.packages.length > 0 || m.files.length > 0, 'needs at least one package or file matcher'),
  profiles: z.array(profile).min(1),
  source,
  version: z.string().min(1),
  author: z.string().min(1),
  license: z.string().min(1),
  vetted: z.boolean(),
  /** Bootstrap skills ship with the installation and do not count toward the per-project cap. */
  bootstrap: z.boolean().default(false),
});

export const catalogSchema = z
  .object({ version: z.literal(1), skills: z.array(skill) })
  .superRefine((cat, ctx) => {
    const ids = new Set<string>();
    const primaries = new Map<string, string>();
    cat.skills.forEach((s, i) => {
      if (ids.has(s.id)) ctx.addIssue({ code: 'custom', path: ['skills', i, 'id'], message: `duplicate skill "${s.id}"` });
      ids.add(s.id);
      if (s.role !== 'primary') return;
      // One primary per technology and profile.
      for (const p of s.profiles) {
        const key = `${s.technology}/${p}`;
        const other = primaries.get(key);
        if (other) {
          ctx.addIssue({
            code: 'custom',
            path: ['skills', i, 'role'],
            message: `"${s.id}" and "${other}" are both primary for ${s.technology} (${p})`,
          });
        }
        primaries.set(key, s.id);
      }
    });
  });

export type Catalog = z.infer<typeof catalogSchema>;
export type CatalogSkill = Catalog['skills'][number];
