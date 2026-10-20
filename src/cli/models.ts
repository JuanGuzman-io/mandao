import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { MODELS_FILE, readConfig, readModels } from '../engine/files.js';
import { mergeChoices, profileChoices, userOverrides } from '../models/defaults.js';
import { readRecommendations, resolveWorkspaceModels } from '../models/load.js';
import { independence, type ModelLayer, missingRoles, type ResolvedModels, strongEqualsStandard, usedModels } from '../models/resolve.js';
import {
  HARNESS_IDS,
  type HarnessId,
  MODEL_MODES,
  MODEL_PROFILES,
  type ModelMode,
  type ModelProfile,
  ROLES,
  type RoleModels,
  TIERS,
  type Tier,
} from '../schemas/index.js';
import { editYaml } from '../writer/files.js';
import { c } from './output.js';

const EMPTY_MODELS = 'schema_version: 1\nharnesses: {}\n';

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

function printReview(m: ResolvedModels) {
  for (const check of independence(m)) {
    if (check.reduced) console.log(`    ${c.yellow('reduced independence')} at ${check.tier}: ${check.reason}`);
    else if (check.reviewerRole === 'reviewer_alt')
      console.log(`    ${c.dim(`${check.tier} tasks are reviewed by reviewer_alt (${check.reviewer.model})`)}`);
  }
  if (strongEqualsStandard(m))
    console.log(`    ${c.yellow('note')} implementer.strong equals standard (same model and effort): escalation does not change model`);
}

export function printModels(all: ResolvedModels[]) {
  for (const m of all) {
    console.log(`  ${c.bold(m.harness)} ${c.dim(`(${m.mode})`)}`);
    for (const { role, choice } of usedModels(m)) {
      console.log(`    ${role.padEnd(22)} ${choice.model}${choice.effort ? ` (${choice.effort})` : ''} ${c.dim(choice.source)}`);
    }
    printReview(m);
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
  editYaml(
    file,
    (doc) => {
      for (const h of harnesses) {
        const path = ['harnesses', h, opts.role, ...(opts.tier ? [opts.tier] : [])];
        // A string implementer cannot take a per-tier value: expand it first.
        if (opts.tier) {
          const current = doc.getIn(['harnesses', h, 'implementer']);
          if (typeof current === 'string') doc.setIn(['harnesses', h, 'implementer'], Object.fromEntries(TIERS.map((t) => [t, current])));
        }
        doc.setIn(path, opts.model);
      }
    },
    EMPTY_MODELS,
  );
}

export function setMode(root: string, mode: string) {
  if (!(MODEL_MODES as readonly string[]).includes(mode)) throw new Error(`Mode must be one of ${MODEL_MODES.join(', ')}`);
  const file = modelsFile(root);
  editYaml(file, (doc) => doc.set('mode', mode as ModelMode), EMPTY_MODELS);
}

export const isHarness = (h: string): h is HarnessId => (HARNESS_IDS as readonly string[]).includes(h);

/**
 * `mandao models profile <p>`: each active harness takes the profile's choices, with the roles the user
 * changed by hand kept on top. Only this explicit command (or init) changes the profile.
 */
export function setProfile(root: string, profile: string) {
  if (!(MODEL_PROFILES as readonly string[]).includes(profile)) throw new Error(`Profile must be one of ${MODEL_PROFILES.join(', ')}`);
  const config = readConfig(root);
  const recs = readRecommendations();
  const current = readModels(root);
  const mode = current.mode ?? 'routed';
  const previous = current.profile ?? 'peak';
  const kept: Partial<Record<HarnessId, RoleModels>> = {};
  editYaml(
    modelsFile(root),
    (doc) => {
      for (const h of config.harnesses) {
        const rec = recs.harnesses[h];
        if (!rec) continue;
        const mine = userOverrides(current.harnesses[h] ?? {}, profileChoices(rec, mode, previous));
        if (Object.keys(mine).length) kept[h] = mine;
        doc.setIn(['harnesses', h], mergeChoices(profileChoices(rec, mode, profile as ModelProfile), mine));
      }
      doc.set('profile', profile);
    },
    EMPTY_MODELS,
  );
  return { profile, previous, kept };
}

/** Every profile's choices per harness and role, for the init question and `mandao models profile`. */
export function profilesTable(harnesses: HarnessId[], mode: ModelMode): string {
  const recs = readRecommendations();
  const rows: string[] = [];
  for (const h of harnesses) {
    const rec = recs.harnesses[h];
    if (!rec) continue;
    for (const profile of MODEL_PROFILES) {
      const m = profileChoices(rec, mode, profile);
      const im = m.implementer;
      const impl = typeof im === 'string' || im === undefined ? (im ?? '—') : TIERS.map((t) => im[t] ?? '—').join(' / ');
      const why = profile === 'peak' ? 'the best model per role' : (rec.profiles?.[profile]?.why ?? 'same as peak for this harness');
      rows.push(`${h} · ${profile}: leader ${m.leader} · reviewer ${m.reviewer} · implementer ${impl} · tester ${m.tester}\n    ${why}`);
    }
  }
  return rows.join('\n');
}
