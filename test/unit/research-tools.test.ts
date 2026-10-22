import { describe, expect, test } from 'vitest';
import { researchToolCapabilities, researchToolFindings } from '../../src/engine/research-tools.js';
import { makeTree } from '../helpers.js';

describe('research tool capability discovery', () => {
  test('reports conditional native support without treating it as configured web search', () => {
    const result = researchToolCapabilities(makeTree({}), ['copilot', 'opencode', 'claude', 'codex']);
    expect(result.map((item) => [item.harness, item.capability])).toEqual([
      ['copilot', 'native'],
      ['opencode', 'native'],
      ['claude', 'none'],
      ['codex', 'none'],
    ]);
    expect(result.map((item) => item.configuredWebSearchAvailable)).toEqual([false, false, false, false]);
  });

  test('requires explicit harness-matched web-search declarations for MCP servers', () => {
    const root = makeTree({
      '.mcp.json': JSON.stringify({
        mcpServers: { web_search: { url: 'https://api.search.example/mcp' }, code_search: { command: 'local-search' } },
      }),
      '.vscode/mcp.json': JSON.stringify({ servers: { web_search: { type: 'http', url: 'https://api.search.example/mcp' } } }),
    });
    const discovered = researchToolCapabilities(root, ['claude', 'copilot']);
    expect(discovered.map((item) => item.configuredWebSearchAvailable)).toEqual([false, false]);
    const declared = researchToolCapabilities(
      root,
      ['claude', 'copilot'],
      ['claude:.mcp.json:web_search', 'copilot:.vscode/mcp.json:web_search'],
    );
    expect(declared[0]).toMatchObject({
      capability: 'MCP',
      mcp: ['.mcp.json:web_search', '.mcp.json:code_search'],
      webSearchMcp: ['claude:.mcp.json:web_search'],
    });
    expect(declared[1]).toMatchObject({ configuredWebSearchAvailable: true, webSearchMcp: ['copilot:.vscode/mcp.json:web_search'] });
    expect(researchToolCapabilities(root, ['claude'], ['claude:.mcp.json:missing'])[0]?.configuredWebSearchAvailable).toBe(false);
  });

  test('doctor explains that no search leaves evidence unverified', () => {
    expect(researchToolFindings(makeTree({}), ['claude'])[0]?.fix).toContain('research.web_search_servers');
  });

  test('doctor reports an explicitly declared configured search MCP', () => {
    const root = makeTree({ '.mcp.json': JSON.stringify({ mcpServers: { web_search: { url: 'https://search.example/mcp' } } }) });
    expect(researchToolFindings(root, ['claude'], ['claude:.mcp.json:web_search'])[0]?.message).toContain('web search declared');
  });
});
