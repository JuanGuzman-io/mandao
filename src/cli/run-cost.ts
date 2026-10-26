import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { readRecommendations } from '../models/load.js';
import { claudeCostBasis, claudeSessionCost, findClaudeTranscript } from '../scripts/session-cost.js';
import { logPath, readApprovalLog, specKeepsState } from '../scripts/spec-log.js';
import { type CostEntry, parseCosts, renderCosts, sessionDelta, sessionModelTotals, specBudget, summarizeCosts } from '../spec/index.js';
import { writeText } from '../writer/files.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { logDirFor } from './log-dir.js';

interface CostOptions {
  record?: boolean;
  command?: string;
  harness: string;
  session?: string;
  role?: string;
  usd?: string;
  basis?: string;
}

const BASES = ['billed', 'equivalent', 'unknown'] as const;

function manualBasis(basis: string | undefined): CostEntry['basis'] {
  if (!basis) return 'unknown';
  if (!(BASES as readonly string[]).includes(basis)) throw new Error(`--basis must be one of ${BASES.join(', ')}`);
  return basis as CostEntry['basis'];
}

/** One basis for the spec's total, or `mixed`: billed money and subscription equivalents never add up as one. */
function specBasis(entries: CostEntry[]): string {
  const seen = [...new Set(entries.map((e) => e.basis ?? 'unknown'))];
  return seen.length === 1 ? seen[0]! : seen.length ? 'mixed' : 'unknown';
}

/** `--record`: the session's spend since its last record (Claude Code) or the amount given by hand. */
function newEntry(entries: CostEntry[], o: CostOptions, rolesOnly: boolean): CostEntry {
  if (!o.command) throw new Error('--record needs --command <mandao>');
  if (!o.usd) return claudeEntry(entries, { ...o, command: o.command }, rolesOnly);
  return {
    at: new Date().toISOString(),
    command: o.command,
    harness: o.harness,
    usd: Number(o.usd),
    roles: { [o.role ?? mainRole(o.command)]: Number(o.usd) },
    models: {},
    source: 'manual',
    basis: manualBasis(o.basis),
  };
}

/** The main session's role: the Leader in implement, the command itself elsewhere. */
const mainRole = (command: string) => (command === 'implement' ? 'leader' : command);

/** `quick` and `workspace` have no spec: see `logDirFor`. */
const costsDir = (ctx: CliContext, ref: string) => logDirFor(ctx.root(), readConfig(ctx.root()), ref);

/** Every costs.yml under the specs folder (quick included): a session's baseline is whatever any of them recorded. */
function allEntries(ctx: CliContext): CostEntry[] {
  const specs = join(ctx.root(), readConfig(ctx.root()).paths.specs);
  if (!existsSync(specs)) return [];
  return readdirSync(specs)
    .map((d) => logPath(join(specs, d), 'costs.yml'))
    .filter((f) => existsSync(f))
    .flatMap((f) => parseCosts(readFileSync(f, 'utf8')))
    .sort((a, b) => a.at.localeCompare(b.at));
}

const MODEL_KEY = 'model:';
const MAIN = 'main-session';

/**
 * The session's per-model spend already recorded: the `model:` lines of its last `cumulative` when that record
 * is version 1 (the numbers version 1 always used), else the sum of its earlier `models`, so a version 2 record
 * (no `model:` lines) followed by a version 1 or quick record does not count the whole session again.
 */
function modelBaseline(entries: CostEntry[], session: string): Record<string, number> {
  const last = [...entries].reverse().find((e) => e.session === session && e.cumulative)?.cumulative ?? {};
  const kept = Object.entries(last).filter(([k]) => k.startsWith(MODEL_KEY));
  return kept.length ? Object.fromEntries(kept.map(([k, v]) => [k.slice(MODEL_KEY.length), v])) : sessionModelTotals(entries, session);
}

/** Per-model spend since the session's earlier records (keys `model:<id>`). */
function modelDelta(entries: CostEntry[], session: string, now: Record<string, number>): Record<string, number> {
  const before = modelBaseline(entries, session);
  const out: Record<string, number> = {};
  for (const [key, usd] of Object.entries(now)) {
    const d = usd - (before[key.slice(MODEL_KEY.length)] ?? 0);
    if (d > 0.000001) out[key] = d;
  }
  return out;
}

