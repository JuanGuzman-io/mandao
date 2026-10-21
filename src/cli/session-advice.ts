import { ADAPTERS } from '../adapters/index.js';
import { readRecommendations } from '../models/load.js';
import type { Config, HarnessId } from '../schemas/index.js';
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

export interface SessionAdvice {
  /** The harness's in-place new-conversation action; absent when it has none. */
  action?: string;
  /** The command to run once the new conversation is open. */
  then: string;
  /** The command that opens a session in the worktree. */
  fallback: string;
}

/** The harness's own new-conversation action, then the next command, with the open-session command as the fallback. */
export function sessionAdvice(harness: string, worktree: string, first: string): SessionAdvice {
  const action = ADAPTERS[harness as HarnessId]?.session.newConversation;
  return { ...(action ? { action } : {}), then: first, fallback: openCommand(harness, worktree, first).text };
}

/** The advice to continue the spec in a new session, from its worktree. */
export function newSessionAdvice(harness: string, spec: SpecFolder, command: string): SessionAdvice {
  return sessionAdvice(harness, repoRoot(spec.dir), `/mandao-${command} ${specId(spec)}`);
}

export type StepCut = CutAdvice & { stop: boolean; minSavings: number; advice?: SessionAdvice };

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
  return { ...advice, stop, minSavings, ...(stop ? { advice: newSessionAdvice(harness, spec, 'implement') } : {}) };
}

/** Between implement and verify (a human pause anyway): the rule alone decides, with the command to go on. */
export function verifyCut(spec: SpecFolder, harness: string, now = new Date()) {
  const s = claudeSession(harness);
  if (!s) return undefined;
  const advice = cutAdvice(s.context, 0, s.price, now.getTime());
  recordCut(spec, 'verify', s.context, advice, now);
  if (!advice.cut) return advice;
  const next = newSessionAdvice(harness, spec, 'verify');
  return { ...advice, command: next.fallback, advice: next };
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
