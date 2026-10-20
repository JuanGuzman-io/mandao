import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import * as p from '@clack/prompts';
import { CONFIG_FILE, hasConfig, MODELS_FILE, SOURCES_FILE, writeYaml } from '../engine/files.js';
import { syncGlobal, syncProject } from '../engine/sync.js';
import { recommendedChoices } from '../models/defaults.js';
import { readRecommendations } from '../models/load.js';
import {
  type ConfigInput,
  configSchema,
  HARNESS_IDS,
  type HarnessId,
  MODEL_MODES,
  type ModelMode,
  type Models,
  PROFILES,
  type Profile,
  type Recommendations,
  type Role,
  type RoleModels,
  TIERS,
} from '../schemas/index.js';
import { type DetectedProject, type DetectedWorkspace, detectWorkspace } from '../workspace/detect.js';
import { createIfMissing } from '../writer/files.js';
import { c, harnessSetupNotes, printChanges, printWarnings } from './output.js';

export type PolyrepoStrategy = 'workspace-repo' | 'home' | 'local';

export interface InitOptions {
  scope?: 'project' | 'global';
  harness?: string[];
  profile?: Profile;
  defaultProfile?: Profile;
  languageBusiness?: string;
  languageTechnical?: string;
  modelsMode?: ModelMode;
  polyrepo?: PolyrepoStrategy;
  home?: string;
  yes?: boolean;
  force?: boolean;
}

const HARNESS_LABEL: Record<HarnessId, string> = { claude: 'Claude Code', copilot: 'GitHub Copilot', codex: 'Codex' };

function bail(value: unknown): asserts value is NonNullable<unknown> {
  if (p.isCancel(value)) {
    p.cancel('Cancelled.');
    process.exit(1);
  }
}

function parseHarnesses(list: string[]): HarnessId[] {
  const ids = list
    .flatMap((h) => h.split(','))
    .map((h) => h.trim())
    .filter(Boolean);
  const bad = ids.filter((h) => !(HARNESS_IDS as readonly string[]).includes(h));
  if (bad.length) throw new Error(`Unknown harness: ${bad.join(', ')}. Available: ${HARNESS_IDS.join(', ')}`);
  return ids as HarnessId[];
}

async function chooseHarnesses(opts: InitOptions): Promise<HarnessId[]> {
  if (opts.harness?.length) return parseHarnesses(opts.harness);
  if (opts.yes) return ['claude'];
  const picked = await p.multiselect({
    message: 'Which harnesses should Mandao generate commands for?',
    options: HARNESS_IDS.map((h) => ({ value: h, label: HARNESS_LABEL[h] })),
    initialValues: ['claude'],
    required: true,
  });
  bail(picked);
  return picked as HarnessId[];
}

async function chooseDefaultProfile(ws: DetectedWorkspace, opts: InitOptions): Promise<Profile> {
  if (opts.defaultProfile) return opts.defaultProfile;
  const detected = ws.projects.map((pr) => pr.profile).filter((x): x is Profile => Boolean(x));
  const common = PROFILES.map((v) => [v, detected.filter((d) => d === v).length] as const).sort((a, b) => b[1] - a[1])[0];
  const initial = common && common[1] > 0 ? common[0] : 'app';
  if (opts.yes) return initial;
  const picked = await p.select({
    message: 'Default profile for the workspace (projects can differ)',
    options: PROFILES.map((v) => ({ value: v, label: v })),
    initialValue: initial,
  });
  bail(picked);
  return picked as Profile;
}

