import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import semver from 'semver';
import type { Finding } from './doctor.js';
import { parseFrontmatter } from './frontmatter.js';
import type { Probe } from './tools.js';

const MIN_SETTINGS = '2.1.242';
const MIN_FRONTMATTER = '2.1.248';
const VALID = ['5m', '1h'];
const FIX = 'ADR 0036 recommends promptCacheTtl: 5m; Mandao never writes Claude Code settings';
const MAIN_DEFAULT = 'default (1h on a Claude subscription within plan usage, 5m with usage credits, an API key or a cloud provider)';

interface Settings {
  label: string;
  json: Record<string, unknown>;
}

interface Bucket {
  name: string;
  variable: string;
  key: string;
  fallback: string;
}

interface Resolved {
  ttl: string;
  source: string;
}

/** Which D1 step set a bucket's TTL. */
type Step = 'force' | 'variable' | 'key' | 'enable' | 'default';

interface Outcome {
  step: Step;
  text: string;
}

interface Agent {
  name: string;
  file: string;
  ttl: string;
}

/** Settings files, highest first. Read only: Mandao never writes Claude Code settings (ADR 0036). */
function readSettings(root: string, home: string, env: Record<string, string | undefined>): { found: Settings[]; skipped: string[] } {
  const userDir = env.CLAUDE_CONFIG_DIR ?? join(home, '.claude');
  const files = [
    { label: '.claude/settings.local.json', path: join(root, '.claude/settings.local.json') },
    { label: '.claude/settings.json', path: join(root, '.claude/settings.json') },
    { label: env.CLAUDE_CONFIG_DIR ? join(userDir, 'settings.json') : '~/.claude/settings.json', path: join(userDir, 'settings.json') },
  ];
  const found: Settings[] = [];
  const skipped: string[] = [];
  for (const f of files) {
    if (!existsSync(f.path)) continue;
    try {
      const json: unknown = JSON.parse(readFileSync(f.path, 'utf8'));
      if (typeof json !== 'object' || json === null || Array.isArray(json)) throw new Error('not an object');
      found.push({ label: f.label, json: json as Record<string, unknown> });
    } catch {
      skipped.push(f.label);
    }
  }
  return { found, skipped };
}

/** A settings `env` block replaces the shell value, so the highest file that defines the variable wins. */
function variable(name: string, settings: Settings[], env: Record<string, string | undefined>): Resolved | undefined {
  for (const s of settings) {
    const block = s.json.env;
    const value = typeof block === 'object' && block !== null ? (block as Record<string, unknown>)[name] : undefined;
    if (typeof value === 'string') return { ttl: value, source: `${name} in the env block of ${s.label}` };
  }
  const value = env[name];
  return value === undefined ? undefined : { ttl: value, source: `${name} in the environment` };
}

function key(name: string, settings: Settings[]): Resolved | undefined {
  for (const s of settings) {
    const value = s.json[name];
    if (value !== undefined) return { ttl: String(value), source: `${name} in ${s.label}` };
  }
  return undefined;
}

