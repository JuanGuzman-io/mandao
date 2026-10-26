import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { HarnessId } from '../schemas/index.js';
import type { Finding } from './doctor.js';

/**
 * Native web search per harness. `counts`: the PE decided its research counts as web evidence (ADR 0058); the others
 * stay conditional on account policy or provider and are not proof.
 */
const NATIVE_SEARCH: Partial<Record<HarnessId, { source: string; condition: string; counts?: true }>> = {
  claude: {
    source: 'https://code.claude.com/docs/en/tools-reference#websearch-tool-behavior',
    condition: 'built-in WebSearch tool; permission rules may deny it',
    counts: true,
  },
  codex: {
    source: 'https://learn.chatgpt.com/docs/codex/cli',
    condition: 'live web search per run (`codex --search`)',
    counts: true,
  },
  antigravity: {
    source: 'https://antigravity.google/docs/ide/browser',
    condition: 'browser subagent reads documentation sources; Browser Tools can be turned off',
    counts: true,
  },
  copilot: {
    source: 'https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/chat-with-copilot/chat-in-ide',
    condition: 'web search depends on account and organization policy',
  },
  opencode: {
    source: 'https://docs.opencode.ai/docs/tools/',
    condition: 'websearch needs a supported provider or search integration',
  },
};

const MCP_FILES: Partial<Record<HarnessId, string[]>> = {
  claude: ['.mcp.json'],
  copilot: ['.vscode/mcp.json'],
  codex: ['.codex/config.toml'],
  opencode: ['opencode.json', 'opencode.jsonc'],
};

function mcpServers(root: string, file: string): string[] {
  const path = join(root, file);
  if (!existsSync(path)) return [];
  const text = readFileSync(path, 'utf8');
  if (file.endsWith('.toml')) return [...text.matchAll(/^\[mcp_servers\.([^\]]+)\]/gm)].map((match) => match[1]!);
  try {
    const json = text.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const data = JSON.parse(json) as Record<string, unknown>;
    const configured = data.mcpServers ?? data.servers ?? (data.mcp as Record<string, unknown> | undefined)?.servers;
    if (!configured || typeof configured !== 'object') return [];
    return Object.keys(configured as Record<string, unknown>);
  } catch {
    return [];
  }
}

/** Explicit, harness-matched MCP declarations, plus native search the PE counts (ADR 0058); server names are not proof. */
export function researchToolCapabilities(root: string, harnesses: HarnessId[], declaredWebSearchServers: string[] = []) {
  return harnesses.map((harness) => {
    const files = MCP_FILES[harness] ?? [];
    const mcp = files.flatMap((file) => mcpServers(root, file).map((name) => `${file}:${name}`));
    const webSearchMcp = declaredWebSearchServers.filter((reference) => {
      const [declaredHarness, file, ...nameParts] = reference.split(':');
      const name = nameParts.join(':');
      return declaredHarness === harness && files.includes(file!) && Boolean(name) && mcp.includes(`${file}:${name}`);
    });
    return {
      harness,
      native: NATIVE_SEARCH[harness],
      mcp,
      webSearchMcp,
      capability: NATIVE_SEARCH[harness] ? (webSearchMcp.length ? 'native + MCP' : 'native') : webSearchMcp.length ? 'MCP' : 'none',
      configuredWebSearchAvailable: webSearchMcp.length > 0,
      /** A declared search MCP, or native search that counts (ADR 0058): the research gate's source of web evidence. */
      webSearchAvailable: webSearchMcp.length > 0 || Boolean(NATIVE_SEARCH[harness]?.counts),
    };
  });
}

function searchState(item: ReturnType<typeof researchToolCapabilities>[number]): string {
  const native = item.native;
  if (item.configuredWebSearchAvailable) return `declared${native ? `; native: ${native.condition} (${native.source})` : ''}`;
  if (native?.counts) return `native (counts, ADR 0058: ${native.condition}; ${native.source})`;
  return `not declared${native ? `; native support is conditional (${native.condition}; ${native.source})` : ''}`;
}

/** Adds an informational doctor row per configured harness with its source of web research. */
export function researchToolFindings(root: string, harnesses: HarnessId[], declaredWebSearchServers: string[] = []): Finding[] {
  return researchToolCapabilities(root, harnesses, declaredWebSearchServers).map((item) => ({
    level: 'info',
    message: `harness ${item.harness}: web search ${searchState(item)}${item.mcp.length ? `; MCP servers: ${item.mcp.join(', ')}` : ''}`,
    ...(!item.webSearchAvailable
      ? { fix: 'declare a confirmed web-search MCP in research.web_search_servers; conditional native support does not count' }
      : {}),
  }));
}
