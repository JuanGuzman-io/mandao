import { z } from 'zod';
import { harnessId, schemaVersion, TIERS, type HarnessId, type Tier } from './common.js';

const tierMap = z.object(Object.fromEntries(TIERS.map((t) => [t, z.string().min(1)])) as Record<Tier, z.ZodString>);

/** `.mandao/models.yml`: the tier → model registry per harness. */
export const modelsSchema = z.object({
  schema_version: schemaVersion,
  harnesses: z.partialRecord(harnessId, tierMap).default({}),
});

export type Models = z.infer<typeof modelsSchema>;

/** Defaults written by `init`. Copilot model names are not portable, so they are left to the team. */
export const DEFAULT_MODELS: Partial<Record<HarnessId, Record<Tier, string>>> = {
  claude: { fast: 'haiku', standard: 'sonnet', strong: 'opus' },
};

export const emptyModels = (): Models => ({ schema_version: 1, harnesses: {} });