async function confirmProjects(ws: DetectedWorkspace, defaultProfile: Profile, opts: InitOptions): Promise<DetectedProject[]> {
  const projects = ws.projects.map((pr) => ({ ...pr, profile: opts.profile ?? pr.profile ?? defaultProfile }));
  if (opts.yes) return projects;
  p.note(
    projects.map((pr) => `${pr.name.padEnd(20)} ${pr.path.padEnd(28)} ${pr.profile}`).join('\n'),
    `Detected ${ws.mode} workspace (${ws.reason})`,
  );
  const ok = await p.confirm({ message: 'Are these projects and profiles right?' });
  bail(ok);
  if (ok) return projects;
  const out: DetectedProject[] = [];
  for (const pr of projects) {
    const profile = await p.select({
      message: `Profile for ${pr.name} (${pr.path})`,
      options: PROFILES.map((v) => ({ value: v, label: v })),
      initialValue: pr.profile,
    });
    bail(profile);
    out.push({ ...pr, profile: profile as Profile });
  }
  p.log.info('Edit .mandao/config.yml later to add, remove or rename projects.');
  return out;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'other', label: 'Other…' },
];

async function chooseLanguage(kind: 'business' | 'technical', preset: string | undefined, yes: boolean | undefined): Promise<string> {
  if (preset) return preset;
  if (yes) return 'en';
  const hint =
    kind === 'business' ? 'story, release notes, questions to the PO, product context' : 'requirements, design, tasks, technical docs';
  const picked = await p.select({ message: `Language for ${kind} content (${hint})`, options: LANGUAGES, initialValue: 'en' });
  bail(picked);
  if (picked !== 'other') return picked as string;
  const typed = await p.text({
    message: 'Language (name or code)',
    validate: (v) => (v && v.trim().length >= 2 ? undefined : 'Too short'),
  });
  bail(typed);
  return (typed as string).trim();
}

/** Asks for each role's model, showing Mandao's recommendation with the option to type another. */
async function chooseMode(opts: InitOptions): Promise<ModelMode> {
  if (opts.modelsMode && !MODEL_MODES.includes(opts.modelsMode)) throw new Error(`--models-mode must be one of ${MODEL_MODES.join(', ')}`);
  if (opts.modelsMode || opts.yes) return opts.modelsMode ?? 'routed';
  const picked = await p.select({
    message: 'How should Mandao pick models?',
    options: [
      { value: 'routed', label: 'Routed', hint: 'the Implementer follows each task tier (fast, standard, strong)' },
      { value: 'simple', label: 'Simple', hint: 'one model to implement, another to review' },
    ],
    initialValue: 'routed',
  });
  bail(picked);
  return picked as ModelMode;
}

/** Role by role, the recommendation first and any other model allowed. Efforts follow the recommendation. */
async function askEveryRole(recommended: RoleModels, rec: NonNullable<Recommendations['harnesses'][HarnessId]>): Promise<RoleModels> {
  const chosen: RoleModels = {};
  for (const role of ['leader', 'reviewer', 'reviewer_alt', 'tester'] as const) {
    const value = recommended[role];
    if (value) chosen[role] = await askModel(role, value, rec);
  }
  const impl = recommended.implementer;
  if (typeof impl === 'string') chosen.implementer = await askModel('implementer', impl, rec);
  else if (impl) {
    const tiers: Record<string, string> = {};
    for (const tier of TIERS) tiers[tier] = await askModel(`implementer (${tier} tasks)`, impl[tier]!, rec);
    chosen.implementer = tiers;
  }
  if (recommended.effort) chosen.effort = recommended.effort;
  return chosen;
}

/** Asks for each role's model, showing Mandao's recommendation with the option to type another. */
async function chooseModels(harnesses: HarnessId[], opts: InitOptions): Promise<Models> {
  const recs = readRecommendations();
  const mode = await chooseMode(opts);
  const out: Models = { schema_version: 1, mode, harnesses: {} };
  for (const harness of harnesses) {
    const rec = recs.harnesses[harness];
    if (!rec) continue;
    const recommended = recommendedChoices(rec, mode);
    if (opts.yes) {
      out.harnesses[harness] = recommended;
      continue;
    }
    p.note(rolesTable(recommended), `Mandao recommends for ${HARNESS_LABEL[harness]} (reviewed ${rec.reviewed}, from the official docs)`);
    const accept = await p.confirm({ message: `Use these models for ${HARNESS_LABEL[harness]}?` });
    bail(accept);
    out.harnesses[harness] = accept ? recommended : await askEveryRole(recommended, rec);
  }
  return out;
}

