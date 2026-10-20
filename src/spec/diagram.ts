import { createHash } from 'node:crypto';
import matter from 'gray-matter';

/** Diagram types by kind of change (design §18.3). */
export const DIAGRAM_TYPES = ['sequence', 'data-flow', 'architecture', 'workflow', 'lifecycle', 'before-after'] as const;
export type DiagramType = (typeof DIAGRAM_TYPES)[number];
export const DIAGRAM_TOOLS = ['archify', 'mermaid'] as const;
export type DiagramTool = (typeof DIAGRAM_TOOLS)[number];

export interface DiagramStamp {
  type: DiagramType;
  tool: DiagramTool;
  /** Rendered file next to the spec (Archify), or `inline` for a Mermaid block in the section. */
  file: string;
  /** Hash of design.md without its `## Diagram` section, when the diagram was generated. */
  source: string;
}

const SECTION = /^## Diagram[ \t]*\n[\s\S]*?(?=^## |(?![\s\S]))/m;
const MARKER = /<!-- mandao:diagram ([^>]*?) -->/;

/** The design the diagram is derived from: design.md minus the diagram section, whitespace-normalized. */
export function designSourceHash(designMd: string): string {
  const text = designMd.replace(SECTION, '').replace(/\s+$/gm, '').trim();
  return `sha256:${createHash('sha256').update(text).digest('hex').slice(0, 16)}`;
}

export function readStamp(designMd: string): DiagramStamp | undefined {
  const attrs = designMd.match(SECTION)?.[0].match(MARKER)?.[1];
  if (!attrs) return undefined;
  const map = Object.fromEntries([...attrs.matchAll(/(\w+)=(\S+)/g)].map((m) => [m[1], m[2]]));
  return map.type && map.tool && map.file && map.source ? (map as unknown as DiagramStamp) : undefined;
}

export interface DiagramState {
  /** `yes`: standard/full depth across projects · `if-new-flow`: standard/full in one project · `optional`: lite. */
  required: 'yes' | 'if-new-flow' | 'optional';
  stamp?: DiagramStamp;
  /** design.md changed after the diagram was generated: regenerate it before approval. */
  stale: boolean;
}

/** Whether the spec needs the approval diagram, and whether the one it has still matches design.md (ADR 0022). */
export function diagramState(designMd: string): DiagramState {
  const meta = matter(designMd).data as { depth?: string; projects?: string[] };
  const required = meta.depth === 'lite' ? 'optional' : (meta.projects?.length ?? 0) > 1 ? 'yes' : 'if-new-flow';
  const stamp = readStamp(designMd);
  return { required, ...(stamp ? { stamp } : {}), stale: Boolean(stamp && stamp.source !== designSourceHash(designMd)) };
}

/** design.md with its `## Diagram` section stamped for the current design (added at the end when missing). */
export function stampDiagram(designMd: string, d: Omit<DiagramStamp, 'source'>, mermaid?: string): string {
  const marker = `<!-- mandao:diagram type=${d.type} tool=${d.tool} file=${d.file} source=${designSourceHash(designMd)} -->`;
  const body = mermaid ? `\`\`\`mermaid\n${mermaid.trim()}\n\`\`\`` : `![${d.type} diagram](${d.file})`;
  const section = `## Diagram\n\n${marker}\nDerived from this design; regenerated whenever it changes. Part of the design approval.\n\n${body}\n\n`;
  return SECTION.test(designMd) ? designMd.replace(SECTION, section) : `${designMd.trimEnd()}\n\n${section.trimEnd()}\n`;
}
