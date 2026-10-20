import { parse as parseYaml } from 'yaml';
import type { z } from 'zod';
import { parseFrontmatter } from '../engine/frontmatter.js';
import {
  type CommandFrontmatter,
  commandFrontmatterSchema,
  formatIssues,
  type PersonaFrontmatter,
  personaFrontmatterSchema,
} from '../schemas/index.js';
import type { Layer, LayerKind } from './layers.js';

export interface Origin {
  kind: LayerKind;
  id: string;
  /** Layers that patched the frontmatter, lowest first. */
  patchedBy: string[];
}

export interface ResolvedCommand {
  meta: CommandFrontmatter;
  body: string;
  origin: Origin;
}

export interface ResolvedPersona {
  meta: PersonaFrontmatter;
  body: string;
  origin: Origin;
}

export interface ResolvedTemplate {
  /** `shared/requirements.md` or `ai/requirements.md`. */
  key: string;
  content: string;
  origin: Origin;
}

export interface Resolution {
  commands: ResolvedCommand[];
  personas: ResolvedPersona[];
  templates: ResolvedTemplate[];
}

export class ResolveError extends Error {
  constructor(readonly issues: string[]) {
    super(`Content failed validation:\n  ${issues.join('\n  ')}`);
  }
}

type Plain = Record<string, unknown>;
const isPlain = (v: unknown): v is Plain => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Objects merge recursively, everything else (arrays included) is replaced. `null` deletes a key. */
export function mergePatch(base: Plain, patch: Plain): Plain {
  const out: Plain = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete out[k];
    else if (isPlain(v) && isPlain(out[k])) out[k] = mergePatch(out[k] as Plain, v);
    else out[k] = v;
  }
  return out;
}

interface Entry<M> {
  meta: M;
  body: string;
  origin: Origin;
}

function resolveDocuments<S extends z.ZodType>(
  layers: Layer[],
  dir: 'commands' | 'personas',
  schema: S,
  issues: string[],
): Entry<z.infer<S>>[] {
  const base = new Map<string, { data: Plain; body: string; layerIndex: number; layer: Layer; file: string }>();
  layers.forEach((layer, layerIndex) => {
    for (const [path, content] of layer.files) {
      const m = path.match(new RegExp(`^${dir}/([^/]+)\\.md$`));
      if (!m?.[1]) continue;
      const parsed = parseFrontmatter(content);
      base.set(m[1], { data: structuredClone(parsed.data) as Plain, body: parsed.content, layerIndex, layer, file: `${layer.id}:${path}` });
    }
  });

  const out: Entry<z.infer<S>>[] = [];
  for (const [id, doc] of [...base.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    let data = doc.data;
    const patchedBy: string[] = [];
    // Patches only apply from layers above the one that provides the full document.
    layers.slice(doc.layerIndex + 1).forEach((layer) => {
      const patch = layer.files.get(`${dir}/${id}.patch.yml`);
      if (patch === undefined) return;
      const parsed = parseYaml(patch) as unknown;
      if (!isPlain(parsed)) {
        issues.push(`${layer.id}:${dir}/${id}.patch.yml: must be a YAML mapping`);
        return;
      }
      data = mergePatch(data, parsed);
      patchedBy.push(layer.id);
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      issues.push(...formatIssues(result.error, doc.file));
      continue;
    }
    const meta = result.data as { id: string };
    if (meta.id !== id) {
      issues.push(`${doc.file}: id "${meta.id}" does not match the file name "${id}"`);
      continue;
    }
    out.push({ meta: result.data, body: doc.body.replace(/^\n+/, ''), origin: { kind: doc.layer.kind, id: doc.layer.id, patchedBy } });
  }

  // Orphan patches point at documents that no layer provides.
  for (const layer of layers) {
    for (const path of layer.files.keys()) {
      const m = path.match(new RegExp(`^${dir}/([^/]+)\\.patch\\.yml$`));
      if (m?.[1] && !base.has(m[1])) issues.push(`${layer.id}:${path}: patches unknown ${dir.slice(0, -1)} "${m[1]}"`);
    }
  }
  return out;
}

function resolveTemplates(layers: Layer[]): ResolvedTemplate[] {
  const byKey = new Map<string, ResolvedTemplate>();
  for (const layer of layers) {
    for (const [path, content] of layer.files) {
      if (!path.startsWith('templates/')) continue;
      const key = path.slice('templates/'.length);
      byKey.set(key, { key, content, origin: { kind: layer.kind, id: layer.id, patchedBy: [] } });
    }
  }
  return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/** Resolves `overrides > presets > core`. `layers` must be ordered lowest precedence first. */
export function resolve(layers: Layer[]): Resolution {
  const issues: string[] = [];
  const commands = resolveDocuments(layers, 'commands', commandFrontmatterSchema, issues);
  const personas = resolveDocuments(layers, 'personas', personaFrontmatterSchema, issues);
  const templates = resolveTemplates(layers);

  const personaIds = new Set(personas.map((p) => p.meta.id));
  for (const p of personas) {
    if (p.meta.must_differ_from && !personaIds.has(p.meta.must_differ_from)) {
      issues.push(`persona "${p.meta.id}": must_differ_from references unknown persona "${p.meta.must_differ_from}"`);
    }
  }
  const commandIds = new Set(commands.map((c) => c.meta.id));
  for (const c of commands) {
    for (const ref of [...c.meta.flow.after, ...c.meta.flow.next]) {
      if (!commandIds.has(ref)) issues.push(`command "${c.meta.id}": flow references unknown command "${ref}"`);
    }
  }

  if (issues.length) throw new ResolveError(issues);
  return { commands, personas, templates };
}
