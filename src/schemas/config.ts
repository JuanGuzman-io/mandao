import { z } from 'zod';
import { branchingInput } from './branching.js';
import { gate, harnessId, kebabId, profile, relPath, schemaVersion, workspaceMode } from './common.js';
import { researchConfigSchema } from './research.js';

/**
 * Size thresholds, measured on the real diff only (ADR 0028): never estimated, never stored in a spec.
 * Crossing one triggers its action — escalate a quick change, propose splitting the PR — nothing else.
 */
const sizeLimit = z.object({ max_files: z.number().int().positive(), max_changed_lines: z.number().int().positive() }).partial();
export const sizeLimitsSchema = z.object({ quick: sizeLimit, pr: sizeLimit }).partial();
export type SizeLimits = z.infer<typeof sizeLimitsSchema>;
export const DEFAULT_SIZE_LIMITS = {
  quick: { max_files: 3, max_changed_lines: 100 },
  pr: { max_files: 25, max_changed_lines: 400 },
} as const;

/** Operations with their own memory floor (ADR 0024): a build does not need what an e2e suite needs. */
export const OPERATIONS = ['build', 'tests', 'e2e'] as const;
export type Operation = (typeof OPERATIONS)[number];
const operationBudget = z.object({ min_free_memory_mb: z.number().int().nonnegative() }).partial();

/** Run budget (ADR 0013, ADR 0024). Every key is optional so a project can override only what differs. */
export const resourcesSchema = z
  .object({
    /** `auto` = half the cores. */
    max_workers: z.union([z.literal('auto'), z.number().int().positive()]),
    /** Floor for tests when `operations.tests` does not set one (kept from ADR 0013). */
    min_free_memory_mb: z.number().int().nonnegative(),
    /** Memory floor per operation; a project overrides one operation without repeating the others. */
    operations: z.object({ build: operationBudget, tests: operationBudget, e2e: operationBudget }).partial(),
    priority: z.enum(['low', 'normal']),
    e2e_workers: z.number().int().positive(),
    /** Per test run, in seconds. */
    timeout_s: z.number().int().positive(),
  })
  .partial();
export type ResourcesConfig = z.infer<typeof resourcesSchema>;

/** Default memory floor per operation, in MB. */
export const DEFAULT_OPERATION_FLOOR: Record<Operation, number> = { build: 1024, tests: 2048, e2e: 3072 };

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
  /** This project's size thresholds, over the workspace's (ADR 0028). */
  size_limits: sizeLimitsSchema.optional(),
  /** Polyrepo: this repository's own branching model; otherwise the workspace's applies (ADR 0023). */
  branching: branchingInput.optional(),
  /** Commands run in every new worktree after dependencies: codegen, ORM clients, shared libs (§14.5). */
  worktree: z.object({ setup: z.array(z.string().min(1)).default([]) }).prefault({}),
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
    /**
     * Shadow mode (pilots, ADR 0030): everything Mandao generates is listed in `.git/info/exclude`, and
     * managed blocks are never written into files git already tracks, so the team sees no change.
     */
    shadow: z.boolean().default(false),
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
    /** Thresholds on the real diff: quick post-check and PR splitting (ADR 0028). */
    size_limits: sizeLimitsSchema.default({}),
    /** Kaizen (design §18.1): no TDD conclusion below this many specs per group (ADR 0026). */
    kaizen: z.object({ min_specs_per_group: z.number().int().positive().default(5) }).prefault({}),
    /** What `close` does with a spec's worktree after merge (ADR 0037). */
    worktrees: z.object({ cleanup: z.enum(['ask', 'auto-after-merge', 'never']).default('ask') }).prefault({}),
    /** Gates before push: local impacted checks by default; full suite only by explicit project choice. */
    delivery: z.object({ pre_push: z.enum(['impacted', 'full', 'none']).default('impacted') }).prefault({}),
    /** Cost cap per spec in USD (ADR 0036): a warning at 80%, a confirmation to go on at 100%. */
    budget: z.object({ per_spec: z.number().positive().optional() }).prefault({}),
    /** Session cuts (ADR 0038): inside implement the Leader stops to suggest one only above this saving (USD). */
    session: z.object({ cut_min_savings: z.number().nonnegative().optional() }).prefault({}),
    /** Research evidence freshness and per-spec dispatch budget (Phase 8). */
    research: researchConfigSchema,
    /** Diagram engine is an explicit project choice; Archify is required by default. */
    diagrams: z.object({ engine: z.enum(['archify', 'mermaid']).default('archify') }).prefault({}),
    /**
     * A version 2 spec's local cache, `.mandao/cache/<ID>/` (MDO-0011 D3): `summary` deletes it at close, `full`
     * keeps it on this machine. Neither commits it.
     */
    logs: z.object({ level: z.enum(['summary', 'full']).default('summary') }).prefault({}),
    /** The team's branching model (ADR 0023): preset plus overrides. */
    branching: branchingInput.default({ model: 'feature-branch' }),
    harnesses: z.array(harnessId).min(1),
    presets: z.array(z.string().min(1)).default([]),
    skill_packs: z.array(kebabId).default([]),
    spec: z
      .object({
        /** Branch naming; `{prefix}` comes from `branching.prefixes` by spec type (`{type}`, feat or fix, still works). */
        branch: z.string().default('{prefix}{id}-{slug}'),
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
