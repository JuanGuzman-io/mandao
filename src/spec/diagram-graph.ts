import { z } from 'zod';

/**
 * The structured source of a diagram (ADR 0026): what drift compares. A node's identity is a module path
 * (`src/cli`) or a contract identifier (`POST /api/tokens`, `event:user.created`), never its label, so
 * renaming a box is not drift.
 */
export const diagramGraphSchema = z.object({
  schema_version: z.literal(1),
  nodes: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().optional(),
      kind: z.enum(['module', 'contract', 'external', 'actor']).default('module'),
      /** `changed`: the spec builds or modifies it · `context`: it is only used, so close checks it exists. */
      role: z.enum(['changed', 'context']).default('changed'),
    }),
  ),
  edges: z.array(z.object({ from: z.string().min(1), to: z.string().min(1), label: z.string().optional() })).default([]),
});
export type DiagramGraph = z.infer<typeof diagramGraphSchema>;

const edgeKey = (e: { from: string; to: string }) => `${e.from} -> ${e.to}`;

/**
 * The implemented graph from the diff: one module node per folder of a changed source file, and an edge
 * where one changed module depends on another (`dependents`: file → files that depend on it).
 */
export function implementedGraph(
  changed: string[],
  dependents: Map<string, Set<string>> | undefined,
  isTest: (f: string) => boolean,
): DiagramGraph {
  const moduleOf = (f: string) => (f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '.');
  const files = changed.filter((f) => !isTest(f) && /\.[cm]?[jt]sx?$|\.py$|\.go$|\.java$|\.kt$|\.rb$|\.cs$/.test(f));
  const modules = [...new Set(files.map(moduleOf))].sort();
  const edges = new Map<string, { from: string; to: string }>();
  for (const target of files) {
    for (const source of dependents?.get(target) ?? []) {
      const from = moduleOf(source);
      const to = moduleOf(target);
      if (from !== to && modules.includes(from)) edges.set(edgeKey({ from, to }), { from, to });
    }
  }
  return {
    schema_version: 1,
    nodes: modules.map((id) => ({ id, kind: 'module' as const, role: 'changed' as const })),
    edges: [...edges.values()],
  };
}

export interface DiagramDrift {
  /** Built but not in the approved design. */
  addedNodes: string[];
  /** Approved as changed but not built. */
  missingNodes: string[];
  /** Approved as context (used, not changed) but not found in the repository. */
  missingContext: string[];
  addedEdges: string[];
  missingEdges: string[];
  /** Without a code graph, edges cannot be confirmed either way. */
  unverifiedEdges: string[];
  /** Approved contracts the implemented graph cannot confirm or deny (no contract nodes were derived). */
  unverifiedContracts: string[];
  /** Same identity, different label: reported, never drift. */
  relabelled: { id: string; proposed: string; implemented: string }[];
  drift: boolean;
}

export interface DriftContext {
  /** False when no code graph was available to derive edges. */
  edgesKnown: boolean;
  /** Whether a context node exists (a module path in the repository). */
  exists: (id: string) => boolean;
}

type Node = DiagramGraph['nodes'][number];

/** Drift between the approved diagram and what was built, by identity (ADR 0026). */
export function diagramDrift(proposed: DiagramGraph, implemented: DiagramGraph, ctx: DriftContext): DiagramDrift {
  const knowsContracts = implemented.nodes.some((n) => n.kind === 'contract');
  const comparable = (n: Node) => n.kind === 'module' || (n.kind === 'contract' && knowsContracts);
  const context = proposed.nodes.filter((n) => n.role === 'context');
  const pIds = new Set(proposed.nodes.filter((n) => n.role === 'changed' && comparable(n)).map((n) => n.id));
  const iIds = new Set(implemented.nodes.filter(comparable).map((n) => n.id));
  const known = new Set([...pIds, ...context.map((n) => n.id)]);
  const pEdges = new Set(proposed.edges.filter((e) => known.has(e.from) && known.has(e.to)).map(edgeKey));
  const iEdges = new Set(implemented.edges.map(edgeKey));
  const edges = ctx.edgesKnown
    ? {
        addedEdges: [...iEdges].filter((e) => !pEdges.has(e)).sort(),
        missingEdges: [...pEdges].filter((e) => !iEdges.has(e)).sort(),
        unverifiedEdges: [],
      }
    : { addedEdges: [], missingEdges: [], unverifiedEdges: [...pEdges].sort() };
  const out = {
    addedNodes: [...iIds].filter((id) => !known.has(id)).sort(),
    missingNodes: [...pIds].filter((id) => !iIds.has(id)).sort(),
    missingContext: context.filter((n) => n.kind === 'module' && !ctx.exists(n.id)).map((n) => n.id),
    ...edges,
    unverifiedContracts: knowsContracts ? [] : proposed.nodes.filter((n) => n.kind === 'contract').map((n) => n.id),
    relabelled: proposed.nodes.flatMap((p) => {
      const i = implemented.nodes.find((n) => n.id === p.id);
      return i?.label && p.label && i.label !== p.label ? [{ id: p.id, proposed: p.label, implemented: i.label }] : [];
    }),
  };
  const drift =
    out.addedNodes.length + out.missingNodes.length + out.missingContext.length + out.addedEdges.length + out.missingEdges.length > 0;
  return { ...out, drift };
}
