import { existsSync, readFileSync } from 'node:fs';
import type { Config, ModelPrice } from '../schemas/index.js';
import { writeText } from '../writer/files.js';
import type { CostBasis } from './session-cost.js';
import { logPath, specKeepsState, updateState } from './spec-log.js';

/**
 * When the Leader should end the session at a task boundary and resume from the checkpoint in a new one
 * (ADR 0038). Staying re-reads the whole context C from the cache on every remaining turn; a new session
 * writes a base B' once (system prompt, tools, command, the spec reloaded) and then re-reads only B'.
 * Cut when (C − B') × read × N > B' × write, with N the turns still to run.
 */

/** Main-session turns per task and for verify plus close, measured on MDO-0004 to MDO-0007. */
export const TURNS_PER_TASK = 15;
export const TURNS_AFTER_TASKS = 28;
/** What a new session reads back before it works: the spec, tasks and checkpoint (MDO-0006 sessions). */
export const RELOAD_TOKENS = 10_000;

export interface SessionContext {
  model: string;
  /** Prompt tokens of the session's first and last main responses (input + cache reads + cache writes). */
  first: number;
  last: number;
  lastAt: number;
  /** The cache TTL the session writes with: 1h when any write was 1h, else 5m. */
  ttl: '5m' | '1h';
}

interface Line {
  isSidechain?: boolean;
  timestamp?: string;
  message?: {
    id?: string;
    model?: string;
    content?: unknown;
    usage?: {
      input_tokens?: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_creation?: { ephemeral_1h_input_tokens?: number };
    };
  };
}

export interface MainResponse {
  /** `message.id`: a streamed response repeats it on several lines and counts as one turn. */
  id: string;
  model: string;
  size: number;
  at: number;
  oneHour: boolean;
  /** The line calls a subagent (an `Agent` tool_use, or `Task` in older transcripts). */
  agent: boolean;
}

const AGENT_TOOLS = new Set<unknown>(['Agent', 'Task']);

const isAgentCall = (block: unknown) => {
  const b = block as { type?: unknown; name?: unknown } | null;
  return b?.type === 'tool_use' && AGENT_TOOLS.has(b.name);
};

/**
 * One main-session response line (not a sidechain, not `<synthetic>`, with usage): its id, model, prompt
 * size, time, whether it wrote the 1h cache and whether it calls a subagent. No text leaves it.
 */
export function mainResponse(raw: string): MainResponse | undefined {
  if (!raw.includes('"usage"')) return undefined;
  let line: Line;
  try {
    line = JSON.parse(raw) as Line;
  } catch {
    return undefined;
  }
  const u = line.message?.usage;
  const model = line.message?.model;
  if (!u || !model || model === '<synthetic>' || line.isSidechain) return undefined;
  const content = line.message?.content;
  return {
    id: typeof line.message?.id === 'string' ? line.message.id : '',
    model,
    size: (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0),
    at: Date.parse(line.timestamp ?? '') || 0,
    oneHour: (u.cache_creation?.ephemeral_1h_input_tokens ?? 0) > 0,
    agent: Array.isArray(content) && content.some(isAgentCall),
  };
}

/** The main session's context from its Claude Code transcript; subagents are in their own files. */
export function sessionContext(transcript: string): SessionContext | undefined {
  const responses = readFileSync(transcript, 'utf8')
    .split('\n')
    .flatMap((raw) => mainResponse(raw) ?? []);
  const last = responses.at(-1);
  if (!last) return undefined;
  const ttl = responses.some((r) => r.oneHour) ? '1h' : '5m';
  return { model: last.model, first: responses[0]!.size, last: last.size, lastAt: last.at, ttl };
}

export interface CutAdvice {
  cut: boolean;
  reason: string;
  /** Estimated USD saved by cutting now (negative: staying is cheaper). */
  savings: number;
}

const TTL_MS = { '5m': 5 * 60_000, '1h': 60 * 60_000 };

/** The cut decision at a task boundary, from the context, the tasks left and the model's prices. */
export function cutAdvice(session: SessionContext, tasksLeft: number, price: ModelPrice, now = Date.now()): CutAdvice {
  const base = session.first + RELOAD_TOKENS;
  const write = session.ttl === '1h' ? price.cache_write_1h : price.cache_write_5m;
  const turns = TURNS_PER_TASK * tasksLeft + TURNS_AFTER_TASKS;
  const saved = (session.last - base) * price.cache_read * turns;
  const k = (n: number) => `${Math.round(n / 1000)}k`;
  const usd = (n: number) => Math.round(n / 1e4) / 100;
  if (session.last <= base) return { cut: false, reason: `context ${k(session.last)} is close to a new session's ${k(base)}`, savings: 0 };
  if (now - session.lastAt > TTL_MS[session.ttl]) {
    // The cache expired: staying writes the whole context again, a new session writes only its base.
    const savings = usd((session.last - base) * write + saved);
    return {
      cut: true,
      reason: `the ${session.ttl} cache expired: a new session rewrites ${k(base)} instead of ${k(session.last)}`,
      savings,
    };
  }
  const savings = usd(saved - base * write);
  const reason = `context ${k(session.last)} vs ${k(base)} in a new session over about ${turns} turns left (${tasksLeft} tasks, verify, close)`;
  return { cut: savings > 0, reason, savings };
}

