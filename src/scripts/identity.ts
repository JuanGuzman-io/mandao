import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { HarnessId } from '../schemas/index.js';

/** Who did a step, as the script established it, never as the model described itself (ADR 0021). */
export interface Identity {
  harness: string;
  /** `mandao-reviewer`, `mandao-implementer-standard`, `self` (the Leader's own context), or `exec`. */
  agent: string;
  /** Model the harness was told to run; `self` steps cannot be verified and say so. */
  model: string;
  effort?: string;
  source: 'agent-file' | 'process' | 'self';
}

/** Generated agent definitions per harness: the file the harness loads when the Leader delegates. */
const AGENT_FILES: Partial<Record<HarnessId, (name: string) => string>> = {
  claude: (n) => `.claude/agents/${n}.md`,
  copilot: (n) => `.github/agents/${n}.agent.md`,
  codex: (n) => `.codex/agents/${n}.toml`,
  opencode: (n) => `.opencode/agents/${n}.md`,
  antigravity: (n) => `.agents/agents/${n}.md`,
};

const tomlValue = (text: string, key: string) => text.match(new RegExp(`^${key}\\s*=\\s*"([^"]*)"`, 'm'))?.[1];

function readAgentFile(file: string): { model?: string; effort?: string } {
  const text = readFileSync(file, 'utf8');
  if (file.endsWith('.toml')) return { model: tomlValue(text, 'model'), effort: tomlValue(text, 'model_reasoning_effort') };
  const data = matter(text).data as { model?: string; effort?: string };
  return { model: data.model, effort: data.effort };
}

/**
 * `<agent>[@<harness>]` → the model and effort pinned in the agent file that harness loads. Codex names
 * agents in snake_case (`mandao_reviewer`); both spellings resolve to the same file.
 */
export function agentIdentity(root: string, spec: string, defaultHarness: string): Identity {
  const [rawAgent = '', harness = defaultHarness] = spec.split('@');
  const agent = rawAgent.replace(/_/g, '-');
  if (agent === 'self') return { harness, agent, model: 'self', source: 'self' };
  const path = AGENT_FILES[harness as HarnessId]?.(agent);
  if (!path) throw new Error(`No agent files for harness "${harness}"`);
  if (!existsSync(join(root, path))) throw new Error(`${path} does not exist: run \`mandao sync\` or check the agent name`);
  const { model, effort } = readAgentFile(join(root, path));
  return { harness, agent, model: model ?? '(harness default)', ...(effort ? { effort } : {}), source: 'agent-file' };
}

/** The execution-row cell: `model` or `model (effort)`. */
export const identityCell = (id: Identity | undefined) => (id ? (id.effort ? `${id.model} (${id.effort})` : id.model) : '—');

/** Notes for a claim that does not match the invoked identity, and for unverifiable self steps. */
export function identityNotes(role: 'implementer' | 'reviewer', id: Identity | undefined, claimed?: string): string[] {
  if (!id) return [];
  const notes: string[] = [];
  if (id.source === 'self')
    notes.push(role === 'reviewer' ? 'reduced independence (reviewed in the Leader context)' : 'implemented in the Leader context');
  if (claimed && id.source !== 'self' && claimed !== id.model)
    notes.push(`identity mismatch: ${role} claimed ${claimed}, invoked ${id.model}`);
  return notes;
}