function rolesTable(models: RoleModels): string {
  const effort = models.effort ?? {};
  const line = (role: string, model: string, e?: string) => `${role.padEnd(22)} ${model}${e ? ` (${e})` : ''}`;
  const rows: string[] = [];
  for (const role of ['leader', 'reviewer', 'reviewer_alt', 'tester'] as const) {
    const m = models[role];
    if (m) rows.push(line(role, m, effort[role]));
  }
  const impl = models.implementer;
  const implEffort = effort.implementer;
  for (const tier of TIERS) {
    const m = typeof impl === 'string' ? impl : impl?.[tier];
    const e = typeof implEffort === 'string' ? implEffort : implEffort?.[tier];
    if (m) rows.push(line(`implementer.${tier}`, m, e));
  }
  return rows.join('\n');
}

async function askModel(role: string, recommended: string, rec: NonNullable<Recommendations['harnesses'][HarnessId]>): Promise<string> {
  const baseRole = role.split(' ')[0] as Role;
  const others = rec.available.filter((m) => m !== recommended);
  const optional = rec.optional.filter((o) => o.roles.includes(baseRole) && o.model !== recommended);
  const picked = await p.select({
    message: `Model for ${role}`,
    options: [
      { value: recommended, label: recommended, hint: 'recommended' },
      ...others.map((m) => ({ value: m, label: m })),
      ...optional.map((o) => ({ value: o.model, label: o.model, hint: o.note })),
      { value: '__other', label: 'Other…' },
    ],
    initialValue: recommended,
  });
  bail(picked);
  if (picked !== '__other') return picked as string;
  const typed = await p.text({ message: `Model for ${role}`, validate: (v) => (v?.trim() ? undefined : 'Required') });
  bail(typed);
  return (typed as string).trim();
}

async function choosePolyrepoStrategy(ws: DetectedWorkspace, opts: InitOptions): Promise<{ strategy: PolyrepoStrategy; home: string }> {
  if (opts.polyrepo) {
    if (opts.polyrepo === 'home' && !opts.home) throw new Error('--polyrepo home needs --home <project path>');
    return { strategy: opts.polyrepo, home: opts.polyrepo === 'home' ? opts.home! : '.' };
  }
  if (opts.yes) return { strategy: 'workspace-repo', home: '.' };
  p.log.warn('The workspace root is not a git repository: specs and the workspace constitution written here would not be versioned.');
  const strategy = await p.select({
    message: 'Where should the canonical specs live?',
    options: [
      { value: 'workspace-repo', label: 'Make the root a workspace repository', hint: 'recommended; child repositories are git-ignored' },
      { value: 'home', label: 'Use one of the repositories as the home for specs' },
      { value: 'local', label: 'Keep them local only', hint: 'not versioned; doctor keeps warning' },
    ],
  });
  bail(strategy);
  if (strategy !== 'home') return { strategy: strategy as PolyrepoStrategy, home: '.' };
  const home = await p.select({ message: 'Home repository', options: ws.projects.map((pr) => ({ value: pr.path, label: pr.name })) });
  bail(home);
  return { strategy: 'home', home: home as string };
}

/** The child repositories are ignored through the managed block that `sync` writes into .gitignore. */
function initWorkspaceRepo(root: string) {
  execFileSync('git', ['init', '--quiet'], { cwd: root });
}

const OVERRIDES_README = `# Overrides

Files here win over presets and Mandao core. \`mandao update\` never touches this folder.

- Replace a whole command: \`commands/<id>.md\`
- Patch only its frontmatter: \`commands/<id>.patch.yml\` (objects merge, arrays replace, \`null\` deletes)
- Replace a template: \`templates/<shared|app|ai|data>/<name>\`
- Replace or patch a persona: \`personas/<id>.md\` or \`personas/<id>.patch.yml\`

Run \`mandao sync\` after editing.
`;

