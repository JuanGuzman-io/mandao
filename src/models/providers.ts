import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Environment variables that configure a provider in OpenCode (models.dev), by provider id. */
const PROVIDER_ENV: Record<string, string[]> = {
  anthropic: ['ANTHROPIC_API_KEY'],
  openai: ['OPENAI_API_KEY'],
};

export interface ProviderSources {
  /** OpenCode 2: `opencode auth list --format json` — integrations with a connection; only their ids are read. */
  authList?: string;
  /** OpenCode 1: text of `auth.json`; only its keys (provider ids) are read, never the credentials. */
  authJson?: string;
  env: Record<string, string | undefined>;
  /** Texts of `opencode.json(c)` files, global first, project last (later wins). */
  configs: string[];
}

/** JSONC without comments or trailing commas, enough for OpenCode's config files. */
function parseJsonc(text: string): Record<string, unknown> {
  const stripped = text
    .replace(/("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (_m, str: string | undefined) => str ?? '')
    .replace(/,(\s*[}\]])/g, '$1');
  try {
    return JSON.parse(stripped) as Record<string, unknown>;
  } catch {
    return {};
  }
}

const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : undefined);

/**
 * Providers OpenCode can use here, without running it: credentials stored by `opencode auth login`,
 * provider environment variables, then `enabled_providers` / `disabled_providers` from config.
 */
export function detectProviders(src: ProviderSources): string[] {
  const found = new Set<string>();
  for (const id of authListIds(src.authList)) found.add(id);
  if (src.authJson) for (const id of Object.keys(parseJsonc(src.authJson))) found.add(id);
  for (const [id, vars] of Object.entries(PROVIDER_ENV)) if (vars.some((v) => src.env[v])) found.add(id);
  let enabled: string[] | undefined;
  let disabled: string[] = [];
  for (const text of src.configs) {
    const cfg = parseJsonc(text);
    enabled = list(cfg.enabled_providers) ?? enabled;
    disabled = list(cfg.disabled_providers) ?? disabled;
  }
  return [...found].filter((p) => (!enabled || enabled.includes(p)) && !disabled.includes(p)).sort();
}

/** Provider ids from `opencode auth list --format json` (OpenCode 2 stores credentials in its database). */
function authListIds(text: string | undefined): string[] {
  if (!text) return [];
  try {
    const list = JSON.parse(text) as { id?: unknown }[];
    return Array.isArray(list) ? list.flatMap((i) => (typeof i.id === 'string' ? [i.id] : [])) : [];
  } catch {
    return [];
  }
}

/** The largest recommended set whose providers are all configured; optional sets are only offered. */
export function chooseProviderSet(
  sets: Record<string, { providers: string[]; optional?: boolean }>,
  providers: string[],
): string | undefined {
  const fits = Object.entries(sets).filter(([, s]) => !s.optional && s.providers.every((p) => providers.includes(p)));
  return fits.sort((a, b) => b[1].providers.length - a[1].providers.length)[0]?.[0];
}

const readIf = (file: string) => (existsSync(file) ? readFileSync(file, 'utf8') : undefined);

/** `opencode auth list --format json`, or undefined when OpenCode is missing or fails. Lists ids, never secrets. */
function runAuthList(): string | undefined {
  try {
    return execFileSync('opencode', ['auth', 'list', '--format', 'json'], {
      encoding: 'utf8',
      timeout: 20_000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return undefined;
  }
}

/** OpenCode's credentials (v2 CLI, v1 auth.json), its config files (XDG paths) and the project's. */
export function openCodeSources(
  root: string,
  env: Record<string, string | undefined> = process.env,
  authList = runAuthList,
): ProviderSources {
  const data = env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share');
  const config = env.XDG_CONFIG_HOME ?? join(homedir(), '.config');
  const configFiles = [join(config, 'opencode'), root].flatMap((d) => ['opencode.json', 'opencode.jsonc'].map((f) => join(d, f)));
  const list = authList();
  return {
    ...(list ? { authList: list } : {}),
    ...(readIf(join(data, 'opencode', 'auth.json')) ? { authJson: readIf(join(data, 'opencode', 'auth.json')) } : {}),
    env,
    configs: configFiles.map(readIf).filter((t): t is string => t !== undefined),
  };
}
