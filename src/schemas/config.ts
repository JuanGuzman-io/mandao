import { z } from 'zod';
import { harnessId, kebabId, profile, relPath, tier, workspaceMode, TIERS } from './common.js';

export const COMMIT_TYPES = [
  'feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'build', 'ci', 'revert',
] as const;

export const DEFAULT_COMMIT_EMOJI: Record<(typeof COMMIT_TYPES)[number] | 'breaking', string> = {
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

const project = z.object({
  name: kebabId,
  path: relPath,
  profile,
  /** Polyrepo only: the project is an independent git repository. */
  repo: z.boolean().optional(),
});
export type ProjectConfig = z.infer<typeof project>;

const tierMap = z.object(Object.fromEntries(TIERS.map((t) => [t, z.string().min(1)])) as Record<
  (typeof TIERS)[number],
  z.ZodString
>);

const commits = z
  .object({
    emoji: z
      .object({
        ...Object.fromEntries(
          [...COMMIT_TYPES, 'breaking'].map((t) => [t, z.string().min(1)]),
        ),
      } as Record<(typeof COMMIT_TYPES)[number] | 'breaking', z.ZodString>)
      .default(DEFAULT_COMMIT_EMOJI),
    maxSubjectLength: z.number().int().positive().default(72),
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
    version: z.literal(1),
    workspace: z.object({
      mode: workspaceMode,
      /** Where canonical specs and the workspace constitution live. Relevant in polyrepo. */
      home: relPath.default('.'),
      /** Polyrepo only: the user accepted that root artifacts are not versioned. */
      localOnly: z.boolean().optional(),
    }),
    projects: z.array(project).min(1),
    harnesses: z.array(harnessId).min(1),
    presets: z.array(z.string().min(1)).default([]),
    skillPacks: z.array(kebabId).default([]),
    paths: z
      .object({
        specs: relPath.default('specs'),
        constitution: relPath.default('docs/constitution'),
        releases: relPath.default('docs/releases'),
      })
      .prefault({}),
    spec: z
      .object({
        id: z.enum(['tracker', 'sequential']).default('tracker'),
        branch: z.string().default('{id}-{slug}'),
      })
      .prefault({}),
    models: z.partialRecord(harnessId, tierMap).default({}),
    commits,
    /** How generated commands invoke Mandao scripts. */
    scripts: z
      .object({ runner: z.enum(['npx', 'local']).default('npx') })
      .prefault({}),
  })
  .superRefine((cfg, ctx) => {
    const names = new Set<string>();
    const paths = new Set<string>();
    cfg.projects.forEach((p, i) => {
      if (names.has(p.name)) {
        ctx.addIssue({ code: 'custom', path: ['projects', i, 'name'], message: `duplicate project name "${p.name}"` });
      }
      if (paths.has(p.path)) {
        ctx.addIssue({ code: 'custom', path: ['projects', i, 'path'], message: `duplicate project path "${p.path}"` });
      }
      names.add(p.name);
      paths.add(p.path);
    });
    if (new Set(cfg.harnesses).size !== cfg.harnesses.length) {
      ctx.addIssue({ code: 'custom', path: ['harnesses'], message: 'duplicate harness' });
    }
    if (cfg.workspace.mode === 'single' && cfg.projects.length > 1) {
      ctx.addIssue({ code: 'custom', path: ['workspace', 'mode'], message: 'single mode allows exactly one project' });
    }
    if (cfg.workspace.mode === 'polyrepo' && cfg.projects.some((p) => p.path === '.')) {
      ctx.addIssue({ code: 'custom', path: ['projects'], message: 'polyrepo projects cannot live at the workspace root' });
    }
    const emojis = Object.values(cfg.commits.emoji);
    if (new Set(emojis).size !== emojis.length) {
      ctx.addIssue({ code: 'custom', path: ['commits', 'emoji'], message: 'each commit type needs a distinct emoji' });
    }
  });

export type Config = z.infer<typeof configSchema>;
export type ConfigInput = z.input<typeof configSchema>;

export const DEFAULT_MODELS: Partial<Record<z.infer<typeof harnessId>, Record<z.infer<typeof tier>, string>>> = {
  claude: { fast: 'haiku', standard: 'sonnet', strong: 'opus' },
};
