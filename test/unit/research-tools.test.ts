import { describe, expect, test } from 'vitest';
import { researchToolCapabilities, researchToolFindings } from '../../src/engine/research-tools.js';
import { makeTree } from '../helpers.js';

describe('research tool capability discovery', () => {
  test('reports native capabilities and none separately', () => {
    const result = researchToolCapabilities(makeTree({}), ['copilot', 'opencode', 'claude', 'codex']);
    expect(result.map((item) => [item.harness, item.capability])).toEqual([
      ['copilot', 'native'],
      ['opencode', 'native'],
      ['claude', 'none'],
      ['codex', 'none'],
    ]);
    expect(result.map((item) => item.verifiedSearchAvailable)).toEqual([false, false, false, false]);
  });

  test('detects search-capable MCP servers from supported workspace manifests', () => {
    const root = makeTree({
      '.mcp.json': JSON.stringify({
        mcpServers: { docs: { url: 'https://docs.example/mcp/search' }, jira: { url: 'https://jira.example/mcp' } },
      }),
      '.vscode/mcp.json': JSON.stringify({ servers: { context7: { type: 'http', url: 'https://mcp.context7.com/mcp' } } }),
    });
    const result = researchToolCapabilities(root, ['claude', 'copilot']);
    expect(result[0]).toMatchObject({ capability: 'MCP', mcp: ['.mcp.json:docs', '.vscode/mcp.json:context7'] });
    expect(result[1]?.capability).toBe('native + MCP');
    expect(result.map((item) => item.verifiedSearchAvailable)).toEqual([true, true]);
  });

  test('doctor explains that no search leaves evidence unverified', () => {
    expect(researchToolFindings(makeTree({}), ['claude'])[0]?.fix).toContain('unverified (model knowledge)');
  });
});
