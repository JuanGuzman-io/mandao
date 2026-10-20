import { z } from 'zod';
import { gate, harnessId, kebabId, profile, relPath, schemaVersion, workspaceMode } from './common.js';

/** Test-run budget (ADR 0013). Every key is optional so a project can override only what differs. */
export const resourcesSchema = z
  .object({
    /** `auto` = half the cores. */
    max_workers: z.union([z.literal('auto'), z.number().int().positive()]),
    min_free_memory_mb: z.number().int().nonnegative(),
    priority: z.enum(['low', 'normal']),
    e2e_workers: z.number().int().positive(),
    /** Per test run, in seconds. */
    timeout_s: z.number().int().positive(),
  })
  .partial();
export type ResourcesConfig = z.infer<typeof resourcesSchema>;

export const DEFAULT_RESOURCES = {
  max_workers: 'auto',
  min_free_memory_mb: 2048,
  priority: 'low',
  e2e_workers: 1,
  timeout_s: 900,
} as const;

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
  /** Falls back to `default_profile`. */
  profile: profile.optional(),
  tracker_key: z
    .string()
    .regex(/^[A-Z][A-Z0-9_]*$/, 'must be an uppercase tracker key')
    .optional(),
  /** Polyrepo: remote URL of the project's own repository (or `local` when it has none). */
  repo: z.string().min(1).optional(),
  /** Shell command per deterministic gate, run from the project path. Missing gates are reported by doctor. */
  gates: z.partialRecord(gate, z.string().min(1)).default({}),
  /**
   * Impacted-test commands. `{files}` is replaced by the impacted test or source files and `{workers}` by
   * the worker budget; when set they win over runner detection (ADR 0020).
   */
  tests: z
    .object({ impacted: z.string().min(1), e2e: z.string().min(1) })
    .partial()
    .default({}),
  resources: resourcesSchema.default({}),
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
        /** Where spec worktrees live, relative to the workspace root; may sit outside it. `{repo}` = the root folder name. */
        worktrees: z.string().min(1).default('../{repo}.worktrees'),
      })
      .prefault({}),
    resources: resourcesSchema.default({}),
    /** Profile for projects that do not declare one. */
    default_profile: profile.default('app'),
    /**
     * Language of generated content. Section headings and keywords (GIVEN/WHEN/THEN, MUST, AC-n, FR-n,
     * ASSUMPTION/OPEN/CONFLICT) always stay in English; code and commits are always English.
     */
    language: z
      .object({
        /** story, release notes, questions to the PO, product context. */
        business: z.string().min(2).default('en'),
        /** requirements, design, tasks, technical docs. */
        technical: z.string().min(2).default('en'),
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
    /** How the launcher finds Mandao: auto = local node_modules → global → npx with the locked version. */
    scripts: z.object({ runner: z.enum(['auto', 'local', 'global', 'npx']).default('auto') }).prefault({}),
  })
  .transform((cfg) => ({ ...cfg, projects: cfg.projects.map((p) => ({ ...p, profile: p.profile ?? cfg.default_profile })) }))
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
