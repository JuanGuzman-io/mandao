import { createHash } from 'node:crypto';
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
 * Hash of what a diagram claims about the spec: node ids with their kind and role, and the edges between
 * those nodes, sorted. Labels, order and formatting are left out, so regenerating or reformatting the
 * graph does not make the diagram stale; adding or removing a module or an edge does (ADR 0027).
 */
export function subgraphHash(graph: DiagramGraph): string {
  const ids = new Set(graph.nodes.map((n) => n.id));
  const canonical = {
    nodes: graph.nodes.map((n) => `${n.id}|${n.kind}|${n.role}`).sort(),
    edges: graph.edges
      .filter((e) => ids.has(e.from) && ids.has(e.to))
      .map(edgeKey)
      .sort(),
  };
  return `sha256:${createHash('sha256').update(JSON.stringify(canonical)).digest('hex').slice(0, 16)}`;
}

/**
 * The implemented graph from the diff: one module node per folder of a changed source file, and an edge
 * for every dependency a changed file has on another module, changed or only used (`dependents`: file →
 * files that depend on it).
 */
export function implementedGraph(
  changed: string[],
  dependents: Map<string, Set<string>> | undefined,
  isTest: (f: string) => boolean,
): DiagramGraph {
  const moduleOf = (f: string) => (f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '.');
  const files = changed.filter((f) => !isTest(f) && /\.[cm]?[jt]sx?$|\.py$|\.go$|\.java$|\.kt$|\.rb$|\.cs$/.test(f));
  const modules = [...new Set(files.map(moduleOf))].sort();
  const changedFiles = new Set(files);
  const edges = new Map<string, { from: string; to: string }>();
  // Every dependency that starts in a changed file, towards changed or merely used modules.
  for (const [target, sources] of dependents ?? []) {
    if (isTest(target)) continue;
    for (const source of sources) {
      if (!changedFiles.has(source)) continue;
      const from = moduleOf(source);
      const to = moduleOf(target);
      if (from !== to) edges.set(edgeKey({ from, to }), { from, to });
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
  /**
   * Whether the code graph knows the dependencies of a module's changed files. An edge from a module it
   * does not know (no graph, or files the graph has not indexed yet) is unverified, never drift.
   */
  edgesKnownFrom: (module: string) => boolean;
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
  const judged = (e: string) => ctx.edgesKnownFrom(e.split(' -> ')[0]!);
  const edges = {
    addedEdges: [...iEdges].filter((e) => !pEdges.has(e)).sort(),
    missingEdges: [...pEdges].filter((e) => !iEdges.has(e) && judged(e)).sort(),
    unverifiedEdges: [...pEdges].filter((e) => !iEdges.has(e) && !judged(e)).sort(),
  };
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
