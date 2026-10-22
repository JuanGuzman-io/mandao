import semver from 'semver';
import { z } from 'zod';
import { kebabId, PROFILES, profile, schemaVersion } from './common.js';

export const MAX_PROJECT_SKILLS = 10;

const repo = z.url().refine((value) => /^https:\/\//i.test(value), 'repository URL must use HTTPS');
/** Shell command whose success proves the skill is installed, e.g. `graphify --version`. */
const verify = z.string().min(1).optional();
/** Shell command that prints the installed version, compared by doctor with the pinned `version`. */
const versionCommand = z.string().min(1).optional();

const source = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('git'),
    url: repo,
    ref: z.string().min(1),
    path: z.string().optional(),
    commit: z.string().regex(/^[0-9a-f]{40}$/),
    verify,
  }),
  z.object({ type: z.literal('npm'), package: z.string().min(1), repo: repo.optional(), verify }),
  /** Installed through the skills CLI: `npx skills add <ref>`. */
  z.object({ type: z.literal('skills'), ref: z.string().min(1), repo: repo.optional(), verify }),
  /** A shell installer documented upstream, run as is after confirmation. */
  z.object({ type: z.literal('command'), install: z.array(z.string().min(1)).min(1), repo, verify, version_command: versionCommand }),
  /** An agent-side install (e.g. `/plugin install …`): Mandao prints it, the user runs it in the agent. */
  z.object({ type: z.literal('plugin'), install: z.array(z.string().min(1)).min(1), repo, verify }),
  z.object({ type: z.literal('bundled'), path: z.string().min(1) }),
]);

const PHASES = ['constitution', 'story', 'specify', 'clarify', 'tasks', 'implement', 'verify', 'close', 'quick', 'perf', 'audit'] as const;

const skill = z.object({
  description: z.string().min(1),
  source,
  version: z.string().min(1),
  author: z.string().min(1),
  license: z.string().min(1),
  vetted: z.boolean(),
  /** core: wired to a step · profile · stack · conditional: loaded when a task touches its domain. */
  binding: z.enum(['core', 'profile', 'stack', 'conditional']),
  phases: z.array(z.enum(PHASES)).min(1),
  profiles: z.array(profile).default([...PROFILES]),
  /** What the commands do without the skill (shown when it is not installed). */
  fallback: z.string().min(1).optional(),
});

const matcher = z
  .object({
    packages: z.array(z.string()).default([]),
    versions: z
      .string()
      .refine((r) => semver.validRange(r) !== null, 'must be a valid semver range')
      .optional(),
    files: z.array(z.string()).default([]),
  })
  .refine((m) => m.packages.length > 0 || m.files.length > 0, 'needs at least one package or file matcher');

/** `when: { state: bloc }` holds when the fingerprint detected facet `state` = `bloc`. */
const when = z.record(z.string(), z.string());

const technology = z.object({
  match: matcher,
  primary: kebabId,
  when: when.optional(),
  alt: z.array(z.object({ skill: kebabId, when })).default([]),
});

export const catalogSchema = z
  .object({
    schema_version: schemaVersion,
    /** Ships with every install; does not count toward the per-project cap. */
    bootstrap: z.array(kebabId),
    skills: z.record(kebabId, skill),
    technologies: z.record(kebabId, technology),
    /** Style-defining libraries: facet → value → matcher, e.g. state → bloc → flutter_bloc. */
    facets: z.record(z.string(), z.record(z.string(), matcher)).default({}),
    packs: z.record(kebabId, z.array(kebabId)).default({}),
  })
  .superRefine((cat, ctx) => {
    const known = new Set(Object.keys(cat.skills));
    const check = (id: string, path: (string | number)[]) => {
      if (!known.has(id)) ctx.addIssue({ code: 'custom', path, message: `unknown skill "${id}"` });
    };
    cat.bootstrap.forEach((id, i) => {
      check(id, ['bootstrap', i]);
    });
    for (const [tech, t] of Object.entries(cat.technologies)) {
      check(t.primary, ['technologies', tech, 'primary']);
      t.alt.forEach((a, i) => {
        check(a.skill, ['technologies', tech, 'alt', i, 'skill']);
      });
      for (const w of [t.when ?? {}, ...t.alt.map((a) => a.when)]) {
        for (const [facet, value] of Object.entries(w)) {
          if (!cat.facets[facet]?.[value]) {
            ctx.addIssue({ code: 'custom', path: ['technologies', tech], message: `facet "${facet}: ${value}" is not defined in facets` });
          }
        }
      }
    }
    for (const [pack, ids] of Object.entries(cat.packs)) {
      ids.forEach((id, i) => {
        check(id, ['packs', pack, i]);
      });
    }
  });

export type Catalog = z.infer<typeof catalogSchema>;
export type CatalogSkill = Catalog['skills'][string];