/**
 * What a Claude Code session spent since its previous record, from its transcript and the official prices.
 * `rolesOnly` (version 2, C-2): `cumulative` keeps one running total per role; version 1 also keeps the
 * `model:` lines in it. The per-model part comes from `modelDelta` on both versions.
 */
function claudeEntry(entries: CostEntry[], o: CostOptions & { command: string }, rolesOnly: boolean): CostEntry {
  const session = o.session ?? process.env.CLAUDE_CODE_SESSION_ID;
  if (!session) throw new Error('no session: run inside Claude Code or pass --session <id>');
  const transcript = findClaudeTranscript(session);
  if (!transcript) throw new Error(`no Claude Code transcript for session ${session}`);
  const prices = readRecommendations().harnesses.claude?.prices?.per_mtok ?? {};
  // The main session accumulates under one key whatever command runs in it, so a second command in the
  // same session counts only its own part; the delta takes this command's role.
  const cost = claudeSessionCost(transcript, MAIN, prices);
  const models = Object.fromEntries(Object.entries(cost.models).map(([m, usd]) => [`${MODEL_KEY}${m}`, usd]));
  const now = { ...cost.roles, ...models };
  const delta = { ...sessionDelta(entries, session, cost.roles), ...modelDelta(entries, session, models) };
  const pick = (model: boolean) =>
    Object.fromEntries(
      Object.entries(delta)
        .filter(([k]) => k.startsWith(MODEL_KEY) === model)
        .map(([k, v]) => [model ? k.slice(MODEL_KEY.length) : k, Math.round(v * 1e4) / 1e4]),
    );
  const { [MAIN]: main, ...subagents } = pick(false);
  const roles = { ...(main ? { [o.role ?? mainRole(o.command)]: main } : {}), ...subagents };
  return {
    at: new Date().toISOString(),
    command: o.command,
    harness: 'claude',
    session,
    usd: Math.round(Object.values(roles).reduce((a, b) => a + b, 0) * 1e4) / 1e4,
    roles,
    models: pick(true),
    cumulative: rolesOnly ? cost.roles : now,
    source: 'claude-code',
    basis: claudeCostBasis(),
  };
}

/**
 * `mandao run cost <spec>`: what the spec has spent per command and role, against `budget.per_spec`.
 * `--record --command <c>` adds what this session spent since its last record (Claude Code reads its
 * own transcript; other harnesses pass `--usd`). Commands run it at the start (budget) and at the end.
 */
export function registerCost(run: Command, ctx: CliContext) {
  run
    .command('cost <spec>')
    .description('Spend per command and role against budget.per_spec; --record adds this session (Claude Code) or --usd')
    .option('--record', 'record what this session spent since its last record')
    .option('--command <command>', 'the mandao the spend belongs to (with --record)')
    .option('--harness <id>', 'harness of the session', 'claude')
    .option('--session <id>', 'Claude Code session id (default: $CLAUDE_CODE_SESSION_ID)')
    .option('--role <role>', 'role of the main session (default: leader for implement, else the command)')
    .option('--usd <amount>', 'record this amount by hand (harnesses without a readable transcript)')
    .option('--basis <basis>', 'with --usd: billed (charged) | equivalent (subscription at list prices) | unknown', 'unknown')
    .action((ref: string, o: CostOptions) => {
      const config = readConfig(ctx.root());
      const file = logPath(costsDir(ctx, ref), 'costs.yml');
      const entries = parseCosts(existsSync(file) ? readFileSync(file, 'utf8') : undefined);
      const recorded = o.record ? newEntry(allEntries(ctx), o, specKeepsState(costsDir(ctx, ref))) : undefined;
      if (recorded) writeText(file, renderCosts([...entries, recorded]));
      const all = recorded ? [...entries, recorded] : entries;
      json({
        ...(recorded ? { recorded: { command: recorded.command, usd: recorded.usd, roles: recorded.roles } } : {}),
        ...summarizeCosts(
          all,
          ref === 'quick' ? config.budget.per_spec : specBudget(readApprovalLog(costsDir(ctx, ref)), config.budget.per_spec),
        ),
        basis: specBasis(all),
      });
    });
}
