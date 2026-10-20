import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { findSpec } from '../scripts/spec.js';
import { DIAGRAM_TOOLS, DIAGRAM_TYPES, type DiagramTool, type DiagramType, diagramState, stampDiagram } from '../spec/index.js';
import { writeText } from '../writer/files.js';
import type { CliContext } from './context.js';

const json = (value: unknown) => console.log(JSON.stringify(value, null, 2));

interface DiagramOptions {
  stamp?: boolean;
  type?: string;
  tool?: string;
  file?: string;
  mermaid?: string;
}

function checked<T extends string>(value: string | undefined, allowed: readonly T[], name: string): T {
  if (!value || !(allowed as readonly string[]).includes(value)) throw new Error(`--${name} must be one of ${allowed.join(', ')}`);
  return value as T;
}

/** design.md with the diagram just generated stamped in, after checking the options. */
function stamped(dir: string, design: string, o: DiagramOptions): string {
  const tool = checked<DiagramTool>(o.tool, DIAGRAM_TOOLS, 'tool');
  const type = checked<DiagramType>(o.type, DIAGRAM_TYPES, 'type');
  if (tool === 'mermaid') {
    if (!o.mermaid) throw new Error('--tool mermaid needs --mermaid <file>');
    return stampDiagram(design, { type, tool, file: 'inline' }, readFileSync(o.mermaid, 'utf8'));
  }
  if (!o.file || !existsSync(join(dir, o.file))) throw new Error('--tool archify needs --file, an existing file in the spec folder');
  return stampDiagram(design, { type, tool, file: o.file });
}

/**
 * `mandao run diagram <spec>`: whether the approval diagram is required and still matches design.md;
 * with `--stamp`, records the diagram just generated from the current design (ADR 0022).
 */
export function registerDiagram(run: Command, ctx: CliContext) {
  run
    .command('diagram <spec>')
    .description('Approval diagram of design.md: required?, present, stale; --stamp records a new one')
    .option('--stamp', 'record the diagram generated from the current design.md')
    .option('--type <type>', DIAGRAM_TYPES.join(' | '))
    .option('--tool <tool>', DIAGRAM_TOOLS.join(' | '))
    .option('--file <path>', 'rendered diagram, relative to the spec folder (Archify)')
    .option('--mermaid <file>', 'Mermaid source to embed in design.md (fallback without Archify)')
    .action((ref: string, o: DiagramOptions) => {
      const dir = findSpec(ctx.root(), readConfig(ctx.root()), ref);
      const file = join(dir, 'design.md');
      if (!existsSync(file)) throw new Error(`${file} does not exist: specify writes it first`);
      let design = readFileSync(file, 'utf8');
      if (o.stamp) {
        design = stamped(dir, design, o);
        writeText(file, design);
      }
      json(diagramState(design));
    });
}