/** Agents in .claude/agents/ whose frontmatter sets experimental.cacheTtl. */
function agentOverrides(root: string): Agent[] {
  const dir = join(root, '.claude/agents');
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.md'));
  } catch {
    return []; // missing, a file, or unreadable: doctor's reads are best-effort
  }
  const out: Agent[] = [];
  for (const file of files) {
    try {
      const data = parseFrontmatter(readFileSync(join(dir, file), 'utf8')).data as {
        name?: unknown;
        experimental?: { cacheTtl?: unknown };
      };
      const ttl = data.experimental?.cacheTtl;
      if (ttl !== undefined && ttl !== null)
        out.push({
          name: typeof data.name === 'string' ? data.name : file.replace(/\.md$/, ''),
          file: `.claude/agents/${file}`,
          ttl: String(ttl),
        });
    } catch {
      // an unreadable agent file, or one refused for a non-YAML fence, is not a TTL source
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function claudeVersion(probe: Probe): string | undefined {
  const out = probe('claude --version');
  return out ? (semver.coerce(out)?.version ?? undefined) : undefined;
}

/** The finding for the prompt-cache TTL of Claude Code, resolved the way Claude Code does (D1). Read only. */
export function cacheFindings(
  root: string,
  home: string,
  env: Record<string, string | undefined>,
  probe: Probe,
  harnesses: string[] = ['claude'],
): Finding[] {
  if (!harnesses.includes('claude')) return [];
  const { found, skipped } = readSettings(root, home, env);
  const version = claudeVersion(probe);
  const supported = version === undefined || semver.gte(version, MIN_SETTINGS);
  const warns: Finding[] = [];
  const valid = (r: Resolved | undefined, what: string): Resolved | undefined => {
    if (!r) return undefined;
    if (VALID.includes(r.ttl)) return r;
    warns.push({
      level: 'warn',
      message: `${what} is ${r.ttl} (${r.source}), which is not 5m or 1h and is ignored by Claude Code`,
      fix: 'set it to 5m or 1h, or remove it',
    });
    return undefined;
  };
  const force = variable('FORCE_PROMPT_CACHING_5M', found, env)?.ttl === '1';
  const enable = variable('ENABLE_PROMPT_CACHING_1H', found, env)?.ttl === '1';
  const forced: Resolved = { ttl: '5m', source: 'FORCE_PROMPT_CACHING_5M' };
  const enabled: Resolved = { ttl: '1h', source: 'ENABLE_PROMPT_CACHING_1H' };
  const frontmatter = version === undefined || semver.gte(version, MIN_FRONTMATTER);
  // An invalid agent value warns and is left out of the overrides (AC-1/C2).
  const agents = (frontmatter ? agentOverrides(root) : []).filter((a) =>
    valid({ ttl: a.ttl, source: a.file }, `experimental.cacheTtl of agent ${a.name}`),
  );

  const resolve = (b: Bucket): Outcome => {
    const steps: [Step, () => Resolved | undefined][] = [
      ['force', () => (supported && force ? forced : undefined)],
      ['variable', () => (supported ? valid(variable(b.variable, found, env), b.variable) : undefined)],
      ['key', () => (supported ? valid(key(b.key, found), b.key) : undefined)],
      ['enable', () => (supported && enable ? enabled : undefined)],
    ];
    for (const [step, run] of steps) {
      const r = run();
      if (r) return { step, text: `${b.name} ${r.ttl} from ${r.source}` };
    }
    return { step: 'default', text: `${b.name} ${b.fallback}` };
  };

  const main = resolve({ name: 'main', variable: 'CLAUDE_CODE_PROMPT_CACHE_TTL', key: 'promptCacheTtl', fallback: MAIN_DEFAULT });
  const sub = resolve({
    name: 'subagents',
    variable: 'CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL',
    key: 'subagentPromptCacheTtl',
    fallback: 'default 5m',
  });

  const parts = [main.text, sub.text];
  const unsetAll = !found.some((s) => s.json.promptCacheTtl !== undefined || s.json.subagentPromptCacheTtl !== undefined);
  if (unsetAll && main.step === 'default' && sub.step === 'default') parts.unshift('promptCacheTtl and subagentPromptCacheTtl are unset');
  // D1 step 4: agent frontmatter loses to steps 1-3 and wins over ENABLE_PROMPT_CACHING_1H.
  const agentsApply = sub.step === 'enable' || sub.step === 'default';
  const overEnable = sub.step === 'enable' ? ', ahead of ENABLE_PROMPT_CACHING_1H for that agent' : '';
  for (const a of agentsApply ? agents : []) {
    parts.push(`agent ${a.name} overrides the subagent TTL with ${a.ttl}${overEnable} (Claude Code ${MIN_FRONTMATTER}+)`);
  }
  if (version === undefined) parts.push(`Claude Code version not checked (the TTL variables and keys need ${MIN_SETTINGS}+)`);
  else if (!supported)
    parts.push(`Claude Code ${version} ignores the TTL variables and keys (they need ${MIN_SETTINGS}+), so the default applies`);
  if (skipped.length) parts.push(`unreadable settings skipped: ${skipped.join(', ')}`);
  parts.push(
    'managed settings and --settings rank higher but are not read; the Desktop app and self-hosted runners build their own launch environment',
  );

  return [...warns, { level: 'info', message: `prompt-cache TTL: ${parts.join('; ')}`, fix: FIX }];
}
