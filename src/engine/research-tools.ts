import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { HarnessId } from '../schemas/index.js';
import type { Finding } from './doctor.js';

const NATIVE_SEARCH: Partial<Record<HarnessId, { source: string; condition: string }>> = {
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

/** Uses only explicit, harness-matched declarations; server names and possible native support are not proof. */
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
    };
  });
}

/** Adds an informational doctor row per configured harness with its source of web research. */
export function researchToolFindings(root: string, harnesses: HarnessId[], declaredWebSearchServers: string[] = []): Finding[] {
  return researchToolCapabilities(root, harnesses, declaredWebSearchServers).map((item) => ({
    level: 'info',
    message: `harness ${item.harness}: web search ${item.configuredWebSearchAvailable ? 'declared' : 'not declared'}${item.native ? `; native support is conditional (${item.native.condition}; ${item.native.source})` : ''}${item.mcp.length ? `; MCP servers: ${item.mcp.join(', ')}` : ''}`,
    ...(!item.configuredWebSearchAvailable
      ? { fix: 'declare a confirmed web-search MCP in research.web_search_servers; possible native support does not count' }
      : {}),
  }));
}
