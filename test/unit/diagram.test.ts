import { describe, expect, test } from 'vitest';
import { designSourceHash, diagramDrift, diagramState, implementedGraph, readStamp, stampDiagram } from '../../src/spec/index.js';

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

describe('diagram drift by identity (ADR 0026)', () => {
  const ctx = { edgesKnown: true, exists: () => true };
  const g = (nodes: { id: string; label?: string; kind?: 'module' | 'contract' }[], edges: [string, string][] = []) => ({
    schema_version: 1 as const,
    nodes: nodes.map((n) => ({ kind: 'module' as const, role: 'changed' as const, ...n })),
    edges: edges.map(([from, to]) => ({ from, to })),
  });

  test('a renamed box is not drift; added or missing modules and edges are', () => {
    const proposed = g(
      [
        { id: 'src/cli', label: 'CLI' },
        { id: 'src/engine', label: 'Engine' },
      ],
      [['src/cli', 'src/engine']],
    );
    const renamed = g(
      [
        { id: 'src/cli', label: 'Command line' },
        { id: 'src/engine', label: 'Engine' },
      ],
      [['src/cli', 'src/engine']],
    );
    expect(diagramDrift(proposed, renamed, ctx)).toMatchObject({
      drift: false,
      relabelled: [{ id: 'src/cli', proposed: 'CLI', implemented: 'Command line' }],
    });
    const built = g([{ id: 'src/cli' }, { id: 'src/writer' }], [['src/cli', 'src/writer']]);
    expect(diagramDrift(proposed, built, ctx)).toMatchObject({
      drift: true,
      addedNodes: ['src/writer'],
      missingNodes: ['src/engine'],
      addedEdges: ['src/cli -> src/writer'],
      missingEdges: ['src/cli -> src/engine'],
    });
  });

  test('contracts are compared only when the implemented graph has contract nodes; otherwise unverified', () => {
    const proposed = g([{ id: 'src/api' }, { id: 'POST /tokens', kind: 'contract' }]);
    expect(diagramDrift(proposed, g([{ id: 'src/api' }]), ctx)).toMatchObject({ drift: false, unverifiedContracts: ['POST /tokens'] });
    expect(diagramDrift(proposed, g([{ id: 'src/api' }, { id: 'POST /token', kind: 'contract' }]), ctx)).toMatchObject({
      drift: true,
      addedNodes: ['POST /token'],
      missingNodes: ['POST /tokens'],
    });
  });

  test('context nodes are only checked to exist; without a code graph edges are unverified', () => {
    const proposed = {
      schema_version: 1 as const,
      nodes: [
        { id: 'src/cli', kind: 'module' as const, role: 'changed' as const },
        { id: 'src/engine', kind: 'module' as const, role: 'context' as const },
      ],
      edges: [{ from: 'src/cli', to: 'src/engine' }],
    };
    const built = g([{ id: 'src/cli' }]);
    expect(diagramDrift(proposed, built, { edgesKnown: false, exists: () => true })).toMatchObject({
      drift: false,
      missingNodes: [],
      unverifiedEdges: ['src/cli -> src/engine'],
    });
    expect(diagramDrift(proposed, built, { edgesKnown: false, exists: () => false })).toMatchObject({
      drift: true,
      missingContext: ['src/engine'],
    });
    expect(diagramDrift(proposed, built, ctx)).toMatchObject({ drift: true, missingEdges: ['src/cli -> src/engine'] });
  });

  test('the implemented graph comes from the changed source files and the code graph', () => {
    const dependents = new Map([
      ['src/engine/sync.ts', new Set(['src/cli/run.ts', 'src/engine/doctor.ts'])],
      // An unchanged module the changed CLI uses: the edge counts, the module is not a changed node.
      ['src/writer/files.ts', new Set(['src/cli/run.ts'])],
    ]);
    const changed = ['src/cli/run.ts', 'src/engine/sync.ts', 'test/unit/x.test.ts', 'README.md'];
    expect(implementedGraph(changed, dependents, (f) => f.startsWith('test/'))).toEqual({
      schema_version: 1,
      nodes: [
        { id: 'src/cli', kind: 'module', role: 'changed' },
        { id: 'src/engine', kind: 'module', role: 'changed' },
      ],
      edges: [
        { from: 'src/cli', to: 'src/engine' },
        { from: 'src/cli', to: 'src/writer' },
      ],
    });
  });
});
