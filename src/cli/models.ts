import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { parseDocument } from 'yaml';
import { MODELS_FILE, readConfig } from '../engine/files.js';
import { readRecommendations, resolveWorkspaceModels } from '../models/load.js';
import { independence, type ModelLayer, missingRoles, type ResolvedModels, usedModels } from '../models/resolve.js';
import { HARNESS_IDS, type HarnessId, MODEL_MODES, type ModelMode, ROLES, type RoleModels, TIERS, type Tier } from '../schemas/index.js';
import { c } from './output.js';

/** Parses `--set reviewer=sonnet --set implementer.strong=opus` into a flag layer. */
export function flagLayer(sets: string[] = []): ModelLayer {
  const models: RoleModels = {};
  for (const entry of sets) {
    const [key = '', value] = entry.split('=');
    if (!value) throw new Error(`Expected role=model, got "${entry}"`);
    const [role, tier] = key.split('.');
    if (!(ROLES as readonly string[]).includes(role ?? '')) throw new Error(`Unknown role "${role}". Roles: ${ROLES.join(', ')}`);
    if (role === 'implementer' && tier) {
      if (!(TIERS as readonly string[]).includes(tier)) throw new Error(`Unknown tier "${tier}"`);
      const current = typeof models.implementer === 'object' ? models.implementer : {};
      models.implementer = { ...current, [tier]: value };
    } else {
      (models as Record<string, string>)[role!] = value;
    }
  }
  return { source: 'flag', models };
}

/** Reads `models:` from a spec's story.md frontmatter, keyed by harness. */
export function specLayers(specDir: string | undefined): Partial<Record<HarnessId, ModelLayer>> {
  if (!specDir) return {};
  const file = join(specDir, 'story.md');
  if (!existsSync(file)) throw new Error(`No story.md in ${specDir}`);
  const models = (matter(readFileSync(file, 'utf8')).data.models ?? {}) as Partial<Record<HarnessId, RoleModels>>;
  return Object.fromEntries(Object.entries(models).map(([h, m]) => [h, { source: 'spec', models: m }]));
}

export interface ResolveCliOptions {
  project?: string;
  spec?: string;
  set?: string[];
  harness?: HarnessId;
}

export function resolveForCli(root: string, opts: ResolveCliOptions): ResolvedModels[] {
  const config = readConfig(root);
  const project = opts.project ? config.projects.find((p) => p.name === opts.project) : undefined;
  if (opts.project && !project) throw new Error(`Unknown project "${opts.project}"`);
  const spec = specLayers(opts.spec);
  const flags = flagLayer(opts.set);
  const recs = readRecommendations();
  const harnesses = opts.harness ? [opts.harness] : config.harnesses;
  return harnesses.map((h) => {
    const resolved = resolveWorkspaceModels(root, { ...config, harnesses: [h] }, recs, {
      project,
      extra: [...(spec[h] ? [spec[h]] : []), flags],
    });
    return resolved[h]!;
  });
}

export function printModels(all: ResolvedModels[]) {
  for (const m of all) {
    console.log(`  ${c.bold(m.harness)} ${c.dim(`(${m.mode})`)}`);
    for (const { role, choice } of usedModels(m)) console.log(`    ${role.padEnd(22)} ${choice.model} ${c.dim(choice.source)}`);
    for (const check of independence(m)) {
      if (check.reduced) console.log(`    ${c.yellow('reduced independence')} at ${check.tier}: ${check.implementer} reviews itself`);
      else if (check.reviewedBy !== check.reviewer)
        console.log(`    ${c.dim(`${check.tier} tasks are reviewed by reviewer_alt (${check.reviewedBy})`)}`);
    }
    const missing = missingRoles(m);
    if (missing.length) console.log(`    ${c.red('missing')} ${missing.join(', ')}`);
  }
}

function modelsFile(root: string, projectPath?: string) {
  return projectPath ? join(root, projectPath, '.mandao', 'models.yml') : join(root, MODELS_FILE);
}

/** Edits models.yml in place, keeping comments; creates it when missing. */
export function setModel(root: string, opts: { role: string; model: string; harness?: HarnessId; tier?: Tier; project?: string }) {
  if (!(ROLES as readonly string[]).includes(opts.role)) throw new Error(`Unknown role "${opts.role}". Roles: ${ROLES.join(', ')}`);
  if (opts.tier && opts.role !== 'implementer') throw new Error('--tier only applies to the implementer role');
  const config = readConfig(root);
  const harnesses = opts.harness ? [opts.harness] : config.harnesses;
  const project = opts.project ? config.projects.find((p) => p.name === opts.project) : undefined;
  if (opts.project && !project) throw new Error(`Unknown project "${opts.project}"`);
  const file = modelsFile(root, project?.path === '.' ? undefined : project?.path);
  const doc = parseDocument(existsSync(file) ? readFileSync(file, 'utf8') : 'schema_version: 1\nharnesses: {}\n');
  for (const h of harnesses) {
    const path = ['harnesses', h, opts.role, ...(opts.tier ? [opts.tier] : [])];
    // A string implementer cannot take a per-tier value: expand it first.
    if (opts.tier) {
      const current = doc.getIn(['harnesses', h, 'implementer']);
      if (typeof current === 'string') doc.setIn(['harnesses', h, 'implementer'], Object.fromEntries(TIERS.map((t) => [t, current])));
    }
    doc.setIn(path, opts.model);
  }
  writeFileSync(file, doc.toString({ lineWidth: 0 }));
}

export function setMode(root: string, mode: string) {
  if (!(MODEL_MODES as readonly string[]).includes(mode)) throw new Error(`Mode must be one of ${MODEL_MODES.join(', ')}`);
  const file = modelsFile(root);
  const doc = parseDocument(existsSync(file) ? readFileSync(file, 'utf8') : 'schema_version: 1\nharnesses: {}\n');
  doc.set('mode', mode as ModelMode);
  writeFileSync(file, doc.toString({ lineWidth: 0 }));
}

export const isHarness = (h: string): h is HarnessId => (HARNESS_IDS as readonly string[]).includes(h);
