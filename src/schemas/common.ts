import { z } from 'zod';

export const kebabId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case');

export const HARNESS_IDS = ['claude', 'copilot'] as const;
export const harnessId = z.enum(HARNESS_IDS);
export type HarnessId = z.infer<typeof harnessId>;

export const PROFILES = ['app', 'ai', 'data'] as const;
export const profile = z.enum(PROFILES);
export type Profile = z.infer<typeof profile>;

export const TIERS = ['fast', 'standard', 'strong'] as const;
export const tier = z.enum(TIERS);
export type Tier = z.infer<typeof tier>;

export const CAPABILITIES = ['read', 'edit', 'search', 'shell', 'web', 'mcp', 'agents'] as const;
export const capability = z.enum(CAPABILITIES);
export type Capability = z.infer<typeof capability>;

export const WORKSPACE_MODES = ['single', 'monorepo', 'polyrepo'] as const;
export const workspaceMode = z.enum(WORKSPACE_MODES);
export type WorkspaceMode = z.infer<typeof workspaceMode>;

export const schemaVersion = z.literal(1);

/** Relative POSIX path that stays inside the workspace. A trailing slash is dropped. */
export const relPath = z
  .string()
  .min(1)
  .transform((p) => (p.length > 1 ? p.replace(/\/+$/, '') : p))
  .refine((p) => !p.startsWith('/') && !/^[A-Za-z]:/.test(p), 'must be relative')
  .refine((p) => !p.split('/').includes('..'), 'must not escape the workspace');

/** Risk tags assigned per task; they select review lenses and gate `quick`. */
export const RISK_TAGS = ['auth', 'input', 'pii', 'payments', 'migration', 'public-api', 'infra', 'ai-prompt', 'ui', 'perf'] as const;
export const riskTag = z.enum(RISK_TAGS);
export type RiskTag = z.infer<typeof riskTag>;
/** Tags that always escalate a quick change to story/specify. */
export const QUICK_FORBIDDEN_TAGS: readonly RiskTag[] = ['auth', 'payments', 'pii', 'migration'];

/** Deterministic gates (review level 0). Concrete tools are configured per project. */
export const GATES = ['format', 'lint', 'typecheck', 'test', 'secrets', 'audit', 'sast', 'metrics'] as const;
export const gate = z.enum(GATES);
export type Gate = z.infer<typeof gate>;
