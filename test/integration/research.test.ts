import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { configSchema } from '../../src/schemas/config.js';
import { researchContext } from '../../src/scripts/research.js';
import { makeTree, removeTrees } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const entry = `- id: R1
  topic: "Auth.js sessions"
  topic_type: api
  question: "Which session API is supported?"
  status: resolved
  decision: "Use the supported API."
  rationale: "Official docs match the pinned version."
  checked_on: "2026-10-01"
  expires: "2027-04-01"
  claims:
    - id: C1
      key: "session API"
      kind: api
      value: "v2"
      sources:
        - tier: official
          url: "https://example.invalid/docs"
          checked_on: "2026-10-01"
          value: "v2"
`;

afterEach(removeTrees);

describe('research context before delegation', () => {
  test('applies the configured cap and links only current, resolved matching prior evidence', () => {
    const root = makeTree({
      'specs/MDO-0001-old/story.md': readFileSync(join(fixture, 'story.md'), 'utf8'),
      'specs/MDO-0001-old/research.md': `---\nschema_version: 1\nentries:\n${entry}---\n`,
      'specs/MDO-0002-current/story.md': readFileSync(join(fixture, 'story.md'), 'utf8'),
      'specs/MDO-0002-current/requirements.md': `${readFileSync(join(fixture, 'requirements.md'), 'utf8')}\n[NEEDS RESEARCH: api / Auth.js sessions] Which session API is supported?\n[NEEDS RESEARCH: framework / Next rendering] Which rendering API is supported?\n`,
    });
    const config = configSchema.parse({
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'app', path: '.' }],
      harnesses: ['claude'],
      paths: { specs: 'specs' },
      research: { max_questions: 1 },
    });
    const result = researchContext(root, config, 'MDO-0002');
    expect(result).toMatchObject({ max_questions: 1, needs_priority: true, dispatchable: [], unverified_without_search: true });
    expect(researchContext(root, config, 'MDO-0002', ['Q99'])).toMatchObject({
      needs_priority: true,
      selection_issues: ['unknown research question IDs: Q99'],
      dispatchable: [],
    });
    expect(researchContext(root, config, 'MDO-0002', ['Q1', 'Q2'])).toMatchObject({
      needs_priority: true,
      selection_issues: ['select at most 1 questions per dispatch'],
      dispatchable: [],
    });
    expect(researchContext(root, config, 'MDO-0002', undefined, 'copilot')).toMatchObject({
      harness: 'copilot',
      unverified_without_search: true,
    });
    expect(result.questions[0]?.reusable).toEqual([expect.objectContaining({ source: 'specs/MDO-0001-old/research.md#R1' })]);
    expect(result.questions[1]?.reusable).toEqual([]);
  });

  test('counts only a present MCP server explicitly declared for its harness as web search', () => {
    const root = makeTree({
      '.mcp.json': JSON.stringify({ mcpServers: { web_search: { url: 'https://search.example/mcp' } } }),
      'specs/MDO-0001-current/story.md': readFileSync(join(fixture, 'story.md'), 'utf8'),
      'specs/MDO-0001-current/requirements.md': `${readFileSync(join(fixture, 'requirements.md'), 'utf8')}\n[NEEDS RESEARCH: architecture / Auth] Which boundary is supported?\n`,
    });
    const config = configSchema.parse({
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'app', path: '.' }],
      harnesses: ['claude', 'copilot'],
      paths: { specs: 'specs' },
      research: { web_search_servers: ['claude:.mcp.json:web_search'] },
    });
    expect(researchContext(root, config, 'MDO-0001')).toMatchObject({
      unverified_without_search: false,
      capabilities: [{ harness: 'claude', configuredWebSearchAvailable: true }],
    });
    expect(researchContext(root, config, 'MDO-0001', undefined, 'copilot')).toMatchObject({
      unverified_without_search: true,
      capabilities: [{ harness: 'copilot', configuredWebSearchAvailable: false }],
    });
  });
});
