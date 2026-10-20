import { z } from 'zod';

/** Team branching models (ADR 0023). Each is a preset of defaults; every field can be overridden. */
export const BRANCHING_MODELS = ['trunk', 'feature-branch', 'gitflow', 'env-branches'] as const;
export type BranchingModel = (typeof BRANCHING_MODELS)[number];

const branch = z.string().min(1);
const prefix = z.string().regex(/^[\w.-]+\/$|^$/, 'a prefix ends with "/" (or is empty)');

/** What `config.yml` holds: the model plus any overrides. */
export const branchingInput = z
  .object({
    model: z.enum(BRANCHING_MODELS).default('feature-branch'),
    /** Where spec branches start and where their PR targets. */
    base: branch.optional(),
    /** Environments a change moves through, in order. Recorded, never automated. */
    promotion: z.array(branch).optional(),
    production: branch.optional(),
    prefixes: z.object({ feature: prefix, fix: prefix, hotfix: prefix, release: prefix }).partial().optional(),
    hotfix: z
      .object({ from: branch, merge_to: z.array(branch).min(1) })
      .partial()
      .optional(),
    /** Branches Mandao never commits or pushes to. */
    protected: z.array(branch).optional(),
    /** trunk only: warn when a spec branch is older. */
    max_branch_age_days: z.number().int().positive().optional(),
  })
  .strict();
export type BranchingInput = z.input<typeof branchingInput>;

export interface Branching {
  model: BranchingModel;
  base: string;
  promotion: string[];
  production: string;
  prefixes: { feature: string; fix: string; hotfix: string; release: string };
  hotfix: { from: string; merge_to: string[] };
  protected: string[];
  max_branch_age_days?: number;
}

const PRESETS: Record<BranchingModel, Branching> = {
  trunk: {
    model: 'trunk',
    base: 'main',
    promotion: [],
    production: 'main',
    prefixes: { feature: 'feat/', fix: 'fix/', hotfix: 'fix/', release: '' },
    hotfix: { from: 'main', merge_to: ['main'] },
    protected: ['main'],
    max_branch_age_days: 2,
  },
  'feature-branch': {
    model: 'feature-branch',
    base: 'main',
    promotion: [],
    production: 'main',
    prefixes: { feature: 'feat/', fix: 'fix/', hotfix: 'hotfix/', release: 'release/' },
    hotfix: { from: 'main', merge_to: ['main'] },
    protected: ['main'],
  },
  gitflow: {
    model: 'gitflow',
    base: 'develop',
    promotion: ['develop', 'main'],
    production: 'main',
    prefixes: { feature: 'feature/', fix: 'bugfix/', hotfix: 'hotfix/', release: 'release/' },
    hotfix: { from: 'main', merge_to: ['main', 'develop'] },
    protected: ['main', 'develop'],
  },
  'env-branches': {
    model: 'env-branches',
    base: 'test',
    promotion: ['test', 'staging', 'main'],
    production: 'main',
    prefixes: { feature: 'feat/', fix: 'fix/', hotfix: 'hotfix/', release: '' },
    hotfix: { from: 'main', merge_to: ['main', 'staging', 'test'] },
    protected: ['main', 'staging', 'test'],
  },
};

/** The preset of `model` with the overrides applied. */
export function resolveBranching(input: z.output<typeof branchingInput> | undefined): Branching {
  const preset = PRESETS[input?.model ?? 'feature-branch'];
  if (!input) return structuredClone(preset);
  const { model, prefixes, hotfix, max_branch_age_days, ...rest } = input;
  const out: Branching = {
    ...structuredClone(preset),
    ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)),
    model,
    prefixes: { ...preset.prefixes, ...prefixes },
    hotfix: { ...preset.hotfix, ...hotfix },
  };
  const age = max_branch_age_days ?? preset.max_branch_age_days;
  if (model === 'trunk' && age) out.max_branch_age_days = age;
  else delete out.max_branch_age_days;
  return out;
}
