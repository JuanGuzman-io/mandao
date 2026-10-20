import { z } from 'zod';

export const kebabId = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case');

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

/** Relative POSIX path that stays inside the workspace. */
export const relPath = z
  .string()
  .min(1)
  .refine((p) => !p.startsWith('/') && !/^[A-Za-z]:/.test(p), 'must be relative')
  .refine((p) => !p.split('/').includes('..'), 'must not escape the workspace');
