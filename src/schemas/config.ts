import { z } from 'zod';
import { gate, harnessId, kebabId, profile, relPath, schemaVersion, workspaceMode } from './common.js';

export const COMMIT_TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'build', 'ci', 'revert'] as const;
export type CommitType = (typeof COMMIT_TYPES)[number];

export const DEFAULT_COMMIT_EMOJI: Record<CommitType | 'breaking', string> = {
  feat: '✨',
  fix: '🐛',
  docs: '📝',
  style: '🎨',
  refactor: '♻️',
  test: '✅',
  chore: '🔧',
  perf: '⚡️',
  build: '📦️',
  ci: '👷',
  revert: '⏪️',
  breaking: '💥',
};

/** Polyrepo projects whose repository has no remote yet use this value. */
export const LOCAL_REPO = 'local';

const project = z.object({
  name: kebabId,
  path: relPath,
  profile,
  tracker_key: z
    .string()
    .regex(/^[A-Z][A-Z0-9_]*$/, 'must be an uppercase tracker key')
    .optional(),
  /** Polyrepo: remote URL of the project's own repository (or `local` when it has none). */
  repo: z.string().min(1).optional(),
  /** Shell command per deterministic gate, run from the project path. Missing gates are reported by doctor. */
  gates: z.partialRecord(gate, z.string().min(1)).default({}),
});
export type ProjectConfig = z.infer<typeof project>;

const commits = z
  .object({
    emoji: z
      .object(
        Object.fromEntries([...COMMIT_TYPES, 'breaking'].map((t) => [t, z.string().min(1)])) as Record<
          CommitType | 'breaking',
          z.ZodString
        >,
      )
      .default(DEFAULT_COMMIT_EMOJI),
    max_subject_length: z.number().int().positive().default(72),
    trailers: z
      .object({
        refs: z.string().default('Refs'),
        task: z.string().default('Mandao-Task'),
        acs: z.string().default('Mandao-AC'),
        quick: z.string().default('Mandao-Quick'),
      })
      .prefault({}),
  })
  .prefault({});

export const configSchema = z
  .object({
    schema_version: schemaVersion,
    workspace: workspaceMode,
    /** Holds canonical specs, the workspace constitution and the root AGENTS.md. `paths` are relative to it. */
    home: relPath.default('.'),
    /** Polyrepo only: the user accepted that workspace artifacts are not versioned. */
    local_only: z.boolean().optional(),
    paths: z
      .object({
        specs: relPath.default('specs'),
        constitution: relPath.default('docs/constitution'),
        releases: relPath.default('docs/releases'),
      })
      .prefault({}),
    projects: z.array(project).min(1),
    harnesses: z.array(harnessId).min(1),
    presets: z.array(z.string().min(1)).default([]),
    skill_packs: z.array(kebabId).default([]),
    spec: z
      .object({
        /** Branch naming; `{type}` is feat or fix. */
        branch: z.string().default('{type}/{id}-{slug}'),
        /** Prefix for local ids when there is no tracker: MDO-0001. */
        local_prefix: z
          .string()
          .regex(/^[A-Z][A-Z0-9]*$/)
          .default('MDO'),
      })
      .prefault({}),
    commits,
    /** How generated commands invoke Mandao scripts: `npx` pins the version, `local` uses a devDependency. */
    scripts: z.object({ runner: z.enum(['npx', 'local']).default('npx') }).prefault({}),
  })
  .superRefine((cfg, ctx) => {
    const names = new Set<string>();
    const paths = new Set<string>();
    cfg.projects.forEach((p, i) => {
      if (names.has(p.name)) ctx.addIssue({ code: 'custom', path: ['projects', i, 'name'], message: `duplicate project name "${p.name}"` });
      if (paths.has(p.path)) ctx.addIssue({ code: 'custom', path: ['projects', i, 'path'], message: `duplicate project path "${p.path}"` });
      names.add(p.name);
      paths.add(p.path);
      if (cfg.workspace === 'polyrepo' && !p.repo) {
        ctx.addIssue({
          code: 'custom',
          path: ['projects', i, 'repo'],
          message: `polyrepo project "${p.name}" needs repo (remote URL, or "local")`,
        });
      }
    });
    if (new Set(cfg.harnesses).size !== cfg.harnesses.length)
      ctx.addIssue({ code: 'custom', path: ['harnesses'], message: 'duplicate harness' });
    if (cfg.workspace === 'single' && cfg.projects.length > 1) {
      ctx.addIssue({ code: 'custom', path: ['workspace'], message: 'single mode allows exactly one project' });
    }
    if (cfg.workspace === 'polyrepo' && cfg.projects.some((p) => p.path === '.')) {
      ctx.addIssue({ code: 'custom', path: ['projects'], message: 'polyrepo projects cannot live at the workspace root' });
    }
    const emojis = Object.values(cfg.commits.emoji);
    if (new Set(emojis).size !== emojis.length)
      ctx.addIssue({ code: 'custom', path: ['commits', 'emoji'], message: 'each commit type needs a distinct emoji' });
  });

export type Config = z.infer<typeof configSchema>;
export type ConfigInput = z.input<typeof configSchema>;
