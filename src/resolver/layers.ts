import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';
import { sha256 } from '../util/hash.js';
import { coreDir } from '../util/package-root.js';

export type LayerKind = 'core' | 'preset' | 'overrides';

/** A layer as plain data: relative POSIX path → file content. Keeps the resolver pure. */
export interface Layer {
  kind: LayerKind;
  id: string;
  files: Map<string, string>;
}

const CONTENT_DIRS = ['commands', 'personas', 'templates'];

function walk(dir: string, base: string, out: Map<string, string>) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else if (entry.isFile() && !entry.name.startsWith('.')) out.set(relative(base, full).split(sep).join('/'), readFileSync(full, 'utf8'));
  }
}

export function readLayer(kind: LayerKind, id: string, dir: string): Layer {
  const files = new Map<string, string>();
  for (const sub of CONTENT_DIRS) {
    const p = join(dir, sub);
    if (existsSync(p) && statSync(p).isDirectory()) walk(p, dir, files);
  }
  return { kind, id, files };
}

export function layerHash(layer: Layer): string {
  const entries = [...layer.files.entries()].sort(([a], [b]) => a.localeCompare(b));
  return sha256(entries.map(([p, c]) => `${p}\0${c}`).join('\0'));
}

/** Where a preset reference points: a bundled id (`core/presets/<id>`) or a path relative to the workspace. */
export function presetDir(ref: string, workspaceRoot: string): string {
  if (ref.startsWith('.') || isAbsolute(ref)) return isAbsolute(ref) ? ref : join(workspaceRoot, ref);
  return join(coreDir(), 'presets', ref);
}

export const overridesDir = (workspaceRoot: string) => join(workspaceRoot, '.mandao', 'overrides');

/** Loads layers lowest-precedence first: core, presets in declared order, overrides. */
export function loadLayers(workspaceRoot: string, presets: string[]): Layer[] {
  const layers = [readLayer('core', 'core', coreDir())];
  for (const ref of presets) {
    const dir = presetDir(ref, workspaceRoot);
    if (!existsSync(dir)) throw new Error(`Preset "${ref}" not found at ${dir}`);
    layers.push(readLayer('preset', ref, dir));
  }
  layers.push(readLayer('overrides', 'overrides', overridesDir(workspaceRoot)));
  return layers;
}
