import { readRecommendations } from '../models/load.js';
import type { Config } from '../schemas/index.js';
import { repoRoot } from '../scripts/commits.js';
import { findClaudeTranscript } from '../scripts/session-cost.js';
import {
  type CutAdvice,
  cutAdvice,
  cutMinSavings,
  recordCutEstimate,
  type SessionContext,
  sessionContext,
} from '../scripts/session-cut.js';
import type { SpecFolder } from '../scripts/spec.js';
import { openCommand } from './start.js';

/** This Claude Code session's context and its model's prices; other harnesses expose neither (ADR 0038). */
function claudeSession(harness: string) {
  const session = process.env.CLAUDE_CODE_SESSION_ID;
  if (harness !== 'claude' || !session) return undefined;
  const transcript = findClaudeTranscript(session);
  const context = transcript ? sessionContext(transcript) : undefined;
  const price = context && readRecommendations().harnesses.claude?.prices?.per_mtok?.[context.model];
  return context && price ? { context, price } : undefined;
}

const tasksLeft = (spec: SpecFolder) => spec.tasks.filter((t) => !t.done).length;
const specId = (spec: SpecFolder) => spec.story?.meta.id ?? spec.name;

/** The command that continues the spec in a new session, from its worktree. */
export function newSessionCommand(config: Config, spec: SpecFolder, command: string): string {
  return openCommand(config.harnesses[0] ?? 'claude', repoRoot(spec.dir), `/mandao-${command} ${specId(spec)}`).text;
}

export type StepCut = CutAdvice & { stop: boolean; minSavings: number };

/**
 * At a task boundary inside implement (no row past STARTED): stop to suggest a cut only when it saves at
 * least `session.cut_min_savings`; every estimate goes to `_log/session-cuts.md` for Kaizen.
 */
export function stepCut(config: Config, spec: SpecFolder, id: string, harness: string, now = new Date()): StepCut | undefined {
  if (spec.execution.some((r) => r.task === id && r.verdict !== 'STARTED')) return undefined;
  const s = claudeSession(harness);
  if (!s) return undefined;
  const left = tasksLeft(spec);
  const advice = cutAdvice(s.context, left, s.price, now.getTime());
  const minSavings = cutMinSavings(config);
  const stop = advice.cut && advice.savings >= minSavings;
  const decision = stop ? 'stop: suggest a new session' : advice.cut ? `go on: below ${minSavings}` : 'stay';
  recordCutEstimate(spec.dir, { at: now.toISOString(), task: id, session: s.context, tasksLeft: left, advice, decision });
  return { ...advice, stop, minSavings };
}

/** Between implement and verify (a human pause anyway): the rule alone decides, with the command to go on. */
export function verifyCut(config: Config, spec: SpecFolder, harness: string, now = new Date()) {
  const s = claudeSession(harness);
  if (!s) return undefined;
  const advice = cutAdvice(s.context, 0, s.price, now.getTime());
  recordCut(spec, 'verify', s.context, advice, now);
  return { ...advice, ...(advice.cut ? { command: newSessionCommand(config, spec, 'verify') } : {}) };
}

function recordCut(spec: SpecFolder, task: string, session: SessionContext, advice: CutAdvice, now: Date) {
  recordCutEstimate(spec.dir, {
    at: now.toISOString(),
    task,
    session,
    tasksLeft: 0,
    advice,
    decision: advice.cut ? 'new session' : 'stay',
  });
}
