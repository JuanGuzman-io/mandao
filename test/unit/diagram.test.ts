import { describe, expect, test } from 'vitest';
import { designSourceHash, diagramState, readStamp, stampDiagram } from '../../src/spec/index.js';

const design = (depth: string, projects: string[], body = '## Decisions\n\nUse a refresh token.\n') =>
  `---\nschema_version: 1\nspec: MDO-0001-x\ndepth: ${depth}\nprojects: [${projects.join(', ')}]\n---\n\n# Design — x\n\n${body}`;

describe('approval diagram (ADR 0022)', () => {
  test('required by depth and projects; lite makes it optional', () => {
    expect(diagramState(design('lite', ['api', 'web'])).required).toBe('optional');
    expect(diagramState(design('standard', ['api', 'web'])).required).toBe('yes');
    expect(diagramState(design('full', ['api'])).required).toBe('if-new-flow');
    expect(diagramState(design('standard', ['api']))).toEqual({ required: 'if-new-flow', stale: false });
  });

  test('stamping records the design it came from without invalidating itself', () => {
    const before = design('standard', ['api', 'web']);
    const stamped = stampDiagram(before, { type: 'sequence', tool: 'archify', file: 'diagrams/proposed.html' });
    expect(readStamp(stamped)).toEqual({
      type: 'sequence',
      tool: 'archify',
      file: 'diagrams/proposed.html',
      source: designSourceHash(before),
    });
    expect(diagramState(stamped)).toMatchObject({ required: 'yes', stale: false });
    expect(stamped).toContain('![sequence diagram](diagrams/proposed.html)');
    // Stamping twice replaces the section instead of adding another.
    expect(
      stampDiagram(stamped, { type: 'sequence', tool: 'archify', file: 'diagrams/proposed.html' }).match(/^## Diagram/gm),
    ).toHaveLength(1);
  });

  test('a change to design.md makes the diagram stale; Mermaid is the fallback', () => {
    const stamped = stampDiagram(
      design('standard', ['api']),
      { type: 'workflow', tool: 'mermaid', file: 'inline' },
      'flowchart LR\n  A --> B',
    );
    expect(stamped).toContain('```mermaid\nflowchart LR\n  A --> B\n```');
    const edited = stamped.replace('Use a refresh token.', 'Use a session cookie.');
    expect(diagramState(edited).stale).toBe(true);
    expect(diagramState(stamped.replace('## Diagram\n', '## Diagram\n\n')).stale).toBe(false);
  });
});
