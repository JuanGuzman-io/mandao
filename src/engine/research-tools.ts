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

const MCP_FILES = ['.mcp.json', '.vscode/mcp.json', '.codex/config.toml', 'opencode.json', 'opencode.jsonc'];
const SEARCH_SERVER = /\b(?:web[-_ ]?search|search|exa|tavily|firecrawl|brave|serp|context7)\b/i;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

function mcpCandidates(root: string, file: string): string[] {
  const path = join(root, file);
  if (!existsSync(path)) return [];
  const text = readFileSync(path, 'utf8');
  if (file.endsWith('.toml'))
    return [...text.matchAll(/^\[mcp_servers\.([^\]]+)\]([\s\S]*?)(?=^\[|$)/gm)]
      .map((match) => `${match[1]} ${match[2]}`)
      .filter((row) => SEARCH_SERVER.test(row));
  try {
    const json = text.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const data = JSON.parse(json) as Record<string, unknown>;
    const configured = data.mcpServers ?? data.servers ?? (data.mcp as Record<string, unknown> | undefined)?.servers;
    if (!configured || typeof configured !== 'object') return [];
    return Object.entries(configured as Record<string, unknown>)
      .filter(([name, value]) => SEARCH_SERVER.test(`${name} ${strings(value).join(' ')}`))
      .map(([name]) => `${file}:${name}`);
  } catch {
    return [];
  }
}

/** Reports configured MCP search servers separately from conditional native capability. */
export function researchToolCapabilities(root: string, harnesses: HarnessId[]) {
  const mcp = [...new Set(MCP_FILES.flatMap((file) => mcpCandidates(root, file)))];
  return harnesses.map((harness) => ({
    harness,
    native: NATIVE_SEARCH[harness],
    mcp,
    capability: NATIVE_SEARCH[harness] ? (mcp.length ? 'native + MCP' : 'native') : mcp.length ? 'MCP' : 'none',
    verifiedSearchAvailable: mcp.length > 0,
  }));
}

/** Adds an informational doctor row per configured harness with its source of web research. */
export function researchToolFindings(root: string, harnesses: HarnessId[]): Finding[] {
  return researchToolCapabilities(root, harnesses).map((item) => ({
    level: 'info',
    message: `harness ${item.harness}: web research ${item.capability}${item.native ? ` (${item.native.condition}; ${item.native.source})` : ''}${item.mcp.length ? ` (${item.mcp.join(', ')})` : ''}`,
    ...(item.capability === 'none'
      ? { fix: 'research claims remain unverified (model knowledge); high-impact decisions require sourced evidence' }
      : {}),
  }));
}
