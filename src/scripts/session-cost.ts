import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ModelPrice } from '../schemas/index.js';

/** Cost of one Claude Code session so far, per role (the main session or a subagent type) and per model. */
export interface SessionCost {
  usd: number;
  roles: Record<string, number>;
  models: Record<string, number>;
  /** Models seen with no price: their tokens are not counted, and the report says so. */
  unpriced: string[];
}

interface Usage {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_creation?: { ephemeral_5m_input_tokens?: number; ephemeral_1h_input_tokens?: number };
}

const round = (n: number) => Math.round(n * 1e6) / 1e6;

/** One API response's cost: input, cache writes (5m and 1h), cache reads and output, at the model's prices. */
export function usageCost(u: Usage, price: ModelPrice): number {
  const prompt = (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
  const p = price.long_context && prompt > price.long_context.above_tokens ? price.long_context : price;
  const oneHour = u.cache_creation?.ephemeral_1h_input_tokens ?? 0;
  const fiveMin = u.cache_creation?.ephemeral_5m_input_tokens ?? Math.max(0, (u.cache_creation_input_tokens ?? 0) - oneHour);
  const tokens =
    (u.input_tokens ?? 0) * p.input +
    fiveMin * p.cache_write_5m +
    oneHour * p.cache_write_1h +
    (u.cache_read_input_tokens ?? 0) * p.cache_read +
    (u.output_tokens ?? 0) * p.output;
  return tokens / 1e6;
}

/**
 * Each response's final usage: a streamed response is written several times under one message id, with
 * its output tokens growing, so the last line of each id is the one that counts.
 */
function responses(file: string): { model: string; usage: Usage }[] {
  const byId = new Map<string, { model: string; usage: Usage }>();
  let anonymous = 0;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.includes('"usage"')) continue;
    let m: { id?: string; model?: string; usage?: Usage } | undefined;
    try {
      m = (JSON.parse(line) as { message?: typeof m }).message;
    } catch {
      continue;
    }
    if (m?.usage && m.model) byId.set(m.id ?? `anonymous-${anonymous++}`, { model: m.model, usage: m.usage });
  }
  return [...byId.values()];
}

/** Adds one transcript's responses to the cost, under `role`. */
function addTranscript(file: string, role: string, prices: Record<string, ModelPrice>, out: SessionCost) {
  for (const { model, usage } of responses(file)) {
    const price = prices[model];
    if (!price) {
      if (!out.unpriced.includes(model) && model !== '<synthetic>') out.unpriced.push(model);
      continue;
    }
    const usd = usageCost(usage, price);
    out.usd += usd;
    out.roles[role] = (out.roles[role] ?? 0) + usd;
    out.models[model] = (out.models[model] ?? 0) + usd;
  }
}

/** Where Claude Code keeps a session's transcript: `~/.claude/projects/<cwd slug>/<session>.jsonl`. */
export function findClaudeTranscript(
  session: string,
  home = process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude'),
): string | undefined {
  const projects = join(home, 'projects');
  if (!existsSync(projects)) return undefined;
  for (const dir of readdirSync(projects)) {
    const file = join(projects, dir, `${session}.jsonl`);
    if (existsSync(file)) return file;
  }
  return undefined;
}

/**
 * The session's cost so far: the main transcript is the command's own role (`leader` in implement), each
 * subagent transcript is its agent type (`mandao-reviewer`, `mandao-implementer-standard`…).
 */
export function claudeSessionCost(transcript: string, mainRole: string, prices: Record<string, ModelPrice>): SessionCost {
  const out: SessionCost = { usd: 0, roles: {}, models: {}, unpriced: [] };
  addTranscript(transcript, mainRole, prices, out);
  const subagents = join(transcript.replace(/\.jsonl$/, ''), 'subagents');
  if (existsSync(subagents)) {
    for (const f of readdirSync(subagents).filter((x) => x.endsWith('.jsonl'))) {
      const meta = join(subagents, f.replace(/\.jsonl$/, '.meta.json'));
      let role = 'subagent';
      try {
        role = (JSON.parse(readFileSync(meta, 'utf8')) as { agentType?: string }).agentType ?? role;
      } catch {
        // no meta: the subagent is counted as `subagent`
      }
      addTranscript(join(subagents, f), role, prices, out);
    }
  }
  out.usd = round(out.usd);
  for (const k of Object.keys(out.roles)) out.roles[k] = round(out.roles[k]!);
  for (const k of Object.keys(out.models)) out.models[k] = round(out.models[k]!);
  return out;
}

export type CostBasis = 'billed' | 'equivalent' | 'unknown';

/**
 * Whether Claude Code's spend is money billed or an equivalent at list prices, from `claude auth status`:
 * a claude.ai login is a subscription (equivalent; usage beyond the plan draws credits we cannot see), an
 * API key or a cloud provider is billed. `MANDAO_COST_BASIS` overrides it.
 */
export function claudeCostBasis(
  status: () => string = () => execFileSync('claude', ['auth', 'status'], { encoding: 'utf8', timeout: 5000 }),
): CostBasis {
  const forced = process.env.MANDAO_COST_BASIS;
  if (forced === 'billed' || forced === 'equivalent' || forced === 'unknown') return forced;
  try {
    const s = JSON.parse(status()) as { loggedIn?: boolean; authMethod?: string; apiProvider?: string };
    if (!s.loggedIn) return 'unknown';
    if (s.apiProvider && s.apiProvider !== 'firstParty') return 'billed';
    if (s.authMethod === 'claude.ai') return 'equivalent';
    return /api.?key|console/i.test(s.authMethod ?? '') ? 'billed' : 'unknown';
  } catch {
    return 'unknown';
  }
}
