import { detectProviders, openCodeSources, type ProviderSources } from '../models/providers.js';
import { type ResolvedModels, usedModels } from '../models/resolve.js';
import type { Recommendations } from '../schemas/index.js';
import type { Finding } from './doctor.js';

/** Local providers run without credentials. */
const LOCAL = new Set(['ollama', 'lmstudio']);

/** Every role's provider must be configured in OpenCode, or that role cannot run (ADR 0017). */
export function opencodeFindings(models: ResolvedModels | undefined, src: ProviderSources): Finding[] {
  if (!models) return [];
  const providers = detectProviders(src);
  const out: Finding[] = [
    providers.length
      ? { level: 'ok', message: `opencode: providers configured: ${providers.join(', ')}` }
      : {
          level: 'warn',
          message: 'opencode: no provider configured (no stored credentials or provider environment variables found)',
          fix: 'run `opencode auth login`, or set ANTHROPIC_API_KEY / OPENAI_API_KEY',
        },
  ];
  const missing = new Map<string, string[]>();
  for (const { role, choice } of usedModels(models)) {
    const provider = choice.model.split('/')[0]!;
    if (!choice.model.includes('/') || LOCAL.has(provider) || providers.includes(provider)) continue;
    missing.set(provider, [...(missing.get(provider) ?? []), role]);
  }
  for (const [provider, roles] of missing) {
    out.push({
      level: 'warn',
      message: `opencode: ${roles.join(', ')} ${roles.length > 1 ? 'use' : 'uses'} ${provider}, which is not configured here`,
      fix: `run \`opencode auth login\` for ${provider}, or \`mandao models set <role> <model> --harness opencode\``,
    });
  }
  return out;
}

type ProviderSets = NonNullable<NonNullable<Recommendations['harnesses']['opencode']>['provider_sets']>;

/** Optional sets the configured providers cover, offered with their terms, never applied (ADR 0027). */
export function optionalSetFindings(sets: ProviderSets | undefined, providers: string[]): Finding[] {
  return Object.entries(sets ?? {})
    .filter(([, set]) => set.optional && set.providers.every((p) => providers.includes(p)))
    .map(([name, set]) => ({
      level: 'info' as const,
      message: `opencode: optional set ${name} fits the configured providers (${set.note ?? 'see recommendations'}; ${set.source ?? 'no source'}, reviewed ${set.reviewed ?? '?'})`,
      fix: `apply it only for public code: \`mandao models set implementer ${set.simple.implementer} --harness opencode\` and \`mandao models set reviewer ${set.simple.reviewer} --harness opencode\``,
    }));
}

export const opencodeDoctor = (root: string, models: ResolvedModels | undefined, sets?: ProviderSets) => {
  const src = openCodeSources(root);
  return [...opencodeFindings(models, src), ...optionalSetFindings(sets, detectProviders(src))];
};