/** The default stop threshold inside implement: $1, or 15% of `budget.per_spec` when that is less. */
const DEFAULT_MIN_SAVINGS = 1;
const BUDGET_SHARE = 0.15;

/**
 * Above this estimated saving the Leader stops mid-implement to suggest the cut; below it goes on. On a
 * subscription (`equivalent`) the saving is a list-price equivalent, not money, while every cut costs the PE
 * time: with no threshold set there is no cut for it (phase 16; the harness still compacts a full context).
 */
export function cutMinSavings(config: Pick<Config, 'session' | 'budget'>, basis?: CostBasis): number {
  if (config.session.cut_min_savings !== undefined) return config.session.cut_min_savings;
  if (basis === 'equivalent') return Number.POSITIVE_INFINITY;
  const share = config.budget.per_spec !== undefined ? config.budget.per_spec * BUDGET_SHARE : Number.POSITIVE_INFINITY;
  return Math.min(DEFAULT_MIN_SAVINGS, share);
}

export interface CutEstimateRow {
  at: string;
  task: string;
  boundaryId?: string;
  suggested?: boolean;
  /** The "Turns left" the rule assumed at that boundary. */
  turnsLeft: number;
}

/** The rows of `_log/session-cuts.md`; the header, the separator and malformed rows are skipped. */
export function parseCutEstimates(text: string): CutEstimateRow[] {
  return text.split('\n').flatMap((line) => {
    const cells = line
      .trim()
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    const [at = '', task = '', , , turns = '', , , boundaryId = '', suggested = ''] = cells;
    const turnsLeft = Number(turns);
    if (cells.length < 5 || !task || Number.isNaN(Date.parse(at)) || turns === '' || !Number.isFinite(turnsLeft)) return [];
    return [{ at, task, turnsLeft, ...(boundaryId ? { boundaryId } : {}), ...(suggested === 'true' ? { suggested: true } : {}) }];
  });
}

const CUTS_HEADER =
  '# Session cut estimates (ADR 0038)\n\n| At | Task | Context | Base | Turns left | Savings (USD) | Decision | Boundary ID | Suggested |\n|---|---|---|---|---|---|---|---|---|\n';

/**
 * Every boundary estimate goes to the `cut_estimates` section of `state.yml` (version 2, C-3) or to
 * `_log/session-cuts.md` (version 1), so Kaizen can recalibrate the constants.
 */
export function recordCutEstimate(
  specDir: string,
  row: {
    at: string;
    task: string;
    session: SessionContext;
    tasksLeft: number;
    advice: CutAdvice;
    decision: string;
    boundaryId?: string;
    suggest?: boolean;
  },
): boolean {
  const turns = TURNS_PER_TASK * row.tasksLeft + TURNS_AFTER_TASKS;
  const base = row.session.first + RELOAD_TOKENS;
  if (specKeepsState(specDir)) {
    let suggested = false;
    updateState(specDir, (s) => {
      const alreadySuggested = row.boundaryId !== undefined && s.cut_estimates.some((e) => e.boundary_id === row.boundaryId && e.suggested);
      suggested = Boolean(row.suggest && !alreadySuggested);
      const estimate = {
        at: row.at,
        task: row.task,
        ...(row.boundaryId ? { boundary_id: row.boundaryId } : {}),
        ...(suggested ? { suggested: true } : {}),
        context: row.session.last,
        base,
        turns_left: turns,
        savings: Math.round(row.advice.savings * 100) / 100,
        decision: row.suggest && alreadySuggested ? 'go on: suggestion already shown at boundary' : row.decision,
      };
      return { ...s, cut_estimates: [...s.cut_estimates, estimate] };
    });
    return suggested;
  }
  const file = logPath(specDir, 'session-cuts.md');
  const before = existsSync(file) ? readFileSync(file, 'utf8') : CUTS_HEADER;
  const previous = parseCutEstimates(before);
  const alreadySuggested = row.boundaryId !== undefined && previous.some((e) => e.boundaryId === row.boundaryId && e.suggested);
  const suggested = Boolean(row.suggest && !alreadySuggested);
  const decision = row.suggest && alreadySuggested ? 'go on: suggestion already shown at boundary' : row.decision;
  const cells = [
    row.at,
    row.task,
    row.session.last,
    base,
    turns,
    row.advice.savings.toFixed(2),
    decision,
    row.boundaryId ?? '',
    suggested ? 'true' : '',
  ];
  writeText(file, `${before}| ${cells.join(' | ')} |\n`);
  return suggested;
}
