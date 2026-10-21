import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { repoRoot, taskCommits } from '../scripts/commits.js';
import { graphFile, isTestFile, readGraph } from '../scripts/impact.js';
import { findSpec, readLayout, readSpec } from '../scripts/spec.js';
import { docPath } from '../scripts/spec-log.js';
import type { DiagramGraph } from '../spec/index.js';
import {
  DIAGRAM_TOOLS,
  DIAGRAM_TYPES,
  type DiagramTool,
  type DiagramType,
  diagramDrift,
  diagramGraphSchema,
  diagramState,
  implementedGraph,
  readStamp,
  stampDiagram,
  subgraphHash,
} from '../spec/index.js';
import { writeText } from '../writer/files.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { specChangedFiles } from './run-verify.js';

interface DiagramOptions {
  stamp?: boolean;
  graph?: string;
  type?: string;
  tool?: string;
  file?: string;
  mermaid?: string;
}

function checked<T extends string>(value: string | undefined, allowed: readonly T[], name: string): T {
  if (!value || !(allowed as readonly string[]).includes(value)) throw new Error(`--${name} must be one of ${allowed.join(', ')}`);
  return value as T;
}

/**
 * The implemented graph: derived from the spec's commits and the code graph, keeping any contract nodes
 * the agent added to diagrams/implemented.graph.json with evidence.
 */
function implemented(root: string, dir: string, changed: string[]): DiagramGraph {
  const derived = implementedGraph(changed, readGraph(graphFile(root))?.dependents, isTestFile);
  const file = join(dir, 'diagrams', 'implemented.graph.json');
  if (!existsSync(file)) return derived;
  const prior = diagramGraphSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
  const contracts = prior.nodes.filter((n) => n.kind !== 'module');
  const ids = new Set(contracts.map((n) => n.id));
  return {
    ...derived,
    nodes: [...derived.nodes, ...contracts],
    edges: [...derived.edges, ...prior.edges.filter((e) => ids.has(e.from) || ids.has(e.to))],
  };
}

/**
 * Modules whose changed files all appear in the code graph as depending on something: only then can a
 * missing edge from them be drift. No graph, or a partial one, leaves their edges unverified.
 */
function indexedModules(root: string, changed: string[]): (module: string) => boolean {
  const graph = readGraph(graphFile(root));
  if (!graph) return () => false;
  const sources = new Set([...graph.dependents.values()].flatMap((s) => [...s]));
  const moduleOf = (f: string) => (f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '.');
  return (module) => {
    const files = changed.filter((f) => moduleOf(f) === module && !isTestFile(f));
    return files.length > 0 && files.every((f) => sources.has(f));
  };
}

/** The subgraph hash of the graph the stamp points to, as the file is now. */
function currentGraphHash(dir: string, design: string): string | undefined {
  const graph = readStamp(design)?.graph;
  if (!graph || !existsSync(join(dir, graph))) return undefined;
  return subgraphHash(diagramGraphSchema.parse(JSON.parse(readFileSync(join(dir, graph), 'utf8'))));
}

/** design.md with the diagram just generated stamped in, after checking the options. */
function stamped(dir: string, design: string, o: DiagramOptions): string {
  const tool = checked<DiagramTool>(o.tool, DIAGRAM_TOOLS, 'tool');
  const type = checked<DiagramType>(o.type, DIAGRAM_TYPES, 'type');
  const graph = o.graph
    ? { graph: o.graph, graphHash: subgraphHash(diagramGraphSchema.parse(JSON.parse(readFileSync(join(dir, o.graph), 'utf8')))) }
    : {};
  if (tool === 'mermaid') {
    if (!o.mermaid) throw new Error('--tool mermaid needs --mermaid <file>');
    return stampDiagram(design, { type, tool, file: 'inline', ...graph }, readFileSync(o.mermaid, 'utf8'));
  }
  if (!o.file || !existsSync(join(dir, o.file))) throw new Error('--tool archify needs --file, an existing file in the spec folder');
  return stampDiagram(design, { type, tool, file: o.file, ...graph });
}

function registerDrift(run: Command, ctx: CliContext) {
  run
    .command('diagram-drift <spec>')
    .description('Compare the approved diagram graph with the one derived from the spec commits (close, ADR 0026)')
    .action((ref: string) => {
      const config = readConfig(ctx.root());
      const spec = readSpec(findSpec(ctx.root(), config, ref));
      if (!spec.story) throw new Error(`${spec.name} needs story.md`);
      // A lite spec has no diagram to compare: report it and stamp nothing (ADR 0026, D7).
      if (readLayout(spec.dir).depth === 'lite') {
        json({ applicable: false, reason: 'lite specs have no diagram' });
        return;
      }
      const stamp = readStamp(readFileSync(docPath(spec.dir, 'design'), 'utf8'));
      if (!stamp?.graph) throw new Error('design.md has no diagram with a structured graph: stamp it with --graph in specify');
      const proposed = diagramGraphSchema.parse(JSON.parse(readFileSync(join(spec.dir, stamp.graph), 'utf8')));
      const repo = repoRoot(spec.dir);
      const changed = specChangedFiles(repo, [...taskCommits(repo, spec.story.meta.id, config.commits.trailers).values()].flat());
      const built = implemented(ctx.root(), spec.dir, changed);
      writeText(join(spec.dir, 'diagrams', 'implemented.graph.json'), `${JSON.stringify(built, null, 2)}\n`);
      const edgesKnownFrom = indexedModules(ctx.root(), changed);
      const drift = diagramDrift(proposed, built, { edgesKnownFrom, exists: (id) => existsSync(join(repo, id)) });
      json({ ...drift, implemented: 'diagrams/implemented.graph.json' });
    });
}

/**
 * `mandao run diagram <spec>`: whether the approval diagram is required and still matches design.md;
 * with `--stamp`, records the diagram just generated from the current design (ADR 0022).
 */
export function registerDiagram(run: Command, ctx: CliContext) {
  registerDrift(run, ctx);
  run
    .command('diagram <spec>')
    .description('Approval diagram of design.md: required?, present, stale; --stamp records a new one')
    .option('--stamp', 'record the diagram generated from the current design.md')
    .option('--type <type>', DIAGRAM_TYPES.join(' | '))
    .option('--tool <tool>', DIAGRAM_TOOLS.join(' | '))
    .option('--file <path>', 'rendered diagram, relative to the spec folder (Archify)')
    .option('--mermaid <file>', 'Mermaid source to embed in design.md (fallback without Archify)')
    .option(
      '--graph <file>',
      'structured source, relative to the spec folder (diagrams/proposed.graph.json): ids are module paths or contract ids',
    )
    .action((ref: string, o: DiagramOptions) => {
      const dir = findSpec(ctx.root(), readConfig(ctx.root()), ref);
      const file = docPath(dir, 'design');
      if (!existsSync(file)) throw new Error(`${file} does not exist: specify writes it first`);
      let design = readFileSync(file, 'utf8');
      if (o.stamp) {
        design = stamped(dir, design, o);
        writeText(file, design);
      }
      json(diagramState(design, currentGraphHash(dir, design)));
    });
}