const SOURCES_TEMPLATE = {
  schema_version: 1,
  tracker: 'none',
  docs: [],
  meetings: [],
  chat: [],
  design: [],
};

export async function runInit(root: string, opts: InitOptions) {
  const interactive = !opts.yes;
  if (interactive) p.intro(c.bold('mandao init'));

  let scope = opts.scope;
  if (!scope) {
    if (opts.yes) scope = 'project';
    else {
      const picked = await p.select({
        message: 'Install scope',
        options: [
          { value: 'project', label: 'This workspace', hint: 'creates .mandao/ and the harness folders here' },
          { value: 'global', label: 'Global', hint: 'installs /mandao-init for your user, to set up any repo later' },
        ],
      });
      bail(picked);
      scope = picked as 'project' | 'global';
    }
  }

  const harnesses = await chooseHarnesses(opts);

  if (scope === 'global') {
    const result = syncGlobal(harnesses, { force: opts.force });
    printChanges(result.changes);
    const msg = 'Global install done. Open any repository in your agent and run /mandao-init.';
    interactive ? p.outro(msg) : console.log(msg);
    return;
  }

  if (hasConfig(root) && !opts.force) {
    throw new Error(`${CONFIG_FILE} already exists. Use \`mandao sync\`, \`mandao harness add\`, or \`mandao init --force\`.`);
  }

  const ws = detectWorkspace(root);
  const defaultProfile = await chooseDefaultProfile(ws, opts);
  const projects = await confirmProjects(ws, defaultProfile, opts);
  const business = await chooseLanguage('business', opts.languageBusiness, opts.yes);
  const technical = await chooseLanguage('technical', opts.languageTechnical, opts.yes);

  let home = '.';
  let localOnly: boolean | undefined;
  if (ws.mode === 'polyrepo' && !ws.rootIsRepo) {
    const choice = await choosePolyrepoStrategy(ws, opts);
    home = choice.home;
    if (choice.strategy === 'workspace-repo') initWorkspaceRepo(root);
    if (choice.strategy === 'local') localOnly = true;
  }

  const config: ConfigInput = {
    schema_version: 1,
    workspace: ws.mode,
    ...(home !== '.' ? { home } : {}),
    ...(localOnly ? { local_only: localOnly } : {}),
    default_profile: defaultProfile,
    language: { business, technical },
    projects: projects.map((pr) => ({
      name: pr.name,
      path: pr.path,
      ...(pr.profile !== defaultProfile ? { profile: pr.profile } : {}),
      ...(pr.repo ? { repo: pr.repo } : {}),
    })),
    harnesses,
  };
  const models = await chooseModels(harnesses, opts);
  const parsed = configSchema.safeParse(config);
  if (!parsed.success) throw new Error(`Generated config is invalid: ${parsed.error.message}`);

  writeYaml(join(root, CONFIG_FILE), config, '# Mandao configuration. Run `mandao sync` after editing. Schema: docs/schemas.md');
  if (!existsSync(join(root, MODELS_FILE))) {
    writeYaml(
      join(root, MODELS_FILE),
      models,
      '# Model per role and harness. Change with `mandao models set <role> <model>`; see `mandao models`.',
    );
  }
  if (!existsSync(join(root, SOURCES_FILE))) {
    writeYaml(join(root, SOURCES_FILE), SOURCES_TEMPLATE, '# Where business context lives: tracker, docs, chat, design, transcripts.');
  }
  const overrides = join(root, '.mandao', 'overrides');
  createIfMissing(join(overrides, 'README.md'), OVERRIDES_README);

  const result = syncProject(root, { force: opts.force });
  printChanges(result.changes);
  printWarnings(result.warnings);

  const next = [...harnessSetupNotes(harnesses), 'Next: open your agent here and run /mandao-constitution.'].join('\n');
  interactive ? p.outro(next) : console.log(next);
}
