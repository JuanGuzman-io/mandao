import { availableModels, detectProviders, openCodeSources, type ProviderSources } from '../models/providers.js';
import { type ResolvedModels, usedModels } from '../models/resolve.js';
import type { Recommendations } from '../schemas/index.js';
import type { Finding } from './doctor.js';

/** Local providers run without credentials. */
const LOCAL = new Set(['ollama', 'lmstudio']);

/** Roles whose provider is not configured, and roles whose model OpenCode does not list here. */
function roleFindings(models: ResolvedModels, providers: string[], available: Set<string>): Finding[] {
  const missing = new Map<string, string[]>();
  const unlisted: string[] = [];
  for (const { role, choice } of usedModels(models)) {
    const provider = choice.model.split('/')[0]!;
    if (!choice.model.includes('/') || LOCAL.has(provider)) continue;
    if (!providers.includes(provider)) missing.set(provider, [...(missing.get(provider) ?? []), role]);
    else if (available.size && !available.has(choice.model)) unlisted.push(`${role} (${choice.model})`);
  }
  const out: Finding[] = unlisted.length
    ? [
        {
          level: 'warn',
          message: `opencode: ${unlisted.join(', ')} not in \`opencode models\` here`,
          fix: 'pick a listed model with `mandao models set <role> <model> --harness opencode`',
        },
      ]
    : [];
  for (const [provider, roles] of missing) {
    out.push({
      level: 'warn',
      message: `opencode: ${roles.join(', ')} ${roles.length > 1 ? 'use' : 'uses'} ${provider}, which is not configured here`,
      fix: `run \`opencode auth login\` for ${provider}, or \`mandao models set <role> <model> --harness opencode\``,
    });
  }
  return out;
}

/** Every role's provider must be available in OpenCode, and its model listed, or that role cannot run (ADR 0017, ADR 0029). */
export function opencodeFindings(models: ResolvedModels | undefined, src: ProviderSources): Finding[] {
  if (!models) return [];
  const providers = detectProviders(src);
  const status: Finding = providers.length
    ? { level: 'ok', message: `opencode: providers configured: ${providers.join(', ')}` }
    : {
        level: 'warn',
        message: 'opencode: no provider available (no listed models, stored credentials or provider environment variables)',
        fix: 'run `opencode auth login`, or set ANTHROPIC_API_KEY / OPENAI_API_KEY',
      };
  return [status, ...roleFindings(models, providers, availableModels(src))];
}

type ProviderSets = NonNullable<NonNullable<Recommendations['harnesses']['opencode']>['provider_sets']>;

/** `mandao models set` for every role of a set, so no role stays on a provider that is not there. */
function setCommands(routed: ProviderSets[string]['routed']): string {
  const implementer = new Set(Object.values(routed.implementer));
  const pairs: [string, string][] = [
    ['leader', routed.leader],
    ['reviewer', routed.reviewer],
    ...(routed.reviewer_alt ? [['reviewer_alt', routed.reviewer_alt] as [string, string]] : []),
    ['tester', routed.tester],
    ...(implementer.size === 1 ? [['implementer', [...implementer][0]!] as [string, string]] : []),
  ];
  return pairs.map(([role, model]) => `\`mandao models set ${role} ${model} --harness opencode\``).join('; ');
}

/** Optional sets the configured providers cover, offered with their terms, never applied (ADR 0027). */
export function optionalSetFindings(sets: ProviderSets | undefined, providers: string[]): Finding[] {
  return Object.entries(sets ?? {})
    .filter(([, set]) => set.optional && set.providers.every((p) => providers.includes(p)))
    .map(([name, set]) => ({
      level: 'info' as const,
      message: `opencode: optional set ${name} fits the configured providers (${set.note ?? 'see recommendations'}; ${set.source ?? 'no source'}, reviewed ${set.reviewed ?? '?'})`,
      fix: `apply it only for public code, every role: ${setCommands(set.routed)}`,
    }));
}

export const opencodeDoctor = (root: string, models: ResolvedModels | undefined, sets?: ProviderSets) => {
  const src = openCodeSources(root);
  return [...opencodeFindings(models, src), ...optionalSetFindings(sets, detectProviders(src))];
};
