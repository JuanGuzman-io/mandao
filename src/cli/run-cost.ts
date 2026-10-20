import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { readRecommendations } from '../models/load.js';
import { claudeCostBasis, claudeSessionCost, findClaudeTranscript } from '../scripts/session-cost.js';
import { findSpec } from '../scripts/spec.js';
import { logPath } from '../scripts/spec-log.js';
import { type CostEntry, parseCosts, renderCosts, sessionDelta, summarizeCosts } from '../spec/index.js';
import { writeText } from '../writer/files.js';
import type { CliContext } from './context.js';
import { json } from './json.js';

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

/** The main session's role: the Leader in implement, the command itself elsewhere. */
const mainRole = (command: string) => (command === 'implement' ? 'leader' : command);

/** `quick` has no spec: its costs go to `<specs>/quick/_log/costs.yml`. */
function costsDir(ctx: CliContext, ref: string): string {
  const config = readConfig(ctx.root());
  return ref === 'quick' ? join(ctx.root(), config.paths.specs, 'quick') : findSpec(ctx.root(), config, ref);
}

const MODEL_KEY = 'model:';
const MAIN = 'main-session';

/** What a Claude Code session spent since its previous record, from its transcript and the official prices. */
function claudeEntry(entries: CostEntry[], o: CostOptions & { command: string }): CostEntry {
  const session = o.session ?? process.env.CLAUDE_CODE_SESSION_ID;
  if (!session) throw new Error('no session: run inside Claude Code or pass --session <id>');
  const transcript = findClaudeTranscript(session);
  if (!transcript) throw new Error(`no Claude Code transcript for session ${session}`);
  const prices = readRecommendations().harnesses.claude?.prices?.per_mtok ?? {};
  // The main session accumulates under one key whatever command runs in it, so a second command in the
  // same session counts only its own part; the delta takes this command's role.
  const cost = claudeSessionCost(transcript, MAIN, prices);
  const now = { ...cost.roles, ...Object.fromEntries(Object.entries(cost.models).map(([m, usd]) => [`${MODEL_KEY}${m}`, usd])) };
  const delta = sessionDelta(entries, session, now);
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
    cumulative: now,
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
      let recorded: CostEntry | undefined;
      if (o.record) {
        if (!o.command) throw new Error('--record needs --command <mandao>');
        recorded = o.usd
          ? {
              at: new Date().toISOString(),
              command: o.command,
              harness: o.harness,
              usd: Number(o.usd),
              roles: { [o.role ?? mainRole(o.command)]: Number(o.usd) },
              models: {},
              source: 'manual',
              basis: manualBasis(o.basis),
            }
          : claudeEntry(entries, { ...o, command: o.command });
        writeText(file, renderCosts([...entries, recorded]));
      }
      const all = recorded ? [...entries, recorded] : entries;
      json({
        ...(recorded ? { recorded: { command: recorded.command, usd: recorded.usd, roles: recorded.roles } } : {}),
        ...summarizeCosts(all, config.budget.per_spec),
        basis: specBasis(all),
      });
    });
}
