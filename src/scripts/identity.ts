import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseFrontmatter } from '../engine/frontmatter.js';
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
  const data = parseFrontmatter(text).data as { model?: string; effort?: string };
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

/** Model families a claim must name before it counts as one; anything else (agent names, prose) is ignored. */
const MODEL_FAMILY = /^(claude|sonnet|opus|haiku|fable|gpt|o[1-9]|codex|gemini|kimi|qwen|grok|deepseek|glm|llama|mistral|big-pickle)(-|$)/;

/** `anthropic/Claude Sonnet 5.5` and `claude-sonnet-5-5` compare equal: last path segment, lower case, `-`. */
const normalModel = (m: string) =>
  (m.split('/').at(-1) ?? m)
    .toLowerCase()
    .replace(/[\s._]+/g, '-')
    .replace(/^-|-$/g, '');

/** The model ids a free-text claim names (MDO-0005: "mandao-reviewer (identity not stated)" names none). */
export function claimedModels(text: string): string[] {
  const words = text
    .split(/[\s,;()[\]"'`]+/)
    .map(normalModel)
    .filter(Boolean);
  const out: string[] = [];
  words.forEach((w, i) => {
    // A bare vendor name ("Claude") says nothing about which model.
    if (!MODEL_FAMILY.test(w) || w === 'claude') return;
    // "Sonnet 5.5": the version is the next word.
    const next = words[i + 1];
    out.push(next && /^\d+(-\d+)*$/.test(next) ? `${w}-${next}` : w);
  });
  return out;
}

/** A claim matches when one of its ids is part of the invoked id or the other way round (`sonnet` ⊂ `claude-sonnet-5-5`). */
function claimMatches(claimed: string[], model: string): boolean {
  const invoked = normalModel(model);
  return claimed.some((c) => invoked.includes(c) || c.includes(invoked));
}

/**
 * Notes for a claim that names a different model than the one invoked, and for unverifiable self steps.
 * The claim is only ever compared, never recorded as the identity (ADR 0021): free text that names no
 * model is not evidence of anything.
 */
export function identityNotes(role: 'implementer' | 'reviewer', id: Identity | undefined, claimed?: string): string[] {
  if (!id) return [];
  const notes: string[] = [];
  if (id.source === 'self')
    notes.push(role === 'reviewer' ? 'reduced independence (reviewed in the Leader context)' : 'implemented in the Leader context');
  const models = claimed ? claimedModels(claimed) : [];
  const comparable = id.source !== 'self' && id.model !== '(harness default)';
  if (comparable && models.length && !claimMatches(models, id.model))
    notes.push(`identity mismatch: ${role} claimed ${models.join(', ')}, invoked ${id.model}`);
  return notes;
}
